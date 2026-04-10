import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, Button, Badge, TextField, SelectField, TextArea, Checkbox } from '../../../../components/M3';
import { useToast } from '../../../../contexts/ToastContext';
import { PrintService } from '../../services/PrintService';
import { ReferenceService } from '../../services/ReferenceService';
import { AIService } from '../../services/AIService';
import { 
  LETTER_CATEGORIES, 
  URGENCY_LEVELS, 
  CONFIDENTIALITY_LEVELS,
  SALUTATIONS,
  CLOSINGS,
  FORWARD_ACTIONS,
  ENHANCED_TEMPLATES,
  DEFAULT_PRINT_SETTINGS,
} from '../../constants/letter-constants';
import { 
  EnhancedLetter, 
  PrintSettings,
  LetterParty,
  Enclosure,
  ForwardEntry,
  LetterCategory,
} from '../../types/letter';

// Rich Text Editor Toolbar Component
const RichTextToolbar: React.FC<{
  onFormat: (command: string, value?: string) => void;
}> = ({ onFormat }) => {
  return (
    <div className="flex flex-wrap gap-1 p-2 bg-surface-variant/20 rounded-t-xl border-b border-outline/20">
      <button
        type="button"
        onClick={() => onFormat('bold')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Bold (Ctrl+B)"
      >
        <span className="material-symbols-outlined text-sm">format_bold</span>
      </button>
      <button
        type="button"
        onClick={() => onFormat('italic')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Italic (Ctrl+I)"
      >
        <span className="material-symbols-outlined text-sm">format_italic</span>
      </button>
      <button
        type="button"
        onClick={() => onFormat('underline')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Underline (Ctrl+U)"
      >
        <span className="material-symbols-outlined text-sm">format_underlined</span>
      </button>
      
      <div className="w-px bg-outline/30 mx-1" />
      
      <button
        type="button"
        onClick={() => onFormat('insertUnorderedList')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Bullet List"
      >
        <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
      </button>
      <button
        type="button"
        onClick={() => onFormat('insertOrderedList')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Numbered List"
      >
        <span className="material-symbols-outlined text-sm">format_list_numbered</span>
      </button>
      
      <div className="w-px bg-outline/30 mx-1" />
      
      <button
        type="button"
        onClick={() => onFormat('justifyLeft')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Align Left"
      >
        <span className="material-symbols-outlined text-sm">format_align_left</span>
      </button>
      <button
        type="button"
        onClick={() => onFormat('justifyCenter')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Align Center"
      >
        <span className="material-symbols-outlined text-sm">format_align_center</span>
      </button>
      <button
        type="button"
        onClick={() => onFormat('justifyRight')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Align Right"
      >
        <span className="material-symbols-outlined text-sm">format_align_right</span>
      </button>
      <button
        type="button"
        onClick={() => onFormat('justifyFull')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Justify"
      >
        <span className="material-symbols-outlined text-sm">format_align_justify</span>
      </button>
      
      <div className="w-px bg-outline/30 mx-1" />
      
      <button
        type="button"
        onClick={() => onFormat('indent')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Increase Indent"
      >
        <span className="material-symbols-outlined text-sm">format_indent_increase</span>
      </button>
      <button
        type="button"
        onClick={() => onFormat('outdent')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Decrease Indent"
      >
        <span className="material-symbols-outlined text-sm">format_indent_decrease</span>
      </button>
      
      <div className="w-px bg-outline/30 mx-1" />
      
      <button
        type="button"
        onClick={() => onFormat('removeFormat')}
        className="p-2 hover:bg-surface-variant rounded"
        title="Clear Formatting"
      >
        <span className="material-symbols-outlined text-sm">format_clear</span>
      </button>
    </div>
  );
};

// Recipient Form Component
const RecipientForm: React.FC<{
  value: LetterParty;
  onChange: (value: LetterParty) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const updateField = (field: keyof LetterParty, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-3 p-4 bg-surface-variant/10 rounded-xl border border-outline/20">
      <div className="text-sm font-medium text-on-surface">{label}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField
          label="Name"
          icon="person"
          value={value.name}
          onChange={e => updateField('name', e.target.value)}
          required
        />
        <TextField
          label="Designation"
          icon="badge"
          value={value.designation || ''}
          onChange={e => updateField('designation', e.target.value)}
        />
        <TextField
          label="Organization"
          icon="apartment"
          value={value.organization}
          onChange={e => updateField('organization', e.target.value)}
          required
        />
        <TextField
          label="Department"
          icon="business"
          value={value.department || ''}
          onChange={e => updateField('department', e.target.value)}
        />
        <TextField
          label="City"
          icon="location_city"
          value={value.city || ''}
          onChange={e => updateField('city', e.target.value)}
        />
        <TextField
          label="District"
          icon="location_on"
          value={value.district || ''}
          onChange={e => updateField('district', e.target.value)}
        />
      </div>
      <TextArea
        label="Full Address"
        icon="home"
        value={value.address || ''}
        onChange={e => updateField('address', e.target.value)}
        rows={2}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField
          label="Email"
          icon="mail"
          type="email"
          value={value.email || ''}
          onChange={e => updateField('email', e.target.value)}
        />
        <TextField
          label="Phone"
          icon="call"
          value={value.phone || ''}
          onChange={e => updateField('phone', e.target.value)}
        />
      </div>
    </div>
  );
};

// Enclosure Manager Component
const EnclosureManager: React.FC<{
  enclosures: Enclosure[];
  onChange: (enclosures: Enclosure[]) => void;
}> = ({ enclosures, onChange }) => {
  const [newEnclosure, setNewEnclosure] = useState({ title: '', pageCount: '', isCopy: false });

  const addEnclosure = () => {
    if (!newEnclosure.title.trim()) return;
    
    onChange([
      ...enclosures,
      {
        id: `enc_${Date.now()}`,
        title: newEnclosure.title.trim(),
        pageCount: newEnclosure.pageCount ? parseInt(newEnclosure.pageCount) : undefined,
        isCopy: newEnclosure.isCopy,
      }
    ]);
    setNewEnclosure({ title: '', pageCount: '', isCopy: false });
  };

  const removeEnclosure = (id: string) => {
    onChange(enclosures.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-3 p-4 bg-surface-variant/10 rounded-xl border border-outline/20">
      <div className="text-sm font-medium text-on-surface">Enclosures</div>
      
      {enclosures.length > 0 && (
        <div className="space-y-2">
          {enclosures.map((enc, index) => (
            <div key={enc.id} className="flex items-center gap-2 p-2 bg-surface rounded-lg">
              <span className="text-sm font-medium w-6">{index + 1}.</span>
              <span className="flex-1 text-sm">{enc.title}</span>
              {enc.pageCount && (
                <Badge label={`${enc.pageCount} pg`} color="neutral" className="text-xs" />
              )}
              {enc.isCopy && (
                <Badge label="Copy" color="info" className="text-xs" />
              )}
              <Button
                variant="text"
                icon="delete"
                onClick={() => removeEnclosure(enc.id)}
              />
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2 items-end">
        <TextField
          label="Enclosure Title"
          value={newEnclosure.title}
          onChange={e => setNewEnclosure({ ...newEnclosure, title: e.target.value })}
          className="flex-1"
        />
        <TextField
          label="Pages"
          type="number"
          value={newEnclosure.pageCount}
          onChange={e => setNewEnclosure({ ...newEnclosure, pageCount: e.target.value })}
          className="w-20"
        />
        <Checkbox
          label="Copy"
          checked={newEnclosure.isCopy}
          onChange={e => setNewEnclosure({ ...newEnclosure, isCopy: e.target.checked })}
        />
        <Button
          variant="tonal"
          icon="add"
          onClick={addEnclosure}
        />
      </div>
    </div>
  );
};

// Forward Manager Component
const ForwardManager: React.FC<{
  entries: ForwardEntry[];
  onChange: (entries: ForwardEntry[]) => void;
}> = ({ entries, onChange }) => {
  const [newEntry, setNewEntry] = useState({ to: '', purpose: '', action: 'necessary_action', deadline: '' });

  const addEntry = () => {
    if (!newEntry.to.trim()) return;
    
    onChange([
      ...entries,
      {
        to: newEntry.to.trim(),
        purpose: newEntry.purpose.trim(),
        action: newEntry.action as any,
        deadline: newEntry.deadline || undefined,
      }
    ]);
    setNewEntry({ to: '', purpose: '', action: 'necessary_action', deadline: '' });
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 p-4 bg-surface-variant/10 rounded-xl border border-outline/20">
      <div className="text-sm font-medium text-on-surface">Copy Forwarded To</div>
      
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div key={index} className="flex items-start gap-2 p-2 bg-surface rounded-lg">
              <span className="text-sm font-medium w-6">{index + 1}.</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{entry.to}</div>
                {entry.purpose && (
                  <div className="text-xs text-on-surface-variant">{entry.purpose}</div>
                )}
              </div>
              {entry.action && (
                <Badge 
                  label={FORWARD_ACTIONS.find(a => a.value === entry.action)?.label || entry.action} 
                  color="primary" 
                  className="text-xs" 
                />
              )}
              <Button
                variant="text"
                icon="delete"
                onClick={() => removeEntry(index)}
              />
            </div>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <TextField
          label="Forward To"
          value={newEntry.to}
          onChange={e => setNewEntry({ ...newEntry, to: e.target.value })}
        />
        <SelectField
          label="Action"
          value={newEntry.action}
          onChange={e => setNewEntry({ ...newEntry, action: e.target.value })}
        >
          {FORWARD_ACTIONS.map(action => (
            <option key={action.value} value={action.value}>{action.label}</option>
          ))}
        </SelectField>
        <TextField
          label="Purpose/Remarks"
          value={newEntry.purpose}
          onChange={e => setNewEntry({ ...newEntry, purpose: e.target.value })}
        />
        <TextField
          label="Deadline"
          type="date"
          value={newEntry.deadline}
          onChange={e => setNewEntry({ ...newEntry, deadline: e.target.value })}
        />
      </div>
      <Button
        variant="tonal"
        icon="add"
        label="Add Forward Entry"
        onClick={addEntry}
        className="w-full"
      />
    </div>
  );
};

// Print Settings Panel
const PrintSettingsPanel: React.FC<{
  settings: PrintSettings;
  onChange: (settings: PrintSettings) => void;
}> = ({ settings, onChange }) => {
  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4 p-4 bg-surface-variant/10 rounded-xl border border-outline/20">
      <div className="text-sm font-medium text-on-surface">Print Settings</div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SelectField
          label="Paper Size"
          value={settings.paperSize}
          onChange={e => updateSetting('paperSize', e.target.value as any)}
        >
          <option value="A4">A4</option>
          <option value="Letter">Letter</option>
          <option value="Legal">Legal</option>
          <option value="A5">A5</option>
        </SelectField>
        
        <SelectField
          label="Orientation"
          value={settings.orientation}
          onChange={e => updateSetting('orientation', e.target.value as any)}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </SelectField>
        
        <SelectField
          label="Quality"
          value={settings.quality}
          onChange={e => updateSetting('quality', e.target.value as any)}
        >
          <option value="draft">Draft</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </SelectField>
        
        <TextField
          label="Copies"
          type="number"
          min={1}
          max={99}
          value={settings.copies}
          onChange={e => updateSetting('copies', parseInt(e.target.value) || 1)}
        />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Checkbox
          label="Include Letterhead"
          checked={settings.includeLetterhead}
          onChange={e => updateSetting('includeLetterhead', e.target.checked)}
        />
        <Checkbox
          label="Include Footer"
          checked={settings.includeFooter}
          onChange={e => updateSetting('includeFooter', e.target.checked)}
        />
        <Checkbox
          label="Page Numbers"
          checked={settings.includePageNumbers}
          onChange={e => updateSetting('includePageNumbers', e.target.checked)}
        />
        <Checkbox
          label="QR Code"
          checked={settings.includeQRCode}
          onChange={e => updateSetting('includeQRCode', e.target.checked)}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Checkbox
          label="Add Watermark"
          checked={settings.includeWatermark}
          onChange={e => updateSetting('includeWatermark', e.target.checked)}
        />
        {settings.includeWatermark && (
          <TextField
            label="Watermark Text"
            value={settings.watermarkText || ''}
            onChange={e => updateSetting('watermarkText', e.target.value)}
            placeholder="DRAFT, COPY, CONFIDENTIAL..."
          />
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <TextField
          label="Top Margin (mm)"
          type="number"
          value={settings.margins.top}
          onChange={e => updateSetting('margins', { ...settings.margins, top: parseInt(e.target.value) || 25 })}
        />
        <TextField
          label="Right (mm)"
          type="number"
          value={settings.margins.right}
          onChange={e => updateSetting('margins', { ...settings.margins, right: parseInt(e.target.value) || 20 })}
        />
        <TextField
          label="Bottom (mm)"
          type="number"
          value={settings.margins.bottom}
          onChange={e => updateSetting('margins', { ...settings.margins, bottom: parseInt(e.target.value) || 25 })}
        />
        <TextField
          label="Left (mm)"
          type="number"
          value={settings.margins.left}
          onChange={e => updateSetting('margins', { ...settings.margins, left: parseInt(e.target.value) || 25 })}
        />
      </div>
    </div>
  );
};

// Main Enhanced Letter Composer Component
export const EnhancedLetterComposer: React.FC = () => {
  const { showToast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  
  // State
  const [activeTab, setActiveTab] = useState<'compose' | 'recipient' | 'enclosures' | 'forward' | 'print'>('compose');
  const [templateId, setTemplateId] = useState(ENHANCED_TEMPLATES[0].id);
  const [category, setCategory] = useState<LetterCategory>('official');
  const [urgency, setUrgency] = useState<string>('routine');
  const [confidentiality, setConfidentiality] = useState<string>('unclassified');
  
  // Letter Content
  const [referenceNumber, setReferenceNumber] = useState('');
  const [referencePrefix, setReferencePrefix] = useState('EDU');
  const [letterDate, setLetterDate] = useState(new Date().toISOString().slice(0, 10));
  const [previousReference, setPreviousReference] = useState('');
  const [subject, setSubject] = useState('');
  const [salutation, setSalutation] = useState('Respected Sir');
  const [body, setBody] = useState('');
  const [closing, setClosing] = useState('Yours faithfully,');
  
  // Recipient
  const [recipient, setRecipient] = useState<LetterParty>({
    name: '',
    designation: '',
    organization: '',
    department: '',
    address: '',
    city: '',
    district: '',
    email: '',
    phone: '',
  });
  
  // CC recipients
  const [ccRecipients, setCcRecipients] = useState<LetterParty[]>([]);
  
  // Through channel
  const [throughChannel, setThroughChannel] = useState<LetterParty[]>([]);
  
  // Enclosures
  const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
  
  // Forward entries
  const [forwardEntries, setForwardEntries] = useState<ForwardEntry[]>([]);
  
  // Signature
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesignation, setSignatoryDesignation] = useState('');
  
  // Print settings
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  
  // AI
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Template placeholders
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  
  // Get current template
  const currentTemplate = useMemo(() => {
    return ENHANCED_TEMPLATES.find(t => t.id === templateId) || ENHANCED_TEMPLATES[0];
  }, [templateId]);

  // Generate reference number
  const handleGenerateReference = useCallback(() => {
    const ref = ReferenceService.generateReference(referencePrefix);
    setReferenceNumber(ref);
    showToast(`Reference generated: ${ref}`, 'success');
  }, [referencePrefix, showToast]);

  // Apply template
  const handleApplyTemplate = useCallback(() => {
    if (!currentTemplate) return;
    
    let processedBody = currentTemplate.body;
    
    // Replace placeholders with values
    Object.entries(placeholderValues).forEach(([key, value]) => {
      processedBody = processedBody.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
    });
    
    setBody(processedBody);
    showToast('Template applied', 'success');
  }, [currentTemplate, placeholderValues, showToast]);

  // Format command for rich text
  const handleFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  // AI Generate
  const handleAIGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) {
      showToast('Please enter a prompt', 'error');
      return;
    }
    
    setAiLoading(true);
    try {
      const response = await AIService.generateLetter({
        recipient: recipient.name || 'Recipient',
        tone: 'formal, professional, government style',
        purpose: subject || 'Official correspondence',
        keyPoints: aiPrompt.split('\n').filter(Boolean),
        length: { maxWords: 400 },
        language: 'English',
        senderName: signatoryName || 'Sender',
        senderTitle: signatoryDesignation || 'Officer',
      });
      
      if (response.error) {
        showToast(response.error, 'error');
        return;
      }
      
      setBody(response.text);
      setAiPrompt('');
      showToast('AI content generated', 'success');
    } catch (error) {
      showToast('AI generation failed', 'error');
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, recipient.name, subject, signatoryName, signatoryDesignation, showToast]);

  // Print preview
  const handlePrintPreview = useCallback(() => {
    // Build letter object
    const letter: Partial<EnhancedLetter> = {
      referenceNumber,
      letterDate,
      previousReference: previousReference || undefined,
      subject,
      salutation,
      body,
      recipient,
      enclosures,
      forwardedTo: forwardEntries,
      signatory: {
        name: signatoryName,
        designation: signatoryDesignation,
      },
      urgency: urgency as any,
      confidentiality: confidentiality as any,
      printSettings,
    };
    
    // For now, create simple preview
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
        <head>
          <title>Letter Preview - ${referenceNumber}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 50px; max-width: 800px; margin: 0 auto; }
            .letterhead { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .reference { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .subject { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin: 20px 0; }
            .body { line-height: 1.8; text-align: justify; }
            .signature { text-align: right; margin-top: 50px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <h2>OFFICE OF THE EDUCATION OFFICER</h2>
            <p>Department of Elementary & Secondary Education</p>
          </div>
          
          <div class="reference">
            <div>No. ${referenceNumber || '____________'}</div>
            <div>Dated: ${letterDate ? new Date(letterDate).toLocaleDateString('en-GB') : '____________'}</div>
          </div>
          
          <div class="recipient">
            <p>To,</p>
            <p style="margin-left: 40px;">
              ${recipient.name || 'Recipient'}${recipient.designation ? `,<br>${recipient.designation}` : ''}
              ${recipient.organization ? `<br>${recipient.organization}` : ''}
              ${recipient.city ? `<br>${recipient.city}` : ''}
            </p>
          </div>
          
          <div class="subject">Subject: ${subject || '____________'}</div>
          
          <p>${salutation},</p>
          
          <div class="body">
            ${body.split('\n').map(p => `<p style="text-indent: 40px; margin-bottom: 10px;">${p}</p>`).join('')}
          </div>
          
          ${enclosures.length > 0 ? `
            <div style="margin-top: 30px;">
              <p><strong>Enclosure(s):</strong></p>
              <ol>
                ${enclosures.map(e => `<li>${e.title}${e.pageCount ? ` (${e.pageCount} pages)` : ''}</li>`).join('')}
              </ol>
            </div>
          ` : ''}
          
          <div class="signature">
            <p>${closing}</p>
            <br><br><br>
            <p><strong>${signatoryName || '____________'}</strong></p>
            <p>${signatoryDesignation || '____________'}</p>
          </div>
          
          ${forwardEntries.length > 0 ? `
            <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px;">
              <p><strong>Copy forwarded to:</strong></p>
              <ol>
                ${forwardEntries.map(f => `<li>${f.to}${f.purpose ? ` - ${f.purpose}` : ''}</li>`).join('')}
              </ol>
            </div>
          ` : ''}
          
          <script>
            // Auto print option
            // window.print();
          </script>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }, [referenceNumber, letterDate, previousReference, subject, salutation, body, recipient, enclosures, forwardEntries, signatoryName, signatoryDesignation, closing, urgency, confidentiality, printSettings]);

  // Print directly
  const handlePrint = useCallback(() => {
    handlePrintPreview();
  }, [handlePrintPreview]);

  // Tab buttons
  const tabs = [
    { id: 'compose', label: 'Compose', icon: 'edit' },
    { id: 'recipient', label: 'Recipient', icon: 'person' },
    { id: 'enclosures', label: 'Enclosures', icon: 'attach_file' },
    { id: 'forward', label: 'Forward', icon: 'forward_to_inbox' },
    { id: 'print', label: 'Print Settings', icon: 'print' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Enhanced Letter Composer</h2>
          <p className="text-sm text-on-surface-variant">Professional government letter writing system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            icon="preview"
            label="Preview"
            onClick={handlePrintPreview}
          />
          <Button
            variant="filled"
            icon="print"
            label="Print"
            onClick={handlePrint}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all
              ${activeTab === tab.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface text-on-surface border border-outline/20 hover:bg-surface-variant'
              }
            `}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Form */}
        <Card variant="elevated" className="bg-surface xl:col-span-2 p-6 shadow-lg space-y-6">
          
          {activeTab === 'compose' && (
            <>
              {/* Template & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField
                  label="Template"
                  value={templateId}
                  onChange={e => setTemplateId(e.target.value)}
                >
                  {ENHANCED_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </SelectField>
                
                <SelectField
                  label="Category"
                  value={category}
                  onChange={e => setCategory(e.target.value as LetterCategory)}
                >
                  {LETTER_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </SelectField>
                
                <div className="grid grid-cols-2 gap-2">
                  <SelectField
                    label="Urgency"
                    value={urgency}
                    onChange={e => setUrgency(e.target.value)}
                  >
                    {URGENCY_LEVELS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </SelectField>
                  
                  <SelectField
                    label="Confidentiality"
                    value={confidentiality}
                    onChange={e => setConfidentiality(e.target.value)}
                  >
                    {CONFIDENTIALITY_LEVELS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </SelectField>
                </div>
              </div>

              {/* Template Placeholders */}
              {currentTemplate.placeholders.length > 0 && (
                <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">Template Placeholders</span>
                    <Button
                      variant="tonal"
                      icon="check"
                      label="Apply Template"
                      onClick={handleApplyTemplate}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentTemplate.placeholders.map(ph => (
                      <div key={ph.key}>
                        {ph.type === 'textarea' ? (
                          <TextArea
                            label={`${ph.label}${ph.required ? ' *' : ''}`}
                            value={placeholderValues[ph.key] || ''}
                            onChange={e => setPlaceholderValues({ ...placeholderValues, [ph.key]: e.target.value })}
                            rows={2}
                          />
                        ) : ph.type === 'select' ? (
                          <SelectField
                            label={`${ph.label}${ph.required ? ' *' : ''}`}
                            value={placeholderValues[ph.key] || ''}
                            onChange={e => setPlaceholderValues({ ...placeholderValues, [ph.key]: e.target.value })}
                          >
                            <option value="">Select...</option>
                            {ph.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </SelectField>
                        ) : ph.type === 'date' ? (
                          <TextField
                            label={`${ph.label}${ph.required ? ' *' : ''}`}
                            type="date"
                            value={placeholderValues[ph.key] || ''}
                            onChange={e => setPlaceholderValues({ ...placeholderValues, [ph.key]: e.target.value })}
                          />
                        ) : (
                          <TextField
                            label={`${ph.label}${ph.required ? ' *' : ''}`}
                            value={placeholderValues[ph.key] || ''}
                            onChange={e => setPlaceholderValues({ ...placeholderValues, [ph.key]: e.target.value })}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reference & Date */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex gap-2">
                  <TextField
                    label="Prefix"
                    value={referencePrefix}
                    onChange={e => setReferencePrefix(e.target.value)}
                    className="w-24"
                  />
                  <TextField
                    label="Reference Number"
                    value={referenceNumber}
                    onChange={e => setReferenceNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="tonal"
                    icon="autorenew"
                    onClick={handleGenerateReference}
                    className="mt-6"
                  />
                </div>
                
                <TextField
                  label="Letter Date"
                  type="date"
                  value={letterDate}
                  onChange={e => setLetterDate(e.target.value)}
                />
                
                <TextField
                  label="Previous Reference"
                  value={previousReference}
                  onChange={e => setPreviousReference(e.target.value)}
                  placeholder="In reply to..."
                />
                
                <SelectField
                  label="Salutation"
                  value={salutation}
                  onChange={e => setSalutation(e.target.value)}
                >
                  {[...SALUTATIONS.formal.male, ...SALUTATIONS.formal.female, ...SALUTATIONS.formal.neutral].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </SelectField>
              </div>

              {/* Subject */}
              <TextField
                label="Subject"
                icon="subject"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />

              {/* Rich Text Editor */}
              <div>
                <label className="text-sm font-medium text-on-surface mb-2 block">Letter Body</label>
                <RichTextToolbar onFormat={handleFormat} />
                <div
                  ref={editorRef}
                  contentEditable
                  className="min-h-[300px] p-4 border border-outline/20 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  onInput={e => setBody(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: body }}
                />
              </div>

              {/* AI Assistant */}
              <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="font-medium">AI Writing Assistant</span>
                </div>
                <TextArea
                  label="Describe what you want to write"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="E.g., Write a transfer order for a teacher being transferred from GPS ABC to GPS XYZ..."
                  rows={3}
                />
                <Button
                  variant="filled"
                  icon="auto_awesome"
                  label={aiLoading ? 'Generating...' : 'Generate with AI'}
                  onClick={handleAIGenerate}
                  disabled={aiLoading}
                  className="w-full"
                />
              </div>

              {/* Closing & Signature */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField
                  label="Closing"
                  value={closing}
                  onChange={e => setClosing(e.target.value)}
                >
                  {CLOSINGS.formal.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </SelectField>
                
                <TextField
                  label="Signatory Name"
                  icon="person"
                  value={signatoryName}
                  onChange={e => setSignatoryName(e.target.value)}
                />
                
                <TextField
                  label="Signatory Designation"
                  icon="badge"
                  value={signatoryDesignation}
                  onChange={e => setSignatoryDesignation(e.target.value)}
                />
              </div>
            </>
          )}

          {activeTab === 'recipient' && (
            <div className="space-y-6">
              <RecipientForm
                value={recipient}
                onChange={setRecipient}
                label="Primary Recipient"
              />
              
              {/* Through Channel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">Through Channel</span>
                  <Button
                    variant="text"
                    icon="add"
                    label="Add"
                    onClick={() => setThroughChannel([...throughChannel, { name: '', organization: '' }])}
                  />
                </div>
                {throughChannel.map((tc, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <RecipientForm
                        value={tc}
                        onChange={(v) => {
                          const updated = [...throughChannel];
                          updated[index] = v;
                          setThroughChannel(updated);
                        }}
                        label={`Through ${index + 1}`}
                      />
                    </div>
                    <Button
                      variant="text"
                      icon="delete"
                      onClick={() => setThroughChannel(throughChannel.filter((_, i) => i !== index))}
                      className="mt-6"
                    />
                  </div>
                ))}
              </div>
              
              {/* CC Recipients */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">CC Recipients</span>
                  <Button
                    variant="text"
                    icon="add"
                    label="Add CC"
                    onClick={() => setCcRecipients([...ccRecipients, { name: '', organization: '' }])}
                  />
                </div>
                {ccRecipients.map((cc, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <RecipientForm
                        value={cc}
                        onChange={(v) => {
                          const updated = [...ccRecipients];
                          updated[index] = v;
                          setCcRecipients(updated);
                        }}
                        label={`CC ${index + 1}`}
                      />
                    </div>
                    <Button
                      variant="text"
                      icon="delete"
                      onClick={() => setCcRecipients(ccRecipients.filter((_, i) => i !== index))}
                      className="mt-6"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'enclosures' && (
            <EnclosureManager
              enclosures={enclosures}
              onChange={setEnclosures}
            />
          )}

          {activeTab === 'forward' && (
            <ForwardManager
              entries={forwardEntries}
              onChange={setForwardEntries}
            />
          )}

          {activeTab === 'print' && (
            <PrintSettingsPanel
              settings={printSettings}
              onChange={setPrintSettings}
            />
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-outline/20">
            <Button variant="outlined" icon="save" label="Save Draft" />
            <Button variant="outlined" icon="preview" label="Preview" onClick={handlePrintPreview} />
            <Button variant="filled" icon="print" label="Print" onClick={handlePrint} className="flex-1" />
          </div>
        </Card>

        {/* Right Panel - Quick Preview */}
        <Card variant="elevated" className="bg-surface p-6 shadow-lg h-fit sticky top-6">
          <h3 className="text-lg font-bold text-on-surface mb-4">Quick Preview</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-on-surface-variant">Reference:</span>
              <span className="ml-2 font-mono">{referenceNumber || '---'}</span>
            </div>
            
            <div>
              <span className="text-on-surface-variant">Date:</span>
              <span className="ml-2">{letterDate ? new Date(letterDate).toLocaleDateString('en-GB') : '---'}</span>
            </div>
            
            <div>
              <span className="text-on-surface-variant">To:</span>
              <span className="ml-2">{recipient.name || '---'}</span>
            </div>
            
            <div>
              <span className="text-on-surface-variant">Subject:</span>
              <div className="mt-1 font-medium uppercase text-xs">{subject || '---'}</div>
            </div>
            
            <div>
              <span className="text-on-surface-variant">Category:</span>
              <Badge label={LETTER_CATEGORIES.find(c => c.value === category)?.label || category} color="primary" className="ml-2 text-xs" />
            </div>
            
            {urgency !== 'routine' && (
              <div>
                <Badge label={URGENCY_LEVELS.find(u => u.value === urgency)?.label || urgency} color="warning" />
              </div>
            )}
            
            {confidentiality !== 'unclassified' && (
              <div>
                <Badge label={CONFIDENTIALITY_LEVELS.find(c => c.value === confidentiality)?.label || confidentiality} color="error" />
              </div>
            )}
            
            <div>
              <span className="text-on-surface-variant">Enclosures:</span>
              <span className="ml-2">{enclosures.length}</span>
            </div>
            
            <div>
              <span className="text-on-surface-variant">Forward To:</span>
              <span className="ml-2">{forwardEntries.length}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-outline/20">
            <div className="text-xs text-on-surface-variant mb-2">Print Settings</div>
            <div className="flex flex-wrap gap-2">
              <Badge label={printSettings.paperSize} color="neutral" className="text-xs" />
              <Badge label={printSettings.orientation} color="neutral" className="text-xs" />
              <Badge label={`${printSettings.copies} copies`} color="neutral" className="text-xs" />
              {printSettings.includeWatermark && (
                <Badge label={`WM: ${printSettings.watermarkText || 'DRAFT'}`} color="info" className="text-xs" />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};