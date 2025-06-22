import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { useLanguage } from '@/hooks/useLanguage';
import { useState } from 'react';

interface ReviewCardProps {
  reviewId: string;
  courseCode: string;
  courseName: string;
  rating: number;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  pros: string[];
  cons: string[];
  semester: string;
  likes: number;
  dislikes: number;
  replies: number;
  createdAt: string;
  // 匿名顯示選項
  showAnonymousAvatar?: boolean;
}

export function ReviewCard({
  reviewId,
  courseCode,
  courseName,
  rating,
  difficulty,
  content,
  pros,
  cons,
  semester,
  likes,
  dislikes,
  replies,
  createdAt,
  showAnonymousAvatar = false
}: ReviewCardProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="review-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {/* 匿名頭像 - 只在啟用時顯示 */}
            {showAnonymousAvatar && (
              <SmartAvatar
                reviewId={reviewId}
                config={{
                  showPersonalAvatar: false,
                  showAnonymousAvatar: true,
                  size: 'md',
                  context: 'review'
                }}
                className="flex-shrink-0"
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{courseCode}</h3>
                <Badge variant="outline" className={getDifficultyColor(difficulty)}>
                  {t(`difficulty.${difficulty}`)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{courseName}</p>
              
              {/* 評分和學期 */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
                </div>
                <span>{semester}</span>
                <span>{formatDate(createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* 評論內容 */}
          <div className="text-sm">
            <p className={`${!isExpanded && content.length > 200 ? 'line-clamp-3' : ''}`}>
              {content}
            </p>
            {content.length > 200 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-primary"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? t('review.collapse') : t('review.expandMore')}
              </Button>
            )}
          </div>

          {/* 優缺點 */}
          {(pros.length > 0 || cons.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {pros.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">
                    👍 {t('review.pros')}
                  </h4>
                  <ul className="space-y-1">
                    {pros.map((pro, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {cons.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                    👎 {t('review.cons')}
                  </h4>
                  <ul className="space-y-1">
                    {cons.map((con, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 互動按鈕 */}
          <div className="flex items-center gap-4 pt-2 border-t">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-600">
              <ThumbsUp className="h-4 w-4 mr-1" />
              {likes}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600">
              <ThumbsDown className="h-4 w-4 mr-1" />
              {dislikes}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              <MessageSquare className="h-4 w-4 mr-1" />
              {replies} {t('review.replies')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 