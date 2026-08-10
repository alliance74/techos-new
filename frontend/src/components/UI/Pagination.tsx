'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  /** When set, shows a rows-per-page selector. */
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  siblingCount?: number;
  /** Keep the summary visible even when there's only one page. Default true. */
  showSummary?: boolean;
}

const DOTS = 'DOTS';
const DEFAULT_PAGE_SIZES = [10, 25, 50];

function getPageRange(currentPage: number, totalPages: number, siblingCount: number) {
  const totalNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < totalPages - 1;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + siblingCount * 2 }, (_, i) => i + 1);
    return [...leftRange, DOTS, totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => totalPages - (3 + siblingCount * 2) + i + 1,
    );
    return [1, DOTS, ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  );
  return [1, DOTS, ...middleRange, DOTS, totalPages];
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className,
  siblingCount = 1,
  showSummary = true,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = getPageRange(page, totalPages, siblingCount);
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const showControls = totalPages > 1;

  const goTo = (target: number) => {
    if (target < 1 || target > totalPages || target === page) return;
    onChange(target);
  };

  if (total === 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 pt-1',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        {showSummary && (
          <p className="text-sm text-ink-muted">
            Showing <span className="font-medium text-ink-secondary">{startItem}</span>–
            <span className="font-medium text-ink-secondary">{endItem}</span> of{' '}
            <span className="font-medium text-ink-secondary">{total}</span>
          </p>
        )}
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <span className="whitespace-nowrap">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-surface px-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {showControls && (
        <ul className="flex items-center gap-1">
          <li>
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-ink-secondary hover:bg-bg-muted disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </li>
          {pages.map((p, i) =>
            p === DOTS ? (
              <li key={`dots-${i}`} className="h-8 w-8 flex items-center justify-center text-ink-muted">
                <MoreHorizontal className="h-4 w-4" />
              </li>
            ) : (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => goTo(p as number)}
                  aria-current={p === page ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
                    p === page
                      ? 'bg-brand text-ink-inverse shadow-sm'
                      : 'text-ink-secondary border border-transparent hover:bg-bg-muted',
                  )}
                >
                  {p}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-ink-secondary hover:bg-bg-muted disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}
