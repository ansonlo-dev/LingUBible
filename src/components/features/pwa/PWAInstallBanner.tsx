import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePWAManifest } from '@/hooks/usePWAManifest';
import { useLanguage } from '@/contexts/LanguageContext';
import { CustomPWAInstallDialog } from './CustomPWAInstallDialog';

interface PWAInstallBannerProps {
  className?: string;
  variant?: 'banner' | 'card' | 'floating';
  showDelay?: number; // 延遲顯示時間（毫秒）
  autoHide?: boolean; // 是否自動隱藏
  autoHideDelay?: number; // 自動隱藏延遲（毫秒）
}

export function PWAInstallBanner({ 
  className = '',
  variant = 'banner',
  showDelay = 3000,
  autoHide = false,
  autoHideDelay = 10000
}: PWAInstallBannerProps) {
  const { t } = useLanguage();
  const { 
    canInstall, 
    isInstalled, 
    isStandalone,
    platform,
    promptInstall,
    getInstallInstructions,
    showCustomDialog,
    closeCustomDialog,
    handleInstallComplete,
    installPrompt
  } = usePWAInstall();
  
  const {
    getAppName,
    getAppDescription,
    isManifestReady
  } = usePWAManifest();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // 檢查是否已經被用戶永久關閉
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // 控制顯示邏輯
  useEffect(() => {
    if (isDismissed || isInstalled || isStandalone) {
      setIsVisible(false);
      return;
    }

    // 延遲顯示
    const showTimer = setTimeout(() => {
      if (canInstall || platform === 'iOS') { // iOS 需要手動指引
        setIsVisible(true);
      }
    }, showDelay);

    // 自動隱藏
    if (autoHide) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, showDelay + autoHideDelay);
      
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }

    return () => clearTimeout(showTimer);
  }, [canInstall, platform, isDismissed, isInstalled, isStandalone, showDelay, autoHide, autoHideDelay]);

  const handleInstall = async () => {
    if (canInstall) {
      // 在觸發安裝前，確保使用最新的 manifest 數據
      console.log('PWA Banner: 準備觸發安裝，當前 manifest 狀態:', isManifestReady());
      
      if (isManifestReady()) {
        console.log('PWA Banner: 使用最新的 manifest 數據:', {
          name: getAppName(),
          description: getAppDescription()
        });
      }
      
      // 使用官方 API 觸發安裝
      const success = await promptInstall();
      if (success) {
        setIsVisible(false);
      }
    } else if (platform === 'iOS') {
      // iOS 顯示手動安裝指引
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleDismissForever = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isVisible) return null;

  const instructions = getInstallInstructions();
  const isPlatformMobile = platform === 'iOS' || platform === 'Android';

  // 橫幅樣式
  if (variant === 'banner') {
    return (
      <div className={`fixed top-16 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg ${className}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPlatformMobile ? <Smartphone className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              <div>
                <p className="font-medium">
                  {isManifestReady() ? getAppName() : t('pwa.installAvailable')}
                </p>
                <p className="text-sm opacity-90">
                  {isManifestReady() ? getAppDescription() : t('pwa.detailedDescription')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleInstall}
                className="pwa-install-button text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {canInstall ? t('pwa.install') : t('pwa.howToInstall')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 卡片樣式
  if (variant === 'card') {
    return (
      <Card className={`mx-4 my-4 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {isPlatformMobile ? <Smartphone className="h-6 w-6 text-blue-600 mt-1" /> : <Monitor className="h-6 w-6 text-blue-600 mt-1" />}
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {isManifestReady() ? getAppName() : t('pwa.installAvailable')}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {isManifestReady() ? getAppDescription() : t('pwa.detailedDescription')}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleInstall}
                    className="pwa-install-button text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {canInstall ? t('pwa.install') : t('pwa.howToInstall')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDismissForever}
                    className="text-gray-600"
                  >
                    {t('pwa.notNow')}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 浮動樣式
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-4 right-4 z-50 max-w-sm ${className}`}>
        <Card className="border-blue-200 bg-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {isPlatformMobile ? <Smartphone className="h-5 w-5 text-blue-600" /> : <Monitor className="h-5 w-5 text-blue-600" />}
                <h4 className="font-medium text-gray-900">
                  {isManifestReady() ? getAppName() : t('pwa.installApp')}
                </h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {isManifestReady() ? getAppDescription() : t('pwa.installBenefits')}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="flex-1 pwa-install-button text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {canInstall ? t('pwa.install') : t('pwa.howToInstall')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismissForever}
                className="text-gray-600"
              >
                {t('pwa.dismiss')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 安裝指引彈窗（主要針對 iOS）
  if (showInstructions) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('pwa.manual.title')}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{t('pwa.manual.description')}</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <p className="text-sm text-gray-700">{t('pwa.manual.step1')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <p className="text-sm text-gray-700">{t('pwa.manual.step2')}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <p className="text-sm text-gray-700">{t('pwa.manual.step3')}</p>
              </div>
              <div className="border-t pt-3 mt-4">
                <p className="text-xs text-gray-500 font-medium mb-2">{t('pwa.manual.browserSpecific')}</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• {t('pwa.manual.chrome')}</p>
                  <p>• {t('pwa.manual.firefox')}</p>
                  <p>• {t('pwa.manual.safari')}</p>
                  <p>• {t('pwa.manual.edge')}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button
                onClick={() => setShowInstructions(false)}
                className="flex-1"
              >
                {t('pwa.gotIt')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* 自定義 PWA 安裝對話框 */}
      <CustomPWAInstallDialog
        isOpen={showCustomDialog}
        onClose={closeCustomDialog}
        installPrompt={installPrompt}
        onInstallComplete={handleInstallComplete}
      />
    </>
  );
} 