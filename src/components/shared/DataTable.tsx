import React from 'react';
import { Card, EmptyState } from '../M3';
import { useLanguage } from '../../contexts/LanguageContext';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyState?: {
    icon: string;
    title: string;
    description: string;
  };
  onRowClick?: (item: T, index: number) => void;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  emptyState,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const { isUrdu } = useLanguage();

  if (data.length === 0 && emptyState) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <Card variant="filled" className={`bg-surface-container-low p-0 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${isUrdu ? 'text-right' : 'text-left'}`}>
          <thead className="bg-surface-variant/30 border-b border-outline-variant/30">
            <tr className={isUrdu ? 'flex-row-reverse' : ''}>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-bold ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {data.map((item, index) => (
              <tr
                key={item.id}
                className={`hover:bg-surface-variant/10 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 ${column.className || ''}`}
                  >
                    {column.render(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
