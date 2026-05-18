import React, { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  FileText,
  Download,
  Upload,
  Trash2,
  Edit2,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: number;
  userId: number;
  title: string;
  content: string | null;
  templateId: number | null;
  lastModified: Date;
  createdAt: Date;
  isCloudSynced: number;
  cloudSyncedAt: Date | null;
}

/**
 * File management component for cloud storage operations
 */
export function FileManager() {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const listDocsQuery = trpc.documents.list.useQuery();
  const updateDocMutation = trpc.documents.update.useMutation();
  const deleteDocMutation = trpc.documents.delete.useMutation();

  useEffect(() => {
    if (open) {
      setDocuments(listDocsQuery.data || []);
    }
  }, [open, listDocsQuery.data]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      setDocuments(listDocsQuery.data || []);
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRename = async (id: number) => {
    if (!editingTitle.trim()) return;

    try {
      await updateDocMutation.mutateAsync({
        documentId: id,
        title: editingTitle,
      });
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === id ? { ...doc, title: editingTitle } : doc
        )
      );
      setEditingId(null);
      toast.success("Document renamed");
    } catch (error) {
      console.error("Failed to rename document:", error);
      toast.error("Failed to rename document");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocMutation.mutateAsync({ documentId: id });
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleExportPDF = (docId: number) => {
    // TODO: Implement PDF export
    toast.info("PDF export coming soon");
  };

  const handleExportDOCX = (docId: number) => {
    // TODO: Implement DOCX export
    toast.info("DOCX export coming soon");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Open
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>My Documents</DialogTitle>
          <DialogDescription>
            Manage your saved documents in the cloud.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No documents yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    {editingId === doc.id ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="text-sm"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-sm">{doc.title}</p>
                        <p className="text-xs text-gray-500">
                          Updated {new Date(doc.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {editingId === doc.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRename(doc.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(doc.id);
                            setEditingTitle(doc.title);
                          }}
                          className="h-8 w-8 p-0"
                          title="Rename"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExportPDF(doc.id)}
                          className="h-8 w-8 p-0"
                          title="Export as PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
