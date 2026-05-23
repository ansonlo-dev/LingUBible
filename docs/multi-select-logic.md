# Multi-Select with "All" Logic Implementation

## 概述

這個文檔描述了如何實現一個多選組件，其中包含特殊的「全選」邏輯：

- 當所有個別選項都被選中時，自動切換到「全選」狀態
- 當「全選」被選中時，所有個別選項都不會顯示為選中狀態
- 「全選」和個別選項不能同時處於選中狀態

## 核心邏輯

### 狀態管理

```typescript
// 狀態可能的值：
// 1. [] - 無選擇
// 2. ['all'] - 全選
// 3. ['option1', 'option2'] - 部分選擇
// 4. 永遠不會出現 ['all', 'option1'] 這樣的狀態
```

### 選擇邏輯

#### 1. 點擊「全選」選項

```typescript
const handleAllToggle = (checked: boolean) => {
  if (checked) {
    // 選中「全選」→ 清除所有個別選項，設置為 ['all']
    setSelectedValues(['all']);
  } else {
    // 取消「全選」→ 清空所有選擇
    setSelectedValues([]);
  }
};
```

#### 2. 點擊個別選項

```typescript
const handleOptionToggle = (optionValue: string, checked: boolean) => {
  if (checked) {
    // 選中個別選項
    if (selectedValues.includes('all') || selectedValues.length === 0) {
      // 如果當前是「全選」或無選擇狀態，開始新的個別選擇
      newValues = [optionValue];
    } else {
      // 添加到現有選擇
      newValues = [...selectedValues.filter(v => v !== 'all'), optionValue];
      
      // 檢查是否所有選項都被選中了
      if (newValues.length === totalOptions) {
        // 自動切換到「全選」狀態
        newValues = ['all'];
      }
    }
  } else {
    // 取消選中個別選項
    newValues = selectedValues.filter(v => v !== optionValue && v !== 'all');
  }
  
  setSelectedValues(newValues);
};
```

### 顯示邏輯

#### 1. 「全選」複選框狀態

```typescript
const isAllSelected = 
  selectedValues.includes('all') || 
  (selectedValues.length > 0 && 
   selectedValues.length === totalOptions && 
   !selectedValues.includes('all'));
```

#### 2. 個別選項複選框狀態

```typescript
const isOptionSelected = (optionValue: string) => 
  selectedValues.includes(optionValue) && !selectedValues.includes('all');
```

## 測試案例

### 案例 1: 從無選擇開始

1. 初始狀態: `[]`
2. 點擊選項1: `['option1']`
3. 點擊選項2: `['option1', 'option2']`
4. 點擊選項3 (假設總共3個選項): `['all']` ← 自動切換

### 案例 2: 從全選開始

1. 初始狀態: `['all']`
2. 點擊選項1: `['option1']` ← 取消全選，只選中選項1

### 案例 3: 取消個別選項

1. 狀態: `['option1', 'option2']`
2. 取消選項1: `['option2']`
3. 取消選項2: `[]`

### 案例 4: 點擊全選

1. 狀態: `['option1', 'option2']`
2. 點擊全選: `['all']`

## 實現示例

### Hook Implementation

```typescript
export const useMultiSelectWithAll = (options: string[]) => {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  
  const isAllSelected = useMemo(() => 
    selectedValues.includes('all') || 
    (selectedValues.length > 0 && 
     selectedValues.length === options.length && 
     !selectedValues.includes('all'))
  , [selectedValues, options.length]);
  
  const isValueSelected = useCallback((value: string) => 
    value === 'all' 
      ? isAllSelected 
      : selectedValues.includes(value) && !selectedValues.includes('all')
  , [selectedValues, isAllSelected]);
  
  const handleValueToggle = useCallback((value: string) => {
    if (value === 'all') {
      setSelectedValues(isAllSelected ? [] : ['all']);
      return;
    }
    
    setSelectedValues(prev => {
      let newValues: string[];
      
      if (prev.includes(value)) {
        // 取消選擇
        newValues = prev.filter(v => v !== value && v !== 'all');
      } else {
        // 選擇
        if (prev.includes('all') || prev.length === 0) {
          newValues = [value];
        } else {
          newValues = [...prev.filter(v => v !== 'all'), value];
          
          if (newValues.length === options.length) {
            newValues = ['all'];
          }
        }
      }
      
      return newValues;
    });
  }, [options.length, isAllSelected]);
  
  return {
    selectedValues,
    isAllSelected,
    isValueSelected,
    handleValueToggle,
    reset: () => setSelectedValues([])
  };
};
```

### Component Usage

```tsx
const MyMultiSelect = ({ options }: { options: string[] }) => {
  const {
    selectedValues,
    isAllSelected,
    isValueSelected,
    handleValueToggle
  } = useMultiSelectWithAll(options);
  
  return (
    <div>
      {/* All option */}
      <label>
        <input
          type="checkbox"
          checked={isAllSelected}
          onChange={() => handleValueToggle('all')}
        />
        All
      </label>
      
      {/* Individual options */}
      {options.map(option => (
        <label key={option}>
          <input
            type="checkbox"
            checked={isValueSelected(option)}
            onChange={() => handleValueToggle(option)}
          />
          {option}
        </label>
      ))}
    </div>
  );
};
```

## 常見問題

### Q: 為什麼不直接使用 boolean 來表示「全選」狀態？

A: 使用數組統一管理所有狀態更清晰，避免兩個獨立狀態之間的不一致問題。

### Q: 如何處理大量選項的性能問題？

A: 可以使用 `useMemo` 緩存計算結果，或者實現虛擬化列表。

### Q: 支持嵌套分組（如院系-專業）嗎？

A: 當前實現支持基本的分組邏輯，可以擴展來支持多層嵌套。

## 演示頁面

訪問 `/multi-select-demo` 查看完整的交互演示。