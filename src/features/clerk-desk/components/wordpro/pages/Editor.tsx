import React, { useState, useEffect } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { EditorProvider } from "../contexts/EditorContext";
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

import { DocumentMap } from "../components/DocumentMap";

/**
 * Bridge to load initial content into Tiptap
 */
const EditorInitialLoadBridge: React.FC<{ initialContent: string }> = ({ initialContent }) => {
  const { loadContent, getHTML } = useEditorContext();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (initialContent && !loaded && getHTML() === '<p></p>') {
      loadContent(initialContent);
      setLoaded(true);
    }
  }, [initialContent, loadContent, getHTML, loaded]);

  return null;
};

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

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load last document or a specific one if needed
  useEffect(() => {
    const lastDoc = loadDocumentFromStorage(documentId);
    if (lastDoc) {
      setDocumentTitle(lastDoc.title);
      setInitialLoadContent(lastDoc.content);
      setContent(lastDoc.content);
    }
  }, [documentId]);

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
    <EditorProvider onChange={(html) => setContent(html)}>
      <EditorInitialLoadBridge initialContent={initialLoadContent} />
      <div className={cn(
        "flex flex-col bg-surface border border-outline/20 rounded-2xl overflow-hidden shadow-premium transition-all duration-500",
        focusMode ? "fixed inset-0 z-50 rounded-none h-screen" : "h-[800px]"
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
