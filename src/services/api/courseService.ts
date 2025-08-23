import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { getCurrentTermCode } from '@/utils/dateUtils';
import { calculateGradeStatistics, calculateGradeDistributionFromReviews, getGPA } from '@/utils/gradeUtils';
import { extractInstructorNameForSorting } from '@/utils/textUtils';
import { courseStatsCache, CACHE_KEYS, CACHE_TTL } from '@/utils/cache';

export interface Course {
  $id: string;
  course_code: string;
  course_title: string;
  course_title_tc?: string;
  course_title_sc?: string;
  department: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CourseWithStats extends Course {
  reviewCount: number;
  averageRating: number;
  studentCount: number;
  isOfferedInCurrentTerm: boolean;
  averageWorkload: number;
  averageDifficulty: number;
  averageUsefulness: number;
  averageGPA: number;
  averageGPACount: number; // 新增：用於計算GPA的評論數量
  teachingLanguages?: string[]; // Teaching language codes from teaching records (chronological order)
  currentTermTeachingLanguage?: string | null; // Current term's teaching language
  serviceLearningTypes?: ('compulsory' | 'optional')[]; // Service learning types from teaching records
  currentTermServiceLearning?: ('compulsory' | 'optional') | null; // Current term's service learning type
}

export interface CourseWithDetailedStats extends Course {
  reviewCount: number;
  averageRating: number;
  studentCount: number;
  averageWorkload: number;
  averageDifficulty: number;
  averageUsefulness: number;
}

export interface Instructor {
  $id: string;
  name: string;
  name_tc?: string;
  name_sc?: string;
  title?: string;
  nickname?: string;
  email: string;
  department: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface InstructorWithStats extends Instructor {
  courseCount: number;
  reviewCount: number;
  averageRating: number;
}

export interface InstructorWithDetailedStats extends Instructor {
  reviewCount: number;
  teachingScore: number;
  gradingFairness: number;
  isTeachingInCurrentTerm?: boolean;
  averageGPA: number;
  averageGPACount: number; // 新增：用於計算GPA的評論數量
  teachingLanguages?: string[]; // Teaching language codes from teaching records (chronological order)
  currentTermTeachingLanguage?: string | null; // Current term's teaching language
}

export interface TeachingRecord {
  $id: string;
  course_code: string;
  term_code: string;
  instructor_name: string;
  session_type: string;
  service_learning: string | null; // null, 'compulsory', or 'optional'
  teaching_language: string; // Teaching language code: E, C, P, 1, 2, 3, 4, 5
  $createdAt: string;
  $updatedAt: string;
}

export interface Term {
  $id: string;
  term_code: string;
  name: string;
  start_date: string;
  end_date: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CourseTeachingInfo {
  term: Term;
  instructor: Instructor;
  sessionType: string;
  teachingLanguage: string; // Teaching language code from teaching records
}

export interface Review {
  $id: string;
  user_id: string;
  is_anon: boolean;
  username: string;
  course_code: string;
  term_code: string;
  course_workload: number;
  course_difficulties: number;
  course_usefulness: number;
  course_final_grade: string;
  course_comments: string;
  submitted_at: string;
  instructor_details: string; // JSON string
  review_language?: string; // Language of the review (en, zh-TW, zh-CN)
  $createdAt: string;
  $updatedAt: string;
}

export interface InstructorDetail {
  instructor_name: string;
  session_type: string;
  grading: number | null;
  teaching: number;
  has_midterm: boolean;
  has_final: boolean;
  has_quiz: boolean;
  has_group_project: boolean;
  has_individual_assignment: boolean;
  has_presentation: boolean;
  has_reading: boolean;
  has_attendance_requirement: boolean;
  comments: string;
  // Service learning fields for each instructor
  has_service_learning: boolean;
  service_learning_type: 'compulsory' | 'optional';
  service_learning_description: string;
}

export interface InstructorTeachingCourse {
  course: Course;
  term: Term;
  sessionType: string;
}

export interface InstructorReviewInfo {
  review: Review;
  course: Course;
  term: Term;
  instructorDetail: InstructorDetail;
}

export interface CourseReviewInfo {
  review: Review;
  term: Term;
  instructorDetails: InstructorDetail[];
}

export interface InstructorReviewFromDetails {
  review: Review;
  term: Term;
  course: Course;
  instructorDetails: InstructorDetail[];
}

export interface ReviewVote {
  $id: string;
  review_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  voted_at: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface ReviewWithVotes extends Review {
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
}

export class CourseService {
  private static readonly DATABASE_ID = 'lingubible';
  private static readonly COURSES_COLLECTION_ID = 'courses';
  private static readonly REVIEWS_COLLECTION_ID = 'reviews';
  private static readonly REVIEW_VOTES_COLLECTION_ID = 'review_votes';
  private static readonly TEACHING_RECORDS_COLLECTION_ID = 'teaching_records';
  private static readonly INSTRUCTORS_COLLECTION_ID = 'instructors';
  private static readonly TERMS_COLLECTION_ID = 'terms';

  // 性能優化常數
  private static readonly MAX_COURSES_LIMIT = 10000; // 移除限制，允許顯示所有課程
  private static readonly MAX_INSTRUCTORS_LIMIT = 10000; // 移除限制，允許顯示所有講師
  private static readonly MAX_REVIEWS_LIMIT = 1000; // 從 1500 減少到 1000
  private static readonly MAX_TEACHING_RECORDS_LIMIT = 500; // 從 800 減少到 500
  private static readonly MAX_SEARCH_RESULTS = 50; // 新增：搜尋結果限制

  // 簡單的記憶體緩存
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5分鐘緩存

  /**
   * 緩存輔助方法
   */
  private static getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private static setCached<T>(key: string, data: T, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 清除緩存
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * 🚀 OPTIMIZATION: 高效統計方法 - 只計算數量，不載入完整數據
   * 專為主頁統計設計，避免載入大量不必要的數據
   */
  
  // 快速計算有評論的課程數量（不載入完整課程數據）
  static async getCoursesWithReviewsCount(): Promise<number> {
    const cacheKey = 'coursesWithReviewsCount';
    const cached = this.getCached<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      // 獲取所有評論的課程代碼
      const reviews = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(2000),
          Query.select(['course_code'])
        ]
      );

      // 統計唯一課程數量
      const uniqueCourses = new Set(reviews.documents.map((review: any) => review.course_code));
      const count = uniqueCourses.size;

      this.setCached(cacheKey, count, 5 * 60 * 1000); // 5分鐘緩存
      return count;
    } catch (error) {
      console.error('Error getting courses with reviews count:', error);
      return 0;
    }
  }

  // 快速計算有評論的講師數量（不載入完整講師數據）
  static async getInstructorsWithReviewsCount(): Promise<number> {
    const cacheKey = 'instructorsWithReviewsCount';
    const cached = this.getCached<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      // 獲取所有評論的講師詳情
      const reviews = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(2000),
          Query.select(['instructor_details'])
        ]
      );

      // 統計唯一講師數量
      const uniqueInstructors = new Set<string>();
      reviews.documents.forEach((review: any) => {
        try {
          const instructorDetails = JSON.parse(review.instructor_details);
          instructorDetails.forEach((detail: any) => {
            uniqueInstructors.add(detail.instructor_name);
          });
        } catch (error) {
          // 忽略解析錯誤
        }
      });

