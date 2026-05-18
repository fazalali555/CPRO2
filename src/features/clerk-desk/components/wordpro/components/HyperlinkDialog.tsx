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
import { Link2 } from "lucide-react";
import { toast } from "sonner";

interface HyperlinkDialogProps {
  onInsertLink?: (url: string, text: string) => void;
  selectedText?: string;
}

/**
 * Hyperlink insertion dialog component
 */
export function HyperlinkDialog({ onInsertLink, selectedText }: HyperlinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState(selectedText || "");

  const handleInsert = () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!text.trim()) {
      toast.error("Please enter link text");
      return;
    }

    // Validate URL
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    onInsertLink?.(url, text);
    setOpen(false);
    setUrl("");
    setText(selectedText || "");
    toast.success("Link inserted");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Link2 className="h-4 w-4" />
          <span className="text-xs">Link</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Hyperlink</DialogTitle>
          <DialogDescription>
            Add a hyperlink to your document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="link-text">Link Text</Label>
            <Input
              id="link-text"
              placeholder="Text to display"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleInsert();
                }
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInsert}>Insert Link</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
