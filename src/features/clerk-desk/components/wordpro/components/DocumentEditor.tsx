import React from "react";
import { useEditorContext } from "../contexts/EditorContext";
import { EditorContent, BubbleMenu } from "@tiptap/react";
import { 
    Bold, 
    Italic, 
    Underline, 
    Link as LinkIcon, 
    Type,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { HorizontalRuler } from "./Ruler";

interface DocumentEditorProps {
  className?: string;
}

/**
 * Main document editor component with A4 page layout simulation, Ruler, and Margins
 */
export function DocumentEditor({ className }: DocumentEditorProps) {
  const { editor, zoom, margins, orientation, paperSize, watermark, showPageNumbers } = useEditorContext();

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="animate-pulse text-gray-400">Initializing editor...</div>
      </div>
    );
  }

  // Dimensions in mm
  const paperDimensions = {
    A4: { width: 210, height: 297 },
    Letter: { width: 215.9, height: 279.4 },
    Legal: { width: 215.9, height: 355.6 },
  };

  const currentSize = paperDimensions[paperSize];
  const width = orientation === "portrait" ? currentSize.width : currentSize.height;
  const height = orientation === "portrait" ? currentSize.height : currentSize.width;

  return (
    <div
      className={cn(
        "flex-1 overflow-auto bg-gray-100 p-8 flex flex-col items-center custom-scrollbar",
        className
      )}
    >
      {editor && (
        <BubbleMenu 
            editor={editor} 
            tippyOptions={{ duration: 100 }}
            className="flex items-center gap-1 bg-white border border-gray-200 shadow-xl rounded-lg p-1 animate-in fade-in zoom-in duration-200"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-blue-50 text-blue-600")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-blue-50 text-blue-600")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 w-8 p-0", editor.isActive("underline") && "bg-blue-50 text-blue-600")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("h-8 w-8 p-0")}
            onClick={() => {
                const url = window.prompt('URL');
                if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}

      {/* Page Content Wrapper (includes Ruler) */}
      <div 
        className="flex flex-col transition-all duration-300 shadow-2xl bg-white relative overflow-hidden" 
        style={{ 
          width: `${width}mm`,
          minHeight: `${height}mm`,
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center",
          marginBottom: "4rem"
        }}
      >
        {/* Horizontal Ruler */}
        <HorizontalRuler 
            width={width}
            leftMargin={margins.left}
            rightMargin={margins.right}
            className="w-full shrink-0 z-20"
        />

        {/* Watermark Layer */}
        {watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
            <div 
              className="text-gray-200/40 font-black uppercase text-center border-4 border-gray-200/20 rounded-2xl px-12 py-6 transform -rotate-45"
              style={{ fontSize: `${width / 3}px`, lineHeight: 1 }}
            >
              {watermark}
            </div>
          </div>
        )}

        {/* Page Container */}
        <div 
          className="flex-1 relative z-10"
          style={{ 
            paddingTop: `${margins.top}mm`,
            paddingRight: `${margins.right}mm`,
            paddingBottom: `${margins.bottom}mm`,
            paddingLeft: `${margins.left}mm`,
          }}
        >
          {/* Tiptap Editable Content */}
          <EditorContent 
            editor={editor} 
            className="prose prose-slate max-w-none focus:outline-none min-h-[200mm]"
          />
        </div>

        {/* Footer / Page Numbers */}
        {showPageNumbers && (
          <div 
            className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400 select-none pointer-events-none"
            style={{ paddingBottom: `${margins.bottom / 2}mm` }}
          >
            Page 1 of 1
          </div>
        )}
      </div>
    </div>
  );
}
