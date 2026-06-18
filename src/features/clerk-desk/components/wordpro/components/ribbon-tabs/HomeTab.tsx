import React from "react";
import { useEditorInstance } from "@/contexts/EditorContext";
import { FindReplace } from "../../components/FindReplace";
import { StylesGallery } from "../../components/StylesGallery";
import { Button } from "../../components/ui/button";
import { TextFormat } from "@/types/editor";
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
  Subscript,
  Superscript,
  PaintBucket,
  Highlighter,
  Eraser,
  Type,
  X,
  Scissors
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
import { cn } from "@/lib/utils";

interface HomeTabProps {
  isMobile?: boolean;
}

const FONT_FAMILIES = [
  { label: "Jameel Noori Nastaleeq", value: "'Jameel Noori Nastaleeq', Arial" },
  { label: "Noto Nastaliq Urdu", value: "'Noto Nastaliq Urdu', serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Calibri", value: "Calibri, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Verdana", value: "Verdana, sans-serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
];

const FONT_SIZES = [
  { label: "8", value: "8" },
  { label: "9", value: "9" },
  { label: "10", value: "10" },
  { label: "11", value: "11" },
  { label: "12", value: "12" },
  { label: "14", value: "14" },
  { label: "16", value: "16" },
  { label: "18", value: "18" },
  { label: "20", value: "20" },
  { label: "24", value: "24" },
  { label: "28", value: "28" },
  { label: "32", value: "32" },
  { label: "36", value: "36" },
  { label: "48", value: "48" },
  { label: "72", value: "72" },
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

const HIGHLIGHT_COLORS = [
  "#FFFF00",
  "#00FF00",
  "#00FFFF",
  "#FF00FF",
  "#FF0000",
  "#0000FF",
  "#800080",
  "#808080",
];

export function HomeTab({ isMobile = false }: HomeTabProps) {
  const editor = useEditorInstance();

  const applyFormat = (format: TextFormat) => {
    if (!editor) return;

    if (format.bold !== undefined) {
       if (format.bold) editor.commands.setBold();
       else editor.commands.unsetBold();
    }
    if (format.italic !== undefined) {
       if (format.italic) editor.commands.setItalic();
       else editor.commands.unsetItalic();
    }
    if (format.underline !== undefined) {
       if (format.underline) editor.commands.setUnderline();
       else editor.commands.unsetUnderline();
    }
    if (format.strikethrough !== undefined) {
       if (format.strikethrough) editor.commands.setStrike();
       else editor.commands.unsetStrike();
    }
    
    if (format.fontSize) {
      editor.chain().focus().setFontSize(`${format.fontSize}pt`).run();
    }
    
    if (format.fontFamily) {
      editor.chain().focus().setFontFamily(format.fontFamily).run();
    }
    
    if (format.color) {
      editor.chain().focus().setColor(format.color).run();
    }
    
    if (format.backgroundColor) {
      editor.chain().focus().setHighlight({ color: format.backgroundColor }).run();
    }
    
    if (format.alignment) {
      editor.chain().focus().setTextAlign(format.alignment).run();
    }
  };

  if (!editor) return null;

  const isBold = editor.isActive("bold");
  const isItalic = editor.isActive("italic");
  const isUnderline = editor.isActive("underline");
  const isStrike = editor.isActive("strike");
  const isSubscript = editor.isActive("subscript");
  const isSuperscript = editor.isActive("superscript");
  const isBulletList = editor.isActive("bulletList");
  const isOrderedList = editor.isActive("orderedList");
  
  const currentFontFamily = editor.getAttributes("textStyle").fontFamily || "'Times New Roman', serif";
  const currentFontSize = editor.getAttributes("textStyle").fontSize ? editor.getAttributes("textStyle").fontSize.replace('pt', '') : "12";
  
  const handleFontFamily = (value: string) => {
    applyFormat({ fontFamily: value });
  };

  const handleFontSize = (value: string) => {
    applyFormat({ fontSize: parseInt(value) });
  };

  const handleTextColor = (color: string) => {
    applyFormat({ color });
  };

  const handleHighlightColor = (color: string) => {
    applyFormat({ backgroundColor: color });
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
    
    const newHtml = html.replace(/>([^<]+)</g, (match: string, text: string) => {
      const replacedText = options.replaceAll 
        ? text.replace(regex, replaceText)
        : text.replace(new RegExp(pattern, options.caseSensitive ? "" : "i"), replaceText);
      return `>${replacedText}<`;
    });
    
    editor.commands.setContent(newHtml);
  };

  const getContent = () => editor.getText();

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <Button variant={isBold ? "default" : "ghost"} size="sm" onClick={() => applyFormat({ bold: !isBold })} className="h-11 w-11 p-0 rounded-lg">
            <Bold className="h-5 w-5" />
          </Button>
          <Button variant={isItalic ? "default" : "ghost"} size="sm" onClick={() => applyFormat({ italic: !isItalic })} className="h-11 w-11 p-0 rounded-lg">
            <Italic className="h-5 w-5" />
          </Button>
          <Button variant={isUnderline ? "default" : "ghost"} size="sm" onClick={() => applyFormat({ underline: !isUnderline })} className="h-11 w-11 p-0 rounded-lg">
            <Underline className="h-5 w-5" />
          </Button>
        </div>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <Button variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"} size="sm" onClick={() => handleAlignment("left")} className="h-11 w-11 p-0 rounded-lg">
            <AlignLeft className="h-5 w-5" />
          </Button>
          <Button variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"} size="sm" onClick={() => handleAlignment("center")} className="h-11 w-11 p-0 rounded-lg">
            <AlignCenter className="h-5 w-5" />
          </Button>
          <Button variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"} size="sm" onClick={() => handleAlignment("right")} className="h-11 w-11 p-0 rounded-lg">
            <AlignRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="w-px h-8 bg-gray-200 mx-1" />

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <Button variant={isBulletList ? "default" : "ghost"} size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className="h-11 w-11 p-0 rounded-lg">
            <List className="h-5 w-5" />
          </Button>
          <Button variant={isOrderedList ? "default" : "ghost"} size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className="h-11 w-11 p-0 rounded-lg">
            <ListOrdered className="h-5 w-5" />
          </Button>
        </div>
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
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Cut" onClick={() => {
                document.execCommand('cut');
                // toast.success("Cut to clipboard");
            }}>
              <Scissors className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Copy" onClick={() => {
                document.execCommand('copy');
                // toast.success("Copied to clipboard");
            }}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Paste" onClick={() => {
               editor.commands.focus();
            }}>
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Font Group */}
        <div className="flex flex-col gap-1 border-r pr-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Font</span>
          <div className="flex items-center gap-2">
            <Select onValueChange={handleFontFamily} value={currentFontFamily}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Font" />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={handleFontSize} value={currentFontSize}>
              <SelectTrigger className="h-8 w-16">
                <SelectValue placeholder="12" />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-0.5 ml-1">
              <Button variant={isBold ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className="h-8 w-8 p-0" title="Bold">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant={isItalic ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className="h-8 w-8 p-0" title="Italic">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant={isUnderline ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleUnderline().run()} className="h-8 w-8 p-0" title="Underline">
                <Underline className="h-4 w-4" />
              </Button>
              <Button variant={isStrike ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className="h-8 w-8 p-0" title="Strikethrough">
                <Strikethrough className="h-4 w-4" />
              </Button>
              <Button variant={isSubscript ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleSubscript().run()} className="h-8 w-8 p-0" title="Subscript">
                <Subscript className="h-4 w-4" />
              </Button>
              <Button variant={isSuperscript ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleSuperscript().run()} className="h-8 w-8 p-0" title="Superscript">
                <Superscript className="h-4 w-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-b-4 ml-1" style={{ borderBottomColor: editor.getAttributes("textStyle").color || "#000000" }} title="Text Color">
                    <Type className="h-4 w-4" />
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-b-4 ml-1" style={{ borderBottomColor: editor.isActive('highlight') ? editor.getAttributes("highlight").color : "transparent" }} title="Highlight Color">
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                  <div className="grid grid-cols-4 gap-2">
                    <button className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center bg-white" onClick={() => editor.chain().focus().unsetHighlight().run()}>
                       <X className="h-3 w-3" />
                    </button>
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button key={color} className="h-6 w-6 rounded border border-gray-200" style={{ backgroundColor: color }} onClick={() => handleHighlightColor(color)} />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="sm" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 ml-1" title="Clear Formatting">
                <Eraser className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Paragraph Group */}
        <div className="flex flex-col gap-1 border-r pr-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paragraph</span>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                <Button variant={isBulletList ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className="h-8 w-8 p-0" title="Bullets">
                    <List className="h-4 w-4" />
                </Button>
                <Button variant={isOrderedList ? "default" : "outline"} size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className="h-8 w-8 p-0" title="Numbering">
                    <ListOrdered className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                <Button variant="outline" size="sm" onClick={() => editor.commands.liftListItem('listItem')} className="h-8 w-8 p-0" title="Decrease Indent">
                    <Outdent className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => editor.commands.sinkListItem('listItem')} className="h-8 w-8 p-0" title="Increase Indent">
                    <Indent className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-0.5 border-r pr-1 mr-1">
                <Select onValueChange={(val) => {
                    editor.chain().focus().setLineHeight(val).run();
                }}>
                    <SelectTrigger className="h-8 w-12 p-0 flex justify-center">
                        <span className="material-symbols-outlined text-sm">format_line_spacing</span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">1.0</SelectItem>
                        <SelectItem value="1.15">1.15</SelectItem>
                        <SelectItem value="1.5">1.5</SelectItem>
                        <SelectItem value="2">2.0</SelectItem>
                        <SelectItem value="2.5">2.5</SelectItem>
                        <SelectItem value="3">3.0</SelectItem>
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
