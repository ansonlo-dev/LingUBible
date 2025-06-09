import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWA } from '@/contexts/PWAContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

export const PWAInstallIcon = () => {
  const { 
    canInstall, 
    deferredPrompt,
    promptInstall,
    isInstalled
  } = usePWA();
  const { t } = useLanguage();
  const [forceShow, setForceShow] = useState(false);
  const [isPWAMode, setIsPWAMode] = useState(false);

  useEffect(() => {
    // 檢查是否在 PWA 模式下運行
    const checkPWAMode = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://');
      setIsPWAMode(isStandalone);
      return isStandalone;
    };

    const pwaMode = checkPWAMode();
    
    // 如果不在 PWA 模式下，且是桌面瀏覽器，強制顯示安裝按鈕
    if (!pwaMode && !isInstalled) {
      const isDesktop = window.innerWidth >= 768;
      const isHTTPS = window.location.protocol === 'https:';
      const isSupportedBrowser = navigator.userAgent.includes('Chrome') || 
                                navigator.userAgent.includes('Edge') ||
                                navigator.userAgent.includes('Firefox');
      
      if (isDesktop && isHTTPS && isSupportedBrowser) {
        console.log('🖥️ 桌面環境檢測到，強制顯示 PWA 安裝按鈕');
        setForceShow(true);
      }
    }

    // 監聽顯示模式變化
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      const newPWAMode = checkPWAMode();
      if (newPWAMode) {
        setForceShow(false);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isInstalled]);

  const handleInstallClick = async () => {
    console.log('PWAInstallIcon: 點擊安裝按鈕');
    console.log('PWAInstallIcon: deferredPrompt 狀態:', deferredPrompt);
    console.log('PWAInstallIcon: canInstall 狀態:', canInstall);
    console.log('PWAInstallIcon: forceShow 狀態:', forceShow);
    
    // 優先嘗試原生安裝
    if (deferredPrompt) {
      console.log('PWAInstallIcon: 使用原生安裝提示');
      try {
        await promptInstall();
        console.log('PWAInstallIcon: 原生安裝完成');
        return;
      } catch (error) {
        console.error('PWAInstallIcon: 原生安裝失敗:', error);
      }
    }

    // 備用：使用 Service Worker 的安裝方法
    if ((window as any).PWAInstaller?.hasPrompt()) {
      console.log('PWAInstallIcon: 使用 Service Worker 安裝方法');
      try {
        await (window as any).PWAInstaller.triggerInstallPrompt();
        console.log('PWAInstallIcon: Service Worker 安裝完成');
        return;
      } catch (error) {
        console.error('PWAInstallIcon: Service Worker 安裝失敗:', error);
      }
    }

    // 最後備用：顯示手動安裝指引
    console.log('PWAInstallIcon: 顯示手動安裝指引');
    showManualInstallDialog();
  };

  const showManualInstallDialog = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    let title = '安裝 LingUBible 應用';
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      instructions = `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>方法 1：地址欄安裝圖標</strong></p>
          <p>• 查看地址欄右側是否有安裝圖標 📱</p>
          <p>• 點擊該圖標即可安裝</p>
          <br>
          <p><strong>方法 2：瀏覽器選單</strong></p>
          <p>• 點擊瀏覽器右上角的三點選單 ⋮</p>
          <p>• 選擇「安裝 LingUBible」或「建立捷徑」</p>
          <p>• 確認安裝即可</p>
        </div>
      `;
    } else if (userAgent.includes('edg')) {
      instructions = `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>方法 1：地址欄安裝圖標</strong></p>
          <p>• 查看地址欄右側的安裝圖標 📱</p>
          <p>• 點擊該圖標即可安裝</p>
          <br>
          <p><strong>方法 2：瀏覽器選單</strong></p>
          <p>• 點擊瀏覽器右上角的三點選單 ⋯</p>
          <p>• 選擇「應用程式」→「將此網站安裝為應用程式」</p>
          <p>• 確認安裝即可</p>
        </div>
      `;
    } else if (userAgent.includes('firefox')) {
      instructions = `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>Firefox 安裝方法：</strong></p>
          <p>• 點擊瀏覽器右上角的選單 ☰</p>
          <p>• 選擇「安裝」或「加入主畫面」</p>
          <p>• 或者將此頁面加入書籤以便快速訪問</p>
        </div>
      `;
    } else {
      instructions = `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>通用安裝方法：</strong></p>
          <p>• 查看地址欄是否有安裝圖標</p>
          <p>• 或在瀏覽器選單中尋找「安裝」選項</p>
          <p>• 也可以將此頁面加入書籤</p>
        </div>
      `;
    }
    
    // 創建模態對話框
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 100%;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        text-align: center;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
        <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px;">${title}</h2>
        <div style="margin-bottom: 24px; color: #666;">
          ${instructions}
        </div>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button onclick="this.closest('[data-modal]').remove()" style="
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
          ">知道了</button>
          <button onclick="window.open('https://support.google.com/chrome/answer/9658361', '_blank')" style="
            background: #f5f5f5;
            color: #333;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          ">了解更多</button>
        </div>
      </div>
    `;
    
    modal.setAttribute('data-modal', 'true');
    
    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    document.body.appendChild(modal);
    
    // 10秒後自動關閉
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 15000);
  };

  // 決定是否顯示按鈕
  const shouldShow = !isPWAMode && !isInstalled && (canInstall || forceShow);

  if (!shouldShow) {
    return null;
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleInstallClick}
      className="pwa-install-button text-white font-medium text-sm px-2 sm:px-3 md:px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
      title={t('pwa.install')}
    >
      <Download className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline">{t('pwa.install')}</span>
      <span className="md:hidden">安裝</span>
    </Button>
  );
}; 