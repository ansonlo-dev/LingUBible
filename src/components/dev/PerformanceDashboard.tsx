import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Cpu, 
  HardDrive, 
  Network, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';
import { useAppPerformance } from '@/hooks/usePerformanceMonitor';

interface PerformanceDashboardProps {
  className?: string;
  showRecommendations?: boolean;
}

export function PerformanceDashboard({ 
  className = '',
  showRecommendations = true 
}: PerformanceDashboardProps) {
  const { pageMetrics, memoryInfo, networkInfo, getFullReport } = useAppPerformance();
  const [refreshing, setRefreshing] = useState(false);
  const [fullReport, setFullReport] = useState<any>(null);

  // 刷新報告
  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬載入
    const report = getFullReport();
    setFullReport(report);
    setRefreshing(false);
  };

  // 初始化報告
  useEffect(() => {
    const report = getFullReport();
    setFullReport(report);
  }, [getFullReport]);

  // 性能評分計算
  const calculatePerformanceScore = () => {
    let score = 100;
    
    // 頁面載入時間評分
    if (pageMetrics.loadTime > 3000) score -= 20;
    else if (pageMetrics.loadTime > 2000) score -= 10;
    
    // LCP 評分
    if (pageMetrics.largestContentfulPaint > 2500) score -= 15;
    else if (pageMetrics.largestContentfulPaint > 1500) score -= 8;
    
    // CLS 評分
    if (pageMetrics.cumulativeLayoutShift > 0.25) score -= 15;
    else if (pageMetrics.cumulativeLayoutShift > 0.1) score -= 8;
    
    // 記憶體使用評分
    if (memoryInfo.usagePercentage > 80) score -= 20;
    else if (memoryInfo.usagePercentage > 60) score -= 10;
    
    return Math.max(0, Math.round(score));
  };

  const performanceScore = calculatePerformanceScore();

  // 獲取性能等級
  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 80) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 60) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const gradeInfo = getPerformanceGrade(performanceScore);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 性能總覽 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              性能總覽
            </CardTitle>
            <CardDescription>應用整體性能評估</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${gradeInfo.bg} ${gradeInfo.color}`}>
                {gradeInfo.grade}
              </div>
              <div>
                <div className="text-2xl font-bold">{performanceScore}/100</div>
                <div className="text-sm text-muted-foreground">性能評分</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                {performanceScore >= 80 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-sm font-medium">
                  {performanceScore >= 80 ? '性能良好' : '需要優化'}
                </span>
              </div>
            </div>
          </div>
          <Progress value={performanceScore} className="h-2" />
        </CardContent>
      </Card>

      {/* 詳細指標 */}
      <Tabs defaultValue="vitals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vitals">核心指標</TabsTrigger>
          <TabsTrigger value="memory">記憶體</TabsTrigger>
          <TabsTrigger value="network">網路</TabsTrigger>
          <TabsTrigger value="components">組件</TabsTrigger>
        </TabsList>

        {/* 核心指標 */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="頁面載入時間"
              value={`${(pageMetrics.loadTime / 1000).toFixed(2)}s`}
              icon={<Clock className="h-4 w-4" />}
              status={pageMetrics.loadTime < 2000 ? 'good' : pageMetrics.loadTime < 3000 ? 'warning' : 'poor'}
              description="從開始導航到載入完成"
            />
            <MetricCard
              title="最大內容繪製 (LCP)"
              value={`${(pageMetrics.largestContentfulPaint / 1000).toFixed(2)}s`}
              icon={<BarChart3 className="h-4 w-4" />}
              status={pageMetrics.largestContentfulPaint < 1500 ? 'good' : pageMetrics.largestContentfulPaint < 2500 ? 'warning' : 'poor'}
              description="最大元素的渲染時間"
            />
            <MetricCard
              title="首次輸入延遲 (FID)"
              value={`${pageMetrics.firstInputDelay.toFixed(2)}ms`}
              icon={<Zap className="h-4 w-4" />}
              status={pageMetrics.firstInputDelay < 100 ? 'good' : pageMetrics.firstInputDelay < 300 ? 'warning' : 'poor'}
              description="首次互動的響應時間"
            />
            <MetricCard
              title="累積佈局偏移 (CLS)"
              value={pageMetrics.cumulativeLayoutShift.toFixed(3)}
              icon={<TrendingUp className="h-4 w-4" />}
              status={pageMetrics.cumulativeLayoutShift < 0.1 ? 'good' : pageMetrics.cumulativeLayoutShift < 0.25 ? 'warning' : 'poor'}
              description="視覺穩定性指標"
            />
            <MetricCard
              title="DOM 內容載入"
              value={`${(pageMetrics.domContentLoaded / 1000).toFixed(2)}s`}
              icon={<Activity className="h-4 w-4" />}
              status={pageMetrics.domContentLoaded < 1000 ? 'good' : pageMetrics.domContentLoaded < 2000 ? 'warning' : 'poor'}
              description="DOM 解析完成時間"
            />
            <MetricCard
              title="首次內容繪製 (FCP)"
              value={`${(pageMetrics.firstContentfulPaint / 1000).toFixed(2)}s`}
              icon={<BarChart3 className="h-4 w-4" />}
              status={pageMetrics.firstContentfulPaint < 1000 ? 'good' : pageMetrics.firstContentfulPaint < 1800 ? 'warning' : 'poor'}
              description="首次內容顯示時間"
            />
          </div>
        </TabsContent>

        {/* 記憶體監控 */}
        <TabsContent value="memory" className="space-y-4">
          <MemoryMonitor memoryInfo={memoryInfo} />
        </TabsContent>

        {/* 網路監控 */}
        <TabsContent value="network" className="space-y-4">
          <NetworkMonitor networkInfo={networkInfo} />
        </TabsContent>

        {/* 組件性能 */}
        <TabsContent value="components" className="space-y-4">
          <ComponentPerformance report={fullReport} />
        </TabsContent>
      </Tabs>

      {/* 性能建議 */}
      {showRecommendations && fullReport?.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              性能建議
            </CardTitle>
            <CardDescription>基於當前性能指標的優化建議</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fullReport.recommendations.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
              {fullReport.recommendations.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">目前性能表現良好，無需特別優化</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// 指標卡片組件
function MetricCard({ 
  title, 
  value, 
  icon, 
  status, 
  description 
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  status: 'good' | 'warning' | 'poor';
  description: string;
}) {
  const statusColors = {
    good: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    poor: 'text-red-600 bg-red-100'
  };

  const statusLabels = {
    good: '良好',
    warning: '警告',
    poor: '需改善'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <Badge variant="secondary" className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  );
}

// 記憶體監控組件
function MemoryMonitor({ memoryInfo }: { memoryInfo: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            記憶體使用情況
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>已使用</span>
                <span>{(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <Progress value={memoryInfo.usagePercentage} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">總容量</div>
                <div className="font-medium">{(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <div>
                <div className="text-muted-foreground">使用率</div>
                <div className="font-medium">{memoryInfo.usagePercentage.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            記憶體限制
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(0)} MB
          </div>
          <div className="text-sm text-muted-foreground">
            JavaScript 堆記憶體上限
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 網路監控組件
function NetworkMonitor({ networkInfo }: { networkInfo: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            連接類型
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {networkInfo.effectiveType.toUpperCase()}
          </div>
          <div className="text-sm text-muted-foreground">
            有效連接類型
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>下載速度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {networkInfo.downlink} Mbps
          </div>
          <div className="text-sm text-muted-foreground">
            估計下載頻寬
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>網路延遲</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {networkInfo.rtt} ms
          </div>
          <div className="text-sm text-muted-foreground">
            往返時間
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 組件性能監控
function ComponentPerformance({ report }: { report: any }) {
  if (!report?.components || report.components.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">暫無組件性能數據</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>組件渲染性能</CardTitle>
        <CardDescription>各組件的渲染時間和次數統計</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {report.components.map((component: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="font-medium">{component.componentName}</div>
                <div className="text-sm text-muted-foreground">
                  渲染 {component.renderCount} 次
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {component.averageRenderTime.toFixed(2)}ms
                </div>
                <div className="text-sm text-muted-foreground">
                  平均渲染時間
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceDashboard; 