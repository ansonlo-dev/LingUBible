// PWA Service Worker 註冊腳本
(function() {
  'use strict';

  // 版本檢測和緩存清理
  const CURRENT_VERSION = '0.1.17'; // 從 package.json 同步
  const VERSION_KEY = 'app_version';
  const CACHE_CLEARED_KEY = 'cache_cleared_for_version';
  
  // 檢查是否需要清理緩存
  function checkVersionAndClearCache() {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    const cacheCleared = localStorage.getItem(CACHE_CLEARED_KEY);
    
    console.log(`🔍 版本檢查: 當前=${CURRENT_VERSION}, 存儲=${storedVersion}, 緩存已清理=${cacheCleared}`);
    
    if (storedVersion && storedVersion !== CURRENT_VERSION) {
      console.log(`🔄 檢測到版本更新: ${storedVersion} → ${CURRENT_VERSION}`);
      
      // 檢查是否已經為此版本清理過緩存
      if (cacheCleared !== CURRENT_VERSION) {
        console.log('🧹 開始清理緩存...');
        clearCachesAndReload();
      } else {
        console.log('✅ 此版本的緩存已清理過，跳過');
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      }
    } else if (!storedVersion) {
      // 首次訪問，記錄版本
      console.log('🆕 首次訪問，記錄版本');
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      localStorage.setItem(CACHE_CLEARED_KEY, CURRENT_VERSION);
    } else {
      console.log('✅ 版本一致，無需清理緩存');
    }
  }
  
  // 清理緩存並重新載入
  function clearCachesAndReload() {
    // 清理所有緩存
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log(`🗑️ 清理緩存: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('✅ 所有緩存已清理');
        
        // 清理其他存儲（保留重要數據）
        try {
          // 保留重要的用戶數據
          const importantKeys = [
            'user_session', 'auth_token', 'user_preferences', 
            'language', 'theme', 'cookie_consent',
            'sidebar_state', 'swipe_hint_used'
          ];
          const sessionData = {};
          const localData = {};
          
          // 備份 sessionStorage 重要數據
          importantKeys.forEach(key => {
            const sessionValue = sessionStorage.getItem(key);
            const localValue = localStorage.getItem(key);
            if (sessionValue) sessionData[key] = sessionValue;
            if (localValue && key !== VERSION_KEY) localData[key] = localValue;
          });
          
          // 清理存儲
          sessionStorage.clear();
          
          // 只清理非重要的 localStorage 項目
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !importantKeys.includes(key) && key !== VERSION_KEY && key !== CACHE_CLEARED_KEY) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // 恢復重要數據
          Object.keys(sessionData).forEach(key => {
            sessionStorage.setItem(key, sessionData[key]);
          });
          Object.keys(localData).forEach(key => {
            localStorage.setItem(key, localData[key]);
          });
          
          console.log('🧹 已清理存儲（保留重要數據）');
        } catch (error) {
          console.warn('⚠️ 清理存儲時發生錯誤:', error);
        }
        
        // 更新版本號和清理標記
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        localStorage.setItem(CACHE_CLEARED_KEY, CURRENT_VERSION);
        
        // 顯示更新通知
        showUpdateNotification();
        
        // 延遲刷新頁面
        setTimeout(() => {
          console.log('🔄 重新載入頁面以應用更新...');
          window.location.reload(true);
        }, 2000);
      }).catch(error => {
        console.error('❌ 清理緩存時發生錯誤:', error);
        // 即使清理失敗，也要更新版本號避免無限循環
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        localStorage.setItem(CACHE_CLEARED_KEY, CURRENT_VERSION);
      });
    } else {
      // 瀏覽器不支援 Cache API，直接更新版本號
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      localStorage.setItem(CACHE_CLEARED_KEY, CURRENT_VERSION);
    }
  }
  
  // 顯示更新通知
  function showUpdateNotification() {
    // 創建一個簡單的通知
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, #4CAF50, #45a049);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="font-size: 18px;">🎉</div>
        <div>
          <div style="font-weight: bold; margin-bottom: 4px;">應用已更新！</div>
          <div style="opacity: 0.9; font-size: 12px;">正在載入最新版本...</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒後移除通知
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
  
  // 頁面載入時檢查版本
  checkVersionAndClearCache();

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
              // 靜默處理開發環境 SW 文件格式問題
              console.log('⚠️ 開發環境 Service Worker 檔案不存在或格式不正確，跳過註冊');
            }
          })
          .catch(() => {
            // 靜默處理開發環境 SW 文件不存在的情況
            console.log('⚠️ 開發環境 Service Worker 檔案不存在，跳過註冊');
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
            // 立即檢查更新
            registration.update();
            
            // 定期檢查更新
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
  let userInteractionCount = 0;
  let hasUserEngagement = false;
  let installPromptTimeout;
  
  // 用戶互動追蹤
  function trackUserInteraction() {
    userInteractionCount++;
    hasUserEngagement = true;
    
    // 移除事件監聽器，避免重複計算
    if (userInteractionCount === 1) {
      ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.removeEventListener(event, trackUserInteraction, { passive: true });
      });
      
      console.log('👤 用戶開始互動，PWA 安裝提示準備就緒');
      
      // 如果已經有 deferredPrompt，延遲顯示安裝按鈕
      if (deferredPrompt && !installPromptShown) {
        clearTimeout(installPromptTimeout);
        installPromptTimeout = setTimeout(() => {
          showInstallButtons();
        }, 2000); // 2秒後顯示
      }
    }
  }
  
  // 添加用戶互動監聽器
  ['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, trackUserInteraction, { passive: true });
  });
  
  // 顯示安裝按鈕
  function showInstallButtons() {
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
    
    // 觸發自定義事件，通知 React 組件
    window.dispatchEvent(new CustomEvent('pwaInstallAvailable', {
      detail: { 
        platforms: deferredPrompt?.platforms || ['web'],
        canInstall: true,
        hasUserEngagement: hasUserEngagement
      }
    }));
  }
  
  // 監聽 beforeinstallprompt 事件
  window.addEventListener('beforeinstallprompt', function(e) {
    console.log('💡 PWA 安裝提示可用');
    console.log('🖥️ 平台:', e.platforms);
    console.log('👤 用戶互動狀態:', hasUserEngagement);
    
    // 防止瀏覽器自動顯示安裝提示
    e.preventDefault();
    
    // 保存事件以便稍後觸發
    deferredPrompt = e;
    installPromptShown = false;
    
    // 如果用戶已經有互動，立即顯示安裝按鈕
    if (hasUserEngagement) {
      clearTimeout(installPromptTimeout);
      installPromptTimeout = setTimeout(() => {
        showInstallButtons();
      }, 1000); // 1秒後顯示
    } else {
      console.log('⏳ 等待用戶互動後顯示安裝按鈕');
    }
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
          
          // 隱藏所有安裝按鈕
          const installButtons = document.querySelectorAll('.pwa-install-button, #pwa-install-button');
          installButtons.forEach(button => {
            if (button) {
              button.style.display = 'none';
            }
          });
          
          // 觸發安裝成功事件
          window.dispatchEvent(new CustomEvent('pwaInstallAccepted'));
        } else {
          console.log('❌ 用戶拒絕了 PWA 安裝');
          
          // 觸發安裝拒絕事件
          window.dispatchEvent(new CustomEvent('pwaInstallDismissed'));
        }
        
        deferredPrompt = null;
      }).catch(function(error) {
        console.error('❌ 安裝提示出錯:', error);
        deferredPrompt = null;
        installPromptShown = false;
      });
    } else if (!deferredPrompt) {
      console.warn('⚠️ 沒有可用的安裝提示');
      showManualInstallInstructions();
    }
  }

  // 顯示手動安裝指引
  function showManualInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      instructions = '請點擊地址欄右側的安裝圖標，或使用瀏覽器選單中的「安裝 LingUBible」選項。';
    } else if (userAgent.includes('edg')) {
      instructions = '請點擊地址欄右側的安裝圖標，或使用瀏覽器選單中的「安裝此網站為應用程式」選項。';
    } else if (userAgent.includes('firefox')) {
      instructions = '請使用瀏覽器選單中的「安裝」選項，或將此頁面加入書籤以便快速訪問。';
    } else if (userAgent.includes('safari')) {
      instructions = '請點擊分享按鈕 📤，然後選擇「加入主畫面」。';
    } else {
      instructions = '請使用瀏覽器選單中的安裝選項，或將此頁面加入書籤。';
    }
    
    // 創建簡單的提示
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      color: #333;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 400px;
      text-align: center;
    `;
    notification.innerHTML = `
      <div style="margin-bottom: 16px; font-size: 24px;">📱</div>
      <div style="font-weight: bold; margin-bottom: 12px; font-size: 16px;">安裝 LingUBible</div>
      <div style="margin-bottom: 20px; line-height: 1.5;">${instructions}</div>
      <button onclick="this.parentNode.remove()" style="
        background: #4CAF50;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">知道了</button>
    `;
    
    document.body.appendChild(notification);
    
    // 10秒後自動移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 10000);
  }

  // 檢查是否在 PWA 模式下運行
  function isPWAMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  }

  // 監聽應用安裝事件
  window.addEventListener('appinstalled', function() {
    console.log('🎉 PWA 已成功安裝');
    
    // 隱藏所有安裝按鈕
    const installButtons = document.querySelectorAll('.pwa-install-button, #pwa-install-button');
    installButtons.forEach(button => {
      if (button) {
        button.style.display = 'none';
      }
    });
    
    // 觸發安裝完成事件
    window.dispatchEvent(new CustomEvent('pwaInstalled'));
    
    // 清理
    deferredPrompt = null;
    installPromptShown = false;
  });

  // 如果已經在 PWA 模式下，隱藏安裝按鈕
  if (isPWAMode()) {
    console.log('📱 已在 PWA 模式下運行');
    
    // 延遲隱藏按鈕，確保 DOM 已載入
    setTimeout(() => {
      const installButtons = document.querySelectorAll('.pwa-install-button, #pwa-install-button');
      installButtons.forEach(button => {
        if (button) {
          button.style.display = 'none';
        }
      });
    }, 1000);
  }

  // 暴露全局函數供測試使用
  window.PWAInstaller = {
    triggerInstallPrompt,
    hasPrompt: () => !!deferredPrompt,
    hasUserEngagement: () => hasUserEngagement,
    isPWAMode,
    showManualInstructions: showManualInstallInstructions,
    getVersion: () => CURRENT_VERSION
  };

})(); 