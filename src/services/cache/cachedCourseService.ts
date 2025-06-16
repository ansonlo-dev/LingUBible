import { CourseService, CourseWithStats, Course, CourseTeachingInfo, CourseReviewInfo, Instructor, InstructorTeachingCourse, InstructorReviewInfo } from '@/services/api/courseService';
import { cacheService, CacheKeys } from './cacheService';

/**
 * 緩存化的 CourseService 包裝器
 * 提供與原始 CourseService 相同的 API，但加入了智能緩存
 */
export class CachedCourseService {
  
  /**
   * 獲取帶統計信息的課程列表（緩存）
   */
  static async getCoursesWithStats(): Promise<CourseWithStats[]> {
    return cacheService.get(
      CacheKeys.coursesWithStats(),
      () => CourseService.getCoursesWithStats(),
      'courses'
    );
  }

  /**
   * 獲取所有課程（緩存）
   */
  static async getAllCourses(): Promise<Course[]> {
    return cacheService.get(
      CacheKeys.courses(),
      () => CourseService.getAllCourses(),
      'courses'
    );
  }

  /**
   * 獲取課程詳情（緩存）
   */
  static async getCourseByCode(courseCode: string): Promise<Course | null> {
    return cacheService.get(
      CacheKeys.courseDetail(courseCode),
      () => CourseService.getCourseByCode(courseCode),
      'courseDetail'
    );
  }

  /**
   * 獲取課程統計信息（緩存）
   */
  static async getCourseStats(courseCode: string) {
    return cacheService.get(
      CacheKeys.courseStats(courseCode),
      () => CourseService.getCourseStats(courseCode),
      'stats'
    );
  }

  /**
   * 獲取課程教學信息（緩存）
   */
  static async getCourseTeachingInfo(courseCode: string): Promise<CourseTeachingInfo[]> {
    return cacheService.get(
      CacheKeys.teachingRecords(courseCode),
      () => CourseService.getCourseTeachingInfo(courseCode),
      'courseDetail'
    );
  }

  /**
   * 獲取課程評論（緩存）
   */
  static async getCourseReviewsWithVotes(courseCode: string, userId?: string): Promise<(CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]> {
    const cacheKey = userId ? `${CacheKeys.courseReviews(courseCode)}:${userId}` : CacheKeys.courseReviews(courseCode);
    return cacheService.get(
      cacheKey,
      () => CourseService.getCourseReviewsWithVotes(courseCode, userId),
      'reviews'
    );
  }

  /**
   * 獲取所有講師（緩存）
   */
  static async getAllInstructors(): Promise<Instructor[]> {
    return cacheService.get(
      CacheKeys.instructors(),
      () => CourseService.getAllInstructors(),
      'instructors'
    );
  }

  /**
   * 根據姓名獲取講師（緩存）
   */
  static async getInstructorByName(name: string): Promise<Instructor | null> {
    return cacheService.get(
      CacheKeys.instructorDetail(name),
      () => CourseService.getInstructorByName(name),
      'instructorDetail'
    );
  }

  /**
   * 獲取講師教學課程（緩存）
   */
  static async getInstructorTeachingCourses(instructorName: string): Promise<InstructorTeachingCourse[]> {
    return cacheService.get(
      CacheKeys.instructorCourses(instructorName),
      () => CourseService.getInstructorTeachingCourses(instructorName),
      'instructorDetail'
    );
  }

  /**
   * 獲取講師評論（緩存）
   */
  static async getInstructorReviews(instructorName: string): Promise<InstructorReviewInfo[]> {
    return cacheService.get(
      CacheKeys.instructorReviews(instructorName),
      () => CourseService.getInstructorReviews(instructorName),
      'instructorDetail'
    );
  }

