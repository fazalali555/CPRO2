import React from "react";

interface RulersProps {
  zoom: number;
  pageWidth: number;
  pageHeight: number;
}

/**
 * Horizontal ruler component
 */
export function HorizontalRuler({ zoom, pageWidth }: { zoom: number; pageWidth: number }) {
  const scaledWidth = (pageWidth * zoom) / 100;
  const inchMarks = Math.ceil(scaledWidth / 96); // 96px = 1 inch at 100% zoom

  return (
    <div className="h-6 bg-gray-100 border-b border-gray-300 flex items-end overflow-hidden">
      <div className="flex h-full" style={{ width: `${scaledWidth}px` }}>
        {Array.from({ length: inchMarks * 16 }).map((_, i) => {
          const isMajor = i % 16 === 0;
          const isHalf = i % 8 === 0 && i % 16 !== 0;

          return (
            <div
              key={i}
              className={`flex-shrink-0 ${isMajor ? "border-l-2 border-gray-700" : isHalf ? "border-l border-gray-500" : "border-l border-gray-300"}`}
              style={{
                height: isMajor ? "100%" : isHalf ? "60%" : "40%",
                width: `${96 / 16 / (zoom / 100)}px`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Vertical ruler component
 */
export function VerticalRuler({ zoom, pageHeight }: { zoom: number; pageHeight: number }) {
  const scaledHeight = (pageHeight * zoom) / 100;
  const inchMarks = Math.ceil(scaledHeight / 96);

  return (
    <div className="w-6 bg-gray-100 border-r border-gray-300 flex flex-col items-end overflow-hidden">
      <div className="flex flex-col h-full" style={{ height: `${scaledHeight}px` }}>
        {Array.from({ length: inchMarks * 16 }).map((_, i) => {
          const isMajor = i % 16 === 0;
          const isHalf = i % 8 === 0 && i % 16 !== 0;

          return (
            <div
              key={i}
              className={`flex-shrink-0 ${isMajor ? "border-t-2 border-gray-700" : isHalf ? "border-t border-gray-500" : "border-t border-gray-300"}`}
              style={{
                width: isMajor ? "100%" : isHalf ? "60%" : "40%",
                height: `${96 / 16 / (zoom / 100)}px`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Corner element for ruler intersection
 */
export function RulerCorner() {
  return <div className="w-6 h-6 bg-gray-100 border-r border-b border-gray-300" />;
}
