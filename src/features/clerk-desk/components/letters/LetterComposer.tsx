// components/letters/LetterComposer.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, Button, Badge, TextField, SelectField, TextArea } from '../../../../components/M3';
import { RichTextEditor } from '../../../../components/RichTextEditor';
import { OfficialLogo } from '../../../../components/OfficialLogo';
import { QRCode } from '../../../../components/QRCode';
import { useLetterComposer } from '../../hooks/useLetterComposer';
import { useClerkDeskShortcuts } from '../../hooks/useKeyboardShortcuts';
import { AIService } from '../../services/AIService';
import { ExportService } from '../../services/ExportService';
import { useToast } from '../../../../contexts/ToastContext';
import { useConfirmDialog } from '../common/ConfirmDialog';
import { SearchBar } from '../common/SearchBar';
import { EmptyState } from '../common/EmptyState';
import { PRIORITY_OPTIONS } from '../../constants';
import { formatDate, formatStatus, formatPriority } from '../../utils/formatters';
import { validateLetter } from '../../utils/validators';
import { getDepartmentLogoPath } from '../../../../utils';
import { parseOfficialLetter, ParsedLetter } from '../../utils/smartLetterParser';
import { APP_NAME, APP_AUTHOR, DEVELOPER } from '../../../../config/branding';
import type { OfficeProfile } from '../../../../types';

