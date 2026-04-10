
import React from 'react';

interface ProjectLogoProps {
  className?: string;
}

export const ProjectLogo: React.FC<ProjectLogoProps> = ({ className }) => {
  return (
    <img 
      src="/assets/project-logo.png" 
      alt="Clerk Pro Application Logo" 
      className={`object-contain ${className || 'w-20 h-20'}`}
      onError={(e) => {
        // Fallback if image missing
        e.currentTarget.onerror = null;
        e.currentTarget.src = 'https://via.placeholder.com/150/006c4c/ffffff?text=CP';
      }}
    />
  );
};
