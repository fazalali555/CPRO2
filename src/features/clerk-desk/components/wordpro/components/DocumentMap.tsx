import React from "react";
import { useEditorContext } from "../contexts/EditorContext";
import { cn } from "../lib/utils";
import { ChevronRight, List } from "lucide-react";

/**
 * Document Map / Navigation Pane for quick jumping to headings
 */
export function DocumentMap() {
  const { editor } = useEditorContext();

  if (!editor) return null;

  // Extract all headings from the editor
  const headings: { text: string; level: number; pos: number }[] = [];
  
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      headings.push({
        text: node.textContent,
        level: node.attrs.level,
        pos,
      });
    }
  });

  const jumpToHeading = (pos: number) => {
    editor.commands.focus();
    editor.commands.setTextSelection(pos);
    
    // Scroll to element
    const dom = editor.view.domAtPos(pos).node as HTMLElement;
    if (dom && dom.scrollIntoView) {
        dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="w-64 border-r bg-gray-50 flex flex-col h-full select-none">
      <div className="p-4 border-b bg-white flex items-center gap-2">
        <List className="h-4 w-4 text-blue-600" />
        <h3 className="font-semibold text-sm">Navigation</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {headings.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-xs text-gray-500 italic">No headings found. Add headings to your document to see them here.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {headings.map((heading, idx) => (
              <button
                key={idx}
                onClick={() => jumpToHeading(heading.pos)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-colors hover:bg-white hover:shadow-sm flex items-start gap-1 group",
                  heading.level === 1 ? "font-bold text-gray-900" : "text-gray-600"
                )}
                style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
              >
                <ChevronRight className="h-3 w-3 mt-0.5 text-gray-300 group-hover:text-blue-500 shrink-0" />
                <span className="truncate">{heading.text || "(Empty Heading)"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
