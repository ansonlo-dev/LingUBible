import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWA } from '@/contexts/PWAContext';
import { useLanguage } from '@/contexts/LanguageContext';

export const PWAInstallIcon = () => {
  const { 
    canInstall, 
    deferredPrompt,
    promptInstall,
    isInstalled
  } = usePWA();
  const { t } = useLanguage();

  const handleInstallClick = async () => {
    console.log('PWAInstallIcon: 點擊安裝按鈕');
    console.log('PWAInstallIcon: deferredPrompt 狀態:', deferredPrompt);
    console.log('PWAInstallIcon: canInstall 狀態:', canInstall);
    
    if (!deferredPrompt) {
      console.error('PWAInstallIcon: 沒有可用的安裝提示，無法觸發原生安裝');
      return;
    }

    try {
      // 直接使用 PWAContext 的 promptInstall 方法觸發原生安裝
      console.log('PWAInstallIcon: 正在調用 promptInstall()...');
      await promptInstall();
      console.log('PWAInstallIcon: promptInstall() 調用完成');
      
    } catch (error) {
      console.error('PWAInstallIcon: 安裝過程出錯:', error);
      console.error('PWAInstallIcon: 錯誤詳情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  };

  // 如果不能安裝，不顯示按鈕
  if (!canInstall) {
    return null;
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleInstallClick}
      className="pwa-install-button text-white font-medium text-sm px-2 sm:px-3 md:px-4"
      title={t('pwa.install')}
    >
      <Download className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline">{t('pwa.install')}</span>
    </Button>
  );
}; 