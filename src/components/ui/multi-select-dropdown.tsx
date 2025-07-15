import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Status indicator component for terms
const StatusDot = ({ status }: { status: 'current' | 'past' | 'future' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'current':
        return 'bg-green-500 shadow-green-500/50';
      case 'past':
        return 'bg-gray-400 shadow-gray-400/50';
      case 'future':
        return 'bg-blue-500 shadow-blue-500/50';
      default:
        return 'bg-gray-400 shadow-gray-400/50';
    }
  };

  return (
    <div 
      className={cn(
        "w-2 h-2 rounded-full shadow-sm shrink-0",
        getStatusStyles()
      )}
      title={
        status === 'current' ? 'Current Term' : 
        status === 'past' ? 'Past Term' : 
        'Future Term'
      }
    />
  );
};

export interface SelectOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean; // For group headers
  status?: 'current' | 'past' | 'future'; // For term status indicators
  isTeachingLanguage?: boolean; // For teaching language options
}

interface MultiSelectDropdownProps {
  options: SelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  showCounts?: boolean;
  maxHeight?: string;
  disabled?: boolean;
  totalCount?: number;
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options",
  className,
  showCounts = true,
  maxHeight = "max-h-64",
  disabled = false,
  totalCount
}: MultiSelectDropdownProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Ensure selectedValues is always an array
  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];

  // Fix mobile scrolling issue
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !isMobile) return;

    let startY = 0;
    let startScrollTop = 0;
    let isDragging = false;
    let initialTouchHandled = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startY = touch.clientY;
        startScrollTop = scrollContainer.scrollTop;
        isDragging = false;
        initialTouchHandled = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const currentY = touch.clientY;
        const deltaY = startY - currentY;
        const newScrollTop = startScrollTop + deltaY;
        
        // Check if we're at the boundaries of the dropdown scroll
        const isAtTop = scrollContainer.scrollTop <= 0;
        const isAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight;
        
        // If we're trying to scroll beyond the dropdown's boundaries, allow page scrolling
        if ((isAtTop && deltaY < 0) || (isAtBottom && deltaY > 0)) {
          // Allow the page to scroll by not preventing default
          return;
        }
        
        // If we're scrolling within the dropdown, prevent page scrolling
        if (newScrollTop >= 0 && newScrollTop <= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
          e.preventDefault();
          e.stopPropagation();
          isDragging = true;
        }
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
      initialTouchHandled = false;
    };

    // Add touch event listeners with proper passive settings
    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  // Additional mobile touch handling for the entire dropdown
  useEffect(() => {
    if (!isMobile) return;

    const handleGlobalTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // Check if the touch started inside a dropdown
      if (target.closest('[data-radix-select-content]') || target.closest('.multi-select-dropdown')) {
        // Store the initial touch position
        const touch = e.touches[0];
        (window as any).dropdownTouchStart = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const dropdownContent = target.closest('[data-radix-select-content]') || target.closest('.multi-select-dropdown');
      
      if (dropdownContent) {
        const touch = e.touches[0];
        const startTouch = (window as any).dropdownTouchStart;
        
        if (startTouch) {
          const deltaX = Math.abs(touch.clientX - startTouch.x);
          const deltaY = Math.abs(touch.clientY - startTouch.y);
          
          // If it's primarily a vertical scroll gesture and we're not in a scrollable area
          if (deltaY > deltaX && deltaY > 10) {
            const scrollableElement = target.closest('[data-overflow-scroll]');
            if (!scrollableElement) {
              // Allow page scrolling by not preventing default
              return;
            }
          }
        }
      }
    };

    document.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, [isMobile]);

  // Calculate total count if not provided
  const calculatedTotalCount = totalCount ?? options.reduce((sum, option) => sum + (option.count || 0), 0);

  // Filter out disabled options (group headers) for counting
  const selectableOptions = options.filter(option => !option.value.startsWith('__faculty_'));

  // Check if all options are selected
  const isAllSelected = safeSelectedValues.length === selectableOptions.length &&
    selectableOptions.every(opt => safeSelectedValues.includes(opt.value));

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all individual options
      const allOptionValues = selectableOptions.map(opt => opt.value);
      onSelectionChange(allOptionValues);
    }
  };

  const handleOptionToggle = (optionValue: string, checked: boolean) => {
    
    // Handle group selection for faculty headers
    if (optionValue.startsWith('__faculty_')) {
      const facultyName = optionValue.replace('__faculty_', '');
      
      // Find all departments under this faculty
      const facultyHeaderIndex = options.findIndex(opt => opt.value === optionValue);
      const nextFacultyHeaderIndex = options.findIndex((opt, idx) => 
        idx > facultyHeaderIndex && opt.value.startsWith('__faculty_')
      );
      
      const facultyDepartments = options
        .slice(
          facultyHeaderIndex + 1, 
          nextFacultyHeaderIndex === -1 ? undefined : nextFacultyHeaderIndex
        )
        .filter(opt => !opt.value.startsWith('__faculty_'))
        .map(opt => opt.value);
      
      let newValues: string[];
      
      if (checked) {
        // Add all departments under this faculty
        newValues = [...new Set([...safeSelectedValues, ...facultyDepartments])];
      } else {
        // Remove all departments under this faculty
        newValues = safeSelectedValues.filter(v => !facultyDepartments.includes(v));
      }
      
      onSelectionChange(newValues);
      return;
    }
    
    let newValues: string[];
    
    if (checked) {
      // Add the option to existing selections
      newValues = [...new Set([...safeSelectedValues, optionValue])];
    } else {
      // Remove the option
      newValues = safeSelectedValues.filter(v => v !== optionValue);
    }
    
    onSelectionChange(newValues);
  };

  const getDisplayText = () => {
    if (safeSelectedValues.length === 0) {
      return placeholder; // Show placeholder when nothing is selected
    } else if (safeSelectedValues.length === 1) {
      const option = options.find(opt => opt.value === safeSelectedValues[0]);
      if (option && option.isTeachingLanguage && isMobile) {
        // For teaching language options on mobile, format as two lines in the placeholder
        const parts = option.label.split(/\s*-\s*/);
        if (parts.length >= 2) {
          return (
            <div className="flex flex-col items-start py-0.5">
              <div className="font-mono font-semibold text-primary text-xs leading-tight">
                {parts[0].trim()}
              </div>
              <div className="text-xs leading-tight truncate">
                {parts.slice(1).join(' ').trim()}
              </div>
            </div>
          );
        }
      }
      return option ? option.label : safeSelectedValues[0];
    } else {
      return t('common.selectedCount', { count: safeSelectedValues.length });
    }
  };



  return (
    <div className={cn("relative w-full multi-select-dropdown", className)}>
      <Select 
        value="multi-select" 
        onValueChange={() => {}} // Controlled by checkbox interactions
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger 
          className="w-full h-8 min-w-0"
        >
          <SelectValue>
            {getDisplayText()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent 
          className="bg-white dark:bg-gray-900 border border-border w-[calc(100vw-3rem)] sm:w-auto max-w-none sm:max-w-[600px] sm:min-w-[400px] overflow-hidden" 
          position="popper" 
          side="bottom" 
          align="center" 
          sideOffset={8}
          avoidCollisions={true}
        >
          <div className="p-2 relative">
            {/* Select All Button */}
            <div 
              className="flex items-center justify-between mb-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md px-2 py-2 sm:py-1.5 transition-colors cursor-pointer min-h-[44px] sm:min-h-[auto] gap-2"
              onClick={handleSelectAll}
            >
              <span className="text-sm font-medium text-primary flex-1 min-w-0">
                {isAllSelected ? t('common.deselectAll') : t('common.selectAll')}
              </span>
              {showCounts && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20 shrink-0 min-w-fit">
                  {calculatedTotalCount}
                </Badge>
              )}
            </div>
            
            {/* Scrollable container with fade effects */}
            <div className="relative">
              {/* Individual Options */}
              <div 
                ref={scrollContainerRef}
                className={cn("overflow-y-auto space-y-0.5 scrollbar-hide", maxHeight)}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
                data-overflow-scroll="true"
              >
                {options.map((option, index) => {
                  const isGroupHeader = option.value.startsWith('__faculty_');
                  const isSubjectOption = !isGroupHeader && option.label.includes(' - ');
                  
                  if (isGroupHeader) {
                    // Check if all departments under this faculty are selected
                    const facultyName = option.value.replace('__faculty_', '');
                    const facultyHeaderIndex = options.findIndex(opt => opt.value === option.value);
                    const nextFacultyHeaderIndex = options.findIndex((opt, idx) => 
                      idx > facultyHeaderIndex && opt.value.startsWith('__faculty_')
                    );
                    
                    const facultyDepartments = options
                      .slice(
                        facultyHeaderIndex + 1, 
                        nextFacultyHeaderIndex === -1 ? undefined : nextFacultyHeaderIndex
                      )
                      .filter(opt => !opt.value.startsWith('__faculty_'))
                      .map(opt => opt.value);
                    
                    const isFacultySelected = 
                      (facultyDepartments.length > 0 && 
                       facultyDepartments.every(dept => safeSelectedValues.includes(dept)));
                    
                    // Render faculty group header with checkbox
                    return (
                      <div 
                        key={option.value} 
                        className="flex items-center space-x-2 py-2 px-2 font-semibold text-sm text-primary border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <Checkbox
                          id={`faculty-${option.value}`}
                          checked={isFacultySelected}
                          onCheckedChange={(checked) => handleOptionToggle(option.value, !!checked)}
                          className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary"
                        />
                        <label 
                          htmlFor={`faculty-${option.value}`} 
                          className="flex-1 cursor-pointer select-none"
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                              <span className="flex-1 truncate">{option.label}</span>
                              {option.status && (
                                <StatusDot status={option.status} />
                              )}
                            </div>
                            {showCounts && option.count !== undefined && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20 shrink-0 min-w-fit">
                                {option.count}
                              </Badge>
                            )}
                          </div>
                        </label>
                      </div>
                    );
                  }
                  
                  return (
                    <div 
                      key={option.value} 
                      className="flex items-center space-x-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md px-2 transition-colors"
                    >
                      <Checkbox
                        id={`option-${option.value}`}
                        checked={safeSelectedValues.includes(option.value)}
                        onCheckedChange={(checked) => handleOptionToggle(option.value, !!checked)}
                        className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary"
                      />
                      <label 
                        htmlFor={`option-${option.value}`} 
                        className="flex-1 text-sm cursor-pointer select-none text-gray-700 dark:text-gray-300"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                            {isSubjectOption ? (
                              // For subject options, apply monospace font to the subject code part
                              <span className="flex-1 truncate">
                                {option.label.split(' - ').map((part, index) => (
                                  <span key={index} className={index === 0 ? 'font-mono font-semibold' : ''}>
                                    {index === 0 ? part : ` - ${part}`}
                                  </span>
                                ))}
                              </span>
                            ) : option.isTeachingLanguage ? (
                              // For teaching language options, make the language code bold
                              (() => {
                                const parts = option.label.split(/\s*-\s*/);
                                if (parts.length >= 2) {
                                  return (
                                    <span className="flex-1 truncate">
                                      <span className="font-mono font-semibold">{parts[0].trim()}</span>
                                      <span> - {parts.slice(1).join(' ').trim()}</span>
                                    </span>
                                  );
                                } else {
                                  return <span className="flex-1 truncate">{option.label}</span>;
                                }
                              })()
                            ) : (
                              <span className="flex-1 truncate">{option.label}</span>
                            )}
                            {option.status && (
                              <StatusDot status={option.status} />
                            )}
                          </div>
                          {showCounts && option.count !== undefined && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20 shrink-0 min-w-fit">
                              {option.count}
                            </Badge>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}