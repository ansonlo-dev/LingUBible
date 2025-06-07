import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { useUserStats } from '@/hooks/useUserStats';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserStatsDisplayProps {
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function UserStatsDisplay({ variant = 'compact', className = '' }: UserStatsDisplayProps) {
  const { stats, isLoading } = useUserStats();
  const { t } = useLanguage();

  // 不再顯示 loading 文字，而是顯示數據並添加載入動畫
  const showLoadingAnimation = isLoading;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center text-xs text-muted-foreground ${className}`}>
        <div className="flex items-center">
          <div className={`w-2 h-2 bg-green-500 rounded-full mr-1 ${showLoadingAnimation ? 'animate-pulse' : 'animate-pulse'}`}></div>
          <span className={`font-medium text-green-600 dark:text-green-400 ${showLoadingAnimation ? 'opacity-70' : ''}`}>
            {stats.onlineUsers || 0} {t('stats.users')}, {stats.onlineVisitors || 0} {t('stats.visitors')} {t('stats.online')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* 在線用戶和訪客 */}
      <div className={`flex items-center space-x-2 text-sm ${showLoadingAnimation ? 'opacity-70' : ''}`}>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <div className="font-semibold text-green-600 dark:text-green-400">
            {stats.onlineUsers + stats.onlineVisitors}
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.onlineUsers} {t('stats.users')}, {stats.onlineVisitors} {t('stats.visitors')}
          </div>
        </div>
      </div>

      {/* 總註冊用戶 */}
      <div className={`flex items-center space-x-2 text-sm ${showLoadingAnimation ? 'opacity-70' : ''}`}>
        <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <div>
          <div className="font-semibold text-blue-600 dark:text-blue-400">
            {stats.totalUsers}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('stats.totalRegistered')}
          </div>
        </div>
      </div>

      {/* 今日登入 */}
      <div className={`flex items-center space-x-2 text-sm ${showLoadingAnimation ? 'opacity-70' : ''}`}>
        <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <div>
          <div className="font-semibold text-orange-600 dark:text-orange-400">
            {stats.todayLogins}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('stats.todayLogins')}
          </div>
        </div>
      </div>

      {/* 本月登入 */}
      <div className={`flex items-center space-x-2 text-sm ${showLoadingAnimation ? 'opacity-70' : ''}`}>
        <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <div>
          <div className="font-semibold text-purple-600 dark:text-purple-400">
            {stats.thisMonthLogins}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('stats.thisMonthLogins')}
          </div>
        </div>
      </div>
    </div>
  );
} 