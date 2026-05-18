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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Hash, FileText } from "lucide-react";
import { toast } from "sonner";

interface PageElementsProps {
  onInsertPageNumber?: () => void;
  onInsertHeader?: (text: string) => void;
  onInsertFooter?: (text: string) => void;
}

/**
 * Page number insertion component
 */
export function PageNumberButton({ onInsertPageNumber }: { onInsertPageNumber?: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1"
      onClick={() => {
        onInsertPageNumber?.();
        toast.success("Page number inserted");
      }}
    >
      <Hash className="h-4 w-4" />
      <span className="text-xs">Page #</span>
    </Button>
  );
}

/**
 * Header and footer insertion dialog
 */
export function HeaderFooterDialog({ onInsertHeader, onInsertFooter }: PageElementsProps) {
  const [open, setOpen] = useState(false);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");

  const handleInsertHeader = () => {
    if (!headerText.trim()) {
      toast.error("Please enter header text");
      return;
    }
    onInsertHeader?.(headerText);
    setHeaderText("");
    toast.success("Header inserted");
  };

  const handleInsertFooter = () => {
    if (!footerText.trim()) {
      toast.error("Please enter footer text");
      return;
    }
    onInsertFooter?.(footerText);
    setFooterText("");
    toast.success("Footer inserted");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <FileText className="h-4 w-4" />
          <span className="text-xs">Header/Footer</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Header and Footer</DialogTitle>
          <DialogDescription>
            Add header and footer text to your document.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="header" className="w-full py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="header">Header</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="header" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="header-text">Header Text</Label>
              <Input
                id="header-text"
                placeholder="Enter header text..."
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
              />
            </div>
            <Button onClick={handleInsertHeader} className="w-full">
              Insert Header
            </Button>
          </TabsContent>

          <TabsContent value="footer" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="footer-text">Footer Text</Label>
              <Input
                id="footer-text"
                placeholder="Enter footer text..."
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
              />
            </div>
            <Button onClick={handleInsertFooter} className="w-full">
              Insert Footer
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Page break button
 */
export function PageBreakButton({ onInsertPageBreak }: { onInsertPageBreak?: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-1"
      onClick={() => {
        onInsertPageBreak?.();
        toast.success("Page break inserted");
      }}
    >
      <span className="text-xs">Page Break</span>
    </Button>
  );
}
