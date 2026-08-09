import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Coins, Copy, ExternalLink, Heart, HeartHandshake, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { INFO_DIALOG_CONTENT_CLASS } from '@/components/common/dialogStyles';
import {
  KOFI_URL,
  getAvailableCryptoMethods,
  type CryptoDonationMethod,
} from '@/config/donation';

/**
 * 「支持這個專案」彈窗：Ko-fi 為主要選項，加密貨幣地址在下方可一鍵複製。
 *
 * 刻意設計成 **只能由使用者主動打開**（footer 膠囊、側邊欄項目、送出評論後的
 * 感謝彈窗），不做橫幅、不做浮動按鈕、不自動彈出 —— 平台是免費的，捐款入口
 * 應該找得到但不該擋路。
 *
 * 三個入口共用同一個元件（各自持有 open state），文案與幣種只有 config/donation.ts
 * 一份，改一次三處同步。
 */

/** QR 碼只有展開時才需要，連同 qrcode.react 一起按需載入。 */
const CryptoQrCode = lazy(() => import('@/components/common/CryptoQrCode'));

export interface DonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 複製到剪貼簿；非 https 或舊瀏覽器沒有 navigator.clipboard，退回 execCommand。 */
async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch (error) {
    console.error('Failed to copy donation address:', error);
    return false;
  }
}

