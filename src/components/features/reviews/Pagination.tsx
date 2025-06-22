import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
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

  // 即使只有一頁也顯示分頁信息

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

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

        {/* 上一頁 */}
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

        {/* 頁碼顯示 */}
        <div className="flex items-center gap-2 mx-2">
          <span className="text-sm font-medium">
            {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
          </span>
        </div>

        {/* 下一頁 */}
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

        {/* 末頁 */}
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
      </div>
    </div>
  );
} 