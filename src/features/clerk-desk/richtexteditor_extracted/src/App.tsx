import { useState, useRef, useCallback } from 'react';
import {
  FileText, Eye, Wand2, Printer, Download,
  RotateCcw, AlignLeft, ChevronRight, Sparkles, CheckCircle2
} from 'lucide-react';
import type { LetterData } from './types/letter';
import { parseLetter } from './utils/letterParser';
import LetterForm from './components/LetterForm';
import LetterPreview from './components/LetterPreview';
import AIImportModal from './components/AIImportModal';

const DEFAULT_DATA: LetterData = {
  sender: '',
  no: '',
  date: new Date().toISOString().split('T')[0],
  receiver: '',
  subject: '',
  body: '',
  signatureTitle: '',
  signatoryName: '',
  forwardings: [],
  letterhead: '',
  cc: '',
};

type TabMode = 'form' | 'split' | 'preview';

function toInputDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch { /* ignore */ }
  return '';
}

export default function App() {
  const [data, setData] = useState<LetterData>(DEFAULT_DATA);
  const [showAIModal, setShowAIModal] = useState(false);
  const [mode, setMode] = useState<TabMode>('split');
  const [aiToast, setAiToast] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleImport = useCallback((imported: Partial<LetterData>) => {
    setData(prev => ({ ...prev, ...imported }));
  }, []);

  // Called when the body editor detects a pasted letter structure
  const handleBodyAIPaste = useCallback((rawText: string) => {
    const parsed = parseLetter(rawText);
    const mapped: Partial<LetterData> = {
      ...(parsed.sender && { sender: parsed.sender }),
      ...(parsed.no && { no: parsed.no }),
      ...(parsed.date && { date: toInputDate(parsed.date) }),
      ...(parsed.receiver && { receiver: parsed.receiver }),
      ...(parsed.subject && { subject: parsed.subject }),
      body: parsed.body
        ? parsed.body.split('\n').map(l => `<p>${l.trim() || '<br>'}</p>`).join('')
        : '',
      ...(parsed.signatureTitle && { signatureTitle: parsed.signatureTitle }),
      ...(parsed.signatoryName && { signatoryName: parsed.signatoryName }),
      ...(parsed.forwardings?.length && { forwardings: parsed.forwardings }),
      ...(parsed.cc && { cc: parsed.cc }),
    };
    setData(prev => ({ ...prev, ...mapped }));
    setAiToast(true);
    setTimeout(() => setAiToast(false), 4500);
  }, []);

  const handleReset = () => {
    if (confirm('Reset all fields? This cannot be undone.')) {
      setData({ ...DEFAULT_DATA, date: new Date().toISOString().split('T')[0] });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    if (!previewRef.current) return;
    const letterHTML = previewRef.current.outerHTML;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Letter - ${data.subject || 'Official Letter'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; }
    .letter-preview { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.7; color: #1a1a1a; }
    .letter-preview p { margin: 0 0 10pt 0; }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>${letterHTML}</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `letter-${data.no || 'draft'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completionFields = [
    data.sender, data.no, data.date, data.receiver,
    data.subject, data.body, data.signatureTitle, data.signatoryName,
  ];
  const filled = completionFields.filter(
    f => f && f.replace(/<[^>]*>/g, '').trim().length > 0,
  ).length;
  const completion = Math.round((filled / completionFields.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body > * { display: none !important; }
          .letter-preview {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            width: 21cm !important;
            min-height: 29.7cm !important;
            padding: 2.5cm 2.5cm 2.5cm 3cm !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 12pt !important;
          }
          .letter-preview * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* ── AI TOAST ── */}
      {aiToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-bounce">
          <CheckCircle2 size={18} />
          AI letter detected — fields auto-filled!
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-tight">
                Letter Composer
              </h1>
              <p className="text-blue-300 text-xs">Official Letter Drafting & Formatting Tool</p>
            </div>
          </div>

          {/* Progress */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-sm">
            <span className="text-xs text-blue-300 whitespace-nowrap">Completion</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completion}%`,
                  background: completion === 100
                    ? 'linear-gradient(to right, #10b981, #059669)'
                    : 'linear-gradient(to right, #60a5fa, #22d3ee)',
                }}
              />
            </div>
            <span className={`text-xs font-bold ${completion === 100 ? 'text-emerald-400' : 'text-cyan-300'}`}>
              {completion}%
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/20 transition"
            >
              <Wand2 size={14} /> AI Import
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/10 transition"
            >
              <Printer size={14} /> Print
            </button>
            <button
              onClick={handleDownloadHTML}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/10 transition"
            >
              <Download size={14} /> Export
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-white/5 text-red-300 hover:bg-red-500/20 border border-white/10 transition"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </header>

      {/* ── VIEW TABS ── */}
      <div className="flex-shrink-0 bg-black/20 border-b border-white/10">
        <div className="max-w-screen-2xl mx-auto px-4 flex items-center gap-1 py-2">
          {([
            { id: 'form', icon: AlignLeft, label: 'Form Only' },
            { id: 'split', icon: ChevronRight, label: 'Split View' },
            { id: 'preview', icon: Eye, label: 'Preview Only' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                mode === tab.id
                  ? 'bg-blue-500/80 text-white shadow-lg shadow-blue-500/20'
                  : 'text-blue-200/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}

          {/* Smart paste hint */}
          <div className="ml-auto hidden sm:flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-xs text-purple-300">
            <Sparkles size={11} />
            Paste an AI letter in the body field — fields auto-fill instantly!
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <main className="flex-1 overflow-hidden">
        <div className={`h-full max-w-screen-2xl mx-auto ${mode === 'split' ? 'flex' : ''}`}
          style={{ height: 'calc(100vh - 108px)' }}
        >
          {/* ─── FORM PANEL ─── */}
          {(mode === 'form' || mode === 'split') && (
            <div
              className={`${
                mode === 'split' ? 'w-1/2 border-r border-white/10' : 'w-full'
              } h-full overflow-y-auto`}
            >
              <div className="p-4 md:p-6 pb-12">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full" />
                  <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                    Letter Details
                  </h2>
                  <span className="ml-auto text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/20">
                    {filled}/{completionFields.length} fields filled
                  </span>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 p-5 md:p-6">
                  <LetterForm
                    data={data}
                    onChange={setData}
                    onAIDetected={handleBodyAIPaste}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── PREVIEW PANEL ─── */}
          {(mode === 'preview' || mode === 'split') && (
            <div
              className={`${
                mode === 'split' ? 'w-1/2' : 'w-full'
              } h-full overflow-y-auto bg-slate-800/20`}
            >
              <div className="p-4 md:p-6 pb-12">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-full" />
                  <h2 className="text-white font-semibold text-sm uppercase tracking-wide">
                    Letter Preview
                  </h2>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-300">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Live
                  </div>
                </div>

                {/* A4 paper */}
                <div
                  className="shadow-[0_12px_60px_rgba(0,0,0,0.6)] rounded overflow-hidden"
                  style={{ width: '21cm', maxWidth: '100%', margin: '0 auto' }}
                >
                  <LetterPreview ref={previewRef} data={data} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── AI IMPORT MODAL ── */}
      {showAIModal && (
        <AIImportModal
          onClose={() => setShowAIModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
