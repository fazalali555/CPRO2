// services/PrintService.ts - Professional Print & Export Service

import { 
  EnhancedLetter, 
  PrintSettings, 
  PrintPreviewData,
  PaperSize,
  EnhancedOfficeProfile,
  LetterheadConfig 
} from '../types/letter';
import { PAPER_SIZES } from '../constants/letter-constants';

class PrintServiceClass {
  private printFrame: HTMLIFrameElement | null = null;

  /**
   * Generate print preview HTML
   */
  generatePrintPreview(
    letter: EnhancedLetter,
    profile: EnhancedOfficeProfile,
    settings: PrintSettings
  ): PrintPreviewData {
    const css = this.generatePrintCSS(settings);
    const html = this.generatePrintHTML(letter, profile, settings);
    const pageCount = this.estimatePageCount(html, settings);

    return {
      html: this.wrapInDocument(html, css, settings),
      css,
      pageCount,
      estimatedPrintTime: pageCount * 5, // seconds
    };
  }

  /**
   * Generate CSS for printing
   */
  private generatePrintCSS(settings: PrintSettings): string {
    const paper = PAPER_SIZES[settings.paperSize];
    const { margins } = settings;

    return `
      @page {
        size: ${settings.paperSize} ${settings.orientation};
        margin: ${margins.top}${margins.unit} ${margins.right}${margins.unit} ${margins.bottom}${margins.unit} ${margins.left}${margins.unit};
      }

      @media print {
        html, body {
          width: ${paper.width}${paper.unit};
          height: ${paper.height}${paper.unit};
          margin: 0;
          padding: 0;
        }
        
        .no-print { display: none !important; }
        .page-break { page-break-before: always; }
        .avoid-break { page-break-inside: avoid; }
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
        background: #fff;
      }

      .letter-page {
        width: 100%;
        min-height: 100vh;
        padding: 0;
        position: relative;
      }

      /* Letterhead Styles */
      .letterhead {
        text-align: center;
        padding-bottom: 15px;
        margin-bottom: 20px;
        border-bottom: 2px solid #000;
      }

      .letterhead.double-border {
        border-bottom: 4px double #000;
      }

      .letterhead.ornate {
        border-bottom: none;
        background-image: url('data:image/svg+xml,...');
      }

      .letterhead-logo {
        max-height: 60px;
        margin-bottom: 10px;
      }

      .letterhead-logo.small { max-height: 40px; }
      .letterhead-logo.large { max-height: 80px; }

      .letterhead-line {
        margin: 3px 0;
      }

      .letterhead-line-1 {
        font-size: 16pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
      }

      .letterhead-line-2 {
        font-size: 14pt;
        font-weight: bold;
      }

      .letterhead-line-3 {
        font-size: 11pt;
      }

      .letterhead-contact {
        font-size: 10pt;
        color: #333;
        margin-top: 5px;
      }

      /* Reference Section */
      .reference-section {
        display: flex;
        justify-content: space-between;
        margin: 20px 0;
        font-size: 11pt;
      }

      .reference-left {
        text-align: left;
      }

      .reference-right {
        text-align: right;
      }

      /* Urgency & Confidentiality Labels */
      .urgency-label {
        display: inline-block;
        padding: 3px 10px;
        font-weight: bold;
        text-transform: uppercase;
        border: 2px solid #c00;
        color: #c00;
        font-size: 10pt;
        margin-bottom: 10px;
      }

      .confidential-label {
        display: inline-block;
        padding: 3px 10px;
        font-weight: bold;
        text-transform: uppercase;
        background: #c00;
        color: #fff;
        font-size: 10pt;
        margin-bottom: 10px;
      }

      /* Recipient Section */
      .recipient-section {
        margin: 20px 0;
      }

      .recipient-section .to-label {
        font-weight: bold;
      }

      .recipient-details {
        margin-left: 40px;
        line-height: 1.4;
      }

      /* Through Channel */
      .through-channel {
        margin: 10px 0 10px 40px;
        font-style: italic;
      }

      /* Subject */
      .subject-section {
        margin: 25px 0 20px 0;
      }

      .subject-label {
        font-weight: bold;
        text-decoration: underline;
      }

      .subject-text {
        font-weight: bold;
        text-transform: uppercase;
      }

      .subject-underline {
        border-bottom: 1px solid #000;
        display: inline-block;
        width: 100%;
        margin-top: 2px;
      }

      /* Salutation */
      .salutation {
        margin: 20px 0;
      }

      /* Body Content */
      .letter-body {
        margin: 20px 0;
        text-align: justify;
        line-height: 1.6;
      }

      .letter-body p {
        margin-bottom: 12px;
        text-indent: 40px;
      }

      .letter-body p:first-child {
        text-indent: 0;
      }

      .letter-body ul, .letter-body ol {
        margin: 10px 0 10px 40px;
      }

      .letter-body li {
        margin-bottom: 5px;
      }

      /* Numbered Paragraphs */
      .numbered-para {
        display: flex;
        gap: 10px;
        margin-bottom: 12px;
      }

      .para-number {
        min-width: 30px;
        font-weight: bold;
      }

      /* Enclosures */
      .enclosures-section {
        margin: 25px 0;
        font-size: 11pt;
      }

      .enclosures-label {
        font-weight: bold;
        text-decoration: underline;
      }

      .enclosure-list {
        margin-left: 40px;
        list-style-type: decimal;
      }

      /* Closing */
      .closing-section {
        margin-top: 40px;
        text-align: right;
        padding-right: 50px;
      }

      .closing-text {
        margin-bottom: 50px;
      }

      .signature-block {
        text-align: right;
      }

      .signature-image {
        max-height: 50px;
        margin-bottom: 5px;
      }

      .signatory-name {
        font-weight: bold;
      }

      .signatory-designation {
        font-size: 11pt;
      }

      .stamp-image {
        position: absolute;
        right: 100px;
        opacity: 0.8;
        max-height: 80px;
      }

      /* Copy Forwarded Section */
      .forwarding-section {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ccc;
        font-size: 11pt;
      }

      .forwarding-label {
        font-weight: bold;
        margin-bottom: 10px;
      }

      .forwarding-list {
        margin-left: 20px;
      }

      .forwarding-item {
        margin-bottom: 8px;
      }

      .forwarding-number {
        font-weight: bold;
        margin-right: 10px;
      }

      /* Page Footer */
      .page-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 9pt;
        color: #666;
        padding: 10px;
        border-top: 1px solid #eee;
      }

      .page-number {
        font-size: 10pt;
      }

      /* Watermark */
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 80pt;
        color: rgba(0, 0, 0, 0.05);
        white-space: nowrap;
        z-index: -1;
        pointer-events: none;
        text-transform: uppercase;
        font-weight: bold;
      }

      /* QR Code */
      .qr-code {
        position: absolute;
        width: 80px;
        height: 80px;
      }

      .qr-code.top-right { top: 20px; right: 20px; }
      .qr-code.bottom-right { bottom: 80px; right: 20px; }
      .qr-code.bottom-left { bottom: 80px; left: 20px; }

      /* Urdu Support */
      .urdu {
        font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;
        direction: rtl;
        text-align: right;
      }

      /* Bilingual Layout */
      .bilingual {
        display: flex;
        gap: 40px;
      }

      .bilingual .english {
        flex: 1;
        text-align: left;
        direction: ltr;
      }

      .bilingual .urdu {
        flex: 1;
        text-align: right;
        direction: rtl;
      }
    `;
  }

