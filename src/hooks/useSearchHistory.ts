import { useState, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'lingubible_search_history';
const MAX_HISTORY_ITEMS = 20;

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteMode, setShowDeleteMode] = useState(false);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        setSearchHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage whenever it changes
  const saveToLocalStorage = (history: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  // Add a new search query to history
  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: Date.now()
    };

    setSearchHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => item.query !== query.trim());
      
      // Add new item to the beginning
      const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      // Save to localStorage
      saveToLocalStorage(newHistory);
      
      return newHistory;
    });
  };

  // Remove a specific item from history
  const removeFromHistory = (id: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      saveToLocalStorage(newHistory);
      return newHistory;
    });
  };

  // Clear all search history
  const clearHistory = () => {
    setSearchHistory([]);
    saveToLocalStorage([]);
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (showDeleteMode) {
      setShowDeleteMode(false);
    }
  };

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setShowDeleteMode(!showDeleteMode);
  };

  return {
    searchHistory,
    isExpanded,
    showDeleteMode,
    addToHistory,
    removeFromHistory,
    clearHistory,
    toggleExpanded,
    toggleDeleteMode
  };
} 