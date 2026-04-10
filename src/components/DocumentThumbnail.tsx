
import React from 'react';
import { AppIcon } from './AppIcon';
import clsx from 'clsx';

interface DocumentThumbnailProps {
  title: string;
  children: React.ReactNode;
  orientation?: 'portrait' | 'landscape';
  onPreview: () => void;
  onPrint: () => void;
  isExpanded?: boolean;
  printedAt?: string;
}

export const DocumentThumbnail: React.FC<DocumentThumbnailProps> = ({ 
  title, 
  children, 
  orientation = 'portrait', 
  onPreview, 
  onPrint,
  isExpanded = false,
  printedAt
}) => {
  // Scale Factors
  // Portrait: A4 is 210mm width. We want card width ~300px on screen.
  // Landscape: A4 is 297mm width.
  const scale = orientation === 'portrait' ? 0.35 : 0.25;
  
  // Container Dimensions (Scaled)
  const containerHeight = orientation === 'portrait' ? '393px' : '200px';

  return (
    <div className={clsx("flex flex-col bg-surface-container-low border border-outline-variant/50 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-elevation-2 group", isExpanded && "ring-2 ring-primary")}>
      
      {/* Thumbnail Area */}
      <div 
        className="relative bg-white overflow-hidden cursor-pointer w-full flex justify-center bg-gray-50/50"
        style={{ height: containerHeight }}
        onClick={onPreview}
      >
        <div 
          className="origin-top transform pointer-events-none select-none shadow-lg bg-white"
          style={{ 
            transform: `scale(${scale})`,
            width: orientation === 'portrait' ? '210mm' : '297mm',
            height: orientation === 'portrait' ? '297mm' : '210mm',
            marginTop: '10px' // Padding from top
          }}
        >
          {children}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
           <div className="bg-primary text-on-primary px-4 py-2 rounded-full shadow-elevation-2 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
             <AppIcon name="visibility" size={18} />
             <span className="text-sm font-bold">Preview</span>
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-surface border-t border-outline-variant/30 flex items-center justify-between gap-2">
         <div className="flex-1 min-w-0">
           <h4 className="font-bold text-sm text-on-surface truncate" title={title}>{title}</h4>
           {printedAt && <span className="text-[10px] text-green-700 font-bold flex items-center gap-0.5"><AppIcon name="check_circle" size={12} filled /> Printed</span>}
         </div>
         <div className="flex gap-1 shrink-0">
            <button 
              onClick={onPreview} 
              className={clsx("p-2 rounded-full hover:bg-surface-variant text-on-surface-variant", isExpanded && "bg-secondary-container text-on-secondary-container")} 
              title={isExpanded ? "Close Preview" : "Open Preview"}
            >
              <AppIcon name={isExpanded ? "expand_less" : "expand_more"} size={20} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onPrint(); }} 
              className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-primary"
              title="Print"
            >
              <AppIcon name="print" size={20} />
            </button>
         </div>
      </div>
    </div>
  );
};
