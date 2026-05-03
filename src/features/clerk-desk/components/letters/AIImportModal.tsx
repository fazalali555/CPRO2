import React, { useState } from 'react';
import { Card, Button, Badge, TextArea } from '../../../../components/M3';
import { AppIcon } from '../../../../components/AppIcon';
import { parseOfficialLetter, ParsedLetter } from '../../utils/smartLetterParser';

interface AIImportModalProps {
  onClose: () => void;
  onImport: (data: Partial<ParsedLetter>) => void;
}

const FIELD_LABELS: Record<string, string> = {
  institutionName: 'Institution / Office',
  reference: 'Reference No.',
  letterDate: 'Date',
  to: 'Receiver / To',
  subject: 'Subject',
  body: 'Letter Body',
  signatureName: 'Signatory Name',
  signatureTitle: 'Signature Title',
  forwardedTo: 'Forwardings',
};

export const AIImportModal: React.FC<AIImportModalProps> = ({ onClose, onImport }) => {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedLetter | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const handleParse = () => {
    if (!rawText.trim()) return;
    const result = parseOfficialLetter(rawText);
    setParsed(result);
    setStep('preview');
  };

  const handleConfirm = () => {
    if (!parsed) return;
    
    let bodyHtml = parsed.body;
    
    // 1. Detect and Convert Markdown Tables
    const tableRegex = /^\|(.+)\|$\n^\|([-:| ]+)\|$\n((?:^\|(.+)\|$\n?)+)/gm;
    bodyHtml = bodyHtml.replace(tableRegex, (match, header, divider, rows) => {
      const headerCols = header.split('|').map((c: string) => c.trim()).filter(Boolean);
      const rowLines = rows.trim().split('\n');
      
      let html = '<table style="border-collapse: collapse; width: 100%; border: 1px solid #d1d5db; margin: 16px 0;">';
      html += '<thead><tr style="background: #f9fafb;">';
      headerCols.forEach((c: string) => html += `<th style="border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; font-weight: bold;">${c}</th>`);
      html += '</tr></thead><tbody>';
      
      rowLines.forEach((line: string) => {
        const cols = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cols.length === 0) return;
        html += '<tr>';
        cols.forEach(c => html += `<td style="border: 1px solid #d1d5db; padding: 8px 12px;">${c}</td>`);
        html += '</tr>';
      });
      
      html += '</tbody></table>';
      return html;
    });

    // 2. Detect Pseudo-tables (Tab-separated or multi-space)
    // Common in AI rosters: "1.   Name    Duty    Date"
    const pseudoTableRegex = /^([^\n|]+(?:\t|\s{3,})[^\n|]+(?:\t|\s{3,})[^\n|]+)$/gm;
    bodyHtml = bodyHtml.replace(pseudoTableRegex, (match) => {
      const cols = match.split(/\t|\s{3,}/).map(c => c.trim()).filter(Boolean);
      if (cols.length < 2) return match;
      
      let html = '<table style="border-collapse: collapse; width: 100%; border: 1px solid #d1d5db; margin: 8px 0;"><tr>';
      cols.forEach(c => html += `<td style="border: 1px solid #d1d5db; padding: 6px 10px;">${c}</td>`);
      html += '</tr></table>';
      return html;
    });

    // 3. Standard Markdown Conversion
    bodyHtml = bodyHtml
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/^# (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^## (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^[*-] (.*?)$/gm, '<li>$1</li>');

    // 4. Wrap in paragraphs and group lists
    if (!bodyHtml.includes('<p>') && !bodyHtml.includes('<table')) {
      bodyHtml = bodyHtml
        .split(/\n\n+/)
        .map(p => {
          const trimmed = p.trim();
          if (!trimmed) return '';
          if (trimmed.includes('<li>')) return `<ul>${trimmed}</ul>`;
          return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
        })
        .filter(Boolean)
        .join('');
    }

    // 5. Cleanup
    bodyHtml = bodyHtml.replace(/^[#*-\s]+$/gm, '');

    onImport({
      ...parsed,
      body: bodyHtml,
    });
    onClose();
  };

  const detectedFields = parsed ? Object.entries(parsed).filter(([key, val]) => {
    if (key === 'confidence' || key === 'warnings' || key === 'body') return false;
    return val && val.toString().trim().length > 0;
  }) : [];

  const detectedCount = detectedFields.length + (parsed?.body ? 1 : 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <Card variant="elevated" className="bg-surface p-0 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-elevation-5 overflow-hidden border border-outline/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 flex-shrink-0 bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <AppIcon name="auto_awesome" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Smart Letter Import</h2>
              <p className="text-xs text-on-surface-variant">Paste text to auto-detect official fields</p>
            </div>
          </div>
          <Button variant="text" icon="close" onClick={onClose} className="w-10 h-10 min-w-0 p-0 rounded-full" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 'input' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3">
                <AppIcon name="info" className="text-primary shrink-0" size={20} />
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <strong>How it works:</strong> Paste any letter text below. Our parser will identify the office name, reference number, date, recipient, subject, and signature automatically.
                </p>
              </div>
              
              <TextArea
                label="Paste Letter Text"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={"Paste your letter here...\n\nExample:\nOFFICE OF THE SDEO ALLAI\nNo. 1234/A  Dated: 20/04/2026\n\nTo:\nThe District Education Officer...\n\nSubject: APPLICATION FOR LEAVE...\n\nDear Sir,\nI have the honor to state...\n\nYours faithfully,\nJohn Doe\nPrincipal"}
                className="font-serif"
                rows={12}
                autoFocus
              />
            </div>
          )}

          {step === 'preview' && parsed && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                detectedCount >= 4 ? 'bg-success/5 border-success/20 text-success' : 'bg-warning/5 border-warning/20 text-warning'
              }`}>
                <AppIcon name={detectedCount >= 4 ? 'check_circle' : 'info'} size={24} />
                <div className="flex-1">
                  <div className="text-sm font-bold">
                    {detectedCount >= 4 ? 'Great! Letter structure detected.' : 'Partial structure detected.'}
                  </div>
                  <div className="text-xs opacity-90">
                    Found {detectedCount} fields. Review the mapping below.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(FIELD_LABELS).map(field => {
                  const val = (parsed as any)[field];
                  const hasVal = val && val.toString().trim().length > 0;
                  
                  return (
                    <div 
                      key={field} 
                      className={`p-3 rounded-xl border transition-all ${
                        hasVal ? 'bg-surface-container-high border-primary/20 shadow-sm' : 'bg-surface-container-lowest border-outline/10 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-on-surface-variant/70">
                          {FIELD_LABELS[field]}
                        </span>
                        {hasVal && <AppIcon name="check" size={12} className="text-primary" />}
                      </div>
                      <div className="text-sm font-medium text-on-surface line-clamp-2 min-h-[1.25rem]">
                        {hasVal ? val : <span className="text-xs italic text-on-surface-variant/40">Not detected</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {parsed.warnings.length > 0 && (
                <div className="mt-4 p-3 bg-error/5 border border-error/10 rounded-xl space-y-1">
                  {parsed.warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] text-error font-medium">
                      <AppIcon name="warning" size={12} /> {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/30 bg-surface-container-low flex-shrink-0">
          {step === 'input' ? (
            <>
              <Button variant="text" label="Cancel" onClick={onClose} />
              <Button
                variant="filled"
                label="Detect Fields"
                icon="auto_awesome"
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="shadow-elevation-2"
              />
            </>
          ) : (
            <>
              <Button variant="text" label="Go Back" icon="arrow_back" onClick={() => setStep('input')} />
              <div className="flex gap-2">
                <Button variant="outlined" label="Cancel" onClick={onClose} />
                <Button
                  variant="filled"
                  label="Import to Form"
                  icon="check_circle"
                  onClick={handleConfirm}
                  className="shadow-elevation-2 bg-success text-on-success"
                />
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
