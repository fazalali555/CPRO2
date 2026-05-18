import React from "react";
import { useEditorContext } from "../../contexts/EditorContext";
import { Button } from "../../components/ui/button";
import { 
    BookOpen, 
    Link, 
    Bookmark, 
    PlusCircle, 
    Image as ImageIcon, 
    Table as TableIcon,
    Shapes,
    Type,
    Sigma,
    Hash,
    FileText,
    Scissors
} from "lucide-react";
import { toast } from "sonner";
import { TableManager } from "../../components/TableManager";
import { ImageUpload } from "../../components/ImageUpload";
import { HyperlinkDialog } from "../../components/HyperlinkDialog";
import { PageNumberButton, HeaderFooterDialog, PageBreakButton } from "../../components/PageElements";

interface InsertTabProps {
  isMobile?: boolean;
}

export function InsertTab({ isMobile = false }: InsertTabProps) {
  const { editor } = useEditorContext();

  const handleInsertTable = (rows: number, cols: number) => {
    editor?.commands.insertTable({ rows, cols, withHeaderRow: true });
  };

  const handleInsertImage = (imageUrl: string, alt: string) => {
    editor?.commands.setImage({ src: imageUrl, alt });
  };

  const handleInsertLink = (url: string, text: string) => {
    if (text) {
        editor?.commands.insertContent(`<a href="${url}">${text}</a>`);
    } else {
        editor?.commands.setLink({ href: url });
    }
  };

  const handleInsertPageNumber = () => {
    editor?.commands.insertContent('<span class="page-number-placeholder">#PAGE#</span>');
  };

  const handleInsertHeader = (text: string) => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    editor.commands.setContent(`<div class="document-header" style="text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; font-weight: bold;">${text}</div>${currentHtml}`);
  };

  const handleInsertFooter = (text: string) => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    editor.commands.setContent(`${currentHtml}<div class="document-footer" style="text-align: center; border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; font-size: 0.8em; color: #666;">${text}</div>`);
  };

  const handleInsertPageBreak = () => {
    editor?.commands.setHardBreak();
    editor?.commands.insertContent('<hr class="page-break" style="border: none; border-top: 2px dashed #ccc; margin: 40px 0; position: relative;" />');
  };

  const handleInsertSymbol = (symbol: string) => {
      editor?.commands.insertContent(symbol);
  };

  const getSelectedText = () => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  };

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-1">
        <TableManager onInsertTable={handleInsertTable} />
        <ImageUpload onImageInsert={handleInsertImage} />
        <HyperlinkDialog onInsertLink={handleInsertLink} selectedText={getSelectedText()} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Pages Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pages</span>
        <div className="flex items-center gap-1">
            <PageBreakButton onInsertPageBreak={handleInsertPageBreak} />
        </div>
      </div>

      {/* Tables Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tables</span>
        <div className="flex items-center gap-1">
            <TableManager onInsertTable={handleInsertTable} />
        </div>
      </div>

      {/* Illustrations Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Illustrations</span>
        <div className="flex items-center gap-1">
            <ImageUpload onImageInsert={handleInsertImage} />
            <Button variant="outline" size="sm" className="h-8 gap-2">
                <Shapes className="h-4 w-4 text-blue-500" />
                <span className="text-xs">Shapes</span>
            </Button>
        </div>
      </div>

      {/* Links Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Links</span>
        <div className="flex items-center gap-1">
            <HyperlinkDialog onInsertLink={handleInsertLink} selectedText={getSelectedText()} />
            <Button variant="outline" size="sm" className="h-8 gap-2">
                <Bookmark className="h-4 w-4 text-amber-500" />
                <span className="text-xs">Bookmark</span>
            </Button>
        </div>
      </div>

      {/* Header & Footer Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Header/Footer</span>
        <div className="flex items-center gap-1">
            <HeaderFooterDialog onInsertHeader={handleInsertHeader} onInsertFooter={handleInsertFooter} />
            <PageNumberButton onInsertPageNumber={handleInsertPageNumber} />
        </div>
      </div>

      {/* Symbols Group */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Symbols</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => handleInsertSymbol("π")}>
                <Sigma className="h-4 w-4 text-red-500" />
                <span className="text-xs">Equation</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => handleInsertSymbol("©")}>
                <Type className="h-4 w-4 text-blue-500" />
                <span className="text-xs">Symbol</span>
            </Button>
        </div>
      </div>
    </div>
  );
}
