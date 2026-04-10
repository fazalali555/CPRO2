import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, EmptyState, Badge } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { useToast } from '../contexts/ToastContext';
import { useEmployeeContext } from '../contexts/EmployeeContext';
import { PayrollService } from '../services/PayrollService';
import { PrPayrollCode } from '../types';
import { CSV_HEADERS, unflattenEmployee } from '../utils/employeeAdapter';

type ParsedRow = Record<string, string>;

const dynamicImport = (url: string) => (new Function('u', 'return import(u)'))(url) as Promise<any>;
const loadPdfJs = async () => {
  const esmCandidates = [
    {
      base: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.10.111/build/',
      main: 'pdf.min.mjs',
      worker: 'pdf.worker.min.mjs'
    },
    {
      base: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.10.111/build/',
      main: 'pdf.mjs',
      worker: 'pdf.worker.mjs'
    },
    {
      base: 'https://unpkg.com/pdfjs-dist@3.10.111/build/',
      main: 'pdf.min.mjs',
      worker: 'pdf.worker.min.mjs'
    },
    {
      base: 'https://unpkg.com/pdfjs-dist@3.10.111/build/',
      main: 'pdf.mjs',
      worker: 'pdf.worker.mjs'
    },
    {
      base: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/',
      main: 'pdf.min.mjs',
      worker: 'pdf.worker.min.mjs'
    },
    {
      base: 'https://unpkg.com/pdfjs-dist@3.9.179/build/',
      main: 'pdf.min.mjs',
      worker: 'pdf.worker.min.mjs'
    }
  ];
  for (const c of esmCandidates) {
    try {
      const lib = await dynamicImport(c.base + c.main);
      if (lib && lib.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = c.base + c.worker;
      }
      return lib;
    } catch {}
  }
  const umdCandidates = [
    {
      base: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.10.111/build/',
      main: 'pdf.min.js',
      worker: 'pdf.worker.min.js'
    },
    {
      base: 'https://unpkg.com/pdfjs-dist@3.10.111/build/',
      main: 'pdf.min.js',
      worker: 'pdf.worker.min.js'
    },
    {
      base: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.9.179/build/',
      main: 'pdf.min.js',
      worker: 'pdf.worker.min.js'
    },
    {
      base: 'https://unpkg.com/pdfjs-dist@3.9.179/build/',
      main: 'pdf.min.js',
      worker: 'pdf.worker.min.js'
    }
  ];
  for (const c of umdCandidates) {
    try {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = c.base + c.main;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('UMD load error'));
        document.head.appendChild(s);
      });
      const lib = (window as any).pdfjsLib;
      if (lib && lib.GlobalWorkerOptions) {
        lib.GlobalWorkerOptions.workerSrc = c.base + c.worker;
      }
      if (lib) return lib;
    } catch {}
  }
  throw new Error('Failed to load PDF.js from CDN');
};

const extractTextFromPdf = async (file: File): Promise<string[]> => {
  const pdfjsLib = await loadPdfJs();
  const data = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => it.str).join(' ');
    const normalized = text.replace(/\s+/g, ' ').trim();
    pages.push(normalized);
  }
  return pages;
};

