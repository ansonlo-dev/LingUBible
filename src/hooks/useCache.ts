import { useState, useCallback } from 'react';
import { CachedCourseService } from '@/services/cache/cachedCourseService';
import { cacheService } from '@/services/cache/cacheService';

/**
 * 緩存管理 Hook
 * 提供緩存刷新和狀態管理功能
 */
export const useCache = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * 刷新課程列表緩存
   */
  const refreshCourses = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await CachedCourseService.refreshCoursesCache();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * 刷新講師列表緩存
   */
  const refreshInstructors = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await CachedCourseService.refreshInstructorsCache();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * 刷新特定課程的緩存
   */
  const refreshCourse = useCallback(async (courseCode: string) => {
    setIsRefreshing(true);
    try {
      await CachedCourseService.refreshCourseCache(courseCode);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * 刷新特定講師的緩存
   */
  const refreshInstructor = useCallback(async (instructorName: string) => {
    setIsRefreshing(true);
    try {
      await CachedCourseService.refreshInstructorCache(instructorName);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * 清除所有緩存
   */
  const clearAllCache = useCallback(() => {
    CachedCourseService.clearAllCache();
  }, []);

  /**
   * 獲取緩存統計信息
   */
  const getCacheStats = useCallback(() => {
    return CachedCourseService.getCacheStats();
  }, []);

  /**
   * 檢查特定緩存是否存在
   */
  const hasCachedData = useCallback((key: string) => {
    return cacheService.has(key);
  }, []);

  return {
    isRefreshing,
    refreshCourses,
    refreshInstructors,
    refreshCourse,
    refreshInstructor,
    clearAllCache,
    getCacheStats,
    hasCachedData
  };
};

/**
 * 緩存狀態 Hook
 * 提供緩存相關的狀態信息
 */
export const useCacheStatus = () => {
  const [stats, setStats] = useState(cacheService.getStats());

  const updateStats = useCallback(() => {
    setStats(cacheService.getStats());
  }, []);

  return {
    stats,
    updateStats
  };
}; 