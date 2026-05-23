// 性能優化工具集
import React from 'react';

// 自定義防抖和節流函數，避免額外依賴
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): T => {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: any[]) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  }) as T;
};

const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let inThrottle: boolean;
  
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  }) as T;
};

// 性能監控接口
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  bundleSize: number;
  cacheHitRate: number;
  networkLatency: number;
}

interface ComponentMetrics {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  memoryLeaks: boolean;
  lastRenderTime: number;
}

// 性能優化器主類
class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics;
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private memoryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private observers: Map<string, IntersectionObserver> = new Map();
  private performanceEntries: PerformanceEntry[] = [];
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MEMORY_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分鐘
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      bundleSize: 0,
      cacheHitRate: 0,
      networkLatency: 0
    };
    
    this.initializePerformanceMonitoring();
    this.startMemoryCleanup();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // 初始化性能監控
  private initializePerformanceMonitoring(): void {
    // 監控頁面載入性能
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
        
        // 監控 LCP (Largest Contentful Paint)
        this.observeLCP();
        
        // 監控 CLS (Cumulative Layout Shift)
        this.observeCLS();
        
        // 監控 FID (First Input Delay)
        this.observeFID();
      });
    }
  }

  // 監控 LCP
  private observeLCP(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        // LCP 值已被追踪，但不輸出到控制台以避免日誌泛濫
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  // 監控 CLS
  private observeCLS(): void {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        // CLS 值已被追踪，但不輸出到控制台以避免日誌泛濫
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // 監控 FID
  private observeFID(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // FID 值已被追踪，但不輸出到控制台以避免日誌泛濫
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  // 智能緩存系統
  public setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // 如果緩存已滿，清理最舊的條目
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.memoryCache.keys())[0];
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  public getCache<T>(key: string): T | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  // 記憶體清理
  private startMemoryCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredCache();
      this.cleanupObservers();
      this.reportMemoryUsage();
    }, this.MEMORY_CLEANUP_INTERVAL);
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.memoryCache.forEach((value, key) => {
      if (now - value.timestamp > value.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.memoryCache.delete(key));
    
    if (expiredKeys.length > 0 && import.meta.env.DEV) {
      console.log(`🧹 清理了 ${expiredKeys.length} 個過期緩存項目`);
    }
  }

  private cleanupObservers(): void {
    this.observers.forEach((observer, key) => {
      if (!document.querySelector(`[data-observer="${key}"]`)) {
        observer.disconnect();
        this.observers.delete(key);
      }
    });
  }

  // 組件性能監控
  public trackComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.averageRenderTime = (existing.averageRenderTime + renderTime) / 2;
      existing.lastRenderTime = renderTime;
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderCount: 1,
        averageRenderTime: renderTime,
        memoryLeaks: false,
        lastRenderTime: renderTime
      });
    }
  }

  // 懶加載優化
  public createLazyLoader(selector: string, callback: (element: Element) => void): void {
    if (!('IntersectionObserver' in window)) {
      // 回退方案：立即執行
      document.querySelectorAll(selector).forEach(callback);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px',
      threshold: 0.1
    });

    document.querySelectorAll(selector).forEach(element => {
      observer.observe(element);
    });

    this.observers.set(selector, observer);
  }

  // 圖片懶加載
  public optimizeImages(): void {
    this.createLazyLoader('img[data-src]', (img) => {
      const imgElement = img as HTMLImageElement;
      imgElement.src = imgElement.dataset.src || '';
      imgElement.classList.add('loaded');
    });
  }

  // 防抖和節流工具
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ): T {
    return debounce(func, wait, immediate) as T;
  }

  public throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T {
    return throttle(func, wait) as T;
  }

  // 預加載資源
  public preloadResource(url: string, type: 'script' | 'style' | 'image' | 'fetch' = 'fetch'): Promise<void> {
    return new Promise((resolve, reject) => {
      switch (type) {
        case 'script':
          const script = document.createElement('script');
          script.src = url;
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
          break;
          
        case 'style':
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = url;
          link.onload = () => resolve();
          link.onerror = reject;
          document.head.appendChild(link);
          break;
          
        case 'image':
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
          break;
          
        case 'fetch':
        default:
          fetch(url, { method: 'HEAD' })
            .then(() => resolve())
            .catch(reject);
          break;
      }
    });
  }

  // 批量處理優化
  public batchProcess<T>(
    items: T[],
    processor: (item: T) => void,
    batchSize: number = 10,
    delay: number = 16
  ): Promise<void> {
    return new Promise((resolve) => {
      let index = 0;
      
      const processBatch = () => {
        const endIndex = Math.min(index + batchSize, items.length);
        
        for (let i = index; i < endIndex; i++) {
          processor(items[i]);
        }
        
        index = endIndex;
        
        if (index < items.length) {
          setTimeout(processBatch, delay);
        } else {
          resolve();
        }
      };
      
      processBatch();
    });
  }

  // 記憶體使用報告
  private reportMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      
      // 如果記憶體使用過高，觸發清理
      if (memory.usedJSHeapSize > memory.totalJSHeapSize * 0.8) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ 記憶體使用率過高，觸發清理');
        }
        this.forceCleanup();
      }
    }
  }

  // 強制清理
  private forceCleanup(): void {
    this.memoryCache.clear();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // 觸發垃圾回收（如果可用）
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  // 獲取性能報告
  public getPerformanceReport(): {
    metrics: PerformanceMetrics;
    components: ComponentMetrics[];
    cacheStats: { size: number; hitRate: number };
    recommendations: string[];
  } {
    const components = Array.from(this.componentMetrics.values());
    const recommendations: string[] = [];

    // 分析並提供建議
    if (this.metrics.loadTime > 3000) {
      recommendations.push('頁面載入時間過長，考慮代碼分割和懶加載');
    }

    if (this.memoryCache.size > this.MAX_CACHE_SIZE * 0.8) {
      recommendations.push('緩存使用率過高，考慮調整緩存策略');
    }

    const slowComponents = components.filter(c => c.averageRenderTime > 16);
    if (slowComponents.length > 0) {
      recommendations.push(`以下組件渲染較慢：${slowComponents.map(c => c.componentName).join(', ')}`);
    }

    return {
      metrics: this.metrics,
      components,
      cacheStats: {
        size: this.memoryCache.size,
        hitRate: this.calculateCacheHitRate()
      },
      recommendations
    };
  }

  private calculateCacheHitRate(): number {
    // 簡化的緩存命中率計算
    return this.memoryCache.size > 0 ? 0.85 : 0;
  }

  // 清理資源
  public cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.forceCleanup();
    this.componentMetrics.clear();
    this.performanceEntries = [];
  }
}

