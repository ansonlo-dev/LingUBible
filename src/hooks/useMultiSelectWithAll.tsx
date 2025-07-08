import { useState, useCallback, useMemo } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface UseMultiSelectWithAllProps {
  options: MultiSelectOption[];
  defaultSelected?: string[];
  allValue?: string;
  allLabel?: string;
  onChange?: (selected: string[]) => void;
}

export interface UseMultiSelectWithAllReturn {
  selectedValues: string[];
  isAllSelected: boolean;
  isValueSelected: (value: string) => boolean;
  handleValueToggle: (value: string) => void;
  handleAllToggle: () => void;
  handleReset: () => void;
  allOption: MultiSelectOption;
  regularOptions: MultiSelectOption[];
}

export const useMultiSelectWithAll = ({
  options,
  defaultSelected = [],
  allValue = 'all',
  allLabel = 'All',
  onChange,
}: UseMultiSelectWithAllProps): UseMultiSelectWithAllReturn => {
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultSelected);

  // 分離 "all" 選項和普通選項
  const regularOptions = useMemo(() => 
    options.filter(option => option.value !== allValue), 
    [options, allValue]
  );

  const allOption = useMemo(() => ({
    value: allValue,
    label: allLabel,
  }), [allValue, allLabel]);

  // 檢查是否全部選中
  const isAllSelected = useMemo(() => {
    if (selectedValues.includes(allValue)) return true;
    if (regularOptions.length === 0) return false;
    
    const selectedRegularValues = selectedValues.filter(value => value !== allValue);
    return selectedRegularValues.length === regularOptions.length &&
           regularOptions.every(option => selectedRegularValues.includes(option.value));
  }, [selectedValues, regularOptions, allValue]);

  // 檢查特定值是否被選中
  const isValueSelected = useCallback((value: string) => {
    if (value === allValue) return isAllSelected;
    return selectedValues.includes(value) && !isAllSelected;
  }, [selectedValues, isAllSelected, allValue]);

  // 處理普通選項的切換
  const handleValueToggle = useCallback((value: string) => {
    if (value === allValue) {
      handleAllToggle();
      return;
    }

    setSelectedValues(prev => {
      let newSelected: string[];
      
      if (prev.includes(value)) {
        // 取消選擇該項目
        newSelected = prev.filter(v => v !== value && v !== allValue);
      } else {
        // 選擇該項目
        newSelected = [...prev.filter(v => v !== allValue), value];
        
        // 檢查是否所有普通選項都被選中了
        const allRegularSelected = regularOptions.every(option => 
          newSelected.includes(option.value)
        );
        
        if (allRegularSelected) {
          // 如果所有普通選項都選中了，改為選中 "all"
          newSelected = [allValue];
        }
      }
      
      onChange?.(newSelected);
      return newSelected;
    });
  }, [allValue, regularOptions, onChange]);

  // 處理 "all" 選項的切換
  const handleAllToggle = useCallback(() => {
    setSelectedValues(prev => {
      const newSelected = isAllSelected ? [] : [allValue];
      onChange?.(newSelected);
      return newSelected;
    });
  }, [isAllSelected, allValue, onChange]);

  // 重置選擇
  const handleReset = useCallback(() => {
    setSelectedValues([]);
    onChange?.([]);
  }, [onChange]);

  return {
    selectedValues,
    isAllSelected,
    isValueSelected,
    handleValueToggle,
    handleAllToggle,
    handleReset,
    allOption,
    regularOptions,
  };
};