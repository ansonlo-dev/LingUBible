import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CachedCourseService } from '@/services/cache/cachedCourseService';
import { cacheService } from '@/services/cache/cacheService';

export default function CacheDebug() {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [cacheKeys, setCacheKeys] = useState<string[]>([]);

  const refreshStats = () => {
    const stats = CachedCourseService.getCacheStats();
    setCacheStats(stats);
    
    // 獲取所有快取鍵值
    const keys: string[] = [];
    // @ts-ignore - 訪問私有屬性用於調試
    for (const [key] of cacheService.cache) {
      keys.push(key);
    }
    setCacheKeys(keys);
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    CachedCourseService.clearAllCache();
    refreshStats();
  };

  const testInstructorCache = async () => {
    console.log('Testing instructor cache...');
    const startTime = performance.now();
    
    // 測試講師列表
    await CachedCourseService.getAllInstructors();
    const listTime = performance.now();
    console.log('Instructor list loaded in:', listTime - startTime, 'ms');
    
    // 測試講師詳情
    const instructors = await CachedCourseService.getAllInstructors();
    if (instructors.length > 0) {
      const firstInstructor = instructors[0];
      await CachedCourseService.getInstructorByName(firstInstructor.name);
      const detailTime = performance.now();
      console.log('Instructor detail loaded in:', detailTime - listTime, 'ms');
      
      // 再次載入相同講師（應該從快取載入）
      await CachedCourseService.getInstructorByName(firstInstructor.name);
      const cachedTime = performance.now();
      console.log('Instructor detail (cached) loaded in:', cachedTime - detailTime, 'ms');
    }
    
    refreshStats();
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>快取調試工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={refreshStats}>刷新統計</Button>
            <Button onClick={clearCache} variant="destructive">清除所有快取</Button>
            <Button onClick={testInstructorCache} variant="outline">測試講師快取</Button>
          </div>
          
          {cacheStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{cacheStats.totalSize}</div>
                  <div className="text-sm text-muted-foreground">總快取項目</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{cacheStats.validCount}</div>
                  <div className="text-sm text-muted-foreground">有效項目</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{cacheStats.expiredCount}</div>
                  <div className="text-sm text-muted-foreground">過期項目</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{(cacheStats.hitRate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">命中率</div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>快取鍵值</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto">
                {cacheKeys.map((key, index) => (
                  <div key={index} className="text-sm font-mono py-1 border-b">
                    {key}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
} 