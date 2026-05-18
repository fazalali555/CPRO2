import React, { createContext, useContext, ReactNode } from "react";
import { useEditorV2 } from "../features/clerk-desk/components/wordpro/hooks/useEditorV2";
import { EditorState, TextFormat, HeadingLevel } from "@shared/editor-types";

interface SelectionState {
  start: number;
  end: number;
  blockId: string;
}

interface EditorContextType {
  editorState: EditorState;
  selection: SelectionState;
  setSelection: (selection: SelectionState) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  insertText: (text: string) => void;
  applyFormat: (format: TextFormat) => void;
  applyHeading: (level: HeadingLevel) => void;
  deleteSelection: () => void;
  addBlock: (type?: "paragraph" | "heading") => void;
  deleteBlock: (blockId: string) => void;
  undo: () => void;
  redo: () => void;
  getContent: () => string;
  getWordCount: () => number;
  getCharacterCount: () => number;
  getReadingTime: () => number;
  clear: () => void;
  loadState: (state: EditorState) => void;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
  initialState?: EditorState;
}

export function EditorProvider({ children, initialState }: EditorProviderProps) {
  const editor = useEditorV2(initialState);

  const value: EditorContextType = {
    editorState: editor.editorState,
    selection: editor.selection,
    setSelection: editor.setSelection,
    editorRef: editor.editorRef,
    insertText: editor.insertText,
    applyFormat: editor.applyFormat,
    applyHeading: editor.applyHeading,
    deleteSelection: editor.deleteSelection,
    addBlock: editor.addBlock,
    deleteBlock: editor.deleteBlock,
    undo: editor.undo,
    redo: editor.redo,
    getContent: editor.getContent,
    getWordCount: editor.getWordCount,
    getCharacterCount: editor.getCharacterCount,
    getReadingTime: editor.getReadingTime,
    clear: editor.clear,
    loadState: editor.loadState,
    canUndo: editor.canUndo,
    canRedo: editor.canRedo,
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
