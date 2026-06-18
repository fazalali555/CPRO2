import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Button } from "../components/ui/button";
import { Table } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableManagerProps {
  onInsertTable?: (rows: number, cols: number) => void;
}

/**
 * Table insertion and management component with 10x8 grid hover selector
 */
export function TableManager({ onInsertTable }: TableManagerProps) {
  const [open, setOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  const maxRows = 8;
  const maxCols = 10;

  const handleInsert = (r: number, c: number) => {
    onInsertTable?.(r + 1, c + 1);
    setOpen(false);
    setHoveredCell(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Table className="h-4 w-4" />
          <span className="text-xs">Table</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-center mb-1">
            {hoveredCell ? `${hoveredCell.c + 1}x${hoveredCell.r + 1} Table` : "Insert Table"}
          </div>
          <div 
            className="flex flex-col gap-1"
            onMouseLeave={() => setHoveredCell(null)}
          >
            {Array.from({ length: maxRows }).map((_, r) => (
              <div key={r} className="flex gap-1">
                {Array.from({ length: maxCols }).map((_, c) => {
                  const isHighlighted = hoveredCell && r <= hoveredCell.r && c <= hoveredCell.c;
                  return (
                    <div
                      key={c}
                      className={cn(
                        "w-4 h-4 border border-gray-300 rounded-sm cursor-pointer",
                        isHighlighted ? "bg-blue-200 border-blue-400" : "bg-white"
                      )}
                      onMouseEnter={() => setHoveredCell({ r, c })}
                      onClick={() => handleInsert(r, c)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
