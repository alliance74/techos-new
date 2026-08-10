'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { LucideIcon, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { EmptyState } from './EmptyState';
import { SkeletonTable } from './Skeleton';
import { Pagination } from './Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableFilter {
  key: string;
  label: string;
  options: DataTableFilterOption[];
}

export interface DataTableBulkAction<T> {
  label: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  onClick: (rows: T[]) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKeys?: string[];
  filters?: DataTableFilter[];
  /** Initial rows per page (user can change via the pager). */
  pageSize?: number;
  pageSizeOptions?: number[];
  selectable?: boolean;
  bulkActions?: DataTableBulkAction<T>[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  getRowId?: (row: T) => string | number;
  className?: string;
}

function getValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

function HeaderCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return <Checkbox ref={ref} checked={checked} onChange={onChange} aria-label="Select all rows" />;
}

export function DataTable<T>({
  columns,
  data,
  searchKeys,
  filters,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  selectable = false,
  bulkActions,
  onRowClick,
  isLoading = false,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your search or filters.',
  getRowId,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    setPageSize(initialPageSize);
    setPage(1);
  }, [initialPageSize]);

  const rowId = (row: T): string | number => (getRowId ? getRowId(row) : data.indexOf(row));

  const filtered = useMemo(() => {
    let result = data;

    if (search && searchKeys && searchKeys.length > 0) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((key) => {
          const value = getValue(row, key);
          return value != null && String(value).toLowerCase().includes(q);
        })
      );
    }

    if (filters) {
      for (const filter of filters) {
        const activeValue = activeFilters[filter.key];
        if (activeValue && activeValue !== 'all') {
          result = result.filter((row) => String(getValue(row, filter.key)) === activeValue);
        }
      }
    }

    return result;
  }, [data, search, searchKeys, filters, activeFilters]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const aVal = getValue(a, sortKey);
      const bVal = getValue(b, sortKey);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  );

  const resetToFirstPage = () => setPage(1);

  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortKey(null);
      setSortDirection('asc');
    }
  };

  const allSelected = paginated.length > 0 && paginated.every((row) => selectedIds.has(rowId(row)));
  const someSelected = !allSelected && paginated.some((row) => selectedIds.has(rowId(row)));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        paginated.forEach((row) => next.delete(rowId(row)));
      } else {
        paginated.forEach((row) => next.add(rowId(row)));
      }
      return next;
    });
  };

  const toggleRow = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedRows = useMemo(
    () => data.filter((row) => selectedIds.has(rowId(row))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, selectedIds, getRowId]
  );

  const activeFilterChips = useMemo(() => {
    if (!filters) return [];
    return filters
      .filter((f) => activeFilters[f.key] && activeFilters[f.key] !== 'all')
      .map((f) => ({
        key: f.key,
        label: f.options.find((o) => o.value === activeFilters[f.key])?.label ?? activeFilters[f.key],
      }));
  }, [filters, activeFilters]);

  const clearFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    resetToFirstPage();
  };

  const clearAllFilters = () => {
    setSearch('');
    setActiveFilters({});
    resetToFirstPage();
  };

  const hasToolbar = Boolean((searchKeys && searchKeys.length > 0) || (filters && filters.length > 0));
  const hasActiveFilters = Boolean(search) || activeFilterChips.length > 0;

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {hasToolbar && <div className="h-10 w-full max-w-sm bg-bg-muted rounded-md animate-pulse" />}
        <SkeletonTable columns={columns.length + (selectable ? 1 : 0)} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {hasToolbar && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {searchKeys && searchKeys.length > 0 && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetToFirstPage();
                }}
                placeholder="Search..."
                className="pl-9"
              />
            </div>
          )}
          {filters && filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Select
                  key={filter.key}
                  value={activeFilters[filter.key] ?? 'all'}
                  onChange={(e) => {
                    setActiveFilters((prev) => ({ ...prev, [filter.key]: e.target.value }));
                    resetToFirstPage();
                  }}
                  className="w-auto min-w-[140px]"
                >
                  <option value="all">All {filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              ))}
            </div>
          )}
        </div>
      )}

      {hasActiveFilters && activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <button key={chip.key} type="button" onClick={() => clearFilter(chip.key)} className="group">
              <Badge variant="default" className="gap-1 pr-1.5 group-hover:border-brand/40">
                {chip.label}
                <X className="h-3 w-3 text-ink-muted group-hover:text-ink-secondary" />
              </Badge>
            </button>
          ))}
          <button type="button" onClick={clearAllFilters} className="text-xs text-ink-muted hover:text-ink-secondary underline underline-offset-2">
            Clear all
          </button>
        </div>
      )}

      {selectable && bulkActions && bulkActions.length > 0 && selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-muted px-4 py-2.5">
          <span className="text-sm text-ink-secondary">
            <span className="font-medium text-ink">{selectedIds.size}</span> selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  size="sm"
                  variant={action.variant ?? 'secondary'}
                  onClick={() => action.onClick(selectedRows)}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="border border-border rounded-lg bg-surface">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-10">
                    <HeaderCheckbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    sortable={column.sortable}
                    sortDirection={sortKey === column.key ? sortDirection : null}
                    onSort={() => column.sortable && handleSort(column.key)}
                    className={column.className}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((row) => {
                const id = rowId(row);
                const isSelected = selectedIds.has(id);
                return (
                  <TableRow
                    key={id}
                    onClick={() => onRowClick?.(row)}
                    onKeyDown={(e) => {
                      if (!onRowClick) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'link' : undefined}
                    aria-label={onRowClick ? 'View details' : undefined}
                    className={cn(
                      'group/row',
                      onRowClick && 'cursor-pointer hover:bg-brand-mist/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-inset',
                      isSelected && 'bg-bg-muted',
                    )}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()} className="w-10">
                        <Checkbox checked={isSelected} onChange={() => toggleRow(id)} aria-label="Select row" />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render ? column.render(row) : String(getValue(row, column.key) ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={sorted.length}
            onChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            pageSizeOptions={pageSizeOptions}
          />
        </>
      )}
    </div>
  );
}
