import React from "react";
import { useEditorSettings, useEditorInstance } from "@/contexts/EditorContext";
import { Button } from "../../components/ui/button";
import { Maximize2, RotateCw, FileText, Hash, Stamp, Palette, Columns } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { toast } from "sonner";

interface LayoutTabProps {
  isMobile?: boolean;
}

export function LayoutTab({ isMobile = false }: LayoutTabProps) {
  const { settings, updateSettings } = useEditorSettings();
  const editor = useEditorInstance();
  const { margins, orientation, pageSize: paperSize, watermark = "", showPageNumbers = false } = settings;

  const [watermarkInput, setWatermarkInput] = React.useState(watermark);
  const [customMargins, setCustomMargins] = React.useState(margins);
  const [openWatermark, setOpenWatermark] = React.useState(false);
  const [openMargins, setOpenMargins] = React.useState(false);

  const handleMarginChange = (type: "normal" | "narrow" | "wide") => {
    switch (type) {
      case "normal":
        updateSettings({ margins: { top: 25.4, right: 31.75, bottom: 25.4, left: 31.75 } });
        break;
      case "narrow":
        updateSettings({ margins: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 } });
        break;
      case "wide":
        updateSettings({ margins: { top: 25.4, right: 50.8, bottom: 25.4, left: 50.8 } });
        break;
    }
  };

  const applyCustomMargins = () => {
    updateSettings({ margins: customMargins });
    setOpenMargins(false);
    toast.success("Custom margins applied");
  };

  const applyWatermark = () => {
    updateSettings({ watermark: watermarkInput });
    setOpenWatermark(false);
    toast.success(watermarkInput ? "Watermark applied" : "Watermark cleared");
  };

  const handleSpacing = (type: 'margin-top' | 'margin-bottom', val: string) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('paragraph', {
       style: `${type}: ${val}pt`
    }).run();
  };

  const handleIndentation = (val: string) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('paragraph', {
       style: `margin-left: ${val}mm`
    }).run();
  };

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => updateSettings({ orientation: orientation === "portrait" ? "landscape" : "portrait" })}>
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setOpenMargins(true)}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Page Setup Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Page Setup</span>
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
              <DropdownMenuItem onClick={() => handleMarginChange("normal")}>Normal (25.4mm x 31.75mm)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMarginChange("narrow")}>Narrow (12.7mm)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMarginChange("wide")}>Wide (25.4mm x 50.8mm)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenMargins(true)}>Custom Margins...</DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => updateSettings({ orientation: "portrait" })}>Portrait</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSettings({ orientation: "landscape" })}>Landscape</DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => updateSettings({ pageSize: "A4" })}>A4</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSettings({ pageSize: "Letter" })}>Letter</DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateSettings({ pageSize: "Legal" })}>Legal</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Columns className="h-4 w-4 text-purple-600" />
                <span className="text-xs">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => {}}>1 Column</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>2 Columns</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>3 Columns</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Paragraph Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paragraph</span>
        <div className="flex items-center gap-4">
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                 <Label className="text-[10px] w-10">Before:</Label>
                 <Input type="number" className="h-6 w-14 text-xs" defaultValue={0} onChange={e => handleSpacing('margin-top', e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                 <Label className="text-[10px] w-10">After:</Label>
                 <Input type="number" className="h-6 w-14 text-xs" defaultValue={8} onChange={e => handleSpacing('margin-bottom', e.target.value)} />
              </div>
           </div>
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                 <Label className="text-[10px] w-10">Indent:</Label>
                 <Input type="number" className="h-6 w-14 text-xs" defaultValue={0} onChange={e => handleIndentation(e.target.value)} />
              </div>
           </div>
        </div>
      </div>

      {/* Page Background Group */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Background</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setOpenWatermark(true)}>
            <Stamp className="h-4 w-4 text-orange-500" />
            <span className="text-xs">Watermark</span>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Palette className="h-4 w-4 text-pink-500" />
                <span className="text-xs">Page Color</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
               <div className="grid grid-cols-4 gap-2">
                  {['#ffffff', '#f8f9fa', '#fff5f5', '#fff9db', '#f3f0ff', '#e7f5ff', '#e6fcf5', '#f1f3f5'].map(c => (
                    <button key={c} className="w-6 h-6 rounded border border-gray-200" style={{ background: c }} onClick={() => updateSettings({ pageColor: c })} />
                  ))}
               </div>
            </PopoverContent>
          </Popover>

          <Button 
              variant={showPageNumbers ? "default" : "outline"} 
              size="sm" 
              className="h-8 gap-2"
              onClick={() => updateSettings({ showPageNumbers: !showPageNumbers })}
          >
            <Hash className="h-4 w-4" />
            <span className="text-xs">Page #</span>
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openMargins} onOpenChange={setOpenMargins}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Margins</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Top (mm)</Label>
              <Input type="number" value={customMargins.top} onChange={e => setCustomMargins({...customMargins, top: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Bottom (mm)</Label>
              <Input type="number" value={customMargins.bottom} onChange={e => setCustomMargins({...customMargins, bottom: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Left (mm)</Label>
              <Input type="number" value={customMargins.left} onChange={e => setCustomMargins({...customMargins, left: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Right (mm)</Label>
              <Input type="number" value={customMargins.right} onChange={e => setCustomMargins({...customMargins, right: parseFloat(e.target.value)})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenMargins(false)}>Cancel</Button>
            <Button onClick={applyCustomMargins}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openWatermark} onOpenChange={setOpenWatermark}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setWatermarkInput(""); updateSettings({ watermark: "" }); setOpenWatermark(false); }}>
                Clear
            </Button>
            <Button onClick={applyWatermark}>
                Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
