import React, { useState } from 'react';
import { X, Wand2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseLetter } from '../utils/letterParser';
import type { LetterData, ParsedLetter } from '../types/letter';

interface AIImportModalProps {
  onClose: () => void;
  onImport: (data: Partial<LetterData>) => void;
}

const FIELD_LABELS: Record<keyof ParsedLetter, string> = {
  sender: 'Sender / From',
  no: 'Reference No.',
  date: 'Date',
  receiver: 'Receiver / To',
  subject: 'Subject',
  body: 'Letter Body',
  signatureTitle: 'Signature Title',
  signatoryName: 'Signatory Name',
  forwardings: 'Forwardings',
  cc: 'CC',
};

const AIImportModal: React.FC<AIImportModalProps> = ({ onClose, onImport }) => {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedLetter | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const handleParse = () => {
    if (!rawText.trim()) return;
    const result = parseLetter(rawText);
    setParsed(result);
    setStep('preview');
  };

  const handleConfirm = () => {
    if (!parsed) return;
    const data: Partial<LetterData> = {
      sender: parsed.sender || '',
      no: parsed.no || '',
      date: parsed.date ? toInputDate(parsed.date) : '',
      receiver: parsed.receiver || '',
      subject: parsed.subject || '',
      body: parsed.body ? parsed.body.split('\n').map(l => `<p>${l}</p>`).join('') : '',
      signatureTitle: parsed.signatureTitle || '',
      signatoryName: parsed.signatoryName || '',
      forwardings: parsed.forwardings || [],
      cc: parsed.cc || '',
    };
    onImport(data);
    onClose();
  };

  const toInputDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch {}
    return '';
  };

  const detectedCount = parsed ? Object.values(parsed).filter(v => v && (Array.isArray(v) ? v.length > 0 : v.toString().trim())).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Wand2 size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">AI Letter Import</h2>
              <p className="text-xs text-gray-500">Paste AI-generated or any letter text to auto-detect fields</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-700">
                <strong>How it works:</strong> Paste any AI-generated or pre-written letter below. The system will automatically detect and extract fields like Sender, Date, Receiver, Subject, Body, Signature, and more.
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Paste Letter Text</label>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder={`Paste your AI-generated letter here...\n\nExample:\nFrom: Ministry of Education\nTo: The Director General\nDate: 15th January 2025\nRef No: MOE/2025/001\n\nSubject: Invitation to Annual Conference\n\nDear Sir/Madam,\n\nI write to invite you...\n\nYours faithfully,\nJohn Doe\nDirector of Communications`}
                  rows={14}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none font-mono"
                />
              </div>
            </div>
          )}

          {step === 'preview' && parsed && (
            <div className="space-y-4">
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${detectedCount >= 4 ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'}`}>
                {detectedCount >= 4
                  ? <CheckCircle2 size={16} />
                  : <AlertCircle size={16} />
                }
                <span>
                  {detectedCount >= 4
                    ? `Successfully detected ${detectedCount} fields. Review before importing.`
                    : `Detected ${detectedCount} field(s). Some fields may need manual input after import.`
                  }
                </span>
              </div>

              <div className="space-y-3">
                {(Object.keys(FIELD_LABELS) as Array<keyof ParsedLetter>).map(field => {
                  const val = parsed[field];
                  const hasVal = val && (Array.isArray(val) ? val.length > 0 : val.toString().trim());
                  return (
                    <div key={field} className={`border rounded-lg p-3 ${hasVal ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-gray-50/40 opacity-60'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {hasVal
                          ? <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                          : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        }
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{FIELD_LABELS[field]}</span>
                      </div>
                      {hasVal ? (
                        <p className="text-sm text-gray-800 ml-5 line-clamp-3">
                          {Array.isArray(val) ? val.join(', ') : val as string}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 ml-5 italic">Not detected</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0">
          {step === 'input' ? (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">Cancel</button>
              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow"
              >
                <Wand2 size={15} /> Detect Fields
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep('input')} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition">← Back</button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow"
              >
                <CheckCircle2 size={15} /> Import to Form
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIImportModal;
