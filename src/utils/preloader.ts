/**
 * 預加載器：在應用啟動時預載入關鍵數據
 * 🚀 超級優化：提供接近即時的用戶體驗
 */

import { CourseService } from '@/services/api/courseService';

class DataPreloader {
  private static instance: DataPreloader;
  private isPreloading = false;
  private preloadPromise: Promise<void> | null = null;

  static getInstance(): DataPreloader {
    if (!DataPreloader.instance) {
      DataPreloader.instance = new DataPreloader();
    }
    return DataPreloader.instance;
  }

  /**
   * 開始預載入關鍵數據
   * 在用戶還沒訪問著陸頁面之前就開始載入
   */
  startPreloading(): Promise<void> {
    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    this.isPreloading = true;
    console.log('🚀 DataPreloader: Starting critical data preloading...');

    this.preloadPromise = this.preloadCriticalData();
    return this.preloadPromise;
  }

  private async preloadCriticalData(): Promise<void> {
    try {
      // 預載入最關鍵的數據 - 這些是著陸頁面必需的
      await Promise.allSettled([
        // 預載入熱門課程數據（用戶最關心）
        CourseService.getPopularCourses(20),
        // 預載入熱門講師數據（用戶次要關心）
        CourseService.getPopularInstructorsWithDetailedStatsOptimized(20),
      ]);

      console.log('✅ DataPreloader: Critical data preloaded successfully');

      // 延遲載入次要數據，不阻塞關鍵路徑
      setTimeout(async () => {
        try {
          await Promise.allSettled([
            CourseService.getTopCoursesByGPA(20),
            CourseService.getTopInstructorsByGPAOptimized(20),
            // 預載入完整課程數據供目錄頁面使用
            CourseService.getCoursesWithStats(),
            // 預載入完整講師數據供目錄頁面使用
            CourseService.getAllInstructorsWithDetailedStats(),
          ]);
          console.log('✅ DataPreloader: Secondary data preloaded successfully');
        } catch (error) {
          console.warn('DataPreloader: Secondary data preloading failed (non-critical):', error);
        }
      }, 2000); // 2秒後載入次要數據

    } catch (error) {
      console.error('DataPreloader: Critical data preloading failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 檢查是否正在預載入
   */
  isPreloadingActive(): boolean {
    return this.isPreloading;
  }

  /**
   * 等待預載入完成
   */
  async waitForPreloading(): Promise<void> {
    if (this.preloadPromise) {
      await this.preloadPromise;
    }
  }
}

export const dataPreloader = DataPreloader.getInstance();

/**
 * 在應用啟動時自動開始預載入
 * 這個函數應該在 main.tsx 中調用
 */
export function initializeDataPreloading(): void {
  // 檢查是否在瀏覽器環境且有網絡連接
  if (typeof window !== 'undefined' && navigator.onLine) {
    // 稍微延遲開始預載入，讓應用先完成初始化
    setTimeout(() => {
      dataPreloader.startPreloading();
    }, 500);
  }
}