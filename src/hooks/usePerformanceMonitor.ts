import { useEffect, useRef, useState, useCallback } from 'react';
import { usePerformanceOptimizer } from '@/utils/performance/performanceOptimizer';

interface PerformanceData {
  renderTime: number;
  mountTime: number;
  updateCount: number;
  memoryUsage?: number;
  componentName: string;
}

interface UsePerformanceMonitorOptions {
  componentName: string;
  trackRenders?: boolean;
  trackMemory?: boolean;
  logToConsole?: boolean;
  threshold?: number; // 性能警告閾值（毫秒）
}

export function usePerformanceMonitor({
  componentName,
  trackRenders = true,
  trackMemory = false,
  logToConsole = false,
  threshold = 16 // 60fps = 16.67ms per frame
}: UsePerformanceMonitorOptions) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    renderTime: 0,
    mountTime: 0,
    updateCount: 0,
    componentName
  });

  const mountTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const { trackRender } = usePerformanceOptimizer();

  // 組件掛載時間
  useEffect(() => {
    mountTimeRef.current = performance.now();
    renderStartRef.current = performance.now();
    
    return () => {
      const mountTime = performance.now() - mountTimeRef.current;
      setPerformanceData(prev => ({ ...prev, mountTime }));
    };
  }, []);

  // 追蹤每次渲染
  useEffect(() => {
    if (!trackRenders) return;

    const renderTime = performance.now() - renderStartRef.current;
    updateCountRef.current += 1;

    const newData = {
      renderTime,
      mountTime: performance.now() - mountTimeRef.current,
      updateCount: updateCountRef.current,
      componentName,
      ...(trackMemory && 'memory' in performance ? {
        memoryUsage: (performance as any).memory.usedJSHeapSize
      } : {})
    };

    setPerformanceData(newData);

    // 記錄到性能優化器
    trackRender(componentName, renderTime);

    // 性能警告
    if (renderTime > threshold) {
      console.warn(`⚠️ 組件 ${componentName} 渲染時間過長: ${renderTime.toFixed(2)}ms`);
    }

    // 開發環境日誌
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.log(`📊 ${componentName} 性能:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        updateCount: updateCountRef.current,
        memoryUsage: newData.memoryUsage ? `${(newData.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A'
      });
    }

    // 準備下次渲染計時
    renderStartRef.current = performance.now();
  });

  // 手動標記渲染開始
  const markRenderStart = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  // 手動標記渲染結束
  const markRenderEnd = useCallback(() => {
    const renderTime = performance.now() - renderStartRef.current;
    updateCountRef.current += 1;
    
    setPerformanceData(prev => ({
      ...prev,
      renderTime,
      updateCount: updateCountRef.current
    }));
    
    trackRender(componentName, renderTime);
  }, [componentName, trackRender]);

  return {
    performanceData,
    markRenderStart,
    markRenderEnd
  };
}

// 頁面性能監控 Hook
export function usePagePerformance() {
  const [pageMetrics, setPageMetrics] = useState({
    loadTime: 0,
    domContentLoaded: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0
  });

  useEffect(() => {
    // 頁面載入完成後收集性能指標
    const collectMetrics = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        setPageMetrics(prev => ({
          ...prev,
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart
        }));

        // 收集 Paint 指標
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            setPageMetrics(prev => ({ ...prev, firstContentfulPaint: entry.startTime }));
          }
        });

        // 使用 PerformanceObserver 收集其他指標
        if ('PerformanceObserver' in window) {
          // LCP
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            setPageMetrics(prev => ({ ...prev, largestContentfulPaint: lastEntry.startTime }));
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FID
          const fidObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              setPageMetrics(prev => ({ 
                ...prev, 
                firstInputDelay: (entry as any).processingStart - entry.startTime 
              }));
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // CLS
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
                setPageMetrics(prev => ({ ...prev, cumulativeLayoutShift: clsValue }));
              }
            }
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // 清理觀察者
          return () => {
            lcpObserver.disconnect();
            fidObserver.disconnect();
            clsObserver.disconnect();
          };
        }
      }
    };

    // 等待頁面載入完成
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
      return () => window.removeEventListener('load', collectMetrics);
    }
  }, []);

  return pageMetrics;
}

// 記憶體使用監控 Hook
export function useMemoryMonitor(interval: number = 5000) {
  const [memoryInfo, setMemoryInfo] = useState({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    usagePercentage: 0
  });

  useEffect(() => {
    if (!('memory' in performance)) {
      console.warn('Memory API 不可用');
      return;
    }

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      const usagePercentage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage
      });

      // 記憶體使用警告
      if (usagePercentage > 80) {
        console.warn(`⚠️ 記憶體使用率過高: ${usagePercentage.toFixed(1)}%`);
      }
    };

    updateMemoryInfo();
    const intervalId = setInterval(updateMemoryInfo, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryInfo;
}

// 網路性能監控 Hook
export function useNetworkMonitor() {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      if (connection) {
        setNetworkInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        });
      }
    };

    updateNetworkInfo();

    // 監聽網路變化
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  return networkInfo;
}

// 綜合性能監控 Hook
export function useAppPerformance() {
  const pageMetrics = usePagePerformance();
  const memoryInfo = useMemoryMonitor();
  const networkInfo = useNetworkMonitor();
  const { getReport } = usePerformanceOptimizer();

  const getFullReport = useCallback(() => {
    const optimizerReport = getReport();
    
    return {
      page: pageMetrics,
      memory: memoryInfo,
      network: networkInfo,
      components: optimizerReport.components,
      cache: optimizerReport.cacheStats,
      recommendations: optimizerReport.recommendations,
      timestamp: new Date().toISOString()
    };
  }, [pageMetrics, memoryInfo, networkInfo, getReport]);

  return {
    pageMetrics,
    memoryInfo,
    networkInfo,
    getFullReport
  };
} 