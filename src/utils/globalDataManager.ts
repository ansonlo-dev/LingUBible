/**
 * 🚀 全域數據管理器：避免重複載入，實現真正的即時載入
 * 在整個應用中共享已載入的數據，避免重複API調用
 */

import { CourseService } from '@/services/api/courseService';
import type { CourseWithStats, InstructorWithDetailedStats } from '@/services/api/courseService';

class GlobalDataManager {
  private static instance: GlobalDataManager;
  
  // 數據狀態
  private isLoading = false;
  private isLoaded = false;
  
  // 緩存的數據
  private popularCourses: CourseWithStats[] = [];
  private popularInstructors: InstructorWithDetailedStats[] = [];
  private topCourses: CourseWithStats[] = [];
  private topInstructors: InstructorWithDetailedStats[] = [];
  private allCourses: CourseWithStats[] = [];
  private allInstructors: InstructorWithDetailedStats[] = [];
  
  // Promise 緩存，避免多個組件同時觸發載入
  private loadPromise: Promise<void> | null = null;

  static getInstance(): GlobalDataManager {
    if (!GlobalDataManager.instance) {
      GlobalDataManager.instance = new GlobalDataManager();
    }
    return GlobalDataManager.instance;
  }

  /**
   * 載入核心數據（只執行一次）- 著陸頁面立即需要的
   */
  async loadAllData(): Promise<void> {
    // 如果已經載入或正在載入，返回現有 Promise
    if (this.isLoaded) {
      return Promise.resolve();
    }
    
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    console.log('🚀 GlobalDataManager: Starting smart data loading...');

    this.loadPromise = this.performSmartDataLoading();
    return this.loadPromise;
  }

  private async performSmartDataLoading(): Promise<void> {
    try {
      // 🚀 智能載入：只載入著陸頁面立即需要的核心數據
      console.log('🎯 Loading only essential data for instant landing page...');
      
      const [popularCourses, popularInstructors, topCourses, topInstructors] = await Promise.all([
        CourseService.getPopularCoursesLightweight(20),
        CourseService.getPopularInstructorsWithDetailedStatsOptimized(20),
        CourseService.getTopCoursesByGPALightweight(20),
        CourseService.getTopInstructorsByGPAOptimized(20)
      ]);
      
      this.popularCourses = popularCourses;
      this.popularInstructors = popularInstructors;
      this.topCourses = topCourses;
      this.topInstructors = topInstructors;
      
      console.log('✅ Essential data loaded for instant display');
      
      // 🚀 延遲載入完整數據集（只有當搜索或目錄頁面需要時才載入）
      // 不在這裡載入，改為按需載入
      
      this.isLoaded = true;
      console.log('🎯 GlobalDataManager: Essential data loaded successfully!', {
        popularCourses: this.popularCourses.length,
        popularInstructors: this.popularInstructors.length,
        topCourses: this.topCourses.length,
        topInstructors: this.topInstructors.length
      });
      
    } catch (error) {
      console.error('GlobalDataManager: Failed to load data:', error);
      this.isLoaded = false;
      this.loadPromise = null;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 按需載入完整數據集（搜索和目錄頁面需要）
   */
  private async loadFullDataSet(): Promise<void> {
    if (this.allCourses.length > 0 && this.allInstructors.length > 0) {
      return; // 已經載入
    }

    console.log('📚 Loading full dataset for search and catalog...');
    
    const [allCourses, allInstructors] = await Promise.all([
      CourseService.getCoursesWithStats(),
      CourseService.getAllInstructorsWithDetailedStats()
    ]);
    
    this.allCourses = allCourses;
    this.allInstructors = allInstructors;
    
    console.log('✅ Full dataset loaded', {
      allCourses: this.allCourses.length,
      allInstructors: this.allInstructors.length
    });
  }

  /**
   * 獲取數據的公共方法 - 如果未載入則自動載入
   */
  async getPopularCourses(): Promise<CourseWithStats[]> {
    await this.ensureDataLoaded();
    return [...this.popularCourses];
  }

  async getPopularInstructors(): Promise<InstructorWithDetailedStats[]> {
    await this.ensureDataLoaded();
    return [...this.popularInstructors];
  }

  async getTopCourses(): Promise<CourseWithStats[]> {
    await this.ensureDataLoaded();
    return [...this.topCourses];
  }

  async getTopInstructors(): Promise<InstructorWithDetailedStats[]> {
    await this.ensureDataLoaded();
    return [...this.topInstructors];
  }

  async getAllCourses(): Promise<CourseWithStats[]> {
    await this.ensureDataLoaded();
    await this.loadFullDataSet(); // 🚀 按需載入完整數據集
    return [...this.allCourses];
  }

  async getAllInstructors(): Promise<InstructorWithDetailedStats[]> {
    await this.ensureDataLoaded();
    await this.loadFullDataSet(); // 🚀 按需載入完整數據集
    return [...this.allInstructors];
  }

  /**
   * 檢查數據是否已載入
   */
  isDataLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 檢查是否正在載入
   */
  isDataLoading(): boolean {
    return this.isLoading;
  }

  /**
   * 確保數據已載入
   */
  private async ensureDataLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadAllData();
    }
  }

  /**
   * 獲取載入進度（用於顯示進度條）
   */
  getLoadingProgress(): { stage: number; total: number; description: string } {
    if (this.isLoaded) {
      if (this.allCourses.length > 0 && this.allInstructors.length > 0) {
        return { stage: 2, total: 2, description: '完整數據集已載入' };
      }
      return { stage: 1, total: 2, description: '核心數據已載入' };
    }
    
    return { stage: 0, total: 2, description: '載入核心數據...' };
  }

  /**
   * 強制重新載入（用於數據更新時）
   */
  async forceReload(): Promise<void> {
    this.isLoaded = false;
    this.loadPromise = null;
    this.clearCache();
    return this.loadAllData();
  }

  /**
   * 清除緩存
   */
  private clearCache(): void {
    this.popularCourses = [];
    this.popularInstructors = [];
    this.topCourses = [];
    this.topInstructors = [];
    this.allCourses = [];
    this.allInstructors = [];
  }
}

export const globalDataManager = GlobalDataManager.getInstance();