      const count = uniqueInstructors.size;
      this.setCached(cacheKey, count, 5 * 60 * 1000); // 5分鐘緩存
      return count;
    } catch (error) {
      console.error('Error getting instructors with reviews count:', error);
      return 0;
    }
  }

  // 快速計算評論總數
  static async getReviewsCount(): Promise<number> {
    const cacheKey = 'reviewsCount';
    const cached = this.getCached<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.limit(1), // 只需要獲取總數，不需要實際文檔
          Query.select(['$id'])
        ]
      );

      const count = response.total;
      this.setCached(cacheKey, count, 2 * 60 * 1000); // 2分鐘緩存
      return count;
    } catch (error) {
      console.error('Error getting reviews count:', error);
      return 0;
    }
  }

  // 快速計算30天內的統計變化
  static async getRecentActivityStats(): Promise<{
    reviewsLast30Days: number;
    coursesWithReviewsLast30Days: number;
    instructorsWithReviewsLast30Days: number;
  }> {
    const cacheKey = 'recentActivityStats';
    const cached = this.getCached<{
      reviewsLast30Days: number;
      coursesWithReviewsLast30Days: number;
      instructorsWithReviewsLast30Days: number;
    }>(cacheKey);
    if (cached !== null) return cached;

    try {
      // 計算30天前的日期
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // 獲取過去30天的評論
      const recentReviews = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.greaterThan('$createdAt', thirtyDaysAgoISO),
          Query.orderDesc('$createdAt'),
          Query.limit(1000),
          Query.select(['course_code', 'instructor_details'])
        ]
      );

      const reviewsLast30Days = recentReviews.documents.length;

      // 計算30天內新增有評論的課程
      const coursesWithReviewsInLast30Days = new Set<string>();
      const instructorsWithReviewsInLast30Days = new Set<string>();

      recentReviews.documents.forEach((review: any) => {
        coursesWithReviewsInLast30Days.add(review.course_code);
        
        try {
          const instructorDetails = JSON.parse(review.instructor_details);
          instructorDetails.forEach((detail: any) => {
            instructorsWithReviewsInLast30Days.add(detail.instructor_name);
          });
        } catch (error) {
          // 忽略解析錯誤
        }
      });

      const result = {
        reviewsLast30Days,
        coursesWithReviewsLast30Days: coursesWithReviewsInLast30Days.size,
        instructorsWithReviewsLast30Days: instructorsWithReviewsInLast30Days.size
      };

      this.setCached(cacheKey, result, 5 * 60 * 1000); // 5分鐘緩存
      return result;
    } catch (error) {
      console.error('Error getting recent activity stats:', error);
      return {
        reviewsLast30Days: 0,
        coursesWithReviewsLast30Days: 0,
        instructorsWithReviewsLast30Days: 0
      };
    }
  }

  // 批量獲取主頁統計（最優化）
  static async getMainPageStatsOptimized(): Promise<{
    coursesWithReviewsCount: number;
    instructorsWithReviewsCount: number;
    instructorsCount: number;
    reviewsCount: number;
    reviewsLast30Days: number;
    coursesWithReviewsLast30Days: number;
    instructorsWithReviewsLast30Days: number;
  }> {
    try {
      // 並行執行所有統計查詢
      const [
        coursesWithReviewsCount,
        instructorsWithReviewsCount,
        instructorsCount,
        reviewsCount,
        recentActivityStats
      ] = await Promise.all([
        this.getCoursesWithReviewsCount(),
        this.getInstructorsWithReviewsCount(),
        this.getAllInstructors().then(instructors => instructors.length),
        this.getReviewsCount(),
        this.getRecentActivityStats()
      ]);

      return {
        coursesWithReviewsCount,
        instructorsWithReviewsCount,
        instructorsCount,
        reviewsCount,
        ...recentActivityStats
      };
    } catch (error) {
      console.error('Error getting optimized main page stats:', error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZATION: 批量獲取收藏課程數據（避免個別API調用）
   * 專為收藏頁面設計，一次性獲取所有收藏課程的完整信息
   */
  static async getBatchFavoriteCoursesData(courseCodes: string[]): Promise<Map<string, {
    course: Course;
    stats: {
      reviewCount: number;
      averageRating: number;
      studentCount: number;
      averageWorkload: number;
      averageDifficulty: number;
      averageUsefulness: number;
      averageGPA: number;
    };
    teachingLanguages: string[];
    currentTermTeachingLanguage: string | null;
    serviceLearningTypes: ('compulsory' | 'optional')[];
    currentTermServiceLearning: ('compulsory' | 'optional') | null;
    isOfferedInCurrentTerm: boolean;
  }>> {
    if (courseCodes.length === 0) {
      return new Map();
    }

    try {
      // 並行獲取所有需要的數據
      const [
        courses,
        statsMap,
        teachingLanguagesMap,
        currentTermLanguagesMap,
        serviceLearningTypesMap,
        currentTermServiceLearningMap,
        currentTermOfferedCourses
      ] = await Promise.all([
        // 獲取所有課程基本信息
        databases.listDocuments(
          this.DATABASE_ID,
          this.COURSES_COLLECTION_ID,
          [
            Query.equal('course_code', courseCodes),
            Query.limit(courseCodes.length),
            Query.select(['$id', 'course_code', 'course_title', 'course_title_tc', 'course_title_sc', 'department'])
          ]
        ),
        // 獲取所有課程統計
        this.getBatchCourseDetailedStats(courseCodes),
        // 獲取教學語言
        this.getBatchCourseTeachingLanguages(courseCodes),
        // 獲取當前學期教學語言
        this.getBatchCourseCurrentTermTeachingLanguages(courseCodes),
        // 獲取服務學習類型
        this.getBatchCourseServiceLearning(courseCodes),
        // 獲取當前學期服務學習
        this.getBatchCourseCurrentTermServiceLearning(courseCodes),
        // 獲取當前學期開設狀態
        this.getCoursesOfferedInTermBatch(getCurrentTermCode(), courseCodes)
      ]);

      const result = new Map();
      const coursesArray = courses.documents as unknown as Course[];

      coursesArray.forEach(course => {
        const stats = statsMap.get(course.course_code) || {
          reviewCount: 0,
          averageRating: 0,
          studentCount: 0,
          averageWorkload: -1,
          averageDifficulty: -1,
          averageUsefulness: -1,
          averageGPA: 0,
          averageGPACount: 0
        };

        result.set(course.course_code, {
          course,
          stats,
          teachingLanguages: teachingLanguagesMap.get(course.course_code) || [],
          currentTermTeachingLanguage: currentTermLanguagesMap.get(course.course_code) || null,
          serviceLearningTypes: serviceLearningTypesMap.get(course.course_code) || [],
          currentTermServiceLearning: currentTermServiceLearningMap.get(course.course_code) || null,
          // 🐛 FIX: Convert course code to lowercase for case-insensitive comparison
          isOfferedInCurrentTerm: currentTermOfferedCourses.has(course.course_code.toLowerCase())
        });
      });

      return result;
    } catch (error) {
      console.error('Error getting batch favorite courses data:', error);
      return new Map();
    }
  }

  /**
   * 🚀 OPTIMIZATION: 批量獲取收藏講師數據（避免個別API調用）
   * 專為收藏頁面設計，一次性獲取所有收藏講師的完整信息
   */
  static async getBatchFavoriteInstructorsData(instructorNames: string[]): Promise<Map<string, {
    instructor: Instructor;
    stats: {
      reviewCount: number;
      teachingScore: number;
      gradingFairness: number;
      averageGPA: number;
    };
    teachingLanguages: string[];
    currentTermTeachingLanguage: string | null;
    isTeachingInCurrentTerm: boolean;
  }>> {
    if (instructorNames.length === 0) {
      return new Map();
    }

    try {
      // 並行獲取所有需要的數據
      const [
        instructors,
        statsMap,
        instructorsWithGPA,
        teachingLanguagesMap,
        currentTermLanguagesMap,
        currentTermTeachingInstructors
      ] = await Promise.all([
        // 獲取所有講師基本信息
        databases.listDocuments(
          this.DATABASE_ID,
          this.INSTRUCTORS_COLLECTION_ID,
          [
            Query.equal('name', instructorNames),
            Query.limit(instructorNames.length),
            Query.select(['$id', 'name', 'name_tc', 'name_sc', 'title', 'nickname', 'email', 'department'])
          ]
        ),
        // 獲取講師詳細統計
        this.getBatchInstructorDetailedStats(instructorNames),
        // 獲取包含GPA的講師統計
        this.getAllInstructorsWithDetailedStats().then(allInstructors => 
          new Map(allInstructors.map(inst => [inst.name, inst.averageGPA]))
        ),
        // 獲取教學語言
        this.getBatchInstructorTeachingLanguages(instructorNames),
        // 獲取當前學期教學語言
        this.getBatchInstructorCurrentTermTeachingLanguages(instructorNames),
        // 獲取當前學期教學狀態
        this.getInstructorsTeachingInTermBatch(getCurrentTermCode(), instructorNames)
      ]);

      const result = new Map();
      const instructorsArray = instructors.documents as unknown as Instructor[];

      instructorsArray.forEach(instructor => {
        const stats = statsMap.get(instructor.name) || {
          reviewCount: 0,
          teachingScore: 0,
          gradingFairness: 0
        };

        result.set(instructor.name, {
          instructor,
          stats: {
            ...stats,
            averageGPA: instructorsWithGPA.get(instructor.name) || 0
          },
          teachingLanguages: teachingLanguagesMap.get(instructor.name) || [],
          currentTermTeachingLanguage: currentTermLanguagesMap.get(instructor.name) || null,
          isTeachingInCurrentTerm: currentTermTeachingInstructors.has(instructor.name)
        });
      });

      return result;
    } catch (error) {
      console.error('Error getting batch favorite instructors data:', error);
      return new Map();
    }
  }

  /**
   * 獲取所有課程，按課程代碼排序（優化版本）
   * 使用更精確的限制和欄位選擇，基於 Appwrite 官方性能建議
   */
  static async getAllCourses(): Promise<Course[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.COURSES_COLLECTION_ID,
        [
          Query.orderAsc('course_code'),
          Query.limit(this.MAX_COURSES_LIMIT),
          Query.select(['$id', 'course_code', 'course_title', 'course_title_tc', 'course_title_sc', 'department', '$createdAt', '$updatedAt'])
        ]
      );
      
      return response.documents as unknown as Course[];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  /**
   * 搜尋課程（優化版本）
   * 使用更精確的查詢和限制，移除回退邏輯以避免載入所有數據
   */
  static async searchCoursesByTitle(searchTerm: string): Promise<Course[]> {
    try {
      if (!searchTerm.trim()) {
        return [];
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.COURSES_COLLECTION_ID,
        [
          Query.search('course_title', searchTerm),
          Query.limit(this.MAX_SEARCH_RESULTS), // 使用常數限制搜尋結果
          Query.select(['$id', 'course_code', 'course_title', 'course_title_tc', 'course_title_sc', 'department']) // 只選擇搜尋需要的欄位
        ]
      );

      return response.documents as unknown as Course[];
    } catch (error) {
      console.error('Error searching courses:', error);
      // 移除回退邏輯，避免載入所有數據（Appwrite 官方建議）
      return [];
    }
  }

  /**
   * 獲取課程統計信息（優化版本）
   * 使用更精確的查詢限制和欄位選擇，減少數據傳輸量
   */
  static async getCourseStats(courseCode: string): Promise<{
    reviewCount: number;
    averageRating: number;
    studentCount: number;
  }> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.limit(500), // 減少限制，大多數課程不會有超過500個評論
          Query.select(['user_id', 'course_usefulness']) // 只選擇計算統計需要的欄位
        ]
      );

      const reviews = response.documents;
      const reviewCount = reviews.length;
      
      if (reviewCount === 0) {
        return {
          reviewCount: 0,
          averageRating: 0,
          studentCount: 0
        };
      }

      // 計算平均評分（基於 course_usefulness）
      const totalRating = reviews.reduce((sum, review) => sum + (review.course_usefulness || 0), 0);
      const averageRating = totalRating / reviewCount;

      // 計算學生數（去重用戶）
      const uniqueUsers = new Set(reviews.map(review => review.user_id));
      const studentCount = uniqueUsers.size;

      return {
        reviewCount,
        averageRating,
        studentCount
      };
    } catch (error) {
      console.error('Error fetching course stats:', error);
      return {
        reviewCount: 0,
        averageRating: 0,
        studentCount: 0
      };
    }
  }

  /**
   * 獲取課程詳細統計信息（工作量、難度、實用性）
   */
  static async getCourseDetailedStats(courseCode: string): Promise<{
    reviewCount: number;
    averageRating: number;
    studentCount: number;
    averageWorkload: number;
    averageDifficulty: number;
    averageUsefulness: number;
    averageGPA: number;
  }> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.limit(500),
          Query.select(['user_id', 'course_workload', 'course_difficulties', 'course_usefulness', 'course_final_grade'])
        ]
      );

      const reviews = response.documents as unknown as Review[];
      const reviewCount = reviews.length;
      
      if (reviewCount === 0) {
        return {
          reviewCount: 0,
          averageRating: 0,
          studentCount: 0,
          averageWorkload: -1,
          averageDifficulty: -1,
          averageUsefulness: -1,
          averageGPA: 0,
          averageGPACount: 0
        };
      }

      // 計算各項平均值，排除 N/A 值 (-1)
      const validWorkloadReviews = reviews.filter(review => review.course_workload > 0);
      const validDifficultyReviews = reviews.filter(review => review.course_difficulties > 0);
      const validUsefulnessReviews = reviews.filter(review => review.course_usefulness > 0);

      const totalWorkload = validWorkloadReviews.reduce((sum, review) => sum + review.course_workload, 0);
      const totalDifficulty = validDifficultyReviews.reduce((sum, review) => sum + review.course_difficulties, 0);
      const totalUsefulness = validUsefulnessReviews.reduce((sum, review) => sum + review.course_usefulness, 0);

      const averageWorkload = validWorkloadReviews.length > 0 ? totalWorkload / validWorkloadReviews.length : -1;
      const averageDifficulty = validDifficultyReviews.length > 0 ? totalDifficulty / validDifficultyReviews.length : -1;
      const averageUsefulness = validUsefulnessReviews.length > 0 ? totalUsefulness / validUsefulnessReviews.length : -1;

      // 計算學生數（去重用戶）
      const uniqueUsers = new Set(reviews.map(review => review.user_id));
      const studentCount = uniqueUsers.size;

      // 計算平均 GPA
      const gradeDistribution = calculateGradeDistributionFromReviews(reviews);
      const gradeStats = calculateGradeStatistics(gradeDistribution);
      const averageGPA = gradeStats.mean || 0;
      const averageGPACount = gradeStats.validGradeCount || 0;

      return {
        reviewCount,
        averageRating: averageUsefulness > 0 ? averageUsefulness : 0, // 使用實用性作為總體評分，但避免負數
        studentCount,
        averageWorkload,
        averageDifficulty,
        averageUsefulness,
        averageGPA,
        averageGPACount
      };
    } catch (error) {
      console.error('Error fetching course detailed stats:', error);
      return {
        reviewCount: 0,
        averageRating: 0,
        studentCount: 0,
        averageWorkload: -1,
        averageDifficulty: -1,
        averageUsefulness: -1,
        averageGPA: 0,
        averageGPACount: 0
      };
    }
  }

  /**
   * 獲取帶統計信息的課程列表
   */
  static async getCoursesWithStats(): Promise<CourseWithStats[]> {
    try {
      console.log('🚀 getCoursesWithStats: Starting to load courses with complete data');
      
      const courses = await this.getAllCourses();
      const currentTermCode = getCurrentTermCode();
      const courseCodes = courses.map(course => course.course_code);
      
      console.log(`📚 Loaded ${courses.length} courses, fetching additional data...`);
      
      // 並行獲取所有必要的數據
      const [
        statsMap,
        teachingLanguagesMap,
        currentTermLanguagesMap,
        serviceLearningTypesMap,
        currentTermServiceLearningMap,
        currentTermOfferedCourses
      ] = await Promise.all([
        // 獲取統計數據的Map
        this.getBatchCourseDetailedStats(courseCodes),
        // 獲取教學語言數據
        this.getBatchCourseTeachingLanguages(courseCodes),
        this.getBatchCourseCurrentTermTeachingLanguages(courseCodes),
        // 獲取服務學習數據  
        this.getBatchCourseServiceLearning(courseCodes),
        this.getBatchCourseCurrentTermServiceLearning(courseCodes),
        // 獲取當前學期開設狀態
        this.getCoursesOfferedInTermBatch(currentTermCode, courseCodes)
      ]);

      console.log('✅ All batch data loaded successfully');
      console.log(`📊 Teaching languages map size: ${teachingLanguagesMap.size}`);
      
      // 組合所有數據
      const coursesWithStats = courses.map(course => {
        const stats = statsMap.get(course.course_code) || {
          reviewCount: 0,
          averageRating: 0,
          studentCount: 0,
          averageWorkload: -1,
          averageDifficulty: -1,
          averageUsefulness: -1,
          averageGPA: 0,
          averageGPACount: 0
        };
        
        const teachingLanguages = teachingLanguagesMap.get(course.course_code) || [];
        const currentTermTeachingLanguage = currentTermLanguagesMap.get(course.course_code) || null;
        const serviceLearningTypes = serviceLearningTypesMap.get(course.course_code) || [];
        const currentTermServiceLearning = currentTermServiceLearningMap.get(course.course_code) || null;
        const isOfferedInCurrentTerm = currentTermOfferedCourses.has(course.course_code);
        
        return {
          ...course,
          ...stats,
          teachingLanguages,
          currentTermTeachingLanguage,
          serviceLearningTypes,
          currentTermServiceLearning,
          isOfferedInCurrentTerm
        };
      });

      console.log('🎉 getCoursesWithStats: Completed successfully');
      console.log(`📝 Sample course with teaching languages:`, coursesWithStats.find(c => 
        c.teachingLanguages && c.teachingLanguages.length > 0
      )?.course_code || 'none found');

      return coursesWithStats;
    } catch (error) {
      console.error('Error fetching courses with stats:', error);
      throw new Error('Failed to fetch courses with statistics');
    }
  }

  /**
   * 根據課程代碼獲取單個課程
   */
  static async getCourseByCode(courseCode: string): Promise<Course | null> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.COURSES_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.limit(1)
        ]
      );

      return response.documents.length > 0 ? response.documents[0] as unknown as Course : null;
    } catch (error) {
      console.error('Error fetching course by code:', error);
      return null;
    }
  }

  /**
   * 獲取課程的教學記錄
   */
  static async getCourseTeachingRecords(courseCode: string): Promise<TeachingRecord[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.limit(100)
        ]
      );

      return response.documents as unknown as TeachingRecord[];
    } catch (error) {
      console.error('Error fetching teaching records:', error);
      throw new Error('Failed to fetch teaching records');
    }
  }

  /**
   * 檢查課程是否在指定學期開設
   */
  static async isCourseOfferedInTerm(courseCode: string, termCode: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.equal('term_code', termCode),
          Query.limit(1)
        ]
      );

      return response.documents.length > 0;
    } catch (error) {
      console.error('Error checking course offering:', error);
      return false;
    }
  }

  /**
   * 獲取所有講師，按姓名排序（優化版本）
   * 使用精確的欄位選擇
   */
  static async getAllInstructors(): Promise<Instructor[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.INSTRUCTORS_COLLECTION_ID,
        [
          Query.orderAsc('name'),
          Query.limit(this.MAX_INSTRUCTORS_LIMIT),
          Query.select(['$id', 'name', 'name_tc', 'name_sc', 'email', 'department', '$createdAt', '$updatedAt']) // 包含中文名稱
        ]
      );

      return response.documents as unknown as Instructor[];
    } catch (error) {
      console.error('Error fetching instructors:', error);
      throw new Error('Failed to fetch instructors');
    }
  }

  /**
   * 獲取講師統計信息（進一步優化版本）
   * 減少查詢範圍和優化欄位選擇
   */
  static async getInstructorStatsOptimized(instructorName: string): Promise<{
    courseCount: number;
    reviewCount: number;
    averageRating: number;
  }> {
    try {
      // 並行獲取教學記錄和評論，使用更精確的查詢
      const [teachingRecords, reviewsResponse] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.TEACHING_RECORDS_COLLECTION_ID,
          [
            Query.equal('instructor_name', instructorName),
            Query.limit(50), // 從 100 減少到 50，大多數講師不會教超過50門課程
            Query.select(['course_code']) // 只需要課程代碼來計算數量
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.REVIEWS_COLLECTION_ID,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(300), // 從 500 減少到 300，提高查詢速度
            Query.select(['instructor_details']) // 只需要講師詳情來過濾
          ]
        )
      ]);

      // 計算課程數（去重）
      const uniqueCourses = new Set(
        (teachingRecords.documents as unknown as TeachingRecord[])
          .map(record => record.course_code)
      );
      const courseCount = uniqueCourses.size;

      // 過濾包含該講師的評論並計算統計
      const allReviews = reviewsResponse.documents as unknown as Review[];
      const instructorReviews = allReviews.filter(review => {
        try {
          const instructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
          return instructorDetails.some(detail => detail.instructor_name === instructorName);
        } catch (error) {
          return false;
        }
      });

      const reviewCount = instructorReviews.length;
      let averageRating = 0;

      if (reviewCount > 0) {
        const totalRating = instructorReviews.reduce((sum, review) => {
          try {
            const instructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
            const instructorDetail = instructorDetails.find(detail => detail.instructor_name === instructorName);
            return sum + (instructorDetail?.teaching || 0);
          } catch (error) {
            return sum;
          }
        }, 0);
        averageRating = totalRating / reviewCount;
      }

      return {
        courseCount,
        reviewCount,
        averageRating
      };
    } catch (error) {
      console.error('Error fetching instructor stats:', error);
      return {
        courseCount: 0,
        reviewCount: 0,
        averageRating: 0
      };
    }
  }

  /**
   * 獲取帶統計信息的講師列表
   */
  static async getInstructorsWithStats(): Promise<InstructorWithStats[]> {
    try {
      const instructors = await this.getAllInstructors();
      
      // 並行獲取所有講師的統計信息
      const instructorsWithStats = await Promise.all(
        instructors.map(async (instructor) => {
          const stats = await this.getInstructorStatsOptimized(instructor.name);
          return {
            ...instructor,
            ...stats
          };
        })
      );

      // 按評分和評論數排序
      instructorsWithStats.sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.reviewCount - a.reviewCount;
      });

      return instructorsWithStats;
    } catch (error) {
      console.error('Error fetching instructors with stats:', error);
      throw new Error('Failed to fetch instructors with statistics');
    }
  }

  /**
   * 根據講師姓名獲取講師信息
   */
  static async getInstructorByName(name: string): Promise<Instructor | null> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.INSTRUCTORS_COLLECTION_ID,
        [
          Query.equal('name', name),
          Query.limit(1),
          Query.select(['$id', 'name', 'name_tc', 'name_sc', 'title', 'nickname', 'email', 'department', '$createdAt', '$updatedAt'])
        ]
      );

      return response.documents.length > 0 ? response.documents[0] as unknown as Instructor : null;
    } catch (error) {
      console.error('Error fetching instructor by name:', error);
      return null;
    }
  }

  /**
   * 根據學期代碼獲取學期信息
   */
  static async getTermByCode(termCode: string): Promise<Term | null> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TERMS_COLLECTION_ID,
        [
          Query.equal('term_code', termCode),
          Query.limit(1)
        ]
      );

      return response.documents.length > 0 ? response.documents[0] as unknown as Term : null;
    } catch (error) {
      console.error('Error fetching term by code:', error);
      return null;
    }
  }

  /**
   * 獲取課程的完整教學信息（包含講師和學期詳情）
   */
  static async getCourseTeachingInfo(courseCode: string): Promise<CourseTeachingInfo[]> {
    try {
      const teachingRecords = await this.getCourseTeachingRecords(courseCode);
      
      // 為空白或無效的講師名稱創建一個預設的講師物件
      const unknownInstructor: Instructor = {
        $id: 'unknown-instructor',
        name: 'UNKNOWN',
        name_tc: '未知教師',
        name_sc: '未知教师',
        title: '',
        nickname: '',
        email: '',
        department: '',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString()
      };

      // 並行獲取所有相關的講師和學期信息
      const teachingInfo = await Promise.all(
        teachingRecords.map(async (record) => {
          // 處理講師：如果講師名稱空白或無效，使用預設的未知講師
          let instructor: Instructor | null;
          if (!record.instructor_name || record.instructor_name.trim() === '') {
            instructor = unknownInstructor;
          } else {
            instructor = await this.getInstructorByName(record.instructor_name);
          }
          
          const term = await this.getTermByCode(record.term_code);

          // 如果找不到學期，跳過此記錄
          if (!instructor || !term) {
            return null;
          }

          return {
            term,
            instructor,
            sessionType: record.session_type,
            teachingLanguage: record.teaching_language
          };
        })
      );

      // 過濾掉 null 值並返回
      return teachingInfo.filter((info): info is NonNullable<typeof info> => info !== null);
    } catch (error) {
      console.error('Error fetching course teaching info:', error);
      throw new Error('Failed to fetch course teaching information');
    }
  }

  /**
   * 根據講師姓名獲取其教學記錄
   */
  static async getInstructorTeachingRecords(instructorName: string): Promise<TeachingRecord[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('instructor_name', instructorName),
          Query.limit(100)
        ]
      );

      return response.documents as unknown as TeachingRecord[];
    } catch (error) {
      console.error('Error fetching instructor teaching records:', error);
      throw new Error('Failed to fetch instructor teaching records');
    }
  }

  /**
   * 獲取講師教授的所有課程（包含課程和學期信息）
   */
  static async getInstructorTeachingCourses(instructorName: string): Promise<InstructorTeachingCourse[]> {
    try {
      const teachingRecords = await this.getInstructorTeachingRecords(instructorName);
      
      // 批量獲取所有需要的課程和學期信息，避免重複調用
      const uniqueCourseCodes = [...new Set(teachingRecords.map(record => record.course_code))];
      const uniqueTermCodes = [...new Set(teachingRecords.map(record => record.term_code))];
      
      // 並行獲取所有課程和學期信息
      const [coursesMap, termsMap] = await Promise.all([
        Promise.all(uniqueCourseCodes.map(async (courseCode) => {
          const course = await this.getCourseByCode(courseCode);
          return [courseCode, course] as const;
        })).then(results => new Map(results)),
        Promise.all(uniqueTermCodes.map(async (termCode) => {
          const term = await this.getTermByCode(termCode);
          return [termCode, term] as const;
        })).then(results => new Map(results))
      ]);

      // 處理教學記錄，使用緩存的課程和學期數據
      const teachingCourses = teachingRecords.map((record) => {
        const course = coursesMap.get(record.course_code);
        const term = termsMap.get(record.term_code);

        if (!course || !term) {
          return null;
        }

        return {
          course,
          term,
          sessionType: record.session_type
        };
      });

      // 過濾掉 null 值並返回
      return teachingCourses.filter((info): info is NonNullable<typeof info> => info !== null);
    } catch (error) {
      console.error('Error fetching instructor teaching courses:', error);
      throw new Error('Failed to fetch instructor teaching courses');
    }
  }

  /**
   * 創建新的評論
   */
  static async createReview(reviewData: Omit<Review, '$id' | '$createdAt' | '$updatedAt'>): Promise<Review> {
    try {
      // Check if user can submit a review for this course
      const eligibilityCheck = await this.canUserSubmitReview(reviewData.user_id, reviewData.course_code, reviewData.term_code);
      
      if (!eligibilityCheck.canSubmit) {
        let errorMessage = 'You have reached the review limit for this course.';
        
        switch (eligibilityCheck.reason) {
          case 'review.termLimitExceeded':
            errorMessage = 'You have already submitted the maximum number of reviews (7) for this term. Students can only register for a maximum of 7 courses per term.';
            break;
          case 'review.limitExceeded':
            errorMessage = 'You have already submitted the maximum number of reviews (2) for this course.';
            break;
          case 'review.limitReachedWithPass':
            errorMessage = 'You have already submitted a review for this course. Additional reviews are only allowed if your first review had a fail grade.';
            break;
          default:
            errorMessage = 'Unable to submit review due to submission limits.';
        }
        
        throw new Error(errorMessage);
      }

      const response = await databases.createDocument(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        'unique()', // 讓 Appwrite 自動生成 ID
        reviewData
      );

      return response as unknown as Review;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error; // Re-throw to preserve the specific error message
    }
  }

  /**
   * 獲取所有學期
   */
  static async getAllTerms(): Promise<Term[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TERMS_COLLECTION_ID,
        [
          Query.orderDesc('term_code'),
          Query.limit(100)
        ]
      );

      return response.documents as unknown as Term[];
    } catch (error) {
      console.error('Error fetching terms:', error);
      throw new Error('Failed to fetch terms');
    }
  }

  /**
   * 獲取特定課程的所有評論（優化版本）
   * 增加評論限制並添加欄位選擇以提高性能
   */
  static async getCourseReviews(courseCode: string, language?: string): Promise<CourseReviewInfo[]> {
    try {
      const queries = [
        Query.equal('course_code', courseCode),
        Query.orderDesc('$createdAt'),
        Query.limit(300), // 從 100 增加到 300，但添加欄位限制
        Query.select(['$id', 'user_id', 'is_anon', 'username', 'course_code', 'term_code', 
                     'course_workload', 'course_difficulties', 'course_usefulness', 
                     'course_final_grade', 'course_comments', 'submitted_at', 'instructor_details', 'review_language', '$createdAt'])
      ];
      
      // Add language filter if specified
      if (language) {
        queries.push(Query.equal('review_language', language));
      }
      
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        queries
      );

      const reviews = response.documents as unknown as Review[];
      
      // 並行獲取學期信息
      const reviewsWithInfo = await Promise.all(
        reviews.map(async (review) => {
          const term = await this.getTermByCode(review.term_code);
          
          if (!term) {
            return null;
          }

          // 解析講師詳情
          let instructorDetails: InstructorDetail[] = [];
          try {
            instructorDetails = JSON.parse(review.instructor_details);
          } catch (error) {
            console.error('Error parsing instructor_details:', error);
          }

          return {
            review,
            term,
            instructorDetails
          };
        })
      );

      // 過濾掉 null 值並返回
      return reviewsWithInfo.filter((info): info is NonNullable<typeof info> => info !== null);
    } catch (error) {
      console.error('Error fetching course reviews:', error);
      throw new Error('Failed to fetch course reviews');
    }
  }

  /**
   * 獲取特定講師的所有評論（從 instructor_details 中搜尋）（優化版本）
   * 減少查詢範圍並添加欄位選擇以提高性能
   */
  static async getInstructorReviewsFromDetails(instructorName: string, language?: string): Promise<InstructorReviewFromDetails[]> {
    try {
      // 獲取所有評論，使用優化的限制和欄位選擇
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(this.MAX_REVIEWS_LIMIT), // 使用常數限制
        Query.select(['$id', 'user_id', 'is_anon', 'username', 'course_code', 'term_code',
                     'course_workload', 'course_difficulties', 'course_usefulness',
                     'course_final_grade', 'course_comments', 'instructor_details', 'review_language', 'submitted_at', '$createdAt'])
      ];
      
      // Add language filter if specified
      if (language) {
        queries.push(Query.equal('review_language', language));
      }
      
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        queries
      );

      const allReviews = response.documents as unknown as Review[];
      
      // 過濾包含該講師的評論
      const instructorReviews = allReviews.filter(review => {
        try {
          const instructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
          return instructorDetails.some(detail => detail.instructor_name === instructorName);
        } catch (error) {
          console.error('Error parsing instructor_details:', error);
          return false;
        }
      });

      // 並行獲取學期和課程信息
      const reviewsWithInfo = await Promise.all(
        instructorReviews.map(async (review) => {
          const [term, course] = await Promise.all([
            this.getTermByCode(review.term_code),
            this.getCourseByCode(review.course_code)
          ]);
          
          // Handle missing courses by creating a fallback course object
          let finalCourse = course;
          if (!course) {
            console.warn(`CourseService: Creating fallback course for missing course_code: "${review.course_code}" for instructor "${instructorName}"`);
            
            // Create fallback course object
            finalCourse = {
              $id: `fallback_${review.course_code}`,
              course_code: review.course_code,
              course_title: review.course_code, // Use course code as title
              course_title_zh: review.course_code, // Use course code as Chinese title
              department: 'Unknown', // Default department
              department_zh: '未知', // Default Chinese department
              credits: 3, // Default credits
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString()
            } as Course;
          }

          // Handle missing terms by creating a fallback term object
          let finalTerm = term;
          if (!term) {
            console.warn(`CourseService: Creating fallback term for missing term_code: "${review.term_code}" for instructor "${instructorName}"`);
            
            // Parse term information
            let termName = review.term_code;
            let startDate = new Date().toISOString();
            let endDate = new Date().toISOString();
            
            // Handle different term code formats
            const yearOnOrBeforeMatch = review.term_code.match(/^(\d{4})_on_or_before$/);
            if (yearOnOrBeforeMatch) {
              const year = yearOnOrBeforeMatch[1];
              termName = review.term_code; // Keep original term_code for proper translation
              startDate = new Date(`${year}-01-01`).toISOString();
              endDate = new Date(`${year}-12-31`).toISOString();
            } else if (review.term_code === 'historical') {
              termName = '歷史學期';
              startDate = new Date('2020-01-01').toISOString();
              endDate = new Date('2020-12-31').toISOString();
            } else {
              // Handle simple year format (e.g., "2017")
              const yearOnlyMatch = review.term_code.match(/^(\d{4})$/);
              if (yearOnlyMatch) {
                const year = parseInt(yearOnlyMatch[1]);
                termName = review.term_code; // Keep original term_code for proper translation
                startDate = new Date(year, 0, 1).toISOString(); // January 1st
                endDate = new Date(year, 11, 31).toISOString(); // December 31st
              } else {
                // Handle YYYY-T# format (e.g., "2017-T1", "2017-T2")
                const termCodeMatch = review.term_code.match(/^(\d{4})-T([12])$/);
                if (termCodeMatch) {
                  const startYear = parseInt(termCodeMatch[1]);
                  const termNumber = termCodeMatch[2];
                  termName = review.term_code; // Keep original term_code for proper translation
                  if (termNumber === '1') {
                    startDate = new Date(startYear, 8, 1).toISOString(); // September 1st
                    endDate = new Date(startYear + 1, 0, 31).toISOString(); // January 31st next year
                  } else {
                    startDate = new Date(startYear, 1, 1).toISOString(); // February 1st
                    endDate = new Date(startYear, 5, 30).toISOString(); // June 30th
                  }
                } else {
                  // Try to parse standard term format (e.g., "2023S1", "2024S2")
                  const termMatch = review.term_code.match(/^(\d{4})S([12])$/);
                  if (termMatch) {
                    const year = termMatch[1];
                    const semester = termMatch[2];
                    termName = `${year}年第${semester}學期`;
                    const startYear = parseInt(year);
                    if (semester === '1') {
                      startDate = new Date(startYear, 8, 1).toISOString(); // September 1st
                      endDate = new Date(startYear + 1, 0, 31).toISOString(); // January 31st next year
                    } else {
                      startDate = new Date(startYear, 1, 1).toISOString(); // February 1st
                      endDate = new Date(startYear, 5, 30).toISOString(); // June 30th
                    }
                  } else {
                    // Keep original term_code for unrecognized formats
                    termName = review.term_code; // This will be handled by getTermName() function
                  }
                }
              }
            }
            
            // Create fallback term object
            finalTerm = {
              $id: `fallback_${review.term_code}`,
              term_code: review.term_code,
              name: termName,
              start_date: startDate,
              end_date: endDate,
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString()
            } as Term;
            
          }

          // 解析講師詳情 - 保留所有講師的資料以便顯示展開按鈕
          let instructorDetails: InstructorDetail[] = [];
          try {
            instructorDetails = JSON.parse(review.instructor_details);
          } catch (error) {
            console.error('Error parsing instructor_details:', error);
          }

          return {
            review,
            term: finalTerm,
            course: finalCourse,
            instructorDetails
          };
        })
      );

      // 過濾掉 null 值並返回
      return reviewsWithInfo.filter((info): info is NonNullable<typeof info> => info !== null);
    } catch (error) {
      console.error('Error fetching instructor reviews from details:', error);
      console.error('Environment info:', {
        endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
        projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
        instructorName,
        language
      });
      
      // 提供更詳細的錯誤信息
      if (error instanceof Error) {
        throw new Error(`Failed to fetch instructor reviews: ${error.message}`);
      }
      throw new Error('Failed to fetch instructor reviews');
    }
  }

  /**
   * 獲取評論的投票統計（優化版本）
   * 添加欄位選擇以減少數據傳輸量
   */
  static async getReviewVoteStats(reviewId: string): Promise<{ upvotes: number; downvotes: number }> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal('review_id', reviewId),
          Query.limit(1000),
          Query.select(['vote_type']) // 只選擇投票類型欄位
        ]
      );

      const votes = response.documents as unknown as ReviewVote[];
      const upvotes = votes.filter(vote => vote.vote_type === 'up').length;
      const downvotes = votes.filter(vote => vote.vote_type === 'down').length;

      return { upvotes, downvotes };
    } catch (error) {
      console.error('Error fetching review vote stats:', error);
      return { upvotes: 0, downvotes: 0 };
    }
  }

  /**
   * 獲取用戶對特定評論的投票（優化版本）
   * 添加欄位選擇以減少數據傳輸量
   */
  static async getUserVoteForReview(reviewId: string, userId: string): Promise<'up' | 'down' | null> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal('review_id', reviewId),
          Query.equal('user_id', userId),
          Query.limit(1),
          Query.select(['vote_type']) // 只選擇投票類型欄位
        ]
      );

      if (response.documents.length > 0) {
        const vote = response.documents[0] as unknown as ReviewVote;
        return vote.vote_type;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user vote:', error);
      return null;
    }
  }

  /**
   * 投票或更新投票
   */
  static async voteOnReview(reviewId: string, userId: string, voteType: 'up' | 'down'): Promise<void> {
    try {
      // 檢查用戶是否已經投票
      const existingVoteResponse = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal('review_id', reviewId),
          Query.equal('user_id', userId),
          Query.limit(1)
        ]
      );

      if (existingVoteResponse.documents.length > 0) {
        // 更新現有投票
        const existingVote = existingVoteResponse.documents[0] as unknown as ReviewVote;
        if (existingVote.vote_type !== voteType) {
          await databases.updateDocument(
            this.DATABASE_ID,
            this.REVIEW_VOTES_COLLECTION_ID,
            existingVote.$id,
            {
              vote_type: voteType,
              voted_at: new Date().toISOString()
            }
          );
        }
      } else {
        // 創建新投票
        await databases.createDocument(
          this.DATABASE_ID,
          this.REVIEW_VOTES_COLLECTION_ID,
          'unique()',
          {
            review_id: reviewId,
            user_id: userId,
            vote_type: voteType,
            voted_at: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('Error voting on review:', error);
      throw new Error('Failed to vote on review');
    }
  }

  /**
   * 移除投票
   */
  static async removeVoteFromReview(reviewId: string, userId: string): Promise<void> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal('review_id', reviewId),
          Query.equal('user_id', userId),
          Query.limit(1)
        ]
      );

      if (response.documents.length > 0) {
        const vote = response.documents[0] as unknown as ReviewVote;
        await databases.deleteDocument(
          this.DATABASE_ID,
          this.REVIEW_VOTES_COLLECTION_ID,
          vote.$id
        );
      }
    } catch (error) {
      console.error('Error removing vote:', error);
      throw new Error('Failed to remove vote');
    }
  }

  /**
   * 批量獲取多個評論的投票統計信息（進一步優化版本）
   * 添加欄位選擇以減少數據傳輸量
   */
  static async getBatchReviewVoteStats(reviewIds: string[]): Promise<Map<string, { upvotes: number; downvotes: number }>> {
    try {
      if (reviewIds.length === 0) {
        return new Map();
      }

      // 一次性獲取所有相關的投票記錄，只選擇必要欄位
      const votesResponse = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal('review_id', reviewIds),
          Query.limit(5000), // 增加限制以獲取更多投票記錄
          Query.select(['review_id', 'vote_type']) // 只選擇必要的欄位
        ]
      );

      const votes = votesResponse.documents as unknown as ReviewVote[];
      
      // 按評論ID分組統計投票
      const voteStatsMap = new Map<string, { upvotes: number; downvotes: number }>();
      
      // 初始化所有評論的統計為0
      reviewIds.forEach(reviewId => {
        voteStatsMap.set(reviewId, { upvotes: 0, downvotes: 0 });
      });
      
      // 統計投票
      votes.forEach(vote => {
        const stats = voteStatsMap.get(vote.review_id);
        if (stats) {
          if (vote.vote_type === 'up') {
            stats.upvotes++;
          } else if (vote.vote_type === 'down') {
            stats.downvotes++;
          }
        }
      });

      return voteStatsMap;
    } catch (error) {
      console.error('Error fetching batch review vote stats:', error);
      // 返回空統計而不是拋出錯誤
      const emptyStatsMap = new Map<string, { upvotes: number; downvotes: number }>();
      reviewIds.forEach(reviewId => {
        emptyStatsMap.set(reviewId, { upvotes: 0, downvotes: 0 });
      });
      return emptyStatsMap;
    }
  }

  /**
   * 批量獲取用戶對多個評論的投票狀態（進一步優化版本）
   * 添加欄位選擇以減少數據傳輸量
   */
  static async getBatchUserVotesForReviews(reviewIds: string[], userId: string): Promise<Map<string, 'up' | 'down' | null>> {
    try {
      if (reviewIds.length === 0 || !userId) {
        const emptyVotesMap = new Map<string, 'up' | 'down' | null>();
        reviewIds.forEach(reviewId => {
          emptyVotesMap.set(reviewId, null);
        });
        return emptyVotesMap;
      }

      // 一次性獲取用戶對所有評論的投票記錄，只選擇必要欄位
      const userVotesResponse = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal('review_id', reviewIds),
          Query.equal('user_id', userId),
          Query.limit(1000),
          Query.select(['review_id', 'vote_type']) // 只選擇必要的欄位
        ]
      );

      const userVotes = userVotesResponse.documents as unknown as ReviewVote[];
      
      // 創建投票狀態映射
      const userVotesMap = new Map<string, 'up' | 'down' | null>();
      
      // 初始化所有評論的用戶投票為null
      reviewIds.forEach(reviewId => {
        userVotesMap.set(reviewId, null);
      });
      
      // 設置用戶的實際投票
      userVotes.forEach(vote => {
        userVotesMap.set(vote.review_id, vote.vote_type);
      });

      return userVotesMap;
    } catch (error) {
      console.error('Error fetching batch user votes:', error);
      // 返回空投票而不是拋出錯誤
      const emptyVotesMap = new Map<string, 'up' | 'down' | null>();
      reviewIds.forEach(reviewId => {
        emptyVotesMap.set(reviewId, null);
      });
      return emptyVotesMap;
    }
  }

  /**
   * 獲取用戶的所有評論（帶投票信息）（優化版本）
   * 添加欄位選擇以減少數據傳輸量
   */
  static async getUserReviews(userId: string): Promise<(CourseReviewInfo & { upvotes: number; downvotes: number })[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(1000),
          Query.select(['$id', 'user_id', 'is_anon', 'username', 'course_code', 'term_code',
                       'course_workload', 'course_difficulties', 'course_usefulness',
                       'course_final_grade', 'course_comments', 'instructor_details',
                       'review_language', 'submitted_at', '$createdAt']) // 只選擇必要的欄位
        ]
      );

      const reviews = response.documents as unknown as Review[];

      // 並行獲取每個評論的相關信息和投票統計
      const reviewsWithInfo = await Promise.all(
        reviews.map(async (review) => {
          try {
            const [term, voteStats] = await Promise.all([
              this.getTermByCode(review.term_code),
              this.getReviewVoteStats(review.$id)
            ]);

            if (!term) {
              return null;
            }

            let instructorDetails: InstructorDetail[] = [];
            try {
              instructorDetails = JSON.parse(review.instructor_details);
            } catch (error) {
              console.error('Error parsing instructor details:', error);
            }

            return {
              review,
              term,
              instructorDetails,
              upvotes: voteStats.upvotes,
              downvotes: voteStats.downvotes
            };
          } catch (error) {
            console.error('Error processing review:', error);
            return null;
          }
        })
      );

      return reviewsWithInfo.filter((info): info is NonNullable<typeof info> => info !== null);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw new Error('Failed to fetch user reviews');
    }
  }

  /**
   * 刪除評論
   */
  static async deleteReview(reviewId: string): Promise<void> {
    try {
      // 首先刪除相關的投票記錄，只選擇 ID 欄位
      const votesResponse = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal('review_id', reviewId),
          Query.limit(1000),
          Query.select(['$id']) // 只需要 ID 來刪除記錄
        ]
      );

      // 並行刪除所有投票記錄
      await Promise.all(
        votesResponse.documents.map(vote =>
          databases.deleteDocument(
            this.DATABASE_ID,
            this.REVIEW_VOTES_COLLECTION_ID,
            vote.$id
          )
        )
      );

      // 然後刪除評論本身
      await databases.deleteDocument(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        reviewId
      );
    } catch (error) {
      console.error('Error deleting review:', error);
      throw new Error('Failed to delete review');
    }
  }

  /**
   * 更新評論
   */
  static async updateReview(reviewId: string, reviewData: Partial<Omit<Review, '$id' | '$createdAt' | '$updatedAt' | 'user_id'>>): Promise<Review> {
    try {
      const response = await databases.updateDocument(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        reviewId,
        reviewData
      );

      return response as unknown as Review;
    } catch (error) {
      console.error('Error updating review:', error);
      throw new Error('Failed to update review');
    }
  }

  /**
   * 根據ID獲取評論
   */
  static async getReviewById(reviewId: string): Promise<Review | null> {
    try {
      const response = await databases.getDocument(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        reviewId
      );

      return response as unknown as Review;
    } catch (error) {
      console.error('Error fetching review by ID:', error);
      return null;
    }
  }

  /**
   * 獲取熱門課程（按評分和評論數排序，限制數量）
   */
  static async getPopularCourses(limit: number = 6): Promise<CourseWithStats[]> {
    try {
      const cacheKey = `popular_courses_${limit}`;
      
      // 檢查緩存
      const cached = this.getCached<CourseWithStats[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const coursesWithStats = await this.getCoursesWithStatsBatch();
      
      // 按評論數排序，優先考慮有評論的課程
      const sortedCourses = coursesWithStats
        .filter(course => course.reviewCount > 0) // 只顯示有評論的課程
        .sort((a, b) => {
          // 首先按評論數排序
          if (b.reviewCount !== a.reviewCount) {
            return b.reviewCount - a.reviewCount;
          }
          // 評論數相同時按評分排序
          return b.averageRating - a.averageRating;
        })
        .slice(0, limit); // 限制數量

      // 緩存結果（較短的緩存時間，因為熱門課程可能變化較快）
      this.setCached(cacheKey, sortedCourses, 2 * 60 * 1000); // 2分鐘緩存
      
      return sortedCourses;
    } catch (error) {
      console.error('Error fetching popular courses:', error);
      throw new Error('Failed to fetch popular courses');
    }
  }

  /**
   * 獲取熱門講師（原版本，保持兼容性）
   */
  static async getPopularInstructors(limit: number = 6): Promise<InstructorWithStats[]> {
    try {
      const instructorsWithStats = await this.getInstructorsWithStatsBatch();
      
      // 按評分和評論數排序，優先考慮有評論的講師
      const sortedInstructors = instructorsWithStats
        .filter(instructor => instructor.reviewCount > 0) // 只顯示有評論的講師
        .sort((a, b) => {
          // 首先按評分排序
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          // 評分相同時按評論數排序
          return b.reviewCount - a.reviewCount;
        })
        .slice(0, limit); // 限制數量

      return sortedInstructors;
    } catch (error) {
      console.error('Error fetching popular instructors:', error);
      throw new Error('Failed to fetch popular instructors');
    }
  }

  /**
   * 獲取熱門講師的詳細統計信息（教學評分和評分滿意度性）
   */
  static async getPopularInstructorsWithDetailedStats(limit: number = 6): Promise<InstructorWithDetailedStats[]> {
    try {
      const currentTermCode = getCurrentTermCode();
      
      // 並行獲取講師、評論和教學記錄數據
      const [instructorsResponse, reviewsResponse, teachingRecordsResponse] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.INSTRUCTORS_COLLECTION_ID,
          [
            Query.orderAsc('name'),
            Query.limit(this.MAX_INSTRUCTORS_LIMIT),
            Query.select(['$id', 'name', 'name_tc', 'name_sc', 'title', 'email', 'department', '$createdAt', '$updatedAt'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.REVIEWS_COLLECTION_ID,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(this.MAX_REVIEWS_LIMIT),
            Query.select(['instructor_details', 'course_final_grade'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.TEACHING_RECORDS_COLLECTION_ID,
          [
            Query.equal('term_code', currentTermCode),
            Query.limit(this.MAX_TEACHING_RECORDS_LIMIT),
            Query.select(['instructor_name'])
          ]
        )
      ]);

      const instructors = instructorsResponse.documents as unknown as Instructor[];
      const allReviews = reviewsResponse.documents as unknown as Review[];
      const currentTermTeachingRecords = teachingRecordsResponse.documents as unknown as TeachingRecord[];
      
      // 創建當前學期教學的講師集合
      const currentTermInstructors = new Set(currentTermTeachingRecords.map(record => record.instructor_name));

      // 創建講師統計映射
      const instructorStatsMap = new Map<string, {
        reviewCount: number;
        teachingScores: number[];
        gradingScores: number[];
        grades: string[];
      }>();

      // 處理每個評論中的講師詳情
      for (const review of allReviews) {
        try {
          const instructorDetails = JSON.parse(review.instructor_details) as InstructorDetail[];
          
          for (const detail of instructorDetails) {
            const instructorName = detail.instructor_name;
            
            if (!instructorStatsMap.has(instructorName)) {
              instructorStatsMap.set(instructorName, {
                reviewCount: 0,
                teachingScores: [],
                gradingScores: [],
                grades: []
              });
            }
            
            const stats = instructorStatsMap.get(instructorName)!;
            stats.reviewCount++;
            
            // 收集有效評分 (> 0)，排除 N/A (-1) 和未評分 (0)
            if (detail.teaching > 0) {
              stats.teachingScores.push(detail.teaching);
            }
            if (detail.grading && detail.grading > 0) {
              stats.gradingScores.push(detail.grading);
            }
            
            // 收集成績用於 GPA 計算
            if (review.course_final_grade) {
              stats.grades.push(review.course_final_grade);
            }
          }
        } catch (error) {
          // 跳過無效的 JSON 數據
          continue;
        }
      }

      // 計算最終統計信息
      const finalInstructorStatsMap = new Map<string, {
        reviewCount: number;
        teachingScore: number;
        gradingFairness: number;
        averageGPA: number;
      }>();
      
      for (const [instructorName, stats] of instructorStatsMap) {
        const teachingScore = stats.teachingScores.length > 0 
          ? stats.teachingScores.reduce((sum, score) => sum + score, 0) / stats.teachingScores.length 
          : 0;
        const gradingFairness = stats.gradingScores.length > 0 
          ? stats.gradingScores.reduce((sum, score) => sum + score, 0) / stats.gradingScores.length 
          : 0;
          
        // 計算平均 GPA
        const gradeDistribution = calculateGradeDistributionFromReviews(
          stats.grades.map(grade => ({ course_final_grade: grade }))
        );
        const gradeStats = calculateGradeStatistics(gradeDistribution);
        const averageGPA = gradeStats.mean || 0;
        const averageGPACount = gradeStats.validGradeCount || 0;
          
        finalInstructorStatsMap.set(instructorName, {
          reviewCount: stats.reviewCount,
          teachingScore,
          gradingFairness,
          averageGPA,
          averageGPACount
        });
      }

      // 組合講師和統計信息
      const instructorsWithDetailedStats: InstructorWithDetailedStats[] = instructors
        .map(instructor => {
          const stats = finalInstructorStatsMap.get(instructor.name) || {
            reviewCount: 0,
            teachingScore: 0,
            gradingFairness: 0,
            averageGPA: 0,
            averageGPACount: 0
          };

          return {
            ...instructor,
            ...stats,
            isTeachingInCurrentTerm: currentTermInstructors.has(instructor.name)
          };
        })
        .filter(instructor => instructor.reviewCount > 0) // 只顯示有評論的講師
        .sort((a, b) => {
          // 首先按教學評分排序
          if (b.teachingScore !== a.teachingScore) {
            return b.teachingScore - a.teachingScore;
          }
          // 教學評分相同時按評論數排序
          return b.reviewCount - a.reviewCount;
        });

      // 獲取教學語言數據（帶錯誤處理的優雅降級）
      const instructorNames = instructorsWithDetailedStats.map(instructor => instructor.name);
      let teachingLanguagesMap = new Map<string, string[]>();
      let currentTermTeachingLanguagesMap = new Map<string, string | null>();

      try {
        // 嘗試獲取教學語言數據，但如果失敗則繼續正常流程
        const [languagesResult, currentTermResult] = await Promise.allSettled([
          this.getBatchInstructorTeachingLanguages(instructorNames),
          this.getBatchInstructorCurrentTermTeachingLanguages(instructorNames)
        ]);

        if (languagesResult.status === 'fulfilled') {
          teachingLanguagesMap = languagesResult.value;
        } else {
          console.warn('Failed to fetch instructor teaching languages, continuing without language badges:', languagesResult.reason);
        }

        if (currentTermResult.status === 'fulfilled') {
          currentTermTeachingLanguagesMap = currentTermResult.value;
        } else {
          console.warn('Failed to fetch current term teaching languages, continuing without current term language:', currentTermResult.reason);
        }
      } catch (error) {
        console.warn('Error fetching teaching language data for popular instructors, continuing without language badges:', error);
      }

      // 添加教學語言數據到結果中並限制數量
      const finalInstructorsWithDetailedStats = instructorsWithDetailedStats.map(instructor => ({
        ...instructor,
        teachingLanguages: teachingLanguagesMap.get(instructor.name) || [],
        currentTermTeachingLanguage: currentTermTeachingLanguagesMap.get(instructor.name) || null
      })).slice(0, limit); // 限制數量

      return finalInstructorsWithDetailedStats;
    } catch (error) {
      console.error('Error fetching popular instructors with detailed stats:', error);
      throw new Error('Failed to fetch popular instructors with detailed statistics');
    }
  }

  /**
   * 獲取所有講師的詳細統計信息（用於講師列表頁面）
   */
  static async getAllInstructorsWithDetailedStats(): Promise<InstructorWithDetailedStats[]> {
    try {
      const currentTermCode = getCurrentTermCode();
      const cacheKey = `all_instructors_detailed_stats_${currentTermCode}`;
      
      // 檢查緩存
      const cached = this.getCached<InstructorWithDetailedStats[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // 並行獲取講師、評論和當前學期教學記錄數據
      const [instructorsResponse, reviewsResponse, teachingRecordsResponse] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.INSTRUCTORS_COLLECTION_ID,
          [
            Query.orderAsc('name'),
            Query.limit(this.MAX_INSTRUCTORS_LIMIT),
            Query.select(['$id', 'name', 'name_tc', 'name_sc', 'title', 'nickname', 'email', 'department', '$createdAt', '$updatedAt'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.REVIEWS_COLLECTION_ID,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(this.MAX_REVIEWS_LIMIT),
            Query.select(['instructor_details', 'course_final_grade'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.TEACHING_RECORDS_COLLECTION_ID,
          [
            Query.equal('term_code', currentTermCode),
            Query.limit(this.MAX_TEACHING_RECORDS_LIMIT),
            Query.select(['instructor_name'])
          ]
        )
      ]);

      const instructors = instructorsResponse.documents as unknown as Instructor[];
      const allReviews = reviewsResponse.documents as unknown as Review[];
      const currentTermTeachingRecords = teachingRecordsResponse.documents as unknown as Pick<TeachingRecord, 'instructor_name'>[];

      // 創建當前學期教學講師的 Set
      const instructorsTeachingInCurrentTerm = new Set(
        currentTermTeachingRecords.map(record => record.instructor_name)
      );

      // 創建講師統計映射
      const instructorStatsMap = new Map<string, {
        reviewCount: number;
        teachingScores: number[];
        gradingScores: number[];
        grades: string[];
      }>();

      // 處理每個評論中的講師詳情
      for (const review of allReviews) {
        try {
          const instructorDetails = JSON.parse(review.instructor_details) as InstructorDetail[];
          
          for (const detail of instructorDetails) {
            const instructorName = detail.instructor_name;
            
            if (!instructorStatsMap.has(instructorName)) {
              instructorStatsMap.set(instructorName, {
                reviewCount: 0,
                teachingScores: [],
                gradingScores: [],
                grades: []
              });
            }
            
            const stats = instructorStatsMap.get(instructorName)!;
            stats.reviewCount++;
            
            // 收集有效評分 (> 0)，排除 N/A (-1) 和未評分 (0)
            if (detail.teaching > 0) {
              stats.teachingScores.push(detail.teaching);
            }
            if (detail.grading && detail.grading > 0) {
              stats.gradingScores.push(detail.grading);
            }
            
            // 收集成績用於 GPA 計算
            if (review.course_final_grade) {
              stats.grades.push(review.course_final_grade);
            }
          }
        } catch (error) {
          // 跳過無效的 JSON 數據
          continue;
        }
      }

      // 計算平均值，排除 N/A 值
      const finalInstructorStatsMap = new Map<string, {
        reviewCount: number;
        teachingScore: number;
        gradingFairness: number;
        averageGPA: number;
      }>();
      
      for (const [instructorName, stats] of instructorStatsMap) {
        const teachingScore = stats.teachingScores.length > 0 
          ? stats.teachingScores.reduce((sum, score) => sum + score, 0) / stats.teachingScores.length 
          : 0;
        const gradingFairness = stats.gradingScores.length > 0 
          ? stats.gradingScores.reduce((sum, score) => sum + score, 0) / stats.gradingScores.length 
          : 0;
          
        // 計算平均 GPA
        const gradeDistribution = calculateGradeDistributionFromReviews(
          stats.grades.map(grade => ({ course_final_grade: grade }))
        );
        const gradeStats = calculateGradeStatistics(gradeDistribution);
        const averageGPA = gradeStats.mean || 0;
        const averageGPACount = gradeStats.validGradeCount || 0;
          
        finalInstructorStatsMap.set(instructorName, {
          reviewCount: stats.reviewCount,
          teachingScore,
          gradingFairness,
          averageGPA,
          averageGPACount
        });
      }

      // 組合講師和統計信息 - 包含所有講師，不過濾
      const instructorsWithDetailedStats: InstructorWithDetailedStats[] = instructors
        .map(instructor => {
          const stats = finalInstructorStatsMap.get(instructor.name) || {
            reviewCount: 0,
            teachingScore: 0,
            gradingFairness: 0,
            averageGPA: 0,
            averageGPACount: 0
          };

          return {
            ...instructor,
            ...stats,
            isTeachingInCurrentTerm: instructorsTeachingInCurrentTerm.has(instructor.name)
          };
        });

      // 獲取所有講師的教學語言數據（帶錯誤處理的優雅降級）
      const instructorNames = instructors.map(instructor => instructor.name);
      let teachingLanguagesMap = new Map<string, string[]>();
      let currentTermTeachingLanguagesMap = new Map<string, string | null>();

      try {
        // 嘗試獲取教學語言數據，但如果失敗則繼續正常流程
        const [languagesResult, currentTermResult] = await Promise.allSettled([
          this.getBatchInstructorTeachingLanguages(instructorNames),
          this.getBatchInstructorCurrentTermTeachingLanguages(instructorNames)
        ]);

        if (languagesResult.status === 'fulfilled') {
          teachingLanguagesMap = languagesResult.value;
        } else {
          console.warn('Failed to fetch all instructor teaching languages, continuing without language badges:', languagesResult.reason);
        }

        if (currentTermResult.status === 'fulfilled') {
          currentTermTeachingLanguagesMap = currentTermResult.value;
        } else {
          console.warn('Failed to fetch all instructor current term teaching languages, continuing without current term language:', currentTermResult.reason);
        }
      } catch (error) {
        console.warn('Error fetching teaching language data for all instructors, continuing without language badges:', error);
      }

      // 添加教學語言數據到結果中
      const finalInstructorsWithDetailedStats = instructorsWithDetailedStats.map(instructor => ({
        ...instructor,
        teachingLanguages: teachingLanguagesMap.get(instructor.name) || [],
        currentTermTeachingLanguage: currentTermTeachingLanguagesMap.get(instructor.name) || null
      })).sort((a, b) => {
        // 首先按名字排序（字母順序），忽略職稱
        const aNameForSort = extractInstructorNameForSorting(a.name);
        const bNameForSort = extractInstructorNameForSorting(b.name);
        return aNameForSort.localeCompare(bNameForSort);
      });

      // 緩存結果 - 講師統計數據相對穩定，使用較長緩存時間
      this.setCached(cacheKey, finalInstructorsWithDetailedStats, 10 * 60 * 1000); // 10分鐘緩存
      
      return finalInstructorsWithDetailedStats;
    } catch (error) {
      console.error('Error fetching all instructors with detailed stats:', error);
      throw new Error('Failed to fetch all instructors with detailed statistics');
    }
  }

  /**
   * 獲取平均GPA最高的課程
   */
  static async getTopCoursesByGPA(limit: number = 6): Promise<CourseWithStats[]> {
    try {
      const cacheKey = `top_courses_gpa_${limit}`;
      
      // 檢查緩存
      const cached = this.getCached<CourseWithStats[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const coursesWithStats = await this.getCoursesWithStatsBatch();
      
      // 按平均GPA排序，只考慮有足夠GPA數據的課程（至少5個有成績的評論）
      const sortedCourses = coursesWithStats
        .filter(course => course.averageGPA > 0 && course.averageGPACount >= 5) // 只顯示有GPA數據且計算基數>=5的課程
        .sort((a, b) => {
          // 首先按平均GPA排序（降序）
          if (b.averageGPA !== a.averageGPA) {
            return b.averageGPA - a.averageGPA;
          }
          // GPA相同時按評論數排序
          return b.reviewCount - a.reviewCount;
        })
        .slice(0, limit); // 限制數量

      // 緩存結果
      this.setCached(cacheKey, sortedCourses, 2 * 60 * 1000); // 2分鐘緩存
      
      return sortedCourses;
    } catch (error) {
      console.error('Error fetching top courses by GPA:', error);
      throw new Error('Failed to fetch top courses by GPA');
    }
  }

  /**
   * 獲取平均GPA最高的講師
   */
  static async getTopInstructorsByGPA(limit: number = 6): Promise<InstructorWithDetailedStats[]> {
    try {
      const cacheKey = `top_instructors_gpa_${limit}`;
      
      // 檢查緩存
      const cached = this.getCached<InstructorWithDetailedStats[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      const instructorsWithDetailedStats = await this.getAllInstructorsWithDetailedStats();
      
      // 按平均GPA排序，只考慮有足夠GPA數據的講師（至少5個有成績的評論）
      const sortedInstructors = instructorsWithDetailedStats
        .filter(instructor => instructor.averageGPA > 0 && instructor.averageGPACount >= 5) // 只顯示有GPA數據且計算基數>=5的講師
        .sort((a, b) => {
          // 首先按平均GPA排序（降序）
          if (b.averageGPA !== a.averageGPA) {
            return b.averageGPA - a.averageGPA;
          }
          // GPA相同時按評論數排序
          return b.reviewCount - a.reviewCount;
        })
        .slice(0, limit); // 限制數量

      // 緩存結果
      this.setCached(cacheKey, sortedInstructors, 2 * 60 * 1000); // 2分鐘緩存
      
      return sortedInstructors;
    } catch (error) {
      console.error('Error fetching top instructors by GPA:', error);
      throw new Error('Failed to fetch top instructors by GPA');
    }
  }

  /**
   * 批量獲取所有課程統計信息（高度優化版本）
   * 使用緩存、減少數據傳輸量和並行處理
   */
  static async getCoursesWithStatsBatch(): Promise<CourseWithStats[]> {
    try {
      const currentTermCode = getCurrentTermCode();
      const cacheKey = `courses_with_stats_batch_${currentTermCode}`;
      
      // 檢查緩存
      const cached = this.getCached<CourseWithStats[]>(cacheKey);
      if (cached) {
        return cached;
      }
      
      // 並行獲取所有數據，使用最小化的欄位選擇
      const [coursesResponse, reviewsResponse, teachingRecordsResponse] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.COURSES_COLLECTION_ID,
          [
            Query.orderAsc('course_code'),
            Query.limit(this.MAX_COURSES_LIMIT),
            Query.select(['$id', 'course_code', 'course_title', 'course_title_tc', 'course_title_sc', 'department', '$createdAt', '$updatedAt'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.REVIEWS_COLLECTION_ID,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(this.MAX_REVIEWS_LIMIT),
            Query.select(['course_code', 'user_id', 'course_workload', 'course_difficulties', 'course_usefulness', 'course_final_grade']) // 選擇統計需要的所有評分欄位
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.TEACHING_RECORDS_COLLECTION_ID,
          [
            Query.equal('term_code', currentTermCode),
            Query.limit(this.MAX_TEACHING_RECORDS_LIMIT),
            Query.select(['course_code']) // 只需要課程代碼
          ]
        )
      ]);

      const courses = coursesResponse.documents as unknown as Course[];
      const allReviews = reviewsResponse.documents as unknown as Pick<Review, 'course_code' | 'user_id' | 'course_workload' | 'course_difficulties' | 'course_usefulness' | 'course_final_grade'>[];
      const currentTermTeachingRecords = teachingRecordsResponse.documents as unknown as Pick<TeachingRecord, 'course_code'>[];

      // 使用 Set 快速查找當前學期開設的課程
      const coursesOfferedInCurrentTerm = new Set(
        currentTermTeachingRecords.map(record => record.course_code)
      );

              // 使用 Map 批量計算統計信息，避免重複計算
        const courseStatsMap = new Map<string, {
          reviewCount: number;
          averageRating: number;
          studentCount: number;
          averageWorkload: number;
          averageDifficulty: number;
          averageUsefulness: number;
          averageGPA: number;
        }>();

      // 按課程代碼分組評論（使用 reduce 提高性能）
      const reviewsByCourse = allReviews.reduce((acc, review) => {
        const courseCode = review.course_code;
        if (!acc.has(courseCode)) {
          acc.set(courseCode, []);
        }
        acc.get(courseCode)!.push(review);
        return acc;
      }, new Map<string, typeof allReviews>());

      // 批量計算每個課程的統計信息
      for (const [courseCode, reviews] of reviewsByCourse) {
        const reviewCount = reviews.length;
        
        if (reviewCount === 0) {
          courseStatsMap.set(courseCode, {
            reviewCount: 0,
            averageRating: 0,
            studentCount: 0,
            averageWorkload: -1,
            averageDifficulty: -1,
            averageUsefulness: -1,
            averageGPA: 0,
            averageGPACount: 0
          });
          continue;
        }

        // 使用單次遍歷計算所有統計信息
        let totalRating = 0;
        let totalWorkload = 0;
        let totalDifficulty = 0;
        let totalUsefulness = 0;
        let validWorkloadCount = 0;
        let validDifficultyCount = 0;
        let validUsefulnessCount = 0;
        const uniqueUsers = new Set<string>();
        
        for (const review of reviews) {
          totalRating += review.course_usefulness || 0;
          uniqueUsers.add(review.user_id);
          
          // 計算詳細統計，排除 N/A 值 (-1) 和 0 值
          if (review.course_workload > 0) {
            totalWorkload += review.course_workload;
            validWorkloadCount++;
          }
          if (review.course_difficulties > 0) {
            totalDifficulty += review.course_difficulties;
            validDifficultyCount++;
          }
          if (review.course_usefulness > 0) {
            totalUsefulness += review.course_usefulness;
            validUsefulnessCount++;
          }
        }

        // 計算平均 GPA
        const gradeDistribution = calculateGradeDistributionFromReviews(reviews);
        const gradeStats = calculateGradeStatistics(gradeDistribution);
        const averageGPA = gradeStats.mean || 0;
        const averageGPACount = gradeStats.validGradeCount || 0;

        courseStatsMap.set(courseCode, {
          reviewCount,
          averageRating: totalRating / reviewCount,
          studentCount: uniqueUsers.size,
          averageWorkload: validWorkloadCount > 0 ? totalWorkload / validWorkloadCount : -1,
          averageDifficulty: validDifficultyCount > 0 ? totalDifficulty / validDifficultyCount : -1,
          averageUsefulness: validUsefulnessCount > 0 ? totalUsefulness / validUsefulnessCount : -1,
          averageGPA,
          averageGPACount
        });
      }

      // 獲取所有課程的教學語言和服務學習數據（帶錯誤處理的優雅降級）
      const courseCodes = courses.map(course => course.course_code);
      let teachingLanguagesMap = new Map<string, string[]>();
      let currentTermTeachingLanguagesMap = new Map<string, string | null>();
      let serviceLearningTypesMap = new Map<string, ('compulsory' | 'optional')[]>();
      let currentTermServiceLearningMap = new Map<string, ('compulsory' | 'optional') | null>();

      try {
        // 嘗試獲取教學語言和服務學習數據，但如果失敗則繼續正常流程
        const [languagesResult, currentTermResult, serviceLearningResult, currentTermServiceLearningResult] = await Promise.allSettled([
          this.getBatchCourseTeachingLanguages(courseCodes),
          this.getBatchCourseCurrentTermTeachingLanguages(courseCodes),
          this.getBatchCourseServiceLearning(courseCodes),
          this.getBatchCourseCurrentTermServiceLearning(courseCodes)
        ]);

        if (languagesResult.status === 'fulfilled') {
          teachingLanguagesMap = languagesResult.value;
          console.log('✅ Successfully fetched teaching languages for', teachingLanguagesMap.size, 'courses');
          
          // 計算有語言數據的課程數
          let coursesWithLanguages = 0;
          teachingLanguagesMap.forEach((languages, courseCode) => {
            if (languages.length > 0) {
              coursesWithLanguages++;
            }
          });
          console.log(`📊 ${coursesWithLanguages} courses have teaching language data out of ${teachingLanguagesMap.size} total`);
          
          // 輸出前5個課程的語言數據作為調試
          const first5 = Array.from(teachingLanguagesMap.entries()).slice(0, 5);
          console.log('📝 Sample teaching language data:', first5);
        } else {
          console.warn('❌ Failed to fetch course teaching languages, continuing without language badges:', languagesResult.reason);
        }

        if (currentTermResult.status === 'fulfilled') {
          currentTermTeachingLanguagesMap = currentTermResult.value;
        } else {
          console.warn('Failed to fetch course current term teaching languages, continuing without current term language:', currentTermResult.reason);
        }

        if (serviceLearningResult.status === 'fulfilled') {
          serviceLearningTypesMap = serviceLearningResult.value;
        } else {
          console.warn('Failed to fetch course service learning types, continuing without service learning badges:', serviceLearningResult.reason);
        }

        if (currentTermServiceLearningResult.status === 'fulfilled') {
          currentTermServiceLearningMap = currentTermServiceLearningResult.value;
        } else {
          console.warn('Failed to fetch course current term service learning, continuing without current term service learning:', currentTermServiceLearningResult.reason);
        }
      } catch (error) {
        console.warn('Error fetching teaching language and service learning data for courses, continuing without badges:', error);
      }

      // 組合課程和統計信息（使用 map 一次性處理）
      const coursesWithStats: CourseWithStats[] = courses.map((course, index) => {
        const stats = courseStatsMap.get(course.course_code) || {
          reviewCount: 0,
          averageRating: 0,
          studentCount: 0,
          averageWorkload: -1,
          averageDifficulty: -1,
          averageUsefulness: -1,
          averageGPA: 0,
          averageGPACount: 0
        };

        // 獲取教學語言和服務學習數據
        const teachingLanguages = teachingLanguagesMap.get(course.course_code) || [];
        const currentTermTeachingLanguage = currentTermTeachingLanguagesMap.get(course.course_code) || null;
        const serviceLearningTypes = serviceLearningTypesMap.get(course.course_code) || [];
        const currentTermServiceLearning = currentTermServiceLearningMap.get(course.course_code) || null;

        const courseWithStats = {
          ...course,
          ...stats,
          isOfferedInCurrentTerm: coursesOfferedInCurrentTerm.has(course.course_code),
          teachingLanguages,
          currentTermTeachingLanguage,
          serviceLearningTypes,
          currentTermServiceLearning
        };

        // 調試：檢查前3個課程的教學語言數據
        if (index < 3) {
          console.log(`🔍 Course ${course.course_code}: teachingLanguages =`, teachingLanguages);
        }

        return courseWithStats;
      });

      // 緩存結果 - 課程統計數據相對穩定，使用較長緩存時間
      this.setCached(cacheKey, coursesWithStats, 10 * 60 * 1000); // 10分鐘緩存
      
      return coursesWithStats;
    } catch (error) {
      console.error('Error fetching courses with stats (batch):', error);
      throw new Error('Failed to fetch courses with statistics');
    }
  }

  /**
   * 批量獲取所有講師統計信息（進一步優化版本）
   * 減少數據傳輸量和提高查詢效率
   */
  static async getInstructorsWithStatsBatch(): Promise<InstructorWithStats[]> {
    try {
      // 並行獲取講師、教學記錄和評論，使用精確的欄位選擇
      const [instructorsResponse, teachingRecordsResponse, reviewsResponse] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.INSTRUCTORS_COLLECTION_ID,
          [
            Query.orderAsc('name'),
            Query.limit(this.MAX_INSTRUCTORS_LIMIT),
            Query.select(['$id', 'name', 'name_tc', 'name_sc', 'title', 'email', 'department', '$createdAt', '$updatedAt'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.TEACHING_RECORDS_COLLECTION_ID,
          [
            Query.limit(this.MAX_TEACHING_RECORDS_LIMIT), // 使用優化後的常數限制
            Query.select(['instructor_name', 'course_code']) // 只選擇需要的欄位
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.REVIEWS_COLLECTION_ID,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(this.MAX_REVIEWS_LIMIT),
            Query.select(['instructor_details']) // 只選擇講師詳情欄位
          ]
        )
      ]);

      const instructors = instructorsResponse.documents as unknown as Instructor[];
      const allTeachingRecords = teachingRecordsResponse.documents as unknown as TeachingRecord[];
      const allReviews = reviewsResponse.documents as unknown as Review[];

      // 創建講師統計映射
      const instructorStatsMap = new Map<string, {
        courseCount: number;
        reviewCount: number;
        averageRating: number;
      }>();

      // 按講師姓名分組教學記錄
      const teachingRecordsByInstructor = new Map<string, TeachingRecord[]>();
      allTeachingRecords.forEach(record => {
        const instructorName = record.instructor_name;
        if (!teachingRecordsByInstructor.has(instructorName)) {
          teachingRecordsByInstructor.set(instructorName, []);
        }
        teachingRecordsByInstructor.get(instructorName)!.push(record);
      });

      // 計算每個講師的統計信息
      instructors.forEach(instructor => {
        const instructorName = instructor.name;
        
        // 計算課程數（去重）
        const teachingRecords = teachingRecordsByInstructor.get(instructorName) || [];
        const uniqueCourses = new Set(teachingRecords.map(record => record.course_code));
        const courseCount = uniqueCourses.size;

        // 過濾包含該講師的評論
        const instructorReviews = allReviews.filter(review => {
          try {
            const instructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
            return instructorDetails.some(detail => detail.instructor_name === instructorName);
          } catch (error) {
            return false;
          }
        });

        const reviewCount = instructorReviews.length;
        let averageRating = 0;

        if (reviewCount > 0) {
          const totalRating = instructorReviews.reduce((sum, review) => {
            try {
              const instructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
              const instructorDetail = instructorDetails.find(detail => detail.instructor_name === instructorName);
              return sum + (instructorDetail?.teaching || 0);
            } catch (error) {
              return sum;
            }
          }, 0);
          averageRating = totalRating / reviewCount;
        }

        instructorStatsMap.set(instructorName, {
          courseCount,
          reviewCount,
          averageRating
        });
      });

      // 組合講師和統計信息
      const instructorsWithStats: InstructorWithStats[] = instructors.map(instructor => {
        const stats = instructorStatsMap.get(instructor.name) || {
          courseCount: 0,
          reviewCount: 0,
          averageRating: 0
        };

        return {
          ...instructor,
          ...stats
        };
      });

      // 按評分和評論數排序
      instructorsWithStats.sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.reviewCount - a.reviewCount;
      });

      return instructorsWithStats;
    } catch (error) {
      console.error('Error fetching instructors with stats (batch):', error);
      throw new Error('Failed to fetch instructors with statistics');
    }
  }

  /**
   * 獲取帶投票信息的課程評論（優化版本）
   */
  static async getCourseReviewsWithVotesBatch(courseCode: string, userId?: string, language?: string): Promise<(CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]> {
          try {
        const reviews = await this.getCourseReviews(courseCode, language);
      
      if (reviews.length === 0) {
        return [];
      }

      // 提取所有評論ID
      const reviewIds = reviews.map(reviewInfo => reviewInfo.review.$id);
      
      // 並行獲取投票統計和用戶投票狀態
      const [voteStatsMap, userVotesMap] = await Promise.all([
        this.getBatchReviewVoteStats(reviewIds),
        userId ? this.getBatchUserVotesForReviews(reviewIds, userId) : Promise.resolve(new Map())
      ]);

      // 合併投票信息
      const reviewsWithVotes = reviews.map(reviewInfo => {
        const reviewId = reviewInfo.review.$id;
        const voteStats = voteStatsMap.get(reviewId) || { upvotes: 0, downvotes: 0 };
        const userVote = userVotesMap.get(reviewId) || null;

        return {
          ...reviewInfo,
          upvotes: voteStats.upvotes,
          downvotes: voteStats.downvotes,
          userVote
        };
      });

      return reviewsWithVotes;
    } catch (error) {
      console.error('Error fetching course reviews with votes (batch):', error);
      throw new Error('Failed to fetch course reviews with votes');
    }
  }

  /**
   * 獲取帶投票信息的講師評論（優化版本）
   */
  static async getInstructorReviewsFromDetailsWithVotesBatch(instructorName: string, userId?: string, language?: string): Promise<(InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]> {
          try {
        const reviews = await this.getInstructorReviewsFromDetails(instructorName, language);
      
      if (reviews.length === 0) {
        return [];
      }

      // 提取所有評論ID
      const reviewIds = reviews.map(reviewInfo => reviewInfo.review.$id);
      
      // 並行獲取投票統計和用戶投票狀態
      const [voteStatsMap, userVotesMap] = await Promise.all([
        this.getBatchReviewVoteStats(reviewIds),
        userId ? this.getBatchUserVotesForReviews(reviewIds, userId) : Promise.resolve(new Map())
      ]);

      // 合併投票信息
      const reviewsWithVotes = reviews.map(reviewInfo => {
        const reviewId = reviewInfo.review.$id;
        const voteStats = voteStatsMap.get(reviewId) || { upvotes: 0, downvotes: 0 };
        const userVote = userVotesMap.get(reviewId) || null;

        return {
          ...reviewInfo,
          upvotes: voteStats.upvotes,
          downvotes: voteStats.downvotes,
          userVote
        };
      });

      return reviewsWithVotes;
    } catch (error) {
      console.error('Error fetching instructor reviews with votes (batch):', error);
      console.error('Environment info:', {
        endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
        projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
        instructorName
      });
      
      // 提供更詳細的錯誤信息
      if (error instanceof Error) {
        throw new Error(`Failed to fetch instructor reviews with votes: ${error.message}`);
      }
      throw new Error('Failed to fetch instructor reviews with votes');
    }
  }

  /**
   * 獲取帶投票信息的課程評論（原版本，保持向後兼容）
   */
  static async getCourseReviewsWithVotes(courseCode: string, userId?: string, language?: string): Promise<(CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]> {
    // 使用優化版本
    return this.getCourseReviewsWithVotesBatch(courseCode, userId, language);
  }

  /**
   * 獲取帶投票信息的講師評論（原版本，保持向後兼容）
   */
  static async getInstructorReviewsFromDetailsWithVotes(instructorName: string, userId?: string, language?: string): Promise<(InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]> {
    // 使用優化版本
    return this.getInstructorReviewsFromDetailsWithVotesBatch(instructorName, userId, language);
  }

  /**
   * 更新用戶在所有評論中的用戶名
   * 當用戶更改用戶名時調用此函數來同步所有評論中的用戶名
   */
  static async updateUserReviewsUsername(userId: string, newUsername: string): Promise<void> {
    try {
      console.log(`🔄 Starting username update for user ${userId} to "${newUsername}"`);
      
      // 獲取該用戶的所有評論
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('is_anon', false), // 只更新非匿名評論
          Query.limit(1000),
          Query.select(['$id', 'username', 'course_code', 'is_anon']) // 添加更多字段用於調試
        ]
      );

      console.log(`📋 Found ${response.documents.length} non-anonymous reviews for user ${userId}`);
      
      if (response.documents.length === 0) {
        console.log('ℹ️ No non-anonymous reviews found to update');
        return;
      }

      // 顯示找到的評論信息
      response.documents.forEach((review, index) => {
        console.log(`📝 Review ${index + 1}: ID=${review.$id}, Course=${review.course_code}, CurrentUsername="${review.username}", IsAnon=${review.is_anon}`);
      });

      // 批量更新所有評論的用戶名
      // 首先獲取完整的評論數據，然後只更新用戶名
      const updatePromises = response.documents.map(async (review) => {
        console.log(`🔄 Updating review ${review.$id} from "${review.username}" to "${newUsername}"`);
        
        try {
          // 獲取完整的評論文檔
          const fullReview = await databases.getDocument(
            this.DATABASE_ID,
            this.REVIEWS_COLLECTION_ID,
            review.$id
          );
          
          // 更新用戶名，保持其他所有字段不變
          return await databases.updateDocument(
            this.DATABASE_ID,
            this.REVIEWS_COLLECTION_ID,
            review.$id,
            {
              ...fullReview,
              username: newUsername,
              // 移除系統字段，避免衝突
              $id: undefined,
              $createdAt: undefined,
              $updatedAt: undefined,
              $permissions: undefined,
              $collectionId: undefined,
              $databaseId: undefined
            }
          );
        } catch (error) {
          console.error(`❌ Failed to update review ${review.$id}:`, error);
          throw error;
        }
      });

      const results = await Promise.all(updatePromises);
      
      console.log(`✅ Successfully updated username in ${results.length} reviews for user ${userId}`);
      
      // 驗證更新結果
      results.forEach((result, index) => {
        console.log(`✅ Review ${index + 1} updated: ID=${result.$id}, NewUsername="${result.username}"`);
      });
      
    } catch (error) {
      console.error('❌ Error updating user reviews username:', error);
      // 不拋出錯誤，因為這是一個後台同步操作，不應該阻止用戶名更新
      console.warn('⚠️ Username update in reviews failed, but user profile update will continue');
    }
  }

  /**
   * 測試函數：手動測試用戶名更新功能
   * 在瀏覽器控制台中調用：CourseService.testUsernameUpdate('your-user-id', 'new-username')
   */
  static async testUsernameUpdate(userId: string, newUsername: string): Promise<void> {
    console.log(`🧪 Testing username update functionality`);
    console.log(`📋 User ID: ${userId}`);
    console.log(`📝 New Username: ${newUsername}`);
    
    try {
      // 首先查看用戶的所有評論（包括匿名的）
      const allReviewsResponse = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.limit(1000),
          Query.select(['$id', 'username', 'course_code', 'is_anon'])
        ]
      );
      
      console.log(`📊 Total reviews for user: ${allReviewsResponse.documents.length}`);
      allReviewsResponse.documents.forEach((review, index) => {
        console.log(`📝 All Review ${index + 1}: ID=${review.$id}, Course=${review.course_code}, Username="${review.username}", IsAnon=${review.is_anon}`);
      });
      
      // 然後執行更新
      await this.updateUserReviewsUsername(userId, newUsername);
      
      console.log(`🧪 Test completed`);
    } catch (error) {
      console.error('🧪 Test failed:', error);
    }
  }

  /**
   * 檢查講師是否在指定學期教學
   */
  static async isInstructorTeachingInTerm(instructorName: string, termCode: string): Promise<boolean> {
    try {
      const teachingCourses = await this.getInstructorTeachingCourses(instructorName);
      return teachingCourses.some(course => course.term.term_code === termCode);
    } catch (error) {
      console.error('Error checking if instructor is teaching in term:', error);
      return false;
    }
  }

  /**
   * 獲取包含特定講師的所有評論（優化版本）
   */
  static async getInstructorReviews(instructorName: string): Promise<InstructorReviewInfo[]> {
    try {
      // 使用更精確的查詢，減少需要處理的數據量
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(500) // 減少查詢數量
        ]
      );

      const allReviews = response.documents as unknown as Review[];
      
      // 過濾包含該講師的評論
      const instructorReviews = allReviews.filter(review => {
        try {
          const instructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
          return instructorDetails.some(detail => detail.instructor_name === instructorName);
        } catch (error) {
          console.error('Error parsing instructor_details:', error);
          return false;
        }
      });

      // 如果沒有找到評論，直接返回空數組
      if (instructorReviews.length === 0) {
        return [];
      }

      // 批量獲取所有需要的課程和學期信息，避免重複調用
      const uniqueCourseCodes = [...new Set(instructorReviews.map(review => review.course_code))];
      const uniqueTermCodes = [...new Set(instructorReviews.map(review => review.term_code))];
      
      // 並行獲取所有課程和學期信息
      const [coursesMap, termsMap] = await Promise.all([
        Promise.all(uniqueCourseCodes.map(async (courseCode) => {
          try {
            const course = await this.getCourseByCode(courseCode);
            return [courseCode, course] as const;
          } catch (error) {
            console.error(`Error fetching course ${courseCode}:`, error);
            return [courseCode, null] as const;
          }
        })).then(results => new Map(results.filter(([, course]) => course !== null))),
        Promise.all(uniqueTermCodes.map(async (termCode) => {
          try {
            const term = await this.getTermByCode(termCode);
            return [termCode, term] as const;
          } catch (error) {
            console.error(`Error fetching term ${termCode}:`, error);
            return [termCode, null] as const;
          }
        })).then(results => new Map(results.filter(([, term]) => term !== null)))
      ]);

      // 處理評論信息，使用緩存的課程和學期數據
      const reviewsWithInfo = instructorReviews.map((review) => {
        const course = coursesMap.get(review.course_code);
        const term = termsMap.get(review.term_code);

        if (!course || !term) {
          return null;
        }

        // 解析講師詳情並找到該講師的評價
        let instructorDetail: InstructorDetail | null = null;
        try {
          const instructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
          instructorDetail = instructorDetails.find(detail => detail.instructor_name === instructorName) || null;
        } catch (error) {
          console.error('Error parsing instructor_details:', error);
          return null;
        }

        if (!instructorDetail) {
          return null;
        }

        return {
          review,
          course,
          term,
          instructorDetail
        };
      });

      // 過濾掉 null 值並返回
      return reviewsWithInfo.filter((info): info is NonNullable<typeof info> => info !== null);
    } catch (error) {
      console.error('Error fetching instructor reviews:', error);
      throw new Error('Failed to fetch instructor reviews');
    }
  }

  /**
   * 批量檢查課程是否在指定學期開設（優化版本）
   * 一次性獲取所有課程在指定學期的開設狀態，避免多次 API 調用
   */
  static async getCoursesOfferedInTermBatch(termCode: string, courseCodes?: string[]): Promise<Set<string>> {
    try {
      const cacheKey = `courses_offered_in_term_${termCode}`;
      
      // 🔄 TEMPORARY: Clear cache for this fix to take effect immediately
      // Remove this after the fix is deployed and tested
      if (termCode === '2022-S') {
        console.log(`🔄 Clearing cache for ${termCode} to apply query limit fix...`);
        this.cache.delete(cacheKey);
      }
      
      // 檢查緩存
      const cached = this.getCached<Set<string>>(cacheKey);
      if (cached) {
        return cached;
      }

      // 🐛 FIX: Use a much higher limit for term-specific queries to avoid missing courses
      // 2022-S and other comprehensive terms may have >500 teaching records
      // We need to get ALL courses offered in a term, not just the first 500 records
      const TERM_QUERY_LIMIT = 5000; // Increased from 500 to handle comprehensive terms
      
      const queries = [
        Query.equal('term_code', termCode),
        Query.limit(TERM_QUERY_LIMIT),
        Query.select(['course_code'])
      ];

      // 如果提供了特定課程代碼，則只查詢這些課程
      if (courseCodes && courseCodes.length > 0) {
        queries.push(Query.equal('course_code', courseCodes));
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        queries
      );

      const teachingRecords = response.documents as unknown as Pick<TeachingRecord, 'course_code'>[];
      
      // 🐛 FIX: Convert course codes to lowercase to handle case sensitivity issues
      // Teaching records may have uppercase suffixes (e.g., "CHI4342A") while courses database has lowercase (e.g., "CHI4342a")
      const offeredCourses = new Set(teachingRecords.map(record => record.course_code.toLowerCase()));

      // Debug logging to help identify potential issues with large terms
      console.log(`📊 Term ${termCode}: Found ${teachingRecords.length} teaching records, ${offeredCourses.size} unique courses`);
      
      // Warn if we hit the query limit (potential data truncation)
      if (teachingRecords.length >= TERM_QUERY_LIMIT) {
        console.warn(`⚠️  Term ${termCode} may have more data - hit query limit of ${TERM_QUERY_LIMIT} records!`);
      }

      // 緩存結果（較長時間，因為學期數據相對穩定）
      this.setCached(cacheKey, offeredCourses, 10 * 60 * 1000); // 10分鐘緩存
      
      return offeredCourses;
    } catch (error) {
      console.error('Error fetching courses offered in term (batch):', error);
      return new Set();
    }
  }

  /**
   * 批量檢查講師是否在指定學期教學（優化版本）
   * 一次性獲取所有講師在指定學期的教學狀態，避免多次 API 調用
   */
  static async getInstructorsTeachingInTermBatch(termCodes: string | string[], instructorNames?: string[]): Promise<Set<string>> {
    try {
      // 處理單個 term code 或多個 term codes
      const termCodeArray = Array.isArray(termCodes) ? termCodes : [termCodes];
      
      // 如果沒有 term codes，返回空集合
      if (termCodeArray.length === 0) {
        return new Set();
      }

      const cacheKey = `instructors_teaching_in_term_${termCodeArray.sort().join('_')}`;
      
      // 檢查緩存
      const cached = this.getCached<Set<string>>(cacheKey);
      if (cached) {
        return cached;
      }

      // 獲取指定學期的所有教學記錄
      const queries = [
        Query.equal('term_code', termCodeArray),
        Query.limit(this.MAX_TEACHING_RECORDS_LIMIT),
        Query.select(['instructor_name'])
      ];

      // 如果提供了特定講師名稱，則只查詢這些講師
      if (instructorNames && instructorNames.length > 0) {
        queries.push(Query.equal('instructor_name', instructorNames));
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        queries
      );

      const teachingRecords = response.documents as unknown as Pick<TeachingRecord, 'instructor_name'>[];
      const teachingInstructors = new Set(teachingRecords.map(record => record.instructor_name));

      // 緩存結果（較長時間，因為學期數據相對穩定）
      this.setCached(cacheKey, teachingInstructors, 10 * 60 * 1000); // 10分鐘緩存
      
      return teachingInstructors;
    } catch (error) {
      console.error('Error fetching instructors teaching in term (batch):', error);
      return new Set();
    }
  }

  /**
   * 獲取所有學期的課程開設狀態（超級優化版本）
   * 一次性獲取所有學期的教學記錄，支持多個學期的批量查詢
   */
  static async getAllTermsCoursesOfferedBatch(termCodes?: string[]): Promise<Map<string, Set<string>>> {
    try {
      const cacheKey = `all_terms_courses_offered_${termCodes?.join('_') || 'all'}`;
      
      // 檢查緩存
      const cached = this.getCached<Map<string, Set<string>>>(cacheKey);
      if (cached) {
        return cached;
      }

      // 獲取教學記錄
      const queries = [
        Query.limit(this.MAX_TEACHING_RECORDS_LIMIT),
        Query.select(['term_code', 'course_code'])
      ];

      // 如果提供了特定學期代碼，則只查詢這些學期
      if (termCodes && termCodes.length > 0) {
        queries.push(Query.equal('term_code', termCodes));
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        queries
      );

      const teachingRecords = response.documents as unknown as Pick<TeachingRecord, 'term_code' | 'course_code'>[];
      
      // 按學期分組課程
      const termCoursesMap = new Map<string, Set<string>>();
      
      for (const record of teachingRecords) {
        if (!termCoursesMap.has(record.term_code)) {
          termCoursesMap.set(record.term_code, new Set());
        }
        termCoursesMap.get(record.term_code)!.add(record.course_code);
      }

      // 緩存結果（較長時間）
      this.setCached(cacheKey, termCoursesMap, 15 * 60 * 1000); // 15分鐘緩存
      
      return termCoursesMap;
    } catch (error) {
      console.error('Error fetching all terms courses offered (batch):', error);
      return new Map();
    }
  }

  /**
   * 獲取所有學期的講師教學狀態（超級優化版本）
   * 一次性獲取所有學期的教學記錄，支持多個學期的批量查詢
   */
  static async getAllTermsInstructorsTeachingBatch(termCodes?: string[]): Promise<Map<string, Set<string>>> {
    try {
      const cacheKey = `all_terms_instructors_teaching_${termCodes?.join('_') || 'all'}`;
      
      // 檢查緩存
      const cached = this.getCached<Map<string, Set<string>>>(cacheKey);
      if (cached) {
        return cached;
      }

      // 獲取教學記錄
      const queries = [
        Query.limit(this.MAX_TEACHING_RECORDS_LIMIT),
        Query.select(['term_code', 'instructor_name'])
      ];

      // 如果提供了特定學期代碼，則只查詢這些學期
      if (termCodes && termCodes.length > 0) {
        queries.push(Query.equal('term_code', termCodes));
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        queries
      );

      const teachingRecords = response.documents as unknown as Pick<TeachingRecord, 'term_code' | 'instructor_name'>[];
      
      // 按學期分組講師
      const termInstructorsMap = new Map<string, Set<string>>();
      
      for (const record of teachingRecords) {
        if (!termInstructorsMap.has(record.term_code)) {
          termInstructorsMap.set(record.term_code, new Set());
        }
        termInstructorsMap.get(record.term_code)!.add(record.instructor_name);
      }

      // 緩存結果（較長時間）
      this.setCached(cacheKey, termInstructorsMap, 15 * 60 * 1000); // 15分鐘緩存
      
      return termInstructorsMap;
    } catch (error) {
      console.error('Error fetching all terms instructors teaching (batch):', error);
      return new Map();
    }
  }

  /**
   * 批量獲取多個課程的詳細統計信息（超級優化版本）
   * 一次 API 調用獲取所有課程的評分數據，避免 N+1 問題
   */
  static async getBatchCourseDetailedStats(courseCodes: string[]): Promise<Map<string, {
    reviewCount: number;
    averageRating: number;
    studentCount: number;
    averageWorkload: number;
    averageDifficulty: number;
    averageUsefulness: number;
    averageGPA: number;
    averageGPACount: number;
  }>> {
    try {
      const cacheKey = `batch_course_detailed_stats_${courseCodes.sort().join('_')}`;
      
      // 檢查緩存
      const cached = this.getCached<Map<string, any>>(cacheKey);
      if (cached) {
        return cached;
      }

      // 如果沒有課程代碼，返回空結果
      if (courseCodes.length === 0) {
        return new Map();
      }

      // 獲取這些課程的所有評論
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCodes),
          Query.limit(this.MAX_REVIEWS_LIMIT),
          Query.select(['course_code', 'user_id', 'course_workload', 'course_difficulties', 'course_usefulness', 'course_final_grade'])
        ]
      );

      const allReviews = response.documents as unknown as Pick<Review, 'course_code' | 'user_id' | 'course_workload' | 'course_difficulties' | 'course_usefulness' | 'course_final_grade'>[];

      // 按課程代碼分組評論
      const reviewsByCourse = allReviews.reduce((acc, review) => {
        const courseCode = review.course_code;
        if (!acc.has(courseCode)) {
          acc.set(courseCode, []);
        }
        acc.get(courseCode)!.push(review);
        return acc;
      }, new Map<string, typeof allReviews>());

      // 計算每個課程的統計信息
      const courseStatsMap = new Map<string, {
        reviewCount: number;
        averageRating: number;
        studentCount: number;
        averageWorkload: number;
        averageDifficulty: number;
        averageUsefulness: number;
        averageGPA: number;
        averageGPACount: number;
      }>();

      for (const courseCode of courseCodes) {
        const reviews = reviewsByCourse.get(courseCode) || [];
        const reviewCount = reviews.length;
        
        if (reviewCount === 0) {
          courseStatsMap.set(courseCode, {
            reviewCount: 0,
            averageRating: 0,
            studentCount: 0,
            averageWorkload: -1,
            averageDifficulty: -1,
            averageUsefulness: -1,
            averageGPA: 0,
            averageGPACount: 0
          });
          continue;
        }

        // 計算統計信息
        let totalRating = 0;
        let totalWorkload = 0;
        let totalDifficulty = 0;
        let totalUsefulness = 0;
        let totalGPA = 0;
        let validWorkloadCount = 0;
        let validDifficultyCount = 0;
        let validUsefulnessCount = 0;
        let validGPACount = 0;
        const uniqueUsers = new Set<string>();
        
        for (const review of reviews) {
          totalRating += review.course_usefulness || 0;
          uniqueUsers.add(review.user_id);
          
          if (review.course_workload > 0) {
            totalWorkload += review.course_workload;
            validWorkloadCount++;
          }
          if (review.course_difficulties > 0) {
            totalDifficulty += review.course_difficulties;
            validDifficultyCount++;
          }
          if (review.course_usefulness > 0) {
            totalUsefulness += review.course_usefulness;
            validUsefulnessCount++;
          }
          if (review.course_final_grade) {
            const gradeValue = getGPA(review.course_final_grade);
            if (gradeValue && gradeValue > 0) {
              totalGPA += gradeValue;
              validGPACount++;
            }
          }
        }

        courseStatsMap.set(courseCode, {
          reviewCount,
          averageRating: totalRating / reviewCount,
          studentCount: uniqueUsers.size,
          averageWorkload: validWorkloadCount > 0 ? totalWorkload / validWorkloadCount : -1,
          averageDifficulty: validDifficultyCount > 0 ? totalDifficulty / validDifficultyCount : -1,
          averageUsefulness: validUsefulnessCount > 0 ? totalUsefulness / validUsefulnessCount : -1,
          averageGPA: validGPACount > 0 ? totalGPA / validGPACount : 0,
          averageGPACount: validGPACount
        });
      }

      // 緩存結果
      this.setCached(cacheKey, courseStatsMap, 3 * 60 * 1000); // 3分鐘緩存（評分數據變化較頻繁）
      
      return courseStatsMap;
    } catch (error) {
      console.error('Error fetching batch course detailed stats:', error);
      return new Map();
    }
  }

  /**
   * 批量獲取多個講師的詳細統計信息（超級優化版本）
   * 一次 API 調用獲取所有講師的評分數據，避免 N+1 問題
   */
  static async getBatchInstructorDetailedStats(instructorNames: string[]): Promise<Map<string, {
    reviewCount: number;
    teachingScore: number;
    gradingFairness: number;
  }>> {
    try {
      const cacheKey = `batch_instructor_detailed_stats_${instructorNames.sort().join('_')}`;
      
      // 檢查緩存
      const cached = this.getCached<Map<string, any>>(cacheKey);
      if (cached) {
        return cached;
      }

      // 如果沒有講師名稱，返回空結果
      if (instructorNames.length === 0) {
        return new Map();
      }

      // 獲取所有評論（包含講師詳情）
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(this.MAX_REVIEWS_LIMIT),
          Query.select(['instructor_details'])
        ]
      );

      const allReviews = response.documents as unknown as Pick<Review, 'instructor_details'>[];

      // 創建講師統計映射
      const instructorStatsMap = new Map<string, {
        reviewCount: number;
        teachingScores: number[];
        gradingScores: number[];
      }>();

      // 初始化所有講師的統計
      for (const instructorName of instructorNames) {
        instructorStatsMap.set(instructorName, {
          reviewCount: 0,
          teachingScores: [],
          gradingScores: []
        });
      }

      // 處理每個評論中的講師詳情
      for (const review of allReviews) {
        try {
          const instructorDetails = JSON.parse(review.instructor_details) as InstructorDetail[];
          
          for (const detail of instructorDetails) {
            const instructorName = detail.instructor_name;
            
            // 只處理我們關心的講師
            if (instructorNames.includes(instructorName)) {
              const stats = instructorStatsMap.get(instructorName);
              if (stats) {
                stats.reviewCount++;
                
                // 收集有效評分
                if (detail.teaching > 0) {
                  stats.teachingScores.push(detail.teaching);
                }
                if (detail.grading && detail.grading > 0) {
                  stats.gradingScores.push(detail.grading);
                }
              }
            }
          }
        } catch (error) {
          // 跳過無效的 JSON 數據
          continue;
        }
      }

      // 計算最終統計信息
      const finalStatsMap = new Map<string, {
        reviewCount: number;
        teachingScore: number;
        gradingFairness: number;
      }>();
      
      for (const [instructorName, stats] of instructorStatsMap) {
        const teachingScore = stats.teachingScores.length > 0 
          ? stats.teachingScores.reduce((sum, score) => sum + score, 0) / stats.teachingScores.length 
          : 0;
        const gradingFairness = stats.gradingScores.length > 0 
          ? stats.gradingScores.reduce((sum, score) => sum + score, 0) / stats.gradingScores.length 
          : 0;
          
        finalStatsMap.set(instructorName, {
          reviewCount: stats.reviewCount,
          teachingScore,
          gradingFairness
        });
      }

      // 緩存結果
      this.setCached(cacheKey, finalStatsMap, 3 * 60 * 1000); // 3分鐘緩存
      
      return finalStatsMap;
    } catch (error) {
      console.error('Error fetching batch instructor detailed stats:', error);
      return new Map();
    }
  }

  /**
   * 獲取課程詳細統計信息（優化版本 - 優先使用緩存的批量數據）
   */
  static async getCourseDetailedStatsOptimized(courseCode: string): Promise<{
    reviewCount: number;
    averageRating: number;
    studentCount: number;
    averageWorkload: number;
    averageDifficulty: number;
    averageUsefulness: number;
  }> {
    try {
      // 首先嘗試從批量緩存中獲取
      const batchStats = await this.getBatchCourseDetailedStats([courseCode]);
      const stats = batchStats.get(courseCode);
      
      if (stats) {
        return stats;
      }

      // 如果批量緩存中沒有，回退到原始方法
      return await this.getCourseDetailedStats(courseCode);
    } catch (error) {
      console.error('Error fetching optimized course detailed stats:', error);
      return {
        reviewCount: 0,
        averageRating: 0,
        studentCount: 0,
        averageWorkload: -1,
        averageDifficulty: -1,
        averageUsefulness: -1
      };
    }
  }

  /**
   * 獲取講師詳細統計信息（優化版本 - 優先使用緩存的批量數據）
   */
  static async getInstructorDetailedStatsOptimized(instructorName: string): Promise<{
    reviewCount: number;
    teachingScore: number;
    gradingFairness: number;
  }> {
    try {
      // 首先嘗試從批量緩存中獲取
      const batchStats = await this.getBatchInstructorDetailedStats([instructorName]);
      const stats = batchStats.get(instructorName);
      
      if (stats) {
        return stats;
      }

      // 如果批量緩存中沒有，回退到從全量數據中查找
      const allInstructors = await this.getAllInstructorsWithDetailedStats();
      const instructor = allInstructors.find(inst => inst.name === instructorName);
      
      if (instructor) {
        return {
          reviewCount: instructor.reviewCount,
          teachingScore: instructor.teachingScore,
          gradingFairness: instructor.gradingFairness
        };
      }

      return {
        reviewCount: 0,
        teachingScore: 0,
        gradingFairness: 0
      };
    } catch (error) {
      console.error('Error fetching optimized instructor detailed stats:', error);
      return {
        reviewCount: 0,
        teachingScore: 0,
        gradingFairness: 0
      };
    }
  }

  /**
   * 獲取講師教學課程（超級優化版本）
   * 批量獲取所有相關課程和學期信息，大幅減少 API 調用
   */
  static async getInstructorTeachingCoursesOptimized(instructorName: string): Promise<InstructorTeachingCourse[]> {
    try {
      const cacheKey = `instructor_teaching_courses_optimized_${instructorName}`;
      
      // 檢查緩存
      const cached = this.getCached<InstructorTeachingCourse[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // 獲取講師的教學記錄
      const teachingRecords = await this.getInstructorTeachingRecords(instructorName);
      
      if (teachingRecords.length === 0) {
        return [];
      }

      // 獲取所有唯一的課程代碼和學期代碼
      const uniqueCourseCodes = [...new Set(teachingRecords.map(record => record.course_code))];
      const uniqueTermCodes = [...new Set(teachingRecords.map(record => record.term_code))];
      
      // 並行批量獲取所有課程和學期信息
      const [coursesResponse, termsResponse] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.COURSES_COLLECTION_ID,
          [
            Query.equal('course_code', uniqueCourseCodes),
            Query.limit(uniqueCourseCodes.length),
            Query.select(['$id', 'course_code', 'course_title', 'course_title_tc', 'course_title_sc', 'department'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.TERMS_COLLECTION_ID,
          [
            Query.equal('term_code', uniqueTermCodes),
            Query.limit(uniqueTermCodes.length),
            Query.select(['$id', 'term_code', 'name', 'start_date', 'end_date'])
          ]
        )
      ]);

      // 創建快速查找映射
      const coursesMap = new Map<string, Course>();
      const termsMap = new Map<string, Term>();
      
      (coursesResponse.documents as unknown as Course[]).forEach(course => {
        coursesMap.set(course.course_code, course);
      });
      
      (termsResponse.documents as unknown as Term[]).forEach(term => {
        termsMap.set(term.term_code, term);
      });

      // 組合教學課程信息
      const teachingCourses = teachingRecords
        .map((record) => {
          const course = coursesMap.get(record.course_code);
          const term = termsMap.get(record.term_code);

          // Handle missing courses by creating a fallback course object
          let finalCourse = course;
          if (!course) {
            console.warn(`CourseService: Creating fallback course for missing course_code: "${record.course_code}" for instructor "${instructorName}" teaching courses`);
            
            // Create fallback course object
            finalCourse = {
              $id: `fallback_${record.course_code}`,
              course_code: record.course_code,
              course_title: record.course_code, // Use course code as title
              course_title_zh: record.course_code, // Use course code as Chinese title
              department: 'Unknown', // Default department
              department_zh: '未知', // Default Chinese department
              credits: 3, // Default credits
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString()
            } as Course;
          }

          // Handle missing terms by creating a fallback term object
          let finalTerm = term;
          if (!term) {
            console.warn(`CourseService: Creating fallback term for missing term_code: "${record.term_code}" for instructor "${instructorName}" teaching courses`);
            
            // Parse term information
            let termName = record.term_code;
            let startDate = new Date().toISOString();
            let endDate = new Date().toISOString();
            
            // Handle different term code formats
            const yearOnOrBeforeMatch = record.term_code.match(/^(\d{4})_on_or_before$/);
            if (yearOnOrBeforeMatch) {
              const year = yearOnOrBeforeMatch[1];
              termName = record.term_code; // Keep original term_code for proper translation
              startDate = new Date(`${year}-01-01`).toISOString();
              endDate = new Date(`${year}-12-31`).toISOString();
            } else if (record.term_code === 'historical') {
              termName = '歷史學期';
              startDate = new Date('2020-01-01').toISOString();
              endDate = new Date('2020-12-31').toISOString();
            } else {
              // Handle simple year format (e.g., "2017")
              const yearOnlyMatch = record.term_code.match(/^(\d{4})$/);
              if (yearOnlyMatch) {
                const year = parseInt(yearOnlyMatch[1]);
                termName = record.term_code; // Keep original term_code for proper translation
                startDate = new Date(year, 0, 1).toISOString(); // January 1st
                endDate = new Date(year, 11, 31).toISOString(); // December 31st
              } else {
                // Handle YYYY-T# format (e.g., "2017-T1", "2017-T2")
                const termCodeMatch = record.term_code.match(/^(\d{4})-T([12])$/);
                if (termCodeMatch) {
                  const startYear = parseInt(termCodeMatch[1]);
                  const termNumber = termCodeMatch[2];
                  termName = record.term_code; // Keep original term_code for proper translation
                  if (termNumber === '1') {
                    startDate = new Date(startYear, 8, 1).toISOString(); // September 1st
                    endDate = new Date(startYear + 1, 0, 31).toISOString(); // January 31st next year
                  } else {
                    startDate = new Date(startYear, 1, 1).toISOString(); // February 1st
                    endDate = new Date(startYear, 5, 30).toISOString(); // June 30th
                  }
                } else {
                  // Try to parse standard term format (e.g., "2023S1", "2024S2")
                  const termMatch = record.term_code.match(/^(\d{4})S([12])$/);
                  if (termMatch) {
                    const year = termMatch[1];
                    const semester = termMatch[2];
                    termName = `${year}年第${semester}學期`;
                    const startYear = parseInt(year);
                    if (semester === '1') {
                      startDate = new Date(startYear, 8, 1).toISOString(); // September 1st
                      endDate = new Date(startYear + 1, 0, 31).toISOString(); // January 31st next year
                    } else {
                      startDate = new Date(startYear, 1, 1).toISOString(); // February 1st
                      endDate = new Date(startYear, 5, 30).toISOString(); // June 30th
                    }
                  } else {
                    // Keep original term_code for unrecognized formats
                    termName = record.term_code; // This will be handled by getTermName() function
                  }
                }
              }
            }
            
            // Create fallback term object
            finalTerm = {
              $id: `fallback_${record.term_code}`,
              term_code: record.term_code,
              name: termName,
              start_date: startDate,
              end_date: endDate,
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString()
            } as Term;
          }

          return {
            course: finalCourse,
            term: finalTerm,
            sessionType: record.session_type
          };
        })
        .filter((info): info is NonNullable<typeof info> => info !== null)
        .sort((a, b) => b.term.term_code.localeCompare(a.term.term_code)); // 按學期排序

      // 緩存結果
      this.setCached(cacheKey, teachingCourses, 10 * 60 * 1000); // 10分鐘緩存
      
      return teachingCourses;
    } catch (error) {
      console.error('Error fetching instructor teaching courses (optimized):', error);
      throw new Error('Failed to fetch instructor teaching courses');
    }
  }

  /**
   * 獲取講師評論（超級優化版本）
   * 批量獲取所有相關課程和學期信息，大幅減少 API 調用
   */
  static async getInstructorReviewsOptimized(instructorName: string): Promise<InstructorReviewInfo[]> {
    try {
      const cacheKey = `instructor_reviews_optimized_${instructorName}`;
      
      // 檢查緩存
      const cached = this.getCached<InstructorReviewInfo[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // 獲取所有評論，使用優化的查詢
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(this.MAX_REVIEWS_LIMIT),
          Query.select(['$id', 'user_id', 'is_anon', 'username', 'course_code', 'term_code',
                       'course_workload', 'course_difficulties', 'course_usefulness',
                       'course_final_grade', 'course_comments', 'submitted_at', 'instructor_details', 'review_language', '$createdAt'])
        ]
      );

      const allReviews = response.documents as unknown as Review[];
      
      // 過濾包含該講師的評論
      const instructorReviews = allReviews.filter(review => {
        try {
          const instructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
          return instructorDetails.some(detail => detail.instructor_name === instructorName);
        } catch (error) {
          return false;
        }
      });

      if (instructorReviews.length === 0) {
        return [];
      }

      // 獲取所有唯一的課程代碼和學期代碼
      const uniqueCourseCodes = [...new Set(instructorReviews.map(review => review.course_code))];
      const uniqueTermCodes = [...new Set(instructorReviews.map(review => review.term_code))];
      
      // 並行批量獲取所有課程和學期信息
      const [coursesResponse, termsResponse] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.COURSES_COLLECTION_ID,
          [
            Query.equal('course_code', uniqueCourseCodes),
            Query.limit(uniqueCourseCodes.length),
            Query.select(['$id', 'course_code', 'course_title', 'course_title_tc', 'course_title_sc', 'department'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.TERMS_COLLECTION_ID,
          [
            Query.equal('term_code', uniqueTermCodes),
            Query.limit(uniqueTermCodes.length),
            Query.select(['$id', 'term_code', 'name', 'start_date', 'end_date'])
          ]
        )
      ]);

      // 創建快速查找映射
      const coursesMap = new Map<string, Course>();
      const termsMap = new Map<string, Term>();
      
      (coursesResponse.documents as unknown as Course[]).forEach(course => {
        coursesMap.set(course.course_code, course);
      });
      
      (termsResponse.documents as unknown as Term[]).forEach(term => {
        termsMap.set(term.term_code, term);
      });

      // 處理評論信息
      const reviewsWithInfo = instructorReviews
        .map((review) => {
          const course = coursesMap.get(review.course_code);
          const term = termsMap.get(review.term_code);

          // Handle missing courses by creating a fallback course object
          let finalCourse = course;
          if (!course) {
            console.warn(`CourseService: Creating fallback course for missing course_code: "${review.course_code}" for instructor "${instructorName}" reviews`);
            
            // Create fallback course object
            finalCourse = {
              $id: `fallback_${review.course_code}`,
              course_code: review.course_code,
              course_title: review.course_code, // Use course code as title
              course_title_zh: review.course_code, // Use course code as Chinese title
              department: 'Unknown', // Default department
              department_zh: '未知', // Default Chinese department
              credits: 3, // Default credits
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString()
            } as Course;
          }

          // Handle missing terms by creating a fallback term object
          let finalTerm = term;
          if (!term) {
            console.warn(`CourseService: Creating fallback term for missing term_code: "${review.term_code}" for instructor "${instructorName}"`);
            
            // Parse term information
            let termName = review.term_code;
            let startDate = new Date().toISOString();
            let endDate = new Date().toISOString();
            
            // Handle different term code formats
            const yearOnOrBeforeMatch = review.term_code.match(/^(\d{4})_on_or_before$/);
            if (yearOnOrBeforeMatch) {
              const year = yearOnOrBeforeMatch[1];
              termName = review.term_code; // Keep original term_code for proper translation
              startDate = new Date(`${year}-01-01`).toISOString();
              endDate = new Date(`${year}-12-31`).toISOString();
            } else if (review.term_code === 'historical') {
              termName = '歷史學期';
              startDate = new Date('2020-01-01').toISOString();
              endDate = new Date('2020-12-31').toISOString();
            } else {
              // Handle simple year format (e.g., "2017")
              const yearOnlyMatch = review.term_code.match(/^(\d{4})$/);
              if (yearOnlyMatch) {
                const year = parseInt(yearOnlyMatch[1]);
                termName = review.term_code; // Keep original term_code for proper translation
                startDate = new Date(year, 0, 1).toISOString(); // January 1st
                endDate = new Date(year, 11, 31).toISOString(); // December 31st
              } else {
                // Handle YYYY-T# format (e.g., "2017-T1", "2017-T2")
                const termCodeMatch = review.term_code.match(/^(\d{4})-T([12])$/);
                if (termCodeMatch) {
                  const startYear = parseInt(termCodeMatch[1]);
                  const termNumber = termCodeMatch[2];
                  termName = review.term_code; // Keep original term_code for proper translation
                  if (termNumber === '1') {
                    startDate = new Date(startYear, 8, 1).toISOString(); // September 1st
                    endDate = new Date(startYear + 1, 0, 31).toISOString(); // January 31st next year
                  } else {
                    startDate = new Date(startYear, 1, 1).toISOString(); // February 1st
                    endDate = new Date(startYear, 5, 30).toISOString(); // June 30th
                  }
                } else {
                  // Try to parse standard term format (e.g., "2023S1", "2024S2")
                  const termMatch = review.term_code.match(/^(\d{4})S([12])$/);
                  if (termMatch) {
                    const year = termMatch[1];
                    const semester = termMatch[2];
                    termName = `${year}年第${semester}學期`;
                    const startYear = parseInt(year);
                    if (semester === '1') {
                      startDate = new Date(startYear, 8, 1).toISOString(); // September 1st
                      endDate = new Date(startYear + 1, 0, 31).toISOString(); // January 31st next year
                    } else {
                      startDate = new Date(startYear, 1, 1).toISOString(); // February 1st
                      endDate = new Date(startYear, 5, 30).toISOString(); // June 30th
                    }
                  } else {
                    // Keep original term_code for unrecognized formats
                    termName = review.term_code; // This will be handled by getTermName() function
                  }
                }
              }
            }
            
            // Create fallback term object
            finalTerm = {
              $id: `fallback_${review.term_code}`,
              term_code: review.term_code,
              name: termName,
              start_date: startDate,
              end_date: endDate,
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString()
            } as Term;
          }

          // 解析講師詳情並找到該講師的評價
          let instructorDetail: InstructorDetail | null = null;
          try {
            const instructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
            instructorDetail = instructorDetails.find(detail => detail.instructor_name === instructorName) || null;
          } catch (error) {
            return null;
          }

          if (!instructorDetail) {
            return null;
          }

          return {
            review,
            course: finalCourse,
            term: finalTerm,
            instructorDetail
          };
        })
        .filter((info): info is NonNullable<typeof info> => info !== null)
        .sort((a, b) => new Date(b.review.$createdAt).getTime() - new Date(a.review.$createdAt).getTime()); // 按時間排序

      // 緩存結果
      this.setCached(cacheKey, reviewsWithInfo, 5 * 60 * 1000); // 5分鐘緩存
      
      return reviewsWithInfo;
    } catch (error) {
      console.error('Error fetching instructor reviews (optimized):', error);
      throw new Error('Failed to fetch instructor reviews');
    }
  }

  /**
   * 獲取課程教學信息（超級優化版本）
   * 批量獲取所有相關講師和學期信息，大幅減少 API 調用
   */
  static async getCourseTeachingInfoOptimized(courseCode: string): Promise<CourseTeachingInfo[]> {
    try {
      const cacheKey = `course_teaching_info_optimized_${courseCode}`;
      
      // 檢查緩存
      const cached = this.getCached<CourseTeachingInfo[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // 獲取課程的教學記錄
      const teachingRecords = await this.getCourseTeachingRecords(courseCode);
      
      if (teachingRecords.length === 0) {
        return [];
      }

      // 獲取所有唯一的講師名稱和學期代碼，過濾掉空白的講師名稱
      const allInstructorNames = teachingRecords.map(record => record.instructor_name);
      const uniqueValidInstructorNames = [...new Set(allInstructorNames.filter(name => name && name.trim() !== ''))];
      const uniqueTermCodes = [...new Set(teachingRecords.map(record => record.term_code))];
      
      // 並行批量獲取所有講師和學期信息（只查詢有效的講師名稱）
      const [instructorsResponse, termsResponse] = await Promise.all([
        uniqueValidInstructorNames.length > 0 ? databases.listDocuments(
          this.DATABASE_ID,
          this.INSTRUCTORS_COLLECTION_ID,
          [
            Query.equal('name', uniqueValidInstructorNames),
            Query.limit(uniqueValidInstructorNames.length),
            Query.select(['$id', 'name', 'name_tc', 'name_sc', 'email', 'department'])
          ]
        ) : Promise.resolve({ documents: [] }),
        databases.listDocuments(
          this.DATABASE_ID,
          this.TERMS_COLLECTION_ID,
          [
            Query.equal('term_code', uniqueTermCodes),
            Query.limit(uniqueTermCodes.length),
            Query.select(['$id', 'term_code', 'name', 'start_date', 'end_date'])
          ]
        )
      ]);

      // 創建快速查找映射
      const instructorsMap = new Map<string, Instructor>();
      const termsMap = new Map<string, Term>();
      
      (instructorsResponse.documents as unknown as Instructor[]).forEach(instructor => {
        instructorsMap.set(instructor.name, instructor);
      });
      
      // 為空白或無效的講師名稱創建一個預設的講師物件
      const unknownInstructor: Instructor = {
        $id: 'unknown-instructor',
        name: 'UNKNOWN',
        name_tc: '未知教師',
        name_sc: '未知教师',
        title: '',
        nickname: '',
        email: '',
        department: '',
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString()
      };
      
      (termsResponse.documents as unknown as Term[]).forEach(term => {
        termsMap.set(term.term_code, term);
      });

      // 組合教學信息
      const teachingInfo = teachingRecords
        .map((record) => {
          // 處理講師：如果講師名稱空白或無效，使用預設的未知講師
          let instructor = instructorsMap.get(record.instructor_name);
          if (!instructor && (!record.instructor_name || record.instructor_name.trim() === '')) {
            instructor = unknownInstructor;
          }
          
          const term = termsMap.get(record.term_code);

          // 如果找不到講師或學期，跳過此記錄
          if (!instructor || !term) {
            return null;
          }

          return {
            term,
            instructor,
            sessionType: record.session_type,
            teachingLanguage: record.teaching_language
          };
        })
        .filter((info): info is NonNullable<typeof info> => info !== null)
        .sort((a, b) => {
          // 先按學期排序（最新在前），再按課程類型排序
          const termComparison = b.term.term_code.localeCompare(a.term.term_code);
          if (termComparison !== 0) return termComparison;
          return a.sessionType.localeCompare(b.sessionType);
        });

      // 緩存結果
      this.setCached(cacheKey, teachingInfo, 10 * 60 * 1000); // 10分鐘緩存
      
      return teachingInfo;
    } catch (error) {
      console.error('Error fetching course teaching info (optimized):', error);
      throw new Error('Failed to fetch course teaching information');
    }
  }

  /**
   * 獲取課程評論（超級優化版本，包含投票信息）
   * 批量獲取所有相關學期信息，大幅減少 API 調用
   */
  static async getCourseReviewsWithVotesOptimized(courseCode: string, userId?: string, language?: string): Promise<(CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]> {
    try {
      // Clear cache for debugging if this is ACT2200
      if (courseCode === 'ACT2200') {
        console.log('=== DEBUG: Fetching reviews for ACT2200 ===');
        
        // Clear all ACT2200 related caches for debugging
        const possibleCacheKeys = [
          `course_reviews_votes_optimized_ACT2200_${userId || 'anonymous'}_${language || 'all'}`,
          `course_reviews_votes_optimized_ACT2200_${userId || 'anonymous'}_undefined`,
          `course_reviews_votes_optimized_ACT2200_anonymous_${language || 'all'}`,
          `course_reviews_votes_optimized_ACT2200_anonymous_undefined`,
        ];
        
        possibleCacheKeys.forEach(key => {
          if (this.cache.has(key)) {
            console.log('DEBUG: Clearing cache for key:', key);
            this.cache.delete(key);
          }
        });
      }

      const cacheKey = `course_reviews_votes_optimized_${courseCode}_${userId || 'anonymous'}_${language || 'all'}`;
      
      // 檢查緩存（較短緩存時間，因為包含用戶投票信息）
      const cached = this.getCached<(CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // 構建查詢條件
      const queries = [
        Query.equal('course_code', courseCode),
        Query.orderDesc('$createdAt'),
        Query.limit(300),
        Query.select(['$id', 'user_id', 'is_anon', 'username', 'course_code', 'term_code', 
                     'course_workload', 'course_difficulties', 'course_usefulness', 
                     'course_final_grade', 'course_comments', 'submitted_at', 'instructor_details', 'review_language', '$createdAt'])
      ];
      
      // 添加語言過濾器
      if (language) {
        queries.push(Query.equal('review_language', language));
      }
      
      // 獲取評論
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        queries
      );

      const reviews = response.documents as unknown as Review[];
      
      if (reviews.length === 0) {
        return [];
      }

      // 獲取所有唯一的學期代碼
      const uniqueTermCodes = [...new Set(reviews.map(review => review.term_code))];
      const reviewIds = reviews.map(review => review.$id);
      
      // 並行批量獲取學期信息、投票統計和用戶投票
      const [termsResponse, voteStatsMap, userVotesMap] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.TERMS_COLLECTION_ID,
          [
            Query.equal('term_code', uniqueTermCodes),
            Query.limit(uniqueTermCodes.length),
            Query.select(['$id', 'term_code', 'name', 'start_date', 'end_date'])
          ]
        ),
        this.getBatchReviewVoteStats(reviewIds),
        userId ? this.getBatchUserVotesForReviews(reviewIds, userId) : Promise.resolve(new Map())
      ]);

      // 創建學期查找映射
      const termsMap = new Map<string, Term>();
      (termsResponse.documents as unknown as Term[]).forEach(term => {
        termsMap.set(term.term_code, term);
      });

      // 處理評論信息
      const reviewsWithInfo = reviews
        .map((review) => {
          let term = termsMap.get(review.term_code);

          // Handle missing terms by creating a fallback term object
          if (!term) {
            console.warn(`CourseService: Creating fallback term for missing term_code: "${review.term_code}" in course ${courseCode}`);
            
            // Create a fallback term for missing term records
            let termName = review.term_code;
            let startDate = '2021-01-01T00:00:00.000Z';
            let endDate = '2021-12-31T23:59:59.999Z';
            
            // Handle special term codes
            const yearOnOrBeforeMatch = review.term_code.match(/^(\d{4})_on_or_before$/);
            if (yearOnOrBeforeMatch) {
              const year = yearOnOrBeforeMatch[1];
              termName = review.term_code; // Keep original term_code for proper translation
              startDate = '2000-01-01T00:00:00.000Z';
              endDate = `${year}-12-31T23:59:59.999Z`;
            } else if (review.term_code === 'historical') {
              termName = '歷史記錄';
              startDate = '2000-01-01T00:00:00.000Z';
              endDate = '2020-12-31T23:59:59.999Z';
            } else {
              // Handle YYYY-T# format (e.g., "2017-T1", "2017-T2")
              const termCodeMatch = review.term_code.match(/^(\d{4})-T([12])$/);
              if (termCodeMatch) {
                const year = termCodeMatch[1];
                const termNumber = termCodeMatch[2];
                termName = review.term_code; // Keep original term_code for proper translation
                if (termNumber === '1') {
                  startDate = `${year}-09-01T00:00:00.000Z`;
                  endDate = `${year}-12-31T23:59:59.999Z`;
                } else {
                  startDate = `${year}-01-01T00:00:00.000Z`;
                  endDate = `${year}-05-31T23:59:59.999Z`;
                }
              } else {
                // Try to parse standard term codes like "2023S1", "2024S2", etc.
                const termMatch = review.term_code.match(/^(\d{4})(S[12])?$/);
                if (termMatch) {
                  const year = termMatch[1];
                  const semester = termMatch[2];
                  if (semester === 'S1') {
                    termName = `${year}年第一學期`;
                    startDate = `${year}-09-01T00:00:00.000Z`;
                    endDate = `${year}-12-31T23:59:59.999Z`;
                  } else if (semester === 'S2') {
                    termName = `${year}年第二學期`;
                    startDate = `${year}-01-01T00:00:00.000Z`;
                    endDate = `${year}-05-31T23:59:59.999Z`;
                  } else {
                    // Handle simple year format (e.g., "2017") - keep original term_code
                    termName = review.term_code;
                    startDate = `${year}-01-01T00:00:00.000Z`;
                    endDate = `${year}-12-31T23:59:59.999Z`;
                  }
                }
              }
            }
            
            term = {
              $id: `fallback_${review.term_code}`,
              term_code: review.term_code,
              name: termName,
              start_date: startDate,
              end_date: endDate,
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString()
            } as Term;
            
          }

          // 解析講師詳情
          let instructorDetails: InstructorDetail[] = [];
          try {
            instructorDetails = JSON.parse(review.instructor_details);
          } catch (error) {
            console.error('Error parsing instructor_details:', error);
          }

          // 獲取投票信息
          const voteStats = voteStatsMap.get(review.$id) || { upvotes: 0, downvotes: 0 };
          const userVote = userId ? userVotesMap.get(review.$id) : undefined;

          return {
            review,
            term,
            instructorDetails,
            upvotes: voteStats.upvotes,
            downvotes: voteStats.downvotes,
            userVote
          };
        })
        .filter((info): info is NonNullable<typeof info> => info !== null)
        .sort((a, b) => new Date(b.review.$createdAt).getTime() - new Date(a.review.$createdAt).getTime());


      // 緩存結果（較短時間，因為包含用戶特定數據）
      this.setCached(cacheKey, reviewsWithInfo, 2 * 60 * 1000); // 2分鐘緩存
      
      return reviewsWithInfo;
    } catch (error) {
      console.error('Error fetching course reviews with votes (optimized):', error);
      throw new Error('Failed to fetch course reviews');
    }
  }

  /**
   * Check if a user can submit a review for a specific course
   * Rules:
   * - Maximum 7 reviews per user per term (because students can only register max 7 courses per term)
   * - Normal case: 1 review per user per course
   * - Exception: If first review has fail grade, user can submit 1 more review
   * - Maximum 2 reviews total per user per course
   */
  static async canUserSubmitReview(userId: string, courseCode: string, termCode: string): Promise<{
    canSubmit: boolean;
    reason?: string;
    existingReviews: Review[];
    termReviewCount?: number;
  }> {
    try {
      // First check: Maximum 7 reviews per term limit
      const termReviewsResponse = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('term_code', termCode),
          Query.select(['$id', 'user_id', 'term_code', 'course_code']),
          Query.limit(10) // Should never exceed 7, but set reasonable limit
        ]
      );

      const termReviews = termReviewsResponse.documents as unknown as Review[];
      
      // If user already has 7 reviews in this term, they cannot submit more
      if (termReviews.length >= 7) {
        return {
          canSubmit: false,
          reason: 'review.termLimitExceeded',
          existingReviews: [],
          termReviewCount: termReviews.length
        };
      }

      // Second check: Per-course limit (existing logic)
      // Get all reviews by this user for this specific course
      const courseReviewsResponse = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('course_code', courseCode),
          Query.orderAsc('$createdAt'), // Order by creation time to identify first review
          Query.limit(10), // Should never have more than 2 reviews per user per course
          Query.select(['$id', 'user_id', 'course_code', 'course_final_grade', '$createdAt'])
        ]
      );

      const existingReviews = courseReviewsResponse.documents as unknown as Review[];
      
      // If no existing reviews for this course, user can submit
      if (existingReviews.length === 0) {
        return {
          canSubmit: true,
          existingReviews: [],
          termReviewCount: termReviews.length
        };
      }

      // If user has 2 or more reviews already for this course, they cannot submit more
      if (existingReviews.length >= 2) {
        return {
          canSubmit: false,
          reason: 'review.limitExceeded',
          existingReviews,
          termReviewCount: termReviews.length
        };
      }

      // If user has exactly 1 review for this course
      if (existingReviews.length === 1) {
        const firstReview = existingReviews[0];
        const firstGrade = firstReview.course_final_grade;
        
        // Check if the first review has a fail grade
        // Only F (Failure) grade allows for a second review submission
        const failGrades = ['F'];
        const isFirstReviewFail = failGrades.includes(firstGrade);
        
        if (isFirstReviewFail) {
          return {
            canSubmit: true,
            existingReviews,
            termReviewCount: termReviews.length
          };
        } else {
          return {
            canSubmit: false,
            reason: 'review.limitReachedWithPass',
            existingReviews,
            termReviewCount: termReviews.length
          };
        }
      }

      // This should never happen, but return safe default
      return {
        canSubmit: false,
        reason: 'review.unknownError',
        existingReviews,
        termReviewCount: termReviews.length
      };

    } catch (error) {
      console.error('Error checking user review eligibility:', error);
      // In case of error, allow submission (fail safe)
      return {
        canSubmit: true,
        existingReviews: [],
        termReviewCount: 0
      };
    }
  }

  /**
   * Get user's existing reviews for a specific course
   */
  static async getUserReviewsForCourse(userId: string, courseCode: string): Promise<Review[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.equal('course_code', courseCode),
          Query.orderDesc('$createdAt'),
          Query.limit(10)
        ]
      );

      return response.documents as unknown as Review[];
    } catch (error) {
      console.error('Error fetching user reviews for course:', error);
      return [];
    }
  }

  /**
   * 獲取課程在當前學期的教學語言
   */
  static async getCourseCurrentTermTeachingLanguage(courseCode: string): Promise<string | null> {
    try {
      const currentTermCode = getCurrentTermCode();
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.equal('term_code', currentTermCode),
          Query.select(['teaching_language']),
          Query.limit(1)
        ]
      );

      if (response.documents.length > 0) {
        const record = response.documents[0] as unknown as TeachingRecord;
        return record.teaching_language;
      }

      return null;
    } catch (error) {
      console.error('Error fetching current term teaching language:', error);
      return null;
    }
  }

  /**
   * 批量獲取多個課程在當前學期的教學語言
   */
  static async getBatchCourseCurrentTermTeachingLanguages(courseCodes: string[]): Promise<Map<string, string | null>> {
    try {
      const currentTermCode = getCurrentTermCode();
      const cacheKey = `batch_current_term_teaching_languages_${currentTermCode}`;
      
      // 檢查緩存
      const cached = this.getCached<Map<string, string | null>>(cacheKey);
      if (cached) {
        return cached;
      }

      if (courseCodes.length === 0) {
        return new Map();
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCodes),
          Query.equal('term_code', currentTermCode),
          Query.select(['course_code', 'teaching_language']),
          Query.limit(courseCodes.length)
        ]
      );

      const teachingLanguagesMap = new Map<string, string | null>();
      
      // 初始化所有課程為 null
      courseCodes.forEach(courseCode => {
        teachingLanguagesMap.set(courseCode, null);
      });

      // 填入找到的教學語言
      response.documents.forEach((doc: any) => {
        const record = doc as unknown as TeachingRecord;
        teachingLanguagesMap.set(record.course_code, record.teaching_language);
      });

      // 緩存結果
      this.setCached(cacheKey, teachingLanguagesMap, 5 * 60 * 1000); // 5分鐘緩存

      return teachingLanguagesMap;
    } catch (error) {
      console.error('Error fetching batch current term teaching languages:', error);
      return new Map();
    }
  }

  /**
   * 批量獲取課程的服務學習類型
   * 返回每個課程的所有服務學習類型（按時間順序）
   */
  static async getBatchCourseServiceLearning(courseCodes: string[]): Promise<Map<string, ('compulsory' | 'optional')[]>> {
    try {
      if (courseCodes.length === 0) {
        return new Map();
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCodes),
          Query.orderAsc('$createdAt'),
          Query.select(['course_code', 'service_learning', '$createdAt']),
          Query.limit(1000) // Reasonable limit for batch processing
        ]
      );

      const teachingRecords = response.documents as unknown as (TeachingRecord & { service_learning: string | null })[];
      
      // Group by course code and maintain chronological order
      const courseServiceLearningMap = new Map<string, ('compulsory' | 'optional')[]>();
      
      // Initialize maps for each course
      courseCodes.forEach(courseCode => {
        courseServiceLearningMap.set(courseCode, []);
      });
      
      // Process records by course
      const recordsByCourse = new Map<string, (TeachingRecord & { service_learning: string | null })[]>();
      teachingRecords.forEach(record => {
        if (!recordsByCourse.has(record.course_code)) {
          recordsByCourse.set(record.course_code, []);
        }
        recordsByCourse.get(record.course_code)!.push(record);
      });
      
      // Extract unique service learning types for each course in chronological order
      recordsByCourse.forEach((records, courseCode) => {
        const seenTypes = new Set<string>();
        const orderedTypes: ('compulsory' | 'optional')[] = [];
        
        records.forEach(record => {
          if (record.service_learning && 
              (record.service_learning === 'compulsory' || record.service_learning === 'optional') &&
              !seenTypes.has(record.service_learning)) {
            seenTypes.add(record.service_learning);
            orderedTypes.push(record.service_learning as 'compulsory' | 'optional');
          }
        });
        
        courseServiceLearningMap.set(courseCode, orderedTypes);
      });

      return courseServiceLearningMap;
    } catch (error) {
      console.error('Error fetching batch course service learning:', error);
      return new Map();
    }
  }

  /**
   * 批量獲取當前學期課程的服務學習類型
   */
  static async getBatchCourseCurrentTermServiceLearning(courseCodes: string[]): Promise<Map<string, ('compulsory' | 'optional') | null>> {
    try {
      const currentTermCode = getCurrentTermCode();
      const cacheKey = `batch_current_term_service_learning_${currentTermCode}`;
      
      // 檢查緩存
      const cached = this.getCached<Map<string, ('compulsory' | 'optional') | null>>(cacheKey);
      if (cached) {
        return cached;
      }

      if (courseCodes.length === 0) {
        return new Map();
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCodes),
          Query.equal('term_code', currentTermCode),
          Query.select(['course_code', 'service_learning']),
          Query.limit(courseCodes.length)
        ]
      );

      const serviceLearningMap = new Map<string, ('compulsory' | 'optional') | null>();
      
      // 初始化所有課程為 null
      courseCodes.forEach(courseCode => {
        serviceLearningMap.set(courseCode, null);
      });

      // 填入找到的服務學習類型
      response.documents.forEach((doc: any) => {
        const record = doc as unknown as TeachingRecord;
        if (record.service_learning === 'compulsory' || record.service_learning === 'optional') {
          serviceLearningMap.set(record.course_code, record.service_learning as 'compulsory' | 'optional');
        }
      });

      // 緩存結果
      this.setCached(cacheKey, serviceLearningMap, 5 * 60 * 1000); // 5分鐘緩存

      return serviceLearningMap;
    } catch (error) {
      console.error('Error fetching batch current term service learning:', error);
      return new Map();
    }
  }

  /**
   * Get teaching languages for a course from teaching records (chronological order)
   */
  static async getCourseTeachingLanguages(courseCode: string): Promise<string[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.orderAsc('$createdAt'), // Order by creation time to get chronological order
          Query.select(['teaching_language'])
        ]
      );

      const teachingRecords = response.documents as unknown as TeachingRecord[];
      
      // Extract unique teaching languages while preserving chronological order
      const seenLanguages = new Set<string>();
      const orderedLanguages: string[] = [];
      
      teachingRecords.forEach(record => {
        if (record.teaching_language && !seenLanguages.has(record.teaching_language)) {
          seenLanguages.add(record.teaching_language);
          orderedLanguages.push(record.teaching_language);
        }
      });

      return orderedLanguages;
    } catch (error) {
      console.error('Error fetching course teaching languages:', error);
      return [];
    }
  }

  /**
   * Get teaching languages for multiple courses (batch)
   */
  static async getBatchCourseTeachingLanguages(courseCodes: string[]): Promise<Map<string, string[]>> {
    try {
      if (courseCodes.length === 0) {
        console.log('🔍 getBatchCourseTeachingLanguages: No course codes provided');
        return new Map();
      }

      console.log(`🔍 getBatchCourseTeachingLanguages: Fetching teaching languages for ${courseCodes.length} courses`);
      console.log('📝 First 5 course codes:', courseCodes.slice(0, 5));

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCodes),
          Query.orderAsc('$createdAt'),
          Query.select(['course_code', 'teaching_language', '$createdAt']),
          Query.limit(1000) // Reasonable limit for batch processing
        ]
      );

      console.log(`🔍 getBatchCourseTeachingLanguages: Found ${response.documents.length} teaching records`);

      const teachingRecords = response.documents as unknown as (TeachingRecord & { teaching_language: string })[];
      
      // Group by course code and maintain chronological order
      const courseLanguagesMap = new Map<string, string[]>();
      
      // Initialize maps for each course
      courseCodes.forEach(courseCode => {
        courseLanguagesMap.set(courseCode, []);
      });
      
      // Process records by course
      const recordsByCourse = new Map<string, (TeachingRecord & { teaching_language: string })[]>();
      teachingRecords.forEach(record => {
        if (!recordsByCourse.has(record.course_code)) {
          recordsByCourse.set(record.course_code, []);
        }
        recordsByCourse.get(record.course_code)!.push(record);
      });
      
      // Extract unique teaching languages for each course in chronological order
      recordsByCourse.forEach((records, courseCode) => {
        const seenLanguages = new Set<string>();
        const orderedLanguages: string[] = [];
        
        records.forEach(record => {
          if (record.teaching_language && !seenLanguages.has(record.teaching_language)) {
            seenLanguages.add(record.teaching_language);
            orderedLanguages.push(record.teaching_language);
          }
        });
        
        courseLanguagesMap.set(courseCode, orderedLanguages);
      });

      console.log(`🎯 getBatchCourseTeachingLanguages: Returning ${courseLanguagesMap.size} courses with language data`);
      
      // 計算每種語言的課程數量用於調試
      const languageStats = { 'E': 0, 'C': 0, 'P': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
      let coursesWithLanguages = 0;
      
      courseLanguagesMap.forEach((languages, courseCode) => {
        if (languages.length > 0) {
          coursesWithLanguages++;
          languages.forEach(lang => {
            if (languageStats.hasOwnProperty(lang)) {
              languageStats[lang]++;
            }
          });
        }
      });
      
      console.log(`🔢 getBatchCourseTeachingLanguages statistics:`);
      console.log(`📊 Total courses with languages: ${coursesWithLanguages}/${courseLanguagesMap.size}`);
      console.log(`📈 Language distribution:`, languageStats);
      
      // 輸出前5個課程的語言數據作為調試
      const first5 = Array.from(courseLanguagesMap.entries()).slice(0, 5);
      console.log('📝 Sample language mapping:', first5);

      return courseLanguagesMap;
    } catch (error) {
      console.error('Error fetching batch course teaching languages:', error);
      return new Map();
    }
  }

  /**
   * Get teaching language for a specific instructor detail
   * Based on course code, term code, instructor name, and session type
   */
  static async getInstructorDetailTeachingLanguage(
    courseCode: string, 
    termCode: string, 
    instructorName: string, 
    sessionType: string
  ): Promise<string | null> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.equal('term_code', termCode),
          Query.equal('instructor_name', instructorName),
          Query.equal('session_type', sessionType),
          Query.select(['teaching_language']),
          Query.limit(1)
        ]
      );

      if (response.documents.length > 0) {
        const record = response.documents[0] as unknown as TeachingRecord;
        return record.teaching_language;
      }

      return null;
    } catch (error) {
      console.error('Error fetching instructor detail teaching language:', error);
      return null;
    }
  }

  // =====================================================
  // 🚀 OPTIMIZED CACHED STATISTICS METHODS
  // =====================================================

  /**
   * Get all teaching records with caching - optimized for multiple statistics calls
   * This method loads all teaching records once and caches them for reuse
   */
  static async getAllTeachingRecordsCached(): Promise<Array<{
    course_code: string;
    teaching_language: string;
    term_code: string;
    service_learning: string | null;
  }>> {
    // Check cache first
    const cachedData = courseStatsCache.get(CACHE_KEYS.ALL_TEACHING_RECORDS);
    if (cachedData) {
      console.log('✅ Using cached teaching records');
      return cachedData;
    }

    try {
      console.log('🔄 Loading teaching records from database...');
      
      // Load all teaching records in one query
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.select(['course_code', 'teaching_language', 'term_code', 'service_learning']),
          Query.limit(10000) // Large limit to get all records
        ]
      );

      const teachingRecords = response.documents as unknown as Array<{
        course_code: string;
        teaching_language: string;
        term_code: string;
        service_learning: string | null;
      }>;

      // Cache the data
      courseStatsCache.set(CACHE_KEYS.ALL_TEACHING_RECORDS, teachingRecords, CACHE_TTL.TEACHING_RECORDS);
      
      console.log(`✅ Loaded ${teachingRecords.length} teaching records and cached them`);
      return teachingRecords;
    } catch (error) {
      console.error('Error fetching teaching records:', error);
      return [];
    }
  }

  /**
   * 🚀 OPTIMIZED: Get teaching language statistics based on current courses array
   * Uses ONLY real database data from teaching records
   * Returns count of courses that teach in each language
   */
  static getTeachingLanguageStatisticsForCourses(courses: any[]): { [key: string]: number } {
    const languageCounts: { [key: string]: number } = {
      'E': 0, 'C': 0, 'P': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
    };

    try {
      console.log('🔍 Computing teaching language statistics for', courses.length, 'courses');
      
      let coursesWithLanguages = 0;
      courses.forEach(course => {
        // Only count courses with real teaching language data
        if (course.teachingLanguages && course.teachingLanguages.length > 0) {
          coursesWithLanguages++;
          const courseLanguages = course.teachingLanguages;
          
          // Count each language for this course
          courseLanguages.forEach(langCode => {
            if (languageCounts.hasOwnProperty(langCode)) {
              languageCounts[langCode]++;
            }
          });
        }
        // If no real teaching language data, skip this course entirely
      });

      console.log(`📊 Found ${coursesWithLanguages} courses with teaching language data out of ${courses.length} total`);
      console.log('🎯 Language counts:', languageCounts);
      
      return languageCounts;
    } catch (error) {
      console.error('Error computing teaching language statistics for courses:', error);
      return { 'E': 0, 'C': 0, 'P': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    }
  }



  /**
   * 🚀 OPTIMIZED: Get teaching language statistics using cached data (DEPRECATED)
   * Returns count of courses that teach in each language
   */
  static async getTeachingLanguageStatisticsOptimized(): Promise<{ [key: string]: number }> {
    // Check cache first
    const cachedStats = courseStatsCache.get(CACHE_KEYS.TEACHING_LANGUAGE_STATS);
    if (cachedStats) {
      console.log('✅ Using cached teaching language statistics');
      return cachedStats;
    }

    try {
      console.log('📊 Computing teaching language statistics...');
      
      // Get cached teaching records
      const teachingRecords = await this.getAllTeachingRecordsCached();

      // Group by course to avoid double counting
      const courseLanguages = new Map<string, Set<string>>();
      
      teachingRecords.forEach(record => {
        if (record.teaching_language) {
          // 🐛 FIX: Convert course code to lowercase for case-insensitive comparison
          const lowerCourseCode = record.course_code.toLowerCase();
          if (!courseLanguages.has(lowerCourseCode)) {
            courseLanguages.set(lowerCourseCode, new Set());
          }
          courseLanguages.get(lowerCourseCode)!.add(record.teaching_language);
        }
      });

      // Count courses for each language
      const languageCounts: { [key: string]: number } = {
        'E': 0, 'C': 0, 'P': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
      };

      courseLanguages.forEach((languages) => {
        languages.forEach(language => {
          if (languageCounts.hasOwnProperty(language)) {
            languageCounts[language]++;
          }
        });
      });

      // Cache the results
      courseStatsCache.set(CACHE_KEYS.TEACHING_LANGUAGE_STATS, languageCounts, CACHE_TTL.STATS);
      
      console.log('✅ Teaching language statistics computed and cached');
      return languageCounts;
    } catch (error) {
      console.error('Error computing teaching language statistics:', error);
      return { 'E': 0, 'C': 0, 'P': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    }
  }

  /**
   * 🚀 OPTIMIZED: Get offered term statistics based on current courses array
   * This matches exactly with the actual filtering logic used in the frontend
   * Returns count of courses offered in each term
   */
  static async getOfferedTermStatisticsForCourses(courses: any[]): Promise<{ [key: string]: number }> {
    try {
      console.log('📊 Computing offered term statistics for current courses...');
      
      // Get cached teaching records
      const teachingRecords = await this.getAllTeachingRecordsCached();
      
      // 🐛 FIX: Create a set of current course codes in lowercase for case-insensitive lookup
      const currentCourseCodes = new Set(courses.map(course => course.course_code.toLowerCase()));
      
      // Group by course and term, but only for courses that are in the current array
      const courseTerms = new Map<string, Set<string>>();
      
      teachingRecords.forEach(record => {
        // 🐛 FIX: Convert teaching record course code to lowercase for case-insensitive comparison  
        const lowerCourseCode = record.course_code.toLowerCase();
        if (record.term_code && currentCourseCodes.has(lowerCourseCode)) {
          if (!courseTerms.has(lowerCourseCode)) {
            courseTerms.set(lowerCourseCode, new Set());
          }
          courseTerms.get(lowerCourseCode)!.add(record.term_code);
        }
      });

      // Count courses for each term
      const termCounts: { [key: string]: number } = {};

      courseTerms.forEach((terms) => {
        terms.forEach(term => {
          termCounts[term] = (termCounts[term] || 0) + 1;
        });
      });
      
      // Also include current term based on isOfferedInCurrentTerm property  
      // But avoid double counting if the course already has teaching records for current term
      const currentTermCode = getCurrentTermCode();
      const coursesWithCurrentTermRecords = new Set<string>();
      
      // Track which courses already have teaching records for current term
      teachingRecords.forEach(record => {
        if (record.term_code === currentTermCode) {
          // 🐛 FIX: Convert to lowercase for case-insensitive comparison
          coursesWithCurrentTermRecords.add(record.course_code.toLowerCase());
        }
      });
      
      // Add courses that are offered in current term but don't have teaching records  
      courses.forEach(course => {
        // 🐛 FIX: Convert course code to lowercase for case-insensitive comparison
        const lowerCourseCode = course.course_code.toLowerCase();
        if (course.isOfferedInCurrentTerm && !coursesWithCurrentTermRecords.has(lowerCourseCode)) {
          termCounts[currentTermCode] = (termCounts[currentTermCode] || 0) + 1;
        }
      });
      
      console.log('✅ Term statistics computed for current courses');
      return termCounts;
    } catch (error) {
      console.error('Error computing term statistics for courses:', error);
      return {};
    }
  }

  /**
   * 🚀 OPTIMIZED: Get offered term statistics using cached data (DEPRECATED)
   * Returns count of courses offered in each term
   */
  static async getOfferedTermStatisticsOptimized(): Promise<{ [key: string]: number }> {
    // Check cache first
    const cachedStats = courseStatsCache.get(CACHE_KEYS.OFFERED_TERM_STATS);
    if (cachedStats) {
      console.log('✅ Using cached term statistics');
      return cachedStats;
    }

    try {
      console.log('📊 Computing offered term statistics...');
      
      // Get cached teaching records
      const teachingRecords = await this.getAllTeachingRecordsCached();

      // Group by course and term to avoid double counting
      const courseTerms = new Map<string, Set<string>>();
      
      teachingRecords.forEach(record => {
        if (record.term_code) {
          // 🐛 FIX: Convert course code to lowercase for case-insensitive comparison
          const lowerCourseCode = record.course_code.toLowerCase();
          if (!courseTerms.has(lowerCourseCode)) {
            courseTerms.set(lowerCourseCode, new Set());
          }
          courseTerms.get(lowerCourseCode)!.add(record.term_code);
        }
      });

      // Count courses for each term
      const termCounts: { [key: string]: number } = {};

      courseTerms.forEach((terms) => {
        terms.forEach(term => {
          termCounts[term] = (termCounts[term] || 0) + 1;
        });
      });

      // Cache the results
      courseStatsCache.set(CACHE_KEYS.OFFERED_TERM_STATS, termCounts, CACHE_TTL.STATS);
      
      console.log('✅ Term statistics computed and cached');
      return termCounts;
    } catch (error) {
      console.error('Error computing term statistics:', error);
      return {};
    }
  }

  /**
   * 🚀 OPTIMIZED: Get service learning statistics based on current courses array  
   * This matches exactly with the actual filtering logic used in the frontend
   * Returns count of courses with each service learning type
   */
  static getServiceLearningStatisticsForCourses(courses: any[]): { [key: string]: number } {
    const serviceLearningCounts: { [key: string]: number } = {
      'none': 0, 'optional': 0, 'compulsory': 0
    };

    try {
      courses.forEach(course => {
        // Use the same logic as actual filtering
        if (!course.serviceLearningTypes || course.serviceLearningTypes.length === 0) {
          // No service learning
          serviceLearningCounts['none']++;
        } else {
          // Has service learning types - count each type
          course.serviceLearningTypes.forEach((type: string) => {
            if (serviceLearningCounts.hasOwnProperty(type)) {
              serviceLearningCounts[type]++;
            }
          });
        }
      });

      return serviceLearningCounts;
    } catch (error) {
      console.error('Error computing service learning statistics for courses:', error);
      return { 'none': 0, 'optional': 0, 'compulsory': 0 };
    }
  }

  /**
   * 🚀 OPTIMIZED: Get service learning statistics using cached data (DEPRECATED)
   * Returns count of courses with each service learning type
   */
  static async getServiceLearningStatisticsOptimized(): Promise<{ [key: string]: number }> {
    // Check cache first
    const cachedStats = courseStatsCache.get(CACHE_KEYS.SERVICE_LEARNING_STATS);
    if (cachedStats) {
      console.log('✅ Using cached service learning statistics');
      return cachedStats;
    }

    try {
      console.log('📊 Computing service learning statistics...');
      
      // Get cached teaching records
      const teachingRecords = await this.getAllTeachingRecordsCached();

      // Group by course to avoid double counting
      const courseServiceLearning = new Map<string, Set<string>>();
      
      teachingRecords.forEach(record => {
        // 🐛 FIX: Convert course code to lowercase for case-insensitive comparison
        const lowerCourseCode = record.course_code.toLowerCase();
        if (!courseServiceLearning.has(lowerCourseCode)) {
          courseServiceLearning.set(lowerCourseCode, new Set());
        }
        
        // Handle service learning values
        const serviceType = record.service_learning || 'none';
        courseServiceLearning.get(lowerCourseCode)!.add(serviceType);
      });

      // Count courses for each service learning type
      const serviceLearningCounts: { [key: string]: number } = {
        'none': 0, 'optional': 0, 'compulsory': 0
      };

      courseServiceLearning.forEach((types) => {
        types.forEach(type => {
          if (serviceLearningCounts.hasOwnProperty(type)) {
            serviceLearningCounts[type]++;
          }
        });
      });

      // Cache the results
      courseStatsCache.set(CACHE_KEYS.SERVICE_LEARNING_STATS, serviceLearningCounts, CACHE_TTL.STATS);
      
      console.log('✅ Service learning statistics computed and cached');
      return serviceLearningCounts;
    } catch (error) {
      console.error('Error computing service learning statistics:', error);
      return { 'none': 0, 'optional': 0, 'compulsory': 0 };
    }
  }

  // =====================================================
  // 🐌 LEGACY STATISTICS METHODS (DEPRECATED)
  // =====================================================

  /**
   * Get teaching language statistics for all courses
   * Returns count of courses that teach in each language
   */
  static async getTeachingLanguageStatistics(): Promise<{ [key: string]: number }> {
    try {
      // Get all unique teaching language records
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.select(['course_code', 'teaching_language']),
          Query.limit(10000) // Large limit to get all records
        ]
      );

      const teachingRecords = response.documents as unknown as Array<{
        course_code: string;
        teaching_language: string;
      }>;

      // Group by course to avoid double counting
      const courseLanguages = new Map<string, Set<string>>();
      
      teachingRecords.forEach(record => {
        if (record.teaching_language) {
          // 🐛 FIX: Convert course code to lowercase for case-insensitive comparison
          const lowerCourseCode = record.course_code.toLowerCase();
          if (!courseLanguages.has(lowerCourseCode)) {
            courseLanguages.set(lowerCourseCode, new Set());
          }
          courseLanguages.get(lowerCourseCode)!.add(record.teaching_language);
        }
      });

      // Count courses for each language
      const languageCounts: { [key: string]: number } = {
        'E': 0,
        'C': 0, 
        'P': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0
      };

      courseLanguages.forEach((languages) => {
        languages.forEach(language => {
          if (languageCounts.hasOwnProperty(language)) {
            languageCounts[language]++;
          }
        });
      });

      return languageCounts;
    } catch (error) {
      console.error('Error fetching teaching language statistics:', error);
      return {
        'E': 0,
        'C': 0, 
        'P': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0
      };
    }
  }

  /**
   * Get offered term statistics for all courses
   * Returns count of courses offered in each term
   */
  static async getOfferedTermStatistics(): Promise<{ [key: string]: number }> {
    try {
      // Get all unique term records
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.select(['course_code', 'term_code']),
          Query.limit(10000) // Large limit to get all records
        ]
      );

      const teachingRecords = response.documents as unknown as Array<{
        course_code: string;
        term_code: string;
      }>;

      // Group by course and term to avoid double counting
      const courseTerms = new Map<string, Set<string>>();
      
      teachingRecords.forEach(record => {
        if (record.term_code) {
          // 🐛 FIX: Convert course code to lowercase for case-insensitive comparison
          const lowerCourseCode = record.course_code.toLowerCase();
          if (!courseTerms.has(lowerCourseCode)) {
            courseTerms.set(lowerCourseCode, new Set());
          }
          courseTerms.get(lowerCourseCode)!.add(record.term_code);
        }
      });

      // Count courses for each term
      const termCounts: { [key: string]: number } = {};

      courseTerms.forEach((terms) => {
        terms.forEach(term => {
          termCounts[term] = (termCounts[term] || 0) + 1;
        });
      });

      return termCounts;
    } catch (error) {
      console.error('Error fetching offered term statistics:', error);
      return {};
    }
  }

  /**
   * Get service learning statistics for all courses
   * Returns count of courses for each service learning type
   */
  static async getServiceLearningStatistics(): Promise<{ [key: string]: number }> {
    try {
      // Get all unique service learning records
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.select(['course_code', 'service_learning']),
          Query.limit(10000) // Large limit to get all records
        ]
      );

      const teachingRecords = response.documents as unknown as Array<{
        course_code: string;
        service_learning: string | null;
      }>;

      // Group by course to avoid double counting
      const courseServiceLearning = new Map<string, Set<string>>();
      
      teachingRecords.forEach(record => {
        // 🐛 FIX: Convert course code to lowercase for case-insensitive comparison
        const lowerCourseCode = record.course_code.toLowerCase();
        if (!courseServiceLearning.has(lowerCourseCode)) {
          courseServiceLearning.set(lowerCourseCode, new Set());
        }
        
        // Handle service learning values
        const serviceType = record.service_learning || 'none';
        courseServiceLearning.get(lowerCourseCode)!.add(serviceType);
      });

      // Count courses for each service learning type
      const serviceLearningCounts: { [key: string]: number } = {
        'none': 0,
        'optional': 0,
        'compulsory': 0
      };

      courseServiceLearning.forEach((types) => {
        types.forEach(type => {
          if (serviceLearningCounts.hasOwnProperty(type)) {
            serviceLearningCounts[type]++;
          }
        });
      });

      return serviceLearningCounts;
    } catch (error) {
      console.error('Error fetching service learning statistics:', error);
      return {
        'none': 0,
        'optional': 0,
        'compulsory': 0
      };
    }
  }

  /**
   * Batch get teaching languages for multiple instructor details
   * Optimized for performance when getting multiple instructor teaching languages at once
   */
  static async getBatchInstructorDetailTeachingLanguages(
    instructorDetails: Array<{
      courseCode: string;
      termCode: string;
      instructorName: string;
      sessionType: string;
    }>
  ): Promise<Map<string, string | null>> {
    try {
      if (instructorDetails.length === 0) {
        return new Map();
      }

      // Create unique identifiers and collect unique values for batch queries
      const uniqueCourseCodes = [...new Set(instructorDetails.map(detail => detail.courseCode))];
      const uniqueTermCodes = [...new Set(instructorDetails.map(detail => detail.termCode))];
      const uniqueInstructorNames = [...new Set(instructorDetails.map(detail => detail.instructorName))];
      const uniqueSessionTypes = [...new Set(instructorDetails.map(detail => detail.sessionType))];

      // Query all relevant teaching records
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('course_code', uniqueCourseCodes),
          Query.equal('term_code', uniqueTermCodes),
          Query.equal('instructor_name', uniqueInstructorNames),
          Query.equal('session_type', uniqueSessionTypes),
          Query.select(['course_code', 'term_code', 'instructor_name', 'session_type', 'teaching_language']),
          Query.limit(instructorDetails.length * 2) // Allow some buffer for multiple matches
        ]
      );

      const teachingRecords = response.documents as unknown as TeachingRecord[];
      
      // Create a map for quick lookup by composite key
      const recordsMap = new Map<string, string>();
      teachingRecords.forEach(record => {
        const key = `${record.course_code}|${record.term_code}|${record.instructor_name}|${record.session_type}`;
        recordsMap.set(key, record.teaching_language);
      });

      // Build result map
      const result = new Map<string, string | null>();
      instructorDetails.forEach(detail => {
        const key = `${detail.courseCode}|${detail.termCode}|${detail.instructorName}|${detail.sessionType}`;
        const teachingLanguage = recordsMap.get(key) || null;
        result.set(key, teachingLanguage);
      });

      return result;
    } catch (error) {
      console.error('Error fetching batch instructor detail teaching languages:', error);
      return new Map();
    }
  }

  /**
   * Get all teaching languages for an instructor across all courses and terms
   * Returns unique teaching language codes in chronological order
   */
  static async getInstructorTeachingLanguages(instructorName: string): Promise<string[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('instructor_name', instructorName),
          Query.orderAsc('term_code'), // Chronological order
          Query.limit(200), // Reasonable limit for instructor teaching records
          Query.select(['teaching_language', 'term_code'])
        ]
      );

      const teachingRecords = response.documents as unknown as TeachingRecord[];
      
      // Get unique teaching languages in chronological order
      const languageSet = new Set<string>();
      const languageOrder: string[] = [];
      
      teachingRecords.forEach(record => {
        if (record.teaching_language && !languageSet.has(record.teaching_language)) {
          languageSet.add(record.teaching_language);
          languageOrder.push(record.teaching_language);
        }
      });

      return languageOrder;
    } catch (error) {
      console.error('Error fetching instructor teaching languages:', error);
      return [];
    }
  }

  /**
   * Get teaching languages for multiple instructors in batch
   */
  static async getBatchInstructorTeachingLanguages(instructorNames: string[]): Promise<Map<string, string[]>> {
    if (instructorNames.length === 0) {
      return new Map();
    }

    try {
      // Fetch all teaching records for the specified instructors
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('instructor_name', instructorNames),
          Query.orderAsc('term_code'), // Chronological order
          Query.limit(this.MAX_TEACHING_RECORDS_LIMIT),
          Query.select(['instructor_name', 'teaching_language', 'term_code'])
        ]
      );

      const teachingRecords = response.documents as unknown as TeachingRecord[];
      
      // Group records by instructor
      const instructorRecordsMap = new Map<string, TeachingRecord[]>();
      teachingRecords.forEach(record => {
        if (!instructorRecordsMap.has(record.instructor_name)) {
          instructorRecordsMap.set(record.instructor_name, []);
        }
        instructorRecordsMap.get(record.instructor_name)!.push(record);
      });

      // Build result map with unique languages in chronological order
      const result = new Map<string, string[]>();
      
      instructorNames.forEach(instructorName => {
        const records = instructorRecordsMap.get(instructorName) || [];
        
        const languageSet = new Set<string>();
        const languageOrder: string[] = [];
        
        records.forEach(record => {
          if (record.teaching_language && !languageSet.has(record.teaching_language)) {
            languageSet.add(record.teaching_language);
            languageOrder.push(record.teaching_language);
          }
        });

        result.set(instructorName, languageOrder);
      });

      return result;
    } catch (error) {
      console.error('Error fetching batch instructor teaching languages:', error);
      return new Map();
    }
  }

  /**
   * Get current term teaching language for an instructor
   * Returns the teaching language this instructor is using in the current term
   */
  static async getInstructorCurrentTermTeachingLanguage(instructorName: string): Promise<string | null> {
    try {
      const currentTermCode = getCurrentTermCode();
      
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('instructor_name', instructorName),
          Query.equal('term_code', currentTermCode),
          Query.limit(1),
          Query.select(['teaching_language'])
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      const teachingRecord = response.documents[0] as unknown as TeachingRecord;
      return teachingRecord.teaching_language || null;
    } catch (error) {
      console.error('Error fetching instructor current term teaching language:', error);
      return null;
    }
  }

  /**
   * Get current term teaching languages for multiple instructors in batch
   */
  static async getBatchInstructorCurrentTermTeachingLanguages(instructorNames: string[]): Promise<Map<string, string | null>> {
    if (instructorNames.length === 0) {
      return new Map();
    }

    try {
      const currentTermCode = getCurrentTermCode();
      
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.TEACHING_RECORDS_COLLECTION_ID,
        [
          Query.equal('term_code', currentTermCode),
          Query.equal('instructor_name', instructorNames),
          Query.limit(200),
          Query.select(['instructor_name', 'teaching_language'])
        ]
      );

      const teachingRecords = response.documents as unknown as TeachingRecord[];
      
      // Build result map - use the first teaching language found for each instructor in current term
      const result = new Map<string, string | null>();
      
      // Initialize all instructors with null
      instructorNames.forEach(name => {
        result.set(name, null);
      });
      
      // Fill in actual values from teaching records
      teachingRecords.forEach(record => {
        if (record.teaching_language && !result.get(record.instructor_name)) {
          result.set(record.instructor_name, record.teaching_language);
        }
      });

      return result;
    } catch (error) {
      console.error('Error fetching batch instructor current term teaching languages:', error);
      return new Map();
    }
  }
} 

// 開發模式下將 CourseService 暴露到全局，方便調試
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).CourseService = CourseService;
}