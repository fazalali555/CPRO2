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
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportAsDocx, exportAsPdf, exportAsHtml, exportAsText } from "../lib/exportUtils";

interface ExportDialogProps {
  documentTitle: string;
  content: string;
}

/**
 * Export dialog for DOCX, PDF, HTML and Text formats
 */
export function ExportDialog({ documentTitle, content }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState(documentTitle || "document");

  const handleExportPDF = async () => {
    setIsLoading(true);
    try {
      exportAsPdf(content, fileName);
      toast.success("Document exported as PDF");
      setOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDOCX = async () => {
    setIsLoading(true);
    try {
      exportAsDocx(content, fileName);
      toast.success("Document exported as DOCX");
      setOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to export DOCX");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportHTML = async () => {
    setIsLoading(true);
    try {
      exportAsHtml(content, fileName);
      toast.success("Document exported as HTML");
      setOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to export HTML");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportText = async () => {
    setIsLoading(true);
    try {
      exportAsText(content, fileName);
      toast.success("Document exported as Text");
      setOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to export Text");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Document</DialogTitle>
          <DialogDescription>
            Choose a format to export your document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="export-filename">File Name</Label>
            <Input
              id="export-filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Document name"
            />
          </div>

          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleExportDOCX}
                disabled={isLoading}
                className="gap-2"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                DOCX
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isLoading}
                className="gap-2"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleExportHTML}
                disabled={isLoading}
                className="gap-2"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                HTML
              </Button>
              <Button
                variant="outline"
                onClick={handleExportText}
                disabled={isLoading}
                className="gap-2"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Text
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
