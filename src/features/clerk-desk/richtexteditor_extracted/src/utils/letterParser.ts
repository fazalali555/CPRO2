import type { ParsedLetter } from '../types/letter';

/**
 * Strips HTML tags from a string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parses raw AI-generated or pasted letter text and extracts structured fields
 */
export function parseLetter(rawText: string): ParsedLetter {
  // Strip HTML if present
  const text = rawText.includes('<') ? stripHtml(rawText) : rawText;

  const result: ParsedLetter = {};

  // -------------------------------------------------------
  // REFERENCE NUMBER  (Ref:, No:, Ref No:, Letter No:, etc.)
  // -------------------------------------------------------
  const noPatterns = [
    /(?:ref(?:erence)?(?:\s*no)?\.?|letter\s*no\.?|no\.?)\s*[:\-]?\s*([A-Z0-9\-\/\.]+)/i,
  ];
  for (const p of noPatterns) {
    const m = text.match(p);
    if (m) { result.no = m[1].trim(); break; }
  }

  // -------------------------------------------------------
  // DATE
  // -------------------------------------------------------
  const datePatterns = [
    /(?:date[d]?|dated?)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(?:date[d]?|dated?)\s*[:\-]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /(?:date[d]?|dated?)\s*[:\-]?\s*(\w+\s+\d{1,2},?\s+\d{4})/i,
    // Plain date anywhere in first 500 chars
    /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
  ];
  for (const p of datePatterns) {
    const m = text.match(p);
    if (m) { result.date = m[1].trim(); break; }
  }

  // -------------------------------------------------------
  // SENDER (From:)
  // -------------------------------------------------------
  const fromPatterns = [
    /^from\s*[:\-]\s*(.+?)(?:\n|to\s*:|$)/im,
    /^(?:sender|from)\s*[:\-]\s*(.+)/im,
  ];
  for (const p of fromPatterns) {
    const m = text.match(p);
    if (m) { result.sender = m[1].trim(); break; }
  }

  // -------------------------------------------------------
  // RECEIVER  (To:, Addressee:, Attention:)
  // -------------------------------------------------------
  const toPatterns = [
    /^to\s*[:\-]\s*(.+?)(?:\n|subject\s*:|ref|$)/im,
    /^(?:receiver|addressee|attention)\s*[:\-]\s*(.+)/im,
    /^(?:The\s+(?:Director|Manager|CEO|Chairman|Secretary|Head|Minister|Commissioner|President)[\s\S]{0,100}?)(?:\n\n|\nSubject|\nDear)/im,
  ];
  for (const p of toPatterns) {
    const m = text.match(p);
    if (m) { result.receiver = m[1].trim(); break; }
  }

  // -------------------------------------------------------
  // SUBJECT (Subject:, Re:, Subj:)
  // -------------------------------------------------------
  const subjectPatterns = [
    /^(?:subject|re|subj)\s*[:\-]\s*(.+)/im,
  ];
  for (const p of subjectPatterns) {
    const m = text.match(p);
    if (m) { result.subject = m[1].trim(); break; }
  }

  // -------------------------------------------------------
  // CC / COPY TO
  // -------------------------------------------------------
  const ccPatterns = [
    /^(?:cc|c\.c\.|copy\s+to)\s*[:\-]\s*(.+)/im,
  ];
  for (const p of ccPatterns) {
    const m = text.match(p);
    if (m) { result.cc = m[1].trim(); break; }
  }

  // -------------------------------------------------------
  // FORWARDINGS (forward to / distribution)
  // -------------------------------------------------------
  const fwdPatterns = [
    /^(?:forward(?:ings)?|distribution|dist\.?)\s*[:\-]?\s*([\s\S]+?)(?:\n\n|signature|yours|sincerely|$)/im,
  ];
  for (const p of fwdPatterns) {
    const m = text.match(p);
    if (m) {
      const lines = m[1]
        .split('\n')
        .map(l => l.replace(/^[\d\.\-\*]\s*/, '').trim())
        .filter(l => l.length > 2);
      if (lines.length) result.forwardings = lines;
      break;
    }
  }

  // -------------------------------------------------------
  // SIGNATURE TITLE & NAME
  // -------------------------------------------------------
  const sigPatterns = [
    /(?:yours\s+(?:sincerely|faithfully|truly)|regards)[,\.]?\s*\n+(.+)\n+(.+)/i,
    /(?:signed|signature)\s*[:\-]\s*(.+)\n+(.+)/i,
    /\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\n\s*([A-Z][A-Z\s]+(?:DIRECTOR|MANAGER|SECRETARY|OFFICER|HEAD|COMMISSIONER|MINISTER|CEO|CHAIRMAN|PRESIDENT)[^\n]*)/,
  ];
  for (const p of sigPatterns) {
    const m = text.match(p);
    if (m) {
      result.signatoryName = m[1].trim();
      result.signatureTitle = m[2].trim();
      break;
    }
  }

  // -------------------------------------------------------
  // BODY  — everything between greeting and closing
  // -------------------------------------------------------
  const bodyMatch = text.match(
    /(?:dear\s+\w+[^,]*,?\s*\n)([\s\S]+?)(?:\n\s*(?:yours|sincerely|faithfully|regards|warm\s+regards|best\s+regards|thank\s+you)[,\.]?\s*\n|$)/i
  );
  if (bodyMatch) {
    result.body = bodyMatch[1].trim();
  } else {
    // Fallback: grab middle section of text
    const lines = text.split('\n').filter(l => l.trim());
    const start = Math.floor(lines.length * 0.2);
    const end = Math.floor(lines.length * 0.75);
    result.body = lines.slice(start, end).join('\n');
  }

  return result;
}
