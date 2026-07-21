import { Client, Databases, Query } from 'node-appwrite';

const DATABASE_ID = 'lingubible';
const REVIEWS_COLLECTION_ID = 'reviews';
const COURSES_COLLECTION_ID = 'courses';
const TEACHING_RECORDS_COLLECTION_ID = 'teaching_records';
const INSTRUCTORS_COLLECTION_ID = 'instructors';
const PAGE_LIMIT = 1000;
// updateDocument 呼叫序列執行時，每則約 300~400ms 網路往返；courses(~1090)+instructors(~757)
// 合計近 1850 則會遠遠超過 300 秒函數逾時（實測 schedule 全量重算連續多日 100% 逾時失敗）。
// 以有限並行度批次執行，把總時長壓到並行度分之一，同時避免對 Appwrite API 造成瞬間洪峰。
const UPDATE_CONCURRENCY = 25;

// 以固定並行度執行一批非同步工作，行為近似「worker pool」：任何一個工作拋出例外
// 都不影響其他工作繼續執行（呼叫端已用 try/catch 包住每個 fn 呼叫）。
async function runWithConcurrency(items, limit, fn) {
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await fn(items[i], i);
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
}

// 合併講師姓名（teaching_records.instructor_name 可能為 "A / B" 共同授課格式）拆成個別姓名。
// 與前端 src/utils/instructorNameUtils.ts 的 splitInstructorNames 保持一致。
function splitInstructorNames(raw) {
  if (!raw) return [];
  const parts = String(raw).split(/\s*\/\s*/).map(s => s.trim()).filter(s => s.length > 0);
  if (parts.length === 0) {
    const trimmed = String(raw).trim();
    return trimmed ? [trimmed] : [];
  }
  return parts;
}

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

// 與前端 gradeUtils.ts normalizeGrade 一致：null/'-1'/空字串 視為 N/A
function normalizeGrade(grade) {
  if (!grade || grade === '-1' || String(grade).trim() === '') return 'N/A';
  return String(grade).trim().toUpperCase();
}

// 取得計入 GPA 的成績點數（複製前端 calculateGradeStatistics 行為：
// 排除 N/A 與不在對照表的成績；F/I/M 等對應 0.00 仍會被計入）
function gradeToCountedGPA(rawGrade) {
  const norm = normalizeGrade(rawGrade);
  if (norm === 'N/A') return null;
  return norm in GRADE_TO_GPA ? GRADE_TO_GPA[norm] : null;
}

// 與前端 dateUtils.ts getCurrentTermCode() 保持相同邏輯
function getCurrentTermCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 9 && month <= 12) return `${year}-T1`;
  if (month >= 1 && month <= 5) return `${year - 1}-T2`;
  return `${year}-Summer`;
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

// 從一組教學記錄計算教學語言 / 服務學習反正規化欄位
function computeTeachingFields(teachingRows, currentTermCode) {
  const seenLang = new Set();
  const seenSL = new Set();
  const langList = [];
  const slList = [];
  let currentLang = null;
  let currentSL = null;

  // rows 已按 $createdAt 升序，後寫入者為最新
  for (const r of teachingRows) {
    if (r.teaching_language && !seenLang.has(r.teaching_language)) {
      seenLang.add(r.teaching_language);
      langList.push(r.teaching_language);
    }
    if ((r.service_learning === 'compulsory' || r.service_learning === 'optional') && !seenSL.has(r.service_learning)) {
      seenSL.add(r.service_learning);
      slList.push(r.service_learning);
    }
    if (r.term_code === currentTermCode) {
      if (r.teaching_language) currentLang = r.teaching_language;
      if (r.service_learning === 'compulsory' || r.service_learning === 'optional') currentSL = r.service_learning;
    }
  }

  let offeredInCurrentTerm = false;
  for (const r of teachingRows) {
    if (r.term_code === currentTermCode) { offeredInCurrentTerm = true; break; }
  }

  return {
    teaching_languages: JSON.stringify(langList),
    current_term_teaching_language: currentLang,
    service_learning_types: JSON.stringify(slList),
    current_term_service_learning: currentSL,
    current_term_offered: offeredInCurrentTerm,
  };
}

// ---- 講師統計反正規化 ----

function newInstructorReviewAgg() {
  return {
    reviewCount: 0,
    teachingSum: 0, teachingCount: 0,
    gradingSum: 0, gradingCount: 0,
    gradeSum: 0, gradeCount: 0,
  };
}

