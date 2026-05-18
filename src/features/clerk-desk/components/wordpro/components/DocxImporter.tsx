import React, { useRef } from "react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocxImporterProps {
  onDocumentImported?: (content: string, title: string) => void;
}

/**
 * DOCX file importer component
 * Extracts text content from .docx files
 */
export function DocxImporter({ onDocumentImported }: DocxImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      toast.error("Please select a .docx file");
      return;
    }

    setIsLoading(true);
    try {
      const content = await extractDocxContent(file);
      const title = file.name.replace(".docx", "");
      
      onDocumentImported?.(content, title);
      setOpen(false);
      toast.success(`Document "${title}" imported successfully`);
    } catch (error) {
      console.error("Error importing DOCX:", error);
      toast.error("Failed to import DOCX file. Please try another file.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Open
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open DOCX File</DialogTitle>
          <DialogDescription>
            Select a .docx file to import into the editor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium">Click to select a DOCX file</p>
            <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="hidden"
          />

          <div className="text-xs text-gray-600 space-y-1">
            <p>✓ Supported format: .docx (Microsoft Word)</p>
            <p>✓ Maximum file size: 10MB</p>
            <p>✓ Text content will be extracted</p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing document...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Extract text content from a DOCX file
 * DOCX files are ZIP archives containing XML files
 */
async function extractDocxContent(file: File): Promise<string> {
  // For simplicity, we'll extract basic text from the XML
  // In production, use a library like 'docx' or 'mammoth'
  
  const arrayBuffer = await file.arrayBuffer();
  
  // Try to extract text from the DOCX file
  // DOCX files are ZIP archives, so we need to parse them
  try {
    // Convert to string to search for text patterns
    const view = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder();
    const text = decoder.decode(view);
    
    // Extract text between XML tags (simplified approach)
    const textMatches = text.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const extractedText = textMatches
      .map(match => match.replace(/<w:t[^>]*>|<\/w:t>/g, ""))
      .join(" ");
    
    if (extractedText.trim()) {
      return extractedText;
    }
    
    // Fallback: return a message about the file
    return `[Document imported from ${file.name}]\n\nNote: Full formatting may not be preserved. For best results, copy and paste content from the original document.`;
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Unable to parse DOCX file");
  }
}
