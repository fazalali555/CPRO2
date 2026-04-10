import React from 'react';
import clsx from 'clsx';
import { AppIcon } from './AppIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const DataTable = <T extends { id: string }>({ 
  data, 
  columns, 
  onRowClick, 
  isLoading,
  emptyMessage = "No records found matching your filters."
}: DataTableProps<T>) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-16 bg-surface-variant/20 rounded-2xl animate-pulse flex items-center px-6 gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-variant/30" />
            <div className="h-4 bg-surface-variant/30 rounded w-1/4" />
            <div className="h-4 bg-surface-variant/30 rounded w-1/4 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="hidden md:block overflow-hidden rounded-[32px] border border-outline-variant/30 bg-surface shadow-elevation-1">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
            <tr className="border-b border-outline-variant/30">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={clsx(
                    "px-6 py-5 text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant", 
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            <AnimatePresence mode="popLayout">
              {data.map((item, rowIdx) => (
                <motion.tr 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: rowIdx * 0.03 }}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={clsx(
                    "transition-all cursor-pointer group hover:bg-primary/[0.03] active:bg-primary/[0.06]",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col, idx) => (
                    <td key={idx} className={clsx("px-6 py-5 text-sm text-on-surface group-hover:text-primary transition-colors", col.className)}>
                      {col.accessor(item)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {data.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-[32px] bg-surface-container flex items-center justify-center mb-6 text-outline-variant">
              <AppIcon name="search_off" size={40} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">No Results Found</h3>
            <p className="text-on-surface-variant max-w-xs mx-auto">
              {emptyMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
