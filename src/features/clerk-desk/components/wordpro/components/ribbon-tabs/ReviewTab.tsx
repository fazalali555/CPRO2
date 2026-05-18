import React from "react";
import { useEditorContext } from "../../contexts/EditorContext";
import { Button } from "../../components/ui/button";
import { 
    MessageSquare, 
    History, 
    CheckCircle, 
    Undo, 
    Redo, 
    SearchCode, 
    Languages,
    FileSearch,
    BookText
} from "lucide-react";
import { toast } from "sonner";

interface ReviewTabProps {
  isMobile?: boolean;
}

export function ReviewTab({ isMobile = false }: ReviewTabProps) {
  const { undo, redo, canUndo, canRedo, editor } = useEditorContext();

  const handleEditorCheck = () => {
    toast.info("AI Editor is scanning document for grammar and clarity...");
    // Future integration with AI service for full document review
  };

  const handleWordCount = () => {
      const stats = {
          words: editor?.storage.characterCount.words() || 0,
          chars: editor?.storage.characterCount.characters() || 0,
      };
      toast.info(`Document Stats: ${stats.words} words, ${stats.chars} characters.`);
  };

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={undo} disabled={!canUndo}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={redo} disabled={!canRedo}>
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Proofing Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proofing</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleEditorCheck}>
                <BookText className="h-4 w-4 text-blue-600" />
                <span className="text-xs">Editor</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleWordCount}>
                <FileSearch className="h-4 w-4" />
                <span className="text-xs">Word Count</span>
            </Button>
        </div>
      </div>

      {/* Language Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Language</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2">
                <Languages className="h-4 w-4 text-amber-600" />
                <span className="text-xs">Translate</span>
            </Button>
        </div>
      </div>

      {/* History Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">History</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={undo} disabled={!canUndo}>
                <Undo className="h-4 w-4" />
                <span className="text-xs">Undo</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={redo} disabled={!canRedo}>
                <Redo className="h-4 w-4" />
                <span className="text-xs">Redo</span>
            </Button>
        </div>
      </div>

      {/* Tracking Group */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracking</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2">
                <History className="h-4 w-4 text-emerald-600" />
                <span className="text-xs">Track Changes</span>
            </Button>
            <div className="flex items-center gap-0.5 ml-2 border-l pl-2">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Accept Change">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                    <span className="text-xs">Accept All</span>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
