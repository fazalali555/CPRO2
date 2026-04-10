// utils/formatters.ts - Formatting Utilities

import { Letter, Document, Correspondence } from '../types';

/**
 * Format letter to plain text
 */
export function formatLetterToText(letter: Letter): string {
  const parts: string[] = [];
  
  // Letterhead
  if (letter.letterheadLines) {
    parts.push(letter.letterheadLines);
    parts.push('');
  }
  
  // From office
  if (letter.fromOffice) {
    parts.push(letter.fromOffice);
    parts.push('');
  }
  
  // Reference and date line
  const refNo = letter.reference || '____________';
  const dateStr = letter.letterDate 
    ? new Date(letter.letterDate).toLocaleDateString('en-GB')
    : '____/____/______';
  parts.push(`No. ${refNo}                         Dated: ${dateStr}`);
  parts.push('');
  
  // Recipient
  parts.push('To,');
  const recipientLines = letter.to.split('\n').map(l => l.trim()).filter(Boolean);
  recipientLines.forEach(line => parts.push(`              ${line}`));
  parts.push('');
  
  // Subject
  const subjectLine = `Subject: ${letter.subject.toUpperCase()}`;
  parts.push(subjectLine);
  parts.push(''.padEnd(subjectLine.length, '_'));
  parts.push('');
  
  // Salutation
  parts.push(`Respected ${letter.salutation},`);
  parts.push('');
  
  // Body
  parts.push(letter.body);
  parts.push('');
  
  // Closing
  parts.push('Yours faithfully,');
  parts.push('');
  parts.push('');
  
  // Signature
  const signatureWidth = 70;
  parts.push((letter.signatureName || 'Clerk').padStart(signatureWidth));
  parts.push((letter.signatureTitle || 'Education Office').padStart(signatureWidth));
  
  // Forwarded to
  if (letter.forwardedTo && letter.forwardedTo.length > 0) {
    parts.push('');
    parts.push('Copy Forwarded To:');
    letter.forwardedTo.forEach((item, index) => {
      parts.push(`  ${index + 1}. ${item}`);
    });
  }
  
  return parts.join('\n');
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, format: 'short' | 'long' | 'relative' = 'short'): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  switch (format) {
    case 'long':
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    
    case 'relative':
      return formatRelativeDate(date);
    
    case 'short':
    default:
      return date.toLocaleDateString('en-GB');
  }
}

/**
 * Format relative date (e.g., "2 days ago")
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format reference number
 */
export function formatReferenceNumber(prefix: string, date: Date, sequence: number): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  
  return `${prefix}/${year}/${month}/${seq}`;
}

/**
 * Generate unique reference number
 */
export function generateReferenceNumber(prefix: string = 'EDU'): string {
  const now = new Date();
  const timestamp = now.getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  
  return `${prefix}/${now.getFullYear()}/${timestamp}${random}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format priority label
 */
export function formatPriority(priority: string): { label: string; color: string; icon: string } {
  const priorities: Record<string, { label: string; color: string; icon: string }> = {
    low: { label: 'Low', color: 'info', icon: 'arrow_downward' },
    normal: { label: 'Normal', color: 'success', icon: 'remove' },
    high: { label: 'High', color: 'warning', icon: 'arrow_upward' },
    urgent: { label: 'Urgent', color: 'error', icon: 'priority_high' },
  };
  
  return priorities[priority] || priorities.normal;
}

/**
 * Format status label
 */
export function formatStatus(status: string): { label: string; color: string } {
  const statuses: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'warning' },
    final: { label: 'Final', color: 'success' },
    sent: { label: 'Sent', color: 'info' },
    archived: { label: 'Archived', color: 'neutral' },
    pending: { label: 'Pending', color: 'warning' },
    replied: { label: 'Replied', color: 'info' },
    closed: { label: 'Closed', color: 'success' },
    escalated: { label: 'Escalated', color: 'error' },
  };
  
  return statuses[status] || { label: status, color: 'neutral' };
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, searchTerms: string[]): string {
  if (!searchTerms.length) return text;
  
  const escaped = searchTerms.map(term => 
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  
  return text.replace(pattern, '<mark>$1</mark>');
}

/**
 * Parse tags from string
 */
export function parseTags(tagString: string): string[] {
  return tagString
    .split(/[,;]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Format tags for display
 */
export function formatTags(tags: string[]): string {
  return tags.join(', ');
}