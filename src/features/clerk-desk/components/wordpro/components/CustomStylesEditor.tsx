import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Palette } from "lucide-react";
import { toast } from "sonner";

interface CustomStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  color: string;
  backgroundColor: string;
}

interface CustomStylesEditorProps {
  onSaveStyle?: (style: CustomStyle) => void;
  existingStyles?: CustomStyle[];
}

/**
 * Custom styles editor component
 */
export function CustomStylesEditor({ onSaveStyle, existingStyles = [] }: CustomStylesEditorProps) {
  const [open, setOpen] = useState(false);
  const [styleName, setStyleName] = useState("");
  const [fontFamily, setFontFamily] = useState("Calibri, sans-serif");
  const [fontSize, setFontSize] = useState(12);
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal");
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal");
  const [color, setColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");

  const handleSaveStyle = () => {
    if (!styleName.trim()) {
      toast.error("Please enter a style name");
      return;
    }

    const newStyle: CustomStyle = {
      id: `custom-${Date.now()}`,
      name: styleName,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      color,
      backgroundColor,
    };

    onSaveStyle?.(newStyle);
    setOpen(false);
    resetForm();
    toast.success(`Style "${styleName}" saved`);
  };

  const resetForm = () => {
    setStyleName("");
    setFontFamily("Calibri, sans-serif");
    setFontSize(12);
    setFontWeight("normal");
    setFontStyle("normal");
    setColor("#000000");
    setBackgroundColor("#FFFFFF");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Palette className="h-4 w-4" />
          <span className="text-xs">Custom Styles</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Custom Style</DialogTitle>
          <DialogDescription>
            Create a new style for quick formatting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="style-name">Style Name</Label>
            <Input
              id="style-name"
              placeholder="e.g., Emphasis, Code Block"
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <select
                id="font-family"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                <option value="Calibri, sans-serif">Calibri</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', monospace">Courier New</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Input
                id="font-size"
                type="number"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fontWeight === "bold"}
                  onChange={(e) => setFontWeight(e.target.checked ? "bold" : "normal")}
                />
                Bold
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fontStyle === "italic"}
                  onChange={(e) => setFontStyle(e.target.checked ? "italic" : "normal")}
                />
                Italic
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex gap-2">
                <input
                  id="text-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 rounded border"
                />
                <span className="text-sm text-gray-600">{color}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bg-color">Background Color</Label>
              <div className="flex gap-2">
                <input
                  id="bg-color"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-8 w-12 rounded border"
                />
                <span className="text-sm text-gray-600">{backgroundColor}</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="p-3 rounded border"
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight,
                fontStyle,
                color,
                backgroundColor,
              }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
          </div>

          {/* Existing Styles */}
          {existingStyles.length > 0 && (
            <div className="space-y-2">
              <Label>Saved Styles</Label>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {existingStyles.map((style) => (
                  <div
                    key={style.id}
                    className="text-xs p-1 rounded bg-gray-100"
                    style={{
                      fontFamily: style.fontFamily,
                      fontSize: `${style.fontSize}px`,
                      color: style.color,
                    }}
                  >
                    {style.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveStyle}>Save Style</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
