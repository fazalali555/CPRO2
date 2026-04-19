// constants/index.ts - Application Constants

import { LetterTemplate, OfficeProfile, TabConfig } from '../types';

export const STORAGE_KEYS = {
  LETTERS: 'clerk_pro_clerk_letters',
  DOCUMENTS: 'clerk_pro_clerk_documents',
  CORRESPONDENCE: 'clerk_pro_clerk_correspondence',
  APPOINTMENTS: 'clerk_pro_clerk_appointments',
  RECORDS: 'clerk_pro_clerk_records',
  CONTACTS: 'clerk_pro_clerk_contacts',
  TASKS: 'clerk_pro_clerk_tasks',
  TEMPLATES: 'clerk_pro_clerk_templates',
  OFFICE_PROFILES: 'clerk_pro_clerk_office_profiles',
  PREFERENCES: 'clerk_pro_clerk_preferences',
} as const;

export const DEFAULT_TEMPLATES: LetterTemplate[] = [
  {
    id: 'tpl_general',
    name: 'General Office Letter',
    body: '{{body}}',
    category: 'general',
    placeholders: ['body'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_reminder',
    name: 'Reminder Notice',
    body: 'This is a reminder regarding:\n\n{{body}}\n\nPlease ensure timely compliance.',
    category: 'notice',
    placeholders: ['body'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_dispatch',
    name: 'Dispatch Cover Letter',
    body: 'Please find enclosed the following documents for your necessary action:\n\n{{body}}\n\nKindly acknowledge receipt.',
    category: 'dispatch',
    placeholders: ['body'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_transfer',
    name: 'Teacher Transfer Order',
    body: 'This is to inform that {{teacher_name}}, {{designation}}, is hereby transferred from {{from_school}} to {{to_school}} with effect from {{effective_date}}.\n\nThe concerned teacher is directed to report to the new posting immediately and hand over charge at the current posting.\n\n{{body}}',
    category: 'orders',
    placeholders: ['teacher_name', 'designation', 'from_school', 'to_school', 'effective_date', 'body'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_leave',
    name: 'Leave Sanction Order',
    body: 'Leave of {{leave_type}} for {{leave_days}} days is hereby sanctioned to {{employee_name}}, {{designation}}, from {{start_date}} to {{end_date}}.\n\nDuring the leave period, the charge of duties will be held by {{officiating_officer}}.\n\n{{body}}',
    category: 'orders',
    placeholders: ['leave_type', 'leave_days', 'employee_name', 'designation', 'start_date', 'end_date', 'officiating_officer', 'body'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_meeting',
    name: 'Meeting Notice',
    body: 'A meeting is scheduled to be held on {{meeting_date}} at {{meeting_time}} in {{venue}} to discuss the following agenda:\n\n{{agenda}}\n\nAll concerned are requested to attend the meeting punctually.\n\n{{body}}',
    category: 'notice',
    placeholders: ['meeting_date', 'meeting_time', 'venue', 'agenda', 'body'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_show_cause',
    name: 'Show Cause Notice',
    body: 'Whereas it has come to the notice of this office that you have {{violation_details}}.\n\nYou are hereby directed to show cause in writing within {{response_days}} days from the receipt of this notice as to why disciplinary action should not be initiated against you.\n\nIn case of failure to respond, it will be presumed that you have nothing to say in your defense, and the matter will be decided ex-parte.\n\n{{body}}',
    category: 'notice',
    placeholders: ['violation_details', 'response_days', 'body'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_noc',
    name: 'No Objection Certificate',
    body: 'This is to certify that this office has No Objection to {{noc_purpose}} of {{person_name}}, {{designation}}, working in {{current_organization}}.\n\nThis certificate is issued on the request of the applicant for {{intended_use}}.\n\n{{body}}',
    category: 'certificate',
    placeholders: ['noc_purpose', 'person_name', 'designation', 'current_organization', 'intended_use', 'body'],
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_OFFICE_PROFILES: OfficeProfile[] = [
  {
    id: 'headmistress',
    name: 'Headmistress Office',
    letterheadLines: 'OFFICE OF THE HEADMISTRESS\nGOVERNMENT GIRLS HIGH SCHOOL',
    fromOffice: 'Government Girls High School',
    signatureTitle: 'Headmistress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'principal',
    name: 'Principal Office',
    letterheadLines: 'OFFICE OF THE PRINCIPAL\nGOVERNMENT HIGHER SECONDARY SCHOOL',
    fromOffice: 'Government Higher Secondary School',
    signatureTitle: 'Principal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sdeo',
    name: 'SDEO Office',
    letterheadLines: 'OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER\nDEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    fromOffice: 'Sub Divisional Education Office',
    signatureTitle: 'Sub Divisional Education Officer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'deo',
    name: 'DEO Office',
    letterheadLines: 'OFFICE OF THE DISTRICT EDUCATION OFFICER\nDEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    fromOffice: 'District Education Office',
    signatureTitle: 'District Education Officer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'dde',
    name: 'DDE Office',
    letterheadLines: 'OFFICE OF THE DEPUTY DIRECTOR EDUCATION\nDEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    fromOffice: 'Deputy Director Education Office',
    signatureTitle: 'Deputy Director Education',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const SCHOOL_TYPES = [
  { code: 'GPS', name: 'Government Primary School', level: 'primary', gender: 'mixed' },
  { code: 'GGPS', name: 'Government Girls Primary School', level: 'primary', gender: 'female' },
  { code: 'GBPS', name: 'Government Boys Primary School', level: 'primary', gender: 'male' },
  { code: 'GMS', name: 'Government Middle School', level: 'middle', gender: 'mixed' },
  { code: 'GGMS', name: 'Government Girls Middle School', level: 'middle', gender: 'female' },
  { code: 'GBMS', name: 'Government Boys Middle School', level: 'middle', gender: 'male' },
  { code: 'GHS', name: 'Government High School', level: 'high', gender: 'mixed' },
  { code: 'GGHS', name: 'Government Girls High School', level: 'high', gender: 'female' },
  { code: 'GBHS', name: 'Government Boys High School', level: 'high', gender: 'male' },
  { code: 'GHSS', name: 'Government Higher Secondary School', level: 'higher', gender: 'mixed' },
  { code: 'GGHSS', name: 'Government Girls Higher Secondary School', level: 'higher', gender: 'female' },
  { code: 'GBHSS', name: 'Government Boys Higher Secondary School', level: 'higher', gender: 'male' },
] as const;

export const DOCUMENT_CATEGORIES = [
  { value: 'general', label: 'General', icon: 'folder' },
  { value: 'orders', label: 'Orders', icon: 'gavel' },
  { value: 'notices', label: 'Notices', icon: 'campaign' },
  { value: 'accounts', label: 'Accounts', icon: 'account_balance' },
  { value: 'personnel', label: 'Personnel', icon: 'badge' },
  { value: 'procurement', label: 'Procurement', icon: 'shopping_cart' },
  { value: 'meetings', label: 'Meetings', icon: 'groups' },
  { value: 'legal', label: 'Legal', icon: 'balance' },
] as const;

export const RECORD_TYPES = [
  { value: 'dispatch', label: 'Dispatch Register', icon: 'send' },
  { value: 'receipt', label: 'Receipt Register', icon: 'inbox' },
  { value: 'attendance', label: 'Attendance', icon: 'how_to_reg' },
  { value: 'stock', label: 'Stock Register', icon: 'inventory_2' },
  { value: 'expense', label: 'Expense Register', icon: 'receipt_long' },
  { value: 'general', label: 'General Entry', icon: 'description' },
] as const;

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'info', icon: 'arrow_downward' },
  { value: 'normal', label: 'Normal', color: 'success', icon: 'remove' },
  { value: 'high', label: 'High', color: 'warning', icon: 'arrow_upward' },
  { value: 'urgent', label: 'Urgent', color: 'error', icon: 'priority_high' },
] as const;

export const CORRESPONDENCE_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'replied', label: 'Replied', color: 'info' },
  { value: 'closed', label: 'Closed', color: 'success' },
  { value: 'escalated', label: 'Escalated', color: 'error' },
] as const;

export const LEAVE_TYPES = [
  'Casual Leave',
  'Earned Leave',
  'Medical Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Study Leave',
  'Extra Ordinary Leave',
  'Special Leave',
] as const;

export const TAB_CONFIG: TabConfig[] = [
  { id: 'letters', label: 'Letters', icon: 'mail' },
  { id: 'filing', label: 'Filing', icon: 'folder' },
  { id: 'correspondence', label: 'Correspondence', icon: 'forum' },
  { id: 'appointments', label: 'Appointments', icon: 'event' },
  { id: 'records', label: 'Records', icon: 'description' },
  { id: 'reports', label: 'Reports', icon: 'assessment' },
  { id: 'contacts', label: 'Contacts', icon: 'contacts' },
  { id: 'tasks', label: 'Tasks', icon: 'task' },
];

export const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', 'S'], action: 'Save Draft', scope: 'letters' },
  { keys: ['Ctrl', 'Shift', 'S'], action: 'Finalize Letter', scope: 'letters' },
  { keys: ['Ctrl', 'N'], action: 'New Letter', scope: 'letters' },
  { keys: ['Ctrl', 'P'], action: 'Print/Export', scope: 'letters' },
  { keys: ['Ctrl', 'F'], action: 'Search', scope: 'global' },
  { keys: ['Ctrl', 'Z'], action: 'Undo', scope: 'global' },
  { keys: ['Ctrl', 'Y'], action: 'Redo', scope: 'global' },
  { keys: ['Ctrl', '1-8'], action: 'Switch Tab', scope: 'global' },
  { keys: ['Esc'], action: 'Cancel/Close', scope: 'global' },
];

export const AI_TONES = [
  { value: 'formal', label: 'Formal & Professional' },
  { value: 'polite', label: 'Polite & Courteous' },
  { value: 'firm', label: 'Firm & Direct' },
  { value: 'friendly', label: 'Friendly & Warm' },
  { value: 'urgent', label: 'Urgent & Immediate' },
] as const;

export const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF Document', icon: 'picture_as_pdf' },
  { value: 'docx', label: 'Word Document', icon: 'description' },
  { value: 'txt', label: 'Plain Text', icon: 'text_snippet' },
  { value: 'html', label: 'HTML', icon: 'code' },
] as const;
// Re-export letter constants
export * from './letter-constants';
