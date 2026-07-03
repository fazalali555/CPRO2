/**
 * smartLetterParser.ts
 *
 * Specialized utility to parse full official letter text into structured fields.
 * Handles Pakistani government official letter formats and AI text cleanup.
 */

import { getDepartmentInfo, detectGenderFromText } from '@/utils/departmentDetector';

export interface ParsedLetter {
  confidence: number;          // 0-100
  letterType: string;
  officeName: string | null;
  officeType: "DEO" | "SDEO" | "School" | "Other" | null;
  gender: "Male" | "Female" | null;
  district: string | null;
  area: string | null;
  refNo: string;
  refNoSuffix: string | null;
  date: string;
  dateRaw: string;
  recipient: string | null;
  recipients: string[];
  subjectPerson: {
    name: string;
    designation: string;
    school: string;
  } | null;
  signatoryTitle: string | null;
  signatoryArea: string | null;
  subject: string;
  bodyHtml: string;           // cleaned, markdown-converted body
  body?: string;              // Add this for AIImportModal compatibility
  warnings?: string[];         // Add this for AIImportModal compatibility
  copyTo: string[];
  enclosures: string[];
  hasForwarding: boolean;
  hasEnclosures: boolean;
  hasTable: boolean;
  detectedFields: {
    field: string;
    value: string;
    confidence: "high" | "medium" | "low";
  }[];
}

function cleanAIMarkdown(text: string): string {
  let clean = text

  // Remove AI preamble lines at start
  const preamblePatterns = [
    /^Here is (?:a |an |the )?(?:clean|official|revised|updated|corrected|formal|rewritten|improved)?[^\n]*\n+/im,
    /^Here's (?:a |an |the )?[^\n]*\n+/im,
    /^Certainly[!,]?[^\n]*\n+/im,
    /^Sure[!,]?[^\n]*\n+/im,
    /^Of course[!,]?[^\n]*\n+/im,
    /^Below is[^\n]*\n+/im,
    /^I have (?:written|drafted|prepared|created)[^\n]*\n+/im,
    /^I've (?:written|drafted|prepared|created)[^\n]*\n+/im,
    /^Please find[^\n]*\n+/im,
    /^The following[^\n]*\n+/im,
    /^As requested[^\n]*\n+/im,
  ]

  for (const pattern of preamblePatterns) {
    clean = clean.replace(pattern, '')
  }

  // Remove --- separator that AI puts before letter
  clean = clean.replace(/^---\s*\n/m, '')

  // Remove trailing AI offer lines
  clean = clean.replace(
    /\n+(?:If you (?:want|need|would like)|I can also|Would you like|Let me know|Make it more|Or simplify|Add a|Adjust wording|Feel free)[^\n]*/gi,
    ''
  )

  // Remove lines that are clearly AI meta-commentary
  // (lines that end with ":" and contain AI-speak before letter content)
  const firstLetterLine = clean.search(
    /(?:OFFICE OF THE|GOVERNMENT|No\.|Dated:|ORDER|SUBJECT:)/i
  )
  if (firstLetterLine > 0) {
    const before = clean.substring(0, firstLetterLine)
    // Only strip if preamble is short (< 500 chars) to avoid
    // accidentally removing valid content
    if (before.length < 500) {
      clean = clean.substring(firstLetterLine)
    }
  }

  return clean.trim()
}

