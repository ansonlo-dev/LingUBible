import React, { useEffect, useState } from 'react';
import { BookMarked, ChevronDown, ExternalLink, Globe, HelpCircle, Library, ScrollText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { useLanguage } from '@/hooks/useLanguage';
import { getAnnasArchiveWikipediaUrl, getReadingLink, type CourseReading, type ReadingKind } from '@/utils/readingsUtils';
import { cn } from '@/lib/utils';

/**
 * 課程詳情頁的「參考書目」分頁內容。
 *
 * 分成「必讀 / 指定」與「選讀 / 建議」兩組，每筆書目附上種類徽章
 * （書籍 / 論文及期刊 / 網頁）與一顆在新分頁開啟的按鈕：書籍與論文導向
 * Anna's Archive（中文介面走 tw. 子網域），網頁則直接開啟原網址。
 *
 * 配色一律使用固定色階（gray-*、blue-* …）而非 bg-muted / text-foreground /
 * border-border 這類主題 class：本專案的 tailwind.config 把 rgb 形式的 CSS 變數
 * 包進 hsl()，那些 class 會編譯成無效顏色而被瀏覽器丟棄（深色主題對比會壞掉），
 * 而 .bg-card.border.border-border 另有全域覆寫會把邊框變成透明。
 */

// 分組展開狀態沿用其他區塊的 localStorage 命名慣例
const STORAGE_KEY_PREFIX = 'lingubible_section_state_';

const readSectionState = (key: string, fallback: boolean): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (stored !== null) return stored === 'true';
  } catch (error) {
    console.warn('Failed to read readings section state:', error);
  }
  return fallback;
};

// 每種閱讀資料的圖示、徽章文案與配色
const KIND_META: Record<ReadingKind, { icon: React.ElementType; labelKey: string; badgeClass: string; iconClass: string }> = {
  book: {
    icon: BookMarked,
    labelKey: 'pages.courseDetail.readingKindBook',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-600 dark:text-blue-300 bg-blue-500/10',
  },
  article: {
    icon: ScrollText,
    labelKey: 'pages.courseDetail.readingKindArticle',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800',
    iconClass: 'text-purple-600 dark:text-purple-300 bg-purple-500/10',
  },
  website: {
    icon: Globe,
    labelKey: 'pages.courseDetail.readingKindWebsite',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
    iconClass: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10',
  },
};

const ReadingItem: React.FC<{ reading: CourseReading; index: number }> = ({ reading, index }) => {
  const { t, language } = useLanguage();
  const meta = KIND_META[reading.kind];
  const KindIcon = meta.icon;
  const href = getReadingLink(reading, language);
  const openLabel =
    reading.kind === 'website'
      ? t('pages.courseDetail.readingOpenWebsite')
      : t('pages.courseDetail.readingSearchArchive');
  // 書目描述已經含有該網址時就不重複顯示，避免長網址塞滿版面
  const showUrl = !!reading.url && !reading.fullName.includes(reading.url);

  return (
    <li className="flex items-start gap-2.5 sm:gap-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 shadow-sm transition-all hover:shadow-md hover:bg-gray-100 dark:hover:bg-gray-700">
      {/* 序號（窄螢幕收起）＋ 種類圖示 */}
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <span className="hidden sm:block w-6 text-right text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">
          {index + 1}
        </span>
        <span className={cn('p-1.5 rounded-md', meta.iconClass)}>
          <KindIcon className="h-4 w-4" />
        </span>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <Badge variant="outline" className={cn('text-xs w-fit', meta.badgeClass)}>
          {t(meta.labelKey)}
        </Badge>
        <p className="text-sm leading-relaxed break-words hyphens-auto text-gray-900 dark:text-gray-100">
          {reading.fullName}
        </p>
        {showUrl && (
          <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{reading.url}</p>
        )}
      </div>

      <Button
        asChild
        size="icon"
        variant="outline"
        className="h-9 w-9 shrink-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        title={openLabel}
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${openLabel} — ${reading.fullName}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </li>
  );
};

interface ReadingGroupSectionProps {
  titleKey: string;
  sectionKey: string;
  icon: React.ReactNode;
  readings: CourseReading[];
}