  /**
   * 獲取講師評論詳情（帶投票信息）（緩存）
   */
  static async getInstructorReviewsFromDetailsWithVotes(instructorName: string, userId?: string) {
    const cacheKey = userId ? `${CacheKeys.instructorReviews(instructorName)}:details:${userId}` : `${CacheKeys.instructorReviews(instructorName)}:details`;
    return cacheService.get(
      cacheKey,
      () => CourseService.getInstructorReviewsFromDetailsWithVotes(instructorName, userId),
      'instructorDetail'
    );
  }

  /**
   * 獲取所有學期（緩存）
   */
  static async getAllTerms() {
    return cacheService.get(
      CacheKeys.terms(),
      () => CourseService.getAllTerms(),
      'courses'
    );
  }

  /**
   * 獲取課程教學記錄（緩存）
   */
  static async getCourseTeachingRecords(courseCode: string) {
    return cacheService.get(
      CacheKeys.teachingRecords(courseCode),
      () => CourseService.getCourseTeachingRecords(courseCode),
      'courseDetail'
    );
  }

  /**
   * 根據代碼獲取學期（緩存）
   */
  static async getTermByCode(termCode: string) {
    return cacheService.get(
      `terms:${termCode}`,
      () => CourseService.getTermByCode(termCode),
      'courses'
    );
  }

  // 非緩存方法 - 這些方法涉及寫操作或需要實時數據

  /**
   * 創建評論（不緩存，並清除相關緩存）
   */
  static async createReview(reviewData: any) {
    const result = await CourseService.createReview(reviewData);
    
    // 清除相關緩存
    cacheService.clearByType('reviews');
    cacheService.clearByType('stats');
    cacheService.clearByType('courses');
    
    return result;
  }

  /**
   * 更新評論（不緩存，並清除相關緩存）
   */
  static async updateReview(reviewId: string, reviewData: any) {
    const result = await CourseService.updateReview(reviewId, reviewData);
    
    // 清除相關緩存
    cacheService.clearByType('reviews');
    cacheService.clearByType('stats');
    cacheService.clearByType('courses');
    
    return result;
  }

  /**
   * 刪除評論（不緩存，並清除相關緩存）
   */
  static async deleteReview(reviewId: string) {
    const result = await CourseService.deleteReview(reviewId);
    
    // 清除相關緩存
    cacheService.clearByType('reviews');
    cacheService.clearByType('stats');
    cacheService.clearByType('courses');
    
    return result;
  }

  /**
   * 投票（不緩存，並清除相關緩存）
   */
  static async voteOnReview(reviewId: string, userId: string, voteType: 'up' | 'down') {
    const result = await CourseService.voteOnReview(reviewId, userId, voteType);
    
    // 只清除評論緩存
    cacheService.clearByType('reviews');
    
    return result;
  }

  /**
   * 移除投票（不緩存，並清除相關緩存）
   */
  static async removeVoteFromReview(reviewId: string, userId: string) {
    const result = await CourseService.removeVoteFromReview(reviewId, userId);
    
    // 只清除評論緩存
    cacheService.clearByType('reviews');
    
    return result;
  }

  /**
   * 獲取評論詳情（不緩存，因為可能用於編輯）
   */
  static async getReviewById(reviewId: string) {
    return CourseService.getReviewById(reviewId);
  }

  /**
   * 獲取用戶評論（不緩存，因為是個人數據）
   */
  static async getUserReviews(userId: string) {
    return CourseService.getUserReviews(userId);
  }

  // 緩存管理方法

  /**
   * 強制刷新課程列表緩存
   */
  static async refreshCoursesCache(): Promise<CourseWithStats[]> {
    return cacheService.refresh(
      CacheKeys.coursesWithStats(),
      () => CourseService.getCoursesWithStats(),
      'courses'
    );
  }

  /**
   * 強制刷新講師列表緩存
   */
  static async refreshInstructorsCache(): Promise<Instructor[]> {
    return cacheService.refresh(
      CacheKeys.instructors(),
      () => CourseService.getAllInstructors(),
      'instructors'
    );
  }

