import React, { useEffect, useState } from 'react';
import { BookMarked, ChevronDown, ExternalLink, Globe, Library, ScrollText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { getReadingLink, type CourseReading, type ReadingKind } from '@/utils/readingsUtils';
import { cn } from '@/lib/utils';

/**
 * 課程詳情頁的「參考書目」分頁內容。
 *
 * 分成「必讀 / 指定」與「選讀 / 建議」兩組，每筆書目附上種類徽章
 * （書籍 / 論文及期刊 / 網頁）與一顆在新分頁開啟的按鈕：書籍與論文導向
 * Anna's Archive（中文介面走 tw. 子網域），網頁則直接開啟原網址。
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
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    iconClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  },
  article: {
    icon: ScrollText,
    labelKey: 'pages.courseDetail.readingKindArticle',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    iconClass: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  },
  website: {
    icon: Globe,
    labelKey: 'pages.courseDetail.readingKindWebsite',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    iconClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
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
    <li className="flex items-start gap-2.5 sm:gap-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 shadow-sm transition-all hover:shadow-md hover:bg-muted/40">
      {/* 序號（窄螢幕收起）＋ 種類圖示 */}
      <div className="flex items-center gap-2 shrink-0 pt-0.5">
        <span className="hidden sm:block w-6 text-right text-xs font-medium tabular-nums text-muted-foreground">
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
        <p className="text-sm leading-relaxed break-words hyphens-auto text-foreground">
          {reading.fullName}
        </p>
        {showUrl && (
          <p className="text-xs text-muted-foreground break-all">{reading.url}</p>
        )}
      </div>

      <Button
        asChild
        size="icon"
        variant="outline"
        className="h-9 w-9 shrink-0 bg-background"
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
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      {/* 整條標題都可點擊收合；標題文字允許換行，長標籤在窄螢幕不會被截斷 */}
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        title={isExpanded ? t('common.collapse') : t('common.expand')}
        className="w-full flex items-start gap-2.5 px-3 py-3 sm:px-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span className="shrink-0 pt-0.5">{icon}</span>
        <span className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-base leading-snug break-words">{t(titleKey)}</span>
          <Badge variant="secondary" className="text-xs shrink-0">
            {t('pages.courseDetail.readingsCount', { count: readings.length })}
          </Badge>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 mt-1 text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {isExpanded && (
        <ul id={contentId} className="space-y-2.5 px-3 pb-3 sm:px-4 sm:pb-4">
          {readings.map((reading, index) => (
            <ReadingItem key={`${index}-${reading.source}`} reading={reading} index={index} />
          ))}
        </ul>
      )}
    </section>
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
          <div className="p-4 bg-muted/50 rounded-full">
            <Library className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t('pages.courseDetail.noReadings')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t('pages.courseDetail.readingsHint')}
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
