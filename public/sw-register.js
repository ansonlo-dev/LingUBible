// PWA Service Worker 註冊腳本
(function() {
  'use strict';

  // 檢查瀏覽器是否支援 Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      // 根據環境選擇正確的 Service Worker 文件
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' || 
                           window.location.hostname.includes('localhost');
      
      // 在開發環境中，首先檢查 dev-sw.js 是否存在
      const swPath = isDevelopment ? '/dev-sw.js' : '/sw.js';
      
      // 在開發環境中先檢查檔案是否存在
      if (isDevelopment) {
        fetch(swPath, { method: 'HEAD' })
          .then(response => {
            if (response.ok && response.headers.get('content-type')?.includes('javascript')) {
              registerServiceWorker(swPath);
            } else {
              console.warn('⚠️ 開發環境 Service Worker 檔案不存在或格式不正確，跳過註冊');
            }
          })
          .catch(() => {
            console.warn('⚠️ 開發環境 Service Worker 檔案不存在，跳過註冊');
          });
      } else {
        // 生產環境直接註冊
        registerServiceWorker(swPath);
      }
      
      function registerServiceWorker(path) {
        // 註冊 Service Worker
        navigator.serviceWorker.register(path, {
          scope: '/'
        }).then(function(registration) {
          console.log('✅ Service Worker 註冊成功:', registration.scope);
          console.log('📄 使用的 SW 文件:', path);
          
          // 檢查更新
          registration.addEventListener('updatefound', function() {
            console.log('🔄 發現 Service Worker 更新');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🆕 新的 Service Worker 已安裝，等待激活');
                }
              });
            }
          });

          // 強制檢查更新（僅在生產環境）
          if (path === '/sw.js') {
            setInterval(() => {
              registration.update();
            }, 60000); // 每分鐘檢查一次更新
          }
          
        }).catch(function(error) {
          console.log('❌ Service Worker 註冊失敗:', error);
        });
      }
    });
  } else {
    console.warn('⚠️ 此瀏覽器不支援 Service Worker');
  }

  // PWA 安裝提示處理
  let deferredPrompt;
  let installPromptShown = false;
  
  // 監聽 beforeinstallprompt 事件
  window.addEventListener('beforeinstallprompt', function(e) {
    console.log('💡 PWA 安裝提示可用');
    console.log('🖥️ 平台:', e.platforms);
    
    // 防止瀏覽器自動顯示安裝提示
    e.preventDefault();
    
    // 保存事件以便稍後觸發
    deferredPrompt = e;
    installPromptShown = false;
    
    // 觸發自定義事件，通知應用安裝提示可用
    window.dispatchEvent(new CustomEvent('pwaInstallAvailable', {
      detail: { 
        platforms: e.platforms,
        canInstall: true 
      }
    }));
    
    // 顯示自定義安裝按鈕（如果存在）
    const installButtons = document.querySelectorAll('.pwa-install-button, #pwa-install-button');
    installButtons.forEach(button => {
      if (button) {
        button.style.display = 'block';
        button.classList.add('pwa-available');
        
        // 移除舊的事件監聽器
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // 添加新的事件監聽器
        newButton.addEventListener('click', function(event) {
          event.preventDefault();
          triggerInstallPrompt();
        });
      }
    });
  });

  // 觸發安裝提示的函數
  function triggerInstallPrompt() {
    if (deferredPrompt && !installPromptShown) {
      console.log('🚀 觸發 PWA 安裝提示');
      installPromptShown = true;
      
      // 顯示安裝提示
      deferredPrompt.prompt();
      
      // 等待用戶回應
      deferredPrompt.userChoice.then(function(choiceResult) {
        console.log('👤 用戶選擇:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ 用戶接受了 PWA 安裝');
          
          // 觸發安裝接受事件
          window.dispatchEvent(new CustomEvent('pwaInstallAccepted'));
        } else {
          console.log('❌ 用戶拒絕了 PWA 安裝');
          
          // 觸發安裝拒絕事件
          window.dispatchEvent(new CustomEvent('pwaInstallDismissed'));
        }
        
        // 清理
        deferredPrompt = null;
        installPromptShown = false;
      }).catch(function(error) {
        console.error('💥 安裝提示錯誤:', error);
        deferredPrompt = null;
        installPromptShown = false;
      });
    } else {
      console.warn('⚠️ 沒有可用的安裝提示或已經顯示過');
      
      // 如果沒有原生安裝提示，顯示手動安裝指引
      showManualInstallInstructions();
    }
  }

  // 顯示手動安裝指引
  function showManualInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      instructions = '請點擊地址欄右側的安裝圖標，或在瀏覽器菜單中選擇「安裝應用程式」';
    } else if (userAgent.includes('firefox')) {
      instructions = '請在瀏覽器菜單中選擇「安裝」選項';
    } else if (userAgent.includes('safari')) {
      instructions = '請點擊分享按鈕，然後選擇「加入主畫面」';
    } else if (userAgent.includes('edg')) {
      instructions = '請點擊地址欄右側的安裝圖標，或在瀏覽器菜單中選擇「應用程式」→「將此網站安裝為應用程式」';
    } else {
      instructions = '請在瀏覽器菜單中尋找「安裝」或「加入主畫面」選項';
    }
    
    // 觸發手動安裝指引事件
    window.dispatchEvent(new CustomEvent('pwaManualInstallInstructions', {
      detail: { instructions }
    }));
    
    console.log('📖 手動安裝指引:', instructions);
  }

  // 檢測 PWA 是否已安裝
  window.addEventListener('appinstalled', function(e) {
    console.log('🎉 PWA 安裝成功');
    
    // 隱藏安裝按鈕
    const installButtons = document.querySelectorAll('.pwa-install-button, #pwa-install-button');
    installButtons.forEach(button => {
      if (button) {
        button.style.display = 'none';
        button.classList.remove('pwa-available');
      }
    });
    
    // 觸發安裝完成事件
    window.dispatchEvent(new CustomEvent('pwaInstallCompleted'));
    
    // 清理
    deferredPrompt = null;
    installPromptShown = false;
  });

  // 檢查是否在 PWA 模式下運行
  function isPWAMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  }

  // 如果在 PWA 模式下，添加相應的樣式類
  if (isPWAMode()) {
    document.documentElement.classList.add('pwa-mode');
    console.log('📱 運行在 PWA 模式');
  }

  // 監聽顯示模式變化
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('pwa-mode');
      console.log('📱 切換到 PWA 模式');
    } else {
      document.documentElement.classList.remove('pwa-mode');
      console.log('🌐 切換到瀏覽器模式');
    }
  });

  // 全局函數供其他腳本使用
  window.PWAUtils = {
    isPWAMode: isPWAMode,
    showInstallPrompt: triggerInstallPrompt,
    hasInstallPrompt: () => !!deferredPrompt,
    isInstallPromptShown: () => installPromptShown,
    showManualInstructions: showManualInstallInstructions
  };

  // 頁面載入完成後檢查 PWA 狀態
  window.addEventListener('load', function() {
    setTimeout(() => {
      console.log('🔍 PWA 狀態檢查:');
      console.log('  - PWA 模式:', isPWAMode());
      console.log('  - Service Worker 支援:', 'serviceWorker' in navigator);
      console.log('  - 安裝提示可用:', !!deferredPrompt);
      console.log('  - 用戶代理:', navigator.userAgent);
      
      // 如果 5 秒後仍沒有安裝提示，記錄診斷信息
      setTimeout(() => {
        if (!deferredPrompt && !isPWAMode()) {
          console.warn('⚠️ PWA 安裝提示未出現，可能的原因:');
          console.warn('  1. 應用已安裝');
          console.warn('  2. 不滿足 PWA 安裝條件');
          console.warn('  3. 瀏覽器不支援 PWA 安裝');
          console.warn('  4. HTTPS 要求未滿足');
          console.warn('  5. Manifest 文件有問題');
        }
      }, 5000);
    }, 1000);
  });
})(); 