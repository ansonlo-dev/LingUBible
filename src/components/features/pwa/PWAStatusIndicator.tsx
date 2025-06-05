import { Download, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';

interface PWAStatusIndicatorProps {
  className?: string;
  showText?: boolean;
}

export function PWAStatusIndicator({ 
  className = '',
  showText = false 
}: PWAStatusIndicatorProps) {
  const { t } = useLanguage();
  const { 
    canInstall, 
    isInstalled, 
    isStandalone,
    platform,
    promptInstall 
  } = usePWAInstall();

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
    }
  };

  // 如果已經在 PWA 模式下運行，顯示已安裝狀態
  if (isStandalone || isInstalled) {
    return (
      <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
        <Check className="h-3 w-3" />
        {showText && <span className="text-xs">{t('pwa.alreadyInstalled')}</span>}
      </Badge>
    );
  }

  // 如果可以安裝，顯示安裝按鈕
  if (canInstall) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleInstall}
        className={`flex items-center gap-1 text-xs ${className}`}
      >
        <Download className="h-3 w-3" />
        {showText && <span>{t('pwa.install')}</span>}
      </Button>
    );
  }

  // iOS 或其他需要手動安裝的平台
  if (platform === 'iOS') {
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${className}`}>
        <Smartphone className="h-3 w-3" />
        {showText && <span className="text-xs">{t('pwa.installApp')}</span>}
      </Badge>
    );
  }

  // 不顯示任何內容
  return null;
} 