import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems
}: PaginationProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  // 即使只有一頁也顯示分頁信息

  // 鍵盤快捷鍵：← 上一頁、→ 下一頁、Home 首頁、End 末頁
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略修飾鍵組合（避免與瀏覽器／系統快捷鍵衝突）
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      // 忽略在輸入元素中的按鍵
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (currentPage > 1) {
            e.preventDefault();
            onPageChange(currentPage - 1);
          }
          break;
        case 'ArrowRight':
          if (currentPage < totalPages) {
            e.preventDefault();
            onPageChange(currentPage + 1);
          }
          break;
        case 'Home':
          if (currentPage !== 1) {
            e.preventDefault();
            onPageChange(1);
          }
          break;
        case 'End':
          if (currentPage !== totalPages) {
            e.preventDefault();
            onPageChange(totalPages);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange]);

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // 桌面版顯示鍵盤快捷鍵提示；手機版不顯示（沒有鍵盤，且避免攔截點擊）
  // 以 span 包裹按鈕，讓按鈕在 disabled（pointer-events-none）時 hover 仍能觸發提示
  const withShortcutHint = (hint: string, node: React.ReactNode) => {
    if (isMobile) return node;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{node}</span>
        </TooltipTrigger>
        <TooltipContent>{hint}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
      {/* 顯示當前頁面信息 */}
      <div className="text-sm text-muted-foreground">
        {t('pagination.showingItems', {
          start: startItem,
          end: endItem,
          total: totalItems
        })}
      </div>

      {/* 分頁按鈕 */}
      <div className="flex items-center gap-2">
        {/* 首頁 */}
        {withShortcutHint(t('pagination.firstTooltip'), (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="h-9 px-3"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">{t('pagination.first')}</span>
          </Button>
        ))}

        {/* 上一頁 */}
        {withShortcutHint(t('pagination.previousTooltip'), (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-9 px-3"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">{t('pagination.previous')}</span>
          </Button>
        ))}

        {/* 頁碼顯示 */}
        <div className="flex items-center gap-2 mx-2">
          <span className="text-sm font-medium">
            {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
          </span>
        </div>

        {/* 下一頁 */}
        {withShortcutHint(t('pagination.nextTooltip'), (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-9 px-3"
          >
            <span className="hidden sm:inline mr-1">{t('pagination.next')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ))}

        {/* 末頁 */}
        {withShortcutHint(t('pagination.lastTooltip'), (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="h-9 px-3"
          >
            <span className="hidden sm:inline mr-1">{t('pagination.last')}</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
} 