// 把一則評論的 instructor_details 累加到講師聚合表
// 複製前端 getAllInstructorsWithDetailedStats 的邏輯：
// 每個 instructor_detail 計 1 則評論；teaching/grading 取 >0 的平均；
// 成績以 review.course_final_grade 對每位講師各計一次
function accumulateInstructorReview(map, review) {
  let details;
  try {
    details = JSON.parse(review.instructor_details);
  } catch {
    return;
  }
  if (!Array.isArray(details)) return;

  for (const detail of details) {
    // 合併講師（"A / B"）的評價同時累加到每位個別講師
    const names = splitInstructorNames(detail.instructor_name);
    if (names.length === 0) continue;
    const gpa = gradeToCountedGPA(review.course_final_grade);
    for (const name of names) {
      if (!map.has(name)) map.set(name, newInstructorReviewAgg());
      const agg = map.get(name);
      agg.reviewCount++;
      if (detail.teaching > 0) { agg.teachingSum += detail.teaching; agg.teachingCount++; }
      if (detail.grading && detail.grading > 0) { agg.gradingSum += detail.grading; agg.gradingCount++; }
      if (gpa !== null) { agg.gradeSum += gpa; agg.gradeCount++; }
    }
  }
}

function finalizeInstructorReviewStats(agg) {
  if (!agg) {
    return {
      stats_review_count: 0,
      stats_teaching_score: 0,
      stats_grading_fairness: 0,
      stats_avg_gpa: 0,
      stats_avg_gpa_count: 0,
    };
  }
  return {
    stats_review_count: agg.reviewCount,
    stats_teaching_score: agg.teachingCount > 0 ? agg.teachingSum / agg.teachingCount : 0,
    stats_grading_fairness: agg.gradingCount > 0 ? agg.gradingSum / agg.gradingCount : 0,
    stats_avg_gpa: agg.gradeCount > 0 ? agg.gradeSum / agg.gradeCount : 0,
    stats_avg_gpa_count: agg.gradeCount,
  };
}

