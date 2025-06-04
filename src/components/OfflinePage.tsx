import { useLanguage } from '@/contexts/LanguageContext';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflinePage() {
  const { t } = useLanguage();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md mx-auto">
        <div className="flex justify-center">
          <WifiOff className="h-24 w-24 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {t('offline.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('offline.description')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• {t('offline.feature1')}</p>
            <p>• {t('offline.feature2')}</p>
            <p>• {t('offline.feature3')}</p>
          </div>
          
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('offline.retry')}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {t('offline.note')}
        </div>
      </div>
    </div>
  );
} 