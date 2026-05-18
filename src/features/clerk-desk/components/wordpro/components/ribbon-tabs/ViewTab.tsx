import React from "react";
import { useEditorContext } from "../../contexts/EditorContext";
import { Button } from "../../components/ui/button";
import { ZoomIn, ZoomOut, Eye, Ruler, List, Monitor } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

interface ViewTabProps {
  isMobile?: boolean;
}

export function ViewTab({ isMobile = false }: ViewTabProps) {
  const { zoom, setZoom } = useEditorContext();

  const handleZoomIn = () => setZoom(Math.min(zoom + 10, 200));
  const handleZoomOut = () => setZoom(Math.max(zoom - 10, 50));
  const handleZoomSet = (val: number) => setZoom(val);

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
interface ViewTabProps {
  isMobile?: boolean;
  onFocusModeToggle?: () => void;
  isFocusMode?: boolean;
}
...
      {/* Views Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Views</span>
        <div className="flex items-center gap-1">
            <Button variant="default" size="sm" className="h-8 gap-2 bg-blue-600">
                <Eye className="h-4 w-4" />
                <span className="text-xs">Print Layout</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={onFocusModeToggle}>
                <Monitor className="h-4 w-4" />
                <span className="text-xs">Focus Mode</span>
            </Button>
        </div>
      </div>

      {/* Show Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Show</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2">
                <Ruler className="h-4 w-4" />
                <span className="text-xs">Ruler</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2">
                <List className="h-4 w-4" />
                <span className="text-xs">Navigation Pane</span>
            </Button>
        </div>
      </div>

      {/* Zoom Group */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zoom</span>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
                <span className="text-xs">Zoom In</span>
            </Button>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-16 text-xs font-bold">
                        {zoom}%
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleZoomSet(200)}>200%</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleZoomSet(150)}>150%</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleZoomSet(125)}>125%</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleZoomSet(100)}>100% (Default)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleZoomSet(75)}>75%</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleZoomSet(50)}>50%</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
                <span className="text-xs">Zoom Out</span>
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <Button variant="outline" size="sm" className="h-8 text-xs px-3" onClick={() => handleZoomSet(100)}>
                100%
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs px-3">
                One Page
            </Button>
        </div>
      </div>
    </div>
  );
}
