import React from "react";
import { useEditorSettings } from "@/contexts/EditorContext";
import { Button } from "../../components/ui/button";
import { ZoomIn, ZoomOut, Eye, Ruler, List, Monitor, Layout as LayoutIcon, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

interface ViewTabProps {
  isMobile?: boolean;
  onFocusModeToggle?: () => void;
  isFocusMode?: boolean;
}

export function ViewTab({ isMobile = false, onFocusModeToggle, isFocusMode }: ViewTabProps) {
  const { settings, updateSettings } = useEditorSettings();
  const { zoom, viewMode, showRuler, showGridlines = false, showNavPane = false } = settings;

  const handleZoomIn = () => updateSettings({ zoom: Math.min(zoom + 10, 200) });
  const handleZoomOut = () => updateSettings({ zoom: Math.max(zoom - 10, 50) });
  const handleZoomSet = (val: number) => updateSettings({ zoom: val });
  const handleViewModeSet = (mode: 'print' | 'fluid' | 'split') => updateSettings({ viewMode: mode });

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* View Mode Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Views</span>
        <div className="flex items-center gap-1">
            <Button 
                variant={viewMode === 'print' ? "default" : "outline"} 
                size="sm" 
                className="h-8 gap-2"
                onClick={() => handleViewModeSet('print')}
            >
              <LayoutIcon className={cn("h-4 w-4", viewMode === 'print' ? "text-white" : "text-blue-600")} />
              <span className="text-xs">Print Layout</span>
            </Button>
            <Button 
                variant={viewMode === 'fluid' ? "default" : "outline"} 
                size="sm" 
                className="h-8 gap-2"
                onClick={() => handleViewModeSet('fluid')}
            >
              <Monitor className={cn("h-4 w-4", viewMode === 'fluid' ? "text-white" : "text-emerald-600")} />
              <span className="text-xs">Web Layout</span>
            </Button>
            <Button 
                variant={viewMode === 'split' ? "default" : "outline"} 
                size="sm" 
                className="h-8 gap-2"
                onClick={() => handleViewModeSet('split')}
                title="Split View (Editor & Live Preview)"
            >
              <span className={cn("material-symbols-outlined text-[18px]", viewMode === 'split' ? "text-white" : "text-purple-600")}>splitscreen</span>
              <span className="text-xs">Split View</span>
            </Button>
            <Button 
                variant={isFocusMode ? "default" : "outline"} 
                size="sm" 
                className="h-8 gap-2"
                onClick={onFocusModeToggle}
            >
              <Eye className="h-4 w-4 text-amber-600" />
              <span className="text-xs">Focus Mode</span>
            </Button>
        </div>
      </div>

      {/* Show/Hide Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Show</span>
        <div className="flex items-center gap-1">
            <Button 
                variant={showRuler ? "default" : "outline"} 
                size="sm" 
                className="h-8 gap-2"
                onClick={() => updateSettings({ showRuler: !showRuler })}
            >
              <Ruler className="h-4 w-4" />
              <span className="text-xs">Ruler</span>
            </Button>
            <Button 
                variant={showGridlines ? "default" : "outline"} 
                size="sm" 
                className="h-8 gap-2"
                onClick={() => updateSettings({ showGridlines: !showGridlines })}
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="text-xs">Gridlines</span>
            </Button>
            <Button 
                variant={showNavPane ? "default" : "outline"} 
                size="sm" 
                className="h-8 gap-2"
                onClick={() => updateSettings({ showNavPane: !showNavPane })}
            >
              <List className="h-4 w-4" />
              <span className="text-xs">Nav Pane</span>
            </Button>
        </div>
      </div>

      {/* Zoom Group */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zoom</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 min-w-[60px] text-xs font-mono">
                  {zoom}%
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {[50, 75, 100, 125, 150, 200].map((val) => (
                  <DropdownMenuItem key={val} onClick={() => handleZoomSet(val)}>
                    {val}%
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button 
                variant={zoom === 100 ? "default" : "outline"} 
                size="sm" 
                className="h-8 text-xs px-3" 
                onClick={() => handleZoomSet(100)}
            >
                100%
            </Button>
        </div>
      </div>
    </div>
  );
}
