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
import { Checkbox } from "../components/ui/checkbox";
import { Search } from "lucide-react";

interface FindReplaceProps {
  content: string;
  onReplace?: (findText: string, replaceText: string, options: FindReplaceOptions) => void;
}

interface FindReplaceOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  replaceAll: boolean;
}

/**
 * Find and Replace dialog component
 */
export function FindReplace({ content, onReplace }: FindReplaceProps) {
  const [open, setOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleFind = () => {
    if (!findText) return;

    let pattern = findText;
    if (wholeWord) {
      pattern = `\\b${findText}\\b`;
    }

    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(pattern, flags);
    const matches = content.match(regex);
    setMatchCount(matches?.length || 0);
  };

  const handleReplace = () => {
    if (!findText) return;
    onReplace?.(findText, replaceText, {
      caseSensitive,
      wholeWord,
      replaceAll: false,
    });
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    onReplace?.(findText, replaceText, {
      caseSensitive,
      wholeWord,
      replaceAll: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Search className="h-4 w-4" />
          <span className="text-xs">Find</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Find and Replace</DialogTitle>
          <DialogDescription>
            Search for text and replace it with new content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="find">Find</Label>
            <Input
              id="find"
              placeholder="Text to find..."
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyUp={handleFind}
            />
            {matchCount > 0 && (
              <p className="text-xs text-gray-500">{matchCount} matches found</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="replace">Replace with</Label>
            <Input
              id="replace"
              placeholder="Replacement text..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
              />
              <Label htmlFor="case-sensitive" className="font-normal cursor-pointer">
                Case sensitive
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="whole-word"
                checked={wholeWord}
                onCheckedChange={(checked) => setWholeWord(checked as boolean)}
              />
              <Label htmlFor="whole-word" className="font-normal cursor-pointer">
                Whole word only
              </Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={handleReplace}>
            Replace
          </Button>
          <Button onClick={handleReplaceAll}>Replace All</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
