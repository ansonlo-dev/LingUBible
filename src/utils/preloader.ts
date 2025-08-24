/**
 * 預加載器：在應用啟動時預載入關鍵數據
 * 🚀 超級優化：使用全域數據管理器提供真正的即時載入
 */

import { globalDataManager } from './globalDataManager';

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
   * 開始預載入所有數據
   * 在用戶還沒訪問任何頁面之前就完成所有數據載入
   */
  startPreloading(): Promise<void> {
    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    this.isPreloading = true;
    console.log('🚀 DataPreloader: Starting comprehensive data preloading...');

    this.preloadPromise = this.preloadAllData();
    return this.preloadPromise;
  }

  private async preloadAllData(): Promise<void> {
    try {
      // 🚀 使用全域數據管理器載入所有數據
      // 這會分階段載入所有數據，確保用戶訪問任何頁面都是即時的
      await globalDataManager.loadAllData();
      
      console.log('✅ DataPreloader: All data preloaded successfully via GlobalDataManager');

    } catch (error) {
      console.error('DataPreloader: Data preloading failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * 檢查是否正在預載入
   */
  isPreloadingActive(): boolean {
    return this.isPreloading || globalDataManager.isDataLoading();
  }

  /**
   * 檢查數據是否已載入
   */
  isDataLoaded(): boolean {
    return globalDataManager.isDataLoaded();
  }

  /**
   * 等待預載入完成
   */
  async waitForPreloading(): Promise<void> {
    if (this.preloadPromise) {
      await this.preloadPromise;
    }
  }

  /**
   * 獲取載入進度
   */
  getLoadingProgress() {
    return globalDataManager.getLoadingProgress();
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