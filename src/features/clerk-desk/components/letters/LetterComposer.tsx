// components/letters/LetterComposer.tsx

import React, { useState, useCallback } from 'react';
import { Card, Button, Badge, TextField, SelectField, TextArea } from '../../../../components/M3';
import { useLetterComposer } from '../../hooks/useLetterComposer';
import { useClerkDeskShortcuts } from '../../hooks/useKeyboardShortcuts';
import { AIService } from '../../services/AIService';
import { ExportService } from '../../services/ExportService';
import { useToast } from '../../../../contexts/ToastContext';
import { useConfirmDialog } from '../common/ConfirmDialog';
import { SearchBar } from '../common/SearchBar';
import { EmptyState } from '../common/EmptyState';
import { SCHOOL_TYPES, PRIORITY_OPTIONS } from '../../constants';
import { formatDate, formatStatus, formatPriority } from '../../utils/formatters';
import { validateLetter } from '../../utils/validators';

export const LetterComposer: React.FC = () => {
  const { showToast } = useToast();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();
  
  const {
    formState,
    letters,
    templates,
    officeProfiles,
    schoolRules,
    resolvedValues,
    formattedLetter,
    setField,
    setMultipleFields,
    applyTemplate,
    applyOfficeProfile,
    applySchoolRules,
    loadLetter,
    resetForm,
    saveLetter,
    deleteLetter,
    duplicateLetter,
    saveOfficeProfile,
  } = useLetterComposer();

  // Local state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [letterSearch, setLetterSearch] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [selectedLetters, setSelectedLetters] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check AI status on mount
  React.useEffect(() => {
    AIService.checkHealth().then(setAiStatus);
  }, []);

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

  const handleGenerateAI = useCallback(async () => {
    if (!aiPrompt.trim()) {
      showToast('Please enter a prompt for AI generation', 'error');
      return;
    }

    setAiLoading(true);
    try {
      const request = AIService.buildLetterRequest({
        prompt: aiPrompt,
        recipient: formState.to,
        subject: formState.subject,
        salutation: resolvedValues.salutation,
        senderName: formState.signatureName,
        senderTitle: resolvedValues.signatureTitle,
        fromOffice: resolvedValues.fromOffice,
        letterhead: resolvedValues.letterhead,
        forwardedTo: formState.forwardedTo.split('\n').filter(Boolean),
      });

      const response = await AIService.generateLetter(request);

      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      setField('body', response.text);
      setAiPrompt('');
      showToast('AI draft generated successfully', 'success');
    } catch (error) {
      showToast('Failed to generate AI content', 'error');
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, formState, resolvedValues, setField, showToast]);

  async function handlePrint() {
    if (!formState.subject || !formState.body) {
      showToast('Please complete the letter before printing', 'error');
      return;
    }

    // Build letter object for export
    const letterForExport = {
      ...formState,
      letterheadLines: resolvedValues.letterhead,
      fromOffice: resolvedValues.fromOffice,
      signatureTitle: resolvedValues.signatureTitle,
      salutation: resolvedValues.salutation,
      forwardedTo: formState.forwardedTo.split('\n').filter(Boolean),
      tags: formState.tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    ExportService.printLetter(letterForExport as any);
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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <ConfirmDialogComponent />

      {/* Composer Form */}
      <Card variant="elevated" className="bg-surface xl:col-span-2 space-y-6 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-primary">edit_document</span>
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                {formState.editingId ? 'Edit Letter' : 'Compose Letter'}
              </h2>
              {formState.isDirty && (
                <span className="text-xs text-warning">Unsaved changes</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              label={aiStatus === 'online' ? 'AI Online' : aiStatus === 'checking' ? 'Checking...' : 'AI Offline'}
              color={aiStatus === 'online' ? 'success' : aiStatus === 'checking' ? 'neutral' : 'error'}
            />
            <Button
              variant="text"
              icon="refresh"
              aria-label="Check AI status"
              onClick={() => AIService.checkHealth().then(setAiStatus)}
            />
          </div>
        </div>

        {/* Template & Profile Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Letter Template"
            value={formState.templateId}
            onChange={e => applyTemplate(e.target.value)}
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </SelectField>
          <SelectField
            label="Office Profile"
            value={formState.officeProfileId}
            onChange={e => applyOfficeProfile(e.target.value)}
          >
            <option value="">Select Profile...</option>
            {officeProfiles.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </SelectField>
        </div>

        {/* Save Profile */}
        <div className="flex gap-3 items-center p-4 bg-surface-variant/20 rounded-xl border border-outline/20">
          <TextField
            label="New Profile Name"
            icon="bookmark"
            value={profileName}
            onChange={e => setProfileName(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="tonal"
            label="Save Profile"
            icon="save"
            onClick={() => {
              if (saveOfficeProfile(profileName)) {
                setProfileName('');
                showToast('Profile saved', 'success');
              } else {
                showToast('Profile name required', 'error');
              }
            }}
          />
        </div>

        {/* School Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="School Type"
            value={formState.schoolType}
            onChange={e => setField('schoolType', e.target.value)}
          >
            {SCHOOL_TYPES.map(s => (
              <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
            ))}
          </SelectField>
          <TextField
            label="School Name"
            icon="school"
            value={formState.schoolName}
            onChange={e => setField('schoolName', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Recipient Gender"
            value={formState.recipientGender}
            onChange={e => setField('recipientGender', e.target.value as 'Male' | 'Female')}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </SelectField>
          <TextField
            label="Salutation"
            icon="record_voice_over"
            value={formState.salutation}
            onChange={e => setField('salutation', e.target.value)}
            placeholder={schoolRules.salutation}
          />
        </div>

        <Button
          variant="tonal"
          label="Apply School Rules"
          icon="rule"
          onClick={applySchoolRules}
          className="w-full"
        />

        {/* Letterhead & From */}
        <TextArea
          label="Letterhead Lines"
          icon="apartment"
          value={formState.letterheadLines}
          onChange={e => setField('letterheadLines', e.target.value)}
          placeholder={schoolRules.letterhead}
          rows={3}
        />
        <TextField
          label="From Office"
          icon="business"
          value={formState.fromOffice}
          onChange={e => setField('fromOffice', e.target.value)}
          placeholder={schoolRules.schoolLine}
        />

        {/* Recipient */}
        <TextArea
          label="Recipient (one per line)"
          icon="person"
          value={formState.to}
          onChange={e => setField('to', e.target.value)}
          error={validationErrors.to}
          rows={3}
        />
        <TextField
          label="Recipient Email (optional)"
          icon="mail"
          type="email"
          value={formState.toEmail}
          onChange={e => setField('toEmail', e.target.value)}
          error={validationErrors.toEmail}
        />

        {/* Subject */}
        <TextField
          label="Subject"
          icon="subject"
          value={formState.subject}
          onChange={e => setField('subject', e.target.value)}
          error={validationErrors.subject}
        />

        {/* Reference & Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            label="Reference No"
            icon="bookmark"
            value={formState.reference}
            onChange={e => setField('reference', e.target.value)}
          />
          <TextField
            label="Date"
            type="date"
            icon="event"
            value={formState.letterDate}
            onChange={e => setField('letterDate', e.target.value)}
            error={validationErrors.letterDate}
          />
          <SelectField
            label="Priority"
            value={formState.priority}
            onChange={e => setField('priority', e.target.value as any)}
          >
            {PRIORITY_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </SelectField>
        </div>

        {/* Body */}
        <TextArea
          label="Letter Body"
          icon="notes"
          value={formState.body}
          onChange={e => setField('body', e.target.value)}
          error={validationErrors.body}
          rows={8}
        />

        {/* AI Generation */}
        <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="font-medium">AI Assistant</span>
          </div>
          <TextArea
            label="AI Prompt (describe what you want)"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Enter key points or describe the letter content..."
            rows={3}
          />
          <Button
            variant="filled"
            label={aiLoading ? 'Generating...' : 'Generate with AI'}
            icon="auto_awesome"
            onClick={handleGenerateAI}
            disabled={aiLoading || aiStatus !== 'online'}
            className="w-full"
          />
        </div>

        {/* Tags */}
        <TextField
          label="Tags (comma separated)"
          icon="sell"
          value={formState.tags}
          onChange={e => setField('tags', e.target.value)}
          placeholder="e.g., transfer, urgent, personnel"
        />

        {/* Signature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Signature Name"
            icon="edit"
            value={formState.signatureName}
            onChange={e => setField('signatureName', e.target.value)}
          />
          <TextField
            label="Signature Title"
            icon="badge"
            value={formState.signatureTitle}
            onChange={e => setField('signatureTitle', e.target.value)}
            placeholder={schoolRules.title}
          />
        </div>

        {/* Forwarded To */}
        <TextArea
          label="Copy Forwarded To (one per line)"
          icon="forward_to_inbox"
          value={formState.forwardedTo}
          onChange={e => setField('forwardedTo', e.target.value)}
          rows={3}
        />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-outline/20">
          <Button
            variant="outlined"
            label="Reset"
            icon="refresh"
            onClick={resetForm}
          />
          <Button
            variant="outlined"
            label="Save Draft"
            icon="save"
            onClick={() => handleSave('draft')}
          />
          <Button
            variant="filled"
            label={formState.editingId ? 'Update & Finalize' : 'Finalize'}
            icon="check_circle"
            onClick={() => handleSave('final')}
            className="flex-1"
          />
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-on-surface-variant p-3 bg-surface-variant/10 rounded-lg">
          <strong>Shortcuts:</strong> Ctrl+S (Save Draft) • Ctrl+Shift+S (Finalize) • Ctrl+N (New) • Ctrl+P (Print)
        </div>
      </Card>

      {/* Preview Panel */}
      <div className="space-y-6">
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
              <div className="bg-white rounded-xl p-4 border border-outline/20 max-h-[60vh] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap text-gray-800 leading-relaxed font-mono">
                  {formattedLetter}
                </pre>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outlined"
                  label="Copy"
                  icon="content_copy"
                  onClick={handleCopyPreview}
                />
                <Button
                  variant="outlined"
                  label="Download"
                  icon="download"
                  onClick={handleDownloadPreview}
                />
                <Button
                  variant="outlined"
                  label="Print"
                  icon="print"
                  onClick={handlePrint}
                />
              </div>
            </>
          )}
        </Card>
      </div>

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
// components/letters/LetterComposer.tsx (Continued)

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
  );
};

export default LetterComposer;