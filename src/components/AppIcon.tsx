import React from 'react';

interface AppIconProps {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = 24, filled = false, className = '' }) => {
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
