import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, Plus, Trash2 } from "lucide-react";

interface TableData {
  rows: string[][];
}

interface TableManagerProps {
  onInsertTable?: (rows: number, cols: number) => void;
}

/**
 * Table insertion and management component
 */
export function TableManager({ onInsertTable }: TableManagerProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [open, setOpen] = useState(false);

  const handleInsert = () => {
    onInsertTable?.(rows, cols);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Table className="h-4 w-4" />
          <span className="text-xs">Table</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
          <DialogDescription>
            Specify the number of rows and columns for your table.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rows">Rows</Label>
            <Input
              id="rows"
              type="number"
              min="1"
              max="50"
              value={rows}
              onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cols">Columns</Label>
            <Input
              id="cols"
              type="number"
              min="1"
              max="20"
              value={cols}
              onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>Insert Table</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Table component for rendering tables in the editor
 */
export function EditorTable({
  rows,
  cols,
  onDelete,
}: {
  rows: number;
  cols: number;
  onDelete?: () => void;
}) {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td
                  key={`${rowIdx}-${colIdx}`}
                  className="border border-gray-300 p-2 min-w-20"
                  contentEditable
                  suppressContentEditableWarning
                >
                  {rowIdx === 0 && colIdx === 0 ? "Header" : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="mt-2 gap-1"
        >
          <Trash2 className="h-4 w-4" />
          Delete Table
        </Button>
      )}
    </div>
  );
}
