// SettingsImportExport.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EmployeeRecord } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, Badge } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { CSV_HEADERS, flattenEmployee, unflattenEmployee } from '../utils/employeeAdapter';
import { parseCSV, generateCSV, downloadCSV, simpleHash } from '../utils/csv';
import { useToast } from '../contexts/ToastContext';
import { autoCalculateRetirementDates } from '../utils';
import { useEmployeeContext } from '../contexts/EmployeeContext';
import * as XLSX from 'xlsx';

// ============================================
// TYPES
// ============================================

type ImportStatus = 'CREATE' | 'UPDATE' | 'CONFLICT' | 'SKIP_DUPLICATE' | 'INVALID';

interface AnalyzedRow {
  rowData: Record<string, any>;
  rowNum: number;
  status: ImportStatus;
  message: string;
  match?: EmployeeRecord;
  warnings?: string[];
}

interface ExportMeta {
  timestamp: number;
  count: number;
  hash: string;
  version: string;
}

interface ImportStats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

interface HeaderMapping {
  expected: string;
  found: string | null;
  matched: boolean;
}

interface ParseResult {
  rows: Record<string, any>[];
  headerMappings: HeaderMapping[];
}

// ============================================
// CONSTANTS
// ============================================

const CURRENT_VERSION = '2.0';
const STORAGE_KEYS = {
  EXPORT_CSV: 'kpk_rpms_last_export_csv',
  EXPORT_META: 'kpk_rpms_last_export_meta',
};