const ReadingGroupSection: React.FC<ReadingGroupSectionProps> = ({ titleKey, sectionKey, icon, readings }) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(() => readSectionState(sectionKey, true));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + sectionKey, String(isExpanded));
    } catch (error) {
      console.warn('Failed to save readings section state:', error);
    }
  }, [sectionKey, isExpanded]);

  const contentId = `readings-group-${sectionKey}`;

  return (
    <section className="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
      {/* 整條標題都可點擊收合；標題文字允許換行，長標籤在窄螢幕不會被截斷 */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        title={isExpanded ? t('common.collapse') : t('common.expand')}
        className={cn(
          'w-full flex items-start gap-2.5 px-3 py-3 sm:px-4 text-left transition-colors',
          'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
          isExpanded && 'border-b border-gray-300 dark:border-gray-700'
        )}
      >
        <span className="shrink-0 pt-0.5">{icon}</span>
        <span className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-base leading-snug break-words text-gray-900 dark:text-gray-50">
            {t(titleKey)}
          </span>
          {/* 明確指定深淺主題的底色與文字色，兩邊都保持高對比 */}
          <Badge
            variant="outline"
            className="text-xs shrink-0 bg-gray-200 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
          >
            {t('pages.courseDetail.readingsCount', { count: readings.length })}
          </Badge>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 mt-1 text-gray-500 dark:text-gray-400 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <ul id={contentId} className="space-y-2.5 p-3 sm:p-4">
          {readings.map((reading, index) => (
            <ReadingItem key={`${index}-${reading.source}`} reading={reading} index={index} />
          ))}
        </ul>
      )}
    </section>
  );
};

/**
 * 說明列裡的「Anna’s Archive」：以較重的字重＋虛線底線與其他文字區隔，
 * 後面接一個問號圖示，滑鼠移上（手機為輕觸）會顯示提示，內含前往維基百科的連結
 * （條目語言跟隨站台語言）。
 */
const ArchiveMention: React.FC = () => {
  const { t, language } = useLanguage();
  const learnMore = t('pages.courseDetail.readingsArchiveLearnMore');

  return (
    <span className="inline-flex items-center gap-1 align-baseline">
      <span className="font-semibold text-gray-900 dark:text-gray-50 underline decoration-dotted underline-offset-2">
        Anna’s Archive
      </span>
      <ResponsiveTooltip
        side="top"
        contentClassName="max-w-[16rem]"
        content={
          <a
            href={getAnnasArchiveWikipediaUrl(language)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline"
          >
            {learnMore}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </a>
        }
      >
        <button
          type="button"
          aria-label={learnMore}
          className="inline-flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </ResponsiveTooltip>
    </span>
  );
};

interface CourseReadingsProps {
  readings: CourseReading[];
}

export const CourseReadings: React.FC<CourseReadingsProps> = ({ readings }) => {
  const { t } = useLanguage();

  const required = readings.filter(r => r.group === 'required');
  const supplementary = readings.filter(r => r.group === 'supplementary');

  if (readings.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
            <Library className="h-12 w-12 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('pages.courseDetail.noReadings')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
        {(() => {
          // 語系字串以 {archive} 標出品牌名的位置，切開後插入可互動的專有名詞
          const [before, after] = String(t('pages.courseDetail.readingsHint')).split('{archive}');
          return (
            <>
              {before}
              {after !== undefined && <ArchiveMention />}
              {after}
            </>
          );
        })()}
      </p>

      {required.length > 0 && (
        <ReadingGroupSection
          titleKey="pages.courseDetail.readingsRequired"
          sectionKey="course-readings-required"
          icon={<BookMarked className="h-5 w-5 text-primary" />}
          readings={required}
        />
      )}

      {supplementary.length > 0 && (
        <ReadingGroupSection
          titleKey="pages.courseDetail.readingsSupplementary"
          sectionKey="course-readings-supplementary"
          icon={<Sparkles className="h-5 w-5 text-primary" />}
          readings={supplementary}
        />
      )}
    </div>
  );
};

export default CourseReadings;
