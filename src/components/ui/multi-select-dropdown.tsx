import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean; // For group headers
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

  // Ensure selectedValues is always an array
  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];

  // Calculate total count if not provided
  const calculatedTotalCount = totalCount ?? options.reduce((sum, option) => sum + (option.count || 0), 0);

  // Filter out disabled options (group headers) for counting
  const selectableOptions = options.filter(option => !option.value.startsWith('__faculty_'));
  
  // Check if all options are selected or none are selected
  const isAllSelected = safeSelectedValues.length === 0 || 
    (safeSelectedValues.length === 1 && safeSelectedValues[0] === 'all') ||
    (safeSelectedValues.length > 0 && 
     safeSelectedValues.length === selectableOptions.length && 
     !safeSelectedValues.includes('all'));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // When "All" is selected, clear individual selections and just use 'all'
      onSelectionChange(['all']);
    } else {
      // Deselect all
      onSelectionChange([]);
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
        newValues = [...new Set([...safeSelectedValues.filter(v => v !== 'all'), ...facultyDepartments])];
      } else {
        // Remove all departments under this faculty
        newValues = safeSelectedValues.filter(v => !facultyDepartments.includes(v) && v !== 'all');
      }
      
      onSelectionChange(newValues);
      return;
    }
    
    let newValues: string[];
    
    if (checked) {
      // If currently "all" is selected, start fresh with just this option
      if (safeSelectedValues.includes('all') || safeSelectedValues.length === 0) {
        newValues = [optionValue];
      } else {
        // Add the option to existing selections
        newValues = [...safeSelectedValues.filter(v => v !== 'all'), optionValue];
        
        // Check if all individual options are now selected
        if (newValues.length === selectableOptions.length) {
          // If all options are selected, switch to 'all' mode
          newValues = ['all'];
        }
      }
    } else {
      // Remove the option
      newValues = safeSelectedValues.filter(v => v !== optionValue && v !== 'all');
    }
    
    onSelectionChange(newValues);
  };

  const getDisplayText = () => {
    if (isAllSelected) {
      return t('common.all');
    } else if (safeSelectedValues.length === 1) {
      const option = options.find(opt => opt.value === safeSelectedValues[0]);
      return option ? option.label : safeSelectedValues[0];
    } else {
      return t('common.selectedCount', { count: safeSelectedValues.length });
    }
  };

  // Calculate the width needed based on longest option
  const getOptimalWidth = () => {
    if (typeof window === 'undefined') return 'auto';
    
    const maxLabelLength = Math.max(
      ...options.map(opt => opt.label.length),
      getDisplayText().length
    );
    
    // Estimate width: roughly 8px per character + padding + badge space
    const estimatedWidth = Math.max(200, Math.min(400, maxLabelLength * 8 + 120));
    return `${estimatedWidth}px`;
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Select 
        value="multi-select" 
        onValueChange={() => {}} // Controlled by checkbox interactions
        disabled={disabled}
      >
        <SelectTrigger 
          className="w-full h-10 min-w-[180px]"
        >
          <SelectValue>
            {getDisplayText()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent 
          className="bg-white dark:bg-gray-900" 
          position="popper" 
          side="bottom" 
          align="center" 
          sideOffset={8}
          avoidCollisions={true}
          style={{ 
            width: 'var(--radix-select-trigger-width)',
            maxWidth: 'min(350px, calc(100vw - 2rem))'
          }}
        >
          <div className="p-2">
            {/* Select All Option */}
            <div className="flex items-center space-x-2 mb-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md px-2 py-1.5 transition-colors">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary"
              />
              <label 
                htmlFor="select-all" 
                className="text-sm font-medium cursor-pointer select-none flex-1 text-gray-900 dark:text-gray-100"
              >
                <div className="flex items-center justify-between w-full min-w-0">
                  <span className="truncate flex-1 mr-2 min-w-0">{t('common.all')}</span>
                  {showCounts && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20 shrink-0">
                      {calculatedTotalCount}
                    </Badge>
                  )}
                </div>
              </label>
            </div>
            
            {/* Individual Options */}
            <div className={cn("overflow-y-auto space-y-0.5", maxHeight)}>
              {options.map((option) => {
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
                    !safeSelectedValues.includes('all') &&
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
                        <div className="flex items-center justify-between w-full min-w-0">
                          <span className="truncate flex-1 mr-2 min-w-0">{option.label}</span>
                          {showCounts && option.count !== undefined && (
                            <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20 shrink-0">
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
                      checked={safeSelectedValues.includes(option.value) && !safeSelectedValues.includes('all')}
                      onCheckedChange={(checked) => handleOptionToggle(option.value, !!checked)}
                      className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary"
                    />
                    <label 
                      htmlFor={`option-${option.value}`} 
                      className="flex-1 text-sm cursor-pointer select-none text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center justify-between w-full min-w-0">
                        {isSubjectOption ? (
                          // For subject options, apply monospace font to the subject code part
                          <span className="truncate flex-1 mr-2 min-w-0">
                            {option.label.split(' - ').map((part, index) => (
                              <span key={index} className={index === 0 ? 'font-mono font-semibold' : ''}>
                                {index === 0 ? part : ` - ${part}`}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="truncate flex-1 mr-2 min-w-0">{option.label}</span>
                        )}
                        {showCounts && option.count !== undefined && (
                          <Badge variant="secondary" className="ml-auto text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20 shrink-0">
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
        </SelectContent>
      </Select>
    </div>
  );
}