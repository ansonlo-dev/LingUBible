import { courseService } from '@/services/api/courseService';

// 使用範例：展示如何使用新的資料庫結構

export async function exampleUsage() {
  
  // 1. 課程導向查詢：查看 PHIL1005 的所有講師
  console.log('=== 課程導向查詢 ===');
  try {
    const course = await courseService.getCourseById('phil1005_id');
    const sections = await courseService.getCourseSections('phil1005_id');
    const reviews = await courseService.getReviews('phil1005_id');
    
    console.log(`課程：${courseWithLecturers.code} - ${courseWithLecturers.title}`);
    console.log(`學分：${courseWithLecturers.credits}`);
    console.log(`整體評分：${courseWithLecturers.averageRating?.toFixed(1) || 'N/A'}`);
    console.log(`總評價數：${courseWithLecturers.totalReviews}`);
    
    console.log('\n教授該課程的講師：');
    courseWithLecturers.lecturers.forEach(lecturer => {
      console.log(`- ${lecturer.title} ${lecturer.name} (${lecturer.department})`);
      console.log(`  評分：${lecturer.averageRating?.toFixed(1) || 'N/A'} (${lecturer.reviewCount} 評價)`);
      
      lecturer.sections.forEach(section => {
        console.log(`  班別：${section.sectionCode} (${section.role})`);
        console.log(`  時間：${section.schedule || 'TBA'}`);
        console.log(`  地點：${section.venue || 'TBA'}`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('查詢課程失敗：', error);
  }

  // 2. 講師導向查詢：查看 Prof. Chan 教授的所有課程
  console.log('=== 講師導向查詢 ===');
  try {
    const lecturerWithCourses = await courseService.getLecturerWithCourses('prof_chan_id');
    
    console.log(`講師：${lecturerWithCourses.title} ${lecturerWithCourses.name}`);
    console.log(`學系：${lecturerWithCourses.department}`);
    console.log(`整體評分：${lecturerWithCourses.averageRating?.toFixed(1) || 'N/A'}`);
    console.log(`總評價數：${lecturerWithCourses.totalReviews}`);
    
    console.log('\n教授的課程：');
    lecturerWithCourses.courses.forEach(course => {
      console.log(`- ${course.code}: ${course.title} (${course.credits} 學分)`);
      console.log(`  評分：${course.averageRating?.toFixed(1) || 'N/A'} (${course.reviewCount} 評價)`);
      
      course.sections.forEach(section => {
        console.log(`  班別：${section.sectionCode} (${section.role})`);
        console.log(`  時間：${section.schedule || 'TBA'}`);
      });
      console.log('');
    });
    
  } catch (error) {
    console.error('查詢講師失敗：', error);
  }

  // 3. 獲取特定課程-講師組合的評價
  console.log('=== 特定組合評價查詢 ===');
  try {
    const reviews = await courseService.getCourseReviews('phil1005_id', 'prof_chan_id');
    
    console.log(`PHIL1005 - Prof. Chan 的評價 (${reviews.length} 條)：`);
    reviews.forEach(review => {
      console.log(`- 評分：${review.overallRating}/5`);
      console.log(`  學期：${review.semester}`);
      console.log(`  內容：${review.content.substring(0, 100)}...`);
      console.log(`  標籤：${review.tags?.join(', ') || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('查詢評價失敗：', error);
  }
}

// 示例數據結構
export const sampleData = {
  // 課程數據
  courses: [
    {
      code: 'PHIL1005',
      title: 'Introduction to Philosophy',
      description: 'An introduction to major philosophical problems and methods.',
      credits: 3,
      department: 'Philosophy',
      level: 'UG' as const,
      prerequisites: [],
      isActive: true
    },
    {
      code: 'PHIL2010',
      title: 'Ethics',
      description: 'Study of moral philosophy and ethical theories.',
      credits: 3,
      department: 'Philosophy',
      level: 'UG' as const,
      prerequisites: ['PHIL1005'],
      isActive: true
    }
  ],

  // 講師數據
  lecturers: [
    {
      name: 'John Chan',
      title: 'Prof' as const,
      department: 'Philosophy',
      email: 'john.chan@ln.edu.hk',
      office: 'AM314',
      specialties: ['Ethics', 'Political Philosophy', 'Ancient Philosophy'],
      bio: 'Professor Chan specializes in ancient philosophy and ethics.',
      isActive: true
    },
    {
      name: 'Mary Wong',
      title: 'Dr' as const,
      department: 'Philosophy',
      email: 'mary.wong@ln.edu.hk',
      office: 'AM315',
      specialties: ['Logic', 'Philosophy of Mind'],
      bio: 'Dr. Wong focuses on logic and philosophy of mind.',
      isActive: true
    }
  ],

  // 課程班別數據（連接課程和講師）
  courseSections: [
    {
      courseId: 'phil1005_id',
      lecturerId: 'prof_chan_id',
      semester: '2024-25-1',
      sectionCode: 'L1',
      role: 'lecturer' as const,
      schedule: 'Mon 14:30-16:20, Wed 14:30-15:20',
      venue: 'LT1',
      maxStudents: 120,
      isActive: true
    },
    {
      courseId: 'phil1005_id',
      lecturerId: 'dr_wong_id',
      semester: '2024-25-1',
      sectionCode: 'T1',
      role: 'tutor' as const,
      schedule: 'Fri 10:30-11:20',
      venue: 'AM201',
      maxStudents: 30,
      isActive: true
    },
    {
      courseId: 'phil2010_id',
      lecturerId: 'prof_chan_id',
      semester: '2024-25-1',
      sectionCode: 'L1',
      role: 'lecturer' as const,
      schedule: 'Tue 14:30-16:20, Thu 14:30-15:20',
      venue: 'LT2',
      maxStudents: 80,
      isActive: true
    }
  ],

  // 評價數據
  reviews: [
    {
      userId: 'student1_id',
      courseId: 'phil1005_id',
      lecturerId: 'prof_chan_id',
      sectionId: 'section1_id',
      overallRating: 4.5,
      teachingRating: 4.8,
      difficultyRating: 3.2,
      workloadRating: 3.5,
      content: 'Prof. Chan is an excellent teacher. His lectures are engaging and he explains complex concepts clearly.',
      tags: ['engaging', 'clear_explanation', 'helpful'],
      semester: '2024-25-1',
      isAnonymous: false,
      isVerified: true
    },
    {
      userId: 'student2_id',
      courseId: 'phil1005_id',
      lecturerId: 'dr_wong_id',
      sectionId: 'section2_id',
      overallRating: 4.2,
      teachingRating: 4.0,
      difficultyRating: 3.8,
      workloadRating: 4.0,
      content: 'Dr. Wong\'s tutorials are very helpful. She provides good feedback on assignments.',
      tags: ['helpful_feedback', 'organized', 'approachable'],
      semester: '2024-25-1',
      isAnonymous: true,
      isVerified: true
    }
  ]
};

// 查詢範例函數
export const queryExamples = {
  
  // 查詢某課程的所有講師和評價
  async getCourseDetails(courseCode: string) {
    const courses = await courseService.searchCourses(courseCode);
    if (courses.length === 0) return null;
    
    return await courseService.getCourseWithLecturers(courses[0].$id);
  },

  // 查詢某講師的所有課程和評價
  async getLecturerDetails(lecturerName: string) {
    // 這裡需要先實現按名稱搜尋講師的功能
    // 暫時假設我們有講師ID
    return await courseService.getLecturerWithCourses('lecturer_id');
  },

  // 比較同一課程不同講師的評價
  async compareLecturersForCourse(courseId: string) {
    const courseData = await courseService.getCourseWithLecturers(courseId);
    
    return courseData.lecturers.map(lecturer => ({
      name: `${lecturer.title} ${lecturer.name}`,
      averageRating: lecturer.averageRating,
      reviewCount: lecturer.reviewCount,
      sections: lecturer.sections.map(s => ({
        code: s.sectionCode,
        role: s.role,
        schedule: s.schedule
      }))
    }));
  },

  // 獲取講師在不同課程中的表現
  async getLecturerPerformanceAcrossCourses(lecturerId: string) {
    const lecturerData = await courseService.getLecturerWithCourses(lecturerId);
    
    return lecturerData.courses.map(course => ({
      courseCode: course.code,
      courseTitle: course.title,
      averageRating: course.averageRating,
      reviewCount: course.reviewCount,
      role: course.sections[0]?.role // 假設每個課程只有一個角色
    }));
  }
}; 