export const LetterComposer: React.FC = () => {
  const { showToast } = useToast();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();
  
  const {
    formState,
    letters,
    templates,
    officeProfiles,
    departmentRules,
    resolvedValues,
    formattedLetter,
    setField,
    setMultipleFields,
    applyTemplate,
    applyOfficeProfile,
    applyDepartmentRules,
    loadLetter,
    resetForm,
    saveLetter,
    deleteLetter,
    duplicateLetter,
    saveOfficeProfile,
    getDepartmentInfo,
    setViewMode,
  } = useLetterComposer();

  const { viewMode } = formState;

  // Local state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRefining, setAiRefining] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [letterSearch, setLetterSearch] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load office profile from localStorage (same source as Letterhead.tsx)
  const [officeProfile, setOfficeProfile] = useState<Partial<OfficeProfile>>({
    office_title: 'OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER (M) ALLAI',
    district_line: 'Department of Elementary & Secondary Education, Battagram',
    govt_line: 'Govt. of Khyber Pakhtunkhwa.',
    tel: '0343-2900419',
  });

  // Determine if this is a higher office for official opening statements
  const isHigherOffice = useMemo(() => {
    const info = getDepartmentInfo(formState.institutionName || 'Office');
    const org = info.organizationType;
    return org === 'directorate' || org === 'education_office' || org === 'police_office' || org === 'finance_office';
  }, [formState.institutionName]);

  const openingStatement = useMemo(() => {
    if (isHigherOffice) {
      return "I am directed to refer to the subject noted above and to state that";
    } else {
      return "I have the honor to refer to the subject cited above and to state that";
    }
  }, [isHigherOffice]);

  useEffect(() => {
    const saved = localStorage.getItem('clerk_pro_clerk_office_profiles');
    if (saved) {
      try { 
        const profiles = JSON.parse(saved);
        if (Array.isArray(profiles) && profiles.length > 0) {
          setOfficeProfile(profiles[0]);
        }
      } catch {}
    }
  }, []);

  // Check AI status on mount
  React.useEffect(() => {
    AIService.checkHealth().then(setAiStatus);
  }, []);

  // Smart paste detection state
  const [smartPasteDetected, setSmartPasteDetected] = useState(false);
  const [smartPasteData, setSmartPasteData] = useState<any>(null);

  // Parse a pasted full letter and extract fields
  const parsePastedLetter = useCallback((text: string) => {
    // 1. Quick regex check for immediate feedback
    const parsed = parseOfficialLetter(text);
    
    let fieldCount = 0;
    if (parsed.institutionName) fieldCount++;
    if (parsed.to) fieldCount++;
    if (parsed.subject) fieldCount++;
    if (parsed.reference) fieldCount++;

    if (fieldCount >= 2) {
      setSmartPasteData(parsed);
      setSmartPasteDetected(true);
      return true;
    }

    // 2. If it's long text but regex failed, suggest AI Extract
    if (text.length > 200 && aiStatus === 'online') {
      showToast('Long text detected. You can use "AI Extract" for better results.', 'info');
    }
    
    return false;
  }, [aiStatus, showToast]);

  // Apply smart paste extracted data
  const applySmartPaste = useCallback(() => {
    if (!smartPasteData) return;
    
    const updates: any = {};
    if (smartPasteData.institutionName) updates.institutionName = smartPasteData.institutionName;
    if (smartPasteData.to) updates.to = smartPasteData.to;
    if (smartPasteData.subject) updates.subject = smartPasteData.subject;
    if (smartPasteData.reference) updates.reference = smartPasteData.reference;
    if (smartPasteData.letterDate) updates.letterDate = smartPasteData.letterDate;
    if (smartPasteData.forwardedTo) {
      updates.forwardedTo = Array.isArray(smartPasteData.forwardedTo) 
        ? smartPasteData.forwardedTo.join('\n') 
        : smartPasteData.forwardedTo;
    }
    if (smartPasteData.enclosures) {
      updates.enclosures = Array.isArray(smartPasteData.enclosures) 
        ? smartPasteData.enclosures.join('\n') 
        : smartPasteData.enclosures;
    }
    if (smartPasteData.signatureName) updates.signatureName = smartPasteData.signatureName;
    if (smartPasteData.signatureTitle) updates.signatureTitle = smartPasteData.signatureTitle;
    
    // Convert body to HTML paragraphs, preserving internal line breaks as <br/>
    const bodyText = smartPasteData.body || '';
    const bodyHtml = bodyText
      .split('\n\n') // Split by double newlines for paragraphs
      .map((p: string) => p.trim())
      .filter(Boolean)
      .map((p: string) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    
    updates.body = bodyHtml;

    setMultipleFields(updates);
    setSmartPasteDetected(false);
    setSmartPasteData(null);
    showToast('Letter fields extracted successfully', 'success');
  }, [smartPasteData, setMultipleFields, showToast]);

  const handleAIExtract = useCallback(async () => {
    // 1. Get raw text from the current body
    const tmp = document.createElement('div');
    tmp.innerHTML = formState.body;
    const text = tmp.innerText || tmp.textContent || '';
    
    if (text.length < 30) {
      showToast('Please paste or type the full letter content into the editor first.', 'error');
      return;
    }

    setAiExtracting(true);
    try {
      const parsed = await AIService.extractLetterData(text);
      if (parsed.error) {
        showToast(parsed.error, 'error');
        return;
      }

      setSmartPasteData(parsed);
      setSmartPasteDetected(true);
      showToast('AI analysis complete. Click "Fill Now" to update fields.', 'success');
    } catch (error) {
      showToast('AI extraction failed', 'error');
    } finally {
      setAiExtracting(false);
    }
  }, [formState.body, showToast]);

  // Keyboard shortcuts
  useClerkDeskShortcuts({
    onSaveDraft: () => handleSave('draft'),
    onFinalize: () => handleSave('final'),
    onNewLetter: resetForm,
    onPrint: handlePrint,
  });

  // Handlers
  const handleSave = useCallback(async (status: 'draft' | 'final') => {
    const validation = validateLetter({
      to: formState.to,
      subject: formState.subject,
      body: formState.body,
      letterDate: formState.letterDate,
      toEmail: formState.toEmail,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showToast('Please fix the validation errors', 'error');
      return;
    }

    setValidationErrors({});
    const saved = saveLetter(status);
    
    if (saved) {
      showToast(
        status === 'draft' ? 'Draft saved successfully' : 'Letter finalized',
        'success'
      );
    } else {
      showToast('Failed to save letter', 'error');
    }
  }, [formState, saveLetter, showToast]);

  const handleDelete = useCallback(async (letterId: string) => {
    const confirmed = await confirm({
      title: 'Delete Letter',
      message: 'Are you sure you want to delete this letter? This action cannot be undone.',
      variant: 'danger',
    });

    if (confirmed) {
      deleteLetter(letterId);
      showToast('Letter deleted', 'success');
    }
  }, [confirm, deleteLetter, showToast]);

  const handleDuplicate = useCallback((letterId: string) => {
    const duplicate = duplicateLetter(letterId);
    if (duplicate) {
      showToast('Letter duplicated', 'success');
    }
  }, [duplicateLetter, showToast]);

  const handleAISmartAction = useCallback(async () => {
    const isRefining = formState.body.trim().length > 10;
    const isDrafting = !isRefining && formState.subject.trim().length > 3;

    if (!isRefining && !isDrafting) {
      showToast('Please enter a subject or type some notes in the body first', 'error');
      return;
    }

    if (isRefining) setAiRefining(true); else setAiLoading(true);

    try {
      const request = AIService.buildLetterRequest({
        prompt: isRefining 
          ? "Refine this content into 100% official language" 
          : `Draft a full letter about: ${formState.subject}`,
        recipient: formState.to,
        subject: formState.subject,
        salutation: resolvedValues.salutation,
        senderName: formState.signatureName,
        senderTitle: resolvedValues.signatureTitle,
        fromOffice: resolvedValues.lhLine1 || resolvedValues.fromOffice,
        letterhead: [resolvedValues.lhLine1, resolvedValues.lhLine2, resolvedValues.lhLine3].filter(Boolean).join(', '),
        forwardedTo: formState.forwardedTo.split('\n').filter(Boolean),
        tone: `100% formal Pakistani government office language. Office: ${resolvedValues.lhLine1 || formState.institutionName}. Writing to: ${formState.to}.`,
      });

      const response = isRefining 
        ? await AIService.refineLetter(request, formState.body)
        : await AIService.generateLetter(request);

      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      // Format response as paragraphs if not already
      let result = response.text;
      if (!result.includes('<p>')) {
        result = result
          .split(/\n{1,}/)
          .map((p: string) => p.trim())
          .filter(Boolean)
          .map((p: string) => `<p>${p}</p>`)
          .join('');
      }

      setField('body', result);
      showToast(isRefining ? 'Letter refined with official tone' : 'Official draft generated', 'success');
    } catch (error) {
      showToast('AI smart action failed', 'error');
    } finally {
      setAiRefining(false);
      setAiLoading(false);
    }
  }, [formState, resolvedValues, setField, showToast]);

  async function handlePrint() {
    if (!formState.subject || !formState.body) {
      showToast('Please complete the letter before printing', 'error');
      return;
    }
    
    // Save as draft first to ensure the printed version has latest changes.
    // We pass false to shouldReset so the form data stays visible.
    const saved = saveLetter('draft', false);
    if (!saved || !saved.id) {
      showToast('Could not save letter for printing', 'error');
      return;
    }

    // FORCE SAVE: Physically write to localStorage immediately before opening print window
    // This bypasses the asynchronous React state update to avoid "Letter not found"
    try {
      const currentLettersStr = localStorage.getItem('clerk_pro_clerk_letters') || '[]';
      const currentLetters = JSON.parse(currentLettersStr);
      const exists = currentLetters.findIndex((l: any) => l.id === saved.id);
      if (exists !== -1) {
        currentLetters[exists] = saved;
      } else {
        currentLetters.unshift(saved);
      }
      localStorage.setItem('clerk_pro_clerk_letters', JSON.stringify(currentLetters));
    } catch (e) {
      console.error("Force save failed", e);
    }

    // Use standard project print route which uses PrintLayout
    window.open(`#/print/letter/${saved.id}`, '_blank');
  }

  const handleCopyPreview = async () => {
    const success = await ExportService.copyToClipboard(formattedLetter);
    showToast(
      success ? 'Letter copied to clipboard' : 'Failed to copy',
      success ? 'success' : 'error'
    );
  };

  const handleDownloadPreview = () => {
    const blob = new Blob([formattedLetter], { type: 'text/plain' });
    ExportService.downloadBlob(
      blob,
      `${formState.subject.replace(/[^a-z0-9]/gi, '_') || 'letter'}.txt`
    );
  };

  const handleBatchDelete = async () => {
    if (selectedLetters.size === 0) return;

    const confirmed = await confirm({
      title: 'Delete Selected Letters',
      message: `Are you sure you want to delete ${selectedLetters.size} letter(s)?`,
      variant: 'danger',
    });

    if (confirmed) {
      selectedLetters.forEach(id => deleteLetter(id));
      setSelectedLetters(new Set());
      showToast(`${selectedLetters.size} letters deleted`, 'success');
    }
  };

  // Filter letters
  const filteredLetters = letters.filter(letter => {
    if (!letterSearch) return true;
    const searchLower = letterSearch.toLowerCase();
    return (
      letter.subject.toLowerCase().includes(searchLower) ||
      letter.to.toLowerCase().includes(searchLower) ||
      letter.reference.toLowerCase().includes(searchLower) ||
      letter.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <ConfirmDialogComponent />

      {/* ── View Controls ── */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-surface-container-low p-2 rounded-2xl border border-outline/10 shadow-sm">
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'form' ? 'filled' : 'text'}
            size="sm"
            icon="edit_note"
            label="Editor Only"
            onClick={() => setViewMode('form')}
            className={viewMode === 'form' ? 'shadow-md' : ''}
          />
          <Button
            variant={viewMode === 'split' ? 'filled' : 'text'}
            size="sm"
            icon="vertical_split"
            label="Split View"
            onClick={() => setViewMode('split')}
            className={viewMode === 'split' ? 'shadow-md' : ''}
          />
          <Button
            variant={viewMode === 'preview' ? 'filled' : 'text'}
            size="sm"
            icon="visibility"
            label="Preview Only"
            onClick={() => setViewMode('preview')}
            className={viewMode === 'preview' ? 'shadow-md' : ''}
          />
        </div>

        <div className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Live Sync Active</span>
          </div>
          <div className="h-4 w-px bg-outline/20"></div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            A4 Portrait Standard
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1'}`}>

        {/* ── Composer Form ── */}
        {(viewMode === 'form' || viewMode === 'split') && (
          <Card variant="elevated" className={`bg-surface ${viewMode === 'split' ? 'xl:col-span-2' : ''} p-0 shadow-xl overflow-hidden flex flex-col border-none ring-1 ring-outline/5`}>
        
        {/* Pro Header — Inspired by Word Pro 2.zip */}
        <div className="bg-[#2b579a] text-white p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-inner">
              <span className="material-symbols-outlined text-2xl">edit_document</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight leading-tight uppercase">
                {formState.editingId ? 'Edit Official Letter' : 'Official Letter Pro'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {formState.isDirty ? (
                  <span className="text-[10px] font-bold text-orange-300 flex items-center gap-1 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-pulse"></span>
                    Unsaved Changes
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-blue-100/70 flex items-center gap-1 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[12px]">cloud_done</span>
                    Auto-saved {formState.lastSaved ? new Date(formState.lastSaved).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'just now'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border transition-all ${
              aiStatus === 'online' 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' 
                : 'bg-red-500/20 text-red-300 border-red-500/40'
            }`}>
              {aiStatus === 'online' ? 'AI Intelligence Online' : 'AI Offline'}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* ── Block 1: Origin & Metadata ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary/70 text-[18px]">domain</span>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Origin & Metadata</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <TextField
                label="Institution / Office Name"
                value={formState.institutionName}
                onChange={e => setField('institutionName', e.target.value)}
                placeholder="e.g. SDEO (F) Allai, GGHS Allai, DEO Battagram..."
              />
            </div>
            <TextField
              label="Reference No"
              value={formState.reference}
              onChange={e => setField('reference', e.target.value)}
              placeholder="e.g. AB1425"
            />
            <TextField
              label="Date"
              type="date"
              value={formState.letterDate}
              onChange={e => setField('letterDate', e.target.value)}
              error={validationErrors.letterDate}
            />
          </div>
        </div>

        {/* ── Block 2: Addressing ── */}
        <div className="space-y-4 pt-2 border-t border-outline/10">
          <div className="flex items-center gap-2 mb-2 mt-2">
            <span className="material-symbols-outlined text-primary/70 text-[18px]">contact_mail</span>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Addressing</span>
          </div>
          
          <TextArea
            label="To (Recipient — one per line)"
            value={formState.to}
            onChange={e => setField('to', e.target.value)}
            error={validationErrors.to}
            rows={2}
            placeholder={"District Education Officer\nBattagram"}
          />
          <TextField
            label="Subject"
            value={formState.subject}
            onChange={e => setField('subject', e.target.value)}
            error={validationErrors.subject}
            placeholder="e.g. Sanction of GPF Case"
          />
        </div>

        {/* ── Block 3: Content ── */}
        <div className="space-y-2 pt-2 border-t border-outline/10 mt-2">
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-primary/70 text-[18px]">article</span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Letter Content</span>
            </div>
            
            {/* AI Actions Bar */}
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="tonal"
                size="sm"
                icon={aiExtracting ? undefined : "content_paste_search"}
                label={aiExtracting ? "Analyzing..." : "AI Extract"}
                onClick={handleAIExtract}
                disabled={aiExtracting || aiLoading || aiRefining}
                className="h-8 px-4 text-[11px] font-bold rounded-full border-primary/20 hover:bg-primary/5 transition-all"
                title="AI Extract: Automatically detect Sender, Recipient, Subject, Ref, and Date from your text"
              >
                {aiExtracting && <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-1" />}
              </Button>
              
              {aiStatus === 'online' && (
                <Button
                  variant="filled"
                  size="sm"
                  icon={aiLoading || aiRefining ? undefined : (formState.body.trim().length > 10 ? "auto_fix_high" : "auto_awesome")}
                  label={aiLoading || aiRefining ? "Working..." : (formState.body.trim().length > 10 ? "Refine Official Tone" : "Draft from Subject")}
                  onClick={handleAISmartAction}
                  disabled={aiLoading || aiRefining || aiExtracting}
                  className="h-8 px-5 text-[11px] font-bold rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  {(aiLoading || aiRefining) && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                </Button>
              )}
            </div>
          </div>

          <div className="relative group">
            {smartPasteDetected && (
              <div className="absolute top-0 left-0 right-0 z-30 m-3 p-4 bg-primary text-on-primary rounded-2xl flex items-center justify-between shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined animate-pulse">auto_awesome</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold">AI Data Extraction Ready</div>
                    <div className="text-[11px] opacity-90">I've detected sender, recipient, and subject details.</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="text" size="sm" label="Dismiss" onClick={() => setSmartPasteDetected(false)} className="text-on-primary hover:bg-white/10" />
                  <Button variant="tonal" size="sm" label="Fill All Fields" onClick={applySmartPaste} className="bg-white text-primary hover:bg-white/90 shadow-lg px-6" />
                </div>
              </div>
            )}
            
            <div className="rounded-2xl border border-outline/20 overflow-hidden bg-surface-container-lowest transition-all focus-within:border-primary/40 focus-within:shadow-md">
              <RichTextEditor
                value={formState.body}
                onChange={html => setField('body', html)}
                onPaste={text => parsePastedLetter(text)}
                error={validationErrors.body}
                minHeight="320px"
              />
            </div>
          </div>
        </div>

        {/* ── Block 4: Sign-off & Annexures ── */}
        <div className="space-y-4 pt-2 border-t border-outline/10">
          <div className="flex items-center gap-2 mb-2 mt-2">
            <span className="material-symbols-outlined text-primary/70 text-[18px]">history_edu</span>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sign-off & Annexures</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Signature Name (optional)"
              value={formState.signatureName}
              onChange={e => setField('signatureName', e.target.value)}
              placeholder="e.g. Fazal Ali"
            />
            <TextField
              label="Signature Title Override"
              value={formState.signatureTitle || ''}
              onChange={e => setField('signatureTitle', e.target.value)}
              placeholder={`Auto: ${resolvedValues.signatureTitle}`}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextArea
              label="Copy Forwarded To (one per line)"
              value={formState.forwardedTo}
              onChange={e => setField('forwardedTo', e.target.value)}
              rows={3}
              placeholder="e.g. Director E&SE KP Peshawar."
            />
            <TextArea
              label="Enclosures / Annexures"
              value={formState.enclosures || ''}
              onChange={e => setField('enclosures', e.target.value)}
              rows={3}
              placeholder="e.g. 1. Service Book\n2. Pay Slip"
            />
          </div>
        </div>

        </div>

        {/* ⑦ Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-outline/15">
          <Button variant="outlined" label="New Blank" icon="add" onClick={resetForm} />
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="tonal" label="Save Draft" icon="save" onClick={() => handleSave('draft')} className="flex-1 sm:flex-none" />
            <Button
              variant="filled"
              label={formState.editingId ? 'Update' : 'Finalize'}
              icon="check_circle"
              onClick={() => handleSave('final')}
              className="flex-1 sm:flex-none"
            />
            <Button
              variant="filled"
              icon="print"
              label="Print / Export"
              onClick={handlePrint}
              className="bg-secondary text-on-secondary shadow-md hover:shadow-lg"
              title="Print / Export PDF"
            />
          </div>
        </div>
      </Card>
    )}


        {/* Preview Panel — Formatted Letter */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`space-y-6 ${viewMode === 'preview' ? 'xl:col-span-3' : ''}`}>
            <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg sticky top-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">preview</span>
              <span className="text-lg font-bold text-on-surface">Live Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge label="Real-time" color="primary" />
              <Button
                variant="text"
                icon={showPreview ? 'visibility_off' : 'visibility'}
                aria-label="Toggle preview"
                onClick={() => setShowPreview(!showPreview)}
              />
            </div>
          </div>

           {showPreview && (
            <>
              {/* A4 paper simulation — Premium Official Look */}
              <div
                className="bg-white rounded-xl border border-outline/20 max-h-[70vh] overflow-y-auto shadow-inner official-preview"
                style={{ padding: '35px 45px', fontFamily: "'Times New Roman', serif", color: '#000', fontSize: '11pt', lineHeight: 1.6 }}
              >
                {/* Letterhead */}
                {(() => {
                  const isOfficeOrder = (formState.subject || '').toUpperCase().includes('OFFICE ORDER');
                  
                  let line1 = resolvedValues.lhLine1;
                  let line2 = resolvedValues.lhLine2 || officeProfile.district_line || '';

                  return (
                    <>
                      <div className="flex justify-between items-start mb-2 w-full text-black">
                        {/* Logo */}
                        <div className="w-[70px] flex-shrink-0 pt-1 flex justify-start">
                          <OfficialLogo className="w-[60px] h-[60px]" departmentType={(resolvedValues as any).departmentType} />
                        </div>

                        {/* Centre title block */}
                        <div className="flex-grow text-center px-4 pt-1">
                          <h1 className="text-[14pt] font-black uppercase leading-tight tracking-tight whitespace-pre-line">
                            {line1}
                          </h1>
                          {line2 && (
                            <h2 className="text-[9.5pt] font-bold mt-1 leading-tight">
                              {line2}
                            </h2>
                          )}
                          <h3 className="text-[9pt] font-semibold mt-0.5">
                            Govt. of Khyber Pakhtunkhwa.
                          </h3>
                        </div>

                        {/* Right contact + QR */}
                        <div className="text-[8.5pt] w-[100px] pt-2 font-serif leading-snug text-right">
                          {officeProfile.tel && <p><strong>Tel:</strong> {officeProfile.tel}</p>}
                          <div className="flex justify-end mt-2">
                            <QRCode value={formState.reference || 'draft'} size={45} />
                          </div>
                        </div>
                      </div>
                      <div style={{ borderTop: '4px double #000', margin: '8px 0 20px 0' }} />

                      {/* Ref / Date */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '11pt', marginBottom: 20 }}>
                        <div>No. <span style={{ borderBottom: '1px solid #000', minWidth: 80, display: 'inline-block', textAlign: 'center', padding: '0 8px' }}>{formState.reference || ''}</span> /</div>
                        <div>Dated: {(() => {
                          const d = formState.letterDate ? new Date(formState.letterDate) : null;
                          if (d && !isNaN(d.getTime())) {
                            return `${d.getDate().toString().padStart(2, '0')} / ${(d.getMonth() + 1).toString().padStart(2, '0')} / ${d.getFullYear()}`;
                          }
                          return `___ / ___ / ${new Date().getFullYear()}`;
                        })()}</div>
                      </div>

                      {/* Recipient - Hidden for Office Orders */}
                      {!isOfficeOrder && (
                        <div style={{ marginBottom: 20, fontSize: '11pt', display: 'flex' }}>
                          <div style={{ fontWeight: 700, width: '45px' }}>To</div>
                          <div style={{ fontWeight: 700, lineHeight: 1.6, flex: 1 }}>
                            {(formState.to || 'Recipient').split('\n').filter(Boolean).map((l, i) => (
                              <div key={i}>{l.trim()}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Subject */}
                      <div style={{ display: 'flex', justifyContent: isOfficeOrder ? 'center' : 'flex-start', marginBottom: 20, fontSize: '11pt', textAlign: 'justify' }}>
                        {!isOfficeOrder && <span style={{ fontWeight: 700, marginRight: 10, flexShrink: 0 }}>Subject:</span>}
                        <span style={{ 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          textDecoration: 'underline', 
                          textUnderlineOffset: '4px', 
                          lineHeight: 1.45, 
                          textAlign: isOfficeOrder ? 'center' : 'left',
                          fontSize: isOfficeOrder ? '13pt' : '11pt'
                        }}>
                          {formState.subject || 'Subject'}
                        </span>
                      </div>

                      {/* Salutation - Hidden for Office Orders */}
                      {!isOfficeOrder && (
                        <div style={{ fontWeight: 700, fontSize: '11pt', marginBottom: 12 }}>
                          Respected {resolvedValues.salutation || 'Sir'},
                        </div>
                      )}

                      {/* Body */}
                      <div className="official-body text-black text-justify" style={{ fontSize: '11pt' }}>
                        {(() => {
                          const html = formState.body || '';
                          const hasTable = html.includes('<table') || html.includes('</table>') || html.includes('| --- |') || html.includes('---');
                          
                          if (hasTable) {
                             return <div className="space-y-4" dangerouslySetInnerHTML={{ __html: html.replace(/<p>/i, `<p style="text-indent: 4em;">${openingStatement} `) }} />;
                          }

                          // Split by paragraph and break tags
                          const rawParagraphs = html
                            .split(/<\/p>|<br\s*\/?>/i)
                            .map(p => {
                              const tmp = document.createElement('div');
                              tmp.innerHTML = p;
                              return tmp.textContent?.trim() || '';
                            })
                            .filter(p => p.length > 1);
                          
                          if (rawParagraphs.length === 0) return <div style={{ textIndent: '4em' }}>{openingStatement} ...</div>;

                          return (
                            <div className="space-y-5">
                              <div style={{ textIndent: '4em', lineHeight: 1.6 }}>
                                {rawParagraphs[0].toLowerCase().includes(openingStatement.toLowerCase().substring(0, 30)) ? '' : openingStatement + ' '}
                                {rawParagraphs[0]}
                              </div>
                              {rawParagraphs.slice(1).map((text, i) => {
                                const displayIndex = i + 2;
                                const startsWithAnyNumber = /^\d+[\.\)]/.test(text);
                                return (
                                  <div key={i} className="flex gap-4" style={{ lineHeight: 1.6 }}>
                                    <span style={{ width: '1.5em', flexShrink: 0, fontWeight: 700 }}>
                                      {startsWithAnyNumber ? '' : `${displayIndex}.`}
                                    </span>
                                    <div className="flex-1 text-justify">
                                      {text}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  );
                })()}

                {/* Enclosures & Signature */}
                <div className="flex justify-between items-end pt-10" style={{ pageBreakInside: 'avoid' }}>
                  <div className="flex-1 pr-4">
                    {(() => {
                      const encItems = (formState.enclosures || '').split('\n').map(l => l.trim()).filter(Boolean);
                      if (encItems.length === 0) return null;
                      return (
                        <div className="text-[10.5pt]">
                          <div className="font-bold underline mb-1">Enclosures:</div>
                          {encItems.map((item, i) => (
                            <div key={i} className="font-semibold">{item}</div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ width: 240, textAlign: 'center', fontSize: '10.5pt', flexShrink: 0 }}>
                    <div style={{ height: 60 }} />
                    <div style={{ borderTop: '1px solid #000', width: 200, margin: '0 auto 6px' }} />
                    <div style={{ fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {formState.signatureName ? formState.signatureName + '\n' : ''}
                      {resolvedValues.signatureTitle}
                    </div>
                  </div>
                </div>


                {/* Forwarded */}
                {formState.forwardedTo.split('\n').filter(Boolean).length > 0 && (
                  <div style={{ marginTop: 30, paddingTop: 15, borderTop: '1px solid #eee', fontSize: '10pt' }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Copy Forwarded To:</div>
                    {formState.forwardedTo.split('\n').filter(Boolean).map((f, i) => (
                      <div key={i} style={{ marginLeft: 20, marginBottom: 4 }}>{i + 1}. {f.trim()}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outlined" label="Copy" icon="content_copy" onClick={handleCopyPreview} />
                <Button variant="outlined" label="Download" icon="download" onClick={handleDownloadPreview} />
                <Button variant="filled" label="Print" icon="print" onClick={handlePrint} className="flex-1" />
              </div>
            </>
          )}
        </Card>
      </div>
      )}

      {/* Letter History */}
      <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg xl:col-span-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            <span className="text-lg font-bold text-on-surface">Letter History</span>
            <Badge label={`${letters.length} total`} color="primary" />
          </div>
          
          <div className="flex items-center gap-3">
            <SearchBar
              value={letterSearch}
              onChange={setLetterSearch}
              placeholder="Search letters..."
              className="min-w-[300px]"
            />
            
            {selectedLetters.size > 0 && (
              <Button
                variant="outlined"
                label={`Delete (${selectedLetters.size})`}
                icon="delete"
                onClick={handleBatchDelete}
              />
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filteredLetters.length === 0 ? (
            <EmptyState
              icon="mail_outline"
              title="No letters found"
              description={letterSearch ? 'Try a different search term' : 'Start by composing your first letter above'}
            />
          ) : (
            filteredLetters.map(letter => {
              const status = formatStatus(letter.status);
              const priority = formatPriority(letter.priority);
              const isSelected = selectedLetters.has(letter.id);
              
              return (
                <div
                  key={letter.id}
                  className={`
                    p-4 rounded-xl border transition-all duration-200 cursor-pointer
                    ${isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-outline/20 hover:border-outline/40 hover:bg-surface-variant/10'
                    }
                  `}
                  onClick={() => loadLetter(letter.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSelected = new Set(selectedLetters);
                          if (isSelected) {
                            newSelected.delete(letter.id);
                          } else {
                            newSelected.add(letter.id);
                          }
                          setSelectedLetters(newSelected);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-on-surface">{letter.subject}</span>

                          {letter.priority !== 'normal' && (
                            <span className={`material-symbols-outlined text-sm text-${priority.color}`}>
                              {priority.icon}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-on-surface-variant mb-1">
                          <span className="font-medium">To:</span> {letter.to.split('\n')[0]}
                          {letter.to.split('\n').length > 1 && (
                            <span className="text-xs ml-1">+{letter.to.split('\n').length - 1} more</span>
                          )}
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-xs text-on-surface-variant">
                          <Badge label={status.label} color={status.color as any} className="text-xs" />
                          <span>{formatDate(letter.updatedAt, 'relative')}</span>
                          {letter.reference && (
                            <span className="text-on-surface-variant/70">Ref: {letter.reference}</span>
                          )}
                          {letter.tags.length > 0 && (
                            <div className="flex gap-1">
                              {letter.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} label={tag} color="neutral" className="text-xs" />
                              ))}
                              {letter.tags.length > 3 && (
                                <Badge label={`+${letter.tags.length - 3}`} color="neutral" className="text-xs" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="text"
                        icon="content_copy"
                        aria-label="Duplicate letter"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicate(letter.id);
                        }}
                      />
                      <Button
                        variant="text"
                        icon="edit"
                        aria-label="Edit letter"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadLetter(letter.id);
                        }}
                      />
                      <Button
                        variant="text"
                        icon="delete"
                        aria-label="Delete letter"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(letter.id);
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  </div>
);
};

export default LetterComposer;