// 從一組教學記錄計算單一講師的教學語言反正規化欄位（rows 已按 $createdAt 升序）
function computeInstructorTeachingFields(teachingRows, currentTermCode) {
  const seen = new Set();
  const langList = [];
  let currentLang = null;
  let teachingInCurrentTerm = false;
  for (const r of teachingRows) {
    if (r.teaching_language && !seen.has(r.teaching_language)) {
      seen.add(r.teaching_language);
      langList.push(r.teaching_language);
    }
    if (r.term_code === currentTermCode) {
      teachingInCurrentTerm = true;
      if (r.teaching_language) currentLang = r.teaching_language;
    }
  }
  return {
    teaching_languages: JSON.stringify(langList),
    current_term_teaching_language: currentLang,
    is_teaching_in_current_term: teachingInCurrentTerm,
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

// 讀取單一課程的所有教學記錄（分頁）
async function fetchTeachingRecordsForCourse(databases, courseCode) {
  const rows = [];
  let cursor = null;
  while (true) {
    const queries = [
      Query.equal('course_code', courseCode),
      Query.orderAsc('$createdAt'),
      Query.limit(PAGE_LIMIT),
      Query.select(['course_code', 'term_code', 'teaching_language', 'service_learning'])
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, TEACHING_RECORDS_COLLECTION_ID, queries);
    rows.push(...res.documents);
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  return rows;
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
  const currentTermCode = getCurrentTermCode();
  const [reviews, teachingRows] = await Promise.all([
    fetchReviewsForCourse(databases, courseCode),
    fetchTeachingRecordsForCourse(databases, courseCode),
  ]);
  const stats = computeStats(reviews);
  const teachingFields = computeTeachingFields(teachingRows, currentTermCode);
  const rowId = await findCourseRowId(databases, courseCode);
  if (!rowId) {
    log(`找不到課程 ${courseCode}，略過`);
    return { courseCode, updated: false };
  }
  await databases.updateDocument(DATABASE_ID, COURSES_COLLECTION_ID, rowId, { ...stats, ...teachingFields });
  log(`已更新 ${courseCode}: ${stats.stats_review_count} 則評論，語言=${teachingFields.teaching_languages}`);
  return { courseCode, updated: true, stats };
}

// 回填全部課程：一次讀完所有評論與教學記錄分組，再逐一更新課程
async function recomputeAll(databases, log, diag) {
  const currentTermCode = getCurrentTermCode();

  // 讀取所有評論並依 course_code 分組；同時累加講師聚合（單次掃描兼顧課程與講師）
  const reviewsByCourse = new Map();
  const instructorReviewAgg = new Map();
  let cursor = null;
  let totalReviews = 0;
  diag.stage = 'reading_reviews';
  while (true) {
    const queries = [
      Query.limit(PAGE_LIMIT),
      Query.select(['course_code', 'user_id', 'course_workload', 'course_difficulties', 'course_usefulness', 'course_final_grade', 'instructor_details'])
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, REVIEWS_COLLECTION_ID, queries);
    for (const r of res.documents) {
      if (!reviewsByCourse.has(r.course_code)) reviewsByCourse.set(r.course_code, []);
      reviewsByCourse.get(r.course_code).push(r);
      accumulateInstructorReview(instructorReviewAgg, r);
    }
    totalReviews += res.documents.length;
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  diag.totalReviews = totalReviews;

  // 讀取所有教學記錄並依 course_code 與 instructor_name 分組（升序以確保最後寫入的為最新）
  diag.stage = 'reading_teaching_records';
  const teachingByCourse = new Map();
  const teachingByInstructor = new Map();
  cursor = null;
  let totalTeaching = 0;
  while (true) {
    const queries = [
      Query.orderAsc('$createdAt'),
      Query.limit(PAGE_LIMIT),
      Query.select(['course_code', 'term_code', 'teaching_language', 'service_learning', 'instructor_name'])
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, TEACHING_RECORDS_COLLECTION_ID, queries);
    for (const r of res.documents) {
      if (!teachingByCourse.has(r.course_code)) teachingByCourse.set(r.course_code, []);
      teachingByCourse.get(r.course_code).push(r);
      // 合併講師列同時歸到每位個別講師之下
      for (const name of splitInstructorNames(r.instructor_name)) {
        if (!teachingByInstructor.has(name)) teachingByInstructor.set(name, []);
        teachingByInstructor.get(name).push(r);
      }
    }
    totalTeaching += res.documents.length;
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  diag.totalTeaching = totalTeaching;

  // 讀取所有課程（$id + course_code）
  diag.stage = 'reading_courses';
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
  diag.totalCourses = courses.length;

  // 讀取所有講師（$id + name）
  diag.stage = 'reading_instructors';
  const instructors = [];
  cursor = null;
  while (true) {
    const queries = [Query.limit(PAGE_LIMIT), Query.select(['$id', 'name'])];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, INSTRUCTORS_COLLECTION_ID, queries);
    instructors.push(...res.documents);
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  diag.totalInstructors = instructors.length;

  diag.stage = 'updating_courses';
  let updated = 0;
  let failed = 0;
  const sampleErrors = [];
  await runWithConcurrency(courses, UPDATE_CONCURRENCY, async (course) => {
    const reviews = reviewsByCourse.get(course.course_code) || [];
    const teachingRows = teachingByCourse.get(course.course_code) || [];
    const stats = computeStats(reviews);
    const teachingFields = computeTeachingFields(teachingRows, currentTermCode);
    try {
      await databases.updateDocument(DATABASE_ID, COURSES_COLLECTION_ID, course.$id, { ...stats, ...teachingFields });
      updated++;
    } catch (e) {
      failed++;
      if (sampleErrors.length < 5) sampleErrors.push(`${course.course_code}(${course.$id}): ${e.message}`);
    }
  });

  diag.stage = 'updating_instructors';
  let instructorsUpdated = 0;
  let instructorsFailed = 0;
  await runWithConcurrency(instructors, UPDATE_CONCURRENCY, async (instructor) => {
    const reviewStats = finalizeInstructorReviewStats(instructorReviewAgg.get(instructor.name));
    const teachingFields = computeInstructorTeachingFields(teachingByInstructor.get(instructor.name) || [], currentTermCode);
    try {
      await databases.updateDocument(DATABASE_ID, INSTRUCTORS_COLLECTION_ID, instructor.$id, { ...reviewStats, ...teachingFields });
      instructorsUpdated++;
    } catch (e) {
      instructorsFailed++;
      if (sampleErrors.length < 10) sampleErrors.push(`instructor ${instructor.name}(${instructor.$id}): ${e.message}`);
    }
  });

  diag.stage = 'done';
  return {
    updated, failed, totalCourses: courses.length,
    instructorsUpdated, instructorsFailed, totalInstructors: instructors.length,
    totalReviews, totalTeaching, sampleErrors,
  };
}

// 只重算全部講師統計（評論異動時觸發；講師統計無法增量更新，需全量掃描）
async function recomputeInstructors(databases, log, diag) {
  const currentTermCode = getCurrentTermCode();

  const instructorReviewAgg = new Map();
  let cursor = null;
  let totalReviews = 0;
  diag.stage = 'reading_reviews';
  while (true) {
    const queries = [
      Query.limit(PAGE_LIMIT),
      Query.select(['course_final_grade', 'instructor_details'])
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, REVIEWS_COLLECTION_ID, queries);
    for (const r of res.documents) accumulateInstructorReview(instructorReviewAgg, r);
    totalReviews += res.documents.length;
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  diag.totalReviews = totalReviews;

  diag.stage = 'reading_teaching_records';
  const teachingByInstructor = new Map();
  cursor = null;
  let totalTeaching = 0;
  while (true) {
    const queries = [
      Query.orderAsc('$createdAt'),
      Query.limit(PAGE_LIMIT),
      Query.select(['term_code', 'teaching_language', 'instructor_name'])
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, TEACHING_RECORDS_COLLECTION_ID, queries);
    for (const r of res.documents) {
      // 合併講師列同時歸到每位個別講師之下
      for (const name of splitInstructorNames(r.instructor_name)) {
        if (!teachingByInstructor.has(name)) teachingByInstructor.set(name, []);
        teachingByInstructor.get(name).push(r);
      }
    }
    totalTeaching += res.documents.length;
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  diag.totalTeaching = totalTeaching;

  diag.stage = 'reading_instructors';
  const instructors = [];
  cursor = null;
  while (true) {
    const queries = [Query.limit(PAGE_LIMIT), Query.select(['$id', 'name'])];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(DATABASE_ID, INSTRUCTORS_COLLECTION_ID, queries);
    instructors.push(...res.documents);
    if (res.documents.length < PAGE_LIMIT) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  diag.totalInstructors = instructors.length;

  diag.stage = 'updating_instructors';
  let updated = 0;
  let failed = 0;
  const sampleErrors = [];
  await runWithConcurrency(instructors, UPDATE_CONCURRENCY, async (instructor) => {
    const reviewStats = finalizeInstructorReviewStats(instructorReviewAgg.get(instructor.name));
    const teachingFields = computeInstructorTeachingFields(teachingByInstructor.get(instructor.name) || [], currentTermCode);
    try {
      await databases.updateDocument(DATABASE_ID, INSTRUCTORS_COLLECTION_ID, instructor.$id, { ...reviewStats, ...teachingFields });
      updated++;
    } catch (e) {
      failed++;
      if (sampleErrors.length < 10) sampleErrors.push(`instructor ${instructor.name}(${instructor.$id}): ${e.message}`);
    }
  });
  diag.stage = 'done';
  return { updated, failed, totalInstructors: instructors.length, totalReviews, totalTeaching, sampleErrors };
}

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://appwrite.lingubible.com/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const diag = { stage: 'start' };
  try {
    let body = {};
    try { body = JSON.parse(req.body || '{}'); } catch { body = {}; }

    // 由資料庫事件觸發時，req.body 是該則評論文件本身，從中取 course_code
    const courseCode = body.courseCode || body.course_code;

    // Appwrite 觸發來源：'schedule'（排程/cron）、'event'、'http'
    const trigger = req.headers?.['x-appwrite-trigger'];

    // 排程（cron）觸發時不帶任何 body，預設執行全量重算（這正是每日排程的目的）
    const isScheduledFullRun =
      trigger === 'schedule' && !courseCode && body.all !== false && body.instructors !== true;

    if (body.all === true || isScheduledFullRun) {
      const result = await recomputeAll(databases, log, diag);
      return res.json({ success: true, mode: 'all', triggeredBy: trigger || 'http', ...result });
    }

    if (body.instructors === true) {
      const result = await recomputeInstructors(databases, log, diag);
      return res.json({ success: true, mode: 'instructors', ...result });
    }

    if (courseCode) {
      const result = await recomputeOne(databases, courseCode, log);
      return res.json({ success: true, mode: 'single', ...result });
    }

    return res.json({ success: false, error: '需要 courseCode 或 all:true' }, 400);
  } catch (err) {
    error(`重算課程統計失敗 (stage=${diag.stage}): ${err.message}`);
    return res.json({ success: false, error: err.message, diag }, 500);
  }
};
