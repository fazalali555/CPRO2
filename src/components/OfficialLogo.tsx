import React, { useMemo } from 'react';
import { getDepartmentLogoPath, detectDepartment } from '../utils';

interface OfficialLogoProps {
  className?: string;
  departmentType?: string;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({ className, departmentType }) => {
  // Enhanced detection for department across the project
  const detectedDept = useMemo(() => {
    if (departmentType && departmentType !== 'unknown') return departmentType;
    
    // Fallback detection from context/environment if prop is missing
    const keys = ['clerk_pro_rpms_office_profile', 'clerk_pro_clerk_office_profiles'];
    for (const key of keys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          // If it's a JSON string, try to extract office name
          const parsed = JSON.parse(saved);
          const profile = Array.isArray(parsed) ? parsed[0] : parsed;
          const officeName = profile?.office_title || profile?.office_name || '';
          if (officeName) {
            const detected = detectDepartment('', officeName);
            if (detected !== 'unknown' && detected !== 'default') return detected;
          }
        } catch {
          // If not JSON, try to detect from raw string
          const detected = detectDepartment(saved);
          if (detected !== 'unknown' && detected !== 'default') return detected;
        }
      }
    }
    
    // Check page title or URL as last resort
    const pageContext = (document.title + window.location.href).toLowerCase();
    const pageDetected = detectDepartment(pageContext);
    if (pageDetected !== 'unknown' && pageDetected !== 'default') return pageDetected;
    
    return 'education'; // Default to education for this project
  }, [departmentType]);

  const logoPath = getDepartmentLogoPath(detectedDept);
  
  return (
    <img 
      src={logoPath} 
      alt={`${detectedDept} Department Logo`} 
      className={`object-contain ${className || 'w-20 h-20'}`}
      onError={(e) => {
        // Fallback logic to KP_logo.png if specific logo fails
        const target = e.target as HTMLImageElement;
        if (!target.src.includes('KP_logo.png')) {
          target.src = '/assets/KP_logo.png';
        }
      }}
    />
  );
};