  /**
   * Generate HTML content for letter
   */
  private generatePrintHTML(
    letter: EnhancedLetter,
    profile: EnhancedOfficeProfile,
    settings: PrintSettings
  ): string {
    const letterhead = this.generateLetterhead(profile, settings);
    const reference = this.generateReferenceSection(letter);
    const recipient = this.generateRecipientSection(letter);
    const subject = this.generateSubjectSection(letter);
    const body = this.generateBodySection(letter);
    const enclosures = this.generateEnclosuresSection(letter);
    const signature = this.generateSignatureSection(letter, profile);
    const forwarding = this.generateForwardingSection(letter);
    const watermark = settings.includeWatermark ? this.generateWatermark(settings) : '';
    const qrCode = settings.includeQRCode ? this.generateQRCode(letter, settings) : '';

    return `
      <div class="letter-page">
        ${watermark}
        ${qrCode}
        
        ${settings.includeLetterhead ? letterhead : ''}
        
        ${this.generateUrgencyLabels(letter)}
        
        ${reference}
        
        ${recipient}
        
        ${subject}
        
        <div class="salutation">
          ${letter.salutation},
        </div>
        
        ${body}
        
        ${enclosures}
        
        ${signature}
        
        ${forwarding}
      </div>
    `;
  }

  /**
   * Generate letterhead HTML
   */
  private generateLetterhead(profile: EnhancedOfficeProfile, settings: PrintSettings): string {
    const lh = profile.letterhead;
    const dividerClass = lh.dividerStyle === 'double' ? 'double-border' : lh.dividerStyle === 'ornate' ? 'ornate' : '';
    
    let logoHtml = '';
    if (lh.showLogo && profile.logoId) {
      logoHtml = `<img src="${profile.logoId}" alt="Logo" class="letterhead-logo ${lh.logoSize}" />`;
    }

    const contactInfo = [];
    if (lh.showContact) {
      if (profile.phone) contactInfo.push(`Ph: ${profile.phone}`);
      if (profile.email) contactInfo.push(`Email: ${profile.email}`);
      if (profile.website) contactInfo.push(profile.website);
    }

    return `
      <div class="letterhead ${dividerClass}" style="padding: ${lh.padding}px;">
        ${logoHtml}
        
        <div class="letterhead-line letterhead-line-1" style="font-size: ${lh.line1Style.fontSize}pt; ${lh.line1Style.color ? `color: ${lh.line1Style.color};` : ''}">
          ${lh.line1}
        </div>
        
        ${lh.line2 ? `
          <div class="letterhead-line letterhead-line-2" style="font-size: ${lh.line2Style?.fontSize || 14}pt;">
            ${lh.line2}
          </div>
        ` : ''}
        
        ${lh.line3 ? `
          <div class="letterhead-line letterhead-line-3">
            ${lh.line3}
          </div>
        ` : ''}
        
        ${lh.showAddress ? `
          <div class="letterhead-address">
            ${profile.address}, ${profile.city}, ${profile.district}
          </div>
        ` : ''}
        
        ${contactInfo.length > 0 ? `
          <div class="letterhead-contact">
            ${contactInfo.join(' | ')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate reference section
   */
  private generateReferenceSection(letter: EnhancedLetter): string {
    const dateStr = letter.letterDate 
      ? new Date(letter.letterDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
      : '____________________';

    return `
      <div class="reference-section">
        <div class="reference-left">
          <div><strong>No.</strong> ${letter.referenceNumber || '____________'}</div>
          ${letter.previousReference ? `<div><strong>Ref:</strong> ${letter.previousReference}</div>` : ''}
        </div>
        <div class="reference-right">
          <div><strong>Dated:</strong> ${dateStr}</div>
          ${letter.islamicDate ? `<div>${letter.islamicDate}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generate urgency and confidentiality labels
   */
  private generateUrgencyLabels(letter: EnhancedLetter): string {
    let html = '<div class="labels-section">';
    
    if (letter.urgency && letter.urgency !== 'routine') {
      const urgencyText = {
        priority: 'PRIORITY',
        immediate: 'IMMEDIATE',
        most_immediate: 'MOST IMMEDIATE',
        flash: '⚡ FLASH ⚡',
      }[letter.urgency] || '';
      
      html += `<span class="urgency-label">${urgencyText}</span> `;
    }
    
    if (letter.confidentiality && letter.confidentiality !== 'unclassified') {
      const confText = {
        restricted: 'RESTRICTED',
        confidential: 'CONFIDENTIAL',
        secret: 'SECRET',
        top_secret: 'TOP SECRET',
      }[letter.confidentiality] || '';
      
      html += `<span class="confidential-label">${confText}</span>`;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * Generate recipient section
   */
  private generateRecipientSection(letter: EnhancedLetter): string {
    const r = letter.recipient;
    
    let throughHtml = '';
    if (letter.throughChannel && letter.throughChannel.length > 0) {
      throughHtml = `
        <div class="through-channel">
          Through: ${letter.throughChannel.map(tc => `${tc.name}, ${tc.designation}, ${tc.organization}`).join('<br>         ')}
        </div>
      `;
    }

    return `
      <div class="recipient-section">
        <div class="to-label">To,</div>
        <div class="recipient-details">
          ${r.name}${r.designation ? `,<br>${r.designation}` : ''}
          ${r.organization ? `<br>${r.organization}` : ''}
          ${r.department ? `<br>${r.department}` : ''}
          ${r.address ? `<br>${r.address}` : ''}
          ${r.city ? `<br>${r.city}${r.district ? `, ${r.district}` : ''}` : ''}
        </div>
        ${throughHtml}
      </div>
    `;
  }

  /**
   * Generate subject section
   */
  private generateSubjectSection(letter: EnhancedLetter): string {
    return `
      <div class="subject-section">
        <span class="subject-label">Subject:</span>
        <span class="subject-text">${letter.subject.toUpperCase()}</span>
        <div class="subject-underline"></div>
      </div>
    `;
  }

  /**
   * Generate body section
   */
  private generateBodySection(letter: EnhancedLetter): string {
    // If formatted content exists, use it
    if (letter.bodyFormatted && letter.bodyFormatted.html) {
      return `<div class="letter-body">${letter.bodyFormatted.html}</div>`;
    }
    
    // Otherwise, format plain text
    const paragraphs = letter.body.split('\n\n').filter(p => p.trim());
    const formattedParagraphs = paragraphs.map(p => {
      // Check for numbered list
      if (/^\d+[\.\)]\s/.test(p.trim())) {
        return `<div class="numbered-para"><span class="para-number">${p.match(/^\d+[\.\)]/)?.[0]}</span><span>${p.replace(/^\d+[\.\)]\s*/, '')}</span></div>`;
      }
      return `<p>${p}</p>`;
    });

    return `<div class="letter-body">${formattedParagraphs.join('\n')}</div>`;
  }

  /**
   * Generate enclosures section
   */
  private generateEnclosuresSection(letter: EnhancedLetter): string {
    if (!letter.enclosures || letter.enclosures.length === 0) {
      return '';
    }

    const items = letter.enclosures.map((enc, i) => `
      <li class="enclosure-item">
        ${enc.title}${enc.pageCount ? ` (${enc.pageCount} page${enc.pageCount > 1 ? 's' : ''})` : ''}${enc.isCopy ? ' - Copy' : ''}
      </li>
    `).join('');

    return `
      <div class="enclosures-section avoid-break">
        <div class="enclosures-label">Enclosure(s):</div>
        <ol class="enclosure-list">
          ${items}
        </ol>
      </div>
    `;
  }

  /**
   * Generate signature section
   */
  private generateSignatureSection(letter: EnhancedLetter, profile: EnhancedOfficeProfile): string {
    const sig = letter.signatory || profile.defaultSignatory;
    
    let signatureImage = '';
    if (sig.signatureImageId) {
      signatureImage = `<img src="${sig.signatureImageId}" alt="Signature" class="signature-image" />`;
    }

    let stampImage = '';
    if (sig.stampImageId) {
      stampImage = `<img src="${sig.stampImageId}" alt="Stamp" class="stamp-image" />`;
    }

    return `
      <div class="closing-section avoid-break">
        <div class="closing-text">Yours faithfully,</div>
        <div class="signature-block">
          ${signatureImage}
          ${stampImage}
          <div class="signatory-name">${sig.name}</div>
          <div class="signatory-designation">${sig.designation}</div>
          ${sig.organization ? `<div class="signatory-org">${sig.organization}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Generate forwarding section
   */
  private generateForwardingSection(letter: EnhancedLetter): string {
    if (!letter.forwardedTo || letter.forwardedTo.length === 0) {
      return '';
    }

    const items = letter.forwardedTo.map((fw, i) => `
      <div class="forwarding-item">
        <span class="forwarding-number">${i + 1}.</span>
        ${fw.to}
        ${fw.purpose ? ` - ${fw.purpose}` : ''}
        ${fw.action ? ` (${fw.action.replace('_', ' ')})` : ''}
        ${fw.deadline ? ` - By: ${new Date(fw.deadline).toLocaleDateString('en-GB')}` : ''}
      </div>
    `).join('');

    return `
      <div class="forwarding-section avoid-break">
        <div class="forwarding-label">Copy forwarded to:</div>
        <div class="forwarding-list">
          ${items}
        </div>
      </div>
    `;
  }

  /**
   * Generate watermark
   */
  private generateWatermark(settings: PrintSettings): string {
    const text = settings.watermarkText || 'DRAFT';
    const opacity = settings.watermarkOpacity || 0.1;
    
    return `<div class="watermark" style="opacity: ${opacity};">${text}</div>`;
  }

  /**
   * Generate QR code placeholder
   */
  private generateQRCode(letter: EnhancedLetter, settings: PrintSettings): string {
    // In production, generate actual QR code using a library
    const qrData = JSON.stringify({
      ref: letter.referenceNumber,
      date: letter.letterDate,
      subject: letter.subject.substring(0, 50),
    });
    
    return `
      <div class="qr-code ${settings.qrCodePosition}">
        <img src="data:image/svg+xml,..." alt="QR Code" />
        <div style="font-size: 6pt; text-align: center;">Scan to verify</div>
      </div>
    `;
  }

  /**
   * Wrap content in full HTML document
   */
  private wrapInDocument(html: string, css: string, settings: PrintSettings): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Letter Print</title>
  <style>${css}</style>
</head>
<body>
  ${html}
  ${settings.includePageNumbers ? `
    <div class="page-footer">
      <span class="page-number">Page <span class="pageNumber"></span></span>
    </div>
  ` : ''}
</body>
</html>
    `;
  }

  /**
   * Estimate page count
   */
  private estimatePageCount(html: string, settings: PrintSettings): number {
    // Rough estimation based on content length
    const textLength = html.replace(/<[^>]*>/g, '').length;
    const charsPerPage = settings.paperSize === 'A4' ? 3000 : 3500;
    return Math.max(1, Math.ceil(textLength / charsPerPage));
  }

  /**
   * Print letter
   */
  print(
    letter: EnhancedLetter,
    profile: EnhancedOfficeProfile,
    settings: PrintSettings
  ): void {
    const preview = this.generatePrintPreview(letter, profile, settings);
    
    // Create print iframe
    if (this.printFrame) {
      document.body.removeChild(this.printFrame);
    }
    
    this.printFrame = document.createElement('iframe');
    this.printFrame.style.display = 'none';
    document.body.appendChild(this.printFrame);
    
    const frameDoc = this.printFrame.contentDocument || this.printFrame.contentWindow?.document;
    if (!frameDoc) return;
    
    frameDoc.open();
    frameDoc.write(preview.html);
    frameDoc.close();
    
    // Wait for content to load, then print
    this.printFrame.onload = () => {
      setTimeout(() => {
        this.printFrame?.contentWindow?.print();
      }, 250);
    };
  }

  /**
   * Open print preview in new window
   */
  openPreview(
    letter: EnhancedLetter,
    profile: EnhancedOfficeProfile,
    settings: PrintSettings
  ): Window | null {
    const preview = this.generatePrintPreview(letter, profile, settings);
    
    const previewWindow = window.open('', '_blank', 'width=800,height=1000');
    if (previewWindow) {
      previewWindow.document.write(preview.html);
      previewWindow.document.close();
    }
    
    return previewWindow;
  }

  /**
   * Export to PDF (using browser print)
   */
  async exportToPDF(
    letter: EnhancedLetter,
    profile: EnhancedOfficeProfile,
    settings: PrintSettings
  ): Promise<Blob> {
    const preview = this.generatePrintPreview(letter, profile, settings);
    return new Blob([preview.html], { type: 'text/html' });
  }
}

export const PrintService = new PrintServiceClass();
