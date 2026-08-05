import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { MessagesSquare, Clock, GraduationCap, ThumbsUp } from 'lucide-react';
import { ReviewAvatar } from '@/components/ui/review-avatar';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { CourseService } from '@/services/api/courseService';
import type { InstructorReviewFromDetails, Instructor } from '@/services/api/courseService';
import { hasMarkdownFormatting, renderCommentMarkdown } from '@/utils/ui/markdownRenderer';
import { formatDateTimeUTC8 } from '@/utils/ui/dateUtils';
import { getCourseTitle, getInstructorName } from '@/utils/textUtils';

const PREVIEW_COUNT = 3;

type LatestReviewInfo = InstructorReviewFromDetails & { upvotes: number; downvotes: number };

/**
 * 主頁「最新評論」預覽區塊：顯示最新 3 筆評論。
 * 呼叫與 /reviews 第一頁完全相同的 getLatestReviews（同一快取 key），
 * 因此兩處共用同一份被動快取，不會產生額外的 Appwrite 讀取。
 */
export function LatestReviewsPreview() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<LatestReviewInfo[]>([]);
  const [instructorsMap, setInstructorsMap] = useState<Map<string, Instructor>>(new Map());
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await CourseService.getLatestReviews(CourseService.LATEST_REVIEWS_PAGE_SIZE);
        if (!cancelled) {
          setReviews(result.reviews.slice(0, PREVIEW_COUNT));
          setInstructorsMap(new Map(result.instructors.map(instructor => [instructor.name, instructor])));
        }
      } catch (error) {
        console.error('Error loading latest reviews preview:', error);
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // 載入失敗或沒有評論時整個區塊隱藏，不干擾主頁
  if (failed || (!loading && reviews.length === 0)) {
    return null;
  }

  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
      <div className="max-w-6xl mx-auto">
        {/* 標題列 + 查看全部 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessagesSquare className="h-5 w-5 text-primary" />
            {t('latestReviews.title')}
          </h2>
          <a
            href="/reviews"
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.button === 1) {
                return;
              }
              e.preventDefault();
              navigate('/reviews');
            }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-primary/10 hover:text-primary h-10 px-4 py-2 no-underline w-full md:w-auto"
          >
            {t('latestReviews.viewAll')}
          </a>
        </div>

        {/* 3 筆預覽卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: PREVIEW_COUNT }).map((_, idx) => (
              <div key={idx} className="rounded-lg p-4 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441] animate-pulse space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
              </div>
            ))
          ) : (
            reviews.map((reviewInfo) => {
              const courseInfo = getCourseTitle(reviewInfo.course, language);
              const comments = reviewInfo.review.course_comments || '';
              // 講師顯示名：優先用講師資料的多語言名稱，缺少時退回評論裡的原始名字
              const instructorNames = reviewInfo.instructorDetails
                .map(detail => {
                  const instructor = instructorsMap.get(detail.instructor_name);
                  return instructor ? getInstructorName(instructor, language).primary : detail.instructor_name;
                })
                .filter(Boolean);
              const uniqueInstructorNames = [...new Set(instructorNames)];

              return (
                <a
                  key={reviewInfo.review.$id}
                  href={`/courses/${reviewInfo.review.course_code}?review_id=${reviewInfo.review.$id}`}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) {
                      return;
                    }
                    e.preventDefault();
                    navigate(`/courses/${reviewInfo.review.course_code}?review_id=${reviewInfo.review.$id}`);
                  }}
                  className="rounded-lg p-4 bg-card border border-border dark:bg-[#202936] dark:border-[#2a3441] space-y-3 no-underline text-foreground hover:border-primary/50 hover:shadow-md transition-[border-color,box-shadow] duration-200 flex flex-col"
                >
                  {/* 用戶 + 成績 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ReviewAvatar
                        isAnonymous={reviewInfo.review.is_anon}
                        userId={reviewInfo.review.user_id}
                        username={reviewInfo.review.username}
                        reviewId={reviewInfo.review.$id}
                        size="sm"
                        className="shrink-0"
                      />
                      <span className="font-medium text-sm truncate">
                        {reviewInfo.review.is_anon ? t('review.anonymousUser') : reviewInfo.review.username}
                      </span>
                    </div>
                    {reviewInfo.review.course_final_grade && (
                      <GradeBadge
                        grade={reviewInfo.review.course_final_grade}
                        size="sm"
                        showTooltip={false}
                      />
                    )}
                  </div>

                  {/* 課程名稱 + 講師名 */}
                  <div className="min-w-0 space-y-1">
                    <div className="font-bold text-primary">{reviewInfo.review.course_code}</div>
                    <div className="text-sm text-muted-foreground truncate">{courseInfo.primary}</div>
                    {courseInfo.secondary && (
                      <div className="text-sm text-muted-foreground truncate">{courseInfo.secondary}</div>
                    )}
                    {uniqueInstructorNames.length > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
                        <GraduationCap className="h-4 w-4 shrink-0" />
                        <span className="truncate">{uniqueInstructorNames.join('、')}</span>
                      </div>
                    )}
                  </div>

                  {/* 評論摘要 */}
                  {comments && (
                    <div className="bg-muted/50 p-2 rounded-md text-sm text-muted-foreground break-words flex-1">
                      <div className="line-clamp-3">
                        {hasMarkdownFormatting(comments) ? (
                          <div>{renderCommentMarkdown(comments)}</div>
                        ) : (
                          <p className="whitespace-pre-line">{comments}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 學期 + 讚數 + 時間 */}
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-md border bg-background border-border truncate">
                        {reviewInfo.term.name}
                      </span>
                      {reviewInfo.upvotes > 0 && (
                        <span className="flex items-center gap-1 shrink-0">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {reviewInfo.upvotes}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTimeUTC8(reviewInfo.review.submitted_at || reviewInfo.review.$createdAt)}
                    </span>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
