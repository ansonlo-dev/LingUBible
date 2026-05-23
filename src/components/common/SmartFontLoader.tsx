import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { smartFontLoader } from '@/utils/smartFontLoader';

interface FontLoadingIndicatorProps {
  progress: {
    loaded: number;
    total: number;
    variants: string[];
  };
  isLoading: boolean;
  networkType?: string;
}

const FontLoadingIndicator: React.FC<FontLoadingIndicatorProps> = ({ 
  progress, 
  isLoading, 
  networkType 
}) => {
  if (!isLoading && progress.loaded === progress.total) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      minWidth: '200px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        📚 Font Loading
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        Progress: {progress.loaded}/{progress.total} variants
      </div>
      
      <div style={{ 
        width: '100%', 
        height: '4px', 
        background: 'rgba(255, 255, 255, 0.2)', 
        borderRadius: '2px',
        overflow: 'hidden',
        marginBottom: '8px'
      }}>
        <div style={{
          width: `${(progress.loaded / progress.total) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
          transition: 'width 0.3s ease'
        }} />
      </div>
      
      {progress.variants.length > 0 && (
        <div style={{ fontSize: '10px', opacity: 0.8 }}>
          Loaded: {progress.variants.join(', ')}
        </div>
      )}
      
      {networkType && (
        <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px' }}>
          Network: {networkType}
        </div>
      )}
    </div>
  );
};

const SmartFontLoader: React.FC = () => {
  const { language } = useLanguage();
  const [fontStatus, setFontStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [progress, setProgress] = useState({ loaded: 0, total: 5, variants: [] });
  const [error, setError] = useState<string | null>(null);
  const [networkType, setNetworkType] = useState<string>('detecting...');
  const [showIndicator, setShowIndicator] = useState(true);

  useEffect(() => {
    let mounted = true;
    let progressInterval: NodeJS.Timeout;

    const loadFonts = async () => {
      try {
        setFontStatus('loading');
        setError(null);

        
        // Load fonts for the current language
        await smartFontLoader.loadForLanguage(language);
        
        if (mounted) {
          setFontStatus('loaded');
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Font loading failed';
          setError(errorMessage);
          setFontStatus('error');
        }
      }
    };

    // Start loading fonts
    loadFonts();

    // Update progress periodically
    progressInterval = setInterval(() => {
      if (mounted) {
        const currentProgress = smartFontLoader.getLoadingProgress();
        setProgress(currentProgress);
        
        // Hide indicator when loading is complete
        if (currentProgress.loaded === currentProgress.total && fontStatus === 'loaded') {
          setTimeout(() => {
            if (mounted) setShowIndicator(false);
          }, 2000); // Hide after 2 seconds
        }
      }
    }, 300);

    // Detect network conditions
    const detectNetwork = () => {
      try {
        const connection = (navigator as any).connection || 
                          (navigator as any).mozConnection || 
                          (navigator as any).webkitConnection;
        
        if (connection) {
          const type = connection.effectiveType || connection.type || 'unknown';
          const speed = connection.downlink ? `${connection.downlink}Mbps` : '';
          setNetworkType(`${type}${speed ? ` (${speed})` : ''}`);
        } else {
          setNetworkType('unknown');
        }
      } catch (err) {
        setNetworkType('unavailable');
      }
    };

    detectNetwork();

    return () => {
      mounted = false;
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [language, fontStatus]);

  // Development-only debug info
  const showDebugInfo = import.meta.env.DEV && false; // Set to true for debugging

  return (
    <>


      {/* Error State */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#dc2626',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            ⚠️ Font Loading Error
          </div>
          <div>{error}</div>
          <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>
            Falling back to system fonts
          </div>
        </div>
      )}

      {/* Debug Info (Development Only) */}
      {showDebugInfo && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '11px',
          zIndex: 9998,
          maxWidth: '400px',
          fontFamily: 'monospace'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            🔧 Smart Font Loader Debug
          </div>
          <div>Status: {fontStatus}</div>
          <div>Language: {language}</div>
          <div>Network: {networkType}</div>
          <div>Progress: {progress.loaded}/{progress.total}</div>
          <div>Variants: {progress.variants.join(', ') || 'none'}</div>
          {error && <div style={{ color: '#ff6b6b' }}>Error: {error}</div>}
        </div>
      )}
    </>
  );
};

export default SmartFontLoader; 