import React, { useState, useRef } from "react";
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
import { Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageInsert?: (imageUrl: string, alt: string) => void;
}

/**
 * Image upload and insertion component
 */
export function ImageUpload({ onImageInsert }: ImageUploadProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInsert = async () => {
    if (!preview) {
      toast.error("Please select an image");
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, you would upload to storage here
      // For now, we'll use the data URL directly
      onImageInsert?.(preview, altText || "Image");
      setOpen(false);
      setPreview(null);
      setAltText("");
      toast.success("Image inserted");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to insert image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <ImageIcon className="h-4 w-4" />
          <span className="text-xs">Image</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
          <DialogDescription>
            Upload an image from your computer to insert into the document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="image-file">Select Image</Label>
            <Input
              ref={fileInputRef}
              id="image-file"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Supported formats: JPG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg p-2 bg-gray-50">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-48 mx-auto"
                />
              </div>
            </div>
          )}

          {/* Alt Text */}
          <div className="space-y-2">
            <Label htmlFor="alt-text">Alternative Text (optional)</Label>
            <Input
              id="alt-text"
              placeholder="Describe the image for accessibility"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={isLoading || !preview}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={isLoading || !preview}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Inserting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Insert Image
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Image component for rendering images in the editor
 */
export function EditorImage({
  src,
  alt,
  onDelete,
}: {
  src: string;
  alt: string;
  onDelete?: () => void;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(300);

  return (
    <div className="my-4 flex justify-center">
      <div className="relative inline-block">
        <img
          src={src}
          alt={alt}
          className="max-w-full rounded-lg shadow-sm"
          style={{ width: `${width}px` }}
        />
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
          >
            ✕
          </button>
        )}
        {/* Resize handle */}
        <div
          onMouseDown={() => setIsResizing(true)}
          onMouseUp={() => setIsResizing(false)}
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 rounded-tl cursor-se-resize hover:bg-blue-700"
        />
      </div>
    </div>
  );
}
