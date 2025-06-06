import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, Smartphone, Monitor, Check } from 'lucide-react';
import { usePWAManifest } from '@/hooks/usePWAManifest';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface CustomPWAInstallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstallComplete: (success: boolean) => void;
}

export function CustomPWAInstallDialog({ 
  isOpen, 
  onClose, 
  installPrompt, 
  onInstallComplete 
}: CustomPWAInstallDialogProps) {
  const { t } = useLanguage();
  const {
    getAppName,
    getAppDescription,
    getAppIcon,
    isManifestReady,
    currentLanguage
  } = usePWAManifest();
  
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<'success' | 'failed' | 'manual' | null>(null);

  // 重置狀態當對話框打開時
  useEffect(() => {
    if (isOpen) {
      setIsInstalling(false);
      setInstallResult(null);
    }
  }, [isOpen]);

  // ESC 鍵關閉對話框
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      console.log('CustomPWAInstallDialog: 開始安裝流程');
      console.log('CustomPWAInstallDialog: 使用 manifest 數據:', {
        name: getAppName(),
        description: getAppDescription(),
        language: currentLanguage,
        ready: isManifestReady(),
        hasInstallPrompt: !!installPrompt
      });

      // 統一使用手動安裝指引，避免原生提示的語言不一致問題
      console.log('CustomPWAInstallDialog: 顯示手動安裝指引');
      console.log('CustomPWAInstallDialog: 當前語言:', currentLanguage);
      console.log('CustomPWAInstallDialog: 有原生安裝提示:', !!installPrompt);
      
      // 顯示手動安裝指引
      setInstallResult('manual');
      
      // 5秒後關閉對話框
      setTimeout(() => {
        onClose();
        // 如果有原生安裝提示，標記為成功（用戶可以手動安裝）
        // 如果沒有，標記為失敗
        onInstallComplete(!!installPrompt);
      }, 5000);
      
    } catch (error) {
      console.error('CustomPWAInstallDialog: 安裝失敗:', error);
      setInstallResult('failed');
      setTimeout(() => {
        onClose();
        onInstallComplete(false);
      }, 1500);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleCancel = () => {
    console.log('CustomPWAInstallDialog: 用戶取消安裝');
    onClose();
  };

  if (!isOpen) return null;

  // 檢測平台
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = userAgent.includes('android') || userAgent.includes('iphone') || userAgent.includes('ipad');
  const PlatformIcon = isMobile ? Smartphone : Monitor;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // 只有當點擊的是背景遮罩時才關閉對話框
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const dialogContent = (
    <div 
      className="fixed inset-0 z-[100000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" 
      style={{ minHeight: '100vh' }}
      onClick={handleBackdropClick}
    >
      <Card className="max-w-md w-full shadow-2xl border-0 bg-white dark:bg-gray-900 backdrop-blur-md rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
              <PlatformIcon className="h-5 w-5 text-blue-600" />
              {t('pwa.installApp')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isInstalling}
              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 應用信息 */}
          <div className="flex items-start gap-3">
            {getAppIcon('192x192') && (
              <img 
                src={getAppIcon('192x192')} 
                alt="App Icon" 
                className="w-12 h-12 rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {isManifestReady() ? getAppName() : 'LingUBible'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {isManifestReady() ? getAppDescription() : t('pwa.installDescription')}
              </p>
            </div>
          </div>

          {/* 語言信息 */}
          {isManifestReady() && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>{t('common.language')}:</strong> {currentLanguage}
              </p>
            </div>
          )}

          {/* 安裝好處 */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">{t('pwa.installBenefits')}</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                {t('pwa.features.fast')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                {t('pwa.features.offline')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                {t('pwa.features.native')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-green-600" />
                {t('pwa.features.homescreen')}
              </li>
            </ul>
          </div>

          {/* 安裝結果 */}
          {installResult === 'success' && (
            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg text-center">
              <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                {t('pwa.installSuccess')}
              </p>
            </div>
          )}

          {installResult === 'failed' && (
            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
              <X className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                {t('pwa.installFailed')}
              </p>
            </div>
          )}

          {installResult === 'manual' && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="text-center mb-4">
                <Monitor className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  {t('pwa.manualInstall')}
                </p>
              </div>
              
              {/* 通用步驟 */}
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-2 mb-4">
                <p><strong>1.</strong> {t('pwa.manual.step1')}</p>
                <p><strong>2.</strong> {t('pwa.manual.step2')}</p>
                <p><strong>3.</strong> {t('pwa.manual.step3')}</p>
              </div>
              
              {/* 瀏覽器特定指引 */}
              <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                                 <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">{t('pwa.manual.browserSpecific')}</p>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p>• {t('pwa.manual.chrome')}</p>
                  <p>• {t('pwa.manual.firefox')}</p>
                  <p>• {t('pwa.manual.safari')}</p>
                  <p>• {t('pwa.manual.edge')}</p>
                </div>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          {!installResult && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isInstalling}
                className="flex-1 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t('pwa.notNow')}
              </Button>
              <Button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1"
              >
                {isInstalling ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common.installing')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {t('pwa.showInstructions')}
                  </div>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // 使用 Portal 將對話框渲染到 document.body
  return createPortal(dialogContent, document.body);
} 