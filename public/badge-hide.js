// 只隱藏右下角的 reCAPTCHA 圖標，保留表單中的 reCAPTCHA 功能
(function() {
    'use strict';
    
    console.log('🎯 reCAPTCHA 圖標隱藏腳本已載入（保留表單功能）');
    
    // 隱藏右下角 badge 元素
    function hideBadgeElement(element) {
        if (!element) return false;
        
        try {
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('pointer-events', 'none', 'important');
            
            element.classList.add('recaptcha-badge-hidden');
            element.setAttribute('aria-hidden', 'true');
            
            console.log('🎯 已隱藏右下角 reCAPTCHA 圖標:', element);
            return true;
        } catch (e) {
            console.warn('隱藏元素時發生錯誤:', e);
        }
        
        return false;
    }
    
    // 尋找並隱藏右下角的 reCAPTCHA badge
    function hideBadgeElements() {
        let hiddenCount = 0;
        
        // 尋找 grecaptcha-badge 元素
        const badges = document.querySelectorAll('.grecaptcha-badge, div.grecaptcha-badge, #grecaptcha-badge');
        badges.forEach(element => {
            if (!element.classList.contains('recaptcha-badge-hidden')) {
                if (hideBadgeElement(element)) {
                    hiddenCount++;
                }
            }
        });
        
        if (hiddenCount > 0) {
            console.log(`🎯 已隱藏 ${hiddenCount} 個右下角 reCAPTCHA 圖標`);
        }
        
        return hiddenCount;
    }
    
    // 確保表單中的 reCAPTCHA 保持可見
    function ensureFormRecaptchaVisible() {
        const formSelectors = [
            'form .g-recaptcha',
            'form [data-sitekey]',
            'form iframe[src*="recaptcha"]',
            '.auth-form .g-recaptcha',
            '.signup-form .g-recaptcha',
            '.login-form .g-recaptcha',
            '.forgot-password-form .g-recaptcha'
        ];
        
        formSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    element.style.setProperty('display', 'block', 'important');
                    element.style.setProperty('visibility', 'visible', 'important');
                    element.style.setProperty('opacity', '1', 'important');
                    element.style.setProperty('pointer-events', 'auto', 'important');
                    
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
                            if (node.classList && node.classList.contains('grecaptcha-badge')) {
                                shouldCheck = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldCheck) {
                setTimeout(() => {
                    hideBadgeElements();
                    ensureFormRecaptchaVisible();
                }, 50);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return observer;
    }
    
    // 定期檢查
    function setupPeriodicCheck() {
        setInterval(() => {
            hideBadgeElements();
            ensureFormRecaptchaVisible();
        }, 2000);
    }
    
    // 初始化
    function init() {
        console.log('🚀 初始化 reCAPTCHA 圖標隱藏');
        
        hideBadgeElements();
        ensureFormRecaptchaVisible();
        
        setTimeout(() => {
            hideBadgeElements();
            ensureFormRecaptchaVisible();
        }, 1000);
        
        setupMutationObserver();
        setupPeriodicCheck();
        
        console.log('✅ reCAPTCHA 圖標隱藏初始化完成');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    window.hideBadgeOnly = hideBadgeElements;
    window.ensureFormRecaptcha = ensureFormRecaptchaVisible;
    
})(); 