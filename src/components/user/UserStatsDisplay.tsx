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

  if (isLoading) {
    return (
      <div className={`flex items-center text-xs text-muted-foreground ${className}`}>
        <Users className="h-3 w-3 mr-1" />
        {t('stats.loading')}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center text-xs text-muted-foreground ${className}`}>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
          <span className="font-medium text-green-600 dark:text-green-400">
            {stats.onlineUsers}
          </span>
          <span className="ml-1">{t('stats.usersOnline')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* 在線用戶 */}
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <div className="font-semibold text-green-600 dark:text-green-400">
            {stats.onlineUsers}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('stats.onlineUsers')}
          </div>
        </div>
      </div>

      {/* 總註冊用戶 */}
      <div className="flex items-center space-x-2 text-sm">
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
      <div className="flex items-center space-x-2 text-sm">
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
      <div className="flex items-center space-x-2 text-sm">
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