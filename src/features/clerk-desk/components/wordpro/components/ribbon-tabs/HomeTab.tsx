import React from "react";
import { useEditorContext } from "../../contexts/EditorContext";
import { FindReplace } from "../../components/FindReplace";
import { StylesGallery } from "../../components/StylesGallery";
import { Button } from "../../components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Copy,
  Clipboard,
  Trash2,
  List,
  ListOrdered,
  Indent,
  Outdent,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { cn } from "../../lib/utils";

interface HomeTabProps {
  isMobile?: boolean;
}

const FONT_FAMILIES = [
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const FONT_SIZES = [
  { label: "8", value: 8 },
  { label: "10", value: 10 },
  { label: "12", value: 12 },
  { label: "14", value: 14 },
  { label: "16", value: 16 },
  { label: "18", value: 18 },
  { label: "20", value: 20 },
  { label: "24", value: 24 },
  { label: "28", value: 28 },
  { label: "32", value: 32 },
];

const COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00B050",
  "#0070C0",
  "#FFC000",
  "#FF6600",
  "#7030A0",
];

export function HomeTab({ isMobile = false }: HomeTabProps) {
  const { editor, applyFormat, getContent } = useEditorContext();

  if (!editor) return null;

  const isBold = editor.isActive("bold");
  const isItalic = editor.isActive("italic");
  const isUnderline = editor.isActive("underline");
  const isStrike = editor.isActive("strike");
  const isBulletList = editor.isActive("bulletList");
  const isOrderedList = editor.isActive("orderedList");
  
  const handleFontFamily = (value: string) => {
    applyFormat({ fontFamily: value });
  };

  const handleFontSize = (value: string) => {
    applyFormat({ fontSize: parseInt(value) });
  };

  const handleTextColor = (color: string) => {
    applyFormat({ color });
  };

  const handleAlignment = (alignment: "left" | "center" | "right" | "justify") => {
    applyFormat({ alignment });
  };

  const handleReplace = (findText: string, replaceText: string, options: any) => {
    if (!editor) return;
    const html = editor.getHTML();
    const flags = options.caseSensitive ? "g" : "gi";
    let pattern = findText;
    if (options.wholeWord) {
      pattern = `\\b${findText}\\b`;
    }
    const regex = new RegExp(pattern, flags);
    
    const newHtml = html.replace(/>([^<]+)</g, (match, text) => {
      const replacedText = options.replaceAll 
        ? text.replace(regex, replaceText)
        : text.replace(new RegExp(pattern, options.caseSensitive ? "" : "i"), replaceText);
      return `>${replacedText}<`;
    });
    
    editor.commands.setContent(newHtml);
  };

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button variant={isBold ? "default" : "outline"} size="sm" onClick={() => applyFormat({ bold: !isBold })} className="h-8 w-8 p-0">
          <Bold className="h-4 w-4" />
        </Button>
        <Button variant={isBulletList ? "default" : "outline"} size="sm" onClick={() => editor.commands.toggleBulletList()} className="h-8 w-8 p-0">
          <List className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Clipboard Group */}
        <div className="flex flex-col gap-1 border-r pr-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clipboard</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Copy" onClick={() => {
              const selectedText = editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
              if (selectedText) navigator.clipboard.writeText(selectedText);
            }}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Paste" onClick={async () => {
              const text = await navigator.clipboard.readText();
              if (text) editor.commands.insertContent(text);
            }}>
              <Clipboard className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" title="Clear All" onClick={() => editor.commands.clearContent()}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Font Group */}
        <div className="flex flex-col gap-1 border-r pr-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Font</span>
          <div className="flex items-center gap-2">
            <Select onValueChange={handleFontFamily}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Font" />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((font) => (
                  <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={handleFontSize}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue placeholder="12" />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size.value} value={String(size.value)}>{size.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-0.5 ml-1">
              <Button variant={isBold ? "default" : "outline"} size="sm" onClick={() => applyFormat({ bold: !isBold })} className="h-8 w-8 p-0" title="Bold">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant={isItalic ? "default" : "outline"} size="sm" onClick={() => applyFormat({ italic: !isItalic })} className="h-8 w-8 p-0" title="Italic">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant={isUnderline ? "default" : "outline"} size="sm" onClick={() => applyFormat({ underline: !isUnderline })} className="h-8 w-8 p-0" title="Underline">
                <Underline className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-b-4 ml-1" style={{ borderBottomColor: editor.getAttributes("textStyle").color || "#000000" }} title="Text Color">
                    <span className="font-bold text-xs">A</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                  <div className="grid grid-cols-4 gap-2">
                    {COLORS.map((color) => (
                      <button key={color} className="h-6 w-6 rounded border border-gray-200" style={{ backgroundColor: color }} onClick={() => handleTextColor(color)} />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Paragraph Group */}
        <div className="flex flex-col gap-1 border-r pr-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paragraph</span>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                <Button variant={isBulletList ? "default" : "outline"} size="sm" onClick={() => editor.commands.toggleBulletList()} className="h-8 w-8 p-0" title="Bullets">
                    <List className="h-4 w-4" />
                </Button>
                <Button variant={isOrderedList ? "default" : "outline"} size="sm" onClick={() => editor.commands.toggleOrderedList()} className="h-8 w-8 p-0" title="Numbering">
                    <ListOrdered className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                <Button variant="outline" size="sm" onClick={() => editor.commands.outdent()} className="h-8 w-8 p-0" title="Decrease Indent">
                    <Outdent className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => editor.commands.indent()} className="h-8 w-8 p-0" title="Increase Indent">
                    <Indent className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                <Select onValueChange={(val) => {
                    editor.chain().focus().setMark('textStyle', { lineHeight: val }).run();
                }}>
                    <SelectTrigger className="h-8 w-12 p-0 flex justify-center">
                        <span className="material-symbols-outlined text-sm">format_line_spacing</span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1.0</SelectItem>
                        <SelectItem value="1.15">1.15</SelectItem>
                        <SelectItem value="1.5">1.5</SelectItem>
                        <SelectItem value="2">2.0</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-0.5">
              <Button variant={editor.isActive({ textAlign: "left" }) ? "default" : "outline"} size="sm" onClick={() => handleAlignment("left")} className="h-8 w-8 p-0" title="Align Left">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant={editor.isActive({ textAlign: "center" }) ? "default" : "outline"} size="sm" onClick={() => handleAlignment("center")} className="h-8 w-8 p-0" title="Align Center">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant={editor.isActive({ textAlign: "right" }) ? "default" : "outline"} size="sm" onClick={() => handleAlignment("right")} className="h-8 w-8 p-0" title="Align Right">
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button variant={editor.isActive({ textAlign: "justify" }) ? "default" : "outline"} size="sm" onClick={() => handleAlignment("justify")} className="h-8 w-8 p-0" title="Align Justify">
                <AlignJustify className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Styles Group */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Editing</span>
          <div className="flex items-center gap-1">
            <FindReplace content={getContent()} onReplace={handleReplace} />
            <StylesGallery />
          </div>
        </div>
      </div>
    </div>
  );
}
