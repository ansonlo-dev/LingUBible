import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import type { 
  UGCourse, 
  Lecturer, 
  CourseLecturer, 
  CourseReview,
  CourseWithLecturers,
  LecturerWithStats 
} from '@/types/course';

const DATABASE_ID = 'lingubible';

export class CourseService {
  // 獲取所有本科課程（優化版本 - 使用索引）
  static async getAllCourses(): Promise<UGCourse[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        'ug_courses',
        [
          Query.equal('isActive', true), // 使用 isActive_code_index
          Query.orderAsc('code')
        ]
      );
      return response.documents as unknown as UGCourse[];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  // 根據課程代碼獲取課程詳情（優化版本 - 使用唯一索引）
  static async getCourseByCode(courseCode: string): Promise<UGCourse | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        'ug_courses',
        [
          Query.equal('code', courseCode), // 使用 code_unique_index
          Query.equal('isActive', true)    // 使用 isActive_code_index
        ]
      );
      return response.documents.length > 0 ? response.documents[0] as unknown as UGCourse : null;
    } catch (error) {
      console.error('Error fetching course by code:', error);
      throw error;
    }
  }

  // 獲取課程的所有講師（優化版本 - 使用複合索引）
  static async getCourseLecturers(courseId: string): Promise<LecturerWithStats[]> {
    try {
      // 使用 courseId_isActive_index 複合索引
      const courseLecturersResponse = await databases.listDocuments(
        DATABASE_ID,
        'course_lecturers',
        [
          Query.equal('courseId', courseId),
          Query.equal('isActive', true)
        ]
      );

      const lecturerIds = (courseLecturersResponse.documents as unknown as CourseLecturer[]).map(
        (cl: CourseLecturer) => cl.lecturerId
      );

      if (lecturerIds.length === 0) {
        return [];
      }

      // 獲取講師詳情
      const lecturersResponse = await databases.listDocuments(
        DATABASE_ID,
        'lecturers',
        [
          Query.equal('$id', lecturerIds)
        ]
      );

      // 為每個講師計算統計數據
      const lecturersWithStats: LecturerWithStats[] = await Promise.all(
        (lecturersResponse.documents as unknown as Lecturer[]).map(async (lecturer: Lecturer) => {
          const stats = await this.getLecturerStats(lecturer.$id, courseId);
          return {
            ...lecturer,
            ...stats
          };
        })
      );

      return lecturersWithStats;
    } catch (error) {
      console.error('Error fetching course lecturers:', error);
      throw error;
    }
  }

  // 獲取講師統計數據（優化版本 - 使用索引）
  static async getLecturerStats(lecturerId: string, courseId?: string): Promise<{
    rating: number;
    reviewCount: number;
    courseCount: number;
  }> {
    try {
      // 使用 lecturerId_index 或 courseId_lecturerId_index
      const reviewQuery = courseId 
        ? [Query.equal('courseId', courseId), Query.equal('lecturerId', lecturerId)]
        : [Query.equal('lecturerId', lecturerId)];

      const reviewsResponse = await databases.listDocuments(
        DATABASE_ID,
        'course_reviews',
        reviewQuery
      );

      const reviews = reviewsResponse.documents as unknown as CourseReview[];
      const reviewCount = reviews.length;
      const rating = reviewCount > 0 
        ? reviews.reduce((sum, review) => sum + review.overallRating, 0) / reviewCount
        : 0;

      // 使用 lecturerId_isActive_index
      const coursesResponse = await databases.listDocuments(
        DATABASE_ID,
        'course_lecturers',
        [
          Query.equal('lecturerId', lecturerId),
          Query.equal('isActive', true)
        ]
      );

      return {
        rating: Math.round(rating * 10) / 10, // 保留一位小數
        reviewCount,
        courseCount: coursesResponse.documents.length
      };
    } catch (error) {
      console.error('Error fetching lecturer stats:', error);
      return { rating: 0, reviewCount: 0, courseCount: 0 };
    }
  }

  // 獲取課程評論（優化版本 - 使用索引和排序）
  static async getCourseReviews(
    courseId: string, 
    lecturerId?: string,
    sortBy: 'rating' | 'date' | 'likes' = 'date'
  ): Promise<CourseReview[]> {
    try {
      const queries = [Query.equal('courseId', courseId)];
      
      if (lecturerId) {
        queries.push(Query.equal('lecturerId', lecturerId));
        // 使用 courseId_lecturerId_index 複合索引
      }

      // 使用對應的索引進行排序
      switch (sortBy) {
        case 'rating':
          queries.push(Query.orderDesc('overallRating')); // 使用 overallRating_index
          break;
        case 'likes':
          queries.push(Query.orderDesc('likes')); // 使用 likes_index
          break;
        case 'date':
        default:
          queries.push(Query.orderDesc('createdAt')); // 使用 createdAt_index
          break;
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        'course_reviews',
        queries
      );

      return response.documents as unknown as CourseReview[];
    } catch (error) {
      console.error('Error fetching course reviews:', error);
      throw error;
    }
  }

  // 搜索課程（優化版本 - 使用全文搜尋索引）
  static async searchCourses(searchTerm: string, department?: string): Promise<UGCourse[]> {
    try {
      const queries = [Query.equal('isActive', true)]; // 使用 isActive_code_index

      if (department && department !== 'all') {
        queries.push(Query.equal('department', department)); // 使用 department_index
      }

      if (searchTerm) {
        // 使用全文搜尋索引進行高效搜尋
        queries.push(Query.search('title', searchTerm)); // 使用 title_fulltext_index
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        'ug_courses',
        queries
      );

      return response.documents as unknown as UGCourse[];
    } catch (error) {
      console.error('Error searching courses:', error);
      throw error;
    }
  }

  // 獲取課程完整信息（包含講師）
  static async getCourseWithLecturers(courseCode: string): Promise<CourseWithLecturers | null> {
    try {
      const course = await this.getCourseByCode(courseCode);
      if (!course) return null;

      const lecturers = await this.getCourseLecturers(course.$id);
      const reviews = await this.getCourseReviews(course.$id);

      // 計算統計數據
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.overallRating, 0) / totalReviews
        : 0;

      // 基於課程評價數量估算學生數量（每個評價大約代表10-15個學生）
      const totalStudents = totalReviews > 0 ? Math.floor(totalReviews * 12) : 0;

      return {
        ...course,
        lecturers,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalStudents
      };
    } catch (error) {
      console.error('Error fetching course with lecturers:', error);
      throw error;
    }
  }

  // 獲取所有講師（優化版本 - 使用索引）
  static async getAllLecturers(): Promise<LecturerWithStats[]> {
    try {
      // 並行獲取講師、評論和課程關聯數據，使用索引優化
      const [lecturersResponse, reviewsResponse, courseLecturersResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, 'lecturers', [Query.orderAsc('name')]), // 使用 name_index
        databases.listDocuments(DATABASE_ID, 'course_reviews', [Query.limit(1000)]),
        databases.listDocuments(DATABASE_ID, 'course_lecturers', [
          Query.equal('isActive', true), // 使用 lecturerId_isActive_index
          Query.limit(1000)
        ])
      ]);

      const lecturers = lecturersResponse.documents as unknown as Lecturer[];
      const reviews = reviewsResponse.documents as unknown as CourseReview[];
      const courseLecturers = courseLecturersResponse.documents as unknown as CourseLecturer[];

      // 為每個講師計算統計數據
      const lecturersWithStats: LecturerWithStats[] = lecturers.map((lecturer: Lecturer) => {
        // 計算該講師的評論統計
        const lecturerReviews = reviews.filter(review => review.lecturerId === lecturer.$id);
        const reviewCount = lecturerReviews.length;
        const rating = reviewCount > 0 
          ? lecturerReviews.reduce((sum, review) => sum + review.overallRating, 0) / reviewCount
          : 0;

        // 計算該講師的課程數量
        const courseCount = courseLecturers.filter(cl => cl.lecturerId === lecturer.$id).length;

        return {
          ...lecturer,
          rating: Math.round(rating * 10) / 10,
          reviewCount,
          courseCount
        };
      });

      return lecturersWithStats;
    } catch (error) {
      console.error('Error fetching all lecturers:', error);
      throw error;
    }
  }

  // 搜索講師（優化版本 - 使用全文搜尋索引）
  static async searchLecturers(searchTerm: string, department?: string): Promise<LecturerWithStats[]> {
    try {
      // 如果沒有搜索條件，直接返回所有講師
      if (!searchTerm.trim() && (!department || department === 'all')) {
        return this.getAllLecturers();
      }

      // 使用索引進行高效搜尋
      const queries = [];

      if (department && department !== 'all') {
        queries.push(Query.equal('department', department)); // 使用 department_index
      }

      if (searchTerm.trim()) {
        queries.push(Query.search('name', searchTerm)); // 使用 name_fulltext_index
      }

      const lecturersResponse = await databases.listDocuments(
        DATABASE_ID,
        'lecturers',
        queries
      );

      const lecturers = lecturersResponse.documents as unknown as Lecturer[];

      // 為搜尋結果計算統計數據
      const lecturersWithStats: LecturerWithStats[] = await Promise.all(
        lecturers.map(async (lecturer: Lecturer) => {
          const stats = await this.getLecturerStats(lecturer.$id);
          return {
            ...lecturer,
            ...stats
          };
        })
      );

      return lecturersWithStats;
    } catch (error) {
      console.error('Error searching lecturers:', error);
      throw error;
    }
  }
} 