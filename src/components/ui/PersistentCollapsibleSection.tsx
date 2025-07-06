import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PersistentCollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  sectionKey: string; // Unique key for storing state
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  expandedHint?: string;
  collapsedHint?: string;
}

// Helper to get/set collapse state in localStorage
const STORAGE_KEY_PREFIX = 'lingubible_section_state_';

const getSectionState = (sectionKey: string, defaultExpanded: boolean): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + sectionKey);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch (error) {
    console.warn('Failed to read section state from localStorage:', error);
  }
  return defaultExpanded;
};

const setSectionState = (sectionKey: string, isExpanded: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + sectionKey, String(isExpanded));
  } catch (error) {
    console.warn('Failed to save section state to localStorage:', error);
  }
};

export const PersistentCollapsibleSection: React.FC<PersistentCollapsibleSectionProps> = ({
  title,
  children,
  sectionKey,
  defaultExpanded = true,
  className,
  headerClassName,
  contentClassName,
  icon,
  badge,
  expandedHint = 'Click to collapse',
  collapsedHint = 'Click to expand'
}) => {
  const [isExpanded, setIsExpanded] = useState(() => 
    getSectionState(sectionKey, defaultExpanded)
  );

  // Update localStorage when state changes
  useEffect(() => {
    setSectionState(sectionKey, isExpanded);
  }, [sectionKey, isExpanded]);

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