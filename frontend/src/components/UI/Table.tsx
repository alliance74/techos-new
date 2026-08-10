import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto border border-border rounded-xl bg-surface shadow-sm">
      <table className={cn('w-full text-sm text-left text-ink-secondary', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { children: React.ReactNode }) {
  return (
    <thead className={cn('bg-bg-muted border-b border-border', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement> & { children: React.ReactNode }) {
  return (
    <tbody className={cn('divide-y divide-border bg-surface', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { children: React.ReactNode }) {
  return (
    <tr className={cn('hover:bg-surface-hover transition-colors', className)} {...props}>
      {children}
    </tr>
  );
}

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export function TableHead({
  className,
  children,
  sortable = false,
  sortDirection,
  onSort,
  ...props
}: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-6 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider',
        sortable && 'cursor-pointer select-none hover:bg-surface-active',
        className,
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <div className="flex flex-col">
            <ChevronUp
              className={cn(
                'h-3 w-3 -mb-1',
                sortDirection === 'asc' ? 'text-brand' : 'text-ink-muted/50',
              )}
            />
            <ChevronDown
              className={cn(
                'h-3 w-3',
                sortDirection === 'desc' ? 'text-brand' : 'text-ink-muted/50',
              )}
            />
          </div>
        )}
      </div>
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }) {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap text-ink-secondary', className)} {...props}>
      {children}
    </td>
  );
}
