import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { CourseService } from '@/services/api/courseService';
import type { InstructorReviewFromDetails, Instructor } from '@/services/api/courseService';
import { hasMarkdownFormatting, renderCommentMarkdown } from '@/utils/ui/markdownRenderer';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { getInstructorName, getCourseTitle } from '@/utils/textUtils';
import { getGPA } from '@/utils/gradeUtils';

type SortOption = 'newest' | 'oldest' | 'mostUpvoted' | 'gradeDesc' | 'gradeAsc';

const REVIEW_LANGUAGES = ['en', 'zh-TW', 'zh-CN'] as const;

// 與主頁預覽共用同一頁大小，兩處才會命中同一份快取
const PAGE_SIZE = CourseService.LATEST_REVIEWS_PAGE_SIZE;

type LatestReviewInfo = InstructorReviewFromDetails & { upvotes: number; downvotes: number };

const LatestReviews = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<LatestReviewInfo[]>([]);
  const [instructorsMap, setInstructorsMap] = useState<Map<string, Instructor>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // 篩選與排序（純客戶端，僅套用於已載入的評論，不產生額外資料庫讀取）
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTermCode, setSelectedTermCode] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const loadReviews = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const result = await CourseService.getLatestReviews(PAGE_SIZE, cursor);

      setReviews(prev => cursor ? [...prev, ...result.reviews] : result.reviews);
      setInstructorsMap(prev => {
        const merged = cursor ? new Map(prev) : new Map<string, Instructor>();
        result.instructors.forEach(instructor => merged.set(instructor.name, instructor));
        return merged;
      });
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
      setTotal(result.total);
    } catch (err) {
      console.error('Error loading latest reviews:', err);
      if (!cursor) {
        setError(t('latestReviews.loadError'));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const getLanguageDisplayName = (reviewLanguage: string) => {
    const languageMap: { [key: string]: string } = {
      'en': t('language.english'),
      'zh-TW': t('language.traditionalChinese'),
      'zh-CN': t('language.simplifiedChinese')
    };
    return languageMap[reviewLanguage] || reviewLanguage;
  };

  // 學期選項：由已載入評論推導（不需額外查詢），依學期代碼由新至舊排列
  const termOptions = useMemo(() => {
    const map = new Map<string, string>();
    reviews.forEach(r => {
      if (!map.has(r.term.term_code)) map.set(r.term.term_code, r.term.name);
    });
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([code, name]) => ({ code, name }));
  }, [reviews]);

  // 各語言在已載入評論中的數量（顯示於語言 chips）
  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reviews.forEach(r => {
      const lang = r.review.review_language || 'en';
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const hasActiveFilters = searchTerm.trim() !== '' || selectedLanguages.length > 0 || selectedTermCode !== 'all' || sortBy !== 'newest';

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedLanguages([]);
    setSelectedTermCode('all');
    setSortBy('newest');
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  // 客戶端篩選 + 排序
  const filteredReviews = useMemo(() => {
    let result = reviews;

    const search = searchTerm.trim().toLowerCase();
    if (search) {
      result = result.filter(reviewInfo => {
        const { review, course, instructorDetails } = reviewInfo;
        if (review.course_code.toLowerCase().includes(search)) return true;
        if ((course.course_title || '').toLowerCase().includes(search)) return true;
        if ((course.course_title_tc || '').toLowerCase().includes(search)) return true;
        if ((course.course_title_sc || '').toLowerCase().includes(search)) return true;
        return instructorDetails.some(detail => {
          if (detail.instructor_name.toLowerCase().includes(search)) return true;
          const instructor = instructorsMap.get(detail.instructor_name);
          return instructor
            ? (instructor.name_tc || '').toLowerCase().includes(search) ||
              (instructor.name_sc || '').toLowerCase().includes(search)
            : false;
        });
      });
    }

    if (selectedLanguages.length > 0) {
      result = result.filter(reviewInfo =>
        selectedLanguages.includes(reviewInfo.review.review_language || 'en')
      );
    }

    if (selectedTermCode !== 'all') {
      result = result.filter(reviewInfo => reviewInfo.term.term_code === selectedTermCode);
    }

    const byDateDesc = (a: LatestReviewInfo, b: LatestReviewInfo) =>
      new Date(b.review.$createdAt).getTime() - new Date(a.review.$createdAt).getTime();

    const sorted = [...result];
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => -byDateDesc(a, b));
        break;
      case 'mostUpvoted':
        sorted.sort((a, b) => (b.upvotes - a.upvotes) || byDateDesc(a, b));
        break;
      case 'gradeDesc':
      case 'gradeAsc': {
        const direction = sortBy === 'gradeDesc' ? -1 : 1;
        sorted.sort((a, b) => {
          const gpaA = getGPA(a.review.course_final_grade);
          const gpaB = getGPA(b.review.course_final_grade);
          // 無成績（N/A）一律排最後
          if (gpaA === null && gpaB === null) return byDateDesc(a, b);
          if (gpaA === null) return 1;
          if (gpaB === null) return -1;
          return direction * (gpaA - gpaB) || byDateDesc(a, b);
        });
        break;
      }
      default:
        sorted.sort(byDateDesc);
    }

    return sorted;
  }, [reviews, searchTerm, selectedLanguages, selectedTermCode, sortBy, instructorsMap]);

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

      {/* Filters & Sort - 純客戶端，僅套用於已載入的評論 */}
      {!loading && !error && reviews.length > 0 && (
        <div className="rounded-lg p-4 mb-6 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441] space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* 搜尋 */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('latestReviews.searchPlaceholder')}
                className="pl-9 pr-8"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* 學期 */}
            <Select value={selectedTermCode} onValueChange={setSelectedTermCode}>
              <SelectTrigger className="w-full md:w-44 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter.all')}</SelectItem>
                {termOptions.map(term => (
                  <SelectItem key={term.code} value={term.code}>{term.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* 排序 */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full md:w-44 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t('latestReviews.sort.newest')}</SelectItem>
                <SelectItem value="oldest">{t('latestReviews.sort.oldest')}</SelectItem>
                <SelectItem value="mostUpvoted">{t('latestReviews.sort.mostUpvoted')}</SelectItem>
                <SelectItem value="gradeDesc">{t('latestReviews.sort.gradeDesc')}</SelectItem>
                <SelectItem value="gradeAsc">{t('latestReviews.sort.gradeAsc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* 語言 chips + 清除 */}
          <div className="flex flex-wrap items-center gap-2">
            {REVIEW_LANGUAGES.map(lang => {
              const isSelected = selectedLanguages.includes(lang);
              const count = languageCounts[lang] || 0;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {getLanguageDisplayName(lang)}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                {t('filter.clearAll')}
              </Button>
            )}
          </div>
          {/* 統計 + 提示 */}
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>{t('latestReviews.matchedCount', { filtered: filteredReviews.length, loaded: reviews.length })}</p>
            {hasActiveFilters && hasMore && <p>{t('latestReviews.filterHint')}</p>}
          </div>
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
                <p className="text-muted-foreground">{t('latestReviews.filterHint')}</p>
                <Button onClick={clearAllFilters} variant="outline" className="mt-2">
                  {t('filter.clearAll')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* 2 Column Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredReviews.map((reviewInfo) => {
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
                              {reviewInfo.term.name}
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
                              {reviewInfo.term.name}
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

              {/* 載入更多 */}
              <div className="flex justify-center mt-8">
                {hasMore ? (
                  <Button
                    variant="outline"
                    disabled={loadingMore}
                    onClick={() => nextCursor && loadReviews(nextCursor)}
                    className="w-full sm:w-auto"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('latestReviews.loadMore')
                    )}
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
