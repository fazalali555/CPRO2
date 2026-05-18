import React from "react";
import { useEditorContext } from "../../contexts/EditorContext";
import { Button } from "../../components/ui/button";
import { Maximize2, RotateCw, FileText, Hash, Stamp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../../components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

interface LayoutTabProps {
  isMobile?: boolean;
}

export function LayoutTab({ isMobile = false }: LayoutTabProps) {
  const { 
    margins, setMargins, 
    orientation, setOrientation, 
    paperSize, setPaperSize,
    watermark, setWatermark,
    showPageNumbers, setShowPageNumbers
  } = useEditorContext();

  const [watermarkInput, setWatermarkInput] = React.useState(watermark);

  const handleMarginChange = (type: "normal" | "narrow" | "wide") => {
    switch (type) {
      case "normal":
        setMargins({ top: 25, right: 20, bottom: 25, left: 25 });
        break;
      case "narrow":
        setMargins({ top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 });
        break;
      case "wide":
        setMargins({ top: 25, right: 50, bottom: 25, left: 50 });
        break;
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setOrientation(orientation === "portrait" ? "landscape" : "portrait")}>
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {/* Margins */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Maximize2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs">Margins</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleMarginChange("normal")}>
              Normal (25mm Top/Bottom, 20mm Left/Right)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMarginChange("narrow")}>
              Narrow (12.7mm)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMarginChange("wide")}>
              Wide (50mm Left/Right)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Orientation */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <RotateCw className="h-4 w-4 text-amber-600" />
              <span className="text-xs">Orientation</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setOrientation("portrait")}>
              Portrait
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOrientation("landscape")}>
              Landscape
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Paper Size */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              <span className="text-xs">Size</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setPaperSize("A4")}>A4 (210 x 297 mm)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaperSize("Letter")}>Letter (216 x 279 mm)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaperSize("Legal")}>Legal (216 x 356 mm)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Page Numbers */}
        <Button 
            variant={showPageNumbers ? "default" : "outline"} 
            size="sm" 
            className="h-8 gap-2"
            onClick={() => setShowPageNumbers(!showPageNumbers)}
        >
          <Hash className="h-4 w-4" />
          <span className="text-xs">Page Numbers</span>
        </Button>

        {/* Watermark Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant={watermark ? "default" : "outline"} size="sm" className="h-8 gap-2">
              <Stamp className="h-4 w-4" />
              <span className="text-xs">Watermark</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Document Watermark</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Watermark Text</Label>
                    <Input 
                        value={watermarkInput} 
                        onChange={(e) => setWatermarkInput(e.target.value)}
                        placeholder="e.g. DRAFT, CONFIDENTIAL, URGENT"
                    />
                </div>
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => { setWatermark(""); setWatermarkInput(""); }}>
                        Clear Watermark
                    </Button>
                    <Button onClick={() => setWatermark(watermarkInput)}>
                        Apply Watermark
                    </Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <div className="w-px h-6 bg-gray-300 mx-2" />
        
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <span className="text-xs font-bold text-gray-500">Page Setup</span>
        </Button>
      </div>
    </div>
  );
}
