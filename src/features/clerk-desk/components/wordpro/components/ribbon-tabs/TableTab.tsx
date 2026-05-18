import React from "react";
import { useEditorContext } from "../../contexts/EditorContext";
import { Button } from "../../components/ui/button";
import { 
  Columns, 
  Rows, 
  Trash2, 
  Merge, 
  Split, 
  PlusSquare,
  MinusSquare,
  ArrowDownToLine,
  ArrowUpToLine,
  ArrowLeftToLine,
  ArrowRightToLine
} from "lucide-react";

/**
 * Table Design/Layout tab that appears when a table is active
 */
export function TableTab() {
  const { editor } = useEditorContext();

  if (!editor || !editor.isActive("table")) return null;

  return (
    <div className="flex items-center gap-6">
      {/* Insert Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-500 uppercase">Insert</span>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            title="Insert Above"
            onClick={() => editor.commands.addRowBefore()}
          >
            <ArrowUpToLine className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            title="Insert Below"
            onClick={() => editor.commands.addRowAfter()}
          >
            <ArrowDownToLine className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            title="Insert Left"
            onClick={() => editor.commands.addColumnBefore()}
          >
            <ArrowLeftToLine className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            title="Insert Right"
            onClick={() => editor.commands.addColumnAfter()}
          >
            <ArrowRightToLine className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-500 uppercase">Delete</span>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" 
            title="Delete Row"
            onClick={() => editor.commands.deleteRow()}
          >
            <Rows className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600" 
            title="Delete Column"
            onClick={() => editor.commands.deleteColumn()}
          >
            <Columns className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-red-600 hover:text-white" 
            title="Delete Table"
            onClick={() => editor.commands.deleteTable()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Merge Group */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-500 uppercase">Merge</span>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2"
            onClick={() => editor.commands.mergeCells()}
          >
            <Merge className="h-4 w-4" />
            <span className="text-xs">Merge Cells</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2"
            onClick={() => editor.commands.splitCell()}
          >
            <Split className="h-4 w-4" />
            <span className="text-xs">Split Cell</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
