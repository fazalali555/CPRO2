import React, { useState } from "react";
import { useEditorContext } from "../contexts/EditorContext";
import { Button } from "../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Palette } from "lucide-react";
import { cn } from "../lib/utils";

interface StylePreset {
  id: string;
  label: string;
  level: "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "title" | "subtitle" | "quote";
  fontSize: number;
  fontWeight: "normal" | "bold";
  color: string;
  spacing?: number;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "normal",
    label: "Normal",
    level: "normal",
    fontSize: 12,
    fontWeight: "normal",
    color: "#000000",
  },
  {
    id: "title",
    label: "Title",
    level: "title",
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
  },
  {
    id: "subtitle",
    label: "Subtitle",
    level: "subtitle",
    fontSize: 18,
    fontWeight: "normal",
    color: "#4B5563",
  },
  {
    id: "h1",
    label: "Heading 1",
    level: "h1",
    fontSize: 26,
    fontWeight: "bold",
    color: "#1F2937",
  },
  {
    id: "h2",
    label: "Heading 2",
    level: "h2",
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },
  {
    id: "h3",
    label: "Heading 3",
    level: "h3",
    fontSize: 16,
    fontWeight: "bold",
    color: "#4B5563",
  },
  {
    id: "h4",
    label: "Heading 4",
    level: "h4",
    fontSize: 14,
    fontWeight: "bold",
    color: "#6B7280",
  },
  {
    id: "quote",
    label: "Quote",
    level: "quote",
    fontSize: 14,
    fontWeight: "normal",
    color: "#6B7280",
  },
];

/**
 * Styles gallery component for quick paragraph style application
 */
export function StylesGallery() {
  const editor = useEditorContext();
  const [open, setOpen] = useState(false);

  const handleApplyStyle = (style: StylePreset) => {
    editor.applyHeading(style.level);
    editor.applyFormat({
      fontSize: style.fontSize,
      bold: style.fontWeight === "bold",
      color: style.color,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Palette className="h-4 w-4" />
          <span className="text-xs">Styles</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <div className="space-y-1 p-2">
          {STYLE_PRESETS.map((style) => (
            <button
              key={style.id}
              onClick={() => handleApplyStyle(style)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              style={{
                fontSize: `${Math.max(12, style.fontSize * 0.75)}px`,
                fontWeight: style.fontWeight,
                color: style.color,
              }}
            >
              {style.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
