import React, { useState, useEffect } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { EditorProvider } from "@/contexts/EditorContext";
import { useEditor } from "@tiptap/react";
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
import FontSize from "tiptap-extension-font-size";
import LineHeight from "tiptap-extension-line-height";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";

import { Ribbon } from "../components/Ribbon";
import { DocumentEditor } from "../components/DocumentEditor";
import { StatusBar } from "../components/StatusBar";
import { CopilotSidebar } from "../components/CopilotSidebar";
import { ReviewPanel } from "../components/ReviewPanel";
import { ExportDialog } from "../components/ExportDialog";
import { Button } from "../components/ui/button";
import { Save, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { saveDocumentToStorage, loadDocumentFromStorage } from "../lib/localStorage";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";

import { DocumentMap } from "../components/DocumentMap";

/**
 * WordPro Editor Component for Clerk Desk
 */
export default function Editor() {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [documentId, setDocumentId] = useState<string>(nanoid());
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [showCopilot, setShowCopilot] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [content, setContent] = useState("");
  const [initialLoadContent, setInitialLoadContent] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      FontSize,
      LineHeight.configure({
        types: ['paragraph', 'heading'],
        defaultLineHeight: '1.5',
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Image.configure({
        allowBase64: true,
        inline: true,
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 25,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CharacterCount,
      Comment,
      Placeholder.configure({
        placeholder: 'Start typing your official letter...',
      }),
      Typography,
    ],
    content: initialLoadContent,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    switch(e.key) {
      case 's': e.preventDefault(); handleSave(); break
      case 'p': e.preventDefault(); window.print(); break
      case 'a': e.preventDefault();
        editor?.commands.selectAll(); break
      case 'z': e.preventDefault();
        editor?.commands.undo(); break
      case 'y': e.preventDefault();
        editor?.commands.redo(); break
      case 'b': e.preventDefault();
        editor?.chain().focus().toggleBold().run(); break
      case 'i': e.preventDefault();
        editor?.chain().focus().toggleItalic().run(); break
      case 'u': e.preventDefault();
        editor?.chain().focus().toggleUnderline().run(); break
      case ']': e.preventDefault();
        editor?.commands.sinkListItem('listItem'); break
      case '[': e.preventDefault();
        editor?.commands.liftListItem('listItem'); break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editor])

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fix 2: Enable pinch zoom meta tag
  useEffect(() => {
    if (isMobile) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=5.0, user-scalable=yes');
      }
      return () => {
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
      };
    }
  }, [isMobile]);

  // Load last document or a specific one if needed
  useEffect(() => {
    const lastDoc = loadDocumentFromStorage(documentId);
    if (lastDoc) {
      setDocumentTitle(lastDoc.title);
      setInitialLoadContent(lastDoc.content);
      setContent(lastDoc.content);
      editor?.commands.setContent(lastDoc.content);
    }
  }, [documentId, editor]);

  const handleSave = async () => {
    try {
      saveDocumentToStorage({
        id: documentId,
        title: documentTitle,
        content: content,
        lastModified: Date.now(),
        metadata: {
          wordCount: content.split(/\s+/).length,
          characterCount: content.length,
          createdAt: Date.now(),
        }
      });
      toast.success("Document saved locally");
    } catch (error) {
      console.error("Failed to save document:", error);
      toast.error("Failed to save document");
    }
  };

  if (!user) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold text-on-surface-variant">Initializing WordPro...</p>
        </div>
      </div>
    );
  }

  return (
    <EditorProvider editorInstance={editor}>
      <div className={cn(
        "flex flex-col bg-surface border border-outline/20 rounded-2xl overflow-hidden shadow-premium transition-all duration-500",
        focusMode ? "fixed inset-0 z-50 rounded-none h-screen" : "min-h-[85vh] h-auto"
      )}>
        {/* Toolbar Header */}
        <div className={cn("border-b bg-surface-container-low px-4 py-2 flex items-center justify-between", focusMode && "hidden")}>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">edit_document</span>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="border-0 bg-transparent px-2 py-1 text-sm font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary rounded"
              placeholder="Document title"
            />
          </div>

          <div className="flex items-center gap-2">
            <ExportDialog documentTitle={documentTitle} content={content || ""} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            {!isMobile && (
              <>
                <Button
                  variant={showMap ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  className="gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">list</span>
                  Navigation
                </Button>
                <Button
                  variant={showCopilot ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCopilot(!showCopilot)}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Copilot
                </Button>
                <Button
                  variant={showReview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowReview(!showReview)}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Review
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Ribbon */}
        {!focusMode && <Ribbon isMobile={isMobile} onFocusModeToggle={() => setFocusMode(true)} />}

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Focus Mode Exit FAB */}
          {focusMode && (
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFocusMode(false)}
                className="absolute top-4 right-4 z-50 rounded-full bg-white shadow-lg border-2 border-blue-500 hover:bg-blue-50 h-10 px-4"
            >
                <span className="material-symbols-outlined mr-2">close_fullscreen</span>
                Exit Focus Mode
            </Button>
          )}

          {/* Navigation Map */}
          {showMap && !isMobile && !focusMode && <DocumentMap />}

          {/* Editor */}
          <div className="flex-1 flex flex-col bg-surface-container-high">
            <DocumentEditor />
            <StatusBar />
          </div>

          {/* Right Sidebar: Copilot */}
          {showCopilot && !isMobile && !focusMode && (
             <div className="w-80 border-l bg-surface shadow-premium">
                <CopilotSidebar />
             </div>
          )}

          {/* Right Sidebar: Review */}
          {showReview && !isMobile && !focusMode && (
             <div className="w-80 border-l bg-surface shadow-premium">
                <ReviewPanel onClose={() => setShowReview(false)} />
             </div>
          )}
        </div>
      </div>
    </EditorProvider>
  );
}
