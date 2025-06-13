// 課程評價系統類型定義

export interface UGCourse {
  $id: string;
  code: string;
  title: string;
  description?: string;
  credits: number;
  department: string;
  prerequisites?: string[];
  offered: 'Yes' | 'No';
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface Lecturer {
  $id: string;
  name: string;
  title: 'Prof' | 'Dr' | 'Mr' | 'Ms' | 'Ir';
  department: string;
  specialties?: string[];
  email?: string;
  bio?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CourseLecturer {
  $id: string;
  courseId: string;
  lecturerId: string;
  semester: string;
  isActive: boolean;
  $createdAt: string;
  $updatedAt: string;
}

export interface CourseReview {
  $id: string;
  userId: string;
  courseId: string;
  lecturerId: string;
  overallRating: number;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  pros?: string[];
  cons?: string[];
  semester: string;
  likes: number;
  dislikes: number;
  isAnonymous: boolean;
  createdAt: string;
  $createdAt: string;
  $updatedAt: string;
}

// 前端顯示用的組合類型
export interface CourseWithLecturers extends UGCourse {
  lecturers: LecturerWithStats[];
  totalReviews: number;
  averageRating: number;
  totalStudents: number;
}

export interface LecturerWithStats extends Lecturer {
  rating: number;
  reviewCount: number;
  courseCount: number;
}

export interface ReviewWithDetails extends CourseReview {
  lecturerName: string;
  courseName: string;
  courseCode: string;
  replies: number; // 這個可能需要另外的回覆系統
}

// API 回應類型
export interface CourseListResponse {
  courses: UGCourse[];
  total: number;
}

export interface LecturerListResponse {
  lecturers: Lecturer[];
  total: number;
}

export interface ReviewListResponse {
  reviews: CourseReview[];
  total: number;
} 