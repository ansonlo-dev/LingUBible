/**
 * 處理 Radix UI 下拉選單導致的滾動條佈局偏移
 * 當 Radix UI 組件（如 Select）打開時，會設置 body { overflow: hidden }
 * 這會導致滾動條消失，頁面內容向右偏移約2像素
 */

let isInitialized = false;
let observer: MutationObserver | null = null;
let scrollbarWidth = 0;

// 計算滾動條寬度
function getScrollbarWidth(): number {
  if (scrollbarWidth > 0) return scrollbarWidth;
  
  const div = document.createElement('div');
  div.style.width = '100px';
  div.style.height = '100px';
  div.style.overflow = 'scroll';
  div.style.position = 'absolute';
  div.style.top = '-9999px';
  div.style.visibility = 'hidden';
  
  document.body.appendChild(div);
  scrollbarWidth = div.offsetWidth - div.clientWidth;
  document.body.removeChild(div);
  
  return scrollbarWidth;
}

// 檢查是否應該應用補償（只在桌面設備上）
function shouldApplyCompensation(): boolean {
  // 只在桌面設備上應用補償（避免影響手機體驗）
  return window.innerWidth > 768;
}

// 應用或移除滾動條補償
function applyScrollbarCompensation(shouldCompensate: boolean) {
  if (!shouldApplyCompensation()) return;
  
  const body = document.body;
  
  if (shouldCompensate && scrollbarWidth > 0) {
    // 添加右側 padding 補償滾動條寬度
    body.style.paddingRight = `${scrollbarWidth}px`;
    body.setAttribute('data-scrollbar-compensated', 'true');
  } else {
    // 移除補償
    body.style.paddingRight = '';
    body.removeAttribute('data-scrollbar-compensated');
  }
}

// 檢查 body 是否被設置為 overflow: hidden
function checkBodyOverflow(): boolean {
  const body = document.body;
  const computedStyle = window.getComputedStyle(body);
  const hasOverflowHidden = 
    computedStyle.overflow === 'hidden' || 
    computedStyle.overflowY === 'hidden' ||
    body.style.overflow === 'hidden' ||
    body.style.overflowY === 'hidden';
  
  return hasOverflowHidden;
}

// 初始化滾動條補償系統
export function initializeScrollbarCompensation(): () => void {
  if (isInitialized) {
    return () => {}; // 已經初始化過，返回空的清理函數
  }
  
  // 計算滾動條寬度
  scrollbarWidth = getScrollbarWidth();
  
  if (scrollbarWidth === 0) {
    // 沒有滾動條，不需要補償
    return () => {};
  }
  
  // 監聽 body 樣式變化
  observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
        shouldCheck = true;
        break;
      }
    }
    
    if (shouldCheck) {
      const hasOverflowHidden = checkBodyOverflow();
      applyScrollbarCompensation(hasOverflowHidden);
    }
  });
  
  // 監聽 body 的屬性變化
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  // 同時監聽窗口大小變化，調整補償策略
  const handleResize = () => {
    const currentlyCompensated = document.body.hasAttribute('data-scrollbar-compensated');
    if (currentlyCompensated && !shouldApplyCompensation()) {
      // 如果當前已補償但不應該補償（比如調整到手機尺寸），移除補償
      applyScrollbarCompensation(false);
    } else if (!currentlyCompensated && shouldApplyCompensation()) {
      // 如果當前未補償但應該補償，檢查是否需要補償
      const hasOverflowHidden = checkBodyOverflow();
      if (hasOverflowHidden) {
        applyScrollbarCompensation(true);
      }
    }
  };
  
  window.addEventListener('resize', handleResize);
  
  isInitialized = true;
  
  // 返回清理函數
  return () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    window.removeEventListener('resize', handleResize);
    
    // 清理補償樣式
    applyScrollbarCompensation(false);
    
    isInitialized = false;
    scrollbarWidth = 0;
  };
}

// 手動觸發檢查（用於某些特殊情況）
export function checkScrollbarCompensation() {
  if (!isInitialized) return;
  
  const hasOverflowHidden = checkBodyOverflow();
  applyScrollbarCompensation(hasOverflowHidden);
} 