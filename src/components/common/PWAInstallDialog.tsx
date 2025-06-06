import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePWAManifest } from '@/hooks/usePWAManifest';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Zap, Wifi, HardDrive } from 'lucide-react';

interface PWAInstallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<void>;
}

export function PWAInstallDialog({ isOpen, onClose, onInstall }: PWAInstallDialogProps) {
  const { t } = useLanguage();
  const { getAppName, getAppDescription } = usePWAManifest();

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInstallClick = async () => {
    try {
      await onInstall();
      onClose();
    } catch (error) {
      console.error('安裝失敗:', error);
    }
  };

  // ESC 鍵關閉
  React.useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100000] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('pwa.install.title')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {getAppName()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 內容 */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {getAppDescription()}
          </p>

          {/* 安裝好處 */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {t('pwa.install.benefits.title')}
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <Smartphone className="w-4 h-4 text-blue-500" />
                <span>{t('pwa.install.benefits.homeScreen')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <Zap className="w-4 h-4 text-green-500" />
                <span>{t('pwa.install.benefits.faster')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <Wifi className="w-4 h-4 text-purple-500" />
                <span>{t('pwa.install.benefits.offline')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-300">
                <HardDrive className="w-4 h-4 text-orange-500" />
                <span>{t('pwa.install.benefits.storage')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="flex space-x-3 p-6 bg-gray-50 dark:bg-gray-800">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleInstallClick}
            className="flex-1 pwa-install-button text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('pwa.install.button')}
          </Button>
        </div>
      </div>
    </div>
  );
} 