function CryptoRow({
  method,
  qrOpen,
  onToggleQr,
}: {
  method: CryptoDonationMethod;
  qrOpen: boolean;
  onToggleQr: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const resetRef = useRef<ReturnType<typeof setTimeout>>();
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(resetRef.current), []);

  // 展開的是清單裡第 N 列時，QR 很可能落在彈窗可視範圍外；把整列捲進來
  useEffect(() => {
    if (qrOpen) {
      rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [qrOpen]);

  // 幣種全名走 i18n（比特幣／Bitcoin），代號與網路名不翻譯
  const coinName = t(`donate.coin.${method.id}`);
  const label = method.network ? `${method.ticker} (${method.network})` : method.ticker;

  const handleCopy = useCallback(async () => {
    const ok = await copyText(method.address);
    if (ok) {
      setCopied(true);
      clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setCopied(false), 2000);
      toast({
        title: t('donate.copied'),
        description: t('donate.copiedDescription', { name: label }),
      });
    } else {
      toast({
        variant: 'destructive',
        title: t('donate.copyFailed'),
        description: t('donate.copyFailedDescription'),
      });
    }
  }, [label, method.address, t, toast]);

  return (
    <div
      ref={rowRef}
      className="rounded-lg border border-gray-200 bg-gray-50/70 dark:border-zinc-700 dark:bg-zinc-800/60"
    >
      <div className="flex items-center gap-1">
        {/* 複製的觸控目標刻意含整塊文字（而不是只有右邊的圖示），手機上好按很多 */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={t('donate.copyAddress', { name: label })}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: method.color, color: method.fg ?? '#ffffff' }}
            aria-hidden="true"
          >
            {method.glyph}
          </span>

          {/* min-w-0：沒有它的話 break-all 的地址會把 flex 軌道撐爆，整列溢出彈窗 */}
          <span className="min-w-0 flex-1">
            {/* flex-wrap：窄螢幕上「代號 + 幣名 + 網路標籤」放不下時換行，不擠壓地址 */}
            <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-sm font-semibold text-foreground">{method.ticker}</span>
              <span className="text-xs text-muted-foreground">{coinName}</span>
              {method.network && (
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {method.network}
                </span>
              )}
            </span>
            <span className="mt-0.5 block break-all font-mono text-[11px] leading-tight text-muted-foreground">
              {method.address}
            </span>
          </span>

          <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">
            {copied ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleQr}
          aria-label={t('donate.showQr', { name: label })}
          aria-expanded={qrOpen}
          className={`mr-1.5 shrink-0 rounded-md p-2 transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700 ${
            qrOpen ? 'bg-gray-200 text-foreground dark:bg-zinc-700' : 'text-muted-foreground'
          }`}
        >
          <QrCode className="h-4 w-4" />
        </button>
      </div>

      {qrOpen && (
        <div className="flex flex-col items-center gap-2 border-t border-gray-200 px-2.5 py-3 dark:border-zinc-700">
          {/* fallback 的高度與 QR 相同，展開時版面不會先塌一下再撐開 */}
          <Suspense fallback={<div className="h-[216px] w-[216px] animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />}>
            <CryptoQrCode value={method.address} />
          </Suspense>
          <span className="text-[11px] text-muted-foreground">{t('donate.qrHint', { name: label })}</span>
        </div>
      )}
    </div>
  );
}

export function DonationDialog({ open, onOpenChange }: DonationDialogProps) {
  const { t } = useLanguage();
  const cryptoMethods = getAvailableCryptoMethods();
  // 一次只展開一張 QR：全開的話彈窗會長到必須一直捲
  const [openQrId, setOpenQrId] = useState<string | null>(null);
  // 十幾種幣的地址一次全攤開會變成一面「地址牆」，反而顯得在募款；預設收起，
  // 想用加密貨幣的人自己點開，Ko-fi 也才留得住主要位置。
  const [cryptoExpanded, setCryptoExpanded] = useState(false);

  // 關掉彈窗時回到初始狀態，下次打開才不會停在上次展開的那一列
  useEffect(() => {
    if (!open) {
      setOpenQrId(null);
      setCryptoExpanded(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={INFO_DIALOG_CONTENT_CLASS}>
        {/* text-left：DialogHeader 手機預設置中，但這裡是「圖示 + 標題」的組合 */}
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 shrink-0 text-pink-500" />
            {t('donate.title')}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {t('donate.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ko-fi：主要選項，視覺重量刻意壓過下方的加密貨幣列 */}
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-pink-200/70 bg-gradient-to-r from-pink-100 to-rose-100 p-3 transition-all hover:shadow-md dark:border-pink-700/60 dark:from-pink-900/40 dark:to-rose-900/40"
          >
            <img
              src="/logomarkLogo.webp"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 shrink-0 object-contain"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-pink-800 dark:text-pink-200">
                Ko-fi
              </span>
              <span className="block truncate text-xs text-pink-700/80 dark:text-pink-300/80">
                {t('donate.kofiHint')}
              </span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-pink-700 dark:text-pink-300" />
          </a>

          {cryptoMethods.length > 0 && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setCryptoExpanded((v) => !v)}
                aria-expanded={cryptoExpanded}
                className="flex w-full items-center gap-2 rounded-md py-1 text-left transition-colors hover:text-foreground"
              >
                <Coins className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('donate.cryptoTitle')}
                </span>
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {cryptoMethods.length}
                </span>
                <span className="h-px flex-1 bg-border" />
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    cryptoExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {cryptoExpanded && (
                <>
                  <p className="text-xs text-muted-foreground">{t('donate.cryptoHint')}</p>
                  <div className="space-y-2">
                    {cryptoMethods.map((method) => (
                      <CryptoRow
                        key={method.id}
                        method={method}
                        qrOpen={openQrId === method.id}
                        onToggleQr={() =>
                          setOpenQrId((current) => (current === method.id ? null : method.id))
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">{t('donate.footnote')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Footer 的粉紅膠囊按鈕（與 FooterBetaButton、OpenStatusWidget 同一套樣式）。
 * 以前是直接開 Ko-fi 連結，現在改成打開上面的彈窗，才容得下多種捐款方式。
 */
export function FooterDonateButton({ className = '' }: { className?: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* disableMobilePopup：手機上直接開彈窗，不要先跳一次 tooltip 才生效 */}
      <ResponsiveTooltip content={t('donate.tooltip')} disableMobilePopup>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('donate.tooltip')}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-pink-200/60 bg-gradient-to-r from-pink-100 to-rose-100 px-3 py-1.5 text-xs font-medium text-pink-700 transition-all duration-300 hover:scale-105 hover:border-pink-300 hover:from-pink-200 hover:to-rose-200 hover:shadow-md dark:border-pink-700/60 dark:from-pink-900/50 dark:to-rose-900/50 dark:text-red-400 dark:hover:border-pink-600 dark:hover:from-pink-800/60 dark:hover:to-rose-800/60 ${className}`}
        >
          <Heart className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold">{t('donate.button')}</span>
        </button>
      </ResponsiveTooltip>
      <DonationDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/**
 * 側邊欄底部（語言／主題切換上方）的「支持我們」入口。
 *
 * 放在底部設定區而不是導覽群組裡，是刻意的：它常駐可見、但視覺層級明顯低於
 * 課程／講師這些主要功能，不會跟導覽搶注意力。
 */
export function SidebarDonateButton({ showText }: { showText: boolean }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResponsiveTooltip
        content={t('donate.tooltip')}
        side="right"
        disabled={showText}
        delayDuration={150}
        disableMobilePopup
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('donate.tooltip')}
          className={`flex w-full items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
            showText ? 'gap-2 px-3 py-2' : 'p-2'
          }`}
        >
          <HeartHandshake className="h-6 w-6 flex-shrink-0 text-pink-600 dark:text-pink-400" />
          {showText && (
            <span className="whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-white">
              {t('donate.sidebar')}
            </span>
          )}
        </button>
      </ResponsiveTooltip>
      <DonationDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export default DonationDialog;
