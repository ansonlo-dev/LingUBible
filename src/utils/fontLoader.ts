/**
 * LXGW WenKai 字體載入工具
 * 優化字體載入效能，支援語言特定的字體載入策略
 */

interface FontConfig {
  family: string;
  url: string;
  unicodeRange?: string;
  weight?: string;
  style?: string;
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

interface FontLoadingOptions {
  priority?: boolean;
  timeout?: number;
  fallback?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

class FontLoader {
  private loadedFonts: Set<string> = new Set();
  private loadingFonts: Map<string, Promise<void>> = new Map();
  private statusElement: HTMLElement | null = null;

  constructor() {
    this.initStatusIndicator();
    this.setupFontDisplay();
  }

  /**
   * 初始化狀態指示器
   */
  private initStatusIndicator(): void {
    if (typeof document === 'undefined') return;

    this.statusElement = document.createElement('div');
    this.statusElement.className = 'font-status';
    this.statusElement.textContent = '字體載入中...';
    document.body.appendChild(this.statusElement);
  }

  /**
   * 設置字體顯示策略
   */
  private setupFontDisplay(): void {
    if (typeof document === 'undefined') return;

    document.body.classList.add('font-loading');
    
    // 設置初始字體回退
    document.documentElement.style.setProperty(
      '--font-family-fallback',
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    );
  }

  /**
   * 顯示載入狀態
   */
  private showStatus(message: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.classList.add('show');
      
      setTimeout(() => {
        this.statusElement?.classList.remove('show');
      }, 2000);
    }
  }

  /**
   * 預載入關鍵字體
   */
  async preloadCriticalFonts(): Promise<void> {
    const language = this.getCurrentLanguage();
    const criticalFonts = this.getCriticalFonts(language);
    
    this.showStatus(`載入 ${language} 字體...`);
    
    try {
      await Promise.all(
        criticalFonts.map(font => this.loadFont(font, { priority: true }))
      );
      
      this.showStatus('字體載入完成');
      document.body.classList.remove('font-loading');
      document.body.classList.add('font-loaded');
      
    } catch (error) {
      console.error('Critical font loading failed:', error);
      this.showStatus('字體載入失敗，使用備用字體');
      this.fallbackToSystemFonts();
    }
  }

  /**
   * 載入字體
   */
  async loadFont(config: FontConfig, options: FontLoadingOptions = {}): Promise<void> {
    const { family, url, unicodeRange, weight = 'normal', style = 'normal', display = 'swap' } = config;
    const { priority = false, timeout = 5000, fallback, onLoad, onError } = options;
    
    const fontKey = `${family}-${weight}-${style}`;
    
    // 檢查是否已載入
    if (this.loadedFonts.has(fontKey)) {
      onLoad?.();
      return;
    }

    // 檢查是否正在載入
    if (this.loadingFonts.has(fontKey)) {
      return this.loadingFonts.get(fontKey)!;
    }

    // 創建載入 Promise
    const loadPromise = this.createFontLoadPromise(config, timeout);
    this.loadingFonts.set(fontKey, loadPromise);

    try {
      await loadPromise;
      this.loadedFonts.add(fontKey);
      this.loadingFonts.delete(fontKey);
      onLoad?.();
      
    } catch (error) {
      this.loadingFonts.delete(fontKey);
      console.error(`Failed to load font ${family}:`, error);
      
      if (fallback) {
        this.applyFallbackFont(fallback);
      }
      
      onError?.(error as Error);
    }
  }

