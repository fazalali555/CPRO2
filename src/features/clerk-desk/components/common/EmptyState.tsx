// components/common/EmptyState.tsx

import React from 'react';
import { Button } from '../../../../components/M3';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-20 h-20 rounded-full bg-surface-variant/30 flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">
          {icon}
        </span>
      </div>
      
      <h3 className="text-lg font-semibold text-on-surface mb-2 text-center">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-on-surface-variant text-center max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          variant="filled"
          label={action.label}
          icon={action.icon}
          onClick={action.onClick}
        />
      )}
    </div>
  );
};