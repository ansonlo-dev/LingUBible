// 完全隱藏 reCAPTCHA 圖標和彈窗的 JavaScript 腳本
(function() {
    'use strict';
    
    console.log('🚫 reCAPTCHA 隱藏腳本已載入');
    
    // 所有可能的 reCAPTCHA 選擇器
    const RECAPTCHA_SELECTORS = [
        '.grecaptcha-badge',
        'div.grecaptcha-badge',
        '#grecaptcha-badge',
        '[class*="grecaptcha"]',
        '[id*="grecaptcha"]',
        'iframe[src*="recaptcha"]',
        'iframe[src*="google.com/recaptcha"]',
        'iframe[title*="recaptcha"]',
        'iframe[name*="recaptcha"]',
        'div[data-sitekey]',
        'div[data-callback]',
        '.g-recaptcha',
        '.recaptcha-container',
        '.captcha-widget',
        '.google-recaptcha',
        '*[class*="recaptcha" i]',
        '*[id*="recaptcha" i]'
    ];
    
    // 隱藏元素的函數
    function hideElement(element) {
        if (!element) return;
        
        try {
            // 使用多種方法確保元素完全隱藏
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('pointer-events', 'none', 'important');
            element.style.setProperty('position', 'absolute', 'important');
            element.style.setProperty('left', '-9999px', 'important');
            element.style.setProperty('top', '-9999px', 'important');
            element.style.setProperty('width', '0', 'important');
            element.style.setProperty('height', '0', 'important');
            element.style.setProperty('overflow', 'hidden', 'important');
            element.style.setProperty('z-index', '-1', 'important');
            
            // 添加隱藏類
            element.classList.add('recaptcha-hidden');
            
            // 設置屬性
            element.setAttribute('aria-hidden', 'true');
            element.setAttribute('hidden', 'true');
            
            console.log('🚫 已隱藏 reCAPTCHA 元素:', element);
        } catch (e) {
            console.warn('隱藏元素時發生錯誤:', e);
        }
    }
    
    // 尋找並隱藏所有 reCAPTCHA 元素
    function hideAllRecaptchaElements() {
        let hiddenCount = 0;
        
        // 使用選擇器尋找元素
        RECAPTCHA_SELECTORS.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (!element.classList.contains('recaptcha-hidden')) {
                        hideElement(element);
                        hiddenCount++;
                    }
                });
            } catch (e) {
                console.warn('選擇器錯誤:', selector, e);
            }
        });
        
        // 額外檢查：尋找可能的 reCAPTCHA 元素（通過位置和尺寸）
        const allFixedElements = document.querySelectorAll('*');
        allFixedElements.forEach(element => {
            try {
                const style = window.getComputedStyle(element);
                if (style.position === 'fixed') {
                    const rect = element.getBoundingClientRect();
                    
                    // 檢查是否在右下角
                    const isBottomRight = rect.bottom > window.innerHeight - 100 && 
                                        rect.right > window.innerWidth - 100;
                    
                    // 檢查是否是小尺寸元素（可能是 reCAPTCHA）
                    const isSmallElement = rect.width <= 300 && rect.height <= 100;
                    
                    // 檢查是否包含 reCAPTCHA 相關文字
                    const hasRecaptchaText = element.textContent && 
                                           element.textContent.toLowerCase().includes('recaptcha');
                    
                    if ((isBottomRight && isSmallElement) || hasRecaptchaText) {
                        if (!element.classList.contains('recaptcha-hidden') && 
                            !element.classList.contains('keep-visible')) {
                            hideElement(element);
                            hiddenCount++;
                        }
                    }
                }
            } catch (e) {
                // 忽略錯誤，繼續處理其他元素
            }
        });
        
        if (hiddenCount > 0) {
            console.log(`🚫 已隱藏 ${hiddenCount} 個 reCAPTCHA 相關元素`);
        }
        
        return hiddenCount;
    }
    
    // 監控 DOM 變化
    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 檢查是否添加了 reCAPTCHA 相關元素
                            const isRecaptchaElement = RECAPTCHA_SELECTORS.some(selector => {
                                try {
                                    return node.matches && node.matches(selector);
                                } catch (e) {
                                    return false;
                                }
                            });
                            
                            if (isRecaptchaElement || 
                                (node.classList && node.classList.toString().toLowerCase().includes('recaptcha')) ||
                                (node.id && node.id.toLowerCase().includes('recaptcha')) ||
                                (node.querySelector && node.querySelector('.grecaptcha-badge'))) {
                                shouldCheck = true;
                            }
                        }
                    });
                }
                
                // 檢查屬性變化
                if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    if (target.nodeType === Node.ELEMENT_NODE) {
                        const hasRecaptchaClass = target.className && 
                                                target.className.toLowerCase().includes('recaptcha');
                        const hasRecaptchaId = target.id && 
                                             target.id.toLowerCase().includes('recaptcha');
                        
                        if (hasRecaptchaClass || hasRecaptchaId) {
                            shouldCheck = true;
                        }
                    }
                }
            });
            
            if (shouldCheck) {
                console.log('🔄 檢測到 reCAPTCHA DOM 變化，執行隱藏');
                setTimeout(hideAllRecaptchaElements, 50);
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
            hideAllRecaptchaElements();
        }, 1000); // 每秒檢查一次
    }
    
    // 監聽窗口大小變化
    function setupResizeListener() {
        window.addEventListener('resize', () => {
            setTimeout(hideAllRecaptchaElements, 100);
        });
    }
    
    // 攔截 reCAPTCHA 腳本載入
    function interceptRecaptchaScripts() {
        // 攔截可能的 reCAPTCHA 腳本
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            
            if (tagName.toLowerCase() === 'script') {
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                    if (name === 'src' && value && value.includes('recaptcha')) {
                        console.log('🚫 攔截 reCAPTCHA 腳本載入:', value);
                        return; // 不設置 src，阻止載入
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            
            return element;
        };
    }
    
    // 覆蓋 reCAPTCHA 全局變數
    function overrideRecaptchaGlobals() {
        // 覆蓋可能的 reCAPTCHA 全局函數
        window.grecaptcha = {
            ready: function(callback) {
                console.log('🚫 reCAPTCHA ready 被攔截');
                // 不執行回調，阻止 reCAPTCHA 初始化
            },
            render: function() {
                console.log('🚫 reCAPTCHA render 被攔截');
                return null;
            },
            execute: function() {
                console.log('🚫 reCAPTCHA execute 被攔截');
                return Promise.resolve('fake-token');
            }
        };
        
        // 阻止 reCAPTCHA 回調
        window.onRecaptchaLoad = function() {
            console.log('🚫 reCAPTCHA 載入回調被攔截');
        };
    }
    
    // 初始化
    function init() {
        console.log('🚀 初始化 reCAPTCHA 完全隱藏');
        
        // 覆蓋全局變數
        overrideRecaptchaGlobals();
        
        // 攔截腳本載入
        interceptRecaptchaScripts();
        
        // 立即隱藏現有元素
        hideAllRecaptchaElements();
        
        // 延遲隱藏（等待可能的動態載入）
        setTimeout(hideAllRecaptchaElements, 500);
        setTimeout(hideAllRecaptchaElements, 1000);
        setTimeout(hideAllRecaptchaElements, 2000);
        
        // 設置監聽器
        setupMutationObserver();
        setupPeriodicCheck();
        setupResizeListener();
        
        console.log('✅ reCAPTCHA 完全隱藏初始化完成');
    }
    
    // 當 DOM 準備好時初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 全局函數供調試使用
    window.hideAllRecaptcha = hideAllRecaptchaElements;
    window.showRecaptchaStatus = function() {
        const hidden = document.querySelectorAll('.recaptcha-hidden');
        console.log(`當前已隱藏 ${hidden.length} 個 reCAPTCHA 元素`);
        return hidden;
    };
    
})(); 