// hooks/useLetterComposer.ts - Letter Composition Hook

import { useReducer, useCallback, useMemo, useEffect } from 'react';
import { Letter, LetterTemplate, OfficeProfile, LetterVersion } from '../types';
import { useLocalStorageCollection } from './useLocalStorage';
import { STORAGE_KEYS, DEFAULT_TEMPLATES, DEFAULT_OFFICE_PROFILES, SCHOOL_TYPES } from '../constants';
import { formatLetterToText } from '../utils/formatters';
import { securityService, auditService } from '../../../services/SecurityService';

// State shape
interface LetterFormState {
  templateId: string;
  officeProfileId: string;
  schoolType: string;
  schoolName: string;
  recipientGender: 'Male' | 'Female';
  salutation: string;
  letterheadLines: string;
  fromOffice: string;
  to: string;
  toEmail: string;
  subject: string;
  reference: string;
  letterDate: string;
  body: string;
  tags: string;
  signatureName: string;
  signatureTitle: string;
  forwardedTo: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  // UI state
  editingId: string | null;
  isDirty: boolean;
  lastSaved: string | null;
}

// Actions
type LetterFormAction =
  | { type: 'SET_FIELD'; field: keyof LetterFormState; value: any }
  | { type: 'SET_MULTIPLE'; fields: Partial<LetterFormState> }
  | { type: 'LOAD_LETTER'; letter: Letter }
  | { type: 'APPLY_TEMPLATE'; template: LetterTemplate }
  | { type: 'APPLY_PROFILE'; profile: OfficeProfile }
  | { type: 'APPLY_SCHOOL_RULES'; rules: SchoolRules }
  | { type: 'RESET' }
  | { type: 'MARK_SAVED' }
  | { type: 'MARK_DIRTY' };

interface SchoolRules {
  gender: 'Male' | 'Female';
  salutation: string;
  title: string;
  schoolLine: string;
  letterhead: string;
}

const initialFormState: LetterFormState = {
  templateId: DEFAULT_TEMPLATES[0]?.id || '',
  officeProfileId: '',
  schoolType: 'GPS',
  schoolName: '',
  recipientGender: 'Male',
  salutation: 'Sir',
  letterheadLines: '',
  fromOffice: '',
  to: '',
  toEmail: '',
  subject: '',
  reference: '',
  letterDate: new Date().toISOString().slice(0, 10),
  body: '',
  tags: '',
  signatureName: securityService.getCurrentUser()?.name || 'Clerk',
  signatureTitle: 'Education Office',
  forwardedTo: '',
  priority: 'normal',
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
        schoolType: action.letter.schoolType,
        schoolName: action.letter.schoolName,
        recipientGender: action.letter.recipientGender,
        salutation: action.letter.salutation,
        letterheadLines: action.letter.letterheadLines,
        fromOffice: action.letter.fromOffice,
        to: action.letter.to,
        toEmail: action.letter.toEmail || '',
        subject: action.letter.subject,
        reference: action.letter.reference,
        letterDate: action.letter.letterDate,
        body: action.letter.body,
        tags: action.letter.tags.join(', '),
        signatureName: action.letter.signatureName,
        signatureTitle: action.letter.signatureTitle,
        forwardedTo: action.letter.forwardedTo.join('\n'),
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
    
    case 'APPLY_SCHOOL_RULES':
      return {
        ...state,
        recipientGender: action.rules.gender,
        salutation: action.rules.salutation,
        letterheadLines: state.letterheadLines || action.rules.letterhead,
        fromOffice: state.fromOffice || action.rules.schoolLine,
        signatureTitle: state.signatureTitle || action.rules.title,
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
  
  // Collections
  const lettersCollection = useLocalStorageCollection<Letter>(STORAGE_KEYS.LETTERS);
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

  // Computed school rules
  const schoolRules = useMemo((): SchoolRules => {
    const info = SCHOOL_TYPES.find(s => s.code === formState.schoolType);
    const isGirls = formState.schoolType.startsWith('GG');
    const gender = isGirls ? 'Female' : formState.recipientGender;
    const sal = formState.salutation.trim() || (gender === 'Female' ? 'Madam' : 'Sir');
    const isHigherSecondary = formState.schoolType.endsWith('HSS');
    const title = isHigherSecondary 
      ? 'Principal' 
      : gender === 'Female' ? 'Headmistress' : 'Headmaster';
    const schoolLine = [info?.name, formState.schoolName].filter(Boolean).join(' ').trim();
    const letterhead = [
      title ? `OFFICE OF THE ${title.toUpperCase()}` : '',
      schoolLine.toUpperCase()
    ].filter(Boolean).join('\n');
    
    return { gender, salutation: sal, title, schoolLine, letterhead };
  }, [formState.schoolType, formState.schoolName, formState.recipientGender, formState.salutation]);

  // Resolved values (with fallbacks)
  const resolvedValues = useMemo(() => ({
    letterhead: formState.letterheadLines.trim() || schoolRules.letterhead,
    fromOffice: formState.fromOffice.trim() || schoolRules.schoolLine,
    signatureTitle: formState.signatureTitle.trim() || schoolRules.title || 'Education Office',
    recipientGender: schoolRules.gender,
    salutation: formState.salutation.trim() || schoolRules.salutation,
  }), [formState, schoolRules]);

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
      resolvedValues.letterhead,
      resolvedValues.fromOffice
    ].map(x => x?.trim()).filter(Boolean).join('\n');
    
    // Process template body
    let bodyContent = template?.body || '{{body}}';
    bodyContent = bodyContent
      .replace(/\{\{body\}\}/g, formState.body || '________________')
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

  const applySchoolRules = useCallback(() => {
    dispatch({ type: 'APPLY_SCHOOL_RULES', rules: schoolRules });
  }, [schoolRules]);

  const loadLetter = useCallback((letterId: string) => {
    const letter = lettersCollection.getItem(letterId);
    if (letter) {
      dispatch({ type: 'LOAD_LETTER', letter });
    }
  }, [lettersCollection]);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const saveLetter = useCallback((status: 'draft' | 'final'): Letter | null => {
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
      schoolType: formState.schoolType,
      schoolName: formState.schoolName.trim(),
      recipientGender: resolvedValues.recipientGender as 'Male' | 'Female',
      salutation: resolvedValues.salutation,
      letterheadLines: resolvedValues.letterhead,
      fromOffice: resolvedValues.fromOffice,
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
      status,
      priority: formState.priority,
      versions: [],
      attachments: [],
    };

    let savedLetter: Letter;

    if (formState.editingId) {
      // Update existing
      const existing = lettersCollection.getItem(formState.editingId);
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

        lettersCollection.updateItem(formState.editingId, {
          ...letterData,
          versions: updatedVersions,
        });

        savedLetter = { ...existing, ...letterData, versions: updatedVersions, updatedAt: now };
        auditService.log('LETTER_UPDATED', `Updated letter: ${letterData.subject}`, formState.editingId);
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
    dispatch({ type: 'RESET' });

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
    schoolRules,
    resolvedValues,
    formattedLetter,
    
    // Actions
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
    
    // Collection actions
    addTemplate: templatesCollection.addItem,
    deleteTemplate: templatesCollection.removeItem,
    addProfile: profilesCollection.addItem,
    deleteProfile: profilesCollection.removeItem,
  };
}