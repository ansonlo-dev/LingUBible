import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const [isOpen, setIsOpen] = useState(false);

  // Ensure selectedValues is always an array
  const safeSelectedValues = Array.isArray(selectedValues) ? selectedValues : [];

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
        open={isOpen}
        onOpenChange={setIsOpen}
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
          align="start" 
          sideOffset={8}
          avoidCollisions={true}
          style={{ 
            minWidth: 'var(--radix-select-trigger-width)',
            maxWidth: 'min(500px, calc(100vw - 2rem))',
            width: 'auto'
          }}
        >
          <div className="p-2">
            {/* Select All Button */}
            <div 
              className="flex items-center justify-between mb-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md px-2 py-1.5 transition-colors cursor-pointer"
              onClick={handleSelectAll}
            >
              <span className="text-sm font-medium text-primary">
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
              {showCounts && (
                <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground dark:hover:bg-primary/20 shrink-0">
                  {calculatedTotalCount}
                </Badge>
              )}
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
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="flex-1 whitespace-nowrap">{option.label}</span>
                            {option.status && (
                              <StatusDot status={option.status} />
                            )}
                          </div>
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
                      checked={safeSelectedValues.includes(option.value)}
                      onCheckedChange={(checked) => handleOptionToggle(option.value, !!checked)}
                      className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary"
                    />
                                          <label 
                        htmlFor={`option-${option.value}`} 
                        className="flex-1 text-sm cursor-pointer select-none text-gray-700 dark:text-gray-300"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isSubjectOption ? (
                              // For subject options, apply monospace font to the subject code part
                              <span className="flex-1 whitespace-nowrap">
                                {option.label.split(' - ').map((part, index) => (
                                  <span key={index} className={index === 0 ? 'font-mono font-semibold' : ''}>
                                    {index === 0 ? part : ` - ${part}`}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="flex-1 whitespace-nowrap">{option.label}</span>
                            )}
                            {option.status && (
                              <StatusDot status={option.status} />
                            )}
                          </div>
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