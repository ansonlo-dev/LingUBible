import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { CachedCourseService } from '@/services/cache/cachedCourseService';

interface VotingButtonsProps {
  reviewId: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  onVoteChange?: (newUpvotes: number, newDownvotes: number, newUserVote: 'up' | 'down' | null) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const VotingButtons = ({
  reviewId,
  upvotes,
  downvotes,
  userVote,
  onVoteChange,
  size = 'sm',
  disabled = false
}: VotingButtonsProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(upvotes);
  const [currentDownvotes, setCurrentDownvotes] = useState(downvotes);
  const [currentUserVote, setCurrentUserVote] = useState(userVote);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      toast({
        title: t('common.error'),
        description: t('review.loginRequired'),
        variant: 'destructive',
      });
      return;
    }

    if (loading || disabled) return;

    try {
      setLoading(true);

      // 如果用戶點擊了相同的投票類型，則移除投票
      if (currentUserVote === voteType) {
        await CachedCourseService.removeVoteFromReview(reviewId, user.$id);
        
        // 更新本地狀態
        const newUpvotes = voteType === 'up' ? currentUpvotes - 1 : currentUpvotes;
        const newDownvotes = voteType === 'down' ? currentDownvotes - 1 : currentDownvotes;
        
        setCurrentUpvotes(newUpvotes);
        setCurrentDownvotes(newDownvotes);
        setCurrentUserVote(null);
        
        onVoteChange?.(newUpvotes, newDownvotes, null);
      } else {
        // 投票或更改投票
        await CachedCourseService.voteOnReview(reviewId, user.$id, voteType);
        
        // 更新本地狀態
        let newUpvotes = currentUpvotes;
        let newDownvotes = currentDownvotes;
        
        if (currentUserVote === 'up') {
          newUpvotes -= 1;
        } else if (currentUserVote === 'down') {
          newDownvotes -= 1;
        }
        
        if (voteType === 'up') {
          newUpvotes += 1;
        } else {
          newDownvotes += 1;
        }
        
        setCurrentUpvotes(newUpvotes);
        setCurrentDownvotes(newDownvotes);
        setCurrentUserVote(voteType);
        
        onVoteChange?.(newUpvotes, newDownvotes, voteType);
      }
    } catch (error) {
      console.error('Error voting on review:', error);
      toast({
        title: t('common.error'),
        description: t('review.voteError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buttonSize = size === 'sm' ? 'sm' : 'default';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={() => handleVote('up')}
        disabled={loading || disabled}
        className={`text-muted-foreground hover:text-green-600 ${
          currentUserVote === 'up' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : ''
        }`}
      >
        {loading && currentUserVote === 'up' ? (
          <Loader2 className={`${iconSize} mr-1 animate-spin`} />
        ) : (
          <ThumbsUp className={`${iconSize} mr-1`} />
        )}
        {currentUpvotes}
      </Button>
      
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={() => handleVote('down')}
        disabled={loading || disabled}
        className={`text-muted-foreground hover:text-red-600 ${
          currentUserVote === 'down' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : ''
        }`}
      >
        {loading && currentUserVote === 'down' ? (
          <Loader2 className={`${iconSize} mr-1 animate-spin`} />
        ) : (
          <ThumbsDown className={`${iconSize} mr-1`} />
        )}
        {currentDownvotes}
      </Button>
    </div>
  );
}; 