// Smart Font Loading System
// Provides network-aware, progressive font loading with optimized subsets

import React from 'react';

export interface FontVariant {
  name: string;
  priority: 'critical' | 'high' | 'low';
  description: string;
  files: {
    ttf: string;
    woff2: string;
  };
  sizes: {
    original: number;
    ttf: number;
    woff2: number;
  };
  reduction: number;
}

export interface FontManifest {
  generated: string;
  source: string;
  variants: FontVariant[];
}

export interface NetworkInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | undefined;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface FontLoadStrategy {
  variant: string;
  format: 'woff2' | 'ttf';
  preload: boolean;
  defer: boolean;
}

class SmartFontLoader {
  private manifest: FontManifest | null = null;
  private loadedFonts = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();
  private networkInfo: NetworkInfo | null = null;
  private currentLanguage: string = 'en';
  
  constructor() {
    this.detectNetworkConditions();
    this.preloadCriticalFonts();
  }

  // Network detection and strategy optimization
  private detectNetworkConditions(): void {
    try {
      // Modern browsers with Network Information API
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        this.networkInfo = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData || false
        };
        
        // Listen for network changes
        connection.addEventListener('change', () => {
          this.detectNetworkConditions();
          this.adjustLoadingStrategy();
        });
      } else {
        // Fallback: Estimate network based on page load time and assume decent connection
        const loadStart = performance.timing?.navigationStart || Date.now();
        const loadEnd = performance.timing?.loadEventEnd || Date.now();
        const loadTime = loadEnd - loadStart;
        
        // Be more optimistic about network conditions for font loading
        this.networkInfo = {
          effectiveType: loadTime > 5000 ? 'slow-2g' : 
                        loadTime > 3000 ? '2g' :
                        loadTime > 1500 ? '3g' : '4g',
          downlink: loadTime > 5000 ? 0.5 : 
                   loadTime > 3000 ? 1 :
                   loadTime > 1500 ? 3 : 8, // Assume decent connection
          rtt: loadTime > 5000 ? 500 : 
               loadTime > 3000 ? 300 :
               loadTime > 1500 ? 200 : 150,
          saveData: false
        };
        

      }
    } catch (error) {
      console.warn('⚠️ Network detection failed:', error);
      // Optimistic defaults for unknown network conditions - assume decent connection
      this.networkInfo = {
        effectiveType: '4g',
        downlink: 8, // Assume good connection for font loading
        rtt: 150,
        saveData: false
      };
      
    }
  }

  // Load font manifest
  async loadManifest(): Promise<FontManifest> {
    if (this.manifest) return this.manifest;
    
    try {
      const response = await fetch('/fonts/optimized/font-manifest.json');
      this.manifest = await response.json();
      return this.manifest;
    } catch (error) {
      console.error('❌ Failed to load font manifest:', error);
      throw new Error('Font manifest unavailable');
    }
  }

  // Get optimal loading strategy based on network and language
  getLoadingStrategy(language: string): FontLoadStrategy[] {
    if (!this.networkInfo) return [];

    const strategies: FontLoadStrategy[] = [];
    const isSlowNetwork = this.networkInfo.effectiveType === 'slow-2g' || 
                         this.networkInfo.effectiveType === '2g' ||
                         this.networkInfo.saveData;
    
    const isFastNetwork = this.networkInfo.effectiveType === '4g' && 
                         this.networkInfo.downlink > 5;

    // Strategy 1: Always load critical subset first (for immediate text display)
    strategies.push({
      variant: 'critical',
      format: 'woff2',
      preload: true,
      defer: false
    });

    // Strategy 2: Always load Latin for mixed content support
    strategies.push({
      variant: 'latin',
      format: 'woff2',
      preload: isFastNetwork,
      defer: isSlowNetwork
    });

    // Strategy 3: Load primary language-specific font
    if (language === 'zh-TW') {
      strategies.push({
        variant: 'zh-TW',
        format: 'woff2',
        preload: isFastNetwork,
        defer: isSlowNetwork
      });
    } else if (language === 'zh-CN') {
      strategies.push({
        variant: 'zh-CN',
        format: 'woff2',
        preload: isFastNetwork,
        defer: isSlowNetwork
      });
    }

    // Strategy 4: Load secondary Chinese variant for comprehensive coverage
    if (language === 'zh-TW' && isFastNetwork) {
      // Also load Simplified Chinese on fast networks for mixed content
      strategies.push({
        variant: 'zh-CN',
        format: 'woff2',
        preload: false,
        defer: true
      });
    } else if (language === 'zh-CN' && isFastNetwork) {
      // Also load Traditional Chinese on fast networks for mixed content
      strategies.push({
        variant: 'zh-TW',
        format: 'woff2',
        preload: false,
        defer: true
      });
    }

    // Strategy 5: Load full font as final fallback
    // Load on fast networks immediately, or on any network with longer delay
    if (isFastNetwork && !this.networkInfo.saveData) {
      strategies.push({
        variant: 'full',
        format: 'woff2',
        preload: false,
        defer: true
      });
    } else if (!isSlowNetwork) {
      // On unknown/medium networks, still load but with longer delay
      strategies.push({
        variant: 'full',
        format: 'woff2',
        preload: false,
        defer: true
      });
    }

    return strategies;
  }

  // Preload critical fonts for instant text display
  private async preloadCriticalFonts(): Promise<void> {
    try {
      const manifest = await this.loadManifest();
      const criticalVariant = manifest.variants.find(v => v.name === 'critical');
      
      if (criticalVariant) {
        await this.loadFont('critical', criticalVariant.files.woff2, true);
      }
    } catch (error) {
      console.warn('⚠️ Critical font preload failed:', error);
    }
  }

  // Load specific font variant
  async loadFont(variant: string, url: string, preload: boolean = false): Promise<void> {
    // Use a simpler key that just includes the variant name for easier tracking
    const fontKey = variant;
    
    if (this.loadedFonts.has(fontKey)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(fontKey)) {
      return this.loadingPromises.get(fontKey)!;
    }

    const loadingPromise = this.performFontLoad(variant, url, preload);
    this.loadingPromises.set(fontKey, loadingPromise);
    
    try {
      await loadingPromise;
      this.loadedFonts.add(fontKey);
    } catch (error) {
      console.error(`❌ Font load failed: ${variant}`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(fontKey);
    }
  }

  // Perform the actual font loading
  private async performFontLoad(variant: string, url: string, preload: boolean): Promise<void> {
    try {
      const fontFace = new FontFace('LXGW WenKai', `url(${url})`, {
        display: 'swap',
        weight: '400',
        style: 'normal'
      });

      await fontFace.load();
      document.fonts.add(fontFace);
    } catch (error) {
      console.error(`❌ Failed to load font ${variant} from ${url}:`, error);
      throw error;
    }
  }

  // Progressive loading based on language change
  async loadForLanguage(language: string): Promise<void> {
    this.currentLanguage = language;
    
    try {
      const manifest = await this.loadManifest();
      const strategies = this.getLoadingStrategy(language);
      
      // Execute loading strategies in order
      for (const strategy of strategies) {
        const variant = manifest.variants.find(v => v.name === strategy.variant);
        if (!variant) {
          console.warn(`⚠️ Variant ${strategy.variant} not found in manifest`);
          continue;
        }

        const url = variant.files[strategy.format];
        
        if (strategy.defer) {
          // Load after a delay for non-critical fonts
          const delay = this.getLoadDelay();
          setTimeout(() => {
            this.loadFont(strategy.variant, url, strategy.preload).catch(console.error);
          }, delay);
        } else {
          // Load immediately for critical fonts
          await this.loadFont(strategy.variant, url, strategy.preload);
        }
      }
    } catch (error) {
      console.error('❌ Language-specific font loading failed:', error);
    }
  }

  // Get delay based on network conditions
  private getLoadDelay(): number {
    if (!this.networkInfo) return 2000; // Conservative delay for unknown networks
    
    if (this.networkInfo.effectiveType === 'slow-2g') return 5000;
    if (this.networkInfo.effectiveType === '2g') return 3000;
    if (this.networkInfo.effectiveType === '3g') return 1500;
    if (this.networkInfo.effectiveType === '4g') return 500;
    return 2000; // Default for unknown network types
  }

  // Adjust loading strategy when network conditions change
  private adjustLoadingStrategy(): void {
    // Reload fonts for current language with new strategy
    this.loadForLanguage(this.currentLanguage);
  }

  // Check if specific font variant is loaded
  isFontLoaded(variant: string): boolean {
    return this.loadedFonts.has(variant);
  }

  // Get loading progress for UI feedback
  getLoadingProgress(): { loaded: number; total: number; variants: string[] } {
    const totalVariants = this.manifest?.variants.length || 5;
    const loadedVariants = Array.from(this.loadedFonts); // Now these are just variant names
    
    return {
      loaded: loadedVariants.length,
      total: totalVariants,
      variants: loadedVariants
    };
  }

  // Cleanup and reset
  reset(): void {
    this.loadedFonts.clear();
    this.loadingPromises.clear();
  }
}

// Global font loader instance
export const smartFontLoader = new SmartFontLoader();

// React hook for font loading
export function useSmartFontLoader(language: string = 'en') {
  const [isLoading, setIsLoading] = React.useState(true);
  const [progress, setProgress] = React.useState({ loaded: 0, total: 5, variants: [] });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadFonts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await smartFontLoader.loadForLanguage(language);
        
        if (mounted) {
          setProgress(smartFontLoader.getLoadingProgress());
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Font loading failed');
          setIsLoading(false);
        }
      }
    };

    loadFonts();

    // Update progress periodically
    const progressInterval = setInterval(() => {
      if (mounted) {
        setProgress(smartFontLoader.getLoadingProgress());
      }
    }, 500);

    return () => {
      mounted = false;
      clearInterval(progressInterval);
    };
  }, [language]);

  return {
    isLoading,
    progress,
    error,
    isFontLoaded: (variant: string) => smartFontLoader.isFontLoaded(variant)
  };
}

export default smartFontLoader; 