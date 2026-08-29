import * as React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  emptyState?: React.ReactNode;
  rowKey: (item: T) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  className,
  emptyState = <div className="p-4 text-center text-[12px] text-[--color-text-secondary]">No data available</div>,
  rowKey,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[--color-border-strong]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[--color-text-tertiary] whitespace-nowrap',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center'
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[13px] text-[--color-text-primary]">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-4">
                {emptyState}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={rowKey(item)}
                className="border-b border-[--color-border-strong] hover:bg-[--color-bg-hover] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2.5',
                      col.align === 'right' && 'text-right tabular-nums',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {col.render(item, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
