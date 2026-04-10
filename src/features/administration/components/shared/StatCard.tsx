import React from 'react';
import { Card } from '../../../../components/M3';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const { isUrdu } = useLanguage();
  
  return (
    <Card 
      variant="outlined" 
      className={`p-4 bg-surface flex items-center gap-4 ${isUrdu ? 'flex-row-reverse' : ''}`}
    >
      <div className={`p-2 rounded-lg bg-surface-variant/30 ${color}`}>
        <AppIcon name={icon} size={24} />
      </div>
      <div className={isUrdu ? 'text-right' : ''}>
        <div className="text-xl font-bold text-on-surface">{value}</div>
        <div className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">
          {label}
        </div>
      </div>
    </Card>
  );
};