  /**
   * 強制刷新特定課程的緩存
   */
  static async refreshCourseCache(courseCode: string) {
    await Promise.all([
      cacheService.refresh(
        CacheKeys.courseDetail(courseCode),
        () => CourseService.getCourseByCode(courseCode),
        'courseDetail'
      ),
      cacheService.refresh(
        CacheKeys.courseStats(courseCode),
        () => CourseService.getCourseStats(courseCode),
        'stats'
      ),
      cacheService.refresh(
        CacheKeys.courseReviews(courseCode),
        () => CourseService.getCourseReviewsWithVotes(courseCode),
        'reviews'
      )
    ]);
  }

  /**
   * 強制刷新特定講師的緩存
   */
  static async refreshInstructorCache(instructorName: string) {
    await Promise.all([
      cacheService.refresh(
        CacheKeys.instructorDetail(instructorName),
        () => CourseService.getInstructorByName(instructorName),
        'instructorDetail'
      ),
      cacheService.refresh(
        CacheKeys.instructorCourses(instructorName),
        () => CourseService.getInstructorTeachingCourses(instructorName),
        'instructorDetail'
      ),
      cacheService.refresh(
        CacheKeys.instructorReviews(instructorName),
        () => CourseService.getInstructorReviews(instructorName),
        'instructorDetail'
      )
    ]);
  }

  /**
   * 清除所有緩存
   */
  static clearAllCache(): void {
    cacheService.clear();
  }

  /**
   * 獲取緩存統計信息
   */
  static getCacheStats() {
    return cacheService.getStats();
  }

  // 預載入方法 - 在用戶懸停時預載入數據
  static async preloadCourseDetail(courseCode: string): Promise<void> {
    try {
      // 並行預載入課程詳情相關數據
      const preloadPromises = [
        this.getCourseByCode(courseCode),
        this.getCourseTeachingInfo(courseCode),
        this.getCourseStats(courseCode)
      ];
      
      // 靜默預載入，不等待結果
      Promise.all(preloadPromises).catch(error => {
        console.debug('Preload failed for course:', courseCode, error);
      });
    } catch (error) {
      // 預載入失敗不影響用戶體驗
      console.debug('Preload error for course:', courseCode, error);
    }
  }

  static async preloadInstructorDetail(instructorName: string): Promise<void> {
    try {
      // 並行預載入講師詳情相關數據
      const preloadPromises = [
        this.getInstructorByName(instructorName),
        this.getInstructorReviewsFromDetailsWithVotes(instructorName, null)
      ];
      
      // 靜默預載入，不等待結果
      Promise.all(preloadPromises).catch(error => {
        console.debug('Preload failed for instructor:', instructorName, error);
      });
    } catch (error) {
      // 預載入失敗不影響用戶體驗
      console.debug('Preload error for instructor:', instructorName, error);
    }
  }

  // 批量預載入熱門課程
  static async preloadPopularCourses(courses: CourseWithStats[]): Promise<void> {
    try {
      // 選擇評分最高的前5個課程進行預載入
      const popularCourses = courses
        .filter(course => course.averageRating > 4.0)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      // 延遲預載入，避免阻塞主要功能
      for (const course of popularCourses) {
        setTimeout(() => {
          this.preloadCourseDetail(course.course_code);
        }, Math.random() * 1000); // 隨機延遲0-1秒
      }
    } catch (error) {
      console.debug('Batch preload error for courses:', error);
    }
  }

  // 批量預載入熱門講師
  static async preloadPopularInstructors(instructors: Instructor[]): Promise<void> {
    try {
      // 選擇前5個講師進行預載入（因為 Instructor 接口沒有評分屬性）
      const popularInstructors = instructors.slice(0, 5);

      // 延遲預載入，避免阻塞主要功能
      for (const instructor of popularInstructors) {
        setTimeout(() => {
          this.preloadInstructorDetail(instructor.name);
        }, Math.random() * 1000); // 隨機延遲0-1秒
      }
    } catch (error) {
      console.debug('Batch preload error for instructors:', error);
    }
  }
} 