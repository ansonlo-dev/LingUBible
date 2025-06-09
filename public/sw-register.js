  // PWA Service Worker 註冊腳本
(function() {
  'use strict';

  // 版本檢測和緩存清理
  const CURRENT_VERSION = '0.1.9'; // 從 package.json 同步
  const VERSION_KEY = 'app_version';
  
  // 檢查是否需要清理緩存
  function checkVersionAndClearCache() {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    if (storedVersion && storedVersion !== CURRENT_VERSION) {
      console.log(`🔄 檢測到版本更新: ${storedVersion} → ${CURRENT_VERSION}`);
      
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
          
          // 清理其他存儲
          try {
            // 清理 sessionStorage（保留重要數據）
            const importantKeys = ['user_session', 'auth_token', 'user_preferences'];
            const sessionData = {};
            importantKeys.forEach(key => {
              if (sessionStorage.getItem(key)) {
                sessionData[key] = sessionStorage.getItem(key);
              }
            });
            
            sessionStorage.clear();
            
            // 恢復重要數據
            Object.keys(sessionData).forEach(key => {
              sessionStorage.setItem(key, sessionData[key]);
            });
            
            console.log('🧹 已清理 sessionStorage（保留重要數據）');
          } catch (error) {
            console.warn('⚠️ 清理 sessionStorage 時發生錯誤:', error);
          }
          
          // 更新版本號
          localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
          
          // 強制刷新頁面（自動刷新，不需要用戶確認）
          console.log('🔄 自動刷新頁面以載入最新內容...');
          setTimeout(() => {
            window.location.reload(true);
          }, 1000); // 延遲 1 秒刷新，讓用戶看到提示
        }).catch(error => {
          console.error('❌ 清理緩存時發生錯誤:', error);
        });
      }
    } else if (!storedVersion) {
      // 首次訪問，記錄版本
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    }
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
              // console.warn('⚠️ 開發環境 Service Worker 檔案不存在或格式不正確，跳過註冊');
            }
          })
          .catch(() => {
            // 靜默處理開發環境 SW 文件不存在的情況
            // console.warn('⚠️ 開發環境 Service Worker 檔案不存在，跳過註冊');
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

  // 監聽用戶互動
  function trackUserInteraction() {
    userInteractionCount++;
    if (userInteractionCount >= 3) {
      hasUserEngagement = true;
      console.log('👤 用戶互動足夠，PWA 安裝條件可能已滿足');
    }
  }

  // 添加用戶互動監聽器
  ['click', 'scroll', 'keydown', 'touchstart'].forEach(eventType => {
    document.addEventListener(eventType, trackUserInteraction, { once: true, passive: true });
  });

  // 頁面載入完成後檢查 PWA 狀態
  window.addEventListener('load', function() {
    setTimeout(() => {
      console.log('🔍 PWA 狀態檢查:');
      console.log('  - PWA 模式:', isPWAMode());
      console.log('  - Service Worker 支援:', 'serviceWorker' in navigator);
      console.log('  - 安裝提示可用:', !!deferredPrompt);
      console.log('  - 用戶互動次數:', userInteractionCount);
      console.log('  - 用戶代理:', navigator.userAgent);
      
      // 如果 15 秒後仍沒有安裝提示，記錄診斷信息（僅在生產環境）
      setTimeout(() => {
        if (!deferredPrompt && !isPWAMode() && window.location.protocol === 'https:') {
          console.warn('⚠️ PWA 安裝提示未出現，可能的原因:');
          console.warn('  1. 應用已安裝');
          console.warn('  2. 需要更多用戶互動 (點擊、滾動等) - 當前:', userInteractionCount);
          console.warn('  3. 瀏覽器不支援 PWA 安裝');
          console.warn('  4. Manifest 文件有問題');
          console.warn('  5. 網站訪問頻率不足');
          
          // 提供更詳細的診斷信息
          console.log('🔍 PWA 診斷信息:');
          console.log('  - 當前 URL:', window.location.href);
          console.log('  - 協議:', window.location.protocol);
          console.log('  - 用戶代理:', navigator.userAgent);
          console.log('  - Service Worker 支援:', 'serviceWorker' in navigator);
          console.log('  - 顯示模式:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
          console.log('  - 用戶互動:', hasUserEngagement ? '充足' : '不足');
          
          // 檢查 manifest 連結
          const manifestLink = document.querySelector('link[rel="manifest"]');
          console.log('  - Manifest 連結:', manifestLink ? manifestLink.href : '未找到');
          
          // 檢查是否為支援的瀏覽器
          const isChrome = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
          const isEdge = navigator.userAgent.includes('Edg');
          console.log('  - 支援的瀏覽器:', isChrome ? 'Chrome' : isEdge ? 'Edge' : '可能不支援');
          
          // 提示用戶如何手動安裝
          if (isChrome || isEdge) {
            console.log('💡 手動安裝提示: 請嘗試在地址欄右側尋找安裝圖標，或在瀏覽器菜單中選擇「安裝應用程式」');
            console.log('💡 或者嘗試: 瀏覽器菜單 → 更多工具 → 建立捷徑/安裝應用程式');
          }
        }
      }, 15000);
    }, 1000);
  });
})(); 