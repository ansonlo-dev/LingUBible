// PWA Service Worker 註冊腳本
(function() {
  'use strict';

  // 檢查瀏覽器是否支援 Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      // 註冊 Service Worker
      navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      }).then(function(registration) {
        console.log('✅ Service Worker 註冊成功:', registration.scope);
        
        // 檢查更新
        registration.addEventListener('updatefound', function() {
          console.log('🔄 發現 Service Worker 更新');
        });
      }).catch(function(error) {
        console.log('❌ Service Worker 註冊失敗:', error);
      });
    });
  }

  // PWA 安裝提示處理
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', function(e) {
    console.log('💡 PWA 安裝提示可用');
    
    // 防止瀏覽器自動顯示安裝提示
    e.preventDefault();
    
    // 保存事件以便稍後觸發
    deferredPrompt = e;
    
    // 顯示自定義安裝按鈕（如果存在）
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', function() {
        // 顯示安裝提示
        deferredPrompt.prompt();
        
        // 等待用戶回應
        deferredPrompt.userChoice.then(function(choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            console.log('✅ 用戶接受了 PWA 安裝');
          } else {
            console.log('❌ 用戶拒絕了 PWA 安裝');
          }
          deferredPrompt = null;
        });
      });
    }
  });

  // 檢測 PWA 是否已安裝
  window.addEventListener('appinstalled', function(e) {
    console.log('🎉 PWA 安裝成功');
    
    // 隱藏安裝按鈕
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  });

  // 檢查是否在 PWA 模式下運行
  function isPWAMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // 如果在 PWA 模式下，添加相應的樣式類
  if (isPWAMode()) {
    document.documentElement.classList.add('pwa-mode');
    console.log('📱 運行在 PWA 模式');
  }

  // 全局函數供其他腳本使用
  window.PWAUtils = {
    isPWAMode: isPWAMode,
    showInstallPrompt: function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        return deferredPrompt.userChoice;
      }
      return Promise.resolve({ outcome: 'dismissed' });
    }
  };
})(); 