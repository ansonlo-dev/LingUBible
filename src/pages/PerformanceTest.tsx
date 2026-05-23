import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PerformanceDashboard from '@/components/dev/PerformanceDashboard';
import VirtualizedList from '@/components/ui/VirtualizedList';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { usePerformanceOptimizer } from '@/utils/performance/performanceOptimizer';
import { 
  Rocket, 
  Zap, 
  Target, 
  TrendingUp, 
  Activity,
  Code,
  Database,
  Gauge
} from 'lucide-react';

export default function PerformanceTest() {
  const { performanceData } = usePerformanceMonitor({
    componentName: 'PerformanceTest',
    trackRenders: true,
    trackMemory: true,
    logToConsole: true
  });

  const { getReport, preload, batchProcess } = usePerformanceOptimizer();

  // 測試數據
  const testData = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `測試項目 ${i + 1}`,
    description: `這是第 ${i + 1} 個測試項目的描述`,
    value: Math.random() * 100
  }));

  // 性能測試函數
  const runPerformanceTests = async () => {
    console.log('🚀 開始性能測試...');
    
    // 測試批量處理
    await batchProcess(
      testData.slice(0, 100),
      (item) => {
        // 模擬處理
        const start = performance.now();
        while (performance.now() - start < 1) {
          // 1ms 的工作
        }
      },
      10,
      16
    );

    // 測試預加載
    await preload('/api/test', 'fetch');

    // 獲取性能報告
    const report = getReport();
    console.log('📊 性能報告:', report);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* 頁面標題 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Gauge className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">性能測試中心</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          全面的應用性能監控、分析和優化工具
        </p>
      </div>

      {/* 性能特性展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <FeatureCard
          icon={<Rocket className="h-6 w-6" />}
          title="智能緩存"
          description="自動管理記憶體緩存，提升數據訪問速度"
          status="active"
        />
        <FeatureCard
          icon={<Zap className="h-6 w-6" />}
          title="虛擬滾動"
          description="大量數據的高效渲染，減少 DOM 節點"
          status="active"
        />
        <FeatureCard
          icon={<Target className="h-6 w-6" />}
          title="性能監控"
          description="實時追蹤組件性能和頁面指標"
          status="active"
        />
        <FeatureCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="代碼分割"
          description="按需載入，減少初始包大小"
          status="active"
        />
      </div>

      {/* 當前組件性能 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            當前頁面性能
          </CardTitle>
          <CardDescription>
            此頁面的實時性能數據
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceData.renderTime.toFixed(2)}ms
              </div>
              <div className="text-sm text-muted-foreground">渲染時間</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceData.updateCount}
              </div>
              <div className="text-sm text-muted-foreground">更新次數</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performanceData.memoryUsage ? 
                  `${(performanceData.memoryUsage / 1024 / 1024).toFixed(1)}MB` : 
                  'N/A'
                }
              </div>
              <div className="text-sm text-muted-foreground">記憶體使用</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {performanceData.mountTime.toFixed(2)}ms
              </div>
              <div className="text-sm text-muted-foreground">掛載時間</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 性能測試工具 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            性能測試工具
          </CardTitle>
          <CardDescription>
            運行各種性能測試來評估應用表現
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={runPerformanceTests} className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              運行性能測試
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <Activity className="h-4 w-4 mr-2" />
              重新載入頁面
            </Button>
            <Button variant="outline" onClick={() => {
              if ('gc' in window) {
                (window as any).gc();
                console.log('🧹 手動觸發垃圾回收');
              } else {
                console.log('❌ 垃圾回收 API 不可用');
              }
            }}>
              <Database className="h-4 w-4 mr-2" />
              垃圾回收
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 虛擬滾動演示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            虛擬滾動演示
          </CardTitle>
          <CardDescription>
            展示 1000 個項目的高效渲染（僅渲染可見項目）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VirtualizedList
            items={testData}
            itemHeight={60}
            containerHeight={300}
            renderItem={(item, index) => (
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">{item.value.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">#{index + 1}</div>
                </div>
              </div>
            )}
            className="border rounded-lg"
            cacheKey="performance-test"
          />
        </CardContent>
      </Card>

      {/* 性能儀表板 */}
      <PerformanceDashboard />
    </div>
  );
}

// 特性卡片組件
function FeatureCard({
  icon,
  title,
  description,
  status
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'warning';
}) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    warning: 'bg-yellow-100 text-yellow-800'
  };

  const statusLabels = {
    active: '啟用',
    inactive: '停用',
    warning: '警告'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            {icon}
          </div>
          <Badge className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
} 