const STATUS_CONFIG: Record<ImportStatus, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string;
  icon: string;
}> = {
  CREATE: { 
    label: 'New', 
    color: 'text-green-700', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200',
    icon: 'add_circle'
  },
  UPDATE: { 
    label: 'Update', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-200',
    icon: 'edit'
  },
  CONFLICT: { 
    label: 'Conflict', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200',
    icon: 'error'
  },
  SKIP_DUPLICATE: { 
    label: 'Duplicate', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-50', 
    borderColor: 'border-orange-200',
    icon: 'content_copy'
  },
  INVALID: { 
    label: 'Invalid', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100', 
    borderColor: 'border-gray-200',
    icon: 'cancel'
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Normalize CNIC: Remove non-alphanumeric, uppercase, pad to 13 digits
 */
const normalizeCnic = (val: any): string => {
  if (val === null || val === undefined || val === '') return '';
  
  // Convert to string and clean
  let cleaned = String(val).replace(/[^0-9xX]/g, '').toUpperCase();
  
  // If it looks like a number that lost leading zeros, pad it
  if (/^\d+$/.test(cleaned) && cleaned.length > 0 && cleaned.length < 13) {
    cleaned = cleaned.padStart(13, '0');
  }
  
  return cleaned;
};

/**
 * Normalize Personal Number: Remove non-numeric, trim leading zeros for comparison
 */
const normalizePersonalNo = (val: any): string => {
  if (val === null || val === undefined || val === '') return '';
  
  const cleaned = String(val).replace(/[^0-9]/g, '');
  
  // Remove leading zeros for consistent comparison
  if (cleaned) {
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? '' : String(parsed);
  }
  
  return '';
};

/**
 * Normalize a header string for case-insensitive matching
 */
const normalizeHeaderKey = (header: string): string => {
  return header.trim().toLowerCase().replace(/[_\s-]+/g, '');
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format date for display
 */
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Convert Excel date serial number to ISO date string
 */
const excelDateToISO = (value: any): string => {
  if (!value) return '';
  
  // Already a string date
  if (typeof value === 'string') {
    // Check if it looks like a date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    return value;
  }
  
  // JavaScript Date object
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  
  // Excel serial number
  if (typeof value === 'number' && value > 0) {
    try {
      // XLSX.SSF.parse_date_code handles Excel date serial numbers
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        const year = parsed.y;
        const month = String(parsed.m).padStart(2, '0');
        const day = String(parsed.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.warn('Failed to parse Excel date:', value, e);
    }
  }
  
  return String(value);
};

// ============================================
// MAIN COMPONENT
// ============================================

export const SettingsImportExport: React.FC = () => {
  const { employees, setEmployees: onImport } = useEmployeeContext();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Export State
  const [exportMeta, setExportMeta] = useState<ExportMeta | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Import State
  const [analyzedRows, setAnalyzedRows] = useState<AnalyzedRow[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [headerMappings, setHeaderMappings] = useState<HeaderMapping[]>([]);
  const [showHeaderDetails, setShowHeaderDetails] = useState(false);

  // Drag and Drop State
  const [isDragOver, setIsDragOver] = useState(false);

  // Filter State for Preview
  const [previewFilter, setPreviewFilter] = useState<ImportStatus | 'ALL'>('ALL');
  const [previewSearchTerm, setPreviewSearchTerm] = useState('');

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    try {
      const metaStr = localStorage.getItem(STORAGE_KEYS.EXPORT_META);
      if (metaStr) {
        const meta = JSON.parse(metaStr) as ExportMeta;
        setExportMeta(meta);
      }
    } catch (e) {
      console.error('Failed to load export metadata:', e);
    }
  }, []);

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================

  const generateExportContent = useCallback(() => {
    const flatData = employees.map(flattenEmployee);
    return generateCSV(flatData, CSV_HEADERS);
  }, [employees]);

  const handleDownloadCSV = async () => {
    setIsExporting(true);
    try {
      const csvContent = generateExportContent();
      const filename = `employees-export-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCSV(csvContent, filename);
      showToast(`Exported ${employees.length} records to CSV`, 'success');
    } catch (e) {
      console.error('CSV Export Error:', e);
      showToast('Export failed: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadXLSX = async () => {
    setIsExporting(true);
    try {
      const flatData = employees.map(flattenEmployee);
      
      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(flatData, { header: CSV_HEADERS });
      
      // Set column widths
      const colWidths = CSV_HEADERS.map(header => ({
        wch: Math.max(header.length + 2, 12)
      }));
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      
      // Add metadata sheet
      const metaData = [
        { Property: 'Export Date', Value: new Date().toISOString() },
        { Property: 'Record Count', Value: String(employees.length) },
        { Property: 'Version', Value: CURRENT_VERSION },
        { Property: 'Application', Value: 'KPK RPMS' },
      ];
      const metaWs = XLSX.utils.json_to_sheet(metaData);
      XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');
      
      const filename = `employees-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      showToast(`Exported ${employees.length} records to XLSX`, 'success');
    } catch (e) {
      console.error('XLSX Export Error:', e);
      showToast('XLSX export failed: ' + (e instanceof Error ? e.message : 'Unknown error'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefreshCache = () => {
    try {
      const csvContent = generateExportContent();
      const hash = simpleHash(csvContent);
      const meta: ExportMeta = {
        timestamp: Date.now(),
        count: employees.length,
        hash,
        version: CURRENT_VERSION,
      };

      localStorage.setItem(STORAGE_KEYS.EXPORT_CSV, csvContent);
      localStorage.setItem(STORAGE_KEYS.EXPORT_META, JSON.stringify(meta));

      setExportMeta(meta);
      showToast('Export cache updated successfully', 'success');
    } catch (e) {
      console.error('Cache Update Error:', e);
      showToast('Failed to update cache', 'error');
    }
  };

  const handleDownloadCached = () => {
    const content = localStorage.getItem(STORAGE_KEYS.EXPORT_CSV);
    if (!content || !exportMeta) {
      showToast('No cached export available', 'error');
      return;
    }
    const filename = `employees-cached-${new Date(exportMeta.timestamp).toISOString().slice(0, 10)}.csv`;
    downloadCSV(content, filename);
    showToast('Downloaded cached export', 'success');
  };

  const handleClearCache = () => {
    localStorage.removeItem(STORAGE_KEYS.EXPORT_CSV);
    localStorage.removeItem(STORAGE_KEYS.EXPORT_META);
    setExportMeta(null);
    showToast('Export cache cleared', 'info');
  };

  // ============================================
  // XLSX PARSING - FIXED VERSION
  // ============================================

  const parseXLSXFile = useCallback((file: File): Promise<ParseResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const arrayBuffer = evt.target?.result as ArrayBuffer;
          if (!arrayBuffer) {
            throw new Error('Failed to read file buffer');
          }

          const data = new Uint8Array(arrayBuffer);
          
          // Parse workbook with options to preserve data
          const workbook = XLSX.read(data, {
            type: 'array',
            cellText: true,
            cellDates: false, // Keep as numbers, we'll convert manually
            raw: false,
            dateNF: 'yyyy-mm-dd',
          });

          // Validate workbook
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Workbook has no sheets');
          }

          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];

          if (!sheet) {
            throw new Error(`Sheet "${sheetName}" not found`);
          }

          // Convert to JSON with string values
          const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
            defval: '',
            raw: false, // Get formatted strings
            dateNF: 'yyyy-mm-dd',
          });

          console.log('XLSX Raw Rows Count:', rawRows.length);

          if (rawRows.length === 0) {
            throw new Error('Sheet is empty or has no data rows');
          }

          // Get actual headers from first row
          const actualHeaders = Object.keys(rawRows[0]);
          console.log('XLSX Actual Headers:', actualHeaders);
          console.log('Expected CSV Headers:', CSV_HEADERS);

          // Build header mappings FIRST (before processing rows)
          const headerMappings: HeaderMapping[] = CSV_HEADERS.map((expectedHeader) => {
            const normalizedExpected = normalizeHeaderKey(expectedHeader);
            
            const foundHeader = actualHeaders.find((actualHeader) => {
              const normalizedActual = normalizeHeaderKey(actualHeader);
              return normalizedActual === normalizedExpected;
            });

            return {
              expected: expectedHeader,
              found: foundHeader || null,
              matched: foundHeader !== undefined && foundHeader !== null,
            };
          });

          // Log matching results
          const matchedCount = headerMappings.filter(h => h.matched).length;
          console.log(`Header Matching: ${matchedCount}/${CSV_HEADERS.length} matched`);
          
          const unmatchedHeaders = headerMappings.filter(h => !h.matched);
          if (unmatchedHeaders.length > 0) {
            console.warn('Unmatched headers:', unmatchedHeaders.map(h => h.expected));
          }

          // Create lookup map for actual headers (case-insensitive)
          const actualHeaderLookup = new Map<string, string>();
          actualHeaders.forEach((header) => {
            actualHeaderLookup.set(normalizeHeaderKey(header), header);
          });

          // Process each row and normalize to expected format
          const normalizedRows: Record<string, any>[] = rawRows.map((row, rowIndex) => {
            const normalizedRow: Record<string, any> = {};

            // Process each expected header
            CSV_HEADERS.forEach((expectedHeader) => {
              const normalizedKey = normalizeHeaderKey(expectedHeader);
              const actualKey = actualHeaderLookup.get(normalizedKey);
              
              // Get raw value from row
              let value = actualKey ? row[actualKey] : '';

              // Apply field-specific transformations
              if (expectedHeader === 'cnic_no') {
                value = normalizeCnic(value);
              } else if (expectedHeader === 'personal_no') {
                value = value !== null && value !== undefined && value !== '' 
                  ? String(value).trim() 
                  : '';
              } else if (expectedHeader.includes('date') || expectedHeader.includes('dob')) {
                value = excelDateToISO(value);
              } else if (value !== null && value !== undefined) {
                value = String(value).trim();
              } else {
                value = '';
              }

              normalizedRow[expectedHeader] = value;
            });

            return normalizedRow;
          });

          // Validate we got some data
          if (normalizedRows.length === 0) {
            throw new Error('No rows could be normalized');
          }

          // Check if we matched any important columns
          const criticalHeaders = ['cnic_no', 'personal_no', 'name'];
          const matchedCritical = criticalHeaders.filter(h => 
            headerMappings.find(m => m.expected === h && m.matched)
          );

          if (matchedCritical.length === 0) {
            console.warn('Warning: No critical columns matched (cnic_no, personal_no, name)');
          }

          console.log('XLSX Parse Success:', {
            totalRows: normalizedRows.length,
            matchedHeaders: matchedCount,
            sampleRow: normalizedRows[0],
          });

          resolve({
            rows: normalizedRows,
            headerMappings,
          });

        } catch (error) {
          console.error('XLSX Parse Error:', error);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      };

      reader.onerror = (error) => {
        console.error('FileReader Error:', error);
        reject(new Error('Failed to read file'));
      };

      // Read as ArrayBuffer for XLSX
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // ============================================
  // CSV PARSING
  // ============================================

  const parseCSVFile = useCallback((file: File): Promise<ParseResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          
          if (!text || text.trim() === '') {
            throw new Error('CSV file is empty');
          }

          const parsedRows = parseCSV(text);

          if (parsedRows.length === 0) {
            throw new Error('CSV file has no data rows');
          }

          const actualHeaders = Object.keys(parsedRows[0]);
          console.log('CSV Actual Headers:', actualHeaders);

          // Build header mappings
          const headerMappings: HeaderMapping[] = CSV_HEADERS.map((expectedHeader) => {
            const normalizedExpected = normalizeHeaderKey(expectedHeader);
            
            const foundHeader = actualHeaders.find((actualHeader) => {
              return normalizeHeaderKey(actualHeader) === normalizedExpected;
            });

            return {
              expected: expectedHeader,
              found: foundHeader || null,
              matched: !!foundHeader,
            };
          });

          // Create lookup for actual headers
          const actualHeaderLookup = new Map<string, string>();
          actualHeaders.forEach((header) => {
            actualHeaderLookup.set(normalizeHeaderKey(header), header);
          });

          // Normalize rows
          const normalizedRows = parsedRows.map((row) => {
            const normalizedRow: Record<string, any> = {};

            CSV_HEADERS.forEach((expectedHeader) => {
              const normalizedKey = normalizeHeaderKey(expectedHeader);
              const actualKey = actualHeaderLookup.get(normalizedKey);
              
              let value = actualKey ? row[actualKey] : '';

              if (expectedHeader === 'cnic_no') {
                value = normalizeCnic(value);
              } else if (expectedHeader === 'personal_no') {
                value = value ? String(value).trim() : '';
              } else if (value) {
                value = String(value).trim();
              }

              normalizedRow[expectedHeader] = value ?? '';
            });

            return normalizedRow;
          });

          resolve({
            rows: normalizedRows,
            headerMappings,
          });

        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'UTF-8');
    });
  }, []);

  // ============================================
  // ROW ANALYSIS
  // ============================================

  const analyzeRows = useCallback((rows: Record<string, any>[]): AnalyzedRow[] => {
    // Build lookup maps for existing employees
    const dbByCnic = new Map<string, EmployeeRecord>();
    const dbByPno = new Map<string, EmployeeRecord>();

    employees.forEach((emp) => {
      const cnicKey = normalizeCnic(emp.employees?.cnic_no);
      const pnoKey = normalizePersonalNo(emp.employees?.personal_no);
      
      if (cnicKey) dbByCnic.set(cnicKey, emp);
      if (pnoKey) dbByPno.set(pnoKey, emp);
    });

    // Track seen identifiers within this batch
    const seenCnic = new Map<string, number>();
    const seenPno = new Map<string, number>();

    return rows.map((row, idx) => {
      const rowNum = idx + 2; // Header is row 1
      const warnings: string[] = [];

      const cnicRaw = row['cnic_no'] || '';
      const pnoRaw = row['personal_no'] || '';
      const nameRaw = row['name'] || row['employee_name'] || 'Unnamed';

      const cnicKey = normalizeCnic(cnicRaw);
      const pnoKey = normalizePersonalNo(pnoRaw);

      // Validation: Missing identifiers
      if (!cnicKey && !pnoKey) {
        return {
          rowData: row,
          rowNum,
          status: 'INVALID' as ImportStatus,
          message: 'Missing both CNIC and Personnel Number',
          warnings,
        };
      }

      // Check for duplicates within import batch
      if (cnicKey && seenCnic.has(cnicKey)) {
        return {
          rowData: row,
          rowNum,
          status: 'SKIP_DUPLICATE' as ImportStatus,
          message: `Duplicate CNIC in file (first at row ${seenCnic.get(cnicKey)})`,
          warnings,
        };
      }

      if (pnoKey && seenPno.has(pnoKey)) {
        return {
          rowData: row,
          rowNum,
          status: 'SKIP_DUPLICATE' as ImportStatus,
          message: `Duplicate Personnel No in file (first at row ${seenPno.get(pnoKey)})`,
          warnings,
        };
      }

      // Track this row
      if (cnicKey) seenCnic.set(cnicKey, rowNum);
      if (pnoKey) seenPno.set(pnoKey, rowNum);

      // Look up existing records
      const matchCnic = cnicKey ? dbByCnic.get(cnicKey) : undefined;
      const matchPno = pnoKey ? dbByPno.get(pnoKey) : undefined;

      // Case 1: Both match same record
      if (matchCnic && matchPno) {
        if (matchCnic.id === matchPno.id) {
          return {
            rowData: row,
            rowNum,
            status: 'UPDATE' as ImportStatus,
            message: `Update: ${matchCnic.employees?.name || 'Unknown'} (matched both identifiers)`,
            match: matchCnic,
            warnings,
          };
        } else {
          return {
            rowData: row,
            rowNum,
            status: 'CONFLICT' as ImportStatus,
            message: `CNIC → "${matchCnic.employees?.name}" but PNo → "${matchPno.employees?.name}"`,
            warnings,
          };
        }
      }

      // Case 2: CNIC match only
      if (matchCnic) {
        const existingPno = normalizePersonalNo(matchCnic.employees?.personal_no);
        if (pnoKey && existingPno && existingPno !== pnoKey) {
          warnings.push(`PNo changing: ${matchCnic.employees?.personal_no} → ${pnoRaw}`);
        }
        return {
          rowData: row,
          rowNum,
          status: 'UPDATE' as ImportStatus,
          message: `Update: ${matchCnic.employees?.name || 'Unknown'} (by CNIC)`,
          match: matchCnic,
          warnings,
        };
      }

      // Case 3: PNo match only
      if (matchPno) {
        const existingCnic = normalizeCnic(matchPno.employees?.cnic_no);
        if (cnicKey && existingCnic && existingCnic !== cnicKey) {
          warnings.push(`CNIC changing: ${matchPno.employees?.cnic_no} → ${cnicRaw}`);
        }
        return {
          rowData: row,
          rowNum,
          status: 'UPDATE' as ImportStatus,
          message: `Update: ${matchPno.employees?.name || 'Unknown'} (by PNo)`,
          match: matchPno,
          warnings,
        };
      }

      // Case 4: No match - Create new
      return {
        rowData: row,
        rowNum,
        status: 'CREATE' as ImportStatus,
        message: `New: ${nameRaw}`,
        warnings,
      };
    });
  }, [employees]);

  // ============================================
  // FILE PROCESSING
  // ============================================

  const processFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsAnalyzing(true);
    setImportStats(null);
    setPreviewFilter('ALL');
    setPreviewSearchTerm('');

    const ext = file.name.toLowerCase().split('.').pop() || '';
    console.log(`Processing file: ${file.name} (${formatFileSize(file.size)})`);

    try {
      let result: ParseResult;

      if (ext === 'xlsx' || ext === 'xls') {
        console.log('Parsing as XLSX...');
        result = await parseXLSXFile(file);
      } else if (ext === 'csv') {
        console.log('Parsing as CSV...');
        result = await parseCSVFile(file);
      } else {
        throw new Error(`Unsupported file format: .${ext}`);
      }

      console.log('Parse result:', {
        rowCount: result.rows.length,
        headerMatches: result.headerMappings.filter(h => h.matched).length,
      });

      setHeaderMappings(result.headerMappings);

      if (result.rows.length === 0) {
        showToast('File contains no data rows', 'error');
        setIsAnalyzing(false);
        return;
      }

      // Analyze rows
      const analyzed = analyzeRows(result.rows);
      setAnalyzedRows(analyzed);
      setPreviewMode(true);

      // Summary
      const counts = {
        create: analyzed.filter(r => r.status === 'CREATE').length,
        update: analyzed.filter(r => r.status === 'UPDATE').length,
        conflict: analyzed.filter(r => r.status === 'CONFLICT').length,
        duplicate: analyzed.filter(r => r.status === 'SKIP_DUPLICATE').length,
        invalid: analyzed.filter(r => r.status === 'INVALID').length,
      };

      console.log('Analysis Summary:', counts);

      showToast(
        `Analyzed ${result.rows.length} rows: ${counts.create} new, ${counts.update} updates`,
        counts.conflict > 0 ? 'warning' : 'success'
      );

    } catch (error) {
      console.error('File Processing Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Error processing file: ${message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [parseXLSXFile, parseCSVFile, analyzeRows, showToast]);

  // ============================================
  // IMPORT EXECUTION
  // ============================================

  const executeImport = async () => {
    setIsImporting(true);

    const stats: ImportStats = {
      total: analyzedRows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      warnings: [],
    };

    try {
      const employeeMap = new Map<string, EmployeeRecord>(
        employees.map(e => [e.id, e])
      );

      for (const row of analyzedRows) {
        try {
          switch (row.status) {
            case 'CREATE': {
              const newRecord = unflattenEmployee(row.rowData);
              if (!employeeMap.has(newRecord.id)) {
                employeeMap.set(newRecord.id, newRecord);
                stats.created++;
              } else {
                stats.skipped++;
                stats.warnings.push(`Row ${row.rowNum}: ID collision, skipped`);
              }
              break;
            }

            case 'UPDATE': {
              if (row.match) {
                const current = employeeMap.get(row.match.id) || row.match;
                const merged = unflattenEmployee(row.rowData, current);
                employeeMap.set(merged.id, merged);
                stats.updated++;
                
                if (row.warnings?.length) {
                  row.warnings.forEach(w => stats.warnings.push(`Row ${row.rowNum}: ${w}`));
                }
              } else {
                stats.skipped++;
                stats.errors.push(`Row ${row.rowNum}: Update failed - no match`);
              }
              break;
            }

            case 'CONFLICT':
              stats.skipped++;
              stats.errors.push(`Row ${row.rowNum}: ${row.message}`);
              break;

            case 'SKIP_DUPLICATE':
            case 'INVALID':
              stats.skipped++;
              break;
          }
        } catch (rowError) {
          stats.skipped++;
          const errMsg = rowError instanceof Error ? rowError.message : 'Unknown';
          stats.errors.push(`Row ${row.rowNum}: ${errMsg}`);
        }
      }

      // Apply auto-calculations
      const finalEmployees = Array.from(employeeMap.values());
      const calculatedEmployees = autoCalculateRetirementDates(finalEmployees);

      onImport(calculatedEmployees);

      setImportStats(stats);
      setPreviewMode(false);
      setAnalyzedRows([]);
      setSelectedFile(null);
      setHeaderMappings([]);

      showToast(
        `Import complete: ${stats.created} created, ${stats.updated} updated`,
        stats.errors.length > 0 ? 'warning' : 'success'
      );

    } catch (e) {
      console.error('Import Error:', e);
      showToast(`Import failed: ${e instanceof Error ? e.message : 'Unknown'}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const cancelImport = () => {
    setPreviewMode(false);
    setAnalyzedRows([]);
    setSelectedFile(null);
    setHeaderMappings([]);
    setImportStats(null);
    setPreviewFilter('ALL');
    setPreviewSearchTerm('');
  };

  // ============================================
  // FILE INPUT HANDLERS
  // ============================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
        processFile(file);
      } else {
        showToast('Please drop a CSV or XLSX file', 'error');
      }
    }
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const filteredRows = analyzedRows.filter(row => {
    if (previewFilter !== 'ALL' && row.status !== previewFilter) {
      return false;
    }

    if (previewSearchTerm.trim()) {
      const term = previewSearchTerm.toLowerCase();
      const searchText = [
        row.rowData['name'],
        row.rowData['cnic_no'],
        row.rowData['personal_no'],
        row.message,
      ].filter(Boolean).join(' ').toLowerCase();

      return searchText.includes(term);
    }

    return true;
  });

  const statusCounts = {
    ALL: analyzedRows.length,
    CREATE: analyzedRows.filter(r => r.status === 'CREATE').length,
    UPDATE: analyzedRows.filter(r => r.status === 'UPDATE').length,
    CONFLICT: analyzedRows.filter(r => r.status === 'CONFLICT').length,
    SKIP_DUPLICATE: analyzedRows.filter(r => r.status === 'SKIP_DUPLICATE').length,
    INVALID: analyzedRows.filter(r => r.status === 'INVALID').length,
  };

  const validRowCount = statusCounts.CREATE + statusCounts.UPDATE;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <PageHeader 
        title="Import / Export" 
        subtitle="Manage employee data via CSV or XLSX files" 
      />

      {/* ====== EXPORT SECTION ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Direct Export Card */}
        <Card variant="outlined" className="p-6 bg-surface-container-low">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-container text-on-primary-container rounded-lg">
              <AppIcon name="download" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Export Data</h3>
              <p className="text-xs text-on-surface-variant">
                {employees.length} records available
              </p>
            </div>
          </div>
          
          <p className="text-sm text-on-surface-variant mb-6">
            Download all current employee records. XLSX includes metadata sheet.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="filled"
              label={isExporting ? 'Exporting...' : 'Download CSV'}
              icon="description"
              onClick={handleDownloadCSV}
              disabled={isExporting || employees.length === 0}
              className="flex-1"
            />
            <Button
              variant="tonal"
              label={isExporting ? 'Exporting...' : 'Download XLSX'}
              icon="table_chart"
              onClick={handleDownloadXLSX}
              disabled={isExporting || employees.length === 0}
              className="flex-1"
            />
          </div>
        </Card>

        {/* Cached Export Card */}
        <Card variant="outlined" className="p-6 bg-surface-container-low">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg">
              <AppIcon name="cached" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Cached Export</h3>
              <p className="text-xs text-on-surface-variant">Quick access to recent export</p>
            </div>
          </div>

          {exportMeta ? (
            <div className="text-sm text-on-surface-variant mb-4 space-y-1">
              <div className="flex justify-between">
                <span>Updated:</span>
                <span className="font-medium text-on-surface">{formatDate(exportMeta.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span>Records:</span>
                <span className="font-medium text-on-surface">{exportMeta.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Hash:</span>
                <span className="font-mono text-xs">{exportMeta.hash.substring(0, 12)}...</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant mb-4">
              No cached export. Click "Update Cache" to create one.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="tonal"
              label="Update Cache"
              icon="refresh"
              onClick={handleRefreshCache}
              disabled={employees.length === 0}
              className="flex-1"
            />
            <Button
              variant="outlined"
              label="Download"
              icon="file_download"
              onClick={handleDownloadCached}
              disabled={!exportMeta}
              className="flex-1"
            />
            {exportMeta && (
              <Button
                variant="text"
                label=""
                icon="delete"
                onClick={handleClearCache}
                className="!px-3"
              />
            )}
          </div>
        </Card>
      </div>

      {/* ====== IMPORT SECTION ====== */}
      <Card variant="outlined" className="p-6 bg-surface-container-low">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-tertiary-container text-on-tertiary-container rounded-full">
            <AppIcon name="upload" size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">Import Employees</h3>
            <p className="text-sm text-on-surface-variant">
              Upload CSV or XLSX to add/update records. Retirement dates auto-calculated.
            </p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
        />

        {/* Drag & Drop Zone */}
        {!previewMode && (
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragOver 
                ? 'border-primary bg-primary/5 scale-[1.02]' 
                : 'border-outline-variant hover:border-primary hover:bg-surface-container'
              }
              ${isAnalyzing ? 'pointer-events-none opacity-60' : ''}
            `}
          >
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
                <span className="text-on-surface-variant">Analyzing file...</span>
                {selectedFile && (
                  <span className="text-xs text-on-surface-variant">{selectedFile.name}</span>
                )}
              </div>
            ) : (
              <>
                <AppIcon 
                  name={isDragOver ? "file_download" : "cloud_upload"} 
                  size={48} 
                  className={`mx-auto mb-3 ${isDragOver ? 'text-primary' : 'text-on-surface-variant'}`}
                />
                <p className="text-lg font-medium mb-1">
                  {isDragOver ? 'Drop file here' : 'Drag & drop file here'}
                </p>
                <p className="text-sm text-on-surface-variant">
                  or click to browse • Supports CSV, XLSX, XLS
                </p>
              </>
            )}
          </div>
        )}

        {/* ====== PREVIEW MODE ====== */}
        {previewMode && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Selected File Info */}
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-surface-variant/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <AppIcon name="description" className="text-primary" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-on-surface-variant">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Badge variant="default">{analyzedRows.length} rows</Badge>
              </div>
            )}

            {/* Header Mapping */}
            {headerMappings.length > 0 && (
              <div className="bg-surface-variant/20 rounded-lg p-4">
                <button
                  onClick={() => setShowHeaderDetails(!showHeaderDetails)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <AppIcon name="view_column" size={20} />
                    <span className="font-medium">Column Mapping</span>
                    <Badge variant={headerMappings.filter(h => h.matched).length > 10 ? 'default' : 'destructive'}>
                      {headerMappings.filter(h => h.matched).length}/{headerMappings.length} matched
                    </Badge>
                  </div>
                  <AppIcon name={showHeaderDetails ? 'expand_less' : 'expand_more'} />
                </button>

                {showHeaderDetails && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm max-h-60 overflow-y-auto">
                    {headerMappings.map((mapping, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded text-xs ${
                          mapping.matched 
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : 'bg-orange-50 text-orange-800 border border-orange-200'
                        }`}
                      >
                        <div className="font-mono truncate" title={mapping.expected}>
                          {mapping.expected}
                        </div>
                        <div className="opacity-70 truncate">
                          {mapping.matched ? `✓ ${mapping.found}` : '✗ Not found'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { key: 'ALL' as const, label: 'Total', icon: 'list', color: 'bg-gray-100 text-gray-700 border-gray-300' },
                { key: 'CREATE' as const, label: 'New', icon: 'add_circle', color: 'bg-green-50 text-green-700 border-green-200' },
                { key: 'UPDATE' as const, label: 'Updates', icon: 'edit', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { key: 'CONFLICT' as const, label: 'Conflicts', icon: 'error', color: 'bg-red-50 text-red-700 border-red-200' },
                { key: 'SKIP_DUPLICATE' as const, label: 'Duplicates', icon: 'content_copy', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                { key: 'INVALID' as const, label: 'Invalid', icon: 'cancel', color: 'bg-gray-100 text-gray-600 border-gray-200' },
              ].map(({ key, label, icon, color }) => {
                const count = statusCounts[key];
                const isActive = previewFilter === key;

                return (
                  <button
                    key={key}
                    onClick={() => setPreviewFilter(key)}
                    disabled={count === 0 && key !== 'ALL'}
                    className={`
                      p-3 rounded-xl border-2 transition-all text-center
                      ${color}
                      ${isActive ? 'ring-2 ring-primary ring-offset-2 scale-105' : 'hover:scale-[1.02]'}
                      ${count === 0 && key !== 'ALL' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <AppIcon name={icon} size={20} className="mx-auto mb-1" />
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-[10px] uppercase font-medium">{label}</div>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <AppIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search by name, CNIC, or Personnel No..."
                value={previewSearchTerm}
                onChange={(e) => setPreviewSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-surface-variant/30 border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {previewSearchTerm && (
                <button
                  onClick={() => setPreviewSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <AppIcon name="close" size={20} />
                </button>
              )}
            </div>

            {/* Conflicts Warning */}
            {statusCounts.CONFLICT > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                  <AppIcon name="warning" />
                  <span>{statusCounts.CONFLICT} Conflict{statusCounts.CONFLICT > 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-red-600 mb-3">
                  These rows have conflicting identifiers and will be skipped.
                </p>
                <Button
                  variant="outlined"
                  label="View Conflicts"
                  icon="visibility"
                  onClick={() => setPreviewFilter('CONFLICT')}
                  className="!text-red-700 !border-red-300"
                />
              </div>
            )}

            {/* Preview Table */}
            <div className="border border-outline-variant rounded-xl overflow-hidden">
              <div className="bg-surface-variant/30 px-4 py-2 flex justify-between items-center">
                <span className="text-sm">
                  Showing {filteredRows.length} of {analyzedRows.length} rows
                </span>
                {previewFilter !== 'ALL' && (
                  <Button
                    variant="text"
                    label="Clear Filter"
                    icon="filter_alt_off"
                    onClick={() => setPreviewFilter('ALL')}
                  />
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-variant sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3 font-medium w-16">Row</th>
                      <th className="text-left p-3 font-medium w-24">Status</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">CNIC</th>
                      <th className="text-left p-3 font-medium">PNo</th>
                      <th className="text-left p-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                          No rows match the current filter
                        </td>
                      </tr>
                    ) : (
                      filteredRows.slice(0, 100).map((row, idx) => {
                        const config = STATUS_CONFIG[row.status];
                        return (
                          <tr key={idx} className={`${config.bgColor}/30`}>
                            <td className="p-3 font-mono text-xs">{row.rowNum}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                                {config.label}
                              </span>
                            </td>
                            <td className="p-3 font-medium truncate max-w-[150px]">
                              {row.rowData['name'] || '-'}
                            </td>
                            <td className="p-3 font-mono text-xs">
                              {row.rowData['cnic_no'] || '-'}
                            </td>
                            <td className="p-3 font-mono text-xs">
                              {row.rowData['personal_no'] || '-'}
                            </td>
                            <td className="p-3 text-xs text-on-surface-variant max-w-[200px] truncate" title={row.message}>
                              {row.message}
                              {row.warnings && row.warnings.length > 0 && (
                                <div className="text-orange-600 mt-1">
                                  ⚠️ {row.warnings[0]}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {filteredRows.length > 100 && (
                  <div className="p-4 text-center text-sm text-on-surface-variant bg-surface-variant/20">
                    Showing first 100 rows. {filteredRows.length - 100} more hidden.
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-outline-variant">
              <div className="text-sm text-on-surface-variant">
                Ready to import <strong className="text-on-surface">{validRowCount}</strong> valid rows
                {statusCounts.CONFLICT + statusCounts.SKIP_DUPLICATE + statusCounts.INVALID > 0 && (
                  <span className="text-orange-600">
                    {' '}({statusCounts.CONFLICT + statusCounts.SKIP_DUPLICATE + statusCounts.INVALID} will be skipped)
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="text"
                  label="Cancel"
                  icon="close"
                  onClick={cancelImport}
                  disabled={isImporting}
                />
                <Button
                  variant="filled"
                  label={isImporting ? 'Importing...' : `Import ${validRowCount} Records`}
                  icon={isImporting ? undefined : 'check'}
                  onClick={executeImport}
                  disabled={isImporting || validRowCount === 0}
                />
              </div>
            </div>
          </div>
        )}

        {/* ====== IMPORT RESULTS ====== */}
        {importStats && !previewMode && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500 text-white rounded-full">
                  <AppIcon name="check" size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-green-800">Import Complete</h4>
                  <p className="text-sm text-green-600">Retirement dates auto-calculated</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="bg-white/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-800">{importStats.total}</div>
                  <div className="text-xs text-gray-600 uppercase">Total</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{importStats.created}</div>
                  <div className="text-xs text-green-600 uppercase">Created</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{importStats.updated}</div>
                  <div className="text-xs text-blue-600 uppercase">Updated</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-600">{importStats.skipped}</div>
                  <div className="text-xs text-gray-500 uppercase">Skipped</div>
                </div>
              </div>

              {importStats.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                    <AppIcon name="error" size={18} />
                    <span>Errors ({importStats.errors.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-xs text-red-600 font-mono space-y-1">
                    {importStats.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </div>
              )}

              {importStats.warnings.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                    <AppIcon name="warning" size={18} />
                    <span>Warnings ({importStats.warnings.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-xs text-orange-600 font-mono space-y-1">
                    {importStats.warnings.slice(0, 20).map((warn, i) => (
                      <div key={i}>{warn}</div>
                    ))}
                    {importStats.warnings.length > 20 && (
                      <div>...and {importStats.warnings.length - 20} more</div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button variant="text" label="Dismiss" onClick={() => setImportStats(null)} />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ====== HELP SECTION ====== */}
      <Card variant="outlined" className="mt-6 p-6 bg-surface-container-low">
        <div className="flex items-center gap-3 mb-4">
          <AppIcon name="help" size={24} className="text-primary" />
          <h3 className="font-bold text-lg">Import/Export Guide</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6 text-sm text-on-surface-variant">
          <div>
            <h4 className="font-medium text-on-surface mb-2">Supported Formats</h4>
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <AppIcon name="description" size={16} className="text-green-600" />
                <strong>CSV</strong> - Comma-separated values
              </li>
              <li className="flex items-center gap-2">
                <AppIcon name="table_chart" size={16} className="text-blue-600" />
                <strong>XLSX</strong> - Excel format
              </li>
              <li className="flex items-center gap-2">
                <AppIcon name="grid_on" size={16} className="text-purple-600" />
                <strong>XLS</strong> - Legacy Excel
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-on-surface mb-2">Matching Logic</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Matched by CNIC or Personnel Number</li>
              <li>Matched records are updated</li>
              <li>Unmatched records are created</li>
              <li>Conflicts are flagged and skipped</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-on-surface mb-2">Required Columns</h4>
            <p>Each row must have at least one of:</p>
            <ul className="mt-1 list-disc list-inside">
              <li><code className="bg-surface-variant px-1 rounded">cnic_no</code></li>
              <li><code className="bg-surface-variant px-1 rounded">personal_no</code></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-on-surface mb-2">Auto-Calculations</h4>
            <ul className="list-disc list-inside">
              <li>Superannuation date (from DOB)</li>
              <li>Contract end date</li>
              <li>Service length</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-outline-variant">
          <h4 className="font-medium text-on-surface mb-2">Expected Headers</h4>
          <div className="flex flex-wrap gap-1">
            {CSV_HEADERS.slice(0, 15).map((header, i) => (
              <code key={i} className="text-xs bg-surface-variant px-2 py-1 rounded">
                {header}
              </code>
            ))}
            {CSV_HEADERS.length > 15 && (
              <span className="text-xs text-on-surface-variant px-2 py-1">
                ...and {CSV_HEADERS.length - 15} more
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsImportExport;