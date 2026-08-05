import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { CourseService } from '@/services/api/courseService';
import type { InstructorReviewFromDetails, Instructor } from '@/services/api/courseService';
import { hasMarkdownFormatting, renderCommentMarkdown } from '@/utils/ui/markdownRenderer';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { getInstructorName, getCourseTitle, getTermName } from '@/utils/textUtils';
import { getGPA } from '@/utils/gradeUtils';
import { LatestReviewsFilters, LatestReviewFilters } from '@/components/features/reviews/LatestReviewsFilters';

const DEFAULT_FILTERS: LatestReviewFilters = {
  searchTerm: '',
  selectedCourses: [],
  selectedInstructors: [],
  selectedGrades: [],
  selectedTerms: [],
  selectedLanguages: [],
  selectedSessionTypes: [],
  sortBy: 'postDate',
  sortOrder: 'desc'
};

// 每次「載入更多」在畫面上多顯示的評論數（純客戶端，不發請求）
const DISPLAY_BATCH_SIZE = 20;


type LatestReviewInfo = InstructorReviewFromDetails & { upvotes: number; downvotes: number };

const LatestReviews = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<LatestReviewInfo[]>([]);
  const [instructorsMap, setInstructorsMap] = useState<Map<string, Instructor>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  // 畫面上顯示的評論數（「載入更多」只是揭露更多已在客戶端的資料，不發請求）
  const [displayCount, setDisplayCount] = useState(DISPLAY_BATCH_SIZE);

  // 篩選、搜尋與排序（純客戶端，套用於全部評論，不產生額外資料庫讀取）
  const [filters, setFilters] = useState<LatestReviewFilters>(DEFAULT_FILTERS);

  // 一次取得完整資料集（固定 2-3 個請求、5 分鐘被動快取），
  // 之後所有互動（篩選/搜尋/排序/載入更多）都是零讀取
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await CourseService.getAllReviewsForBrowsing();

      setReviews(result.reviews);
      setInstructorsMap(new Map(result.instructors.map(instructor => [instructor.name, instructor])));
      setTotal(result.total);
    } catch (err) {
      console.error('Error loading latest reviews:', err);
      setError(t('latestReviews.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // 篩選條件改變時回到第一批顯示數量
  useEffect(() => {
    setDisplayCount(DISPLAY_BATCH_SIZE);
  }, [filters]);

  const getLanguageDisplayName = (reviewLanguage: string) => {
    const languageMap: { [key: string]: string } = {
      'en': t('language.english'),
      'zh-TW': t('language.traditionalChinese'),
      'zh-CN': t('language.simplifiedChinese')
    };
    return languageMap[reviewLanguage] || reviewLanguage;
  };

  // 正規化成績值（'-1' 舊資料視為 N/A）
  const normalizeGrade = (grade: string) => (!grade || grade === '-1') ? 'N/A' : grade;

  // 所有篩選選項與計數皆由已載入的評論推導（不需額外查詢）
  const filterCounts = useMemo(() => {
    const courseCounts: { [key: string]: { label: string; count: number } } = {};
    const instructorCounts: { [key: string]: number } = {};
    const gradeCounts: { [key: string]: number } = {};
    const termCounts: { [key: string]: { name: string; count: number } } = {};
    const languageCounts: { [key: string]: number } = {};
    const sessionTypeCounts: { [key: string]: number } = {};

    reviews.forEach(reviewInfo => {
      const { review, course, term, instructorDetails } = reviewInfo;

      const courseLabel = `${review.course_code} - ${getCourseTitle(course, language).primary}`;
      if (!courseCounts[review.course_code]) {
        courseCounts[review.course_code] = { label: courseLabel, count: 0 };
      }
      courseCounts[review.course_code].count++;

      const seenInstructors = new Set<string>();
      const seenSessionTypes = new Set<string>();
      instructorDetails.forEach(detail => {
        if (detail.instructor_name && !seenInstructors.has(detail.instructor_name)) {
          seenInstructors.add(detail.instructor_name);
          instructorCounts[detail.instructor_name] = (instructorCounts[detail.instructor_name] || 0) + 1;
        }
        if (detail.session_type && !seenSessionTypes.has(detail.session_type)) {
          seenSessionTypes.add(detail.session_type);
          sessionTypeCounts[detail.session_type] = (sessionTypeCounts[detail.session_type] || 0) + 1;
        }
      });

      const grade = normalizeGrade(review.course_final_grade);
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;

      if (!termCounts[term.term_code]) {
        termCounts[term.term_code] = { name: term.name, count: 0 };
      }
      termCounts[term.term_code].count++;

      const lang = review.review_language || 'en';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    // 課程按代碼排序、成績由高至低（N/A 最後）、學期由新至舊
    const sortedCourseCounts = Object.fromEntries(
      Object.entries(courseCounts).sort((a, b) => a[0].localeCompare(b[0]))
    );
    const sortedGradeCounts = Object.fromEntries(
      Object.entries(gradeCounts).sort((a, b) => {
        const gpaA = getGPA(a[0]);
        const gpaB = getGPA(b[0]);
        if (gpaA === null) return 1;
        if (gpaB === null) return -1;
        return gpaB - gpaA;
      })
    );
    const sortedTermCounts = Object.fromEntries(
      Object.entries(termCounts).sort((a, b) => {
        // 正式學期代碼（2024-T1 / 2024-S）由新至舊排前面，
        // 舊格式代碼（UNKNOWN / *_on_or_before / 純年份）排後面
        const realA = /^\d{4}-(T\d|S)$/.test(a[0]);
        const realB = /^\d{4}-(T\d|S)$/.test(b[0]);
        if (realA !== realB) return realA ? -1 : 1;
        return b[0].localeCompare(a[0]);
      })
    );
    const sortedInstructorCounts = Object.fromEntries(
      Object.entries(instructorCounts).sort((a, b) => a[0].localeCompare(b[0]))
    );

    return {
      courseCounts: sortedCourseCounts,
      instructorCounts: sortedInstructorCounts,
      gradeCounts: sortedGradeCounts,
      termCounts: sortedTermCounts,
      languageCounts,
      sessionTypeCounts
    };
  }, [reviews, language]);

  const hasActiveFilters =
    filters.searchTerm.trim() !== '' ||
    filters.selectedCourses.length > 0 ||
    filters.selectedInstructors.length > 0 ||
    filters.selectedGrades.length > 0 ||
    filters.selectedTerms.length > 0 ||
    filters.selectedLanguages.length > 0 ||
    filters.selectedSessionTypes.length > 0;

  const clearAllFilters = () => setFilters(DEFAULT_FILTERS);

  // 智能搜尋索引：每則評論一個可搜尋字串（課程代碼/名稱、講師名/暱稱、
  // 評論內容、學期名；匿名評論不納入 username，避免以帳號名反查匿名者）
  const searchIndex = useMemo(() => {
    const index = new Map<string, string>();
    reviews.forEach(reviewInfo => {
      const { review, course, term, instructorDetails } = reviewInfo;
      const parts: string[] = [
        review.course_code,
        course.course_title || '',
        course.course_title_tc || '',
        course.course_title_sc || '',
        term.name,
        review.course_comments || ''
      ];
      instructorDetails.forEach(detail => {
        parts.push(detail.instructor_name || '');
        const instructor = instructorsMap.get(detail.instructor_name);
        if (instructor) {
          parts.push(instructor.name_tc || '', instructor.name_sc || '', instructor.nickname || '');
        }
        parts.push(detail.comments || '', detail.service_learning_description || '');
      });
      if (!review.is_anon) {
        parts.push(review.username || '');
      }
      index.set(review.$id, parts.join('\n').toLowerCase());
    });
    return index;
  }, [reviews, instructorsMap]);

  // 客戶端篩選 + 搜尋 + 排序（套用於全部評論）
  const filteredReviews = useMemo(() => {
    let result = reviews;

    // 智能搜尋：以空白分詞，所有關鍵詞都要命中（AND）
    const tokens = filters.searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      result = result.filter(reviewInfo => {
        const haystack = searchIndex.get(reviewInfo.review.$id) || '';
        return tokens.every(token => haystack.includes(token));
      });
    }

    if (filters.selectedCourses.length > 0) {
      result = result.filter(r => filters.selectedCourses.includes(r.review.course_code));
    }
    if (filters.selectedInstructors.length > 0) {
      result = result.filter(r =>
        r.instructorDetails.some(d => filters.selectedInstructors.includes(d.instructor_name))
      );
    }
    if (filters.selectedGrades.length > 0) {
      result = result.filter(r => filters.selectedGrades.includes(normalizeGrade(r.review.course_final_grade)));
    }
    if (filters.selectedTerms.length > 0) {
      result = result.filter(r => filters.selectedTerms.includes(r.term.term_code));
    }
    if (filters.selectedLanguages.length > 0) {
      result = result.filter(r => filters.selectedLanguages.includes(r.review.review_language || 'en'));
    }
    if (filters.selectedSessionTypes.length > 0) {
      result = result.filter(r =>
        r.instructorDetails.some(d => filters.selectedSessionTypes.includes(d.session_type))
      );
    }

    const byDateDesc = (a: LatestReviewInfo, b: LatestReviewInfo) =>
      new Date(b.review.$createdAt).getTime() - new Date(a.review.$createdAt).getTime();
    const direction = filters.sortOrder === 'asc' ? 1 : -1;
    // 課程評分欄位：null / -1（N/A）一律排最後，不論排序方向
    const byRatingField = (field: 'course_workload' | 'course_difficulties' | 'course_usefulness') =>
      (a: LatestReviewInfo, b: LatestReviewInfo) => {
        const valA = a.review[field];
        const valB = b.review[field];
        const naA = valA === null || valA === -1;
        const naB = valB === null || valB === -1;
        if (naA && naB) return byDateDesc(a, b);
        if (naA) return 1;
        if (naB) return -1;
        return direction * (valA - valB) || byDateDesc(a, b);
      };

    const sorted = [...result];
    switch (filters.sortBy) {
      case 'workload':
        sorted.sort(byRatingField('course_workload'));
        break;
      case 'difficulty':
        sorted.sort(byRatingField('course_difficulties'));
        break;
      case 'usefulness':
        sorted.sort(byRatingField('course_usefulness'));
        break;
      case 'grade':
        sorted.sort((a, b) => {
          const gpaA = getGPA(normalizeGrade(a.review.course_final_grade));
          const gpaB = getGPA(normalizeGrade(b.review.course_final_grade));
          // 無成績（N/A）一律排最後
          if (gpaA === null && gpaB === null) return byDateDesc(a, b);
          if (gpaA === null) return 1;
          if (gpaB === null) return -1;
          return direction * (gpaA - gpaB) || byDateDesc(a, b);
        });
        break;
      case 'upvotes':
        sorted.sort((a, b) => direction * (a.upvotes - b.upvotes) || byDateDesc(a, b));
        break;
      case 'downvotes':
        sorted.sort((a, b) => direction * (a.downvotes - b.downvotes) || byDateDesc(a, b));
        break;
      default: // postDate
        sorted.sort((a, b) => direction * -byDateDesc(a, b));
    }

    return sorted;
  }, [reviews, filters, searchIndex]);

  // 實際渲染的評論（客戶端分頁）
  const displayedReviews = useMemo(
    () => filteredReviews.slice(0, displayCount),
    [filteredReviews, displayCount]
  );
  const hasMoreToDisplay = displayCount < filteredReviews.length;

  const renderSessionTypeBadge = (sessionType: string) => (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs shrink-0 ${
        sessionType === 'Lecture'
          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
          : sessionType === 'Tutorial'
          ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
          : 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
      }`}
    >
      {t(`sessionTypeBadge.${sessionType.toLowerCase()}`)}
    </span>
  );

  return (
    <div className="mx-auto px-4 lg:px-8 xl:px-16 py-8">
      {/* Header */}
      <div className="space-y-2 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{t('latestReviews.title')}</h1>
          {total > 0 && (
            <span className="px-2.5 py-1 text-sm rounded-full bg-primary/10 text-primary font-medium">
              {t('latestReviews.totalReviews', { count: total })}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">{t('latestReviews.subtitle')}</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-lg p-12 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-medium">{t('common.error')}</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => loadReviews()} variant="outline">
              {t('latestReviews.retry')}
            </Button>
          </div>
        </div>
      )}

      {/* Filters & Sort - 與課程頁 reviews tab 同風格；純客戶端，僅套用於已載入的評論 */}
      {!loading && !error && reviews.length > 0 && (
        <div className="mb-6">
          <LatestReviewsFilters
            filters={filters}
            onFiltersChange={setFilters}
            courseCounts={filterCounts.courseCounts}
            instructorCounts={filterCounts.instructorCounts}
            gradeCounts={filterCounts.gradeCounts}
            termCounts={filterCounts.termCounts}
            languageCounts={filterCounts.languageCounts}
            sessionTypeCounts={filterCounts.sessionTypeCounts}
            totalReviews={reviews.length}
            filteredReviews={filteredReviews.length}
            onClearAll={clearAllFilters}
          />
        </div>
      )}

      {/* Reviews List */}
      {!loading && !error && (
        <>
          {reviews.length === 0 ? (
            <div className="rounded-lg p-12 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
              <div className="text-center space-y-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">{t('latestReviews.noReviews')}</h3>
                <p className="text-muted-foreground">{t('latestReviews.noReviewsDescription')}</p>
              </div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-lg p-12 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
              <div className="text-center space-y-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-medium">{t('common.noResults')}</h3>
                <p className="text-muted-foreground">{t('pages.courses.noResultsDesc')}</p>
                <Button onClick={clearAllFilters} variant="outline" className="mt-2">
                  {t('filter.clearAll')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* 2 Column Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayedReviews.map((reviewInfo) => {
                  const courseInfo = getCourseTitle(reviewInfo.course, language);
                  const isExpanded = expandedComments[reviewInfo.review.$id];
                  const comments = reviewInfo.review.course_comments || '';
                  const isLongComment = comments.length > 300;

                  return (
                    <div key={reviewInfo.review.$id} className="rounded-lg p-3 space-y-2 overflow-hidden bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441]">
                      {/* 評論基本信息 */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <ReviewAvatar
                              isAnonymous={reviewInfo.review.is_anon}
                              userId={reviewInfo.review.user_id}
                              username={reviewInfo.review.username}
                              reviewId={reviewInfo.review.$id}
                              size="sm"
                              className="shrink-0"
                            />
                            <span className="font-medium truncate">
                              {reviewInfo.review.is_anon ? t('review.anonymousUser') : reviewInfo.review.username}
                            </span>
                          </div>
                          {/* 學期和語言徽章 - 手機版顯示 */}
                          <div className="flex flex-wrap gap-1.5 md:hidden">
                            <span className="px-2 py-1 text-xs rounded-md border bg-background border-border w-fit">
                              {getTermName(reviewInfo.term.name, t)}
                            </span>
                            {reviewInfo.review.review_language && (
                              <span className="px-2 py-1 text-xs rounded-md border bg-background border-border w-fit">
                                {getLanguageDisplayName(reviewInfo.review.review_language)}
                              </span>
                            )}
                          </div>
                          {/* 課程標題 */}
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-lg">
                                <a
                                  href={`/courses/${reviewInfo.review.course_code}?review_id=${reviewInfo.review.$id}`}
                                  className="text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-2 py-1 rounded-md inline-block no-underline"
                                  onClick={(e) => {
                                    if (e.ctrlKey || e.metaKey || e.button === 1) {
                                      return;
                                    }
                                    e.preventDefault();
                                    navigate(`/courses/${reviewInfo.review.course_code}?review_id=${reviewInfo.review.$id}`);
                                  }}
                                >
                                  <div className="font-bold">{reviewInfo.review.course_code}</div>
                                  <div className="text-sm text-muted-foreground font-normal">{courseInfo.primary}</div>
                                  {courseInfo.secondary && (
                                    <div className="text-sm text-muted-foreground font-normal mt-0.5">
                                      {courseInfo.secondary}
                                    </div>
                                  )}
                                </a>
                              </h4>
                            </div>
                          </div>
                        </div>
                        {/* 右上角：學期和語言徽章、最終成績 */}
                        <div className="flex items-start gap-3 shrink-0">
                          <div className="hidden md:flex items-center gap-2 shrink-0">
                            <span className="px-2 py-1 text-xs rounded-md border bg-background border-border">
                              {getTermName(reviewInfo.term.name, t)}
                            </span>
                            {reviewInfo.review.review_language && (
                              <span className="px-2 py-1 text-xs rounded-md border bg-background border-border">
                                {getLanguageDisplayName(reviewInfo.review.review_language)}
                              </span>
                            )}
                          </div>
                          {reviewInfo.review.course_final_grade && (
                            <div className="flex flex-col items-center">
                              <GradeBadge
                                grade={reviewInfo.review.course_final_grade}
                                size="md"
                                showTooltip={true}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 課程評分 */}
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="text-center">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                            <span className="font-medium text-sm sm:text-base">{t('review.workload')}</span>
                            <div className="flex items-center justify-center lg:ml-1">
                              {reviewInfo.review.course_workload === null || reviewInfo.review.course_workload === -1 ? (
                                <span className="text-muted-foreground">
                                  {reviewInfo.review.course_workload === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                                </span>
                              ) : (
                                <StarRating rating={reviewInfo.review.course_workload} showValue size="sm" showTooltip ratingType="workload" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                            <span className="font-medium text-sm sm:text-base">{t('review.difficulty')}</span>
                            <div className="flex items-center justify-center lg:ml-1">
                              {reviewInfo.review.course_difficulties === null || reviewInfo.review.course_difficulties === -1 ? (
                                <span className="text-muted-foreground">
                                  {reviewInfo.review.course_difficulties === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                                </span>
                              ) : (
                                <StarRating rating={reviewInfo.review.course_difficulties} showValue size="sm" showTooltip ratingType="difficulty" />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-1 mb-1 lg:mb-0">
                            <span className="font-medium text-sm sm:text-base">{t('review.usefulness')}</span>
                            <div className="flex items-center justify-center lg:ml-1">
                              {reviewInfo.review.course_usefulness === null || reviewInfo.review.course_usefulness === -1 ? (
                                <span className="text-muted-foreground">
                                  {reviewInfo.review.course_usefulness === -1 ? t('review.notApplicable') : t('review.rating.notRated')}
                                </span>
                              ) : (
                                <StarRating rating={reviewInfo.review.course_usefulness} showValue size="sm" showTooltip ratingType="usefulness" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 課程評論 */}
                      {comments && (
                        <>
                          <Separator />
                          <div className="min-w-0">
                            <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 shrink-0" />
                              <span>{t('review.courseComments')}</span>
                            </h5>
                            <div className="bg-muted/50 p-2 rounded-md break-words text-sm">
                              <div className={!isExpanded && isLongComment ? 'line-clamp-5' : ''}>
                                {hasMarkdownFormatting(comments) ? (
                                  <div className="text-sm">{renderCommentMarkdown(comments)}</div>
                                ) : (
                                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    {comments}
                                  </p>
                                )}
                              </div>
                              {isLongComment && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-primary mt-1"
                                  onClick={() => setExpandedComments(prev => ({
                                    ...prev,
                                    [reviewInfo.review.$id]: !prev[reviewInfo.review.$id]
                                  }))}
                                >
                                  {isExpanded ? t('review.collapse') : t('review.expandMore')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* 講師評分（精簡版：講師名 + 課堂類型 + 教學評分） */}
                      {reviewInfo.instructorDetails.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">{t('review.instructorEvaluation')}</h5>
                          <div className="space-y-2">
                            {reviewInfo.instructorDetails.map((instructorDetail, idx) => {
                              const instructor = instructorsMap.get(instructorDetail.instructor_name);
                              const nameInfo = instructor ? getInstructorName(instructor, language) : null;

                              return (
                                <div key={idx} className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-md">
                                  <a
                                    href={`/instructors/${encodeURIComponent(instructorDetail.instructor_name)}?review_id=${reviewInfo.review.$id}`}
                                    className="text-primary cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-1.5 py-0.5 rounded-md inline-block no-underline text-sm font-medium min-w-0"
                                    onClick={(e) => {
                                      if (e.ctrlKey || e.metaKey || e.button === 1) {
                                        return;
                                      }
                                      e.preventDefault();
                                      navigate(`/instructors/${encodeURIComponent(instructorDetail.instructor_name)}?review_id=${reviewInfo.review.$id}`);
                                    }}
                                  >
                                    {nameInfo ? nameInfo.primary : instructorDetail.instructor_name}
                                  </a>
                                  {renderSessionTypeBadge(instructorDetail.session_type)}
                                  <div className="flex items-center gap-1 ml-auto text-xs">
                                    <span className="text-muted-foreground">{t('review.teachingScore')}</span>
                                    {instructorDetail.teaching === null ? (
                                      <span className="text-muted-foreground">{t('review.rating.notRated')}</span>
                                    ) : instructorDetail.teaching === -1 ? (
                                      <span className="text-muted-foreground">
                                        {instructorDetail.not_attended ? t('review.notAttended') : t('review.notApplicable')}
                                      </span>
                                    ) : (
                                      <StarRating rating={instructorDetail.teaching} showValue size="sm" showTooltip ratingType="teaching" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 底部：投票數（唯讀）與提交時間 */}
                      <Separator />
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {reviewInfo.upvotes}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="h-3.5 w-3.5" />
                            {reviewInfo.downvotes}
                          </span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDateTimeUTC8(reviewInfo.review.submitted_at || reviewInfo.review.$createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 載入更多（純客戶端揭露，不發請求） */}
              <div className="flex justify-center mt-8">
                {hasMoreToDisplay ? (
                  <Button
                    variant="outline"
                    onClick={() => setDisplayCount(prev => prev + DISPLAY_BATCH_SIZE)}
                    className="w-full sm:w-auto"
                  >
                    {t('latestReviews.loadMore')}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('latestReviews.noMoreReviews')}</p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default LatestReviews;
