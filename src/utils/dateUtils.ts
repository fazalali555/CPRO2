
import { format, parseISO } from 'date-fns';

/**
 * Standard date formatter for the application.
 * Handles invalid dates gracefully.
 */
export const formatDate = (dateStr?: string | Date | null, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!dateStr) return '';
  
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Formats a date for official forms (removes hyphens/slashes).
 * Useful for box-style date inputs.
 */
export const formatOfficialDate = (dateStr?: string | Date | null): string => {
  return formatDate(dateStr, 'ddMMyyyy');
};

/**
 * Formats a date for payroll (MMMM / yyyy).
 */
export const formatPayrollMonth = (dateStr?: string | Date | null): string => {
  return formatDate(dateStr, 'MMMM / yyyy');
};

/**
 * Checks if it is 1st December of the current year.
 */
export const isDecemberFirst = (): boolean => {
  const today = new Date();
  return today.getMonth() === 11 && today.getDate() === 1;
};

/**
 * Gets the current year for Audit Year reporting.
 */
export const getAuditYear = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  return `${year}-${(year + 1).toString().slice(-2)}`;
};
