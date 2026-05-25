import { Client, Databases, Query } from 'node-appwrite';

const DATABASE_ID = 'lingubible';
const REVIEWS_COLLECTION_ID = 'reviews';
const COURSES_COLLECTION_ID = 'courses';
const PAGE_LIMIT = 1000;

// 標準香港大學成績對 GPA 對照表，與前端 src/utils/gradeUtils.ts 保持一致
const GRADE_TO_GPA = {
  'A': 4.00, 'A-': 3.67, 'B+': 3.33, 'B': 3.00, 'B-': 2.67,
  'C+': 2.33, 'C': 2.00, 'C-': 1.67, 'D+': 1.33, 'D': 1.00,
  'F': 0.00, 'I': 0.00, 'M': 0.00, 'VS': 0.00, 'S': 0.00,
  'U': 0.00, 'P': 0.00, 'W': 0.00, 'AU': 0.00
};

function getGPA(grade) {
  if (!grade) return null;
  const g = String(grade).trim().toUpperCase();
  return g in GRADE_TO_GPA ? GRADE_TO_GPA[g] : null;
}

// 空統計（無評論時），與前端 getBatchCourseDetailedStats 的 0 值對齊
const EMPTY_STATS = {
  stats_review_count: 0,
  stats_avg_rating: 0,
  stats_student_count: 0,
  stats_avg_workload: -1,
  stats_avg_difficulty: -1,
  stats_avg_usefulness: -1,
  stats_avg_gpa: 0,
  stats_avg_gpa_count: 0
};

// 從一組評論計算統計（精確複製前端 getBatchCourseDetailedStats 的邏輯）
function computeStats(reviews) {
  const reviewCount = reviews.length;
  if (reviewCount === 0) return { ...EMPTY_STATS };

  let totalRating = 0;
  let totalWorkload = 0, totalDifficulty = 0, totalUsefulness = 0, totalGPA = 0;
  let validWorkloadCount = 0, validDifficultyCount = 0, validUsefulnessCount = 0, validGPACount = 0;
  const uniqueUsers = new Set();

  for (const r of reviews) {
    totalRating += r.course_usefulness || 0;
    uniqueUsers.add(r.user_id);

    if (r.course_workload > 0) { totalWorkload += r.course_workload; validWorkloadCount++; }
    if (r.course_difficulties > 0) { totalDifficulty += r.course_difficulties; validDifficultyCount++; }
    if (r.course_usefulness > 0) { totalUsefulness += r.course_usefulness; validUsefulnessCount++; }

    if (r.course_final_grade) {
      const g = getGPA(r.course_final_grade);
      if (g && g > 0) { totalGPA += g; validGPACount++; }
    }
  }

  return {
    stats_review_count: reviewCount,
    stats_avg_rating: totalRating / reviewCount,
    stats_student_count: uniqueUsers.size,
    stats_avg_workload: validWorkloadCount > 0 ? totalWorkload / validWorkloadCount : -1,
    stats_avg_difficulty: validDifficultyCount > 0 ? totalDifficulty / validDifficultyCount : -1,
    stats_avg_usefulness: validUsefulnessCount > 0 ? totalUsefulness / validUsefulnessCount : -1,
    stats_avg_gpa: validGPACount > 0 ? totalGPA / validGPACount : 0,
    stats_avg_gpa_count: validGPACount
  };
}

// 讀取單一課程的所有評論（分頁，只取統計需要的欄位）
async function fetchReviewsForCourse(databases, courseCode) {
  const reviews = [];
  let cursor = null;
  while (true) {
    const queries = [
      Query.equal('course_code', courseCode),
      Query.limit(PAGE_LIMIT),
      Query.select(['course_code', 'user_id', 'course_workload', 'course_difficulties', 'course_usefulness', 'course_final_grade'])
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, REVIEWS_COLLECTION_ID, queries);
    reviews.push(...res.documents);
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  return reviews;
}

// 找出課程的 $id（courses 以 course_code 索引，但主鍵是 $id）
async function findCourseRowId(databases, courseCode) {
  const res = await databases.listDocuments(DATABASE_ID, COURSES_COLLECTION_ID, [
    Query.equal('course_code', courseCode),
    Query.limit(1),
    Query.select(['$id'])
  ]);
  return res.documents.length > 0 ? res.documents[0].$id : null;
}

async function recomputeOne(databases, courseCode, log) {
  const reviews = await fetchReviewsForCourse(databases, courseCode);
  const stats = computeStats(reviews);
  const rowId = await findCourseRowId(databases, courseCode);
  if (!rowId) {
    log(`找不到課程 ${courseCode}，略過`);
    return { courseCode, updated: false };
  }
  await databases.updateDocument(DATABASE_ID, COURSES_COLLECTION_ID, rowId, stats);
  log(`已更新 ${courseCode}: ${stats.stats_review_count} 則評論`);
  return { courseCode, updated: true, stats };
}

// 回填全部課程：一次讀完所有評論分組，再逐一更新課程
async function recomputeAll(databases, log) {
  // 讀取所有評論並依 course_code 分組
  const reviewsByCourse = new Map();
  let cursor = null;
  let totalReviews = 0;
  while (true) {
    const queries = [
      Query.limit(PAGE_LIMIT),
      Query.select(['course_code', 'user_id', 'course_workload', 'course_difficulties', 'course_usefulness', 'course_final_grade'])
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, REVIEWS_COLLECTION_ID, queries);
    for (const r of res.documents) {
      if (!reviewsByCourse.has(r.course_code)) reviewsByCourse.set(r.course_code, []);
      reviewsByCourse.get(r.course_code).push(r);
    }
    totalReviews += res.documents.length;
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  log(`回填：讀取 ${totalReviews} 則評論，涵蓋 ${reviewsByCourse.size} 門課`);

  // 讀取所有課程（$id + course_code）
  const courses = [];
  cursor = null;
  while (true) {
    const queries = [Query.limit(PAGE_LIMIT), Query.select(['$id', 'course_code'])];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, COURSES_COLLECTION_ID, queries);
    courses.push(...res.documents);
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  log(`回填：共 ${courses.length} 門課程`);

  let updated = 0;
  for (const course of courses) {
    const reviews = reviewsByCourse.get(course.course_code) || [];
    const stats = computeStats(reviews);
    await databases.updateDocument(DATABASE_ID, COURSES_COLLECTION_ID, course.$id, stats);
    updated++;
  }
  log(`回填完成：更新 ${updated} 門課程`);
  return { updated, totalCourses: courses.length, totalReviews };
}

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://appwrite.lingubible.com/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    let body = {};
    try { body = JSON.parse(req.body || '{}'); } catch { body = {}; }

    // 由資料庫事件觸發時，req.body 是該則評論文件本身，從中取 course_code
    const courseCode = body.courseCode || body.course_code;

    if (body.all === true) {
      const result = await recomputeAll(databases, log);
      return res.json({ success: true, mode: 'all', ...result });
    }

    if (courseCode) {
      const result = await recomputeOne(databases, courseCode, log);
      return res.json({ success: true, mode: 'single', ...result });
    }

    return res.json({ success: false, error: '需要 courseCode 或 all:true' }, 400);
  } catch (err) {
    error(`重算課程統計失敗: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
