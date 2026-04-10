// utils/validators.ts - Validation Utilities

import { Letter, Document, Correspondence, Contact, Task } from '../types';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate letter data
 */
export function validateLetter(letter: Partial<Letter>): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!letter.to?.trim()) {
    errors.to = 'Recipient is required';
  }
  
  if (!letter.subject?.trim()) {
    errors.subject = 'Subject is required';
  } else if (letter.subject.length < 5) {
    errors.subject = 'Subject must be at least 5 characters';
  } else if (letter.subject.length > 200) {
    errors.subject = 'Subject must be less than 200 characters';
  }
  
  if (!letter.body?.trim()) {
    errors.body = 'Body content is required';
  } else if (letter.body.length < 20) {
    errors.body = 'Body must be at least 20 characters';
  }
  
  if (letter.letterDate) {
    const date = new Date(letter.letterDate);
    if (isNaN(date.getTime())) {
      errors.letterDate = 'Invalid date format';
    }
  }
  
  if (letter.toEmail && !isValidEmail(letter.toEmail)) {
    errors.toEmail = 'Invalid email format';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate document data
 */
export function validateDocument(doc: Partial<Document>): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!doc.title?.trim()) {
    errors.title = 'Title is required';
  } else if (doc.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  }
  
  if (!doc.category) {
    errors.category = 'Category is required';
  }
  
  if (doc.expiryDate) {
    const date = new Date(doc.expiryDate);
    if (isNaN(date.getTime())) {
      errors.expiryDate = 'Invalid expiry date';
    } else if (date < new Date()) {
      errors.expiryDate = 'Expiry date cannot be in the past';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate correspondence data
 */
export function validateCorrespondence(corr: Partial<Correspondence>): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!corr.party?.trim()) {
    errors.party = 'Party/Contact is required';
  }
  
  if (!corr.subject?.trim()) {
    errors.subject = 'Subject is required';
  }
  
  if (!corr.date) {
    errors.date = 'Date is required';
  }
  
  if (corr.partyEmail && !isValidEmail(corr.partyEmail)) {
    errors.partyEmail = 'Invalid email format';
  }
  
  if (corr.partyPhone && !isValidPhone(corr.partyPhone)) {
    errors.partyPhone = 'Invalid phone number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate contact data
 */
export function validateContact(contact: Partial<Contact>): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!contact.name?.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!contact.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!isValidPhone(contact.phone)) {
    errors.phone = 'Invalid phone number format';
  }
  
  if (contact.email && !isValidEmail(contact.email)) {
    errors.email = 'Invalid email format';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate task data
 */
export function validateTask(task: Partial<Task>): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!task.text?.trim()) {
    errors.text = 'Task description is required';
  }
  
  if (task.dueDate) {
    const date = new Date(task.dueDate);
    if (isNaN(date.getTime())) {
      errors.dueDate = 'Invalid due date';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is valid phone number
 */
export function isValidPhone(phone: string): boolean {
  // Accepts various formats: +92-xxx-xxxxxxx, 03xx-xxxxxxx, etc.
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Check if string is valid reference number
 */
export function isValidReference(ref: string): boolean {
  // Basic format: PREFIX/YEAR/NUMBER
  const refRegex = /^[A-Z]{2,10}\/\d{4}\/[\w\-]+$/i;
  return refRegex.test(ref);
}

/**
 * Sanitize text input (remove dangerous characters)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Check file type is allowed
 */
export function isAllowedFileType(
  fileName: string,
  allowedExtensions: string[] = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt']
): boolean {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * Check file size is within limit
 */
export function isFileSizeValid(size: number, maxSizeMB: number = 10): boolean {
  return size <= maxSizeMB * 1024 * 1024;
}