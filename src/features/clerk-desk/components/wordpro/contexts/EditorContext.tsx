import React, { createContext, useContext, ReactNode, useCallback } from "react";
import { useEditor, Editor } from "@tiptap/react";
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

export interface CommentData {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  resolved: boolean;
  selection?: { from: number; to: number };
}

export type PageOrientation = "portrait" | "landscape";
export type PaperSize = "A4" | "Letter" | "Legal";

interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface EditorContextType {
  editor: Editor | null;
  comments: CommentData[];
  addComment: (content: string) => void;
  resolveComment: (id: string) => void;
  deleteComment: (id: string) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  margins: PageMargins;
  setMargins: (margins: PageMargins) => void;
  orientation: PageOrientation;
  setOrientation: (orientation: PageOrientation) => void;
  paperSize: PaperSize;
  setPaperSize: (size: PaperSize) => void;
  watermark: string;
  setWatermark: (text: string) => void;
  showPageNumbers: boolean;
  setShowPageNumbers: (show: boolean) => void;
  getContent: () => string;
  getHTML: () => string;
  getJSON: () => any;
  insertText: (text: string) => void;
  applyFormat: (format: TextFormat) => void;
  applyHeading: (level: HeadingLevel) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  loadContent: (content: string) => void;
  getWordCount: () => number;
  getCharacterCount: () => number;
  getReadingTime: () => number;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
  initialContent?: string;
  onChange?: (html: string) => void;
}

export function EditorProvider({ children, initialContent = "", onChange }: EditorProviderProps) {
  const [zoom, setZoom] = React.useState(100);
  const [comments, setComments] = React.useState<CommentData[]>([]);
  const [margins, setMargins] = React.useState<PageMargins>({
    top: 25,
    right: 20,
    bottom: 25,
    left: 25,
  });
  const [orientation, setOrientation] = React.useState<PageOrientation>("portrait");
  const [paperSize, setPaperSize] = React.useState<PaperSize>("A4");
  const [watermark, setWatermark] = React.useState("");
  const [showPageNumbers, setShowPageNumbers] = React.useState(false);

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
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const getContent = useCallback(() => editor?.getText() || "", [editor]);
  const getHTML = useCallback(() => editor?.getHTML() || "", [editor]);
  const getJSON = useCallback(() => editor?.getJSON() || {}, [editor]);

  const insertText = useCallback((text: string) => {
    editor?.commands.insertContent(text);
  }, [editor]);

  const applyFormat = useCallback((format: TextFormat) => {
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
      editor.commands.setMark('textStyle', { fontSize: `${format.fontSize}px` });
    }
    
    if (format.fontFamily) {
      editor.commands.setFontFamily(format.fontFamily);
    }
    
    if (format.color) {
      editor.commands.setColor(format.color);
    }
    
    if (format.backgroundColor) {
      editor.commands.setHighlight({ color: format.backgroundColor });
    }
    
    if (format.alignment) {
      editor.commands.setTextAlign(format.alignment);
    }
  }, [editor]);

  const applyHeading = useCallback((level: HeadingLevel) => {
    if (!editor) return;
    if (level === "normal") {
      editor.commands.setParagraph();
    } else if (level === "quote") {
      editor.commands.toggleBlockquote();
    } else if (level === "title") {
      editor.commands.setHeading({ level: 1 });
      editor.commands.setMark('textStyle', { fontSize: '28px' });
    } else if (level === "subtitle") {
      editor.commands.setHeading({ level: 2 });
      editor.commands.setMark('textStyle', { fontSize: '18px' });
    } else {
      const l = parseInt(level.replace("h", "")) as any;
      if (!isNaN(l)) {
        editor.commands.setHeading({ level: l });
      }
    }
  }, [editor]);

  const undo = useCallback(() => editor?.commands.undo(), [editor]);
  const redo = useCallback(() => editor?.commands.redo(), [editor]);
  const clear = useCallback(() => editor?.commands.clearContent(), [editor]);
  
  const loadContent = useCallback((content: string) => {
    editor?.commands.setContent(content);
  }, [editor]);

  const addComment = useCallback((content: string) => {
    if (!editor || editor.state.selection.empty) return;
    
    const id = Date.now().toString();
    const newComment: CommentData = {
      id,
      author: "You",
      content,
      timestamp: Date.now(),
      resolved: false,
      selection: { from: editor.state.selection.from, to: editor.state.selection.to },
    };
    
    editor.commands.setComment(id);
    setComments(prev => [newComment, ...prev]);
  }, [editor]);

  const resolveComment = useCallback((id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c));
  }, []);

  const deleteComment = useCallback((id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  }, []);

  const getWordCount = useCallback(() => {
    return editor?.storage.characterCount.words() || 0;
  }, [editor]);

  const getCharacterCount = useCallback(() => {
    return editor?.storage.characterCount.characters() || 0;
  }, [editor]);

  const getReadingTime = useCallback(() => {
    const wordCount = getWordCount();
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  }, [getWordCount]);

  const value: EditorContextType = {
    editor,
    comments,
    addComment,
    resolveComment,
    deleteComment,
    zoom,
    setZoom,
    margins,
    setMargins,
    orientation,
    setOrientation,
    paperSize,
    setPaperSize,
    watermark,
    setWatermark,
    showPageNumbers,
    setShowPageNumbers,
    getContent,
    getHTML,
    getJSON,
    insertText,
    applyFormat,
    applyHeading,
    undo,
    redo,
    clear,
    loadContent,
    getWordCount,
    getCharacterCount,
    getReadingTime,
    canUndo: editor?.can().undo() || false,
    canRedo: editor?.can().redo() || false,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext(): EditorContextType {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within EditorProvider");
  }
  return context;
}
