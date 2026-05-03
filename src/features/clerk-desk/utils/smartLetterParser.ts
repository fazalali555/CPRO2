/**
 * smartLetterParser.ts
 * 
 * Specialized utility to parse full official letter text into structured fields.
 * Handles Pakistani government official letter formats.
 */

export interface ParsedLetter {
  institutionName?: string;
  to?: string;
  subject?: string;
  reference?: string;
  letterDate?: string;
  body: string;
  forwardedTo?: string;
  signatureName?: string;
  signatureTitle?: string;
}

import { getDepartmentInfo } from '../../../utils/departmentDetector';

export const parseOfficialLetter = (text: string): ParsedLetter => {
  if (!text) return { body: '' };

  // 1. Robust Cleaning & Markdown Stripping
  const cleanText = text
    .replace(/\u200B/g, '') 
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\*/g, '')
    .replace(/#/g, '')
    .replace(/__/g, '')
    .replace(/\\_/g, '_');
    
  const lines = cleanText.split('\n').map(l => l.trim());
  const result: ParsedLetter = { body: '' };
  const usedIndices = new Set<number>();
  
  let headerIndex = -1;
  let toIndex = -1;
  let subjectIndex = -1;
  let refDateIndex = -1;
  let forwardingIndex = -1;
  let salutationIndex = -1;
  let signatureStartIndex = -1;

  // 2. Identify the Office Header
  for (let i = 0; i < lines.length && i < 15; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    const upperL = l.toUpperCase();
    
    const deptInfo = getDepartmentInfo(l);
    const isRecognizedDept = deptInfo.organizationType !== 'other' || deptInfo.departmentType !== 'unknown';
    const isKeywordMatch = upperL.includes('OFFICE OF') || upperL.includes('GOVT OF') || upperL.includes('GOVERNMENT OF') || (upperL.includes('DEPARTMENT') && upperL.includes('EDUCATION')) || upperL.includes('SDEO') || upperL.includes('DEO') || upperL.includes('SUB-DIVISIONAL');

    if (isRecognizedDept || isKeywordMatch) {
      headerIndex = i;
      result.institutionName = lines[i];
      usedIndices.add(i);
      
      // Try to capture up to 2 more lines if they look like header lines (district/department/etc)
      for (let j = i + 1; j < i + 3 && j < lines.length; j++) {
        const nextL = lines[j].trim();
        if (nextL.length > 2 && nextL.length < 70 && !/^(To|Subject|No|Dated|Ref|OFFICE ORDER)/i.test(nextL)) {
          result.institutionName += `\n${nextL}`;
          usedIndices.add(j);
        } else {
          break;
        }
      }
      break; 
    }
  }

  const searchStartIndex = headerIndex !== -1 ? headerIndex : 0;

  // 3. Look for Reference / Date line
  for (let i = searchStartIndex; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const l = lines[i];
    if (/^(No|Ref|Reference)[:.]?\s+/i.test(l) || /Dated\s+/i.test(l) || /No\.\s*\d+/i.test(l) || /No\.\s*_{3,}/i.test(l)) {
      refDateIndex = i;
      usedIndices.add(i);
      
      const refMatch = l.match(/(?:No|Ref|Reference)[:.]?\s*([\w/\\:_\. \(\)-]{3,})/i) || l.match(/No\.?\s*([\w/\\:_\. \(\)-]{3,})/i);
      if (refMatch) result.reference = refMatch[1].replace(/:$/, '').trim();
      
      const dateMatch = l.match(/(?:Dated|Date)[:.]?\s*([\d\/\.\-\w\s,]{6,})/i) || l.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
      if (dateMatch) result.letterDate = dateMatch[1].trim();
      break;
    }
  }

  // 4. Look for Recipient (To:)
  for (let i = searchStartIndex; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const l = lines[i];
    if (/^To[:\s]*$/i.test(l) || (/^To[:\s]+/i.test(l) && l.split(' ').length < 10)) {
      toIndex = i;
      usedIndices.add(i);
      
      const recipLines: string[] = [];
      if (l.toLowerCase().startsWith('to') && l.length > 3) {
        const afterTo = l.replace(/^to[:\s,]+/i, '').trim();
        if (afterTo) recipLines.push(afterTo);
      }
      
      for (let j = i + 1; j < lines.length && j < i + 8; j++) {
        if (usedIndices.has(j)) break;
        const nextL = lines[j];
        if (!nextL.trim()) continue;
        if (/^(Subject|Sub|Memo|Ref|Reference|No|Dated|OFFICE ORDER)[:\s]/i.test(nextL)) break;
        if (/^(Respected|Sir|Madam|Dear|A\.?O)/i.test(nextL)) break;
        
        recipLines.push(nextL);
        usedIndices.add(j);
      }
      if (recipLines.length > 0) {
        result.to = recipLines.join('\n');
        break;
      }
    }
  }

  // 5. Look for Subject line or OFFICE ORDER title
  for (let i = searchStartIndex; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const l = lines[i];
    if (/^(Subject|Subj|Sub|Topic)[:\s]/i.test(l)) {
      result.subject = l.replace(/^(Subject|Subj|Sub|Topic)[:\s]+/i, '').trim();
      subjectIndex = i;
      usedIndices.add(i);
      break;
    } else if (/^OFFICE ORDER$/i.test(l.trim())) {
      result.subject = 'OFFICE ORDER';
      subjectIndex = i;
      usedIndices.add(i);
      break;
    }
  }

  // 6. Detect Salutation or Memo/Reference marker
  for (let i = searchStartIndex; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    const l = lines[i];
    if (/^(Respected|Sir|Madam|Dear|Memo|Reference)[:\s]*$/i.test(l) || /^(Respected|Sir|Madam|Dear|Memo|Reference)[:\s]+/i.test(l)) {
      salutationIndex = i;
      usedIndices.add(i);
      break;
    }
  }

  // 7. Detect Forwarding (Bottom up)
  for (let i = lines.length - 1; i > Math.max(0, lines.length - 60); i--) {
    const l = lines[i].toLowerCase();
    if (l.includes('copy') && (l.includes('forwarded') || l.includes('information') || l.includes('to:'))) {
      const fwdLines: string[] = [];
      forwardingIndex = i;
      usedIndices.add(i);
      
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].includes('Next Steps') || lines[j].includes('---') || lines[j].includes('###')) break;
        if (lines[j].trim()) {
           fwdLines.push(lines[j].replace(/^(\d+|[a-z]|[ivx]+)[\.\)]\s*/i, '').replace(/^\(\d+\)\s*/, '').trim());
           usedIndices.add(j);
        }
      }
      if (fwdLines.length > 0) {
        result.forwardedTo = fwdLines.join('\n');
        break;
      }
    }
  }

  // 8. Detect Signature Block (Near end, before forwarding)
  for (let i = lines.length - 1; i > Math.max(0, lines.length - 40); i--) {
    if (usedIndices.has(i)) continue;
    const l = lines[i].replace(/\*/g, '').trim();
    if (!l) continue;
    const upperL = l.toUpperCase();
    
    const deptInfo = getDepartmentInfo(l);
    const isRecognizedSig = deptInfo.organizationType !== 'other' && deptInfo.signatureTitleShort !== 'Officer';
    
    if ((isRecognizedSig || upperL.includes('OFFICER') || upperL.includes('DEO') || upperL.includes('SDEO') || upperL.includes('HEADMISTRESS') || upperL.includes('PRINCIPAL') || upperL.includes('CLERK') || upperL.includes('DIRECTOR') || upperL.includes('SECRETARY')) && !upperL.includes('OFFICE OF') && !upperL.includes('TO')) {
      signatureStartIndex = i;
      const sigLines: string[] = [];
      
      // Look back for a name (avoiding used indices or markdown)
      if (i > 0 && lines[i-1].length > 2 && lines[i-1].length < 50 && !usedIndices.has(i-1) && !lines[i-1].includes('---')) {
        result.signatureName = lines[i-1].replace(/\*/g, '').trim();
        usedIndices.add(i-1);
      }
      
      sigLines.push(l);
      usedIndices.add(i);
      
      // Look forward for location
      if (i + 1 < lines.length && lines[i+1].length > 2 && lines[i+1].length < 60 && !usedIndices.has(i+1) && !lines[i+1].includes('Copy') && !lines[i+1].includes('---')) {
        sigLines.push(lines[i+1].replace(/\*/g, '').trim());
        usedIndices.add(i+1);
      }
      
      result.signatureTitle = sigLines.join('\n');
      break;
    }
  }

  // 9. Extract Body
  const bodyLines: string[] = [];
  const bodyStart = Math.max(subjectIndex, salutationIndex, toIndex, refDateIndex, headerIndex) + 1;
  
  for (let i = bodyStart; i < lines.length; i++) {
    if (usedIndices.has(i)) continue;
    if (i === forwardingIndex) break;
    if (lines[i].includes('---')) break;
    if (lines[i].includes('<br>')) continue; // Skip raw BR tags

    bodyLines.push(lines[i]);
  }

  while (bodyLines.length > 0 && !bodyLines[0].trim()) bodyLines.shift();
  while (bodyLines.length > 0 && !bodyLines[bodyLines.length - 1].trim()) bodyLines.pop();

  result.body = bodyLines.join('\n').trim();

  return result;
};
