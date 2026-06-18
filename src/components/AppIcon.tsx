import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AppIconProps {
  name?: string;
  icon?: LucideIcon;
  size?: number;
  filled?: boolean;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, icon: Icon, size = 24, filled = false, className = '' }) => {
  if (Icon) {
    return <Icon size={size} className={className} aria-hidden="true" />;
  }

  return (
    <span 
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      style={{ fontSize: `${size}px`, userSelect: 'none' }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};
