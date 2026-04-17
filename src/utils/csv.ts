/**
 * Simple robust CSV/TSV Parser and Generator
 * Handles quoted fields, commas/tabs within quotes.
 * Auto-detects delimiter (comma or tab).
 */

/**
 * Auto-detect delimiter by checking the header line.
 * If tabs are found and produce more columns than commas, use tab.
 */
const detectDelimiter = (headerLine: string): string => {
  // Count potential columns with each delimiter
  const tabCount = headerLine.split('\t').length;
  const commaCount = headerLine.split(',').length;

  // If tabs produce more columns, it's TSV
  // Minimum threshold: at least 3 tab-separated columns to be considered TSV
  if (tabCount > commaCount && tabCount >= 3) {
    return '\t';
  }

  return ',';
};

export const parseCSV = (content: string): Record<string, string>[] => {
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // Auto-detect delimiter from header line
  const delimiter = detectDelimiter(lines[0]);

  const headers = parseCSVLine(lines[0], delimiter);
  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    result.push(row);
  }

  return result;
};

/**
 * Parse a single line handling quotes and the given delimiter.
 * Supports both comma-separated and tab-separated formats.
 */
const parseCSVLine = (line: string, delimiter: string = ','): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote ""
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Don't forget the last field
  result.push(current.trim());
  return result;
};

export const generateCSV = (data: Record<string, any>[], headers: string[]): string => {
  if (!data || data.length === 0) return '';

  const headerRow = headers.join(',');
  const rows = data.map(row => {
    return headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      const strVal = String(val);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(',');
  });

  return [headerRow, ...rows].join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Simple string hash for change detection
 */
export const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
};