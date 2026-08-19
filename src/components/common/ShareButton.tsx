import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { INFO_DIALOG_CONTENT_CLASS } from './dialogStyles';
import { useLanguage } from '@/hooks/useLanguage';
import { SEO_CONFIG } from '@/utils/seo/config';
import { cn } from '@/lib/utils';

// react-share 只在對話框真的被打開時才載入（見 ShareSheet.tsx 檔頭說明）。
const importShareSheet = () => import('./ShareSheet');
const ShareSheet = React.lazy(importShareSheet);

export interface ShareButtonProps {
  /**
   * 要分享的絕對網址。留空時取目前路由（pathname + search）套上正式網域，
   * 這樣在 localhost 或預覽環境按下分享，送出去的仍是使用者打得開的正式連結。
   */
  url?: string;
  /** 連結預覽卡的標題；同時作為 Email 主旨與原生分享的 title。 */
  title: string;
  /** 連結預覽卡的描述文字。 */
  description?: string;
  /** 預填在訊息框裡、可被使用者改寫的文案。省略時退回 title。 */
  text?: string;
  /** 預覽圖（社群平台實際抓取的 og:image）。 */
  image?: string;
  /** 給 X 用的標籤，不含 #。 */
  hashtags?: string[];
  // ── 外觀（刻意對齊 FavoriteButton，方便併排放在同一列）──
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showText?: boolean;
  /** 停用按鈕（例如課表還沒選任何班別時）。 */
  disabled?: boolean;
  /** 自訂無障礙標籤／提示文字（例如「分享我的課表」）。 */
  label?: string;
}

/** 載入 react-share 分塊時的骨架，維持與實際內容相近的高度避免對話框跳動。 */
function ShareSheetSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="overflow-hidden rounded-xl border bg-muted/30">
        <div className="aspect-[1200/630] w-full animate-pulse bg-muted" />
        <div className="space-y-2 px-3 py-2.5">
          <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="h-[72px] animate-pulse rounded-md bg-muted" />
      <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex min-w-0 flex-col items-center gap-1.5">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted sm:h-11 sm:w-11" />
            <div className="h-2 w-10 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="h-11 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  description,
  text,
  image,
  hashtags,
  className,
  size = 'md',
  variant = 'outline',
  showText = false,
  disabled = false,
  label,
}) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  // 預抓分塊：滑到／聚焦到按鈕時就開始下載，實際按下時骨架幾乎不會被看到。
  // 失敗要吞掉，否則會變成未處理的 promise rejection；真正打開時 Suspense 會重試。
  const prefetch = useCallback(() => {
    importShareSheet().catch(() => {});
  }, []);

  // 只在對話框開啟的當下取一次網址。ShareSheet 會隨對話框卸載，
  // 所以下次打開時一定會重新讀到當時的路由。
  const shareUrl = useMemo(() => {
    if (url) return url;
    if (typeof window === 'undefined') return SEO_CONFIG.BASE_URL;
    return `${SEO_CONFIG.BASE_URL}${window.location.pathname}${window.location.search}`;
  }, [url, open]);

  const defaultMessage = (text || title || '').trim();
  const previewImage = image || '/meta-image.png';

  const buttonSizeClasses =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? (showText ? 'h-10 w-10' : 'h-12 w-12') : 'h-10 w-10';
  const iconSizeClasses =
    size === 'sm'
      ? 'h-3.5 w-3.5'
      : size === 'lg'
        ? 'h-6 w-6 landscape:h-5 landscape:w-5 sm:h-5 sm:w-5'
        : 'h-4 w-4';

  return (
    <>
      {/* disableMobilePopup：分享是實際動作，手機上一按就要開對話框，
          不能落入 ResponsiveTooltip 預設的「先跳提示、再按一次」流程 */}
      <ResponsiveTooltip
        content={label || t('share.tooltip')}
        disabled={showText}
        disableMobilePopup
      >
        <Button
          variant={variant}
          size={showText ? undefined : 'icon'}
          className={cn(
            buttonSizeClasses,
            showText && [
              'h-10 px-3 py-2',
              'landscape:h-10 landscape:w-auto landscape:px-3 landscape:py-2',
              'sm:h-10 sm:w-auto sm:px-3 sm:py-2',
            ],
            'group transition-all duration-200',
            'hover:bg-primary/10 hover:border-primary/50',
            className,
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          onPointerEnter={prefetch}
          onFocus={prefetch}
          disabled={disabled}
          aria-label={label || t('share.tooltip')}
        >
          <Share2
            className={cn(
              iconSizeClasses,
              'transition-all duration-200',
              showText && 'landscape:mr-2 sm:mr-2',
              'text-muted-foreground group-hover:text-primary',
            )}
          />
          {showText && <span className="text-sm font-medium">{t('share.share')}</span>}
        </Button>
      </ResponsiveTooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* grid-cols-[minmax(0,1fr)]：DialogContent 是 display:grid，隱式軌道是
            auto，最小值等於內容的 min-content。<textarea> 有依 cols 算出的固有
            寬度（中文字型下更寬），會把軌道撐得比對話框還寬，小螢幕上整塊內容
            就溢出右邊。把唯一那欄鎖成 minmax(0,1fr) 才會真正跟著容器走。 */}
        {/* 外框樣式與 Google Play 安裝說明彈窗共用，見 dialogStyles.ts */}
        <DialogContent className={INFO_DIALOG_CONTENT_CLASS}>
          {/* text-left：DialogHeader 預設在手機是置中，但標題是「圖示 + 文字」的
              flex 列一定靠左，兩者對不齊；統一靠左。pr-8 留給右上角的關閉鍵。 */}
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5 shrink-0 text-primary" />
              {t('share.dialogTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t('share.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <Suspense fallback={<ShareSheetSkeleton />}>
            <ShareSheet
              shareUrl={shareUrl}
              title={title}
              description={description}
              previewImage={previewImage}
              defaultMessage={defaultMessage}
              hashtags={hashtags}
              onShared={() => setOpen(false)}
            />
          </Suspense>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareButton;
