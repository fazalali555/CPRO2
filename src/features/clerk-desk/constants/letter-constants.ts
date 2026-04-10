// constants/letter-constants.ts - Letter Writing Constants

import { 
  EnhancedTemplate, 
  EnhancedOfficeProfile, 
  PrintSettings,
  LetterCategory,
  UrgencyLevel,
  ConfidentialityLevel 
} from '../types/letter';

// Letter Categories
export const LETTER_CATEGORIES: { value: LetterCategory; label: string; labelUrdu: string; icon: string }[] = [
  { value: 'official', label: 'Official Letter', labelUrdu: 'سرکاری خط', icon: 'mail' },
  { value: 'demi_official', label: 'Demi-Official (D.O.)', labelUrdu: 'نیم سرکاری', icon: 'drafts' },
  { value: 'unofficial', label: 'Unofficial', labelUrdu: 'غیر سرکاری', icon: 'article' },
  { value: 'circular', label: 'Circular', labelUrdu: 'سرکلر', icon: 'campaign' },
  { value: 'memo', label: 'Office Memorandum', labelUrdu: 'دفتری یادداشت', icon: 'note' },
  { value: 'notification', label: 'Notification', labelUrdu: 'نوٹیفکیشن', icon: 'notifications' },
  { value: 'order', label: 'Office Order', labelUrdu: 'دفتری حکم', icon: 'gavel' },
  { value: 'notice', label: 'Notice', labelUrdu: 'نوٹس', icon: 'info' },
  { value: 'endorsement', label: 'Endorsement', labelUrdu: 'توثیق', icon: 'verified' },
  { value: 'reminder', label: 'Reminder', labelUrdu: 'یاد دہانی', icon: 'alarm' },
  { value: 'acknowledgment', label: 'Acknowledgment', labelUrdu: 'اعتراف وصولی', icon: 'thumb_up' },
];

// Urgency Levels
export const URGENCY_LEVELS: { value: UrgencyLevel; label: string; labelUrdu: string; color: string }[] = [
  { value: 'routine', label: 'Routine', labelUrdu: 'معمول', color: 'neutral' },
  { value: 'priority', label: 'Priority', labelUrdu: 'ترجیحی', color: 'info' },
  { value: 'immediate', label: 'Immediate', labelUrdu: 'فوری', color: 'warning' },
  { value: 'most_immediate', label: 'Most Immediate', labelUrdu: 'انتہائی فوری', color: 'error' },
  { value: 'flash', label: 'Flash', labelUrdu: 'برق رفتار', color: 'error' },
];

// Confidentiality Levels
export const CONFIDENTIALITY_LEVELS: { value: ConfidentialityLevel; label: string; labelUrdu: string; color: string }[] = [
  { value: 'unclassified', label: 'Unclassified', labelUrdu: 'غیر درجہ بند', color: 'neutral' },
  { value: 'restricted', label: 'Restricted', labelUrdu: 'محدود', color: 'info' },
  { value: 'confidential', label: 'Confidential', labelUrdu: 'رازداری', color: 'warning' },
  { value: 'secret', label: 'Secret', labelUrdu: 'خفیہ', color: 'error' },
  { value: 'top_secret', label: 'Top Secret', labelUrdu: 'انتہائی خفیہ', color: 'error' },
];

// Salutations
export const SALUTATIONS = {
  formal: {
    male: ['Sir', 'Respected Sir', 'Dear Sir', 'Honorable Sir'],
    female: ['Madam', 'Respected Madam', 'Dear Madam', 'Honorable Madam'],
    neutral: ['Sir/Madam', 'Dear Sir/Madam', 'To Whom It May Concern'],
  },
  urdu: {
    male: ['جناب', 'محترم جناب', 'جناب والا'],
    female: ['محترمہ', 'جناب محترمہ'],
    neutral: ['جناب/محترمہ'],
  },
};

// Closings
export const CLOSINGS = {
  formal: [
    'Yours faithfully,',
    'Yours sincerely,',
    'Yours obediently,',
    'Respectfully yours,',
    'With kind regards,',
    'With best regards,',
  ],
  urdu: [
    'خاکسار',
    'مخلص',
    'آپ کا مخلص',
  ],
};

// Forward Actions
export const FORWARD_ACTIONS = [
  { value: 'information', label: 'For Information', labelUrdu: 'برائے اطلاع' },
  { value: 'necessary_action', label: 'For Necessary Action', labelUrdu: 'برائے ضروری کارروائی' },
  { value: 'compliance', label: 'For Compliance', labelUrdu: 'برائے تعمیل' },
  { value: 'report', label: 'For Report', labelUrdu: 'برائے رپورٹ' },
  { value: 'record', label: 'For Record', labelUrdu: 'برائے ریکارڈ' },
  { value: 'comments', label: 'For Comments', labelUrdu: 'برائے تبصرہ' },
  { value: 'approval', label: 'For Approval', labelUrdu: 'برائے منظوری' },
  { value: 'signature', label: 'For Signature', labelUrdu: 'برائے دستخط' },
];