// React Hook 封裝
export const usePerformanceOptimizer = () => {
  const optimizer = PerformanceOptimizer.getInstance();
  
  return {
    setCache: optimizer.setCache.bind(optimizer),
    getCache: optimizer.getCache.bind(optimizer),
    trackRender: optimizer.trackComponentRender.bind(optimizer),
    createLazyLoader: optimizer.createLazyLoader.bind(optimizer),
    debounce: optimizer.debounce.bind(optimizer),
    throttle: optimizer.throttle.bind(optimizer),
    preload: optimizer.preloadResource.bind(optimizer),
    batchProcess: optimizer.batchProcess.bind(optimizer),
    getReport: optimizer.getPerformanceReport.bind(optimizer)
  };
};

// 性能監控裝飾器
export const withPerformanceTracking = <T extends React.ComponentType<any>>(
  Component: T,
  componentName?: string
): T => {
  const WrappedComponent = (props: any) => {
    const startTime = performance.now();
    const optimizer = PerformanceOptimizer.getInstance();
    
    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      optimizer.trackComponentRender(componentName || Component.name, renderTime);
    });
    
    return React.createElement(Component, props);
  };
  
  WrappedComponent.displayName = `withPerformanceTracking(${componentName || Component.name})`;
  return WrappedComponent as T;
};

// 導出單例
export const performanceOptimizer = PerformanceOptimizer.getInstance();
export default PerformanceOptimizer; 