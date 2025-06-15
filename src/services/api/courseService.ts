import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

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
}

export interface Instructor {
  $id: string;
  name: string;
  email: string;
  type: string;
  $createdAt: string;
  $updatedAt: string;
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

  /**
   * 獲取所有課程，按課程代碼排序
   */
  static async getAllCourses(): Promise<Course[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.COURSES_COLLECTION_ID,
        [
          Query.orderAsc('course_code'),
          Query.limit(100) // 限制返回數量
        ]
      );
      
      return response.documents as unknown as Course[];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  /**
   * 根據課程標題搜尋課程
   */
  static async searchCoursesByTitle(searchTerm: string): Promise<Course[]> {
    try {
      if (!searchTerm.trim()) {
        return this.getAllCourses();
      }

      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.COURSES_COLLECTION_ID,
        [
          Query.search('course_title', searchTerm),
          Query.orderAsc('course_code'),
          Query.limit(100)
        ]
      );
      
      return response.documents as unknown as Course[];
    } catch (error) {
      console.error('Error searching courses:', error);
      // 如果搜尋失敗，回退到獲取所有課程然後本地過濾
      const allCourses = await this.getAllCourses();
      return allCourses.filter(course => 
        course.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }

  /**
   * 獲取課程統計信息（評論數、平均評分等）
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
          Query.limit(1000) // 獲取所有相關評論
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
   * 獲取帶統計信息的課程列表
   */
  static async getCoursesWithStats(): Promise<CourseWithStats[]> {
    try {
      const courses = await this.getAllCourses();
      
      // 並行獲取所有課程的統計信息
      const coursesWithStats = await Promise.all(
        courses.map(async (course) => {
          const stats = await this.getCourseStats(course.course_code);
          return {
            ...course,
            ...stats
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
   * 獲取所有講師
   */
  static async getAllInstructors(): Promise<Instructor[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.INSTRUCTORS_COLLECTION_ID,
        [
          Query.orderAsc('name'),
          Query.limit(100)
        ]
      );
      
      return response.documents as unknown as Instructor[];
    } catch (error) {
      console.error('Error fetching instructors:', error);
      throw new Error('Failed to fetch instructors');
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
      
      // 並行獲取所有相關的課程和學期信息
      const teachingCourses = await Promise.all(
        teachingRecords.map(async (record) => {
          const [course, term] = await Promise.all([
            this.getCourseByCode(record.course_code),
            this.getTermByCode(record.term_code)
          ]);

          if (!course || !term) {
            return null;
          }

          return {
            course,
            term,
            sessionType: record.session_type,
            ...(record.email_override && { emailOverride: record.email_override })
          };
        })
      );

      // 過濾掉 null 值並返回
      return teachingCourses.filter((info): info is NonNullable<typeof info> => info !== null);
    } catch (error) {
      console.error('Error fetching instructor teaching courses:', error);
      throw new Error('Failed to fetch instructor teaching courses');
    }
  }

  /**
   * 獲取包含特定講師的所有評論
   */
  static async getInstructorReviews(instructorName: string): Promise<InstructorReviewInfo[]> {
    try {
      // 獲取所有評論
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.limit(1000) // 獲取所有評論
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

      // 並行獲取課程和學期信息，並提取講師詳情
      const reviewsWithInfo = await Promise.all(
        instructorReviews.map(async (review) => {
          const [course, term] = await Promise.all([
            this.getCourseByCode(review.course_code),
            this.getTermByCode(review.term_code)
          ]);

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
        })
      );

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
   * 獲取特定課程的所有評論
   */
  static async getCourseReviews(courseCode: string): Promise<CourseReviewInfo[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('course_code', courseCode),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
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
   * 獲取特定講師的所有評論（從 instructor_details 中搜尋）
   */
  static async getInstructorReviewsFromDetails(instructorName: string): Promise<InstructorReviewFromDetails[]> {
    try {
      // 獲取所有評論
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(1000) // 增加限制以確保能搜尋到所有相關評論
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
   * 獲取評論的投票統計
   */
  static async getReviewVoteStats(reviewId: string): Promise<{ upvotes: number; downvotes: number }> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal('review_id', reviewId),
          Query.limit(1000)
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
   * 獲取用戶對特定評論的投票
   */
  static async getUserVoteForReview(reviewId: string, userId: string): Promise<'up' | 'down' | null> {
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
   * 獲取帶投票信息的課程評論
   */
  static async getCourseReviewsWithVotes(courseCode: string, userId?: string): Promise<(CourseReviewInfo & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]> {
    try {
      const reviews = await this.getCourseReviews(courseCode);
      
      // 並行獲取每個評論的投票信息
      const reviewsWithVotes = await Promise.all(
        reviews.map(async (reviewInfo) => {
          const [voteStats, userVote] = await Promise.all([
            this.getReviewVoteStats(reviewInfo.review.$id),
            userId ? this.getUserVoteForReview(reviewInfo.review.$id, userId) : Promise.resolve(null)
          ]);

          return {
            ...reviewInfo,
            upvotes: voteStats.upvotes,
            downvotes: voteStats.downvotes,
            userVote
          };
        })
      );

      return reviewsWithVotes;
    } catch (error) {
      console.error('Error fetching course reviews with votes:', error);
      throw new Error('Failed to fetch course reviews with votes');
    }
  }

  /**
   * 獲取帶投票信息的講師評論
   */
  static async getInstructorReviewsFromDetailsWithVotes(instructorName: string, userId?: string): Promise<(InstructorReviewFromDetails & { upvotes: number; downvotes: number; userVote?: 'up' | 'down' | null })[]> {
    try {
      const reviews = await this.getInstructorReviewsFromDetails(instructorName);
      
      // 並行獲取每個評論的投票信息
      const reviewsWithVotes = await Promise.all(
        reviews.map(async (reviewInfo) => {
          const [voteStats, userVote] = await Promise.all([
            this.getReviewVoteStats(reviewInfo.review.$id),
            userId ? this.getUserVoteForReview(reviewInfo.review.$id, userId) : Promise.resolve(null)
          ]);

          return {
            ...reviewInfo,
            upvotes: voteStats.upvotes,
            downvotes: voteStats.downvotes,
            userVote
          };
        })
      );

      return reviewsWithVotes;
    } catch (error) {
      console.error('Error fetching instructor reviews with votes:', error);
      throw new Error('Failed to fetch instructor reviews with votes');
    }
  }

  /**
   * 獲取用戶的所有評論（帶投票信息）
   */
  static async getUserReviews(userId: string): Promise<(CourseReviewInfo & { upvotes: number; downvotes: number })[]> {
    try {
      const response = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEWS_COLLECTION_ID,
        [
          Query.equal('user_id', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(1000)
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
      // 首先刪除相關的投票記錄
      const votesResponse = await databases.listDocuments(
        this.DATABASE_ID,
        this.REVIEW_VOTES_COLLECTION_ID,
        [
          Query.equal('review_id', reviewId),
          Query.limit(1000)
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


} 