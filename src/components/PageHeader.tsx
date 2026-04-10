import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 no-print">
      <div>
        <h2 className="text-3xl font-normal text-on-surface tracking-tight">{title}</h2>
        {subtitle && <p className="text-on-surface-variant text-sm mt-1">{subtitle}</p>}
      </div>
      {action && (
        <div className="flex items-center gap-2 self-start sm:self-center">
          {action}
        </div>
      )}
    </div>
  );
};
