/**
 * letterRenderer.ts
 * 
 * Unified rendering logic for Clerk Desk letters.
 * Ensures consistent output between Preview, Print, and Word export.
 */

import { Letter } from '../types';
import { getDepartmentInfo } from '../../../utils/departmentDetector';

export interface RenderOptions {
  useOfficialNumbering?: boolean;
  sigSpace?: 'compact' | 'standard' | 'generous';
  openingStatement?: string;
}

export const getLetterHeader = (letter: Partial<Letter>, officeProfile: any) => {
  const fullInstitutionName = (letter.institutionName || '').trim();
  const deptInfo = getDepartmentInfo(fullInstitutionName || 'Office');

  const rawLines = fullInstitutionName.split('\n').map(l => l.trim()).filter(Boolean);

  // Line 1: Office/Designation Name (e.g. OFFICE OF THE DISTRICT POLICE OFFICER)
  let line1 = deptInfo.letterhead?.line1 || deptInfo.headerTitle;

  // Line 2: Department Name (e.g. Police Department, E&SE Department)
  let line2 = deptInfo.department || deptInfo.letterhead?.line2 || officeProfile?.district_line || '';

  // If user provided custom institution name that looks like a header (e.g. starts with OFFICE OF), prioritize it
  if (rawLines.length > 0 && (line1.toUpperCase().includes('HEAD OF OFFICE') || !line1.toUpperCase().includes('OFFICE'))) {
     if (rawLines[0].toUpperCase().startsWith('OFFICE OF')) {
        line1 = rawLines[0].toUpperCase();
        if (rawLines.length > 1) {
          // If the 2nd line is already a department, keep it, else use user's 2nd line
          if (!line2.toUpperCase().includes('DEPARTMENT')) {
            line2 = rawLines[1].toUpperCase();
          }
        }
     }
  }

  const line3 = 'Govt. of Khyber Pakhtunkhwa';

  return { line1, line2, line3, deptInfo };
};

export const getSignatureDetails = (letter: Partial<Letter>, deptInfo: any) => {
  const name = (letter.signatureName || '').trim();
  const title = (letter.signatureTitle || deptInfo?.signatureTitle || '').trim();

  if (!name) return { display: title, isCombined: false };
  if (!title) return { display: name, isCombined: false };

  const nameUpper = name.toUpperCase();
  const titleFirstLine = title.split('\n')[0].toUpperCase();

  // Smart Deduplication: If name field already contains the title
  if (nameUpper.includes(titleFirstLine)) {
    return { display: name, isCombined: true };
  }

  return { display: `${name}\n${title}`, isCombined: false };
};
export const getOpeningStatement = (deptInfo: any) => {
  const org = deptInfo?.organizationType;
  const isHigherOffice = org === 'directorate' || org === 'education_office' || org === 'police_office' || org === 'finance_office';
  
  return isHigherOffice 
    ? "I am directed to refer to the subject noted above and to state that"
    : "I have the honor to refer to the subject cited above and to state that";
};

export const formatDateFormal = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : null;
  if (d && !isNaN(d.getTime())) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  }
  return `___ / ___ / ${new Date().getFullYear()}`;
};

export const cleanMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/###?\s+(.+)/g, '<strong>$1</strong>') // Headers to bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.+?)\*/g, '<em>$1</em>') // Italics
    .replace(/^[\s]*[-*+]\s+(.+)/gm, '• $1') // List bullets
    .replace(/`(.+?)`/g, '<code>$1</code>'); // Code
};

export const parseBodyParagraphs = (html: string) => {
  if (!html) return [];
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const paragraphs = Array.from(temp.children).map(child => child.outerHTML);
  if (paragraphs.length === 0 && html.trim()) {
    return html.split(/<br\s*\/?>/i).filter(Boolean).map(line => `<p>${line}</p>`);
  }
  
  return paragraphs.filter(p => p.replace(/<[^>]*>/g, '').trim().length > 0);
};
