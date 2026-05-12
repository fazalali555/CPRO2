// hooks/useLetterComposer.ts - Letter Composition Hook

import { useReducer, useCallback, useMemo, useEffect } from 'react';
import { Letter, LetterTemplate, OfficeProfile, LetterVersion } from '../types';
import { useLocalStorageCollection } from './useLocalStorage';
import { STORAGE_KEYS, DEFAULT_TEMPLATES, DEFAULT_OFFICE_PROFILES, SCHOOL_TYPES } from '../constants';
import { formatLetterToText } from '../utils/formatters';
import { securityService, auditService } from '../../../services/SecurityService';
import { getDepartmentInfo } from '../../../utils/departmentDetector';

// State shape
interface LetterFormState {
  templateId: string;
  officeProfileId: string;
  institutionName: string;
  recipientGender: 'Male' | 'Female';
  salutation: string;
  letterheadLines: string;
  fromOffice: string;
  to: string;
  toEmail: string;
  toLabel: string;
  subject: string;
  subjectLabel: string;
  reference: string;
  letterDate: string;
  body: string;
  tags: string;
  signatureName: string;
  signatureTitle: string;
  salutationLabel: string;
  forwardedTo: string;
  enclosures: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  // UI state
  viewMode: 'form' | 'split' | 'preview';
  editingId: string | null;
  isDirty: boolean;
  lastSaved: string | null;
}

// Actions
type LetterFormAction =
  | { type: 'SET_FIELD'; field: keyof LetterFormState; value: any }
  | { type: 'SET_VIEW_MODE'; mode: 'form' | 'split' | 'preview' }
  | { type: 'SET_MULTIPLE'; fields: Partial<LetterFormState> }
  | { type: 'LOAD_LETTER'; letter: Letter }
  | { type: 'APPLY_TEMPLATE'; template: LetterTemplate }
  | { type: 'APPLY_PROFILE'; profile: OfficeProfile }
  | { type: 'APPLY_DEPT_RULES'; rules: DepartmentRules }
  | { type: 'RESET' }
  | { type: 'MARK_SAVED' }
  | { type: 'MARK_DIRTY' };

interface DepartmentRules {
  gender: 'Male' | 'Female';
  salutation: string;
  title: string;
  fromLine: string;
  letterhead: string;
  lhLine1: string;
  lhLine2: string;
  lhLine3: string;
}

const initialFormState: LetterFormState = {
  templateId: DEFAULT_TEMPLATES[0]?.id || '',
  officeProfileId: '',
  institutionName: '',
  recipientGender: 'Male',
  salutation: 'Sir',
  letterheadLines: '',
  fromOffice: '',
  to: '',
  toEmail: '',
  toLabel: 'To',
  subject: '',
  subjectLabel: 'Subject',
  reference: '',
  letterDate: new Date().toISOString().slice(0, 10),
  body: '',
  tags: '',
  signatureName: '',
  signatureTitle: '',
  salutationLabel: 'Respected',
  forwardedTo: '',
  enclosures: '',
  priority: 'normal',
  viewMode: 'split',
  editingId: null,
  isDirty: false,
  lastSaved: null,
};

function letterFormReducer(state: LetterFormState, action: LetterFormAction): LetterFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { 
        ...state, 
        [action.field]: action.value, 
        isDirty: true 
      };
    
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.mode
      };
    
    case 'SET_MULTIPLE':
      return { 
        ...state, 
        ...action.fields, 
        isDirty: true 
      };
    
    case 'LOAD_LETTER':
      return {
        ...state,
        templateId: action.letter.templateId,
        officeProfileId: action.letter.officeProfileId || '',
        institutionName: action.letter.institutionName || action.letter.schoolName || '',
        recipientGender: action.letter.recipientGender,
        salutation: action.letter.salutation,
        letterheadLines: action.letter.letterheadLines,
        fromOffice: action.letter.fromOffice,
        to: action.letter.to,
        toEmail: action.letter.toEmail || '',
        toLabel: (action.letter as any).toLabel || 'To',
        subject: action.letter.subject,
        subjectLabel: (action.letter as any).subjectLabel || 'Subject',
        reference: action.letter.reference,
        letterDate: action.letter.letterDate,
        body: action.letter.body,
        tags: action.letter.tags.join(', '),
        signatureName: action.letter.signatureName,
        signatureTitle: action.letter.signatureTitle,
        salutationLabel: (action.letter as any).salutationLabel || 'Respected',
        forwardedTo: action.letter.forwardedTo.join('\n'),
        enclosures: action.letter.enclosures || '',
        priority: action.letter.priority,
        editingId: action.letter.id,
        isDirty: false,
        lastSaved: action.letter.updatedAt,
      };
    
    case 'APPLY_TEMPLATE':
      return {
        ...state,
        templateId: action.template.id,
        isDirty: true,
      };
    
    case 'APPLY_PROFILE':
      return {
        ...state,
        officeProfileId: action.profile.id,
        letterheadLines: action.profile.letterheadLines,
        fromOffice: action.profile.fromOffice,
        signatureTitle: action.profile.signatureTitle,
        isDirty: true,
      };
    
    case 'APPLY_DEPT_RULES':
      return {
        ...state,
        recipientGender: action.rules.gender,
        salutation: action.rules.salutation,
        letterheadLines: action.rules.letterhead,
        fromOffice: action.rules.fromLine,
        signatureTitle: action.rules.title,
        isDirty: true,
      };
    
    case 'RESET':
      return { ...initialFormState };
    
    case 'MARK_SAVED':
      return {
        ...state,
        isDirty: false,
        lastSaved: new Date().toISOString(),
      };
    
    case 'MARK_DIRTY':
      return { ...state, isDirty: true };
    
    default:
      return state;
  }
}