const findAmount = (s: string) => {
  const m = s.match(/-?[\d,]+\.\d{2}/);
  if (!m) return 0;
  const n = Number(m[0].replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

const parseIdentity = (text: string) => {
  const get = (re: RegExp) => {
    const m = text.match(re);
    return m ? m[1].trim() : '';
  };
  const name = get(/(?:Employee\s+Name|Name)\s*:\s*(.+?)\n/);
  const personnel_no = get(/Person(?:nel|al)\s+No\.?\s*:\s*(\S+)/i);
  const cnic_no = get(/CNIC\s*No\.?\s*[:\-]?\s*([0-9\-]+)/i);
  const designation_full = get(/Designation\s*:\s*(.+?)\n/i);
  const bps = get(/(?:Pay\s*Scale|BPS)\s*:\s*(\d{1,2})/i);
  const school_full_name = get(/School\s*:\s*([^]+?)(?:\n|$)/i) || get(/Office\s*Name\s*:\s*([^]+?)(?:\n|$)/i);
  const ddo_code = get(/DDO\s*Code\s*:\s*(\S+)/i);
  const father_name = get(/Father\s*Name\s*:\s*([^]+?)(?:\n|$)/i);
  const dob = get(/Date\s*of\s*Birth\s*:\s*([\d./-]+)/i);
  return {
    name,
    personnel_no,
    cnic_no,
    designation_full,
    bps,
    school_full_name,
    office_name: '',
    staff_type: 'teaching',
    status: 'Active',
    father_name,
    dob,
    nationality: 'Pakistani',
    address: '',
    district: '',
    tehsil: '',
    ddo_code
  };
};

const parseWages = (text: string) => {
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  const pay_wages: Record<string, number> = {};
  const deduct_wages: Record<string, number> = {};
  lines.forEach(line => {
    const cm = line.match(/(^|\s)(\d{4})(\s|$)/);
    if (!cm) return;
    const code = cm[2];
    const amt = findAmount(line);
    if (!amt) return;
    const isDed = /^3|^4|^6/.test(code);
    if (isDed) deduct_wages[code] = amt;
    else pay_wages[code] = amt;
  });
  return { pay_wages, deduct_wages };
};

const mapToCanonicalRow = (identity: any, wages: { pay_wages: Record<string, number>; deduct_wages: Record<string, number> }, codeDefs: PrPayrollCode[]) => {
  const row: ParsedRow = {};
  CSV_HEADERS.forEach(h => (row[h] = ''));
  row.name = identity.name || '';
  row.designation = identity.designation_full || '';
  row.designation_full = identity.designation_full || '';
  row.bps = identity.bps || '';
  row.school_full_name = identity.school_full_name || '';
  row.office_name = identity.office_name || '';
  row.staff_type = identity.staff_type || 'teaching';
  row.status = identity.status || 'Active';
  row.cnic_no = identity.cnic_no || '';
  row.personal_no = identity.personnel_no || '';
  row.father_name = identity.father_name || '';
  row.dob = identity.dob || '';
  row.nationality = 'Pakistani';
  row.address = identity.address || '';
  row.district = identity.district || '';
  row.tehsil = identity.tehsil || '';
  row.ddo_code = identity.ddo_code || '';
  const byCode = new Map(codeDefs.map(d => [d.code, d]));
  Object.entries(wages.pay_wages).forEach(([code, amt]) => {
    const def = byCode.get(code);
    if (!def) return;
    const key = def.db_short;
    row[key] = String(amt);
    if (def.db_short === 'basic_pay') {
      row.last_basic_pay = String(amt);
      row.last_pay_with_increment = String(amt);
    }
  });
  Object.entries(wages.deduct_wages).forEach(([code, amt]) => {
    const def = byCode.get(code);
    if (!def) return;
    const key = def.db_short;
    if (key === 'gpf_sub') {
      const prev = Number(row.gpf_sub || '0');
      row.gpf_sub = String(Math.max(prev, amt));
    } else {
      row[key] = String(amt);
    }
  });
  return row;
};

export const PayrollPdfImport: React.FC = () => {
  const { employees, setEmployees } = useEmployeeContext();
  const { showToast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [stats, setStats] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null);
  const [codeDefs, setCodeDefs] = useState<PrPayrollCode[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCodeDefs(PayrollService.getCodes('allowance'));
  }, []);

  const handleExtract = async () => {
    if (!pdfFile) {
      showToast('Select a PDF file', 'error');
      return;
    }
    try {
      setExtracting(true);
      const pages = await extractTextFromPdf(pdfFile);
      const defs = PayrollService.getCodes('allowance');
      const parsed: ParsedRow[] = [];
      pages.forEach(text => {
        if (!text) return;
        const anchorHits =
          (text.match(/Person(?:nel|al)\s+No/i) ? 1 : 0) +
          (text.match(/PERS\s*NO/i) ? 1 : 0) +
          (text.match(/CNIC\s*No/i) ? 1 : 0) +
          (text.match(/CNIC#/i) ? 1 : 0) +
          (text.match(/Desig(?:nation)?\s*:/i) ? 1 : 0) +
          (text.match(/(?:Pay\s*Scale|BPS)\s*:?/i) ? 1 : 0) +
          (text.match(/Name\s*:/i) ? 1 : 0) +
          (text.match(/Employee\s+Name/i) ? 1 : 0);
        if (anchorHits < 2) return;
        const identity = parseIdentity(text);
        if (!identity.personnel_no && !identity.cnic_no) return;
        const wages = parseWages(text);
        const wageCodesFound = Object.keys(wages.pay_wages).length + Object.keys(wages.deduct_wages).length;
        if (wageCodesFound === 0) return;
        const row = mapToCanonicalRow(identity, wages, defs);
        parsed.push(row);
      });
      if (parsed.length === 0) {
        showToast('No valid employee pages found', 'warning');
      }
      setRows(parsed);
    } catch (e: any) {
      showToast(e.message || 'Failed to parse PDF', 'error');
    } finally {
      setExtracting(false);
    }
  };

  const handleImport = () => {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const existing = [...employees];
    const byKey = new Map(existing.map(e => [e.id, e]));
    const byCNIC = new Map(existing.map(e => [e.employees.cnic_no, e]));
    const byPN = new Map(existing.map(e => [e.employees.personal_no, e]));
  rows.forEach((row: ParsedRow) => {
      const match = byCNIC.get(row.cnic_no) || byPN.get(row.personal_no);
      try {
        const merged = unflattenEmployee(row, match || undefined);
        if (match) {
          byKey.set(merged.id, merged);
          updated++;
        } else {
          if (!byKey.has(merged.id)) {
            byKey.set(merged.id, merged);
            created++;
          } else {
            skipped++;
          }
        }
      } catch (e: any) {
        skipped++;
        errors.push(e.message || 'Row error');
      }
    });
    const finalList = Array.from(byKey.values());
    setEmployees(finalList);
    setStats({ created, updated, skipped, errors });
    showToast(`Import Complete: ${created} added, ${updated} updated`, 'success');
  };

  const total = useMemo(() => rows.length, [rows]);

  return (
    <div>
      <PageHeader title="Payroll PDF Import" description="Extract official payroll PDF and update employees directly" />
      <Card variant="outlined" className="p-6 bg-surface-container-low space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-tertiary-container text-on-tertiary-container rounded-full">
            <AppIcon name="picture_as_pdf" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold">Upload PDF</h3>
            <p className="text-sm text-on-surface-variant">Official payroll registers are supported.</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <input ref={inputRef} type="file" accept="application/pdf" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPdfFile(e.target.files?.[0] || null)} />
          <Button variant="filled" label="Extract" icon={extracting ? 'hourglass_full' : 'upload_file'} onClick={handleExtract} disabled={extracting || !pdfFile} />
          <Badge label={`${total} rows`} color="primary" variant="tonal" />
        </div>

        {rows.length === 0 ? (
          <EmptyState icon="person_search" title="No rows yet" description="Upload a PDF and click Extract." />
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-on-surface-variant">Preview ({rows.length})</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-2">Personnel No</th>
                    <th className="text-left p-2">CNIC</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Designation</th>
                    <th className="text-left p-2">BPS</th>
                    <th className="text-right p-2">Basic Pay</th>
                    <th className="text-right p-2">HRA</th>
                    <th className="text-right p-2">CA</th>
                    <th className="text-right p-2">MA</th>
                    <th className="text-right p-2">ARA 2013</th>
                    <th className="text-right p-2">ARA 2022</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: ParsedRow, i: number) => (
                    <tr key={i} className="border-t border-outline-variant/40">
                      <td className="p-2">{r.personal_no}</td>
                      <td className="p-2">{r.cnic_no}</td>
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.designation}</td>
                      <td className="p-2">{r.bps}</td>
                      <td className="p-2 text-right">{r.basic_pay || r.last_basic_pay}</td>
                      <td className="p-2 text-right">{r.hra}</td>
                      <td className="p-2 text-right">{r.ca}</td>
                      <td className="p-2 text-right">{r.ma}</td>
                      <td className="p-2 text-right">{r.adhoc_2013}</td>
                      <td className="p-2 text-right">{r.adhoc_2022}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button variant="filled" label="Import" icon="save" onClick={handleImport} />
            </div>
          </div>
        )}
      </Card>

      {stats && (
        <Card variant="outlined" className="p-4 mt-4">
          <div className="flex gap-6">
            <div>Created: <span className="font-bold">{stats.created}</span></div>
            <div>Updated: <span className="font-bold">{stats.updated}</span></div>
            <div>Skipped: <span className="font-bold">{stats.skipped}</span></div>
          </div>
          {stats.errors.length > 0 && (
            <div className="mt-2 text-error text-xs">{stats.errors.join('; ')}</div>
          )}
        </Card>
      )}
    </div>
  );
}