  /**
   * 創建字體載入 Promise
   */
  private createFontLoadPromise(config: FontConfig, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const { family, url, unicodeRange, weight = 'normal', style = 'normal', display = 'swap' } = config;
      
      // 創建 @font-face 規則
      const fontFace = new FontFace(family, `url(${url})`, {
        weight,
        style,
        display: display as FontDisplay,
        unicodeRange
      });

      // 設置超時
      const timeoutId = setTimeout(() => {
        reject(new Error(`Font loading timeout: ${family}`));
      }, timeout);

      // 載入字體
      fontFace.load().then(() => {
        clearTimeout(timeoutId);
        document.fonts.add(fontFace);
        resolve();
      }).catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * 獲取當前語言
   */
  private getCurrentLanguage(): string {
    if (typeof document === 'undefined') return 'zh-TW';
    
    const lang = document.documentElement.lang || 
                 localStorage.getItem('language') || 
                 'zh-TW';
    
    return lang;
  }

  /**
   * 獲取關鍵字體配置
   */
  private getCriticalFonts(language: string): FontConfig[] {
    const baseUrl = '/fonts/';
    
    switch (language) {
      case 'zh-TW':
        return [
          {
            family: 'LXGW WenKai TC',
            url: `${baseUrl}LXGWWenKai-TC.woff2`,
            unicodeRange: 'U+4E00-9FFF, U+3400-4DBF, U+20000-2A6DF, U+F900-FAFF, U+2F800-2FA1F'
          }
        ];
      
      case 'zh-CN':
        return [
          {
            family: 'LXGW WenKai SC',
            url: `${baseUrl}LXGWWenKai-SC.woff2`,
            unicodeRange: 'U+4E00-9FFF, U+3400-4DBF'
          }
        ];
      
      case 'en':
        return [
          {
            family: 'LXGW WenKai EN',
            url: `${baseUrl}LXGWWenKai-EN.woff2`,
            unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
          }
        ];
      
      default:
        return [];
    }
  }

  /**
   * 載入語言特定的字體
   */
  async loadLanguageSpecificFonts(language: string): Promise<void> {
    const fonts = this.getCriticalFonts(language);
    
    await Promise.all(
      fonts.map(font => this.loadFont(font, {
        priority: true,
        timeout: 8000,
        onLoad: () => {
          this.applyLanguageFont(language);
        },
        onError: (error) => {
          console.error(`Failed to load ${language} font:`, error);
          this.fallbackToSystemFonts();
        }
      }))
    );
  }

  /**
   * 應用語言字體
   */
  private applyLanguageFont(language: string): void {
    if (typeof document === 'undefined') return;
    
    document.body.classList.remove('lang-tc', 'lang-sc', 'lang-en');
    
    switch (language) {
      case 'zh-TW':
        document.body.classList.add('lang-tc');
        break;
      case 'zh-CN':
        document.body.classList.add('lang-sc');
        break;
      case 'en':
        document.body.classList.add('lang-en');
        break;
    }
  }

  /**
   * 回退到系統字體
   */
  private fallbackToSystemFonts(): void {
    if (typeof document === 'undefined') return;
    
    document.body.classList.remove('font-loading');
    document.body.classList.add('font-fallback');
    
    this.showStatus('使用系統字體');
  }

  /**
   * 應用備用字體
   */
  private applyFallbackFont(fallback: string): void {
    if (typeof document === 'undefined') return;
    
    document.documentElement.style.setProperty('--font-family-fallback', fallback);
  }

  /**
   * 檢查字體是否已載入
   */
  isFontLoaded(fontFamily: string): boolean {
    return this.loadedFonts.has(fontFamily);
  }

  /**
   * 清除字體緩存
   */
  clearCache(): void {
    this.loadedFonts.clear();
    this.loadingFonts.clear();
  }

  /**
   * 獲取字體載入統計
   */
  getLoadingStats(): {
    loaded: number;
    loading: number;
    loadedFonts: string[];
  } {
    return {
      loaded: this.loadedFonts.size,
      loading: this.loadingFonts.size,
      loadedFonts: Array.from(this.loadedFonts)
    };
  }
}

// 創建全局字體載入器實例
export const fontLoader = new FontLoader();

// 字體載入 Hook
export const useFontLoader = () => {
  const loadFont = async (config: FontConfig, options?: FontLoadingOptions) => {
    return fontLoader.loadFont(config, options);
  };

  const loadLanguageFont = async (language: string) => {
    return fontLoader.loadLanguageSpecificFonts(language);
  };

  const preloadCriticalFonts = async () => {
    return fontLoader.preloadCriticalFonts();
  };

  return {
    loadFont,
    loadLanguageFont,
    preloadCriticalFonts,
    isFontLoaded: fontLoader.isFontLoaded.bind(fontLoader),
    getStats: fontLoader.getLoadingStats.bind(fontLoader)
  };
};

// 自動初始化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    fontLoader.preloadCriticalFonts();
  });
}

export default fontLoader; 