// Paper Sizes
export const PAPER_SIZES = {
  A4: { width: 210, height: 297, unit: 'mm', label: 'A4 (210 × 297 mm)' },
  A5: { width: 148, height: 210, unit: 'mm', label: 'A5 (148 × 210 mm)' },
  Letter: { width: 216, height: 279, unit: 'mm', label: 'Letter (8.5 × 11 in)' },
  Legal: { width: 216, height: 356, unit: 'mm', label: 'Legal (8.5 × 14 in)' },
  Executive: { width: 184, height: 267, unit: 'mm', label: 'Executive (7.25 × 10.5 in)' },
};

// Default Print Settings
export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperSize: 'A4',
  orientation: 'portrait',
  margins: { top: 25, right: 20, bottom: 25, left: 25, unit: 'mm' },
  includeLetterhead: true,
  includeFooter: true,
  includePageNumbers: true,
  pageNumberPosition: 'bottom',
  includeWatermark: false,
  watermarkOpacity: 0.1,
  includeQRCode: false,
  qrCodePosition: 'bottom-right',
  copies: 1,
  colorMode: 'blackwhite',
  quality: 'high',
};

// Default Templates
export const ENHANCED_TEMPLATES: EnhancedTemplate[] = [
  {
    id: 'tpl_official',
    name: 'Official Letter',
    nameUrdu: 'سرکاری خط',
    category: 'official',
    description: 'Standard official letter format',
    body: `{{greeting}}

With reference to the subject cited above, I am directed to inform you that {{main_content}}.

{{additional_info}}

{{closing_request}}`,
    bodyUrdu: `{{greeting}}

حوالہ بالا کے سلسلے میں آپ کو مطلع کیا جاتا ہے کہ {{main_content}}۔

{{additional_info}}

{{closing_request}}`,
    placeholders: [
      { key: 'greeting', label: 'Greeting', type: 'text', required: false, defaultValue: 'With due respect' },
      { key: 'main_content', label: 'Main Content', type: 'textarea', required: true },
      { key: 'additional_info', label: 'Additional Information', type: 'textarea', required: false },
      { key: 'closing_request', label: 'Closing Request', type: 'text', required: false, defaultValue: 'This is for your information and necessary action please.' },
    ],
    defaultPrintSettings: DEFAULT_PRINT_SETTINGS,
    isDefault: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_transfer',
    name: 'Transfer Order',
    nameUrdu: 'تبادلہ آرڈر',
    category: 'order',
    description: 'Employee transfer order template',
    body: `This is to inform that {{employee_name}}, {{designation}}, is hereby transferred from {{from_location}} to {{to_location}} with immediate effect / with effect from {{effective_date}}.

The officer is directed to:
1. Hand over charge at the present posting within {{handover_days}} days
2. Report to the new posting immediately thereafter
3. Intimate the date of relieving and joining to this office

This transfer is in {{transfer_type}}.

{{additional_instructions}}`,
    placeholders: [
      { key: 'employee_name', label: 'Employee Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'from_location', label: 'From (Current Posting)', type: 'text', required: true },
      { key: 'to_location', label: 'To (New Posting)', type: 'text', required: true },
      { key: 'effective_date', label: 'Effective Date', type: 'date', required: false },
      { key: 'handover_days', label: 'Handover Days', type: 'number', required: true, defaultValue: '3' },
      { key: 'transfer_type', label: 'Transfer Type', type: 'select', required: true, options: [
        { value: 'public interest', label: 'Public Interest' },
        { value: 'own request', label: 'Own Request' },
        { value: 'administrative grounds', label: 'Administrative Grounds' },
        { value: 'routine transfer policy', label: 'Routine Transfer Policy' },
      ]},
      { key: 'additional_instructions', label: 'Additional Instructions', type: 'textarea', required: false },
    ],
    defaultPrintSettings: DEFAULT_PRINT_SETTINGS,
    isDefault: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_leave_sanction',
    name: 'Leave Sanction Order',
    nameUrdu: 'چھٹی منظوری آرڈر',
    category: 'order',
    description: 'Employee leave sanction template',
    body: `Leave of {{leave_type}} for {{leave_days}} day(s) is hereby sanctioned to {{employee_name}}, {{designation}}, from {{start_date}} to {{end_date}}.

Station Leave: {{station_leave}}

During the period of absence, the charge of duties will be held by {{officiating_name}}, {{officiating_designation}}.

{{additional_conditions}}

This issues with the approval of the competent authority.`,
    placeholders: [
      { key: 'leave_type', label: 'Leave Type', type: 'select', required: true, options: [
        { value: 'Casual Leave', label: 'Casual Leave (CL)' },
        { value: 'Earned Leave', label: 'Earned Leave (EL)' },
        { value: 'Medical Leave', label: 'Medical Leave' },
        { value: 'Maternity Leave', label: 'Maternity Leave' },
        { value: 'Paternity Leave', label: 'Paternity Leave' },
        { value: 'Study Leave', label: 'Study Leave' },
        { value: 'Extra Ordinary Leave', label: 'Extra Ordinary Leave (EOL)' },
        { value: 'Special Leave', label: 'Special Leave' },
      ]},
      { key: 'leave_days', label: 'Number of Days', type: 'number', required: true },
      { key: 'employee_name', label: 'Employee Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'start_date', label: 'Start Date', type: 'date', required: true },
      { key: 'end_date', label: 'End Date', type: 'date', required: true },
      { key: 'station_leave', label: 'Station Leave', type: 'select', required: true, options: [
        { value: 'Granted', label: 'Granted' },
        { value: 'Not Granted', label: 'Not Granted' },
        { value: 'Not Required', label: 'Not Required' },
      ]},
      { key: 'officiating_name', label: 'Officiating Officer Name', type: 'text', required: true },
      { key: 'officiating_designation', label: 'Officiating Officer Designation', type: 'text', required: true },
      { key: 'additional_conditions', label: 'Additional Conditions', type: 'textarea', required: false },
    ],
    defaultPrintSettings: DEFAULT_PRINT_SETTINGS,
    isDefault: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_show_cause',
    name: 'Show Cause Notice',
    nameUrdu: 'وجوہات بتاؤ نوٹس',
    category: 'notice',
    description: 'Disciplinary show cause notice',
    body: `Whereas it has come to the notice of this office that you have {{violation_details}}.

The above conduct/act on your part constitutes misconduct under Rule {{rule_reference}} of {{rules_name}}.

You are hereby directed to show cause in writing within {{response_days}} days from the receipt of this notice as to why disciplinary action under the relevant rules should not be initiated against you.

You may also request a personal hearing if you so desire.

In case of failure to respond within the stipulated time, it will be presumed that you have nothing to say in your defense, and the matter will be decided ex-parte.

A copy of this notice is being placed in your personal file.`,
    placeholders: [
      { key: 'violation_details', label: 'Violation/Misconduct Details', type: 'textarea', required: true },
      { key: 'rule_reference', label: 'Rule Reference', type: 'text', required: false, defaultValue: '...' },
      { key: 'rules_name', label: 'Rules Name', type: 'text', required: false, defaultValue: 'KPK Civil Servants (Efficiency & Discipline) Rules' },
      { key: 'response_days', label: 'Response Days', type: 'number', required: true, defaultValue: '7' },
    ],
    defaultPrintSettings: DEFAULT_PRINT_SETTINGS,
    isDefault: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_meeting_notice',
    name: 'Meeting Notice',
    nameUrdu: 'میٹنگ نوٹس',
    category: 'notice',
    description: 'Meeting/conference notice',
    body: `A meeting is scheduled to be held as per the following details:

Date:       {{meeting_date}}
Time:       {{meeting_time}}
Venue:      {{venue}}
Chair:      {{chairperson}}

AGENDA:
{{agenda_items}}

All concerned officers/officials are directed to attend the meeting punctually with relevant record/data.

Absence without prior approval will be viewed seriously.

{{additional_instructions}}`,
    placeholders: [
      { key: 'meeting_date', label: 'Meeting Date', type: 'date', required: true },
      { key: 'meeting_time', label: 'Meeting Time', type: 'text', required: true },
      { key: 'venue', label: 'Venue', type: 'text', required: true },
      { key: 'chairperson', label: 'Chairperson', type: 'text', required: true },
      { key: 'agenda_items', label: 'Agenda Items', type: 'textarea', required: true },
      { key: 'additional_instructions', label: 'Additional Instructions', type: 'textarea', required: false },
    ],
    defaultPrintSettings: DEFAULT_PRINT_SETTINGS,
    isDefault: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_noc',
    name: 'No Objection Certificate',
    nameUrdu: 'عدم اعتراض سرٹیفکیٹ',
    category: 'official',
    description: 'NOC for various purposes',
    body: `NO OBJECTION CERTIFICATE

This is to certify that this office has No Objection to {{noc_purpose}} of {{person_name}}, {{designation}}, currently working in {{current_organization}} since {{joining_date}}.

The applicant has no pending:
☐ Disciplinary case
☐ Audit observation
☐ Outstanding dues
☐ Pending inquiry

This certificate is issued on the request of the applicant for {{intended_use}}.

This NOC is valid for {{validity_period}} from the date of issue.

{{additional_conditions}}`,
    placeholders: [
      { key: 'noc_purpose', label: 'Purpose of NOC', type: 'select', required: true, options: [
        { value: 'transfer', label: 'Transfer' },
        { value: 'deputation', label: 'Deputation' },
        { value: 'higher studies', label: 'Higher Studies' },
        { value: 'passport', label: 'Passport/Visa' },
        { value: 'foreign travel', label: 'Foreign Travel' },
        { value: 'property purchase', label: 'Property Purchase' },
        { value: 'bank loan', label: 'Bank Loan' },
        { value: 'other', label: 'Other' },
      ]},
      { key: 'person_name', label: 'Person Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'current_organization', label: 'Current Organization', type: 'text', required: true },
      { key: 'joining_date', label: 'Joining Date', type: 'date', required: true },
      { key: 'intended_use', label: 'Intended Use', type: 'text', required: true },
      { key: 'validity_period', label: 'Validity Period', type: 'text', required: true, defaultValue: '3 months' },
      { key: 'additional_conditions', label: 'Additional Conditions', type: 'textarea', required: false },
    ],
    defaultPrintSettings: DEFAULT_PRINT_SETTINGS,
    isDefault: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_reminder',
    name: 'Reminder Letter',
    nameUrdu: 'یاد دہانی خط',
    category: 'reminder',
    description: 'Reminder for pending matters',
    body: `This is {{reminder_number}} reminder regarding the following matter:

Reference: {{original_reference}}
Dated:     {{original_date}}
Subject:   {{original_subject}}

{{reminder_content}}

Despite the lapse of {{days_elapsed}} days, no response/compliance has been received from your end.

You are once again requested to {{action_required}} by {{deadline}} positively.

In case of non-compliance, the matter will be escalated to higher authorities.`,
    placeholders: [
      { key: 'reminder_number', label: 'Reminder Number', type: 'select', required: true, options: [
        { value: '1st', label: 'First (1st)' },
        { value: '2nd', label: 'Second (2nd)' },
        { value: '3rd', label: 'Third (3rd)' },
        { value: 'Final', label: 'Final' },
      ]},
      { key: 'original_reference', label: 'Original Letter Reference', type: 'text', required: true },
      { key: 'original_date', label: 'Original Letter Date', type: 'date', required: true },
      { key: 'original_subject', label: 'Original Subject', type: 'text', required: true },
      { key: 'reminder_content', label: 'Reminder Details', type: 'textarea', required: true },
      { key: 'days_elapsed', label: 'Days Elapsed', type: 'number', required: true },
      { key: 'action_required', label: 'Action Required', type: 'textarea', required: true },
      { key: 'deadline', label: 'New Deadline', type: 'date', required: true },
    ],
    defaultPrintSettings: DEFAULT_PRINT_SETTINGS,
    isDefault: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_circular',
    name: 'Office Circular',
    nameUrdu: 'دفتری سرکلر',
    category: 'circular',
    description: 'Internal circular for announcements',
    body: `OFFICE CIRCULAR

All officers/officials of this office are hereby informed that {{circular_content}}.

Effective Date: {{effective_date}}

{{instructions}}

All concerned are directed to ensure strict compliance.

This circular supersedes all previous instructions on the subject, if any.`,
    placeholders: [
      { key: 'circular_content', label: 'Circular Content', type: 'textarea', required: true },
      { key: 'effective_date', label: 'Effective Date', type: 'date', required: true },
      { key: 'instructions', label: 'Detailed Instructions', type: 'textarea', required: false },
    ],
    defaultPrintSettings: DEFAULT_PRINT_SETTINGS,
    isDefault: true,
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Reference Number Prefixes by Office Type
export const REFERENCE_PREFIXES = {
  school: {
    GPS: 'GPS',
    GGPS: 'GGPS',
    GMS: 'GMS',
    GGMS: 'GGMS',
    GHS: 'GHS',
    GGHS: 'GGHS',
    GHSS: 'GHSS',
    GGHSS: 'GGHSS',
  },
  office: {
    SDEO: 'SDEO',
    DEO: 'DEO',
    DDE: 'DDE',
    RDE: 'RDE',
    DE: 'DE',
    SE: 'SE',
  },
  department: {
    EDU: 'EDU',
    EST: 'EST',
    ACC: 'ACC',
    ADM: 'ADM',
    PLN: 'PLN',
  },
};

// Date Format Options
export const DATE_FORMATS = {
  gregorian: {
    short: 'DD/MM/YYYY',
    long: 'DD MMMM, YYYY',
    formal: 'the DD day of MMMM, YYYY',
  },
  islamic: {
    short: 'DD/MM/YYYY',
    long: 'DD MMMM YYYY (Hijri)',
  },
};

// QR Code Data Template
export const QR_CODE_TEMPLATE = {
  version: '1.0',
  fields: ['referenceNumber', 'date', 'subject', 'from', 'to', 'verificationUrl'],
};
