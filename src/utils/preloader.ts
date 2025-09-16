/**
 * Data preloader has been simplified to avoid background Appwrite requests.
 * The public API remains so existing imports do not break, but all methods
 * now resolve immediately without touching the network.
 */

class DataPreloader {
  private static instance: DataPreloader;
  private isPreloading = false;
  private preloadPromise: Promise<void> | null = null;

  static getInstance(): DataPreloader {
    if (!DataPreloader.instance) {
      DataPreloader.instance = new DataPreloader();
    }
    return DataPreloader.instance;
  }

  startPreloading(): Promise<void> {
    if (!this.preloadPromise) {
      this.isPreloading = true;
      this.preloadPromise = Promise.resolve().finally(() => {
        this.isPreloading = false;
      });
    }

    return this.preloadPromise;
  }

  isPreloadingActive(): boolean {
    return this.isPreloading;
  }

  async waitForPreloading(): Promise<void> {
    if (this.preloadPromise) {
      await this.preloadPromise;
    }
  }
}

export const dataPreloader = DataPreloader.getInstance();

export function initializeDataPreloading(): void {
  if (typeof window !== 'undefined' && navigator.onLine) {
    setTimeout(() => {
      dataPreloader.startPreloading();
    }, 500);
  }
}
