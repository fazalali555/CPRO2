import React, { createContext, useContext, useMemo } from 'react';
import { useEditorInstance, EditorProvider } from '../../../../../contexts/EditorContext';


// Re-export EditorProvider to fix imports in LetterComposer and others
export { EditorProvider };

/**
 * Compatibility layer for wordpro components that still use useEditorContext.
 * This hook bridges the new global EditorContext with the legacy wordpro expectations.
 */
export const useEditorContext = () => {
  const editor = useEditorInstance();
  
  // Return an object that provides both the editor instance and a compatibility API
  return useMemo(() => {
    if (!editor) return {
      editor: null,
      getHTML: () => "",
      getContent: () => "",
      applyHeading: () => {},
      applyFormat: () => {},
      comments: [],
      addComment: () => {},
      resolveComment: () => {},
      deleteComment: () => {},
    } as any;

    return {
      editor,
      // Compatibility methods for old block-based editor API
      getHTML: () => editor.getHTML(),
      getContent: () => editor.getHTML(),
      applyHeading: (level: any) => {
        if (level === 'normal' || level === 0) {
          editor.commands.setParagraph();
        } else {
          editor.commands.toggleHeading({ level: parseInt(level) as any });
        }
      },
      applyFormat: (format: any) => {
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
      },
      // Mock comment functionality if not yet implemented in global context
      comments: [],
      addComment: (text: string) => console.log('Add comment:', text),
      resolveComment: (id: string) => console.log('Resolve comment:', id),
      deleteComment: (id: string) => console.log('Delete comment:', id),
    };
  }, [editor]);
};
