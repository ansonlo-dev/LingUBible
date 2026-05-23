import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePerformanceOptimizer } from '@/utils/performance/performanceOptimizer';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
  estimatedItemSize?: number;
  cacheKey?: string;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loadMore,
  hasNextPage = false,
  isLoading = false,
  estimatedItemSize,
  cacheKey
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const { throttle, getCache, setCache } = usePerformanceOptimizer();

  // 計算可見範圍
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // 緩存渲染的項目
  const cachedItems = useMemo(() => {
    if (cacheKey) {
      const cached = getCache(`virtualList_${cacheKey}_${visibleRange.start}_${visibleRange.end}`) as React.ReactNode[] | null;
      if (cached) return cached;
    }

    const rendered: React.ReactNode[] = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (items[i]) {
        rendered.push(
          <div
            key={i}
            style={{
              position: 'absolute',
              top: i * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(items[i], i)}
          </div>
        );
      }
    }

    if (cacheKey) {
      setCache(`virtualList_${cacheKey}_${visibleRange.start}_${visibleRange.end}`, rendered, 2 * 60 * 1000); // 2分鐘緩存
    }

    return rendered;
  }, [items, visibleRange, itemHeight, renderItem, cacheKey, getCache, setCache]);

  // 節流的滾動處理
  const throttledScrollHandler = useCallback(
    throttle((scrollTop: number) => {
      setScrollTop(scrollTop);
      onScroll?.(scrollTop);

      // 檢查是否需要加載更多
      if (loadMore && hasNextPage && !isLoading) {
        const scrollBottom = scrollTop + containerHeight;
        const totalHeight = items.length * itemHeight;
        
        // 當滾動到距離底部 200px 時觸發加載
        if (scrollBottom >= totalHeight - 200) {
          loadMore();
        }
      }
    }, 16), // 約 60fps
    [containerHeight, itemHeight, items.length, loadMore, hasNextPage, isLoading, onScroll]
  );

  // 滾動事件處理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    
    setIsScrolling(true);
    throttledScrollHandler(scrollTop);

    // 滾動結束檢測
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [throttledScrollHandler]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 總高度
  const totalHeight = useMemo(() => {
    return items.length * itemHeight;
  }, [items.length, itemHeight]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* 滾動容器 */}
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {/* 渲染可見項目 */}
        {cachedItems}
        
        {/* 加載更多指示器 */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: totalHeight,
              width: '100%',
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">載入中...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* 滾動指示器 */}
      {isScrolling && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {Math.round((scrollTop / (totalHeight - containerHeight)) * 100)}%
        </div>
      )}
    </div>
  );
}

// 自適應高度的虛擬列表
export function AdaptiveVirtualizedList<T>({
  items,
  estimatedItemSize = 100,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  cacheKey
}: Omit<VirtualizedListProps<T>, 'itemHeight'> & {
  estimatedItemSize?: number;
}) {
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { throttle, getCache, setCache } = usePerformanceOptimizer();

  // 測量項目高度的回調
  const measureItem = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newHeights = new Map(prev);
      newHeights.set(index, height);
      return newHeights;
    });
  }, []);

  // 計算項目位置
  const getItemOffset = useCallback((index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeights.get(i) || estimatedItemSize;
    }
    return offset;
  }, [itemHeights, estimatedItemSize]);

  // 計算總高度
  const totalHeight = useMemo(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += itemHeights.get(i) || estimatedItemSize;
    }
    return height;
  }, [items.length, itemHeights, estimatedItemSize]);

  // 計算可見範圍
  const visibleRange = useMemo(() => {
    let startIndex = 0;
    let currentOffset = 0;
    
    // 找到開始索引
    for (let i = 0; i < items.length; i++) {
      const itemHeight = itemHeights.get(i) || estimatedItemSize;
      if (currentOffset + itemHeight > scrollTop) {
        startIndex = i;
        break;
      }
      currentOffset += itemHeight;
    }

    // 找到結束索引
    let endIndex = startIndex;
    let visibleHeight = 0;
    for (let i = startIndex; i < items.length; i++) {
      const itemHeight = itemHeights.get(i) || estimatedItemSize;
      visibleHeight += itemHeight;
      if (visibleHeight >= containerHeight) {
        endIndex = i;
        break;
      }
    }

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    };
  }, [scrollTop, containerHeight, items.length, itemHeights, estimatedItemSize, overscan]);

  // 項目組件
  const MeasuredItem = React.memo(({ item, index }: { item: T; index: number }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (itemRef.current) {
        const height = itemRef.current.offsetHeight;
        measureItem(index, height);
      }
    }, [index]);

    return (
      <div
        ref={itemRef}
        style={{
          position: 'absolute',
          top: getItemOffset(index),
          width: '100%'
        }}
      >
        {renderItem(item, index)}
      </div>
    );
  });

  MeasuredItem.displayName = 'MeasuredItem';

  // 渲染可見項目
  const visibleItems = useMemo(() => {
    const items_to_render = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (items[i]) {
        items_to_render.push(
          <MeasuredItem key={i} item={items[i]} index={i} />
        );
      }
    }
    return items_to_render;
  }, [items, visibleRange, MeasuredItem]);

  // 節流的滾動處理
  const throttledScrollHandler = useCallback(
    throttle((scrollTop: number) => {
      setScrollTop(scrollTop);
      onScroll?.(scrollTop);
    }, 16),
    [onScroll]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    throttledScrollHandler(e.currentTarget.scrollTop);
  }, [throttledScrollHandler]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

export default VirtualizedList; 