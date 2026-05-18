/**
 * Export utilities for DOCX and PDF formats
 */

/**
 * Export document as plain text (for now, enhanced DOCX export)
 */
export function exportAsDocx(content: string, title: string): void {
  try {
    // Create a simple DOCX-compatible format
    // In production, use a library like 'docx' or 'docxtemplater'
    const docContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
      </w:pPr>
      <w:r>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    ${content
      .split("\n")
      .map(
        (line) => `
    <w:p>
      <w:r>
        <w:t>${escapeXml(line)}</w:t>
      </w:r>
    </w:p>`
      )
      .join("")}
  </w:body>
</w:document>`;

    const blob = new Blob([docContent], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    downloadFile(blob, `${title}.docx`);
  } catch (error) {
    console.error("Error exporting DOCX:", error);
    throw error;
  }
}

/**
 * Export document as PDF
 */
export function exportAsPdf(content: string, title: string): void {
  try {
    // Create a simple PDF using canvas and blob
    // In production, use a library like 'pdfkit', 'jspdf', or 'html2pdf'
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
50 750 Td
(${title}) Tj
0 -20 Td
(${content.substring(0, 100)}...) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000464 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
543
%%EOF`;

    const blob = new Blob([pdfContent], { type: "application/pdf" });
    downloadFile(blob, `${title}.pdf`);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    throw error;
  }
}

/**
 * Export document as plain text
 */
export function exportAsText(content: string, title: string): void {
  try {
    const textContent = `${title}\n${"=".repeat(title.length)}\n\n${content}`;
    const blob = new Blob([textContent], { type: "text/plain" });
    downloadFile(blob, `${title}.txt`);
  } catch (error) {
    console.error("Error exporting text:", error);
    throw error;
  }
}

/**
 * Export document as HTML
 */
export function exportAsHtml(content: string, title: string): void {
  try {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: Calibri, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    p {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div>${content.split("\n").map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    downloadFile(blob, `${title}.html`);
  } catch (error) {
    console.error("Error exporting HTML:", error);
    throw error;
  }
}

/**
 * Download file helper
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
