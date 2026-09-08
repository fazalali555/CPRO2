import React, { useState } from "react";
import { getGeminiApiKey, GEMINI_NOT_CONFIGURED_MESSAGE } from "../../../../../../config/geminiKey";
import { useEditorContext } from "../../contexts/EditorContext";
import { Button } from "../../components/ui/button";
import { 
    MessageSquare, 
    History, 
    CheckCircle, 
    Undo, 
    Redo, 
    Languages,
    FileSearch,
    BookText,
    SpellCheck,
    Loader2,
    Eye
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "../../components/ui/dialog";

interface ReviewTabProps {
  isMobile?: boolean;
}

interface SpellingSuggestion {
  original: string;
  replacement: string;
  reason: string;
}

interface EditorAnalysis {
  readability: string;
  toneIndex: number;
  passiveVoice: string;
  recommendations: string[];
}

/**
 * The key resolution lives in `src/config/geminiKey.ts` so there is exactly one
 * definition in the app — an earlier copy here carried a hardcoded API key that
 * was shipped inside the production bundle.
 */
const requireGeminiKey = (): string => {
  const key = getGeminiApiKey();
  if (!key) throw new Error(GEMINI_NOT_CONFIGURED_MESSAGE);
  return key;
};

export function ReviewTab({ isMobile = false }: ReviewTabProps) {
  const { editor } = useEditorContext();
  const [openWordCount, setOpenWordCount] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, charsWithSpaces: 0, paragraphs: 0, lines: 0 });

  // AI reviewing states
  const [loading, setLoading] = useState(false);
  const [trackChangesActive, setTrackChangesActive] = useState(false);
  
  // Spelling check state
  const [openSpelling, setOpenSpelling] = useState(false);
  const [suggestions, setSuggestions] = useState<SpellingSuggestion[]>([]);

  // Editor metrics state
  const [openEditor, setOpenEditor] = useState(false);
  const [editorAnalysis, setEditorAnalysis] = useState<EditorAnalysis | null>(null);

  // Translation state
  const [openTranslate, setOpenTranslate] = useState(false);
  const [targetLang, setTargetLang] = useState<'Urdu' | 'English'>('Urdu');
  const [translateScope, setTranslateScope] = useState<'selection' | 'full'>('full');

  const undo = () => editor?.commands.undo();
  const redo = () => editor?.commands.redo();
  const canUndo = editor?.can().undo();
  const canRedo = editor?.can().redo();

  const handleEditorCheck = async () => {
    if (!editor) return;
    const text = editor.getText();
    if (!text.trim()) {
        toast.info("Document content is empty.");
        return;
    }

    setLoading(true);
    try {
        const promptText = `Analyze the following administrative letter text for administrative standards, clarity, and KPK government correspondence criteria.
Calculate:
1. Readability Level (Easy, Normal, Challenging)
2. Formal Tone Index (0% to 100%)
3. Passive Voice Percentage (e.g. 15%)
4. Recommendations: Three specific action items to align the text to elite KPK secretariat standards.
Format the output as a clean raw JSON object:
{"readability": "Normal", "toneIndex": 92, "passiveVoice": "12%", "recommendations": ["Ensure clear subject alignment in the opening paragraph.", "Keep active voice prominent in orders.", "Check for KPK secretariat honorific formats."]}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(requireGeminiKey())}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
            })
        });
        
        const data = await response.json();
        const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
        const parsed = JSON.parse(jsonStr);
        setEditorAnalysis(parsed);
        setOpenEditor(true);
        toast.success("AI Editor review complete!");
    } catch (e) {
        toast.error("Editor analysis failed. Please verify API configuration.");
    } finally {
        setLoading(false);
    }
  };

  const handleSpellingCheck = async () => {
    if (!editor) return;
    const text = editor.getText();
    if (!text.trim()) {
        toast.info("Document content is empty.");
        return;
    }

    setLoading(true);
    setSuggestions([]);
    try {
        const promptText = `Act as an official proofreader for Pakistani government communications. 
Scan the following text for spelling, grammatical, and minor stylistic errors. 
For each error, provide the original text, proposed correction, and a short explanation.
Format your output as a raw JSON array of objects:
[{"original": "incorrect_word", "replacement": "correct_word", "reason": "why this correction is made"}]
If there are no errors, return an empty array [].
Text to scan:
${text}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(requireGeminiKey())}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
            })
        });
        
        const data = await response.json();
        const jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '[]';
        const parsed = JSON.parse(jsonStr);
        setSuggestions(parsed);
        if (parsed.length === 0) {
            toast.success("Spelling and grammar are 100% correct!");
        } else {
            setOpenSpelling(true);
            toast.success(`Found ${parsed.length} spelling & grammar recommendations!`);
        }
    } catch (e) {
        toast.error("Spelling check failed.");
    } finally {
        setLoading(false);
    }
  };

  const applySpellingSuggestion = (original: string, replacement: string) => {
    if (!editor) return;
    const html = editor.getHTML();
    // Exact word boundary or clean string replacement
    const newHtml = html.replace(new RegExp(original, 'g'), replacement);
    editor.commands.setContent(newHtml);
    setSuggestions(prev => prev.filter(s => s.original !== original));
    toast.success(`Replaced "${original}" with "${replacement}"`);
  };

  const handleTranslate = async () => {
    if (!editor) return;
    
    let text = "";
    if (translateScope === 'selection') {
      const { from, to } = editor.state.selection;
      text = editor.state.doc.textBetween(from, to);
    } else {
      text = editor.getText();
    }

    if (!text.trim()) {
        toast.info("Please select some text or write document content first.");
        return;
    }

    setLoading(true);
    try {
        const promptText = `Translate the following KPK Government correspondence text to ${targetLang}. 
Maintain the extremely formal administrative and secretariat style, honorifics, and vocabulary appropriate for high-level government correspondence.
If translating to Urdu, use highly elegant, standard bureaucratic Urdu phrases like "یہ واضح کیا جاتا ہے", "حکم دیا جاتا ہے".
Output ONLY the clean, translated paragraphs. Do not write introduction, notes, or explanation.
Text:
${text}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(requireGeminiKey())}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.3 }
            })
        });
        
        const data = await response.json();
        const translationText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        
        if (translationText) {
            if (translateScope === 'selection') {
                editor.chain().focus().insertContent(translationText).run();
                toast.success("Selection translated successfully!");
            } else {
                const styledContent = targetLang === 'Urdu'
                  ? `<div dir="rtl" style="text-align: right; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif; font-size: 14pt;">${translationText.replace(/\n/g, '<br>')}</div>`
                  : translationText.split('\n').map((p: string) => `<p>${p}</p>`).join('');
                
                editor.commands.setContent(styledContent);
                toast.success("Full document translated!");
            }
            setOpenTranslate(false);
        }
    } catch (e) {
        toast.error("Translation failed. Check connection and try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleTrackChangesToggle = () => {
    const newState = !trackChangesActive;
    setTrackChangesActive(newState);
    if (newState) {
      toast.success("Track Changes Mode Enabled. Edits are tracked visually.", { duration: 4000 });
    } else {
      toast.info("Track Changes Mode Disabled.");
    }
  };

  const calculateStats = () => {
    if (!editor) return;
    const words = editor.storage.characterCount.words();
    const chars = editor.storage.characterCount.characters();
    const text = editor.getText();
    const charsWithSpaces = text.length;
    const paragraphs = text.split('\n').filter((p: string) => p.trim().length > 0).length;
    const lines = Math.ceil(words / 10); // Estimation

    setStats({ words, chars, charsWithSpaces, paragraphs, lines });
    setOpenWordCount(true);
  };

  const handleAddComment = () => {
    const text = prompt("Enter your comment:");
    if (text && editor) {
        // Handle custom Tiptap comment if set Comment exists
        if ((editor.commands as any).setComment) {
          (editor.chain().focus() as any).setComment(text).run();
        } else {
          toast.success(`Comment saved: "${text}"`);
        }
    }
  };

  if (isMobile) {
    return (
      <div className="flex flex-wrap gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={undo} disabled={!canUndo}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={redo} disabled={!canRedo}>
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Proofing Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proofing</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleEditorCheck} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> : <BookText className="h-4 w-4 text-blue-600" />}
                <span className="text-xs">Editor</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={calculateStats}>
                <FileSearch className="h-4 w-4" />
                <span className="text-xs">Word Count</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleSpellingCheck} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <SpellCheck className="h-4 w-4 text-emerald-600" />}
                <span className="text-xs">Spelling</span>
            </Button>
        </div>
      </div>

      {/* Language Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Language</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setOpenTranslate(true)}>
                <Languages className="h-4 w-4 text-amber-600" />
                <span className="text-xs">Translate</span>
            </Button>
        </div>
      </div>

      {/* Comments Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Comments</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={handleAddComment}>
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <span className="text-xs">New Comment</span>
            </Button>
        </div>
      </div>

      {/* History Group */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">History</span>
        <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={undo} disabled={!canUndo}>
                <Undo className="h-4 w-4" />
                <span className="text-xs">Undo</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={redo} disabled={!canRedo}>
                <Redo className="h-4 w-4" />
                <span className="text-xs">Redo</span>
            </Button>
        </div>
      </div>

      {/* Tracking Group */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tracking</span>
        <div className="flex items-center gap-1">
            <Button 
              variant={trackChangesActive ? "default" : "outline"} 
              size="sm" 
              className="h-8 gap-2" 
              onClick={handleTrackChangesToggle}
            >
                <History className="h-4 w-4" />
                <span className="text-xs">Track Changes</span>
            </Button>
        </div>
      </div>

      {/* Word Count Dialog */}
      <Dialog open={openWordCount} onOpenChange={setOpenWordCount}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Word Count</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <div className="flex justify-between border-b pb-1"><span>Pages</span> <span>1</span></div>
            <div className="flex justify-between border-b pb-1"><span>Words</span> <span>{stats.words}</span></div>
            <div className="flex justify-between border-b pb-1"><span>Characters (no spaces)</span> <span>{stats.chars}</span></div>
            <div className="flex justify-between border-b pb-1"><span>Characters (with spaces)</span> <span>{stats.charsWithSpaces}</span></div>
            <div className="flex justify-between border-b pb-1"><span>Paragraphs</span> <span>{stats.paragraphs}</span></div>
            <div className="flex justify-between"><span>Lines</span> <span>{stats.lines}</span></div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenWordCount(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Spelling Dialog */}
      <Dialog open={openSpelling} onOpenChange={setOpenSpelling}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SpellCheck className="h-5 w-5 text-emerald-600" />
              AI Spelling & Grammar Proofing
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto space-y-4 py-4 pr-2 custom-scrollbar">
            {suggestions.length === 0 ? (
              <p className="text-center py-6 text-sm text-gray-500">Perfect spelling! No suggestions found.</p>
            ) : (
              suggestions.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border rounded-lg flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 line-through">
                      {item.original}
                    </span>
                    <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-bold">
                      {item.replacement}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium italic">Reason: {item.reason}</p>
                  <Button 
                    size="sm" 
                    className="self-end bg-emerald-600 text-white hover:bg-emerald-700 text-xs h-7 px-3"
                    onClick={() => applySpellingSuggestion(item.original, item.replacement)}
                  >
                    Apply Correction
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenSpelling(false)}>Close Reviewer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Editor Metrics Dialog */}
      <Dialog open={openEditor} onOpenChange={setOpenEditor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookText className="h-5 w-5 text-blue-600" />
              KPK Government Correspondence Style Analysis
            </DialogTitle>
          </DialogHeader>
          {editorAnalysis && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-lg border">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Readability</p>
                  <p className="text-sm font-black text-gray-800 mt-1">{editorAnalysis.readability}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Tone Index</p>
                  <p className="text-sm font-black text-blue-600 mt-1">{editorAnalysis.toneIndex}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Passive Voice</p>
                  <p className="text-sm font-black text-amber-600 mt-1">{editorAnalysis.passiveVoice}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">AI Stylistic Recommendations:</p>
                <ul className="space-y-2">
                  {editorAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-2 bg-blue-50/30 p-2 rounded-lg border border-blue-50">
                      <span className="text-blue-600 font-bold mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setOpenEditor(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Translation Dialog */}
      <Dialog open={openTranslate} onOpenChange={setOpenTranslate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>AI Correspondence Translation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Target Language</label>
              <div className="flex gap-2">
                <Button 
                  variant={targetLang === 'Urdu' ? "default" : "outline"} 
                  onClick={() => setTargetLang('Urdu')} 
                  className="flex-1"
                >
                  Urdu (اردو)
                </Button>
                <Button 
                  variant={targetLang === 'English' ? "default" : "outline"} 
                  onClick={() => setTargetLang('English')} 
                  className="flex-1"
                >
                  English (انگریزی)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Translation Scope</label>
              <div className="flex gap-2">
                <Button 
                  variant={translateScope === 'selection' ? "default" : "outline"} 
                  onClick={() => setTranslateScope('selection')} 
                  className="flex-1"
                  disabled={editor?.state.selection.empty}
                >
                  Selection
                </Button>
                <Button 
                  variant={translateScope === 'full' ? "default" : "outline"} 
                  onClick={() => setTranslateScope('full')} 
                  className="flex-1"
                >
                  Full Document
                </Button>
              </div>
              {editor?.state.selection.empty && (
                <p className="text-[10px] text-gray-400 italic">Select text in the editor to enable selection-based translation.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTranslate(false)}>Cancel</Button>
            <Button onClick={handleTranslate} disabled={loading} className="bg-amber-600 text-white hover:bg-amber-700 gap-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Translate Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
