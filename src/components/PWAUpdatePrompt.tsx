import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';

interface PWAUpdatePromptProps {
  updateSW?: (reloadPage?: boolean) => Promise<void>;
  offlineReady?: boolean;
  needRefresh?: boolean;
}

export function PWAUpdatePrompt({ updateSW, offlineReady, needRefresh }: PWAUpdatePromptProps) {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (offlineReady || needRefresh) {
      setShow(true);
    }
  }, [offlineReady, needRefresh]);

  const handleUpdate = async () => {
    if (updateSW) {
      await updateSW(true);
    }
    setShow(false);
  };

  const handleClose = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  {needRefresh ? t('pwa.updateAvailable') : t('pwa.offlineReady')}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {needRefresh 
                  ? t('pwa.updateDescription') 
                  : t('pwa.offlineDescription')
                }
              </p>
              <div className="flex gap-2">
                {needRefresh && (
                  <Button size="sm" onClick={handleUpdate} className="text-xs">
                    {t('pwa.update')}
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleClose}
                  className="text-xs"
                >
                  {needRefresh ? t('pwa.later') : t('pwa.ok')}
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClose}
              className="h-6 w-6 p-0 shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 