/**
 * 學額 / 收生人數顯示元件（course_offerings 資料）
 *
 * 兩個顯示點：
 * - `SeatsSegment`：接在教學記錄「學期 ｜ 教學語言」徽章右側的第三段，
 *   以 `收生/學額` 的緊湊寫法呈現，顏色代表搶手程度。
 * - `SeatsOverview`：課程頁教學記錄分頁頂部的逐學期總覽，顯示整門課
 *   每學期的收生比例長條。
 *
 * 沒有對應資料時（官方選課資料未涵蓋該學期）一律不顯示，不留空位。
 */

import React from 'react';
import { Users } from 'lucide-react';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { useLanguage } from '@/hooks/useLanguage';
import { CourseOffering, offeringFillRate } from '@/services/api/courseService';

/**
 * 收生率分級。以「學生選課難度」為語意：
 * 綠 = 仍有餘額、黃 = 接近額滿、紅 = 已額滿或超收。
 */
type FillLevel = 'available' | 'tight' | 'full';

function getFillLevel(fillRate: number | null): FillLevel {
  if (fillRate === null) return 'available';
  if (fillRate >= 1) return 'full';
  if (fillRate >= 0.85) return 'tight';
  return 'available';
}

const SEGMENT_STYLES: Record<FillLevel, string> = {
  available: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400',
  tight: 'bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400',
  full: 'bg-rose-50 text-rose-700 dark:bg-rose-900/10 dark:text-rose-400',
};

const BAR_STYLES: Record<FillLevel, string> = {
  available: 'bg-emerald-500',
  tight: 'bg-amber-500',
  full: 'bg-rose-500',
};

/** 詳細數字的浮動說明，行動裝置點一下即可看到。 */
function SeatsTooltipContent({ offering }: { offering: CourseOffering }) {
  const { t } = useLanguage();
  const fillRate = offeringFillRate(offering);
  const remaining = offering.capacity - offering.enrolled;

  const rows: Array<[string, string]> = [
    [t('seats.capacity'), String(offering.capacity)],
    [t('seats.enrolled'), String(offering.enrolled)],
    [t('seats.remaining'), remaining > 0 ? String(remaining) : '0'],
  ];
  if (fillRate !== null) {
    rows.push([t('seats.fillRate'), `${Math.round(fillRate * 100)}%`]);
  }
  if (offering.sections > 1) {
    rows.push([t('seats.sections'), String(offering.sections)]);
  }

  return (
    <div className="space-y-1">
      <div className="font-semibold">{t('seats.title')}</div>
      <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono text-right">{value}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * 徽章第三段：`收生/學額`。
 * 需放在既有的 `inline-flex rounded-md border overflow-hidden` 容器內，
 * 因此自帶左側分隔線，與教學語言段落的做法一致。
 */
export function SeatsSegment({ offering }: { offering: CourseOffering | undefined | null }) {
  if (!offering || !offering.capacity) return null;

  const level = getFillLevel(offeringFillRate(offering));

  return (
    <>
      <div className="w-px bg-border" aria-hidden="true"></div>
      <ResponsiveTooltip content={<SeatsTooltipContent offering={offering} />} showCloseButton={true}>
        <span
          className={`px-2 py-1 text-xs font-mono whitespace-nowrap cursor-help ${SEGMENT_STYLES[level]}`}
        >
          {offering.enrolled}/{offering.capacity}
        </span>
      </ResponsiveTooltip>
    </>
  );
}

/**
 * 單獨使用的學額徽章（沒有學期／語言徽章可以附著時使用），
 * 例如教學語言缺失而只顯示學期的後備樣式。
 */
export function SeatsBadge({ offering }: { offering: CourseOffering | undefined | null }) {
  if (!offering || !offering.capacity) return null;

  const level = getFillLevel(offeringFillRate(offering));

  return (
    <ResponsiveTooltip content={<SeatsTooltipContent offering={offering} />} showCloseButton={true}>
      <span
        className={`px-2 py-1 text-xs font-mono rounded-md border border-border whitespace-nowrap cursor-help ${SEGMENT_STYLES[level]}`}
      >
        {offering.enrolled}/{offering.capacity}
      </span>
    </ResponsiveTooltip>
  );
}

interface SeatsOverviewProps {
  /** 課程層級的逐學期學額（CourseService.getCourseOfferings 的 byTerm） */
  byTerm: Map<string, CourseOffering>;
  /** 學期碼 → 顯示名稱。缺少時直接顯示學期碼。 */
  termNames: Map<string, string>;
  /** 依時序（新到舊）排好的學期碼；只顯示有學額資料的學期。 */
  termCodes: string[];
}

/**
 * 課程頁教學記錄分頁頂部的逐學期收生總覽。
 *
 * 只用課程層級（scope='course'）的資料：同一門課的講課與導修收的是同一批
 * 學生，這裡呈現的是整門課該學期實際收了多少人、上限多少。
 */
export function SeatsOverview({ byTerm, termNames, termCodes }: SeatsOverviewProps) {
  const { t } = useLanguage();

  const terms = termCodes
    .map(code => ({ code, offering: byTerm.get(code) }))
    .filter((entry): entry is { code: string; offering: CourseOffering } =>
      Boolean(entry.offering && entry.offering.capacity)
    );

  if (terms.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold">{t('seats.overviewTitle')}</span>
        <span className="text-xs text-muted-foreground">{t('seats.overviewHint')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-2">
        {terms.map(({ code, offering }) => {
          const fillRate = offeringFillRate(offering) ?? 0;
          const level = getFillLevel(fillRate);
          return (
            <div key={code} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                {termNames.get(code) || code}
              </span>
              <div className="flex-1 h-2 rounded-full bg-border/60 overflow-hidden min-w-[3rem]">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${BAR_STYLES[level]}`}
                  style={{ width: `${Math.min(100, Math.round(fillRate * 100))}%` }}
                />
              </div>
              <span className="text-xs font-mono tabular-nums shrink-0 w-16 text-right">
                {offering.enrolled}/{offering.capacity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
