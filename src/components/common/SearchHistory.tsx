import React from 'react';
import { ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useSearchHistory, SearchHistoryItem } from '@/hooks/useSearchHistory';
import { Button } from '@/components/ui/button';

interface SearchHistoryProps {
  onHistoryItemClick: (query: string) => void;
}

export function SearchHistory({ onHistoryItemClick }: SearchHistoryProps) {
  const { t } = useLanguage();
  const {
    searchHistory,
    isExpanded,
    showDeleteMode,
    removeFromHistory,
    clearHistory,
    toggleExpanded,
    toggleDeleteMode
  } = useSearchHistory();

  // Don't render if no history
  if (searchHistory.length === 0) {
    return null;
  }

  // Get items to display (collapsed shows first 10, expanded shows all)
  const displayedItems = isExpanded ? searchHistory : searchHistory.slice(0, 10);

  const handleItemClick = (item: SearchHistoryItem) => {
    if (showDeleteMode) {
      removeFromHistory(item.id);
    } else {
      onHistoryItemClick(item.query);
    }
  };

  const handleClearAll = () => {
    clearHistory();
    if (showDeleteMode) {
      toggleDeleteMode();
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {t('search.history.title')}
        </h3>
        <div className="flex items-center gap-2">
          {showDeleteMode ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {t('search.history.clearAll')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDeleteMode}
                className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {t('search.history.done')}
              </Button>
            </>
          ) : (
            <>
              {isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDeleteMode}
                  className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* History Items - Only show when expanded */}
      {isExpanded && (
        <>
          <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto scrollbar-hide">
            {displayedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`relative inline-flex items-center px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                  showDeleteMode
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span className={`${showDeleteMode ? 'pr-2' : ''}`}>
                  {item.query}
                </span>
                {showDeleteMode && (
                  <X className="h-3 w-3 ml-1 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Export the hook for use in other components
export { useSearchHistory } from '@/hooks/useSearchHistory'; 