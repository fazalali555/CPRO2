import React from 'react';
import { Card } from './M3';

interface MobileListCardProps {
  title: string;
  subtitle: string;
  meta: React.ReactNode;
  onClick?: () => void;
  avatar?: string | React.ReactNode;
  action?: React.ReactNode;
}

export const MobileListCard: React.FC<MobileListCardProps> = ({ title, subtitle, meta, onClick, avatar, action }) => {
  return (
    <Card 
      variant="elevated" 
      onClick={onClick}
      className="flex flex-col gap-3 relative md:hidden active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start gap-4">
        {avatar && (
           <div className="shrink-0">
             {typeof avatar === 'string' ? (
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                  {avatar}
                </div>
             ) : avatar}
           </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-on-surface text-base leading-tight truncate">{title}</h3>
          <p className="text-sm text-on-surface-variant truncate mt-0.5">{subtitle}</p>
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        )}
      </div>
      <div className="h-px bg-outline-variant/20 w-full" />
      <div className="text-xs text-on-surface-variant/80 flex items-center justify-between">
        {meta}
      </div>
    </Card>
  );
};
