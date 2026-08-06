import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Check, Copy, RotateCcw, Smartphone } from 'lucide-react';
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookMessengerIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TelegramIcon,
  TelegramShareButton,
  ThreadsIcon,
  ThreadsShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
  XShareButton,
} from 'react-share';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

/**
 * 分享對話框的內容。刻意跟 ShareButton 拆開並用 React.lazy 載入：
 * react-share 沒有標記 sideEffects，vite 的 manualChunks 又是整包 node_modules
 * 進 vendor，靜態 import 會讓 25 個社群圖示在每一次首屏都被下載。
 */

/** 分享訊息上限：X 的 280 字是所有目標平台裡最嚴的，統一以它為準。 */
const MESSAGE_MAX_LENGTH = 280;

/**
 * 圖示尺寸交給 CSS：小螢幕 40px、sm 以上 44px。react-share 的 Icon 接受
 * size="100%"，所以外框給多大就畫多大，不必為了換尺寸重新 render。
 */
const ICON_BOX_CLASS = 'h-10 w-10 sm:h-11 sm:w-11';

/** 深層連結沒開成的話瀏覽器不會報錯，只能靠「頁面有沒有被切到背景」來判斷。 */
const DEEP_LINK_TIMEOUT_MS = 1200;

export interface ShareSheetProps {
  shareUrl: string;
  title: string;
  description?: string;
  previewImage: string;
  defaultMessage: string;
  hashtags?: string[];
  /** 原生分享成功後把對話框收起來。 */
  onShared?: () => void;
}

/** react-share 的 <button> 是 inline-flex + 內聯樣式，自繪的按鈕要對齊它才不會高低不一。 */
const CUSTOM_TILE_BUTTON_CLASS =
  'inline-flex h-full w-full items-center justify-center rounded-full outline-none';

/** 一格網路：圖示在上、名稱在下。 */
function NetworkTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // min-w-0：欄位在 320px 的機器上只有約 55px，沒有這個的話標籤（WhatsApp、
    // Messenger）的 min-content 會把整條 grid 撐寬，連帶頂破對話框
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <div
        className={cn(
          ICON_BOX_CLASS,
          // flex（而非 block）讓外框緊貼圓形圖示，焦點環才會是正圓而不是橢圓
          'flex shrink-0 rounded-full transition-transform duration-200',
          'hover:scale-110 active:scale-95',
          // react-share 渲染的是原生 <button>，焦點環套在包裝層上比較好對齊
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
          '[&>button]:h-full [&>button]:w-full',
        )}
      >
        {children}
      </div>
      <span className="w-full truncate text-center text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}

