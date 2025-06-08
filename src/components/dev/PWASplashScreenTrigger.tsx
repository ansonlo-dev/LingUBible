import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PWASplashScreen } from '@/components/features/pwa/PWASplashScreen';
import { usePWASplashScreen } from '@/hooks/usePWASplashScreen';
import { Smartphone, Monitor, Play, Settings, Info } from 'lucide-react';

export function PWASplashScreenTrigger() {
  const [showManualSplash, setShowManualSplash] = useState(false);
  const [duration, setDuration] = useState(3000);
  const { 
    isVisible, 
    shouldShow, 
    isStandalone, 
    isFirstLaunch,
    triggerSplashScreen,
    hideSplashScreen 
  } = usePWASplashScreen();

  const handleManualTrigger = () => {
    setShowManualSplash(true);
  };

  const handleManualComplete = () => {
    setShowManualSplash(false);
  };

  const handleSystemTrigger = () => {
    triggerSplashScreen();
  };

  // 檢測設備類型
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /ipad|iphone|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid;

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            PWA 啟動畫面測試
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 狀態信息 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">PWA 模式：</span>
              <Badge variant={isStandalone ? "default" : "secondary"}>
                {isStandalone ? "已啟用" : "未啟用"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">設備類型：</span>
              <Badge variant="outline">
                {isIOS ? "iOS" : isAndroid ? "Android" : "桌面"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">首次啟動：</span>
              <Badge variant={isFirstLaunch ? "default" : "secondary"}>
                {isFirstLaunch ? "是" : "否"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">應顯示啟動畫面：</span>
              <Badge variant={shouldShow ? "default" : "secondary"}>
                {shouldShow ? "是" : "否"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">當前顯示狀態：</span>
              <Badge variant={isVisible ? "destructive" : "secondary"}>
                {isVisible ? "顯示中" : "隱藏"}
              </Badge>
            </div>
          </div>

          {/* 持續時間設定 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">顯示時長（毫秒）：</label>
            <div className="flex gap-2">
              {[1500, 3000, 5000].map((time) => (
                <Button
                  key={time}
                  variant={duration === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDuration(time)}
                >
                  {time}ms
                </Button>
              ))}
            </div>
          </div>

          {/* 測試按鈕 */}
          <div className="space-y-2">
            <Button 
              onClick={handleManualTrigger}
              className="w-full"
              disabled={showManualSplash}
            >
              <Play className="h-4 w-4 mr-2" />
              手動觸發啟動畫面
            </Button>
            
            <Button 
              onClick={handleSystemTrigger}
              variant="outline"
              className="w-full"
              disabled={isVisible}
            >
              <Settings className="h-4 w-4 mr-2" />
              使用系統邏輯觸發
            </Button>
          </div>

          {/* 說明信息 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">測試說明：</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>手動觸發：直接顯示啟動畫面</li>
                  <li>系統觸發：使用 PWA 檢測邏輯</li>
                  <li>在 PWA 模式下效果最佳</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open('/test-splash-screen.html', '_blank')}
            >
              測試頁面
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open('/splash/', '_blank')}
            >
              查看圖片
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 手動觸發的啟動畫面 */}
      <PWASplashScreen 
        isVisible={showManualSplash}
        onComplete={handleManualComplete}
        duration={duration}
      />
    </>
  );
} 