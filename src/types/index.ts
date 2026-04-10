// types/index.ts - Complete Type Definitions

export type LetterStatus = 'draft' | 'final' | 'sent' | 'archived';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type Direction = 'incoming' | 'outgoing';
export type ContactType = 'internal' | 'external';
export type RecordType = 'dispatch' | 'receipt' | 'attendance' | 'stock' | 'expense' | 'general';
export type CorrespondenceStatus = 'pending' | 'replied' | 'closed' | 'escalated';
export type DocumentCategory = 'general' | 'orders' | 'notices' | 'accounts' | 'personnel' | 'procurement' | 'meetings' | 'legal';

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface OfficeProfile extends BaseEntity {
  name: string;
  letterheadLines: string;
  fromOffice: string;
  signatureTitle: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface LetterTemplate extends BaseEntity {
  name: string;
  body: string;
  category: string;
  placeholders: string[];
  isDefault?: boolean;
}

export interface Letter extends BaseEntity {
  templateId: string;
  officeProfileId?: string;
  schoolType: string;
  schoolName: string;
  recipientGender: 'Male' | 'Female';
  salutation: string;
  letterheadLines: string;
  fromOffice: string;
  to: string;
  toEmail?: string;
  subject: string;
  reference: string;
  letterDate: string;
  body: string;
  tags: string[];
  signatureName: string;
  signatureTitle: string;
  forwardedTo: string[];
  status: LetterStatus;
  priority: Priority;
  versions: LetterVersion[];
  attachments: Attachment[];
  sentAt?: string;
  sentTo?: string[];
}

export interface LetterVersion {
  id: string;
  version: number;
  content: Partial<Letter>;
  createdAt: string;
  createdBy: string;
  changeNote?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  fileId: string;
}

export interface Document extends BaseEntity {
  title: string;
  category: DocumentCategory;
  tags: string[];
  description: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  expiryDate?: string;
  isConfidential: boolean;
  accessLog: AccessLogEntry[];
}

export interface AccessLogEntry {
  userId: string;
  userName: string;
  action: 'view' | 'download' | 'edit' | 'delete';
  timestamp: string;
}

export interface Correspondence extends BaseEntity {
  direction: Direction;
  party: string;
  partyEmail?: string;
  partyPhone?: string;
  subject: string;
  refNo: string;
  date: string;
  dueDate?: string;
  status: CorrespondenceStatus;
  priority: Priority;
  notes: string;
  linkedLetterId?: string;
  reminders: Reminder[];
  history: CorrespondenceHistory[];
}

export interface CorrespondenceHistory {
  id: string;
  action: string;
  note: string;
  timestamp: string;
  userId: string;
}

export interface Reminder {
  id: string;
  date: string;
  message: string;
  isCompleted: boolean;
}

export interface Appointment extends BaseEntity {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  attendees: Attendee[];
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  reminderMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  notes?: string;
}

export interface Attendee {
  name: string;
  email?: string;
  phone?: string;
  isRequired: boolean;
  response?: 'accepted' | 'declined' | 'tentative' | 'pending';
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
}

export interface Record extends BaseEntity {
  type: RecordType;
  refNo: string;
  date: string;
  details: string;
  amount?: number;
  category?: string;
  attachments: Attachment[];
}

export interface Contact extends BaseEntity {
  type: ContactType;
  name: string;
  designation?: string;
  organization: string;
  department?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  notes?: string;
  tags: string[];
  isFavorite: boolean;
}

export interface Task extends BaseEntity {
  text: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority: Priority;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category?: string;
  assignedTo?: string;
  linkedEntityType?: 'letter' | 'correspondence' | 'appointment';
  linkedEntityId?: string;
  subtasks: Subtask[];
  reminderDate?: string;
}

export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface SearchFilters {
  query: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  category?: string;
  priority?: Priority;
}

export interface DashboardStats {
  letters: {
    draft: number;
    final: number;
    sent: number;
    total: number;
  };
  correspondence: {
    incoming: number;
    outgoing: number;
    pending: number;
    total: number;
  };
  documents: {
    total: number;
    byCategory: Record<string, number>;
  };
  tasks: {
    pending: number;
    completed: number;
    overdue: number;
    total: number;
  };
  appointments: {
    upcoming: number;
    today: number;
    total: number;
  };
}

export interface AIGenerationRequest {
  recipient: string;
  tone: string;
  purpose: string;
  keyPoints: string[];
  length: { maxWords: number };
  language: string;
  senderName: string;
  senderTitle: string;
  referenceNo?: string;
  fromOffice?: string;
  letterhead?: string;
  forwardedTo?: string[];
}

export interface AIGenerationResponse {
  text: string;
  suggestions?: string[];
  error?: string;
  code?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt' | 'html';
  includeLetterhead: boolean;
  includeWatermark: boolean;
  watermarkText?: string;
  paperSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
}

export type TabId = 'letters' | 'filing' | 'correspondence' | 'appointments' | 'records' | 'reports' | 'contacts' | 'tasks';

export interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
}