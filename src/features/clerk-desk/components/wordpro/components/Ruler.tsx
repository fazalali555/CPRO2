import React from "react";
import { cn } from "../lib/utils";

interface RulerProps {
  width: number;
  leftMargin: number;
  rightMargin: number;
  unit?: "mm" | "in";
  className?: string;
}

/**
 * Horizontal ruler component for WordPro
 */
export function HorizontalRuler({
  width,
  leftMargin,
  rightMargin,
  unit = "mm",
  className,
}: RulerProps) {
  // Convert mm to pixels (approximate 1mm = 3.78px at 96dpi)
  // But for the ruler we'll use a relative scale based on the width
  
  const ticks = [];
  const totalUnits = Math.ceil(width);

  for (let i = 0; i <= totalUnits; i++) {
    const isMajor = i % 10 === 0;
    const isMid = i % 5 === 0 && !isMajor;
    
    ticks.push(
      <div
        key={i}
        className={cn(
          "absolute bottom-0 border-l border-gray-400",
          isMajor ? "h-3" : isMid ? "h-2" : "h-1"
        )}
        style={{ left: `${(i / width) * 100}%` }}
      >
        {isMajor && i > 0 && (
          <span className="absolute -top-4 -left-2 text-[8px] text-gray-500 font-mono">
            {i}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative h-6 bg-gray-50 border-b border-gray-300 select-none", className)}>
      {/* Ticks */}
      <div className="absolute inset-x-0 bottom-0 h-full">
        {ticks}
      </div>

      {/* Margin Overlays */}
      {/* Left Margin */}
      <div 
        className="absolute inset-y-0 left-0 bg-gray-200/50 border-r border-blue-400/50"
        style={{ width: `${(leftMargin / width) * 100}%` }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-white border border-gray-400 rounded-sm -mr-1 z-10 cursor-col-resize shadow-sm" />
      </div>

      {/* Right Margin */}
      <div 
        className="absolute inset-y-0 right-0 bg-gray-200/50 border-l border-blue-400/50"
        style={{ width: `${(rightMargin / width) * 100}%` }}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-white border border-gray-400 rounded-sm -ml-1 z-10 cursor-col-resize shadow-sm" />
      </div>

      {/* Active Area Indicator */}
      <div 
        className="absolute bottom-0 h-0.5 bg-blue-500/20"
        style={{ 
          left: `${(leftMargin / width) * 100}%`,
          right: `${(rightMargin / width) * 100}%`
        }}
      />
    </div>
  );
}
