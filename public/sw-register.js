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
  let forceShowInstallButton = false;
  let userDismissedInstall = false; // 記錄用戶是否拒絕過安裝
  let dismissalTimestamp = null; // 記錄拒絕時間
  let installAttemptCount = 0; // 記錄安裝嘗試次數
  
  // 檢查用戶是否最近拒絕過安裝
  function checkUserDismissalStatus() {
    try {
      const dismissalData = localStorage.getItem('pwa_install_dismissed');
      if (dismissalData) {
        const data = JSON.parse(dismissalData);
        const now = Date.now();
        const dismissalAge = now - data.timestamp;
        
        // 如果用戶在 24 小時內拒絕過，不再顯示
        if (dismissalAge < 24 * 60 * 60 * 1000) {
          userDismissedInstall = true;
          dismissalTimestamp = data.timestamp;
          console.log('⏰ 用戶在 24 小時內拒絕過安裝，暫不顯示安裝提示');
          return true;
        } else {
          // 超過 24 小時，清除記錄
          localStorage.removeItem('pwa_install_dismissed');
          userDismissedInstall = false;
          dismissalTimestamp = null;
        }
      }
    } catch (error) {
      console.warn('檢查用戶拒絕狀態時出錯:', error);
    }
    return false;
  }
  
  // 記錄用戶拒絕安裝
  function recordUserDismissal() {
    try {
      const dismissalData = {
        timestamp: Date.now(),
        count: (JSON.parse(localStorage.getItem('pwa_install_dismissed') || '{}').count || 0) + 1
      };
      localStorage.setItem('pwa_install_dismissed', JSON.stringify(dismissalData));
      userDismissedInstall = true;
      dismissalTimestamp = dismissalData.timestamp;
      console.log('📝 已記錄用戶拒絕安裝，24 小時內不再顯示');
    } catch (error) {
      console.warn('記錄用戶拒絕狀態時出錯:', error);
    }
  }
  
  // 檢查是否為 Chrome Android
  function isChromeAndroid() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('chrome') && 
           userAgent.includes('android') && 
           !userAgent.includes('edg') && 
           !userAgent.includes('firefox');
  }
  
  // 檢查是否應該強制顯示安裝按鈕
  function shouldForceShowInstallButton() {
    // 如果用戶最近拒絕過，不顯示
    if (userDismissedInstall) {
      return false;
    }
    
    const isDesktop = window.innerWidth >= 768;
    const isMobile = window.innerWidth < 768;
    const isHTTPS = window.location.protocol === 'https:';
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
                     window.navigator.standalone === true ||
                     document.referrer.includes('android-app://');
    const isSupportedBrowser = navigator.userAgent.includes('Chrome') || 
                              navigator.userAgent.includes('Edge') ||
                              navigator.userAgent.includes('Firefox');
    
    // Chrome Android 特殊處理：更積極地顯示安裝提示
    if (isChromeAndroid() && isHTTPS && !isPWAMode) {
      return true;
    }
    
    // 桌面環境處理
    return isDesktop && isHTTPS && !isPWAMode && isSupportedBrowser;
  }
  
  // 用戶互動追蹤（Chrome Android 優化）
  function trackUserInteraction() {
    userInteractionCount++;
    hasUserEngagement = true;
    
    // 移除事件監聽器，避免重複計算
    if (userInteractionCount === 1) {
      ['click', 'keydown', 'scroll', 'touchstart', 'touchend'].forEach(event => {
        document.removeEventListener(event, trackUserInteraction, { passive: true });
      });
      
      console.log('👤 用戶開始互動，PWA 安裝提示準備就緒');
      
      // 檢查用戶拒絕狀態
      if (checkUserDismissalStatus()) {
        console.log('⏸️ 用戶最近拒絕過安裝，跳過安裝提示');
        return;
      }
      
      // Chrome Android 特殊處理：更快顯示安裝提示
      if (isChromeAndroid()) {
        console.log('📱 Chrome Android 檢測到，快速顯示安裝提示');
        forceShowInstallButton = true;
        
        clearTimeout(installPromptTimeout);
        installPromptTimeout = setTimeout(() => {
          showInstallButtons();
          // 嘗試觸發原生安裝橫幅
          if (deferredPrompt && !installPromptShown) {
            triggerInstallBanner();
          }
        }, 500); // Chrome Android 0.5秒後顯示
      } else if (shouldForceShowInstallButton()) {
        console.log('🖥️ 桌面環境檢測到，強制顯示安裝按鈕');
        forceShowInstallButton = true;
        
        clearTimeout(installPromptTimeout);
        installPromptTimeout = setTimeout(() => {
          showInstallButtons();
        }, 1000); // 桌面 1秒後顯示
      } else if (deferredPrompt && !installPromptShown) {
        clearTimeout(installPromptTimeout);
        installPromptTimeout = setTimeout(() => {
          showInstallButtons();
        }, 2000); // 其他情況 2秒後顯示
      }
    }
  }
  
  // 添加用戶互動監聽器（包含觸摸事件）
  ['click', 'keydown', 'scroll', 'touchstart', 'touchend'].forEach(event => {
    document.addEventListener(event, trackUserInteraction, { passive: true });
  });
  
  // Chrome Android 安裝橫幅觸發
  function triggerInstallBanner() {
    if (isChromeAndroid() && deferredPrompt && !installPromptShown && !userDismissedInstall) {
      console.log('📱 Chrome Android: 嘗試觸發安裝橫幅');
      
      // 延遲一點時間，確保用戶看到頁面內容
      setTimeout(() => {
        if (deferredPrompt && !installPromptShown && !userDismissedInstall) {
          console.log('📱 Chrome Android: 顯示安裝橫幅');
          installPromptShown = true;
          installAttemptCount++;
          
          // 創建 deferredPrompt 的副本，避免被清空
          const promptToShow = deferredPrompt;
          
          promptToShow.prompt();
          
          promptToShow.userChoice.then(function(choiceResult) {
            console.log('👤 Chrome Android 用戶選擇:', choiceResult.outcome);
            
            if (choiceResult.outcome === 'accepted') {
              console.log('✅ Chrome Android: 用戶接受了 PWA 安裝');
              window.dispatchEvent(new CustomEvent('pwaInstallAccepted'));
              
              // 清除拒絕記錄
              try {
                localStorage.removeItem('pwa_install_dismissed');
              } catch (error) {
                console.warn('清除拒絕記錄時出錯:', error);
              }
            } else {
              console.log('❌ Chrome Android: 用戶拒絕了 PWA 安裝');
              recordUserDismissal();
              window.dispatchEvent(new CustomEvent('pwaInstallDismissed'));
            }
            
            // 重置狀態，但不清空 deferredPrompt（讓瀏覽器管理）
            installPromptShown = false;
          }).catch(function(error) {
            console.error('❌ Chrome Android 安裝橫幅出錯:', error);
            installPromptShown = false;
          });
        }
      }, 1500); // Chrome Android 1.5秒後顯示橫幅
    }
  }
  
  // 顯示安裝按鈕
  function showInstallButtons() {
    // 如果用戶拒絕過，不顯示按鈕
    if (userDismissedInstall) {
      console.log('⏸️ 用戶拒絕過安裝，不顯示安裝按鈕');
      return;
    }
    
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
        hasUserEngagement: hasUserEngagement,
        forceShow: forceShowInstallButton,
        isChromeAndroid: isChromeAndroid(),
        userDismissed: userDismissedInstall
      }
    }));
  }
  
  // 監聽 beforeinstallprompt 事件（Chrome Android 優化）
  window.addEventListener('beforeinstallprompt', function(e) {
    console.log('💡 PWA 安裝提示可用');
    console.log('🖥️ 平台:', e.platforms);
    console.log('👤 用戶互動狀態:', hasUserEngagement);
    console.log('📱 Chrome Android:', isChromeAndroid());
    
    // 檢查用戶拒絕狀態
    if (checkUserDismissalStatus()) {
      console.log('⏸️ 用戶最近拒絕過安裝，不處理 beforeinstallprompt 事件');
      return;
    }
    
    // 防止瀏覽器自動顯示安裝提示
    e.preventDefault();
    
    // 保存事件以便稍後觸發
    deferredPrompt = e;
    installPromptShown = false;
    
    // Chrome Android 特殊處理
    if (isChromeAndroid()) {
      console.log('📱 Chrome Android: 準備顯示安裝橫幅');
      
      if (hasUserEngagement) {
        // 如果用戶已經有互動，快速顯示
        clearTimeout(installPromptTimeout);
        installPromptTimeout = setTimeout(() => {
          showInstallButtons();
          triggerInstallBanner();
        }, 300); // 0.3秒後顯示
      } else {
        // 等待用戶互動
        console.log('⏳ Chrome Android: 等待用戶互動後顯示安裝橫幅');
      }
    } else if (hasUserEngagement) {
      // 其他平台的處理
      clearTimeout(installPromptTimeout);
      installPromptTimeout = setTimeout(() => {
        showInstallButtons();
      }, 500); // 0.5秒後顯示
    } else {
      console.log('⏳ 等待用戶互動後顯示安裝按鈕');
    }
  });

  // 觸發安裝提示的函數
  function triggerInstallPrompt() {
    // 檢查用戶拒絕狀態
    if (userDismissedInstall) {
      console.log('⏸️ 用戶拒絕過安裝，顯示手動安裝指引');
      showManualInstallInstructions();
      return;
    }
    
    if (deferredPrompt && !installPromptShown) {
      console.log('🚀 觸發 PWA 安裝提示');
      installPromptShown = true;
      installAttemptCount++;
      
      // 創建 deferredPrompt 的副本，避免被清空
      const promptToShow = deferredPrompt;
      
      // 顯示安裝提示
      promptToShow.prompt();
      
      // 等待用戶回應
      promptToShow.userChoice.then(function(choiceResult) {
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
          
          // 清除拒絕記錄
          try {
            localStorage.removeItem('pwa_install_dismissed');
          } catch (error) {
            console.warn('清除拒絕記錄時出錯:', error);
          }
          
          // 觸發安裝成功事件
          window.dispatchEvent(new CustomEvent('pwaInstallAccepted'));
        } else {
          console.log('❌ 用戶拒絕了 PWA 安裝');
          recordUserDismissal();
          
          // 隱藏安裝按鈕
          const installButtons = document.querySelectorAll('.pwa-install-button, #pwa-install-button');
          installButtons.forEach(button => {
            if (button) {
              button.style.display = 'none';
            }
          });
          
          // 觸發安裝拒絕事件
          window.dispatchEvent(new CustomEvent('pwaInstallDismissed'));
        }
        
        // 重置狀態，但不清空 deferredPrompt
        installPromptShown = false;
      }).catch(function(error) {
        console.error('❌ 安裝提示出錯:', error);
        installPromptShown = false;
      });
    } else if (!deferredPrompt) {
      console.warn('⚠️ 沒有可用的安裝提示');
      showManualInstallInstructions();
    } else if (installPromptShown) {
      console.warn('⚠️ 安裝提示已經顯示過，請等待用戶回應');
    }
  }

  // 顯示手動安裝指引（針對 Chrome Android 優化）
  function showManualInstallInstructions() {
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    let title = '安裝 LingUBible 應用';
    
    // 如果用戶拒絕過，調整標題和說明
    if (userDismissedInstall) {
      title = '手動安裝 LingUBible';
      instructions = `
        <div style="text-align: left; line-height: 1.6; margin-bottom: 15px;">
          <p style="color: #666; font-size: 13px;">您之前選擇了不安裝，但仍可以手動安裝：</p>
        </div>
      `;
    }
    
    if (isChromeAndroid()) {
      instructions += `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>Chrome Android 安裝方法：</strong></p>
          <p>• 點擊瀏覽器右上角的三點選單 ⋮</p>
          <p>• 選擇「安裝應用程式」或「加到主畫面」</p>
          <p>• 確認安裝即可在桌面找到 LingUBible 圖標</p>
          <br>
          <p><strong>或者：</strong></p>
          <p>• 查看地址欄是否有安裝圖標 📱</p>
          <p>• 點擊該圖標即可快速安裝</p>
        </div>
      `;
    } else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      instructions += `
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
      instructions += `
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
      instructions += `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>Firefox 安裝方法：</strong></p>
          <p>• 點擊瀏覽器右上角的選單 ☰</p>
          <p>• 選擇「安裝」或「加入主畫面」</p>
          <p>• 或者將此頁面加入書籤以便快速訪問</p>
        </div>
      `;
    } else if (userAgent.includes('safari')) {
      instructions += `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>Safari 安裝方法：</strong></p>
          <p>• 點擊分享按鈕 📤</p>
          <p>• 選擇「加入主畫面」</p>
          <p>• 確認安裝即可</p>
        </div>
      `;
    } else {
      instructions += `
        <div style="text-align: left; line-height: 1.6;">
          <p><strong>通用安裝方法：</strong></p>
          <p>• 查看地址欄是否有安裝圖標</p>
          <p>• 或在瀏覽器選單中尋找「安裝」選項</p>
          <p>• 也可以將此頁面加入書籤</p>
        </div>
      `;
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
    
    const buttons = userDismissedInstall ? `
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button onclick="this.parentNode.parentNode.parentNode.remove()" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        ">知道了</button>
        <button onclick="window.PWAInstaller?.resetDismissal?.(); this.parentNode.parentNode.parentNode.remove();" style="
          background: #2196F3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        ">重新啟用提示</button>
      </div>
    ` : `
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
    
    notification.innerHTML = `
      <div style="margin-bottom: 16px; font-size: 24px;">📱</div>
      <div style="font-weight: bold; margin-bottom: 12px; font-size: 16px;">${title}</div>
      <div style="margin-bottom: 20px; line-height: 1.5;">${instructions}</div>
      ${buttons}
    `;
    
    document.body.appendChild(notification);
    
    // 15秒後自動移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 15000);
  }

  // 重置用戶拒絕狀態的函數
  function resetUserDismissal() {
    try {
      localStorage.removeItem('pwa_install_dismissed');
      userDismissedInstall = false;
      dismissalTimestamp = null;
      console.log('🔄 已重置用戶拒絕狀態，重新啟用安裝提示');
      
      // 重新檢查是否應該顯示安裝按鈕
      if (hasUserEngagement && shouldForceShowInstallButton()) {
        setTimeout(() => {
          showInstallButtons();
        }, 1000);
      }
    } catch (error) {
      console.warn('重置用戶拒絕狀態時出錯:', error);
    }
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
    
    // 清除拒絕記錄
    try {
      localStorage.removeItem('pwa_install_dismissed');
    } catch (error) {
      console.warn('清除拒絕記錄時出錯:', error);
    }
    
    // 觸發安裝完成事件
    window.dispatchEvent(new CustomEvent('pwaInstalled'));
    
    // 清理
    deferredPrompt = null;
    installPromptShown = false;
    forceShowInstallButton = false;
    userDismissedInstall = false;
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
  } else {
    // 初始化時檢查用戶拒絕狀態
    checkUserDismissalStatus();
    
    // 不在 PWA 模式下，檢查是否應該強制顯示安裝按鈕
    setTimeout(() => {
      if (shouldForceShowInstallButton()) {
        if (isChromeAndroid()) {
          console.log('📱 Chrome Android 環境檢測到，準備強制顯示安裝按鈕');
        } else {
          console.log('🖥️ 桌面環境檢測到，準備強制顯示安裝按鈕');
        }
        forceShowInstallButton = true;
        
        // 如果用戶已經有互動，立即顯示
        if (hasUserEngagement) {
          showInstallButtons();
          
          // Chrome Android 特殊處理：嘗試觸發橫幅
          if (isChromeAndroid() && deferredPrompt && !userDismissedInstall) {
            triggerInstallBanner();
          }
        }
      }
    }, 1000); // 1秒後檢查
  }

  // 暴露全局函數供測試使用
  window.PWAInstaller = {
    triggerInstallPrompt,
    triggerInstallBanner,
    hasPrompt: () => !!deferredPrompt || forceShowInstallButton,
    hasUserEngagement: () => hasUserEngagement,
    isPWAMode,
    isChromeAndroid,
    showManualInstructions: showManualInstallInstructions,
    resetDismissal: resetUserDismissal,
    getVersion: () => CURRENT_VERSION,
    forceShow: () => forceShowInstallButton,
    getDismissalStatus: () => ({
      dismissed: userDismissedInstall,
      timestamp: dismissalTimestamp,
      attemptCount: installAttemptCount
    })
  };

})(); 