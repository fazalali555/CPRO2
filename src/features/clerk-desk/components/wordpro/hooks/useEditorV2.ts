import { useState, useCallback, useRef } from "react";
import { EditorState, ContentBlock, TextFormat, HeadingLevel } from "../lib/editor-types";
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

interface SelectionState {
  start: number;
  end: number;
  blockId: string;
}

export function useEditorV2(initialState?: EditorState, onChange?: (state: EditorState) => void) {
  const [editorState, setEditorState] = useState<EditorState>(
    initialState || DEFAULT_EDITOR_STATE
  );
  const [selection, setSelection] = useState<SelectionState>({
    start: 0,
    end: 0,
    blockId: editorState.blocks[0]?.id || "",
  });
  const [history, setHistory] = useState<EditorState[]>([editorState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  /**
   * Create a new immutable state and add to history
   */
  const updateState = useCallback(
    (updater: (state: EditorState) => EditorState) => {
      const newState = updater({ ...editorState, blocks: [...editorState.blocks] });
      newState.version += 1;
      newState.lastModified = Date.now();

      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newState]);
      setHistoryIndex((prev) => prev + 1);
      setEditorState(newState);
      if (onChange) {
        onChange(newState);
      }
    },
    [editorState, historyIndex, onChange]
  );

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
      updateState((state) => {
        const block = state.blocks.find((b) => b.id === selection.blockId);
        if (!block) return state;

        const newContent =
          block.content.slice(0, selection.start) +
          text +
          block.content.slice(selection.end);

        return {
          ...state,
          blocks: state.blocks.map((b) =>
            b.id === selection.blockId ? { ...b, content: newContent } : b
          ),
        };
      });

      // Update selection after insert
      setSelection((prev) => ({
        ...prev,
        start: prev.start + text.length,
        end: prev.start + text.length,
      }));
    },
    [selection, updateState]
  );

  /**
   * Apply formatting to selected text
   */
  const applyFormat = useCallback(
    (format: TextFormat) => {
      updateState((state) => {
        const block = state.blocks.find((b) => b.id === selection.blockId);
        if (!block || selection.start === selection.end) return state;

        return {
          ...state,
          blocks: state.blocks.map((b) =>
            b.id === selection.blockId
              ? { ...b, format: { ...b.format, ...format } }
              : b
          ),
        };
      });
    },
    [selection, updateState]
  );

  /**
   * Apply heading level
   */
  const applyHeading = useCallback(
    (level: HeadingLevel) => {
      updateState((state) => {
        const block = state.blocks.find((b) => b.id === selection.blockId);
        if (!block) return state;

        return {
          ...state,
          blocks: state.blocks.map((b) =>
            b.id === selection.blockId
              ? {
                  ...b,
                  heading: level,
                  type: level !== "normal" ? "heading" : "paragraph",
                }
              : b
          ),
        };
      });
    },
    [selection, updateState]
  );

  /**
   * Delete selected text
   */
  const deleteSelection = useCallback(() => {
    if (selection.start === selection.end) return;

    updateState((state) => {
      const block = state.blocks.find((b) => b.id === selection.blockId);
      if (!block) return state;

      const newContent =
        block.content.slice(0, selection.start) +
        block.content.slice(selection.end);

      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === selection.blockId ? { ...b, content: newContent } : b
        ),
      };
    });

    setSelection((prev) => ({
      ...prev,
      end: prev.start,
    }));
  }, [selection, updateState]);

  /**
   * Add new paragraph block
   */
  const addBlock = useCallback(
    (type: "paragraph" | "heading" = "paragraph") => {
      updateState((state) => ({
        ...state,
        blocks: [
          ...state.blocks,
          {
            id: nanoid(),
            type,
            content: "",
            format: { alignment: "left" },
            heading: "normal",
          },
        ],
      }));
    },
    [updateState]
  );

  /**
   * Delete a block
   */
  const deleteBlock = useCallback(
    (blockId: string) => {
      updateState((state) => ({
        ...state,
        blocks: state.blocks.filter((b) => b.id !== blockId),
      }));
    },
    [updateState]
  );

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
    updateState(() => ({ ...DEFAULT_EDITOR_STATE }));
  }, [updateState]);

  /**
   * Load state from JSON
   */
  const loadState = useCallback(
    (state: EditorState) => {
      updateState(() => state);
    },
    [updateState]
  );

  return {
    editorState,
    selection,
    setSelection,
    editorRef,
    insertText,
    applyFormat,
    applyHeading,
    deleteSelection,
    addBlock,
    deleteBlock,
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
