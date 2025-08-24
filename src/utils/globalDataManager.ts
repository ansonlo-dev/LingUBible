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
   * 載入所有核心數據（只執行一次）
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
    console.log('🚀 GlobalDataManager: Starting one-time data loading...');

    this.loadPromise = this.performDataLoading();
    return this.loadPromise;
  }

  private async performDataLoading(): Promise<void> {
    try {
      // 🚀 階段1：載入最核心的數據（著陸頁面需要的）
      const [popularCourses, popularInstructors] = await Promise.all([
        CourseService.getPopularCourses(),
        CourseService.getPopularInstructorsWithDetailedStatsOptimized()
      ]);
      
      this.popularCourses = popularCourses;
      this.popularInstructors = popularInstructors;
      
      console.log('✅ Stage 1: Core data loaded');

      // 🚀 階段2：載入次要數據（頂級課程和講師）
      const [topCourses, topInstructors] = await Promise.all([
        CourseService.getTopCoursesByGPA(),
        CourseService.getTopInstructorsByGPAOptimized()
      ]);
      
      this.topCourses = topCourses;
      this.topInstructors = topInstructors;
      
      console.log('✅ Stage 2: Top items loaded');

      // 🚀 階段3：載入完整數據集（搜索功能需要）
      const [allCourses, allInstructors] = await Promise.all([
        CourseService.getCoursesWithStats(),
        CourseService.getAllInstructorsWithDetailedStats()
      ]);
      
      this.allCourses = allCourses;
      this.allInstructors = allInstructors;
      
      console.log('✅ Stage 3: Complete dataset loaded');
      
      this.isLoaded = true;
      console.log('🎯 GlobalDataManager: All data loaded successfully!', {
        popularCourses: this.popularCourses.length,
        popularInstructors: this.popularInstructors.length,
        topCourses: this.topCourses.length,
        topInstructors: this.topInstructors.length,
        allCourses: this.allCourses.length,
        allInstructors: this.allInstructors.length
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
    return [...this.allCourses];
  }

  async getAllInstructors(): Promise<InstructorWithDetailedStats[]> {
    await this.ensureDataLoaded();
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
      return { stage: 3, total: 3, description: '載入完成' };
    }
    
    if (this.popularCourses.length > 0 && this.popularInstructors.length > 0) {
      if (this.topCourses.length > 0 && this.topInstructors.length > 0) {
        return { stage: 3, total: 3, description: '載入完整數據集...' };
      }
      return { stage: 2, total: 3, description: '載入頂級項目...' };
    }
    
    return { stage: 1, total: 3, description: '載入核心數據...' };
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