export default function ShareSheet({
  shareUrl,
  title,
  description,
  previewImage,
  defaultMessage,
  hashtags,
  onShared,
}: ShareSheetProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => () => clearTimeout(copyResetRef.current), []);

  const previewHost = useMemo(() => {
    try {
      return new URL(shareUrl).host.replace(/^www\./, '');
    } catch {
      return 'lingubible.com';
    }
  }, [shareUrl]);

  // 訊息框清空時不要把空字串塞進分享網址，否則 X / WhatsApp 會出現前導空行
  const shareText = message.trim() || defaultMessage || title;

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyToClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // 非 https 或舊瀏覽器下沒有 navigator.clipboard，退回 execCommand
        const el = document.createElement('textarea');
        el.value = shareUrl;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        if (!ok) throw new Error('execCommand copy failed');
      }
      return true;
    } catch (error) {
      console.error('Failed to copy share link:', error);
      return false;
    }
  }, [shareUrl]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard();
    if (ok) {
      setCopied(true);
      clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopied(false), 2000);
      toast({ title: t('share.copied'), description: t('share.copiedDescription') });
    } else {
      toast({
        variant: 'destructive',
        title: t('share.copyFailed'),
        description: t('share.copyFailedDescription'),
      });
    }
  }, [copyToClipboard, t, toast]);

  const copyForMessenger = useCallback(() => {
    void copyToClipboard().then((ok) => {
      toast({
        variant: ok ? undefined : 'destructive',
        title: ok ? t('share.messengerCopied') : t('share.copyFailed'),
        description: ok ? t('share.messengerCopiedDescription') : t('share.copyFailedDescription'),
      });
    });
  }, [copyToClipboard, t, toast]);

  const handleMessenger = useCallback(() => {
    // Messenger 的網頁分享端點（facebook.com/dialog/send）強制要 Facebook App ID，
    // 本站沒有註冊，因此手機直接叫 App 的深層連結；桌機沒有可用端點，退回複製。
    const isTouch =
      typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
    if (!isTouch) {
      copyForMessenger();
      return;
    }

    // 沒裝 Messenger 時深層連結會靜靜地什麼都不做，只能用「頁面是否被切走」
    // 判斷有沒有開成功；逾時仍在前景就當作失敗，改為複製連結。
    let leftPage = false;
    const markLeft = () => {
      leftPage = true;
    };
    document.addEventListener('visibilitychange', markLeft);
    window.addEventListener('pagehide', markLeft);
    window.addEventListener('blur', markLeft);

    window.location.href = `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`;

    setTimeout(() => {
      document.removeEventListener('visibilitychange', markLeft);
      window.removeEventListener('pagehide', markLeft);
      window.removeEventListener('blur', markLeft);
      if (leftPage || document.visibilityState === 'hidden') return;
      copyForMessenger();
    }, DEEP_LINK_TIMEOUT_MS);
  }, [copyForMessenger, shareUrl]);

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
      onShared?.();
    } catch (error: any) {
      // 使用者在系統分享面板按取消會丟 AbortError，那不是錯誤
      if (error?.name !== 'AbortError') {
        console.error('Native share failed:', error);
      }
    }
  }, [onShared, shareText, shareUrl, title]);

  return (
    <div className="min-w-0 space-y-4">
      {/* 連結預覽卡：做成社群平台展開連結時的樣子，讓使用者按之前就知道自己在傳什麼 */}
      <div className="overflow-hidden rounded-xl border bg-muted/30">
        <div className="aspect-[1200/630] w-full overflow-hidden bg-muted">
          <img
            src={previewImage}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
            }}
          />
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{previewHost}</p>
          <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">{title}</p>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* 可編輯的訊息 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="share-message" className="text-sm font-medium">
            {t('share.message')}
          </label>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {message.length}/{MESSAGE_MAX_LENGTH}
            </span>
            {message !== defaultMessage && (
              <button
                type="button"
                onClick={() => setMessage(defaultMessage)}
                className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="h-3 w-3" />
                {t('share.reset')}
              </button>
            )}
          </div>
        </div>
        <Textarea
          id="share-message"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
          rows={3}
          className="min-h-[72px] resize-none text-sm"
          placeholder={defaultMessage}
        />
        <p className="text-[11px] leading-snug text-muted-foreground">{t('share.messageHint')}</p>
      </div>

      {/* 網路選單 */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-5">
        <NetworkTile label="WhatsApp">
          <WhatsappShareButton url={shareUrl} title={shareText} separator=" ">
            <WhatsappIcon size="100%" round />
          </WhatsappShareButton>
        </NetworkTile>

        <NetworkTile label="Telegram">
          <TelegramShareButton url={shareUrl} title={shareText}>
            <TelegramIcon size="100%" round />
          </TelegramShareButton>
        </NetworkTile>

        <NetworkTile label="Threads">
          <ThreadsShareButton url={shareUrl} title={shareText}>
            <ThreadsIcon size="100%" round />
          </ThreadsShareButton>
        </NetworkTile>

        <NetworkTile label="X">
          <XShareButton url={shareUrl} title={shareText} hashtags={hashtags}>
            <XIcon size="100%" round />
          </XShareButton>
        </NetworkTile>

        <NetworkTile label="LinkedIn">
          {/* LinkedIn 目前只認 url，標題／摘要一律由它自己抓 og 標籤決定 */}
          <LinkedinShareButton url={shareUrl} title={title} summary={description} source="LingUBible">
            <LinkedinIcon size="100%" round />
          </LinkedinShareButton>
        </NetworkTile>

        <NetworkTile label="Facebook">
          <FacebookShareButton url={shareUrl}>
            <FacebookIcon size="100%" round />
          </FacebookShareButton>
        </NetworkTile>

        <NetworkTile label="Messenger">
          <button
            type="button"
            onClick={handleMessenger}
            aria-label={`${t('share.dialogTitle')} – Messenger`}
            className={CUSTOM_TILE_BUTTON_CLASS}
          >
            <FacebookMessengerIcon size="100%" round />
          </button>
        </NetworkTile>

        <NetworkTile label={t('share.email')}>
          <EmailShareButton url={shareUrl} subject={title} body={shareText} separator={'\n\n'}>
            <EmailIcon size="100%" round />
          </EmailShareButton>
        </NetworkTile>

        {canNativeShare && (
          <NetworkTile label={t('share.moreApps')}>
            <button
              type="button"
              onClick={handleNativeShare}
              aria-label={t('share.moreApps')}
              className={cn(
                CUSTOM_TILE_BUTTON_CLASS,
                'bg-muted text-foreground/70 transition-colors hover:bg-accent',
              )}
            >
              <Smartphone className="h-5 w-5" />
            </button>
          </NetworkTile>
        )}
      </div>

      {/* 複製連結 */}
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-1.5">
        <input
          readOnly
          value={shareUrl}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={t('share.linkLabel')}
          className="min-w-0 flex-1 bg-transparent px-2 text-xs text-muted-foreground outline-none"
        />
        <Button
          size="sm"
          variant={copied ? 'secondary' : 'default'}
          className="h-8 shrink-0 px-3"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="text-xs">{copied ? t('share.copiedShort') : t('share.copy')}</span>
        </Button>
      </div>
    </div>
  );
}
