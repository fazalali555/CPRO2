// components/common/StatCard.tsx

import React from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'primary',
  onClick,
  className = '',
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
  };

  const valueColorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-info',
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl bg-surface border border-outline/20
        hover:shadow-lg hover:shadow-surface-variant/20
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:border-outline/40' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-on-surface-variant uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <span className="material-symbols-outlined text-lg">{icon}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div className={`text-3xl font-bold ${valueColorClasses[color]}`}>
          {value}
        </div>
        
        {trend && (
          <div className={`flex items-center text-sm ${
            trend.isPositive ? 'text-success' : 'text-error'
          }`}>
            <span className="material-symbols-outlined text-sm">
              {trend.isPositive ? 'trending_up' : 'trending_down'}
            </span>
            <span className="ml-1">{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Grid of stat cards
interface StatsGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  columns = 4,
  className = '',
}) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};