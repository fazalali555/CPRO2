import React from 'react';

interface OfficialLogoProps {
  className?: string;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({ className }) => {
  return (
    <img 
      src="/assets/logo.png" 
      alt="Government of Khyber Pakhtunkhwa Education Department Logo" 
      className={`object-contain ${className || 'w-20 h-20'}`}
    />
  );
};
