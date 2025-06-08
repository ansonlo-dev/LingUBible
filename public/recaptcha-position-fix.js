// reCAPTCHA 位置修復腳本
(function() {
    'use strict';
    
    console.log('🔧 reCAPTCHA 位置修復腳本已載入');
    
    // 配置選項
    const CONFIG = {
        desktop: {
            bottom: '80px',
            right: '14px'
        },
        mobile: {
            bottom: '100px',
            right: '10px'
        },
        tablet: {
            bottom: '90px',
            right: '14px'
        }
    };
    
    // 檢測設備類型
    function getDeviceType() {
        const width = window.innerWidth;
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
    }
    
    // 尋找 reCAPTCHA 元素的多種方法
    function findRecaptchaElements() {
        const selectors = [
            '.grecaptcha-badge',
            'div[style*="position: fixed"][style*="bottom"][style*="right"]',
            'iframe[src*="recaptcha"]',
            'div[data-sitekey]',
            '[class*="recaptcha"]',
            '[id*="recaptcha"]'
        ];
        
        const elements = [];
        
        selectors.forEach(selector => {
            try {
                const found = document.querySelectorAll(selector);
                found.forEach(el => {
                    // 檢查是否是 reCAPTCHA 相關元素
                    const style = window.getComputedStyle(el);
                    const isFixed = style.position === 'fixed';
                    const hasBottom = style.bottom && style.bottom !== 'auto';
                    const hasRight = style.right && style.right !== 'auto';
                    
                    if (isFixed && (hasBottom || hasRight) && !elements.includes(el)) {
                        elements.push(el);
                    }
                });
            } catch (e) {
                console.warn('選擇器錯誤:', selector, e);
            }
        });
        
        // 額外檢查：尋找可能的 reCAPTCHA 容器
        const allFixedElements = document.querySelectorAll('*');
        allFixedElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed') {
                const rect = el.getBoundingClientRect();
                const isBottomRight = rect.bottom > window.innerHeight - 100 && 
                                    rect.right > window.innerWidth - 100;
                
                if (isBottomRight && rect.width > 50 && rect.height > 40 && 
                    !elements.includes(el)) {
                    // 可能是 reCAPTCHA 元素
                    elements.push(el);
                }
            }
        });
        
        return elements;
    }
    
    // 調整 reCAPTCHA 位置
    function adjustRecaptchaPosition() {
        const deviceType = getDeviceType();
        const config = CONFIG[deviceType];
        const elements = findRecaptchaElements();
        
        if (elements.length === 0) {
            console.log('🔍 未找到 reCAPTCHA 元素');
            return false;
        }
        
        console.log(`📱 設備類型: ${deviceType}, 找到 ${elements.length} 個 reCAPTCHA 元素`);
        
        elements.forEach((element, index) => {
            try {
                // 添加標識類
                element.classList.add('recaptcha-adjusted');
                
                // 強制設置樣式
                element.style.setProperty('bottom', config.bottom, 'important');
                element.style.setProperty('right', config.right, 'important');
                element.style.setProperty('z-index', '30', 'important');
                element.style.setProperty('transition', 'bottom 0.3s ease', 'important');
                
                console.log(`✅ 已調整 reCAPTCHA 元素 ${index + 1}:`, {
                    bottom: config.bottom,
                    right: config.right,
                    element: element
                });
            } catch (e) {
                console.error('調整 reCAPTCHA 位置時發生錯誤:', e);
            }
        });
        
        return elements.length > 0;
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
                            if (node.classList && (
                                node.classList.contains('grecaptcha-badge') ||
                                node.querySelector && node.querySelector('.grecaptcha-badge')
                            )) {
                                shouldCheck = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldCheck) {
                console.log('🔄 檢測到 reCAPTCHA DOM 變化，重新調整位置');
                setTimeout(adjustRecaptchaPosition, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return observer;
    }
    
    // 監聽窗口大小變化
    function setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('📏 窗口大小變化，重新調整 reCAPTCHA 位置');
                adjustRecaptchaPosition();
            }, 250);
        });
    }
    
    // 定期檢查（備用方案）
    function setupPeriodicCheck() {
        setInterval(() => {
            const elements = findRecaptchaElements();
            if (elements.length > 0) {
                // 檢查是否需要重新調整
                const needsAdjustment = elements.some(el => {
                    const style = window.getComputedStyle(el);
                    return style.bottom === '14px' || style.bottom === '0px';
                });
                
                if (needsAdjustment) {
                    console.log('🔄 定期檢查發現需要調整 reCAPTCHA 位置');
                    adjustRecaptchaPosition();
                }
            }
        }, 2000);
    }
    
    // 初始化
    function init() {
        console.log('🚀 初始化 reCAPTCHA 位置修復');
        
        // 立即嘗試調整
        adjustRecaptchaPosition();
        
        // 延遲調整（等待 reCAPTCHA 載入）
        setTimeout(adjustRecaptchaPosition, 1000);
        setTimeout(adjustRecaptchaPosition, 3000);
        setTimeout(adjustRecaptchaPosition, 5000);
        
        // 設置監聽器
        setupMutationObserver();
        setupResizeListener();
        setupPeriodicCheck();
        
        console.log('✅ reCAPTCHA 位置修復初始化完成');
    }
    
    // 當 DOM 準備好時初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 全局函數供調試使用
    window.fixRecaptchaPosition = adjustRecaptchaPosition;
    window.findRecaptchaElements = findRecaptchaElements;
    
})(); 