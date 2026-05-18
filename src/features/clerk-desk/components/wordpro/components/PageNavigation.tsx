import React from "react";
import { Button } from "../components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
}

/**
 * Page navigation component for moving between pages
 */
export function PageNavigation({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}: PageNavigationProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreviousPage}
        disabled={currentPage <= 1}
        title="Previous Page"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>

      <span className="text-xs text-gray-600 min-w-12 text-center">
        {currentPage} / {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={onNextPage}
        disabled={currentPage >= totalPages}
        title="Next Page"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Page break indicator component
 */
export function PageBreakIndicator() {
  return (
    <div className="w-full h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent my-4 flex items-center justify-center">
      <span className="text-xs text-gray-500 bg-white px-2">Page Break</span>
    </div>
  );
}
