import { useState, useCallback, useRef, useEffect } from "react";
import { EditorState, ContentBlock, TextFormat, HeadingLevel } from "@shared/editor-types";
import { nanoid } from "nanoid";

const DEFAULT_EDITOR_STATE: EditorState = {
  blocks: [
    {
      id: nanoid(),
      type: "paragraph",
      content: "",
      format: { alignment: "left" },
      heading: "normal",
    },
  ],
  version: 1,
  lastModified: Date.now(),
};

export function useEditor(initialState?: EditorState) {
  const [editorState, setEditorState] = useState<EditorState>(
    initialState || DEFAULT_EDITOR_STATE
  );
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [history, setHistory] = useState<EditorState[]>([editorState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  /**
   * Add a new state to history
   */
  const pushToHistory = useCallback((newState: EditorState) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newState]);
    setHistoryIndex((prev) => prev + 1);
    setEditorState(newState);
  }, [historyIndex]);

  /**
   * Undo last operation
   */
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditorState(history[newIndex]);
    }
  }, [history, historyIndex]);

  /**
   * Redo last undone operation
   */
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditorState(history[newIndex]);
    }
  }, [history, historyIndex]);

  /**
   * Insert text at current selection
   */
  const insertText = useCallback(
    (text: string) => {
      const newState = { ...editorState };
      if (newState.blocks.length === 0) {
        newState.blocks = [
          {
            id: nanoid(),
            type: "paragraph",
            content: text,
            heading: "normal",
          },
        ];
      } else {
        const block = newState.blocks[0];
        if (block) {
          block.content =
            block.content.slice(0, selectionStart) +
            text +
            block.content.slice(selectionEnd);
        }
      }
      newState.version += 1;
      newState.lastModified = Date.now();
      pushToHistory(newState);
    },
    [editorState, selectionStart, selectionEnd, pushToHistory]
  );

  /**
   * Apply formatting to selected text
   */
  const applyFormat = useCallback(
    (format: TextFormat) => {
      const newState = { ...editorState };
      if (newState.blocks.length > 0 && selectionStart !== selectionEnd) {
        const block = newState.blocks[0];
        if (block) {
          block.format = { ...block.format, ...format };
        }
      }
      newState.version += 1;
      newState.lastModified = Date.now();
      pushToHistory(newState);
    },
    [editorState, selectionStart, selectionEnd, pushToHistory]
  );

  /**
   * Apply heading level
   */
  const applyHeading = useCallback(
    (level: HeadingLevel) => {
      const newState = { ...editorState };
      if (newState.blocks.length > 0) {
        const block = newState.blocks[0];
        if (block) {
          block.heading = level;
          if (level !== "normal") {
            block.type = "heading";
          } else {
            block.type = "paragraph";
          }
        }
      }
      newState.version += 1;
      newState.lastModified = Date.now();
      pushToHistory(newState);
    },
    [editorState, pushToHistory]
  );

  /**
   * Delete selected text
   */
  const deleteSelection = useCallback(() => {
    if (selectionStart === selectionEnd) return;

    const newState = { ...editorState };
    if (newState.blocks.length > 0) {
      const block = newState.blocks[0];
      if (block) {
        block.content =
          block.content.slice(0, selectionStart) +
          block.content.slice(selectionEnd);
      }
    }
    newState.version += 1;
    newState.lastModified = Date.now();
    pushToHistory(newState);
  }, [editorState, selectionStart, selectionEnd, pushToHistory]);

  /**
   * Get current text content
   */
  const getContent = useCallback(() => {
    return editorState.blocks.map((b) => b.content).join("\n");
  }, [editorState]);

  /**
   * Get word count
   */
  const getWordCount = useCallback(() => {
    const content = getContent();
    return content.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }, [getContent]);

  /**
   * Get character count
   */
  const getCharacterCount = useCallback(() => {
    return getContent().length;
  }, [getContent]);

  /**
   * Get reading time in minutes
   */
  const getReadingTime = useCallback(() => {
    const wordCount = getWordCount();
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  }, [getWordCount]);

  /**
   * Clear all content
   */
  const clear = useCallback(() => {
    const newState = { ...DEFAULT_EDITOR_STATE };
    newState.version = editorState.version + 1;
    pushToHistory(newState);
  }, [editorState, pushToHistory]);

  /**
   * Load state from JSON
   */
  const loadState = useCallback((state: EditorState) => {
    pushToHistory(state);
  }, [pushToHistory]);

  return {
    editorState,
    setEditorState,
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    editorRef,
    insertText,
    applyFormat,
    applyHeading,
    deleteSelection,
    undo,
    redo,
    getContent,
    getWordCount,
    getCharacterCount,
    getReadingTime,
    clear,
    loadState,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
