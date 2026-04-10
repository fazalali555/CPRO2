// types/letter.ts - Enhanced Letter Types

export interface EnhancedLetter {
  id: string;
  
  // Basic Info
  templateId: string;
  officeProfileId: string;
  category: LetterCategory;
  urgency: UrgencyLevel;
  confidentiality: ConfidentialityLevel;
  
  // Reference
  referenceNumber: string;
  referencePrefix: string;
  referenceYear: string;
  referenceSequence: number;
  previousReference?: string;
  inReplyTo?: string;
  
  // Dates
  letterDate: string;
  islamicDate?: string;
  receivedDate?: string;
  replyByDate?: string;
  
  // Parties
  sender: LetterParty;
  recipient: LetterParty;
  cc: LetterParty[];
  bcc: LetterParty[];
  throughChannel?: LetterParty[];
  
  // Content
  salutation: string;
  subject: string;
  subjectUrdu?: string;
  body: string;
  bodyFormatted: FormattedContent;
  enclosures: Enclosure[];
  
  // Signature
  signatory: Signatory;
  counterSignatories?: Signatory[];
  
  // Forwarding
  forwardedTo: ForwardEntry[];
  endorsements: Endorsement[];
  
  // Metadata
  tags: string[];
  status: LetterStatus;
  priority: Priority;
  
  // Tracking
  versions: LetterVersion[];
  printCount: number;
  lastPrintedAt?: string;
  sentVia?: SendMethod[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Print Settings
  printSettings: PrintSettings;
}

export type LetterCategory = 
  | 'official'
  | 'demi_official'
  | 'unofficial'
  | 'circular'
  | 'memo'
  | 'notification'
  | 'order'
  | 'notice'
  | 'endorsement'
  | 'reminder'
  | 'acknowledgment';

export type UrgencyLevel = 'routine' | 'priority' | 'immediate' | 'most_immediate' | 'flash';

export type ConfidentialityLevel = 'unclassified' | 'restricted' | 'confidential' | 'secret' | 'top_secret';

export type LetterStatus = 'draft' | 'pending_review' | 'approved' | 'final' | 'sent' | 'archived' | 'cancelled';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface LetterParty {
  id?: string;
  name: string;
  designation?: string;
  organization: string;
  department?: string;
  address?: string;
  city?: string;
  district?: string;
  email?: string;
  phone?: string;
  fax?: string;
}

export interface Signatory {
  name: string;
  designation: string;
  organization?: string;
  signatureImageId?: string;
  stampImageId?: string;
  date?: string;
}

export interface Enclosure {
  id: string;
  title: string;
  description?: string;
  fileId?: string;
  fileName?: string;
  pageCount?: number;
  isCopy: boolean;
}

export interface ForwardEntry {
  to: string;
  purpose: string;
  action?: 'information' | 'necessary_action' | 'compliance' | 'report' | 'record';
  deadline?: string;
}

export interface Endorsement {
  id: string;
  number: string;
  date: string;
  text: string;
  signatory: Signatory;
}

export interface FormattedContent {
  html: string;
  plainText: string;
  paragraphs: Paragraph[];
}

export interface Paragraph {
  id: string;
  type: 'text' | 'heading' | 'list' | 'table' | 'quote';
  content: string;
  formatting: TextFormatting;
  alignment: 'left' | 'center' | 'right' | 'justify';
  indentLevel: number;
}

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
}

export interface PrintSettings {
  paperSize: PaperSize;
  orientation: 'portrait' | 'landscape';
  margins: Margins;
  includeLetterhead: boolean;
  includeFooter: boolean;
  includePageNumbers: boolean;
  pageNumberPosition: 'top' | 'bottom';
  includeWatermark: boolean;
  watermarkText?: string;
  watermarkOpacity: number;
  includeQRCode: boolean;
  qrCodePosition: 'top-right' | 'bottom-right' | 'bottom-left';
  copies: number;
  colorMode: 'color' | 'grayscale' | 'blackwhite';
  quality: 'draft' | 'normal' | 'high';
}

export type PaperSize = 'A4' | 'A5' | 'Letter' | 'Legal' | 'Executive';

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit: 'mm' | 'cm' | 'in';
}

export interface SendMethod {
  type: 'email' | 'print' | 'fax' | 'courier' | 'hand_delivery' | 'registered_post';
  sentAt: string;
  sentTo: string;
  trackingNumber?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface LetterVersion {
  id: string;
  version: number;
  content: Partial<EnhancedLetter>;
  createdAt: string;
  createdBy: string;
  changeNote?: string;
  isAutoSave: boolean;
}

// Template Types
export interface EnhancedTemplate {
  id: string;
  name: string;
  nameUrdu?: string;
  category: LetterCategory;
  description?: string;
  body: string;
  bodyUrdu?: string;
  placeholders: TemplatePlaceholder[];
  defaultPrintSettings: Partial<PrintSettings>;
  isDefault: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplatePlaceholder {
  key: string;
  label: string;
  labelUrdu?: string;
  type: 'text' | 'date' | 'number' | 'select' | 'textarea' | 'contact';
  required: boolean;
  defaultValue?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

// Office Profile Types
export interface EnhancedOfficeProfile {
  id: string;
  name: string;
  nameUrdu?: string;
  
  // Organization Info
  organizationType: 'school' | 'college' | 'office' | 'department' | 'directorate';
  organizationName: string;
  organizationNameUrdu?: string;
  department?: string;
  departmentUrdu?: string;
  
  // Address
  address: string;
  addressUrdu?: string;
  city: string;
  district: string;
  province: string;
  postalCode?: string;
  
  // Contact
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  
  // Letterhead
  letterhead: LetterheadConfig;
  
  // Reference
  referencePrefix: string;
  currentSequence: number;
  
  // Signatory
  defaultSignatory: Signatory;
  
  // Branding
  logoId?: string;
  stampId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface LetterheadConfig {
  style: 'centered' | 'left_aligned' | 'split' | 'custom';
  showLogo: boolean;
  logoPosition: 'left' | 'center' | 'right';
  logoSize: 'small' | 'medium' | 'large';
  
  line1: string;
  line1Urdu?: string;
  line1Style: TextStyle;
  
  line2?: string;
  line2Urdu?: string;
  line2Style?: TextStyle;
  
  line3?: string;
  line3Urdu?: string;
  line3Style?: TextStyle;
  
  showAddress: boolean;
  showContact: boolean;
  
  dividerStyle: 'none' | 'single' | 'double' | 'ornate';
  dividerColor?: string;
  
  backgroundColor?: string;
  padding: number;
}

export interface TextStyle {
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textTransform: 'none' | 'uppercase' | 'capitalize';
  color?: string;
  fontFamily?: string;
}

// Print Preview Types
export interface PrintPreviewData {
  html: string;
  css: string;
  pageCount: number;
  estimatedPrintTime: number;
}

// Export Types
export interface ExportConfig {
  format: 'pdf' | 'docx' | 'html' | 'txt' | 'rtf';
  includeMetadata: boolean;
  includeVersionHistory: boolean;
  embedFonts: boolean;
  compressImages: boolean;
  pdfSettings?: PDFSettings;
}

export interface PDFSettings {
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  creator: string;
  producer: string;
  encrypted: boolean;
  password?: string;
  permissions?: PDFPermissions;
}

export interface PDFPermissions {
  print: boolean;
  copy: boolean;
  modify: boolean;
  annotate: boolean;
}
