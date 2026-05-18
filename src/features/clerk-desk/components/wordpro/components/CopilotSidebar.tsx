import React, { useState } from "react";
import { useEditorContext } from "../contexts/EditorContext";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
} from "../components/ui/card";
import {
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * AI Copilot sidebar for intelligent writing assistance
 */
export function CopilotSidebar() {
  const { editor, getHTML, getContent } = useEditorContext();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const content = getContent();

  // tRPC mutations
  const draftTextMutation = trpc.copilot.draftText.useMutation();
  const rewriteTextMutation = trpc.copilot.rewriteText.useMutation();
  const summarizeMutation = trpc.copilot.summarizeDocument.useMutation();
  const suggestMutation = trpc.copilot.suggestImprovements.useMutation();

  const handleDraftText = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage = input;
    setInput("");

    try {
      const result = await draftTextMutation.mutateAsync({
        prompt: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", content: userMessage, timestamp: Date.now() },
        { id: (Date.now() + 1).toString(), role: "assistant", content: String(result.content), timestamp: Date.now() },
      ]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to get Copilot response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewriteSelected = async () => {
    if (!editor || editor.state.selection.empty) {
      toast.error("Please select text to rewrite");
      return;
    }

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    setIsLoading(true);
    try {
      const result = await rewriteTextMutation.mutateAsync({
        text: selectedText,
        style: "formal",
      });

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", content: `Rewrite: "${selectedText}"`, timestamp: Date.now() },
        { id: (Date.now() + 1).toString(), role: "assistant", content: String(result.content), timestamp: Date.now() },
      ]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to rewrite text");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!content.trim()) {
      toast.error("Document is empty");
      return;
    }

    setIsLoading(true);
    try {
      const result = await summarizeMutation.mutateAsync({
        content,
        length: "medium",
      });

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", content: "Summarize the document", timestamp: Date.now() },
        { id: (Date.now() + 1).toString(), role: "assistant", content: String(result.content), timestamp: Date.now() },
      ]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to summarize document");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestImprovements = async () => {
    if (!content.trim()) {
      toast.error("Document is empty");
      return;
    }

    setIsLoading(true);
    try {
      const result = await suggestMutation.mutateAsync({
        text: content,
      });

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", content: "Suggest improvements", timestamp: Date.now() },
        { id: (Date.now() + 1).toString(), role: "assistant", content: String(result.content), timestamp: Date.now() },
      ]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to get suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToEditor = (text: string) => {
    if (!editor) return;
    
    // If text is selected, replace it. Otherwise insert at cursor.
    if (!editor.state.selection.empty) {
      editor.commands.insertContent(text);
    } else {
      editor.commands.insertContent(text);
    }
    toast.success("Content applied to editor");
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-80 border-l bg-white flex flex-col h-full shadow-premium">
      {/* Header */}
      <div className="border-b p-4 bg-blue-50/50">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
          <h2 className="font-semibold text-gray-900">AI Writing Assistant</h2>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-start text-[10px] h-8 px-2"
            onClick={handleRewriteSelected}
            disabled={isLoading || !editor || editor.state.selection.empty}
          >
            <Zap className="h-3 w-3 mr-1 text-amber-500" />
            Rewrite
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start text-[10px] h-8 px-2"
            onClick={handleSummarize}
            disabled={isLoading || !content.trim()}
          >
            Summarize
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="col-span-2 justify-start text-[10px] h-8 px-2"
            onClick={handleSuggestImprovements}
            disabled={isLoading || !content.trim()}
          >
            Suggest Improvements
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-12 px-4">
            <div className="bg-blue-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
               <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
            <p className="font-medium text-gray-700">How can I help you today?</p>
            <p className="text-xs mt-2">I can draft letters, rewrite paragraphs, or summarize documents.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "rounded-2xl p-3 text-sm transition-all",
                msg.role === "user"
                  ? "bg-blue-600 text-white ml-6 rounded-tr-none shadow-md"
                  : "bg-gray-100 text-gray-900 mr-6 rounded-tl-none border border-gray-200"
              )}
            >
              <div className="flex flex-col gap-2">
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-end gap-1 mt-1 border-t border-gray-200 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] px-2 hover:bg-blue-100"
                      onClick={() => handleApplyToEditor(msg.content)}
                    >
                      Apply to Doc
                    </Button>
                    <button
                      onClick={() => handleCopyMessage(msg.content, msg.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-3 text-xs text-blue-600 font-medium animate-pulse p-2 bg-blue-50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4 space-y-3 bg-gray-50/50">
        <Textarea
          placeholder="Ask AI for help..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleDraftText();
            }
          }}
          className="resize-none text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
          rows={3}
          disabled={isLoading}
        />
        <Button
          onClick={handleDraftText}
          disabled={isLoading || !input.trim()}
          className="w-full gap-2 shadow-md"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isLoading ? "Thinking..." : "Send Request"}
        </Button>
      </div>
    </div>
  );
}
