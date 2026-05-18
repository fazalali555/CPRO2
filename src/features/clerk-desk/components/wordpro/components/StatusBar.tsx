import React, { useState } from "react";
import { useEditorContext } from "../contexts/EditorContext";
import { cn } from "../lib/utils";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "../components/ui/button";

interface StatusBarProps {
  className?: string;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

/**
 * Status bar showing word count, character count, reading time, and zoom control
 */
export function StatusBar({
  className,
}: StatusBarProps) {
  const editor = useEditorContext();
  const { zoom, setZoom } = editor;
  const wordCount = editor.getWordCount();
  const characterCount = editor.getCharacterCount();
  const readingTime = editor.getReadingTime();

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 10, 200);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 10, 50);
    setZoom(newZoom);
  };
return (
  <div
    className={cn(
      "border-t bg-white px-4 py-2 flex items-center justify-between text-[11px] text-gray-500 font-medium select-none",
      className
    )}
  >
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
        <span className="font-bold text-gray-400">WORDS:</span>
        <span className="font-mono text-blue-600">{wordCount}</span>
      </div>
      <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
        <span className="font-bold text-gray-400">CHARS:</span>
        <span className="font-mono text-blue-600">{characterCount}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-bold text-gray-400 uppercase">Reading:</span>
        <span>{readingTime} min</span>
      </div>

      <div className="w-px h-4 bg-gray-200" />

      <div className="flex items-center gap-2 text-emerald-600">
          <span className="material-symbols-outlined text-[14px]">cloud_done</span>
          <span className="uppercase tracking-tight">Saved to local storage</span>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 text-gray-400 italic">
          <span>English (United States)</span>
      </div>
...

        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-xs font-semibold">{zoom}%</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
