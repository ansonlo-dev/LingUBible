import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  change?: string; // Keep for backward compatibility - maps to trendValue
  trendValue?: string;
  isLoading?: boolean; // Added back for compatibility
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
  change, // For backward compatibility
  trendValue,
  isLoading = false
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Use change prop if trendValue is not provided (backward compatibility)
  const displayTrendValue = trendValue || change;

  return (
    <Card className="stats-card p-0 relative overflow-hidden">
      {/* Universal single row layout for all devices [icon][title][number][change] */}
      <div className="flex items-start p-4">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Icon */}
          <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          
          {/* Title */}
          <h3 className="text-sm font-semibold text-muted-foreground flex-1 leading-tight">
            {title}
          </h3>
        </div>

        {/* Right aligned: Number and Change */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Number */}
          <div className="text-lg font-bold text-foreground font-mono tabular-nums">
            {isLoading ? (
              <div className="h-5 w-8 bg-muted animate-pulse rounded" />
            ) : (
              value
            )}
          </div>
          
          {/* Change (last 30 days) */}
          {displayTrendValue && !isLoading && (
            <span className={`text-xs font-medium font-mono ${getTrendColor()}`}>
              {displayTrendValue}
            </span>
          )}
          
          {/* Loading state for trend */}
          {isLoading && (
            <div className="h-3 w-8 bg-muted animate-pulse rounded" />
          )}
        </div>
      </div>

      {/* Decorative gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
    </Card>
  );
};
