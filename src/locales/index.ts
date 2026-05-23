// Translation loader with caching and dynamic imports
export type Language = 'en' | 'zh-TW' | 'zh-CN';

// Translation cache to avoid repeated loading
const translationCache = new Map<Language, Record<string, any>>();

// Loading states to prevent duplicate requests
const loadingStates = new Map<Language, Promise<Record<string, any>>>();

/**
 * Dynamically load translation for a specific language
 * Uses caching to improve performance
 */
export async function loadTranslation(language: Language): Promise<Record<string, any>> {
  // Return cached translation if available
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }

  // Return existing loading promise if already loading
  if (loadingStates.has(language)) {
    return loadingStates.get(language)!;
  }

  // Create loading promise
  const loadingPromise = (async () => {
    try {
      let translationModule;
      
      switch (language) {
        case 'en':
          translationModule = await import('./en');
          break;
        case 'zh-TW':
          translationModule = await import('./zh-TW');
          break;
        case 'zh-CN':
          translationModule = await import('./zh-CN');
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      const translation = translationModule.default;
      
      // Cache the loaded translation
      translationCache.set(language, translation);
      
      return translation;
    } catch (error) {
      console.error(`Failed to load translation for ${language}:`, error);
      // Fallback to English if available, otherwise return empty object
      if (language !== 'en' && translationCache.has('en')) {
        return translationCache.get('en')!;
      }
      return {};
    } finally {
      // Clean up loading state
      loadingStates.delete(language);
    }
  })();

  // Store loading promise
  loadingStates.set(language, loadingPromise);

  return loadingPromise;
}

/**
 * Preload translations for better performance
 * Can be called during app initialization
 */
export async function preloadTranslations(languages: Language[] = ['en', 'zh-TW', 'zh-CN']): Promise<void> {
  try {
    await Promise.all(languages.map(lang => loadTranslation(lang)));
    console.log('✅ All translations preloaded successfully');
  } catch (error) {
    console.warn('⚠️ Some translations failed to preload:', error);
  }
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): Language[] {
  return ['en', 'zh-TW', 'zh-CN'];
}

/**
 * Clear translation cache (useful for development or memory management)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
  loadingStates.clear();
} 