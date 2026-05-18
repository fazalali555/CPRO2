// services/ExportService.ts - Export & Print Service

import { Letter, Document, ExportOptions } from '../types';
import { formatLetterToText } from '../utils/formatters';
import { getDepartmentLogoPath, detectDepartment } from '@/utils';

class ExportServiceClass {
  /**
   * Export letter to various formats
   */
  async exportLetter(letter: Letter, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'txt':
        return this.exportToText(letter);
      case 'html':
        return this.exportToHTML(letter, options);
      case 'pdf':
        return this.exportToPDF(letter, options);
      case 'docx':
        return this.exportToDocx(letter, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Export to plain text
   */
  private exportToText(letter: Letter): Blob {
    const text = formatLetterToText(letter);
    return new Blob([text], { type: 'text/plain;charset=utf-8' });
  }

  /**
   * Export to HTML
   */
  private exportToHTML(letter: Letter, options: ExportOptions): Blob {
    const year = letter.letterDate ? new Date(letter.letterDate).getFullYear() : new Date().getFullYear();
    const lhLines = (letter.letterheadLines || '').split('\n').filter(Boolean);
    const lhTitle = lhLines[0] || 'OFFICE';
    const lhDept = lhLines[1] || '';
    const lhGovt = lhLines[2] || 'Govt. of Khyber Pakhtunkhwa.';

    // Dynamic Logo
    const deptType = detectDepartment(letter.letterheadLines || letter.fromOffice || 'education');
    const logoSrc = getDepartmentLogoPath(deptType, true);

    // Determine opening statement
    const sigTitle = letter.signatureTitle || '';
    const isHigherOffice = sigTitle.toLowerCase().includes('director') || sigTitle.toLowerCase().includes('deo');
    const openingStatement = isHigherOffice 
      ? "I am directed to refer to the subject noted above and to state that"
      : "I have the honor to refer to the subject cited above and to state that";

    // Process body: handle existing HTML or plain text
    let bodyHtml = letter.body;
    if (!bodyHtml.includes('<p>')) {
      bodyHtml = bodyHtml.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('');
    }

    // Inject opening statement and numbering (simplified for HTML export)
    const processedBody = bodyHtml.replace(/<p>/i, `<p style="text-indent: 4em;">${openingStatement} `);

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${letter.subject}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', serif; color: #000; background: #fff; }
  .page { width: 210mm; min-height: 287mm; padding: 12mm 18mm 12mm 20mm; margin: 0 auto; display: flex; flex-direction: column; }
  .lh { text-align: center; margin-bottom: 4px; }
  .lh-title { font-size: 15pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; line-height: 1.25; }
  .lh-sub { font-size: 11pt; font-weight: 700; margin-top: 3px; }
  .divider { border-top: 4px double #000; margin: 4px 0 18px 0; }
  .ref-row { display: flex; justify-content: space-between; align-items: flex-end; font-size: 10.5pt; font-weight: 700; margin-bottom: 18px; }
  .ref-blank { border-bottom: 1px solid #000; min-width: 145px; display: inline-block; text-align: center; }
  .date-blank { border-bottom: 1px solid #000; min-width: 38px; display: inline-block; }
  .recip { margin-bottom: 18px; font-size: 11pt; }
  .recip-to { font-weight: 700; margin-bottom: 3px; }
  .recip-lines { padding-left: 40px; font-weight: 700; line-height: 1.35; }
  .subj-row { display: flex; margin-bottom: 18px; font-size: 11pt; }
  .subj-label { font-weight: 700; margin-right: 12px; flex-shrink: 0; }
  .subj-text { font-weight: 700; text-transform: uppercase; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; line-height: 1.4; }
  .salut { font-weight: 700; font-size: 11pt; margin-bottom: 10px; }
  .body { text-align: justify; font-size: 10.5pt; line-height: 1.6; }
  .body p { margin-bottom: 8px; }
  .closing { font-size: 10.5pt; margin-top: 8px; text-align: justify; }
  .sig-wrap { margin-top: auto; display: flex; justify-content: flex-end; padding-top: 14px; page-break-inside: avoid; }
  .sig-box { width: 235px; text-align: center; font-size: 10.5pt; }
  .sig-gap { height: 18mm; }
  .sig-line { border-top: 1px solid #000; width: 210px; margin: 0 auto 4px auto; }
  .sig-title { font-weight: 700; text-transform: uppercase; font-size: 10pt; line-height: 1.35; white-space: pre-line; }
  .fwd { margin-top: 24px; padding-top: 12px; border-top: 1px solid #999; font-size: 10.5pt; }
  .fwd-label { font-weight: 700; margin-bottom: 6px; }
  .fwd-item { margin-left: 20px; margin-bottom: 4px; }
  ${options.includeWatermark ? `.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-45deg); font-size: 80pt; color: rgba(0,0,0,0.05); z-index: -1; white-space: nowrap; text-transform: uppercase; font-weight: 700; }` : ''}
  @media print { body { margin: 0; } }
</style></head><body>
${options.includeWatermark ? `<div class="watermark">${options.watermarkText || 'DRAFT'}</div>` : ''}
<div class="page">
  ${options.includeLetterhead ? `
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; width: 100%;">
    <div style="width: 70px; flex-shrink: 0; padding-top: 4px;">
      <img src="${logoSrc}" style="width: 60px; height: 60px; object-fit: contain;" alt="Logo" onerror="this.src='${window.location.origin}/assets/KP_logo.png'" />
    </div>
    <div class="lh" style="flex-grow: 1; text-align: center; padding: 8px 4px 0 4px;">
      <div class="lh-title">${lhTitle}</div>
      ${lhDept ? `<div class="lh-sub">${lhDept}</div>` : ''}
      <div class="lh-sub">${lhGovt}</div>
      ${letter.fromOffice ? `<div class="lh-sub" style="font-size:10pt;margin-top:4px;">${letter.fromOffice}</div>` : ''}
    </div>
    <div style="width: auto; min-width: 120px; padding-top: 8px; font-family: serif; font-size: 9.5pt; text-align: right;">
      <!-- Contact block placeholder for symmetry -->
    </div>
  </div><div class="divider"></div>` : ''}
  <div class="ref-row">
    <div>No. <span class="ref-blank">${letter.reference || ''}</span> /</div>
    <div>Dated: <span class="date-blank"></span> / <span class="date-blank"></span> /${year}</div>
  </div>
  <div class="recip">
    <div class="recip-to">To</div>
    <div class="recip-lines">${letter.to.split('\n').map(l => l.trim()).filter(Boolean).join('<br>')}</div>
  </div>
  <div class="subj-row">
    <span class="subj-label">Subject:</span>
    <span class="subj-text">${letter.subject.toUpperCase()}</span>
  </div>
  <div class="salut">Respected ${letter.salutation},</div>
  <div class="body">${processedBody}</div>
  <p class="closing">It is requested that necessary action may kindly be taken.</p>
  <div class="sig-wrap"><div class="sig-box">
    <div class="sig-gap"></div>
    <div class="sig-line"></div>
    <div class="sig-title">${letter.signatureName || 'Clerk'}\n${letter.signatureTitle || 'Education Office'}</div>
  </div></div>
  ${letter.forwardedTo.length > 0 ? `<div class="fwd"><div class="fwd-label">Copy Forwarded To:</div>${letter.forwardedTo.map((f, i) => `<div class="fwd-item">${i + 1}. ${f}</div>`).join('')}</div>` : ''}
</div></body></html>`;

    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  /**
   * Export to PDF using browser print
   */
  private async exportToPDF(letter: Letter, options: ExportOptions): Promise<Blob> {
    // Create HTML content
    const htmlBlob = this.exportToHTML(letter, options);
    const htmlContent = await htmlBlob.text();
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups.');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Add print trigger
    printWindow.onload = () => {
      printWindow.print();
    };
    
    // Return HTML blob as fallback
    return htmlBlob;
  }

  /**
   * Export to DOCX (simplified - returns HTML for now)
   */
  private async exportToDocx(letter: Letter, options: ExportOptions): Promise<Blob> {
    // For full DOCX support, you'd need a library like docx.js
    // This is a simplified version that returns HTML
    console.warn('DOCX export requires additional library. Falling back to HTML.');
    return this.exportToHTML(letter, options);
  }

  /**
   * Batch export multiple letters
   */
  async exportMultipleLetters(letters: Letter[], options: ExportOptions): Promise<void> {
    // For each letter, generate file and trigger download
    for (const letter of letters) {
      const blob = await this.exportLetter(letter, options);
      this.downloadBlob(blob, `${this.sanitizeFilename(letter.subject)}.${options.format}`);
      // Small delay to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Export data as JSON backup
   */
  exportAsBackup(data: Record<string, any>): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const timestamp = new Date().toISOString().slice(0, 10);
    this.downloadBlob(blob, `clerk-desk-backup-${timestamp}.json`);
  }

  /**
   * Download blob as file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[^a-z0-9\s\-_]/gi, '')
      .replace(/\s+/g, '_')
      .slice(0, 100);
  }

  /**
   * Print letter directly
   */
  printLetter(letter: Letter, options: Partial<ExportOptions> = {}): void {
    const fullOptions: ExportOptions = {
      format: 'html',
      includeLetterhead: true,
      includeWatermark: false,
      paperSize: 'A4',
      orientation: 'portrait',
      ...options,
    };
    
    this.exportToPDF(letter, fullOptions);
  }
}

export const ExportService = new ExportServiceClass();