// 只隱藏右下角的 reCAPTCHA 圖標，保留表單中的 reCAPTCHA 功能
(function() {
    'use strict';
    
    console.log('🎯 reCAPTCHA 圖標隱藏腳本已載入（保留表單功能）');
    
    // 只針對右下角 badge 的選擇器
    const BADGE_SELECTORS = [
        '.grecaptcha-badge',
        'div.grecaptcha-badge',
        '#grecaptcha-badge'
    ];
    
    // 檢查元素是否在表單內
    function isInForm(element) {
        if (!element) return false;
        
        // 向上查找是否在表單內
        let parent = element.parentElement;
        while (parent) {
            if (parent.tagName === 'FORM' || 
                parent.classList.contains('auth-form') ||
                parent.classList.contains('signup-form') ||
                parent.classList.contains('login-form') ||
                parent.classList.contains('forgot-password-form') ||
                parent.classList.contains('g-recaptcha') ||
                parent.hasAttribute('data-sitekey')) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
    }
    
    // 檢查元素是否是右下角的固定定位元素
    function isBottomRightFixed(element) {
        if (!element) return false;
        
        try {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            
            // 檢查是否是固定定位
            if (style.position !== 'fixed') return false;
            
            // 檢查是否在右下角
            const isBottomRight = rect.bottom > window.innerHeight - 100 && 
                                rect.right > window.innerWidth - 100;
            
            // 檢查是否是小尺寸元素（reCAPTCHA badge 的典型尺寸）
            const isSmallElement = rect.width <= 300 && rect.height <= 100;
            
            return isBottomRight && isSmallElement;
        } catch (e) {
            return false;
        }
    }
    
    // 隱藏右下角 badge 元素
    function hideBadgeElement(element) {
        if (!element) return false;
        
        // 確保不是表單內的元素
        if (isInForm(element)) {
            console.log('🔒 保留表單內的 reCAPTCHA 元素:', element);
            return false;
        }
        
        try {
            // 只隱藏右下角的固定定位元素
            if (element.classList.contains('grecaptcha-badge') || isBottomRightFixed(element)) {
                element.style.setProperty('display', 'none', 'important');
                element.style.setProperty('visibility', 'hidden', 'important');
                element.style.setProperty('opacity', '0', 'important');
                element.style.setProperty('pointer-events', 'none', 'important');
                
                // 添加標記類
                element.classList.add('recaptcha-badge-hidden');
                element.setAttribute('aria-hidden', 'true');
                
                console.log('🎯 已隱藏右下角 reCAPTCHA 圖標:', element);
                return true;
            }
        } catch (e) {
            console.warn('隱藏元素時發生錯誤:', e);
        }
        
        return false;
    }
    
    // 尋找並隱藏右下角的 reCAPTCHA badge
    function hideBadgeElements() {
        let hiddenCount = 0;
        
        // 使用 badge 選擇器尋找元素
        BADGE_SELECTORS.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (!element.classList.contains('recaptcha-badge-hidden')) {
                        if (hideBadgeElement(element)) {
                            hiddenCount++;
                        }
                    }
                });
            } catch (e) {
                console.warn('選擇器錯誤:', selector, e);
            }
        });
        
        if (hiddenCount > 0) {
            console.log(`🎯 已隱藏 ${hiddenCount} 個右下角 reCAPTCHA 圖標`);
        }
        
        return hiddenCount;
    }
    
    // 確保表單中的 reCAPTCHA 保持可見
    function ensureFormRecaptchaVisible() {
        const formRecaptchaSelectors = [
            'form .g-recaptcha',
            'form [data-sitekey]',
            'form iframe[src*="recaptcha"]',
            '.auth-form .g-recaptcha',
            '.signup-form .g-recaptcha',
            '.login-form .g-recaptcha',
            '.forgot-password-form .g-recaptcha'
        ];
        
        formRecaptchaSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // 確保表單中的 reCAPTCHA 可見
                    element.style.setProperty('display', 'block', 'important');
                    element.style.setProperty('visibility', 'visible', 'important');
                    element.style.setProperty('opacity', '1', 'important');
                    element.style.setProperty('pointer-events', 'auto', 'important');
                    
                    // 移除可能的隱藏標記
                    element.classList.remove('recaptcha-badge-hidden');
                    element.removeAttribute('aria-hidden');
                });
            } catch (e) {
                console.warn('確保表單 reCAPTCHA 可見時發生錯誤:', e);
            }
        });
    }
    
    // 監控 DOM 變化
    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 檢查是否添加了 reCAPTCHA badge
                            const isBadgeElement = BADGE_SELECTORS.some(selector => {
                                try {
                                    return node.matches && node.matches(selector);
                                } catch (e) {
                                    return false;
                                }
                            });
                            
                            if (isBadgeElement || 
                                (node.classList && node.classList.toString().toLowerCase().includes('grecaptcha'))) {
                                shouldCheck = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldCheck) {
                console.log('🔄 檢測到 reCAPTCHA DOM 變化，執行圖標隱藏');
                setTimeout(() => {
                    hideBadgeElements();
                    ensureFormRecaptchaVisible();
                }, 50);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'id', 'style']
        });
        
        return observer;
    }
    
    // 定期檢查（備用方案）
    function setupPeriodicCheck() {
        setInterval(() => {
            hideBadgeElements();
            ensureFormRecaptchaVisible();
        }, 2000); // 每2秒檢查一次
    }
    
    // 監聽窗口大小變化
    function setupResizeListener() {
        window.addEventListener('resize', () => {
            setTimeout(() => {
                hideBadgeElements();
                ensureFormRecaptchaVisible();
            }, 100);
        });
    }
    
    // 初始化
    function init() {
        console.log('🚀 初始化 reCAPTCHA 圖標隱藏（保留表單功能）');
        
        // 立即隱藏現有的 badge 元素
        hideBadgeElements();
        ensureFormRecaptchaVisible();
        
        // 延遲隱藏（等待可能的動態載入）
        setTimeout(() => {
            hideBadgeElements();
            ensureFormRecaptchaVisible();
        }, 1000);
        
        setTimeout(() => {
            hideBadgeElements();
            ensureFormRecaptchaVisible();
        }, 3000);
        
        // 設置監聽器
        setupMutationObserver();
        setupPeriodicCheck();
        setupResizeListener();
        
        console.log('✅ reCAPTCHA 圖標隱藏初始化完成（表單功能已保留）');
    }
    
    // 當 DOM 準備好時初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 全局函數供調試使用
    window.hideBadgeOnly = hideBadgeElements;
    window.ensureFormRecaptcha = ensureFormRecaptchaVisible;
    window.showBadgeStatus = function() {
        const hidden = document.querySelectorAll('.recaptcha-badge-hidden');
        const formRecaptcha = document.querySelectorAll('form .g-recaptcha, form [data-sitekey]');
        console.log(`已隱藏 ${hidden.length} 個 reCAPTCHA 圖標`);
        console.log(`保留 ${formRecaptcha.length} 個表單 reCAPTCHA`);
        return { hidden, formRecaptcha };
    };
    
})(); 