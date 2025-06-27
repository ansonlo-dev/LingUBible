import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FavoritesService } from '@/services/api/favoritesService';

interface UseFavoritesOptions {
  items?: Array<{ type: 'course' | 'instructor'; itemId: string }>;
  preload?: boolean;
}

interface FavoriteState {
  [key: string]: boolean; // key format: "type_itemId"
}

export const useFavorites = (options: UseFavoritesOptions = {}) => {
  const { user } = useAuth();
  const { items = [], preload = false } = options;
  const [favoriteStates, setFavoriteStates] = useState<FavoriteState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const preloadedRef = useRef(false);

  // 初始化收藏狀態
  useEffect(() => {
    if (user && (items.length > 0 || preload)) {
      initializeFavorites();
    } else if (!user) {
      setFavoriteStates({});
      setIsInitialized(true);
      preloadedRef.current = false;
    }
  }, [user, items.length, preload]);

  const initializeFavorites = useCallback(async () => {
    if (!user || isLoading) return;

    try {
      setIsLoading(true);

      if (preload && !preloadedRef.current) {
        // 預載所有收藏
        await FavoritesService.preloadAllFavorites();
        preloadedRef.current = true;
      }

      if (items.length > 0) {
        // 批量檢查特定項目的收藏狀態
        const result = await FavoritesService.checkMultipleFavorites(items);
        setFavoriteStates(result);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing favorites:', error);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, [user, items, preload, isLoading]);

  // 檢查單個項目是否已收藏
  const isFavorited = useCallback((type: 'course' | 'instructor', itemId: string): boolean => {
    const key = `${type}_${itemId}`;
    return favoriteStates[key] || false;
  }, [favoriteStates]);

  // 切換收藏狀態
  const toggleFavorite = useCallback(async (type: 'course' | 'instructor', itemId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const key = `${type}_${itemId}`;
    const currentState = favoriteStates[key] || false;
    const optimisticState = !currentState;
    
    // 樂觀更新UI
    setFavoriteStates(prev => ({
      ...prev,
      [key]: optimisticState
    }));

    try {
      const newState = await FavoritesService.toggleFavorite(type, itemId);
      
      // 只在結果與樂觀更新不同時才更新UI，防止閃爍
      if (newState !== optimisticState) {
        setFavoriteStates(prev => ({
          ...prev,
          [key]: newState
        }));
      }

      return newState;
    } catch (error) {
      // 如果失敗，回滾UI狀態
      setFavoriteStates(prev => ({
        ...prev,
        [key]: currentState
      }));
      throw error;
    }
  }, [user, favoriteStates]);

  // 添加新項目到監控列表
  const addItem = useCallback(async (type: 'course' | 'instructor', itemId: string) => {
    if (!user) return;

    const key = `${type}_${itemId}`;
    if (key in favoriteStates) return; // 已存在

    try {
      const isFav = await FavoritesService.isFavorited(type, itemId);
      setFavoriteStates(prev => ({
        ...prev,
        [key]: isFav
      }));
    } catch (error) {
      console.error('Error adding item to favorites tracking:', error);
    }
  }, [user, favoriteStates]);

  // 批量添加項目
  const addItems = useCallback(async (newItems: Array<{ type: 'course' | 'instructor'; itemId: string }>) => {
    if (!user || newItems.length === 0) return;

    try {
      const result = await FavoritesService.checkMultipleFavorites(newItems);
      setFavoriteStates(prev => ({
        ...prev,
        ...result
      }));
    } catch (error) {
      console.error('Error adding items to favorites tracking:', error);
    }
  }, [user]);

  // 重新載入收藏狀態
  const refresh = useCallback(async () => {
    if (user && items.length > 0) {
      await initializeFavorites();
    }
  }, [user, items, initializeFavorites]);

  // 清除狀態（用於登出）
  const clear = useCallback(() => {
    setFavoriteStates({});
    setIsInitialized(false);
    preloadedRef.current = false;
  }, []);

  return {
    favoriteStates,
    isFavorited,
    toggleFavorite,
    addItem,
    addItems,
    refresh,
    clear,
    isLoading,
    isInitialized
  };
};

// 專門用於單個項目的hook
export const useFavoriteStatus = (type: 'course' | 'instructor', itemId: string) => {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && itemId) {
      checkFavoriteStatus();
    } else {
      setIsFavorited(false);
    }
  }, [user, type, itemId]);

  const checkFavoriteStatus = async () => {
    try {
      setIsLoading(true);
      const favorited = await FavoritesService.isFavorited(type, itemId);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      setIsFavorited(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggle = async (): Promise<boolean> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // 樂觀更新
    const newState = !isFavorited;
    setIsFavorited(newState);

    try {
      const result = await FavoritesService.toggleFavorite(type, itemId);
      // Only update if the result is different from our optimistic update
      // This prevents the flickering issue
      if (result !== newState) {
        setIsFavorited(result);
      }
      return result;
    } catch (error) {
      // 回滾
      setIsFavorited(!newState);
      throw error;
    }
  };

  return {
    isFavorited,
    toggle,
    isLoading,
    refresh: checkFavoriteStatus
  };
}; 