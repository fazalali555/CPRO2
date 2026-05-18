import React, { useState } from "react";
import { useEditorContext } from "../contexts/EditorContext";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  MessageSquare,
  Trash2,
  CheckCircle,
  User,
  Plus,
} from "lucide-react";
import { cn } from "../lib/utils";

interface ReviewPanelProps {
  onClose?: () => void;
}

/**
 * Enhanced Review panel for selection-based comments
 */
export function ReviewPanel({ onClose }: ReviewPanelProps) {
  const { editor, comments, addComment, resolveComment, deleteComment } = useEditorContext();
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("comments");

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    addComment(newComment);
    setNewComment("");
  };

  const handleJumpToComment = (selection?: { from: number; to: number }) => {
    if (editor && selection) {
      editor.commands.focus();
      editor.commands.setTextSelection(selection);
      
      const dom = editor.view.domAtPos(selection.from).node as HTMLElement;
      if (dom && dom.scrollIntoView) {
        dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div className="w-80 border-l bg-white flex flex-col h-full select-none shadow-premium">
      {/* Header */}
      <div className="border-b p-4 bg-gray-50 flex items-center justify-between">
        <h2 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Review Pane</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full rounded-none border-b h-10 bg-white">
          <TabsTrigger value="comments" className="flex-1 text-xs font-bold uppercase tracking-tight">
            Comments ({comments.length})
          </TabsTrigger>
          <TabsTrigger value="changes" className="flex-1 text-xs font-bold uppercase tracking-tight">
            Changes
          </TabsTrigger>
        </TabsList>

        {/* Comments Tab */}
        <TabsContent value="comments" className="flex-1 flex flex-col overflow-hidden m-0">
          {/* New Comment Input */}
          <div className="p-4 border-b bg-blue-50/30">
            <Textarea
              placeholder="Select text in the document and add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none text-xs bg-white border-gray-200 focus:ring-blue-500 min-h-[80px]"
              rows={3}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || (editor?.state.selection.empty ?? true)}
              className="w-full mt-2 gap-2 shadow-sm"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              New Comment
            </Button>
            {editor?.state.selection.empty && (
                <p className="text-[10px] text-gray-500 mt-1 text-center italic">Please select text first</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-gray-50/50">
            {comments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                <p className="text-xs text-gray-500 font-medium tracking-tight">No comments in this document.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <Card
                  key={comment.id}
                  className={cn(
                    "border-none shadow-sm transition-all hover:shadow-md cursor-pointer",
                    comment.resolved ? "opacity-60 grayscale bg-gray-50" : "bg-white border-l-4 border-l-blue-500"
                  )}
                  onClick={() => handleJumpToComment(comment.selection)}
                >
                  <CardHeader className="p-3 pb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-800">
                          {comment.author}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-1 space-y-2">
                    <p className="text-[11px] text-gray-600 leading-relaxed">{comment.content}</p>
                    <div className="flex gap-1 justify-end border-t pt-2 mt-2 border-gray-50">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            resolveComment(comment.id);
                        }}
                        className={cn(
                            "h-6 px-2 text-[10px] gap-1",
                            comment.resolved ? "text-gray-500" : "text-green-600 hover:bg-green-50"
                        )}
                      >
                        <CheckCircle className={cn("h-3 w-3", comment.resolved ? "fill-green-500 text-white" : "")} />
                        {comment.resolved ? "Resolved" : "Resolve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteComment(comment.id);
                        }}
                        className="h-6 px-2 text-[10px] gap-1 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Changes Tab (Placeholder for now) */}
        <TabsContent value="changes" className="flex-1 flex flex-col m-0 bg-gray-50/50">
           <div className="text-center py-20 px-6">
                <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm border">
                    <span className="material-symbols-outlined text-gray-300 text-3xl">history</span>
                </div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Track Changes</p>
                <p className="text-[11px] text-gray-400 leading-relaxed italic">Changes are currently tracked in the version history. Direct inline tracking coming soon.</p>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
