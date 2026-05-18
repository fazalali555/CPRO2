import React, { forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Comment } from "../lib/CommentExtension";
import { cn } from "../lib/utils";

interface TiptapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  className?: string;
  editable?: boolean;
}

export interface TiptapEditorRef {
  editor: Editor | null;
  getContent: () => string;
  setContent: (content: string) => void;
  clear: () => void;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  ({ content = "", onChange, className, editable = true }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Underline,
        TextStyle,
        Color,
        FontFamily,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        Image.configure({
          allowBase64: true,
          HTMLAttributes: {
            class: "rounded-lg max-w-full h-auto",
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        CharacterCount,
        Comment,
      ],
      content,
      editable,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none min-h-full",
            "max-w-none text-on-surface"
          ),
        },
      },
    });

    useImperativeHandle(ref, () => ({
      editor,
      getContent: () => editor?.getHTML() || "",
      setContent: (content: string) => editor?.commands.setContent(content),
      clear: () => editor?.commands.clearContent(),
    }));

    if (!editor) {
      return null;
    }

    return (
      <div className={cn("tiptap-editor-container", className)}>
        <EditorContent editor={editor} />
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";
