import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  expandedHint?: string;
  collapsedHint?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  className,
  headerClassName,
  contentClassName,
  icon,
  badge,
  expandedHint = 'Click to collapse',
  collapsedHint = 'Click to expand'
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className={cn('overflow-hidden transition-all duration-300', className)}>
      <CardHeader className={cn('cursor-pointer select-none', headerClassName)} onClick={toggleExpanded}>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 overflow-hidden min-w-0">
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="truncate">{title}</span>
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {badge && <span>{badge}</span>}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition-colors hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              title={isExpanded ? expandedHint : collapsedHint}
              aria-label={isExpanded ? expandedHint : collapsedHint}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className={cn('animate-in slide-in-from-top-2 duration-300', contentClassName)}>
          {children}
        </CardContent>
      )}
    </Card>
  );
};