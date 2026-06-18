import React, { useState, useEffect } from "react";
import { useEditorMetrics, useEditorSettings, useEditorInstance } from "@/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { ZoomIn, ZoomOut, CloudCheck, Layout, Monitor, Maximize2, Globe, CheckCircle, AlertCircle, Cloud } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface StatusBarProps {
  className?: string;
}

/**
 * Status bar showing word count, character count, reading time, and zoom control
 */
export function StatusBar({
  className,
}: StatusBarProps) {
  const editor = useEditorInstance();
  const { wordCount, charCount, currentPage, totalPages } = useEditorMetrics() || { wordCount: 0, charCount: 0, currentPage: 1, totalPages: 1 };
  const { settings, updateSettings } = useEditorSettings();
  const { zoom, viewMode } = settings;
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => setIsDirty(true);
    editor.on('update', handleUpdate);
    return () => { editor.off('update', handleUpdate); };
  }, [editor]);

  const readingTime = Math.ceil(wordCount / 200);

  const handleZoomIn = () => updateSettings({ zoom: Math.min(zoom + 10, 200) });
  const handleZoomOut = () => updateSettings({ zoom: Math.max(zoom - 10, 50) });

  return (
    <div
      className={cn(
        "border-t bg-white px-4 py-1.5 flex items-center justify-between text-[11px] text-gray-500 font-medium select-none h-9",
        className
      )}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-400">PAGE</span>
          <span className="text-blue-600">{currentPage} of {totalPages}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
          <span className="font-bold text-gray-400">WORDS:</span>
          <span className="font-mono text-blue-600">{wordCount}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
          <span className="font-bold text-gray-400">CHARS:</span>
          <span className="font-mono text-blue-600">{charCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-400 uppercase">Reading:</span>
          <span>{readingTime} min</span>
        </div>

        <div className="w-px h-4 bg-gray-200" />

        <div className={cn("flex items-center gap-2", isDirty ? "text-amber-600" : "text-emerald-600")}>
            {isDirty ? <Cloud className="h-3.5 w-3.5" /> : <CloudCheck className="h-3.5 w-3.5" />}
            <span className="uppercase tracking-tight text-[10px]">{isDirty ? "Unsaved Changes" : "Saved"}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-gray-400 hover:text-blue-600 outline-none transition-colors">
                <Globe className="h-3 w-3" />
                <span>English (Pakistan)</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             <DropdownMenuItem>English (United States)</DropdownMenuItem>
             <DropdownMenuItem>English (United Kingdom)</DropdownMenuItem>
             <DropdownMenuItem>English (Pakistan)</DropdownMenuItem>
             <DropdownMenuItem>Urdu (Pakistan) - اردو</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex items-center gap-1 text-emerald-600">
            <CheckCircle className="h-3 w-3" />
            <span className="text-[10px]">No issues</span>
        </div>

        <div className="w-px h-4 bg-gray-200" />

        <div className="flex items-center gap-2 mr-2">
            <button onClick={() => updateSettings({ viewMode: 'print' })} className={cn("p-1 rounded transition-colors", viewMode === 'print' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100")}>
               <Layout className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => updateSettings({ viewMode: 'fluid' })} className={cn("p-1 rounded transition-colors", viewMode === 'fluid' ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100")}>
               <Monitor className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 rounded hover:bg-gray-100 transition-colors">
               <Maximize2 className="h-3.5 w-3.5" />
            </button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="h-7 w-7 p-0"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <input 
            type="range" 
            min="50" 
            max="200" 
            step="10" 
            value={zoom} 
            onChange={(e) => updateSettings({ zoom: parseInt(e.target.value) })}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="w-10 text-center text-[10px] font-bold">{zoom}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="h-7 w-7 p-0"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
