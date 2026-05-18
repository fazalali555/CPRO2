import React, { useEffect, useState } from "react";
import { useEditorContext } from "../contexts/EditorContext";
import { cn } from "../lib/utils";

interface DocumentEditorProps {
  className?: string;
  zoom?: number;
}

/**
 * Improved document editor with proper state management
 */
export function DocumentEditorV2({ className, zoom = 100 }: DocumentEditorProps) {
  const editor = useEditorContext();
  const [isComposing, setIsComposing] = useState(false);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const text = target.innerText || target.textContent || "";

    // Get current cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preRange = range.cloneRange();
      preRange.selectNodeContents(target);
      preRange.setEnd(range.endContainer, range.endOffset);
      const pos = preRange.toString().length;

      editor.setSelection({ start: pos, end: pos, blockId: editor.editorState.blocks[0]?.id || "" });
    }

    // Update editor state immutably
    if (editor.editorState.blocks.length > 0) {
      const currentBlock = editor.editorState.blocks[0];
      if (currentBlock.content !== text) {
        editor.insertText(text.slice(currentBlock.content.length));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isComposing) return;

    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      editor.undo();
      return;
    }

    // Ctrl/Cmd + Shift + Z: Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "y") && e.shiftKey) {
      e.preventDefault();
      editor.redo();
      return;
    }

    // Ctrl/Cmd + B: Bold
    if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      const block = editor.editorState.blocks[0];
      editor.applyFormat({ bold: !block?.format?.bold });
      return;
    }

    // Ctrl/Cmd + I: Italic
    if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      const block = editor.editorState.blocks[0];
      editor.applyFormat({ italic: !block?.format?.italic });
      return;
    }

    // Ctrl/Cmd + U: Underline
    if ((e.ctrlKey || e.metaKey) && e.key === "u") {
      e.preventDefault();
      const block = editor.editorState.blocks[0];
      editor.applyFormat({ underline: !block?.format?.underline });
      return;
    }

    // Delete: Delete selected text
    if ((e.key === "Delete" || e.key === "Backspace") && editor.selection.start !== editor.selection.end) {
      e.preventDefault();
      editor.deleteSelection();
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    editor.insertText(text);
  };

  const content = editor.editorState.blocks[0]?.content || "";
  const format = editor.editorState.blocks[0]?.format || {};

  return (
    <div
      className={cn(
        "flex-1 overflow-auto bg-gray-100 p-8 flex justify-center",
        className
      )}
      style={{ zoom: `${zoom}%` }}
    >
      {/* A4 Page Container */}
      <div className="bg-white shadow-lg w-full max-w-4xl" style={{ aspectRatio: "210/297" }}>
        {/* Page Margins */}
        <div className="h-full p-16 overflow-auto">
          {/* Editable Content */}
          <div
            ref={editor.editorRef}
            contentEditable
            suppressContentEditableWarning
            className={cn(
              "min-h-full outline-none text-base leading-relaxed",
              "focus:outline-none focus:ring-0",
              format.bold && "font-bold",
              format.italic && "italic",
              format.underline && "underline",
              format.strikethrough && "line-through",
              format.alignment === "center" && "text-center",
              format.alignment === "right" && "text-right",
              format.alignment === "justify" && "text-justify"
            )}
            style={{
              fontSize: format.fontSize ? `${format.fontSize}px` : "16px",
              fontFamily: format.fontFamily || "system-ui, -apple-system, sans-serif",
              color: format.color || "#000000",
              backgroundColor: format.backgroundColor || "transparent",
            }}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onPaste={handlePaste}
          >
            {content || "Start typing..."}
          </div>
        </div>
      </div>
    </div>
  );
}