function parseDateToISO(raw: string): string {
  if (!raw || raw.match(/^_+$/) || raw.match(/^\/\//)) 
    return ''
  
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`
  
  // DD Month YYYY e.g. "09 March 2026" or "9 Mar 2026"
  const months: Record<string,string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
  }
  const dmonthy = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/)
  if (dmonthy) {
    const m = months[dmonthy[2].toLowerCase().slice(0,3)]
    if (m) return `${dmonthy[3]}-${m}-${dmonthy[1].padStart(2,'0')}`
  }
  
  // Already ISO
  if (raw.match(/^\d{4}-\d{2}-\d{2}$/)) return raw
  
  return '' // cannot parse
}

const markdownToHtml = (text: string): string => {
  let html = text;

  // Specific substitutions
  // vide Endst. No. ...
  html = html.replace(/vide\s+Endst\.?\s+No\.?\s+([\w\-\/\\]+)/gi, 'vide Endst. No. <strong>$1</strong>');
  
  // Underscores
  html = html.replace(/_{3,}/g, '<u>___</u>');

  // Markdown lists
  let listActive = false;
  let listType = '';
  const lines = html.split('\n');
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Markdown horizontal rule
    if (line.match(/^---$/)) {
      processedLines.push('<hr>');
      continue;
    }

    // Markdown Headings
    if (line.match(/^##\s+(.*)/)) {
      processedLines.push(`<h2>${line.replace(/^##\s+/, '')}</h2>`);
      continue;
    }
    if (line.match(/^#\s+(.*)/)) {
      processedLines.push(`<h1>${line.replace(/^#\s+/, '')}</h1>`);
      continue;
    }

    // Bullet List
    const bulletMatch = line.match(/^[\*\-]\s+(.*)/);
    if (bulletMatch) {
      if (listType !== 'ul') {
        if (listActive) processedLines.push(`</${listType}>`);
        processedLines.push('<ul>');
        listActive = true;
        listType = 'ul';
      }
      processedLines.push(`<li>${bulletMatch[1]}</li>`);
      continue;
    }

    // Ordered List
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      if (listType !== 'ol') {
        if (listActive) processedLines.push(`</${listType}>`);
        processedLines.push('<ol>');
        listActive = true;
        listType = 'ol';
      }
      processedLines.push(`<li>${orderedMatch[2]}</li>`);
      continue;
    }

    if (listActive) {
      processedLines.push(`</${listType}>`);
      listActive = false;
      listType = '';
    }

    // Detect Pipe Tables
    if (line.match(/^\|.*\|$/)) {
      let tableHtml = '<table><tbody>';
      let isHeader = true;
      while (i < lines.length && lines[i].match(/^\|.*\|$/)) {
        if (lines[i].match(/^\|[\s\-\|]+\|$/)) {
          isHeader = false; // separator line
          i++;
          continue;
        }
        tableHtml += '<tr>';
        const cells = lines[i].split('|').slice(1, -1);
        for (const cell of cells) {
          const tag = isHeader ? 'th' : 'td';
          tableHtml += `<${tag}>${cell.trim()}</${tag}>`;
        }
        tableHtml += '</tr>';
        i++;
        isHeader = false;
      }
      i--; // step back since loop increments
      tableHtml += '</tbody></table>';
      processedLines.push(tableHtml);
      continue;
    }

    // Detect Tab tables
    if (line.includes('\t')) {
      const parts = line.split('\t');
      if (parts.length > 1) {
        let tableHtml = '<table><tbody>';
        let isHeader = true;
        while (i < lines.length && lines[i].includes('\t')) {
          tableHtml += '<tr>';
          const cells = lines[i].split('\t');
          for (const cell of cells) {
            const tag = isHeader ? 'th' : 'td';
            tableHtml += `<${tag}>${cell.trim()}</${tag}>`;
          }
          tableHtml += '</tr>';
          i++;
          isHeader = false;
        }
        i--;
        tableHtml += '</tbody></table>';
        processedLines.push(tableHtml);
        continue;
      }
    }

    // Just normal line, add paragraph or break
    if (line.trim() === '') {
      processedLines.push('<br>');
    } else {
      // ALL CAPS heading
      if (line === line.toUpperCase() && line.length > 5 && !line.includes('<')) {
        processedLines.push(`<strong>${line}</strong>`);
      } else {
        processedLines.push(`<p>${line}</p>`);
      }
    }
  }

  if (listActive) {
    processedLines.push(`</${listType}>`);
  }

  html = processedLines.join('');

  // Inline styling
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.*?)__/g, '<u>$1</u>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  return html;
}

export const parseOfficialLetter = (rawText: string): ParsedLetter => {
  const text = cleanAIMarkdown(rawText);
  const lines = text.split('\n').map(line => line.trim());
  
  const parsed: ParsedLetter = {
    confidence: 0,
    letterType: 'Unknown',
    officeName: null,
    officeType: null,
    gender: null,
    district: null,
    area: null,
    refNo: '',
    refNoSuffix: null,
    date: '',
    dateRaw: '',
    recipient: null,
    recipients: [],
    subjectPerson: null,
    signatoryTitle: null,
    signatoryArea: null,
    subject: '',
    bodyHtml: '',
    copyTo: [],
    enclosures: [],
    hasForwarding: false,
    hasEnclosures: false,
    hasTable: false,
    detectedFields: []
  };

  let foundRefDateLine = false;

  // 1. Core Header Detection
  const topLinesCount = Math.min(lines.length, 25);
  for (let i = 0; i < topLinesCount; i++) {
    const line = lines[i];
    if (!line) continue;
    const upper = line.toUpperCase();

    // Office Header
    if (!parsed.officeName && (upper.includes('OFFICE OF THE') || upper.includes('GOVERNMENT') || (upper === line && i < 5 && line.length > 10 && !upper.startsWith('TO')))) {
      if (upper.includes('OFFICE OF THE')) {
        parsed.officeName = line.replace(/OFFICE OF THE/i, '').trim();
      } else {
        parsed.officeName = line;
      }

      let fullHeaderText = line;
      if (i + 1 < lines.length && lines[i+1].trim().length > 0 && !lines[i+1].match(/^(No|Ref|Dated|Date|To|Subject)/i)) {
        fullHeaderText += ' ' + lines[i+1];
      }

      const deptInfo = getDepartmentInfo(fullHeaderText);
      if (deptInfo.organizationType === 'education_office') {
        parsed.officeType = fullHeaderText.toUpperCase().includes('SUB DIVISIONAL') ? 'SDEO' : 'DEO';
      } else if (deptInfo.organizationType.includes('school')) {
        parsed.officeType = 'School';
      } else {
        parsed.officeType = 'Other';
      }

      parsed.gender = detectGenderFromText(fullHeaderText) || deptInfo.gender;
      parsed.district = deptInfo.district || null;
      parsed.area = deptInfo.tehsil || null;

      parsed.detectedFields.push({ field: 'Office Header', value: fullHeaderText, confidence: 'high' });
      parsed.confidence += 15;
    }

    // Ref No and Date
    const refMatch = line.match(/(?:No\.?|Endst\.?\s*No\.?|Ref\.?\s*No\.?)[\s*:]+([\w\/\-\\\(\)_ ]+)(?=\s+Dated|Date|$)/i);
    const dateMatch = line.match(/(?:Dated?|Date)[\s*:]+([\d\/\-A-Za-z_ ,]+)/i);

    if (refMatch && !parsed.refNo) {
      let refStr = refMatch[1].trim();
      const blankMatch = refStr.match(/^(_+)(.*)$/);
      if (blankMatch && blankMatch[1].length >= 2) {
        parsed.refNo = "";
        const suffix = blankMatch[2];
        if (suffix) {
           parsed.refNoSuffix = suffix.replace(/^\//, '').trim();
        }
      } else {
        parsed.refNo = refStr;
        const suffixMatch = parsed.refNo.match(/\/([A-Z\/\-_ ]+)$/i);
        if (suffixMatch) parsed.refNoSuffix = suffixMatch[1].trim();
      }
      parsed.detectedFields.push({ field: 'Reference Number', value: parsed.refNo, confidence: 'high' });
      parsed.confidence += 10;
      foundRefDateLine = true;
    }

    if (dateMatch && !parsed.dateRaw) {
      parsed.dateRaw = dateMatch[1].trim();
      parsed.date = parseDateToISO(parsed.dateRaw);
      parsed.detectedFields.push({ field: 'Date', value: parsed.dateRaw, confidence: 'high' });
      parsed.confidence += 10;
      foundRefDateLine = true;
    }
  }

  // 2. Letter Type Detection
  const allTextUpper = text.toUpperCase();
  if (allTextUpper.includes('SHOW CAUSE NOTICE') || allTextUpper.includes('PRELIMINARY SHOW CAUSE')) parsed.letterType = 'Show Cause Notice';
  else if (allTextUpper.includes('TRANSFER ORDER')) parsed.letterType = 'Transfer Order';
  else if (allTextUpper.includes('RELIEVING ORDER') || allTextUpper.includes('IS HEREBY RELIEVED')) parsed.letterType = 'Relieving Letter';
  else if (allTextUpper.includes('CHARGE HANDOVER')) parsed.letterType = 'Charge Handover';
  else if (text.match(/SUBJECT:.*SHORTAGE/i)) parsed.letterType = 'Staff Shortage';
  else if (text.match(/SUBJECT:.*PENSION/i)) parsed.letterType = 'Pension Letter';
  else if (text.match(/SUBJECT:.*GPF/i)) parsed.letterType = 'GPF Letter';
  else if (text.match(/SUBJECT:.*LPR/i)) parsed.letterType = 'LPR Letter';
  else if (text.match(/SUBJECT:.*REQUEST FOR/i)) parsed.letterType = 'Request Letter';
  else if (text.match(/^To\s*\n.*(?=Sir|Madam|Subject)/s)) parsed.letterType = 'Application';
  else if (text.match(/^ORDER\b/mi)) parsed.letterType = 'Office Order';
  else if (text.match(/^OFFICE ORDER\b/mi)) parsed.letterType = 'Office Order';
  else if (text.match(/^NOTIFICATION\b/mi)) parsed.letterType = 'Notification/Order';

  if (parsed.letterType !== 'Unknown') {
    parsed.detectedFields.push({ field: 'Letter Type', value: parsed.letterType, confidence: 'high' });
    parsed.confidence += 15;
  }

  // 3. Subject and Subject Person Detection
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^(SUBJECT|SUB|RE):/i)) {
      parsed.subject = lines[i].replace(/^(?:SUBJECT|SUB|RE):\s*/i, '').trim();
      if (i + 1 < lines.length && lines[i+1].trim() && !lines[i+1].match(/^(Respected|Sir|Madam|Memo|To)/i)) {
        parsed.subject += ' ' + lines[i+1].trim();
      }
      parsed.detectedFields.push({ field: 'Subject', value: parsed.subject, confidence: 'high' });
      parsed.confidence += 15;
      break;
    }
  }

  // Fallback for Subject from type
  if (!parsed.subject && parsed.letterType !== 'Unknown' && parsed.letterType !== 'Application') {
    parsed.subject = parsed.letterType.toUpperCase();
  }

  const personRegex = /(?:Mr\.|Mst\.|Mrs\.|Miss)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)[,\s]+([A-Z][A-Za-z\s]{2,})(?:\s+at\s+|\s+of\s+|\s+G[H|P|M]S\s+)([^.,\n]+)/i;
  const personMatch = text.match(personRegex);
  if (personMatch) {
    parsed.subjectPerson = {
      name: personMatch[1].trim(),
      designation: personMatch[2].trim().replace(/\s+(at|of)$/i, ''),
      school: personMatch[3].trim().replace(/\s+(is|are|has)\s+.*$/i, '')
    };
    parsed.detectedFields.push({ field: 'Subject Person', value: parsed.subjectPerson.name, confidence: 'medium' });
  }

  // 4. Recipient Detection
  let inToBlock = false;
  const toBlockLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^To[:\s]*$/i) || (lines[i].match(/^To\s/i) && !lines[i].includes(' '))) {
      inToBlock = true;
      if (lines[i].trim().length > 3) {
        toBlockLines.push(lines[i].replace(/^To[:\s]*/i, '').trim());
      }
      continue;
    }
    if (inToBlock) {
      if (lines[i].match(/^(SUBJECT|SUB|MEMO|ORDER|OFFICE ORDER|Respected|Sir|Madam|Dated|No\.)/i) || lines[i].trim() === '') {
        if (lines[i].trim() === '') continue; // skip blank lines inside to
        inToBlock = false;
      } else {
        toBlockLines.push(lines[i].trim());
      }
    }
  }

  if (toBlockLines.length > 0) {
    const combined = toBlockLines.join('\n');
    const numberedMatches = Array.from(combined.matchAll(/(?:\d+)[\.\)]\s+([^\n]+)/g));
    if (numberedMatches.length > 0) {
      parsed.recipients = numberedMatches.map(m => m[1].trim());
      parsed.recipient = parsed.recipients.join('\n');
    } else {
      parsed.recipient = toBlockLines.join('\n');
      parsed.recipients = [parsed.recipient];
    }
    parsed.detectedFields.push({ field: 'Recipient', value: parsed.recipient, confidence: 'high' });
    parsed.confidence += 15;
  } else if (parsed.letterType === 'Office Order' || parsed.letterType === 'Notification/Order') {
    parsed.recipient = null;
  }

  // 5. Copy Forwarding & Enclosures Detection
  let copyIndex = -1;
  let encIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].match(/^(Copy to|Copy forwarded to|Copies to|CC)[:\s]/i)) copyIndex = i;
    if (lines[i].match(/^(Enclosure|Enc|Annexure)[:\s]/i)) encIndex = i;
  }

  if (copyIndex !== -1) {
    parsed.hasForwarding = true;
    for (let i = copyIndex + 1; i < lines.length; i++) {
      if (lines[i].trim() === '' || lines[i].includes('---')) break;
      const clean = lines[i].replace(/^(\d+|[a-z]|[ivx]+)[\.\)]\s*/i, '').trim();
      if (clean) parsed.copyTo.push(clean);
    }
    parsed.detectedFields.push({ field: 'Copy To', value: `${parsed.copyTo.length} recipients`, confidence: 'high' });
  }

  if (encIndex !== -1) {
    parsed.hasEnclosures = true;
    const limit = copyIndex !== -1 ? copyIndex : lines.length;
    for (let i = encIndex + 1; i < limit; i++) {
      if (lines[i].trim() === '' || lines[i].includes('---')) break;
      const clean = lines[i].replace(/^(\d+|[a-z]|[ivx]+)[\.\)]\s*/i, '').trim();
      if (clean) parsed.enclosures.push(clean);
    }
  }

  // 6. Signatory Detection
  const limitBottom = copyIndex !== -1 ? copyIndex : lines.length;
  const bottomLines = lines.slice(Math.max(0, limitBottom - 15), limitBottom);
  for (let i = bottomLines.length - 1; i >= 0; i--) {
    const line = bottomLines[i];
    const upperLine = line.toUpperCase();
    if (upperLine.match(/(DISTRICT EDUCATION OFFICER|SDEO|HEADMASTER|PRINCIPAL|HEAD MISTRESS|DIRECTOR|OFFICER)/)) {
      parsed.signatoryTitle = line.trim();
      if (i + 1 < bottomLines.length && bottomLines[i+1].trim()) {
        parsed.signatoryArea = bottomLines[i+1].trim();
      }
      parsed.detectedFields.push({ field: 'Signatory', value: parsed.signatoryTitle, confidence: 'high' });
      parsed.confidence += 15;
      break;
    }
  }

  // 7. Body Processing (Between Subject/To and Copy To)
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^(SUBJECT|SUB|RE):/i) || lines[i].match(/^(Respected|Sir|Madam|Memo)/i)) {
      bodyStart = i + 1;
      // Skip empty lines or subject continuation
      while (bodyStart < lines.length && (lines[bodyStart].trim() === '' || !lines[bodyStart].includes('.'))) {
        if (lines[bodyStart].trim() !== '' && !lines[bodyStart].match(/^(Respected|Sir|Madam)/i)) {
            // Probably part of subject, continue to next
        } else if (lines[bodyStart].match(/^(Respected|Sir|Madam)/i)) {
            // Found salutation
            bodyStart++;
            break;
        } else {
            bodyStart++;
            break;
        }
        bodyStart++;
      }
      break;
    } else if (lines[i] === 'OFFICE ORDER' || lines[i] === 'ORDER' || lines[i] === 'NOTIFICATION') {
      bodyStart = i + 1;
      break;
    }
  }

  let bodyEnd = lines.length;
  if (copyIndex !== -1) bodyEnd = Math.min(bodyEnd, copyIndex);
  if (encIndex !== -1) bodyEnd = Math.min(bodyEnd, encIndex);
  
  // Cut off signatory lines
  for (let i = bodyEnd - 1; i >= bodyStart; i--) {
    if (lines[i] === parsed.signatoryTitle || lines[i] === parsed.signatoryArea) {
      bodyEnd = i;
    }
  }
  
  // Cut off preceding newlines
  while (bodyEnd > bodyStart && lines[bodyEnd - 1].trim() === '') {
    bodyEnd--;
  }

  const rawBody = lines.slice(bodyStart, bodyEnd).join('\n');
  parsed.hasTable = rawBody.includes('|') || rawBody.includes('\t');
  parsed.bodyHtml = markdownToHtml(rawBody);

  parsed.confidence = Math.min(100, parsed.confidence);
  return parsed;
};