export function useLetterComposer() {
  const [formState, dispatch] = useReducer(letterFormReducer, initialFormState);
  
  // Collections — Use debounceMs: 0 for letters to ensure instant save for printing
  const lettersCollection = useLocalStorageCollection<Letter>(STORAGE_KEYS.LETTERS, { debounceMs: 0 });
  const templatesCollection = useLocalStorageCollection<LetterTemplate>(STORAGE_KEYS.TEMPLATES);
  const profilesCollection = useLocalStorageCollection<OfficeProfile>(STORAGE_KEYS.OFFICE_PROFILES);

  // Initialize templates and profiles if empty
  useEffect(() => {
    if (templatesCollection.items.length === 0) {
      DEFAULT_TEMPLATES.forEach(t => templatesCollection.addItem(t));
    }
    if (profilesCollection.items.length === 0) {
      DEFAULT_OFFICE_PROFILES.forEach(p => profilesCollection.addItem(p));
    }
  }, []);

  // Computed department rules — reactive to institutionName
  const departmentRules = useMemo((): DepartmentRules => {
    const name = formState.institutionName || 'Office';
    const info = getDepartmentInfo(name);
    return {
      gender: info.gender,
      salutation: info.salutation,
      title: info.signatureTitle,
      fromLine: info.letterhead.line2,
      letterhead: info.letterhead.line1,
      lhLine1: info.letterhead.line1,
      lhLine2: info.letterhead.line2,
      lhLine3: info.letterhead.line3,
    };
  }, [formState.institutionName]);

  // Sync department rules to form state when institutionName changes
  // but only if not explicitly loading a letter
  useEffect(() => {
    if (formState.institutionName && !formState.editingId) {
      dispatch({ 
        type: 'SET_MULTIPLE', 
        fields: {
          letterheadLines: '', // Clear overrides so resolvedValues uses departmentRules
          fromOffice: '',
          signatureTitle: ''
        } 
      });
    }
  }, [formState.institutionName]);

  // Resolved values — prefer formState if user has edited or loaded a profile
  const resolvedValues = useMemo(() => {
    const info = getDepartmentInfo(formState.institutionName || 'Office');
    
    // Logic: If user has explicitly typed in the letterhead/signature fields, 
    // we keep their text. If they are empty, we use the auto-detected rules.
    return {
      departmentType: info.departmentType,
      lhLine1: formState.letterheadLines?.trim() ? formState.letterheadLines : departmentRules.lhLine1,
      lhLine2: formState.fromOffice?.trim() ? formState.fromOffice : departmentRules.lhLine2,
      lhLine3: departmentRules.lhLine3,
      // Legacy compat
      letterhead: formState.letterheadLines?.trim() ? formState.letterheadLines : departmentRules.lhLine1,
      fromOffice: formState.fromOffice?.trim() ? formState.fromOffice : departmentRules.lhLine2,
      // Signature: user override takes priority, else always use auto-detected
      signatureTitle: formState.signatureTitle?.trim() ? formState.signatureTitle : departmentRules.title,
      recipientGender: departmentRules.gender,
      // Salutation: detect (F) in recipient as Madam, otherwise default to Sir
      salutation: (() => {
        const toUpper = (formState.to || '').toUpperCase();
        if (/\(F\)|\(FEMALE\)|\(GIRLS\)/.test(toUpper)) return 'Madam';
        
        // If the user has manually entered something that isn't the standard Sir/Madam, keep it
        if (formState.salutation && formState.salutation !== 'Sir' && formState.salutation !== 'Madam') {
          return formState.salutation;
        }
        
        return 'Sir';
      })(),
    };
  }, [formState.institutionName, formState.letterheadLines, formState.fromOffice, formState.signatureTitle, formState.to, formState.salutation, departmentRules]);

  // Format letter preview
  const formattedLetter = useMemo(() => {
    const template = templatesCollection.items.find(t => t.id === formState.templateId) 
      || templatesCollection.items[0];
    
    const salutationLine = `Respected ${resolvedValues.salutation},`;
    const subjectUpper = (formState.subject || 'Subject').toUpperCase();
    const subjectLine = `Subject: ${subjectUpper}`;
    const subjectUnderline = ''.padEnd(subjectLine.length, '_');
    
    const recipientLines = (formState.to || 'Recipient')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    const recipientBlock = recipientLines.map(l => `              ${l}`).join('\n');
    
    const noLine = formState.reference?.trim() || '____________';
    const parsedDate = formState.letterDate ? new Date(formState.letterDate) : null;
    const dateLine = parsedDate && !isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleDateString('en-GB')
      : '____/____/______';
    
    const signatureLines = [
      formState.signatureName || 'Clerk',
      resolvedValues.signatureTitle
    ].filter(Boolean);
    const signatureBox = signatureLines.map(l => l.padStart(70)).join('\n');
    
    const forwardedItems = formState.forwardedTo
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    const forwardedList = forwardedItems.length
      ? forwardedItems.map((l, i) => `  ${i + 1}. ${l}`).join('\n')
      : '';
    
    const headerBlock = [
      resolvedValues.lhLine1,
      resolvedValues.lhLine2,
      resolvedValues.lhLine3
    ].map(x => x?.trim()).filter(Boolean).join('\n');
    
    // Process template body - STRIP HTML for text version
    const stripHtml = (html: string) => {
      if (typeof document === 'undefined') return html; // SSR safety
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    let bodyContent = template?.body || '{{body}}';
    bodyContent = bodyContent
      .replace(/\{\{body\}\}/g, stripHtml(formState.body) || '________________')
      .trim()
      .replace(/\n{3,}/g, '\n\n');
    
    const parts = [
      headerBlock,
      '',
      `No. ${noLine}                         Dated: ${dateLine}`,
      '',
      'To,',
      recipientBlock,
      '',
      subjectLine,
      subjectUnderline,
      '',
      salutationLine,
      '',
      bodyContent,
      '',
      'Yours faithfully,',
      '',
      signatureBox,
    ];
    
    if (forwardedList) {
      parts.push('', 'Copy Forwarded To:', forwardedList);
    }
    
    return parts.filter(Boolean).join('\n');
  }, [formState, templatesCollection.items, resolvedValues]);

  // Actions
  const setField = useCallback(<K extends keyof LetterFormState>(
    field: K,
    value: LetterFormState[K]
  ) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const setMultipleFields = useCallback((fields: Partial<LetterFormState>) => {
    dispatch({ type: 'SET_MULTIPLE', fields });
  }, []);

  const setViewMode = useCallback((mode: 'form' | 'split' | 'preview') => {
    dispatch({ type: 'SET_VIEW_MODE', mode });
  }, []);

  const applyTemplate = useCallback((templateId: string) => {
    const template = templatesCollection.items.find(t => t.id === templateId);
    if (template) {
      dispatch({ type: 'APPLY_TEMPLATE', template });
    }
  }, [templatesCollection.items]);

  const applyOfficeProfile = useCallback((profileId: string) => {
    const profile = profilesCollection.items.find(p => p.id === profileId);
    if (profile) {
      dispatch({ type: 'APPLY_PROFILE', profile });
    }
  }, [profilesCollection.items]);

  const applyDepartmentRules = useCallback(() => {
    dispatch({ type: 'APPLY_DEPT_RULES', rules: departmentRules });
  }, [departmentRules]);

  const loadLetter = useCallback((letterId: string) => {
    const letter = lettersCollection.getItem(letterId);
    if (letter) {
      dispatch({ type: 'LOAD_LETTER', letter });
    }
  }, [lettersCollection]);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const saveLetter = useCallback((status: 'draft' | 'final', shouldReset: boolean = true): Letter | null => {
    // Validation
    if (!formState.to.trim() || !formState.subject.trim() || !formState.body.trim()) {
      return null;
    }

    const now = new Date().toISOString();
    const tags = formState.tags.split(',').map(t => t.trim()).filter(Boolean);
    const forwardedTo = formState.forwardedTo.split('\n').map(l => l.trim()).filter(Boolean);

    const letterData: Omit<Letter, 'id' | 'createdAt' | 'updatedAt'> = {
      templateId: formState.templateId,
      officeProfileId: formState.officeProfileId || undefined,
      institutionName: formState.institutionName.trim(),
      recipientGender: resolvedValues.recipientGender as 'Male' | 'Female',
      salutation: resolvedValues.salutation,
      letterheadLines: resolvedValues.lhLine1,
      fromOffice: resolvedValues.lhLine2,
      to: formState.to.trim(),
      toEmail: formState.toEmail.trim() || undefined,
      subject: formState.subject.trim(),
      reference: formState.reference.trim(),
      letterDate: formState.letterDate,
      body: formState.body.trim(),
      tags,
      signatureName: formState.signatureName.trim(),
      signatureTitle: resolvedValues.signatureTitle,
      forwardedTo,
      enclosures: formState.enclosures,
      status,
      priority: formState.priority,
      versions: [],
      attachments: [],
    };

    let currentEditingId = formState.editingId;

    // PROFESSIONAL DEDUPLICATION:
    // If not currently editing a specific letter, check if an identical one already exists 
    if (!currentEditingId) {
      const existingMatch = lettersCollection.items.find(l => 
        l.subject.trim().toLowerCase() === letterData.subject.trim().toLowerCase() &&
        l.to.trim().toLowerCase() === letterData.to.trim().toLowerCase() &&
        l.body.trim() === letterData.body.trim()
      );
      
      if (existingMatch) {
        currentEditingId = existingMatch.id;
      }
    }

    let savedLetter: Letter;

    if (currentEditingId) {
      // Update existing
      const existing = lettersCollection.getItem(currentEditingId);
      if (existing) {
        // Create version history
        const newVersion: LetterVersion = {
          id: `v_${Date.now()}`,
          version: (existing.versions?.length || 0) + 1,
          content: {
            body: existing.body,
            subject: existing.subject,
            to: existing.to,
          },
          createdAt: now,
          createdBy: securityService.getCurrentUser()?.name || 'Unknown',
          changeNote: 'Auto-saved version',
        };

        const updatedVersions = [...(existing.versions || []), newVersion].slice(-10); // Keep last 10

        lettersCollection.updateItem(currentEditingId, {
          ...letterData,
          versions: updatedVersions,
        });

        savedLetter = { ...existing, ...letterData, id: existing.id, versions: updatedVersions, updatedAt: now };
        auditService.log('LETTER_UPDATED', `Updated letter: ${letterData.subject}`, currentEditingId);
      } else {
        return null;
      }
    } else {
      // Create new
      savedLetter = lettersCollection.addItem(letterData);
      auditService.log(
        status === 'draft' ? 'LETTER_DRAFT' : 'LETTER_FINAL',
        `Created letter: ${letterData.subject}`,
        savedLetter.id
      );
    }

    dispatch({ type: 'MARK_SAVED' });
    if (shouldReset) {
      dispatch({ type: 'RESET' });
    } else {
      // If not resetting, update the editing ID via dispatch
      dispatch({ type: 'LOAD_LETTER', letter: savedLetter });
    }

    return savedLetter;
  }, [formState, resolvedValues, lettersCollection]);

  const deleteLetter = useCallback((letterId: string) => {
    const letter = lettersCollection.getItem(letterId);
    lettersCollection.removeItem(letterId);
    auditService.log('LETTER_DELETED', `Deleted letter: ${letter?.subject || letterId}`, letterId);
  }, [lettersCollection]);

  const duplicateLetter = useCallback((letterId: string) => {
    const letter = lettersCollection.getItem(letterId);
    if (letter) {
      const duplicate = lettersCollection.addItem({
        ...letter,
        subject: `Copy of ${letter.subject}`,
        status: 'draft',
        reference: '',
        versions: [],
      });
      auditService.log('LETTER_DUPLICATED', `Duplicated letter: ${letter.subject}`, duplicate.id);
      return duplicate;
    }
    return null;
  }, [lettersCollection]);

  // Save office profile
  const saveOfficeProfile = useCallback((name: string) => {
    if (!name.trim()) return null;

    const profile = profilesCollection.addItem({
      name: name.trim(),
      letterheadLines: formState.letterheadLines.trim(),
      fromOffice: formState.fromOffice.trim(),
      signatureTitle: formState.signatureTitle.trim(),
    });

    return profile;
  }, [formState, profilesCollection]);

  return {
    // State
    formState,
    letters: lettersCollection.items,
    templates: templatesCollection.items,
    officeProfiles: profilesCollection.items,
    
    // Computed
    departmentRules,
    resolvedValues,
    formattedLetter,
    
    // Actions
    setField,
    setMultipleFields,
    setViewMode,
    applyTemplate,
    applyOfficeProfile,
    applyDepartmentRules,
    loadLetter,
    resetForm,
    saveLetter,
    deleteLetter,
    duplicateLetter,
    saveOfficeProfile,
    
    // Utils
    getDepartmentInfo,
    
    // Collection actions
    addTemplate: templatesCollection.addItem,
    deleteTemplate: templatesCollection.removeItem,
    addProfile: profilesCollection.addItem,
    deleteProfile: profilesCollection.removeItem,
  };
}