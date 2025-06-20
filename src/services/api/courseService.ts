import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { getCurrentTermCode } from '@/utils/dateUtils';

export interface Course {
  $id: string;
  course_code: string;
  course_title: string;
  course_department: string;
  course_language: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CourseWithStats extends Course {
  reviewCount: number;
  averageRating: number;
  studentCount: number;
  isOfferedInCurrentTerm: boolean;
}

export interface CourseWithDetailedStats extends Course {
  reviewCount: number;
  averageRating: number;
  studentCount: number;
  isOfferedInCurrentTerm: boolean;
  averageWorkload: number;
  averageDifficulty: number;
  averageUsefulness: number;
}

export interface Instructor {
  $id: string;
  name: string;
  email: string;
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
}

export interface TeachingRecord {
  $id: string;
  course_code: string;
  term_code: string;
  instructor_name: string;
  session_type: string;
  email_override?: string;
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
  emailOverride?: string;
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
  has_service_learning: boolean;
  service_learning_description?: string;
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
  has_quiz: boolean;
  has_group_project: boolean;
  has_individual_assignment: boolean;
  has_presentation: boolean;
  has_reading: boolean;
  has_attendance_requirement: boolean;
  comments: string;
}

export interface InstructorTeachingCourse {
  course: Course;
  term: Term;
  sessionType: string;
  emailOverride?: string;
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
  private static readonly MAX_COURSES_LIMIT = 200; // 從 150 調整到 200，平衡性能和數據完整性
  private static readonly MAX_INSTRUCTORS_LIMIT = 200; // 從 150 調整到 200
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
          Query.select(['$id', 'course_code', 'course_title', 'course_department', 'course_language', '$createdAt', '$updatedAt'])
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
          Query.select(['$id', 'course_code', 'course_title', 'course_department', 'course_language']) // 只選擇搜尋需要的欄位
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
  }> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.limit(500),
          Query.select(['user_id', 'course_workload', 'course_difficulties', 'course_usefulness'])
        ]
      );

      const reviews = response.documents;
      const reviewCount = reviews.length;
      
      if (reviewCount === 0) {
        return {
          reviewCount: 0,
          averageRating: 0,
          studentCount: 0,
          averageWorkload: -1,
          averageDifficulty: -1,
          averageUsefulness: -1
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

              return {
          reviewCount,
          averageRating: averageUsefulness > 0 ? averageUsefulness : 0, // 使用實用性作為總體評分，但避免負數
          studentCount,
          averageWorkload,
          averageDifficulty,
          averageUsefulness
        };
    } catch (error) {
      console.error('Error fetching course detailed stats:', error);
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
   * 獲取帶統計信息的課程列表
   */
  static async getCoursesWithStats(): Promise<CourseWithStats[]> {
    try {
      const courses = await this.getAllCourses();
      const currentTermCode = getCurrentTermCode();
      
      // 並行獲取所有課程的統計信息和當前學期開設狀態
      const coursesWithStats = await Promise.all(
        courses.map(async (course) => {
          const [stats, isOfferedInCurrentTerm] = await Promise.all([
            this.getCourseStats(course.course_code),
            this.isCourseOfferedInTerm(course.course_code, currentTermCode)
          ]);
          
          return {
            ...course,
            ...stats,
            isOfferedInCurrentTerm
          };
        })
      );

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
          Query.select(['$id', 'name', 'email', '$createdAt', '$updatedAt']) // 只選擇基本講師信息
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
          Query.limit(1)
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
      
      // 並行獲取所有相關的講師和學期信息
      const teachingInfo = await Promise.all(
        teachingRecords.map(async (record) => {
          const [instructor, term] = await Promise.all([
            this.getInstructorByName(record.instructor_name),
            this.getTermByCode(record.term_code)
          ]);

          if (!instructor || !term) {
            return null;
          }

          return {
            term,
            instructor,
            sessionType: record.session_type,
            ...(record.email_override && { emailOverride: record.email_override })
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
          sessionType: record.session_type,
          ...(record.email_override && { emailOverride: record.email_override })
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
   * 創建新的評論
   */
  static async createReview(reviewData: Omit<Review, '$id' | '$createdAt' | '$updatedAt'>): Promise<Review> {
    try {
      const response = await databases.createDocument(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        'unique()', // 讓 Appwrite 自動生成 ID
        reviewData
      );

      return response as unknown as Review;
    } catch (error) {
      console.error('Error creating review:', error);
      throw new Error('Failed to create review');
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
                     'course_final_grade', 'course_comments', 'has_service_learning',
                     'service_learning_description', 'submitted_at', 'instructor_details', 'review_language', '$createdAt'])
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
                     'course_final_grade', 'course_comments', 'instructor_details', 'review_language', '$createdAt'])
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
          
          if (!term || !course) {
            return null;
          }

          // 解析講師詳情並找到該講師的資料
          let instructorDetails: InstructorDetail[] = [];
          try {
            const allInstructorDetails: InstructorDetail[] = JSON.parse(review.instructor_details);
            instructorDetails = allInstructorDetails.filter(detail => detail.instructor_name === instructorName);
          } catch (error) {
            console.error('Error parsing instructor_details:', error);
          }

          return {
            review,
            term,
            course,
            instructorDetails
          };
        })
      );

      // 過濾掉 null 值並返回
      return reviewsWithInfo.filter((info): info is NonNullable<typeof info> => info !== null);
    } catch (error) {
      console.error('Error fetching instructor reviews from details:', error);
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
                       'submitted_at', '$createdAt']) // 只選擇必要的欄位
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
      
      // 按評分和評論數排序，優先考慮有評論的課程
      const sortedCourses = coursesWithStats
        .filter(course => course.reviewCount > 0) // 只顯示有評論的課程
        .sort((a, b) => {
          // 首先按評分排序
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          // 評分相同時按評論數排序
          return b.reviewCount - a.reviewCount;
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
   * 獲取熱門講師的詳細統計信息（教學評分和評分公平性）
   */
  static async getPopularInstructorsWithDetailedStats(limit: number = 6): Promise<InstructorWithDetailedStats[]> {
    try {
      // 並行獲取講師和評論數據
      const [instructorsResponse, reviewsResponse] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.INSTRUCTORS_COLLECTION_ID,
          [
            Query.orderAsc('name'),
            Query.limit(this.MAX_INSTRUCTORS_LIMIT),
            Query.select(['$id', 'name', 'email', '$createdAt', '$updatedAt'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.REVIEWS_COLLECTION_ID,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(this.MAX_REVIEWS_LIMIT),
            Query.select(['instructor_details'])
          ]
        )
      ]);

      const instructors = instructorsResponse.documents as unknown as Instructor[];
      const allReviews = reviewsResponse.documents as unknown as Review[];

      // 創建講師統計映射
      const instructorStatsMap = new Map<string, {
        reviewCount: number;
        teachingScore: number;
        gradingFairness: number;
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
                teachingScore: 0,
                gradingFairness: 0
              });
            }
            
            const stats = instructorStatsMap.get(instructorName)!;
            stats.reviewCount++;
            stats.teachingScore += detail.teaching || 0;
            stats.gradingFairness += detail.grading || 0;
          }
        } catch (error) {
          // 跳過無效的 JSON 數據
          continue;
        }
      }

      // 計算平均值
      for (const [instructorName, stats] of instructorStatsMap) {
        if (stats.reviewCount > 0) {
          stats.teachingScore = stats.teachingScore / stats.reviewCount;
          stats.gradingFairness = stats.gradingFairness / stats.reviewCount;
        }
      }

      // 組合講師和統計信息
      const instructorsWithDetailedStats: InstructorWithDetailedStats[] = instructors
        .map(instructor => {
          const stats = instructorStatsMap.get(instructor.name) || {
            reviewCount: 0,
            teachingScore: 0,
            gradingFairness: 0
          };

          return {
            ...instructor,
            ...stats
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
        })
        .slice(0, limit); // 限制數量

      return instructorsWithDetailedStats;
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
      // 並行獲取講師和評論數據
      const [instructorsResponse, reviewsResponse] = await Promise.all([
        databases.listDocuments(
          this.DATABASE_ID,
          this.INSTRUCTORS_COLLECTION_ID,
          [
            Query.orderAsc('name'),
            Query.limit(this.MAX_INSTRUCTORS_LIMIT),
            Query.select(['$id', 'name', 'email', '$createdAt', '$updatedAt'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.REVIEWS_COLLECTION_ID,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(this.MAX_REVIEWS_LIMIT),
            Query.select(['instructor_details'])
          ]
        )
      ]);

      const instructors = instructorsResponse.documents as unknown as Instructor[];
      const allReviews = reviewsResponse.documents as unknown as Review[];

      // 創建講師統計映射
      const instructorStatsMap = new Map<string, {
        reviewCount: number;
        teachingScores: number[];
        gradingScores: number[];
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
                gradingScores: []
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
      }>();
      
      for (const [instructorName, stats] of instructorStatsMap) {
        const teachingScore = stats.teachingScores.length > 0 
          ? stats.teachingScores.reduce((sum, score) => sum + score, 0) / stats.teachingScores.length 
          : 0;
        const gradingFairness = stats.gradingScores.length > 0 
          ? stats.gradingScores.reduce((sum, score) => sum + score, 0) / stats.gradingScores.length 
          : 0;
          
        finalInstructorStatsMap.set(instructorName, {
          reviewCount: stats.reviewCount,
          teachingScore,
          gradingFairness
        });
      }

      // 組合講師和統計信息 - 包含所有講師，不過濾
      const instructorsWithDetailedStats: InstructorWithDetailedStats[] = instructors
        .map(instructor => {
          const stats = finalInstructorStatsMap.get(instructor.name) || {
            reviewCount: 0,
            teachingScore: 0,
            gradingFairness: 0
          };

          return {
            ...instructor,
            ...stats
          };
        })
        .sort((a, b) => {
          // 首先按名字排序（字母順序）
          return a.name.localeCompare(b.name);
        });

      return instructorsWithDetailedStats;
    } catch (error) {
      console.error('Error fetching all instructors with detailed stats:', error);
      throw new Error('Failed to fetch all instructors with detailed statistics');
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
            Query.select(['$id', 'course_code', 'course_title', 'course_department', 'course_language', '$createdAt', '$updatedAt'])
          ]
        ),
        databases.listDocuments(
          this.DATABASE_ID,
          this.REVIEWS_COLLECTION_ID,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(this.MAX_REVIEWS_LIMIT),
            Query.select(['course_code', 'user_id', 'course_usefulness']) // 只選擇統計需要的最少欄位
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
      const allReviews = reviewsResponse.documents as unknown as Pick<Review, 'course_code' | 'user_id' | 'course_usefulness'>[];
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
            studentCount: 0
          });
          continue;
        }

        // 使用單次遍歷計算所有統計信息
        let totalRating = 0;
        const uniqueUsers = new Set<string>();
        
        for (const review of reviews) {
          totalRating += review.course_usefulness || 0;
          uniqueUsers.add(review.user_id);
        }

        courseStatsMap.set(courseCode, {
          reviewCount,
          averageRating: totalRating / reviewCount,
          studentCount: uniqueUsers.size
        });
      }

      // 組合課程和統計信息（使用 map 一次性處理）
      const coursesWithStats: CourseWithStats[] = courses.map(course => {
        const stats = courseStatsMap.get(course.course_code) || {
          reviewCount: 0,
          averageRating: 0,
          studentCount: 0
        };

        return {
          ...course,
          ...stats,
          isOfferedInCurrentTerm: coursesOfferedInCurrentTerm.has(course.course_code)
        };
      });

      // 緩存結果
      this.setCached(cacheKey, coursesWithStats);
      
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
            Query.select(['$id', 'name', 'email', '$createdAt', '$updatedAt'])
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
} 

// 開發模式下將 CourseService 暴露到全局，方便調試
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).CourseService = CourseService;
}