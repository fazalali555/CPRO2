import React from "react";
import { useEditorContext } from "../../contexts/EditorContext";
import { Button } from "../../components/ui/button";
import { BookOpen, Link, Bookmark, PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface ReferencesTabProps {
  isMobile?: boolean;
}

export function ReferencesTab({ isMobile = false }: ReferencesTabProps) {
  const { editor } = useEditorContext();

  const handleInsertTOC = () => {
    if (!editor) return;

    // Generate TOC HTML from headings
    const headings: { text: string; level: number }[] = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "heading") {
        headings.push({
          text: node.textContent,
          level: node.attrs.level,
        });
      }
    });

    if (headings.length === 0) {
      toast.error("No headings found to generate Table of Contents");
      return;
    }

    let tocHtml = `
      <div class="toc-container" style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Table of Contents</h2>
        <ul style="list-style: none; padding: 0;">
    `;

    headings.forEach((h) => {
      tocHtml += `
        <li style="margin-left: ${(h.level - 1) * 20}px; margin-bottom: 8px; display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc;">
          <span style="background: #f9fafb; padding-right: 5px;">${h.text}</span>
          <span style="background: #f9fafb; padding-left: 5px; color: #6b7280;">...</span>
        </li>
      `;
    });

    tocHtml += `</ul></div>`;

    // Insert at current cursor position or start
    editor.commands.insertContent(tocHtml);
    toast.success("Table of Contents generated");
  };

  const handleInsertFootnote = () => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    // This is a simple implementation, usually footnotes are managed better
    editor.commands.insertContent('<sup style="color: #3b82f6; font-weight: bold; cursor: help;">[1]</sup>');
    editor.commands.setContent(`${currentHtml}<div class="footnotes" style="border-top: 1px solid #ccc; margin-top: 40px; padding-top: 10px; font-size: 0.8em; color: #666;">1. Add footnote description here...</div>`);
    toast.success("Footnote placeholder added");
  };

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleInsertTOC}>
          <BookOpen className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={handleInsertFootnote}>
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleInsertTOC}>
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span className="text-xs">Table of Contents</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleInsertFootnote}>
          <Bookmark className="h-4 w-4 text-amber-600" />
          <span className="text-xs">Footnote</span>
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Link className="h-4 w-4 text-emerald-600" />
          <span className="text-xs">Citations</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <PlusCircle className="h-4 w-4" />
          <span className="text-xs">Manage Sources</span>
        </Button>
      </div>
    </div>
  );
}
