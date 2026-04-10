// services/ExportService.ts - Export & Print Service

import { Letter, Document, ExportOptions } from '../types';
import { formatLetterToText } from '../utils/formatters';

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
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${letter.subject}</title>
  <style>
    @page {
      size: ${options.paperSize} ${options.orientation};
      margin: 2cm;
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2cm;
    }
    .letterhead {
      text-align: center;
      font-weight: bold;
      margin-bottom: 2em;
      font-size: 14pt;
      text-transform: uppercase;
    }
    .reference-line {
      display: flex;
      justify-content: space-between;
      margin: 1em 0;
    }
    .recipient {
      margin: 1.5em 0;
    }
    .subject {
      font-weight: bold;
      text-decoration: underline;
      margin: 1em 0;
    }
    .salutation {
      margin: 1em 0;
    }
    .body {
      margin: 1.5em 0;
      text-align: justify;
    }
    .signature {
      margin-top: 3em;
      text-align: right;
    }
    .signature-name {
      font-weight: bold;
    }
    .forwarded {
      margin-top: 2em;
      font-size: 10pt;
    }
    ${options.includeWatermark ? `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72pt;
      color: rgba(0, 0, 0, 0.1);
      z-index: -1;
      white-space: nowrap;
    }` : ''}
  </style>
</head>
<body>
  ${options.includeWatermark ? `<div class="watermark">${options.watermarkText || 'CONFIDENTIAL'}</div>` : ''}
  
  ${options.includeLetterhead ? `
  <div class="letterhead">
    ${letter.letterheadLines.split('\n').map(line => `<div>${line}</div>`).join('')}
    ${letter.fromOffice ? `<div style="font-size: 11pt; margin-top: 0.5em;">${letter.fromOffice}</div>` : ''}
  </div>` : ''}
  
  <div class="reference-line">
    <span>No. ${letter.reference || '____________'}</span>
    <span>Dated: ${letter.letterDate ? new Date(letter.letterDate).toLocaleDateString('en-GB') : '____/____/______'}</span>
  </div>
  
  <div class="recipient">
    <div>To,</div>
    ${letter.to.split('\n').map(line => `<div style="margin-left: 2em;">${line}</div>`).join('')}
  </div>
  
  <div class="subject">Subject: ${letter.subject.toUpperCase()}</div>
  
  <div class="salutation">Respected ${letter.salutation},</div>
  
  <div class="body">
    ${letter.body.split('\n').map(para => `<p>${para}</p>`).join('')}
  </div>
  
  <div class="signature">
    <div>Yours faithfully,</div>
    <br><br>
    <div class="signature-name">${letter.signatureName}</div>
    <div>${letter.signatureTitle}</div>
  </div>
  
  ${letter.forwardedTo.length > 0 ? `
  <div class="forwarded">
    <div><strong>Copy Forwarded To:</strong></div>
    <ol>
      ${letter.forwardedTo.map(item => `<li>${item}</li>`).join('')}
    </ol>
  </div>` : ''}
</body>
</html>`;
    
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