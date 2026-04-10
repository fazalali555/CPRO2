import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, Badge, TextField, SelectField } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { TokenBillRecord } from '../types';
import { formatCurrency } from '../utils';
import { formatDate } from '../utils/dateUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useEmployeeContext } from '../contexts/EmployeeContext';
import { ensureExpenditureYearFolder, listExpenditureYears, loadExpenditureStatements, saveExpenditureStatement } from '../budgeting/expenditure/storage';
import { TaBillTab } from '../budgeting/ta-bill/TaBillTab';
import { MonthlyExpenditureStatement, ExpenditureRowData } from '../budgeting/expenditure/expenditure-format';
import { Bm20, Bm20Row } from '../budgeting/budget/Bm20';
import { PayAllowancesStatement } from '../budgeting/budget/bm6';
import { BudgetEstimatesForm } from '../budgeting/budget/bm2';
import { SanctionedPostsReport } from '../budgeting/budget/posts';
import * as XLSX from 'xlsx';
import { listBudgetSnapshots, saveBudgetSnapshot } from '../budgeting/budget/storage';

// Import centralized constants
import {
  PAY_CODE_LIST,
  ALLOWANCE_CODE_LIST,
  NON_SALARY_CODE_LIST,
  ALL_CODE_LIST,
  CODE_DESCRIPTIONS,
  MONTH_KEYS,
  FULL_MONTH_NAMES,
  MONTH_OPTIONS,
  extractCode,
  isSalaryCode,
  buildRowHead,
  parseNumber,
  normalizeHeader,
  sumMonths,
  sumExpenditureCalcs,
  sumBm20Calcs,
  calcBalanceExcess,
  buildOfficeAndDdo,
  ExpenditureCalc,
  Bm20CalcResult,
} from '../budgeting/constants';

// ============================================================
// PRINT PREVIEW UTILITY
// ============================================================

const openPrintPreview = (options: { title: string; html: string; pageCss: string; bodyCss?: string }) => {
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(node => node.outerHTML)
    .join('');

  const template = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${options.title}</title>
        ${styles}
        <style>
          ${options.pageCss}
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 0;
              background-color: white !important;
            }
            .no-print { display: none !important; }
            .bg-surface,
            .bg-surface-container,
            .bg-surface-container-low,
            .bg-surface-variant,
            .bg-surface-variant\\/30,
            .bg-primary\\/5 {
              background-color: white !important;
              box-shadow: none !important;
            }
            .shadow, .shadow-md, .shadow-lg, .shadow-xl {
              box-shadow: none !important;
            }
            .rounded, .rounded-md, .rounded-lg, .rounded-xl, .rounded-2xl, .rounded-full {
              border-radius: 0 !important;
            }
          }
          body { background-color: white !important; margin: 0; ${options.bodyCss || ''} }
          .print-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #fff;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: system-ui, sans-serif;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          }
          .print-actions { display: flex; align-items: center; gap: 12px; }
          .print-btn {
            padding: 10px 20px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(37,99,235,0.3);
            transition: all 0.2s;
          }
          .print-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(37,99,235,0.4); }
          .close-btn {
            padding: 10px 16px;
            background: rgba(255,255,255,0.1);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
          }
          .close-btn:hover { background: rgba(255,255,255,0.2); }
          .print-spacer { height: 64px; }
        </style>
      </head>
      <body>
        <div class="print-toolbar no-print">
          <div style="display:flex;align-items:center;gap:10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
            Print Preview
          </div>
          <div class="print-actions">
            <button class="print-btn" onclick="window.print()">🖨️ Print Document</button>
            <button class="close-btn" onclick="if (window.opener) { window.close(); } else { window.history.back(); }">✕ Close</button>
          </div>
        </div>
        <div class="print-spacer no-print"></div>
        ${options.html}
      </body>
    </html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.open();
    w.document.write(template);
    w.document.close();
    return;
  }

  const sameTab = window.open('', '_self');
  if (sameTab) {
    sameTab.document.open();
    sameTab.document.write(template);
    sameTab.document.close();
  }
};

// ============================================================
// MAIN BUDGETING COMPONENT
// ============================================================

export const Budgeting: React.FC = () => {
  const { t, isUrdu } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sources' | 'expenditure' | 'ta' | 'tokens'>('sources');

  const tabs = [
    { id: 'sources', label: 'Budget Forms', icon: 'account_balance', description: 'BM-2, BM-6, BM-20' },
    { id: 'expenditure', label: t.budgeting.expenditure, icon: 'payments', description: 'Monthly tracking' },
    { id: 'tokens', label: t.budgeting.tokenManagement, icon: 'receipt_long', description: 'Token bills' },
    { id: 'ta', label: t.budgeting.taBills, icon: 'directions', description: 'Travel allowance' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 px-3 sm:px-4 lg:px-6">
      {/* Page Header */}
      <div className="mb-6 no-print">
        <PageHeader
          title={t.budgeting.title}
          subtitle={t.budgeting.subtitle}
        />
      </div>

      {/* Enhanced Tab Navigation */}
      <div className={`bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low rounded-2xl p-2 mb-8 shadow-sm border border-outline-variant/20 no-print ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <div className={`flex overflow-x-auto no-scrollbar gap-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group flex items-center gap-3 px-5 py-3.5 text-sm font-semibold transition-all duration-300 whitespace-nowrap rounded-xl min-w-fit ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-on-primary shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'text-on-surface-variant hover:bg-surface-variant/60 hover:text-on-surface hover:shadow-sm'
              } ${isUrdu ? 'flex-row-reverse' : ''}`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-surface-variant/50 group-hover:bg-surface-variant'
              }`}>
                <AppIcon name={tab.icon} size={20} />
              </div>
              <div className={`${isUrdu ? 'text-right' : 'text-left'}`}>
                <div className="font-semibold">{tab.label}</div>
                <div className={`text-[10px] font-normal opacity-70 ${activeTab === tab.id ? 'text-on-primary/80' : ''}`}>
                  {tab.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'sources' && <BudgetHeadsTab />}
        {activeTab === 'expenditure' && <ExpenditureTab />}
        {activeTab === 'tokens' && <TokenManagementTab />}
        {activeTab === 'ta' && <TaBillTab />}
      </div>
    </div>
  );
};

// ============================================================
// BUDGET HEADS TAB
// ============================================================

type BudgetMap = Record<string, {
  budget: number;
  modified: number;
  months: Record<string, number>;
  desc: string;
  anticipated?: number;
}>;

const BudgetHeadsTab = () => {
  const { isUrdu } = useLanguage();
  const { employees } = useEmployeeContext();
  const currentYear = new Date().getFullYear();
  const [activeForm, setActiveForm] = useState<'bm20' | 'bm2' | 'bm6' | 'posts'>('bm20');
  const [previousMap, setPreviousMap] = useState<BudgetMap>({});
  const [currentMap, setCurrentMap] = useState<BudgetMap>({});
  const [officeName, setOfficeName] = useState('');
  const [ddoCode, setDdoCode] = useState('');
  const [previousOfficeName, setPreviousOfficeName] = useState('');
  const [currentOfficeName, setCurrentOfficeName] = useState('');
  const [previousYear, setPreviousYear] = useState<number | null>(null);
  const [currentYearFound, setCurrentYearFound] = useState<number | null>(null);
  const [fiscalYearStart, setFiscalYearStart] = useState(currentYear);
  const [prevFileName, setPrevFileName] = useState('');
  const [currentFileName, setCurrentFileName] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImportingPrev, setIsImportingPrev] = useState(false);
  const [isImportingCurr, setIsImportingCurr] = useState(false);
  const [snapshots, setSnapshots] = useState(() => listBudgetSnapshots());
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  // Parse expenditure file
  const parseExpenditureFile = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const grid = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });

    let yearFound = currentYear;
    let ministryText = '';
    const textCells = grid.flat().filter(cell => typeof cell === 'string') as string[];

    for (const cell of textCells) {
      const yearMatch = cell.match(/20\d{2}/);
      if (yearMatch) {
        yearFound = Number(yearMatch[0]);
        break;
      }
    }

    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      for (let c = 0; c < row.length; c++) {
        const cellText = String(row[c] || '').trim();
        if (!cellText) continue;
        const header = normalizeHeader(cellText);
        if (!ministryText && (header === 'MINISTRYNAME' || header.includes('MINISTRYNAME') || header === 'MINISTRY')) {
          const right = String(row[c + 1] || '').trim();
          const below = String((grid[r + 1] || [])[c] || '').trim();
          const below2 = String((grid[r + 2] || [])[c] || '').trim();
          const below3 = String((grid[r + 3] || [])[c] || '').trim();
          const pick = [right, below3, below2, below, cellText].find(v => v && !normalizeHeader(v).includes('DETAILOBJECTDESC'));
          ministryText = pick || '';
        }
      }
    }

    const headerRowIndex = grid.findIndex(row =>
      row.some(cell => {
        const n = normalizeHeader(cell);
        return n.includes('DETAIL') && n.includes('OBJECT');
      })
    );

    const headerRow = headerRowIndex >= 0 ? grid[headerRowIndex] : grid[0] || [];
    const headerMap: Record<string, number> = {};
    headerRow.forEach((h, idx) => {
      headerMap[normalizeHeader(h)] = idx;
    });

    const getIndex = (predicate: (key: string) => boolean) => {
      const entry = Object.entries(headerMap).find(([key]) => predicate(key));
      return entry ? entry[1] : -1;
    };

    const detailIdx = getIndex(k => (k.includes('DETAIL') && k.includes('OBJECT')) || k.includes('HEAD') || k.includes('CODE') || k.includes('DESCRIPTION'));
    const budgetIdx = getIndex(k => (k.includes('ORIGINAL') || k.includes('GRANT') || k.includes('BUDGET')) && !k.includes('MODIFIED') && !k.includes('REVISED') && !k.includes('DATE'));
    const modifiedIdx = getIndex(k => k.includes('MODIFIED') || k.includes('REVISED') || k.includes('FINAL'));
    const descIdx = getIndex(k => k.includes('DESC') || k.includes('PARTICULAR') || k.includes('NAME') || k.includes('TITLE'));
    const anticipatedIdx = getIndex(k => k.includes('ANTICIPATED') || k.includes('PROBABLE') || k.includes('EXPECTED'));

    const monthIndexMap: Record<string, number> = {};
    MONTH_KEYS.forEach((key, i) => {
      let idx = getIndex(k => k.includes(`${key}AMOUNT`));
      if (idx === -1) {
        idx = getIndex(k => {
          const normalized = k.replace(/[^A-Z]/g, '');
          return normalized === key || normalized === FULL_MONTH_NAMES[i] ||
                 normalized === `${key}EXP` || normalized === `${FULL_MONTH_NAMES[i]}EXP` ||
                 normalized === `${key}EXPENDITURE` || normalized === `${FULL_MONTH_NAMES[i]}EXPENDITURE`;
        });
      }
      if (idx === -1) {
        idx = getIndex(k => (k.includes(key) || k.includes(FULL_MONTH_NAMES[i])) && !k.includes('TOTAL') && !k.includes('PROGRESSIVE') && !k.includes('BALANCE'));
      }
      if (idx >= 0) monthIndexMap[key] = idx;
    });

    const map: BudgetMap = {};
    const dataRows = grid.slice(headerRowIndex >= 0 ? headerRowIndex + 1 : 1);

    for (const row of dataRows) {
      const detail = detailIdx >= 0 ? String(row[detailIdx] || '') : '';
      if (!detail.trim()) continue;
      const code = extractCode(detail);
      if (!code) continue;

      const budget = budgetIdx >= 0 ? parseNumber(row[budgetIdx]) : 0;
      const modified = modifiedIdx >= 0 ? parseNumber(row[modifiedIdx]) : 0;
      const anticipated = anticipatedIdx >= 0 ? parseNumber(row[anticipatedIdx]) : 0;

      const months: Record<string, number> = {};
      MONTH_KEYS.forEach(key => {
        const idx = monthIndexMap[key];
        months[key] = idx >= 0 ? parseNumber(row[idx]) : 0;
      });

      let cleanDesc = detail;
      if (descIdx >= 0 && descIdx !== detailIdx) {
        const val = String(row[descIdx] || '').trim();
        if (val) cleanDesc = val;
      }
      if (cleanDesc.includes(code)) {
        cleanDesc = cleanDesc.replace(code, '').trim();
      }
      cleanDesc = cleanDesc.replace(/^[-–]\s*/, '').trim();

      map[code] = { budget, modified, months, desc: cleanDesc, anticipated };
    }

    return { map, yearFound, ministryText };
  };

  const handlePreviousImport = async (file: File) => {
    try {
      setIsImportingPrev(true);
      setImportError(null);
      const { map, yearFound, ministryText } = await parseExpenditureFile(file);
      setPreviousMap(map);
      setPrevFileName(file.name);
      setPreviousYear(yearFound);
      setPreviousOfficeName(ministryText);

      const errors: string[] = [];
      if (currentYearFound && yearFound && currentYearFound - yearFound !== 1) {
        errors.push(`Year mismatch! Previous year is ${yearFound} but Current year is ${currentYearFound}.`);
      }
      if (currentOfficeName && ministryText && currentOfficeName !== ministryText) {
        errors.push(`Office mismatch detected.`);
      }
      if (errors.length > 0) setImportError(errors.join(' '));

      setFiscalYearStart(yearFound);
      if (!officeName && ministryText) {
        const { office, ddo } = buildOfficeAndDdo(ministryText);
        if (ddo && !ddoCode) setDdoCode(ddo);
        setOfficeName(office || ministryText);
      }
    } catch (e) {
      setImportError('Failed to import previous expenditure file. Please check the file format.');
    } finally {
      setIsImportingPrev(false);
    }
  };

  const handleCurrentImport = async (file: File) => {
    try {
      setIsImportingCurr(true);
      setImportError(null);
      const { map, yearFound, ministryText } = await parseExpenditureFile(file);
      setCurrentMap(map);
      setCurrentFileName(file.name);
      setCurrentYearFound(yearFound);
      setCurrentOfficeName(ministryText);

      const errors: string[] = [];
      if (previousYear && yearFound && yearFound - previousYear !== 1) {
        errors.push(`Year mismatch! Previous year is ${previousYear} but Current year is ${yearFound}.`);
      }
      if (previousOfficeName && ministryText && previousOfficeName !== ministryText) {
        errors.push(`Office mismatch detected.`);
      }
      if (errors.length > 0) setImportError(errors.join(' '));

      setFiscalYearStart(previousYear || (yearFound - 1));
      if (ministryText) {
        const { office, ddo } = buildOfficeAndDdo(ministryText);
        if (ddo) setDdoCode(ddo);
        setOfficeName(office || ministryText);
      }
    } catch (e) {
      setImportError('Failed to import current expenditure file. Please check the file format.');
    } finally {
      setIsImportingCurr(false);
    }
  };

  // Calculate row for BM20
  const calcRow = (code: string): Bm20CalcResult => {
    const isSalary = isSalaryCode(code);
    const current = currentMap[code];
    const previous = previousMap[code];
    const original = current?.budget || 0;
    const modified = current?.modified || 0;
    const actualPrev7 = sumMonths(previous?.months || {}, ['DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN']);
    const actualCurr5 = sumMonths(current?.months || {}, ['JUL', 'AUG', 'SEP', 'OCT', 'NOV']);
    const totalColumns = actualPrev7 + actualCurr5;

    let anticipated: number;
    if (isSalary) {
      anticipated = current?.anticipated || 0;
      if (code === 'A0124L' && (actualPrev7 + actualCurr5 > 0)) {
        anticipated = 0;
      }
    } else {
      const remaining = original - actualCurr5;
      anticipated = remaining > 0 ? remaining : 0;
    }

    const totalExpend = actualCurr5 + anticipated;
    const surrender = Math.max(0, original - totalExpend);
    const excess = Math.max(0, totalExpend - original);

    return { original, modified, actualPrev7, actualCurr5, totalColumns, anticipated, totalExpend, surrender, excess };
  };

  // Get all codes from maps
  const allCodes = useMemo(() => {
    const codes = new Set<string>();
    Object.keys(currentMap).forEach(c => codes.add(c));
    Object.keys(previousMap).forEach(c => codes.add(c));
    ALL_CODE_LIST.forEach(c => codes.add(c));
    return Array.from(codes).sort();
  }, [currentMap, previousMap]);

  // Categorize codes
  const { payCodes, allowCodes, nonSalaryCodes } = useMemo(() => {
    const pay: string[] = [];
    const allow: string[] = [];
    const non: string[] = [];
    allCodes.forEach(code => {
      if (code.startsWith('A011')) pay.push(code);
      else if (code.startsWith('A012')) allow.push(code);
      else non.push(code);
    });
    return { payCodes: pay, allowCodes: allow, nonSalaryCodes: non };
  }, [allCodes]);

  // Sum rows
  const sumRows = (codes: string[]): Bm20CalcResult => {
    return sumBm20Calcs(codes.map(calcRow));
  };

  // Check if row is empty
  const isRowEmpty = (row: Bm20CalcResult) => {
    return row.original === 0 && row.modified === 0 && row.actualPrev7 === 0 && row.actualCurr5 === 0 && row.anticipated === 0;
  };

  // Create row
  const createRow = (code: string): Bm20Row => {
    const desc = CODE_DESCRIPTIONS[code] || currentMap[code]?.desc || previousMap[code]?.desc || code;
    return { code, desc, ...calcRow(code) };
  };

  // Calculate totals
  const totalPay = sumRows(payCodes);
  const totalAllow = sumRows(allowCodes);
  const totalSalary = sumBm20Calcs([totalPay, totalAllow]);
  const totalNon = sumRows(nonSalaryCodes);
  const grandTotal = sumBm20Calcs([totalSalary, totalNon]);

  // Build BM20 rows
  const bm20Rows: Bm20Row[] = [
    ...payCodes.filter(c => !isRowEmpty(calcRow(c)) || c === 'A01102' || c === 'A01152').map(createRow),
    { code: '', desc: 'Total Pay', ...totalPay, isRed: true, isBold: true },
    ...allowCodes.filter(c => !isRowEmpty(calcRow(c))).map(createRow),
    { code: '', desc: 'Total Allowances', ...totalAllow, isBold: true },
    { code: '', desc: 'Total Salary', ...totalSalary, isRed: true, isBold: true },
    ...nonSalaryCodes.filter(c => !isRowEmpty(calcRow(c))).map(createRow),
    { code: '', desc: 'TOTAL NON SALARY', ...totalNon, isBold: true },
    { code: '', desc: 'GRAND TOTAL', ...grandTotal, isRed: true, isBold: true }
  ];

  // Fiscal year labels
  const fiscalYearLabel = `${fiscalYearStart}-${String(fiscalYearStart + 1).slice(-2)}`;
  const currentFiscalYearLabel = currentYearFound
    ? `${currentYearFound}-${String(currentYearFound + 1).slice(-2)}`
    : fiscalYearLabel;
  const previousFiscalYearLabel = currentYearFound
    ? `${currentYearFound - 1}-${String(currentYearFound).slice(-2)}`
    : `${fiscalYearStart - 1}-${String(fiscalYearStart).slice(-2)}`;

  // Print handler
  const handleActiveFormPrint = () => {
    const printConfigs: Record<string, { id: string; title: string; size: string }> = {
      bm20: { id: 'bm20-print-root', title: 'BM 20', size: 'A4 landscape' },
      bm2: { id: 'bm2-print-root', title: 'BM 2 - Budget Estimates', size: 'A4 landscape' },
      posts: { id: 'posts-print-root', title: 'Sanctioned Posts', size: 'A4 landscape' },
      bm6: { id: 'bm6-print-root', title: 'BM 6 - Pay & Allowances Statement', size: 'legal landscape' },
    };

    const config = printConfigs[activeForm];
    if (!config) return;

    const el = document.getElementById(config.id);
    if (!el) return;

    openPrintPreview({
      title: config.title,
      html: el.innerHTML,
      pageCss: `@page { size: ${config.size}; margin: ${activeForm === 'bm6' ? '6mm' : '10mm'}; }`,
      bodyCss: 'font-family: Arimo, Arial, sans-serif; color:#000;'
    });
  };

  // Save/Load budget
  const handleSaveBudget = () => {
    const id = `${Date.now()}`;
    const snapTitle = `${officeName || 'Office'} ${ddoCode || ''} ${fiscalYearStart}-${String(fiscalYearStart + 1).slice(-2)}`.trim();
    const ddoKey = `budgeting/posts/overrides/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
    const sancKey = `budgeting/posts/sanctioned/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;

    let overrides: Record<string, { cfy: number; next: number }> = {};
    let sanctioned: Record<string, number> = {};
    let bm2Edits: Record<string, { rev25?: number; est26?: number }> = {};

    try { overrides = JSON.parse(localStorage.getItem(ddoKey) || '{}'); } catch {}
    try { sanctioned = JSON.parse(localStorage.getItem(sancKey) || '{}'); } catch {}
    try {
      const { loadBm2Edits } = require('../budgeting/budget/storage');
      bm2Edits = loadBm2Edits(ddoCode || '') || {};
    } catch {}

    const snapshot = {
      id,
      title: snapTitle,
      officeName,
      ddoCode,
      fiscalYearLabel: `${fiscalYearStart}-${String(fiscalYearStart + 1).slice(-2)}`,
      previousMap,
      currentMap,
      overrides,
      sanctioned,
      bm2Edits,
      createdAt: new Date().toISOString(),
    };

    setSnapshots(saveBudgetSnapshot(snapshot));
    setSelectedSnapshotId(id);
  };

  const handleLoadBudget = () => {
    if (!selectedSnapshotId) return;
    const snap = snapshots.find(s => s.id === selectedSnapshotId);
    if (!snap) return;

    setOfficeName(snap.officeName);
    setDdoCode(snap.ddoCode);
    const fyStart = Number(String(snap.fiscalYearLabel).slice(0, 4));
    if (Number.isFinite(fyStart) && fyStart >= 2000) setFiscalYearStart(fyStart);
    setPreviousMap(snap.previousMap || {});
    setCurrentMap(snap.currentMap || {});

    try {
      const ddoKey = `budgeting/posts/overrides/${(snap.ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
      localStorage.setItem(ddoKey, JSON.stringify(snap.overrides || {}));
    } catch {}
    try {
      const sancKey = `budgeting/posts/sanctioned/${(snap.ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
      localStorage.setItem(sancKey, JSON.stringify(snap.sanctioned || {}));
    } catch {}
    try {
      const { saveBm2Edits } = require('../budgeting/budget/storage');
      saveBm2Edits(snap.ddoCode || '', snap.bm2Edits || {});
    } catch {}
  };

  const formTabs = [
    { id: 'bm20', label: 'BM 20', icon: 'description', desc: 'Revised Budget' },
    { id: 'bm2', label: 'BM 2', icon: 'calculate', desc: 'Budget Estimates' },
    { id: 'bm6', label: 'BM 6', icon: 'payments', desc: 'Pay & Allowances' },
    { id: 'posts', label: 'Posts', icon: 'group', desc: 'Sanctioned Posts' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={`flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start ${isUrdu ? 'lg:flex-row-reverse' : ''} no-print`}>
        <div>
          <h3 className="text-2xl font-bold text-on-surface">
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              Revised & Proposed Budget
            </span>
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Import expenditure data and generate budget forms for submission
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSaveBudget}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-on-surface font-medium text-sm hover:bg-surface-container-high hover:border-primary/40 hover:text-primary transition-all duration-200 shadow-sm"
          >
            <AppIcon name="save" size={18} />
            Save
          </button>
          
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-2.5 text-sm font-medium bg-surface-container rounded-xl border border-outline-variant/40 text-on-surface cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-w-[160px]"
              value={selectedSnapshotId || ''}
              onChange={e => setSelectedSnapshotId(e.target.value || null)}
            >
              <option value="">📂 Load Budget</option>
              {snapshots.map(s => (
                <option key={s.id} value={s.id}>📄 {s.title}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              <AppIcon name="expand_more" size={18} />
            </div>
          </div>
          
          <button
            onClick={handleLoadBudget}
            disabled={!selectedSnapshotId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary font-medium text-sm hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          >
            <AppIcon name="folder_open" size={18} />
            Load
          </button>
          
          <button
            onClick={handleActiveFormPrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-on-primary font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <AppIcon name="print" size={18} />
            Print {activeForm.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-gradient-to-br from-surface via-surface-container-low to-surface rounded-2xl border border-outline-variant/30 p-6 shadow-sm no-print">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <AppIcon name="cloud_upload" size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-on-surface">Import Expenditure Data</h4>
            <p className="text-xs text-on-surface-variant">Upload XLSX files from DAO system</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Previous Year Import */}
          <label className={`group relative flex items-center justify-center gap-3 px-5 py-5 rounded-xl cursor-pointer transition-all duration-300 border-2 border-dashed ${
            prevFileName 
              ? 'border-green-500/50 bg-green-500/5' 
              : 'border-outline-variant/40 bg-surface-container-low/50 hover:border-primary/50 hover:bg-primary/5'
          } ${isImportingPrev ? 'opacity-70 pointer-events-none' : ''}`}>
            <input 
              type="file" 
              accept=".xlsx" 
              className="hidden" 
              onChange={e => e.target.files?.[0] && handlePreviousImport(e.target.files[0])} 
            />
            <div className={`p-3 rounded-xl transition-all ${
              prevFileName ? 'bg-green-500/20 text-green-600' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary'
            }`}>
              <AppIcon name={isImportingPrev ? 'hourglass_empty' : prevFileName ? 'check_circle' : 'upload_file'} size={24} className={isImportingPrev ? 'animate-spin' : ''} />
            </div>
            <div className="text-left">
              <div className="font-semibold text-on-surface">
                {isImportingPrev ? 'Importing...' : prevFileName ? 'Previous Year Loaded' : 'Import Previous Year'}
              </div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                {prevFileName || 'Click to upload XLSX file'}
              </div>
              {previousYear && (
                <div className="text-xs text-green-600 font-medium mt-1">
                  FY {previousYear}-{String(previousYear + 1).slice(-2)}
                </div>
              )}
            </div>
          </label>

          {/* Current Year Import */}
          <label className={`group relative flex items-center justify-center gap-3 px-5 py-5 rounded-xl cursor-pointer transition-all duration-300 border-2 border-dashed ${
            currentFileName 
              ? 'border-green-500/50 bg-green-500/5' 
              : 'border-outline-variant/40 bg-surface-container-low/50 hover:border-secondary/50 hover:bg-secondary/5'
          } ${isImportingCurr ? 'opacity-70 pointer-events-none' : ''}`}>
            <input 
              type="file" 
              accept=".xlsx" 
              className="hidden" 
              onChange={e => e.target.files?.[0] && handleCurrentImport(e.target.files[0])} 
            />
            <div className={`p-3 rounded-xl transition-all ${
              currentFileName ? 'bg-green-500/20 text-green-600' : 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-on-secondary'
            }`}>
              <AppIcon name={isImportingCurr ? 'hourglass_empty' : currentFileName ? 'check_circle' : 'upload_file'} size={24} className={isImportingCurr ? 'animate-spin' : ''} />
            </div>
            <div className="text-left">
              <div className="font-semibold text-on-surface">
                {isImportingCurr ? 'Importing...' : currentFileName ? 'Current Year Loaded' : 'Import Current Year'}
              </div>
              <div className="text-xs text-on-surface-variant mt-0.5">
                {currentFileName || 'Click to upload XLSX file'}
              </div>
              {currentYearFound && (
                <div className="text-xs text-green-600 font-medium mt-1">
                  FY {currentYearFound}-{String(currentYearFound + 1).slice(-2)}
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Error Message */}
        {importError && (
          <div className="mt-4 p-4 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-600">
              <AppIcon name="error" size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-red-700">Import Error</div>
              <div className="text-sm text-red-600/80 mt-0.5">{importError}</div>
            </div>
            <button 
              onClick={() => setImportError(null)}
              className="ml-auto p-1 rounded-lg hover:bg-red-500/20 text-red-600 transition-colors"
            >
              <AppIcon name="close" size={16} />
            </button>
          </div>
        )}

        {/* Office Info */}
        {(officeName || ddoCode) && (
          <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 text-primary">
              <AppIcon name="business" size={18} />
              <span className="font-semibold text-sm">Detected Office Information</span>
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><span className="text-on-surface-variant">Office:</span> <span className="font-medium text-on-surface">{officeName || 'N/A'}</span></div>
              <div><span className="text-on-surface-variant">DDO Code:</span> <span className="font-mono font-medium text-on-surface">{ddoCode || 'N/A'}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Form Tabs */}
      <div className="flex flex-wrap gap-2 no-print">
        {formTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveForm(tab.id as any)}
            className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeForm === tab.id
                ? 'bg-gradient-to-r from-primary to-primary/90 text-on-primary shadow-lg shadow-primary/25'
                : 'bg-surface-container text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high hover:border-primary/30 hover:text-primary'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${
              activeForm === tab.id ? 'bg-white/20' : 'bg-surface-variant/50'
            }`}>
              <AppIcon name={tab.icon} size={18} />
            </div>
            <div className="text-left">
              <div>{tab.label}</div>
              <div className={`text-[10px] font-normal ${activeForm === tab.id ? 'text-on-primary/70' : 'text-on-surface-variant/70'}`}>
                {tab.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Form Content */}
      {activeForm === 'bm20' && (
        <div id="bm20-print-root">
          <Bm20
            officeName={officeName}
            ddoCode={ddoCode}
            fiscalYearLabel={currentFiscalYearLabel}
            previousFiscalYearLabel={previousFiscalYearLabel}
            rows={bm20Rows}
            employees={employees}
            currentMap={currentMap}
          />
        </div>
      )}

      {activeForm === 'bm2' && (
        <div id="bm2-print-root">
          <Card variant="outlined" className="p-0 bg-surface overflow-hidden rounded-2xl print:bg-transparent print:shadow-none">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-surface-container to-surface-container-low border-b border-outline-variant/20 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <AppIcon name="calculate" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Budget Estimates (BM-2)</h3>
                  <p className="text-xs text-on-surface-variant">Proposed budget for next fiscal year</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <BudgetEstimatesForm
                officeName={officeName}
                ddoCode={ddoCode}
                fiscalYearLabel={currentFiscalYearLabel}
                employees={employees}
                currentMap={currentMap}
                previousMap={previousMap}
              />
            </div>
          </Card>
        </div>
      )}

      {activeForm === 'posts' && (
        <div id="posts-print-root">
          <Card variant="outlined" className="p-0 bg-surface overflow-hidden rounded-2xl print:bg-transparent print:shadow-none">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-surface-container to-surface-container-low border-b border-outline-variant/20 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <AppIcon name="group" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Sanctioned Posts</h3>
                  <p className="text-xs text-on-surface-variant">Staff positions and vacancies</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <SanctionedPostsReport
                officeName={officeName}
                ddoCode={ddoCode}
                fiscalYearLabel={currentFiscalYearLabel}
                employees={employees}
              />
            </div>
          </Card>
        </div>
      )}

      {activeForm === 'bm6' && (
        <div id="bm6-print-root">
          <Card variant="outlined" className="p-0 bg-surface overflow-hidden rounded-2xl print:bg-transparent print:shadow-none">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-surface-container to-surface-container-low border-b border-outline-variant/20 no-print">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <AppIcon name="payments" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">Pay & Allowances Statement (BM-6)</h3>
                  <p className="text-xs text-on-surface-variant">Detailed salary projections</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <PayAllowancesStatement
                officeName={officeName}
                ddoCode={ddoCode}
                fiscalYearLabel={currentFiscalYearLabel}
                employees={employees}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================================
// EXPENDITURE TAB
// ============================================================

type DetailMap = Record<string, { budget: number; months: Record<string, number> }>;

const ExpenditureTab = () => {
  const { t, isUrdu } = useLanguage();
  const currentYear = new Date().getFullYear();
  const [yearInput, setYearInput] = useState(String(currentYear));
  const [years, setYears] = useState<number[]>(() => listExpenditureYears());
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEditingRows, setIsEditingRows] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [monthKey, setMonthKey] = useState(() => {
    const m = new Date().getMonth();
    const keys = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return keys[m] || 'JUL';
  });
  const [fiscalYearStart, setFiscalYearStart] = useState(currentYear);
  const [officeName, setOfficeName] = useState('');
  const [ddoCode, setDdoCode] = useState('');
  const [detailMap, setDetailMap] = useState<DetailMap>({});
  const [savedStatements, setSavedStatements] = useState(() => loadExpenditureStatements(currentYear));
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [workingRows, setWorkingRows] = useState<ExpenditureRowData[] | null>(null);
  const [isImportingXlsx, setIsImportingXlsx] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  useEffect(() => {
    ensureExpenditureYearFolder(currentYear);
    setYears(listExpenditureYears());
  }, [currentYear]);

  useEffect(() => {
    setSavedStatements(loadExpenditureStatements(fiscalYearStart));
  }, [fiscalYearStart]);

  useEffect(() => {
    if (!isEditingRows) setWorkingRows(null);
  }, [isEditingRows]);

  const handleCreateYear = () => {
    const year = Number(yearInput);
    if (!Number.isFinite(year) || year < 2000) return;
    ensureExpenditureYearFolder(year);
    setYears(listExpenditureYears());
  };

  const handleFileImport = async (file: File) => {
    try {
      setIsImportingXlsx(true);
      setImportNotice(null);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });

      let yearFound = currentYear;
      let ministryText = '';
      let ddoText = '';
      const textCells = grid.flat().filter(cell => typeof cell === 'string') as string[];

      for (const cell of textCells) {
        const yearMatch = cell.match(/20\d{2}/);
        if (yearMatch) {
          yearFound = Number(yearMatch[0]);
          break;
        }
      }

      for (let r = 0; r < grid.length; r++) {
        const row = grid[r];
        for (let c = 0; c < row.length; c++) {
          const cellText = String(row[c] || '').trim();
          if (!cellText) continue;
          const header = normalizeHeader(cellText);

          if (!ministryText && (header === 'MINISTRYNAME' || header.includes('MINISTRYNAME') || header === 'MINISTRY')) {
            const right = String(row[c + 1] || '').trim();
            const below = String((grid[r + 1] || [])[c] || '').trim();
            const below2 = String((grid[r + 2] || [])[c] || '').trim();
            const below3 = String((grid[r + 3] || [])[c] || '').trim();
            const below3Right = String((grid[r + 3] || [])[c + 1] || '').trim();
            const pick = [right, below3, below2, below, below3Right, cellText].find(v => v && !normalizeHeader(v).includes('DETAILOBJECTDESC'));
            ministryText = pick || '';
          }
          if (!ministryText && header.includes('OFFICEOFTHE') && !header.includes('DETAILOBJECTDESC')) {
            ministryText = cellText;
          }
          if (!ddoText && header.includes('DDO') && header.includes('CODE')) {
            const right = String(row[c + 1] || '').trim();
            const below = String((grid[r + 1] || [])[c] || '').trim();
            ddoText = right || below || cellText;
          }
        }
      }

      const headerRowIndex = grid.findIndex(row =>
        row.some(cell => {
          const n = normalizeHeader(cell);
          return n.includes('DETAIL') && n.includes('OBJECT');
        })
      );

      if (headerRowIndex >= 0) {
        for (let r = headerRowIndex + 1; r <= Math.min(headerRowIndex + 10, grid.length - 1); r++) {
          const row = grid[r];
          for (const cell of row) {
            const text = String(cell || '').trim();
            if (!text) continue;
            const upper = text.toUpperCase();
            if (/^[A-Z]{2}\d{4}\s*[-–]/.test(text)) {
              ministryText = text;
              break;
            }
            if (upper.includes('GOVT') && (upper.includes('SCHOOL') || upper.includes('COLLEGE'))) {
              ministryText = text;
              break;
            }
          }
          if (ministryText) break;
        }
      }

      if (!ministryText) {
        for (const cell of textCells) {
          const upper = cell.toUpperCase();
          if (upper.includes('DDO') || upper.includes('MINISTRY') || upper.includes('GOVT')) {
            ministryText = cell;
            break;
          }
        }
      }

      if (!ddoText) {
        for (const cell of textCells) {
          if (/[A-Z]{2}\d{4}/.test(cell)) {
            ddoText = cell;
            break;
          }
        }
      }

      const ddoMatch = ddoText.match(/[A-Z]{2}\d{4}/) || ministryText.match(/[A-Z]{2}\d{4}/);
      const ddo = ddoMatch ? ddoMatch[0] : '';
      const { office } = buildOfficeAndDdo(ministryText);

      setFiscalYearStart(yearFound);
      setDdoCode(ddo);
      setOfficeName(office || ministryText.replace(ddo, '').trim());

      const headerRow = headerRowIndex >= 0 ? grid[headerRowIndex] : grid[0] || [];
      const headerMap: Record<string, number> = {};
      headerRow.forEach((h, idx) => {
        headerMap[normalizeHeader(h)] = idx;
      });

      const getIndex = (predicate: (key: string) => boolean) => {
        const entry = Object.entries(headerMap).find(([key]) => predicate(key));
        return entry ? entry[1] : -1;
      };

      const detailIdx = getIndex(k => k.includes('DETAIL') && k.includes('OBJECT'));
      const budgetIdx = getIndex(k => k.includes('ORIGINAL') && k.includes('BUDGET'));
      const monthIndexMap: Record<string, number> = {};

      MONTH_OPTIONS.forEach(m => {
        const idx = getIndex(k => k.includes(`${m.key}AMOUNT`));
        if (idx >= 0) monthIndexMap[m.key] = idx;
      });

      const map: DetailMap = {};
      const dataRows = grid.slice(headerRowIndex >= 0 ? headerRowIndex + 1 : 1);

      for (const row of dataRows) {
        const detail = detailIdx >= 0 ? String(row[detailIdx] || '') : '';
        if (!detail.trim()) continue;
        const code = extractCode(detail);
        if (!code) continue;

        const budget = budgetIdx >= 0 ? parseNumber(row[budgetIdx]) : 0;
        const months: Record<string, number> = {};
        MONTH_OPTIONS.forEach(m => {
          const idx = monthIndexMap[m.key];
          months[m.key] = idx >= 0 ? parseNumber(row[idx]) : 0;
        });
        map[code] = { budget, months };
      }

      setDetailMap(map);
      setImportNotice(`Successfully imported ${Object.keys(map).length} budget codes`);
      setTimeout(() => setImportNotice(null), 4000);
    } catch (e) {
      setImportNotice('Failed to import XLSX. Please verify the file structure.');
    } finally {
      setIsImportingXlsx(false);
    }
  };

  const monthLabel = MONTH_OPTIONS.find(m => m.key === monthKey)?.label || 'Month';
  const monthYear = ['JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].includes(monthKey) ? fiscalYearStart : fiscalYearStart + 1;
  const monthTitle = `${monthLabel.toUpperCase()} ${monthYear}`;
  const fiscalYearLabel = `${fiscalYearStart}-${String(fiscalYearStart + 1).slice(-2)}`;

  // Build detail rows
  const detailRows = useMemo(() => {
    const monthIndex = MONTH_KEYS.indexOf(monthKey as any);
    const prevKeys = monthIndex > 0 ? MONTH_KEYS.slice(0, monthIndex) : [];

    const calcForCode = (code: string): ExpenditureCalc => {
      const data = detailMap[code];
      const budget = data?.budget || 0;
      const expMonth = data?.months?.[monthKey] || 0;
      const prevExp = prevKeys.reduce((sum, key) => sum + (data?.months?.[key] || 0), 0);
      const totalExp = expMonth + prevExp;
      const { balance, excess } = calcBalanceExcess(budget, totalExp);
      return { budget, expMonth, prevExp, totalExp, balance, excess };
    };

    const buildRow = (code: string): ExpenditureRowData => ({
      head: buildRowHead(code),
      ...calcForCode(code),
    });

    const buildTotalRow = (label: string, calc: ExpenditureCalc, flags?: { isYellow?: boolean; isBold?: boolean }): ExpenditureRowData => ({
      head: label,
      ...calc,
      isYellow: flags?.isYellow ?? true,
      isBold: flags?.isBold ?? true,
    });

    const payCalcs = PAY_CODE_LIST.map(calcForCode);
    const allowCalcs = ALLOWANCE_CODE_LIST.map(calcForCode);
    const nonSalaryCalcs = NON_SALARY_CODE_LIST.map(calcForCode);

    const totalPay = sumExpenditureCalcs(payCalcs);
    const totalAllow = sumExpenditureCalcs(allowCalcs);
    const totalSalary = sumExpenditureCalcs([totalPay, totalAllow]);
    const totalNon = sumExpenditureCalcs(nonSalaryCalcs);
    const grandTotal = sumExpenditureCalcs([totalSalary, totalNon]);

    return [
      ...PAY_CODE_LIST.map(buildRow),
      buildTotalRow('Total Pay', totalPay),
      ...ALLOWANCE_CODE_LIST.map(buildRow),
      buildTotalRow('Total Allowances', totalAllow, { isYellow: false, isBold: true }),
      buildTotalRow('Total Salary', totalSalary),
      ...NON_SALARY_CODE_LIST.map(buildRow),
      buildTotalRow('TOTAL NON SALARY', totalNon, { isYellow: false, isBold: true }),
      buildTotalRow('GRAND TOTAL', grandTotal),
    ];
  }, [detailMap, monthKey]);

  // Recalculate rows after edits
  const recalcRows = (rows: ExpenditureRowData[]): ExpenditureRowData[] => {
    const normalizeCode = (head: string): string => extractCode(head);

    const withTotals = rows.map(row => {
      const code = normalizeCode(row.head);
      if (!code) return row;

      const budget = parseNumber(row.budget);
      const expMonth = parseNumber(row.expMonth);
      const prevExp = parseNumber(row.prevExp);
      const totalExp = expMonth + prevExp;
      const { balance, excess } = calcBalanceExcess(budget, totalExp);

      return { ...row, budget, expMonth, prevExp, totalExp, balance, excess };
    });

    const sumByCodes = (codes: string[]) => {
      return withTotals.reduce(
        (acc, row) => {
          const code = normalizeCode(row.head);
          if (!codes.includes(code)) return acc;
          return {
            budget: acc.budget + parseNumber(row.budget),
            expMonth: acc.expMonth + parseNumber(row.expMonth),
            prevExp: acc.prevExp + parseNumber(row.prevExp),
            totalExp: acc.totalExp + parseNumber(row.totalExp),
          };
        },
        { budget: 0, expMonth: 0, prevExp: 0, totalExp: 0 }
      );
    };

    const totalPay = sumByCodes(PAY_CODE_LIST);
    const totalAllow = sumByCodes(ALLOWANCE_CODE_LIST);
    const totalSalary = {
      budget: totalPay.budget + totalAllow.budget,
      expMonth: totalPay.expMonth + totalAllow.expMonth,
      prevExp: totalPay.prevExp + totalAllow.prevExp,
      totalExp: totalPay.totalExp + totalAllow.totalExp,
    };
    const totalNon = sumByCodes(NON_SALARY_CODE_LIST);
    const grandTotal = {
      budget: totalSalary.budget + totalNon.budget,
      expMonth: totalSalary.expMonth + totalNon.expMonth,
      prevExp: totalSalary.prevExp + totalNon.prevExp,
      totalExp: totalSalary.totalExp + totalNon.totalExp,
    };

    const applySummary = (row: ExpenditureRowData, calc: { budget: number; expMonth: number; prevExp: number; totalExp: number }) => {
      const { balance, excess } = calcBalanceExcess(calc.budget, calc.totalExp);
      return { ...row, ...calc, balance, excess };
    };

    return withTotals.map(row => {
      if (row.head === 'Total Pay') return applySummary(row, totalPay);
      if (row.head === 'Total Allowances') return applySummary(row, totalAllow);
      if (row.head === 'Total Salary') return applySummary(row, totalSalary);
      if (row.head === 'TOTAL NON SALARY') return applySummary(row, totalNon);
      if (row.head === 'GRAND TOTAL') return applySummary(row, grandTotal);
      return row;
    });
  };

  const baseRows = useMemo(() => recalcRows(detailRows), [detailRows]);
  const selectedStatement = useMemo(
    () => savedStatements.find(s => s.id === selectedStatementId) || null,
    [savedStatements, selectedStatementId]
  );
  const displayRows = selectedStatement ? selectedStatement.rows : baseRows;
  const editableRows = workingRows || displayRows;

  const handleRowChange = (head: string, patch: Partial<ExpenditureRowData>) => {
    const next = editableRows.map(row => (row.head === head ? { ...row, ...patch } : row));
    setWorkingRows(recalcRows(next));
  };

  const handlePrintStatement = () => {
    const el = document.getElementById('monthly-expenditure-print');
    if (!el) return;
    openPrintPreview({
      title: 'Monthly Expenditure Statement',
      html: el.innerHTML,
      pageCss: '@page { size: A4 portrait; margin: 10mm; }'
    });
  };

  const handleSaveStatement = () => {
    if (!Number.isFinite(fiscalYearStart) || fiscalYearStart < 2000) return;
    const rawOffice = officeName || 'office';
    const cleanOffice = rawOffice.replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
    const title = `${cleanOffice || 'office'} ${monthLabel.toLowerCase()} ${monthYear}`;
    const rowsToSave = (workingRows && workingRows.length > 0) ? workingRows : displayRows;

    const record = {
      id: Date.now().toString(),
      title,
      officeName: rawOffice,
      ddoCode,
      fiscalYearLabel,
      monthKey,
      monthTitle,
      rows: rowsToSave,
      createdAt: new Date().toISOString()
    };

    const next = saveExpenditureStatement(fiscalYearStart, record);
    setSavedStatements(next);
    setSaveMessage(`Saved: ${title}`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSelectStatement = (statement: any) => {
    setSelectedStatementId(statement.id);
    setOfficeName(statement.officeName || '');
    setDdoCode(statement.ddoCode || '');
    const fyStart = Number(String(statement.fiscalYearLabel || '').split('-')[0]);
    if (Number.isFinite(fyStart)) setFiscalYearStart(fyStart);
    if (statement.monthKey) setMonthKey(statement.monthKey);
    setIsEditingRows(false);
    setIsEditingHeader(false);
    setWorkingRows(null);
  };

  const handleQuickPrint = (statement: any) => {
    handleSelectStatement(statement);
    setTimeout(() => handlePrintStatement(), 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start ${isUrdu ? 'lg:flex-row-reverse' : ''} no-print`}>
        <div>
          <h3 className="text-2xl font-bold text-on-surface">
            <span className="bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent bg-[length:200%_auto]">
              {t.budgeting.dailyTracking}
            </span>
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Track monthly expenditure and generate statements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const next = !isEditingRows;
              setIsEditingRows(next);
              setIsEditingHeader(next);
              if (next) setWorkingRows(recalcRows(displayRows));
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              isEditingRows
                ? 'bg-primary text-on-primary shadow-md'
                : 'border border-outline-variant/40 bg-surface text-on-surface hover:bg-surface-container-high hover:border-primary/40'
            }`}
          >
            <AppIcon name={isEditingRows ? 'check' : 'edit'} size={18} />
            {isEditingRows ? 'Done' : 'Edit'}
          </button>

          <button
            onClick={handleSaveStatement}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-on-surface font-medium text-sm hover:bg-surface-container-high hover:border-green-500/40 hover:text-green-600 transition-all duration-200"
          >
            <AppIcon name="save" size={18} />
            Save
          </button>

          <button
            onClick={handlePrintStatement}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-on-primary font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <AppIcon name="print" size={18} />
            Print
          </button>

          <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm cursor-pointer transition-all duration-200 ${
            isImportingXlsx
              ? 'bg-secondary/70 text-on-secondary'
              : 'bg-secondary text-on-secondary hover:shadow-lg hover:shadow-secondary/25 hover:scale-[1.02]'
          }`}>
            <input type="file" accept=".xlsx" className="hidden" onChange={e => e.target.files?.[0] && handleFileImport(e.target.files[0])} />
            <AppIcon name={isImportingXlsx ? 'hourglass_empty' : 'upload_file'} size={18} className={isImportingXlsx ? 'animate-spin' : ''} />
            {isImportingXlsx ? 'Importing...' : 'Import XLSX'}
          </label>
        </div>
      </div>

      {/* Controls Card */}
      <div className="bg-gradient-to-br from-surface via-surface-container-low to-surface rounded-2xl border border-outline-variant/30 p-5 shadow-sm no-print">
        <div className={`flex flex-wrap items-end gap-4 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Fiscal Year
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={yearInput}
                onChange={e => setYearInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-on-surface text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="2025"
              />
              <button
                onClick={handleCreateYear}
                className="px-3 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all"
              >
                <AppIcon name="add" size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              Month
            </label>
            <div className="relative">
              <select
                value={monthKey}
                onChange={e => setMonthKey(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border border-outline-variant/40 bg-surface text-on-surface text-sm font-medium cursor-pointer hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {MONTH_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                <AppIcon name="expand_more" size={18} />
              </div>
            </div>
          </div>

          {isEditingHeader && (
            <>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  Office Name
                </label>
                <input
                  type="text"
                  value={officeName}
                  onChange={e => setOfficeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-on-surface text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Office name"
                />
              </div>
              <div className="min-w-[120px]">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                  DDO Code
                </label>
                <input
                  type="text"
                  value={ddoCode}
                  onChange={e => setDdoCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface text-on-surface text-sm font-mono font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="XX0000"
                />
              </div>
            </>
          )}
        </div>

        {/* Notices */}
        {importNotice && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/30 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="p-2 rounded-lg bg-green-500/20 text-green-600">
              <AppIcon name="check_circle" size={18} />
            </div>
            <span className="text-sm font-medium text-green-700">{importNotice}</span>
          </div>
        )}

        {saveMessage && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600">
              <AppIcon name="save" size={18} />
            </div>
            <span className="text-sm font-medium text-blue-700">{saveMessage}</span>
          </div>
        )}

        {/* Year Folders */}
        {years.length > 0 && (
          <div className="mt-5 pt-5 border-t border-outline-variant/20">
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
              Available Year Folders
            </div>
            <div className="flex flex-wrap gap-2">
              {years.map(year => {
                const count = loadExpenditureStatements(year).length;
                return (
                  <button
                    key={year}
                    onClick={() => setFiscalYearStart(year)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      fiscalYearStart === year
                        ? 'bg-primary text-on-primary shadow-md'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <AppIcon name="folder" size={16} />
                    FY {year}-{String(year + 1).slice(-2)}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      fiscalYearStart === year ? 'bg-white/20' : 'bg-primary/10 text-primary'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Expenditure Statement */}
      <Card variant="outlined" className="p-0 bg-surface overflow-hidden rounded-2xl print:bg-transparent print:shadow-none">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-surface-container to-surface-container-low border-b border-outline-variant/20 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
              <AppIcon name="receipt_long" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-on-surface">Monthly Expenditure Statement</h3>
              <p className="text-xs text-on-surface-variant">{monthTitle} • FY {fiscalYearLabel}</p>
            </div>
          </div>
        </div>
        <div id="monthly-expenditure-print">
          <MonthlyExpenditureStatement
            officeName={officeName}
            monthTitle={monthTitle}
            ddoCode={ddoCode}
            fiscalYearLabel={fiscalYearLabel}
            rows={editableRows}
            editable={isEditingRows}
            onRowChange={handleRowChange}
          />
        </div>
      </Card>

      {/* Saved Statements */}
      {savedStatements.length > 0 && (
        <div className="no-print">
          <div className="flex items-center gap-2 mb-4">
            <AppIcon name="history" size={20} className="text-on-surface-variant" />
            <h4 className="font-semibold text-on-surface">Saved Statements</h4>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
              {savedStatements.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedStatements.map(statement => (
              <div
                key={statement.id}
                className="group p-4 bg-gradient-to-br from-surface to-surface-container-low rounded-xl border border-outline-variant/20 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                        {statement.title}
                      </span>
                    </div>
                    <div className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
                      <AppIcon name="schedule" size={12} />
                      {new Date(statement.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleSelectStatement(statement)}
                      className="p-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                      title="Open"
                    >
                      <AppIcon name="visibility" size={16} />
                    </button>
                    <button
                      onClick={() => handleQuickPrint(statement)}
                      className="p-2 rounded-lg hover:bg-secondary/10 hover:text-secondary transition-all"
                      title="Print"
                    >
                      <AppIcon name="print" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// TOKEN MANAGEMENT TAB
// ============================================================

const TokenManagementTab = () => {
  const { t, isUrdu } = useLanguage();
  const [tokens] = useState<TokenBillRecord[]>([
    {
      id: '1',
      token_no: '202501001',
      submission_date: '2025-01-15',
      amount: 450000,
      status: 'Encashed',
      encashment_date: '2025-01-20',
      reconciliation_status: 'Matched',
      objection_codes: []
    },
    {
      id: '2',
      token_no: '202501045',
      submission_date: '2025-01-28',
      amount: 125000,
      status: 'Objected',
      reconciliation_status: 'Unmatched',
      objection_codes: ['74', '102']
    }
  ]);

  const getStatusBadge = (status: TokenBillRecord['status']) => {
    const styles: Record<string, string> = {
      Encashed: 'bg-green-500/10 text-green-700 border-green-500/30',
      Objected: 'bg-red-500/10 text-red-700 border-red-500/30',
      Submitted: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    };
    const icons: Record<string, string> = {
      Encashed: 'check_circle',
      Objected: 'cancel',
      Submitted: 'schedule',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.Submitted}`}>
        <AppIcon name={icons[status] || 'schedule'} size={12} />
        {status}
      </span>
    );
  };

  const stats = [
    { label: t.budgeting.submitted, value: tokens.filter(t => t.status === 'Submitted').length, icon: 'pending_actions', color: 'primary' },
    { label: t.budgeting.encashed, value: tokens.filter(t => t.status === 'Encashed').length, icon: 'check_circle', color: 'success' },
    { label: t.budgeting.objected, value: tokens.filter(t => t.status === 'Objected').length, icon: 'error', color: 'error' },
  ];

  const colorMap: Record<string, { bg: string; border: string; iconBg: string; text: string }> = {
    primary: { bg: 'from-primary/5 to-primary/10', border: 'border-primary/20', iconBg: 'bg-primary/15 text-primary', text: 'text-primary' },
    success: { bg: 'from-green-500/5 to-green-500/10', border: 'border-green-500/20', iconBg: 'bg-green-500/15 text-green-600', text: 'text-green-600' },
    error: { bg: 'from-red-500/5 to-red-500/10', border: 'border-red-500/20', iconBg: 'bg-red-500/15 text-red-600', text: 'text-red-600' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center ${isUrdu ? 'sm:flex-row-reverse' : ''} no-print`}>
        <div>
          <h3 className="text-2xl font-bold text-on-surface">
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              {t.budgeting.tokenManagement}
            </span>
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Track and manage token bill submissions
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-on-primary font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
          <AppIcon name="add_card" size={18} />
          {t.budgeting.addToken}
        </button>
      </div>

      {/* Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        {stats.map((stat, idx) => {
          const colors = colorMap[stat.color];
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
            >
              <div className={`flex items-center gap-4 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                <div className={`p-3 rounded-xl ${colors.iconBg} transition-transform duration-300`}>
                  <AppIcon name={stat.icon} size={28} />
                </div>
                <div className={isUrdu ? 'text-right' : ''}>
                  <div className={`text-3xl font-bold ${colors.text}`}>{stat.value}</div>
                  <div className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold mt-1">{stat.label}</div>
                </div>
              </div>
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${colors.iconBg} opacity-20 blur-2xl`} />
            </div>
          );
        })}
      </div>

      {/* Tokens Table */}
      <div className="rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm bg-surface">
        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${isUrdu ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gradient-to-r from-surface-container to-surface-container-high border-b border-outline-variant/20">
              <tr>
                <th className="px-5 py-4 font-bold text-on-surface text-xs uppercase tracking-wider">{t.budgeting.tokenNo}</th>
                <th className="px-5 py-4 font-bold text-on-surface text-xs uppercase tracking-wider">{t.budgeting.submissionDate}</th>
                <th className="px-5 py-4 font-bold text-on-surface text-xs uppercase tracking-wider">{t.budgeting.amount}</th>
                <th className="px-5 py-4 font-bold text-on-surface text-xs uppercase tracking-wider">{t.budgeting.status}</th>
                <th className="px-5 py-4 font-bold text-on-surface text-xs uppercase tracking-wider">{t.budgeting.objectionCodes}</th>
                <th className="px-5 py-4 font-bold text-on-surface text-xs uppercase tracking-wider">{t.budgeting.encashmentDate}</th>
                <th className="px-5 py-4 font-bold text-on-surface text-xs uppercase tracking-wider">{t.budgeting.reconciliation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {tokens.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-full bg-surface-container">
                        <AppIcon name="receipt_long" size={32} className="text-on-surface-variant/50" />
                      </div>
                      <div className="text-on-surface-variant">{t.budgeting.noTokens}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                tokens.map((token, index) => (
                  <tr key={token.id} className={`hover:bg-primary/5 transition-colors duration-150 ${index % 2 === 0 ? '' : 'bg-surface-container-low/30'}`}>
                    <td className="px-5 py-4 font-mono font-bold text-primary">{token.token_no}</td>
                    <td className="px-5 py-4 text-on-surface-variant">{formatDate(token.submission_date)}</td>
                    <td className="px-5 py-4 font-mono font-semibold text-on-surface">{formatCurrency(token.amount)}</td>
                    <td className="px-5 py-4">{getStatusBadge(token.status)}</td>
                    <td className="px-5 py-4">
                      {token.objection_codes && token.objection_codes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {token.objection_codes.map((code, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-red-500/10 text-red-700 text-xs font-mono font-bold">
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/50">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {token.encashment_date ? formatDate(token.encashment_date) : <span className="text-on-surface-variant/50">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {token.reconciliation_status === 'Matched' ? (
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <AppIcon name="verified" size={16} />
                          {t.budgeting.matched}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 font-semibold">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <AppIcon name="warning" size={16} />
                          {t.budgeting.unmatched}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-5 bg-gradient-to-br from-primary/5 via-surface to-secondary/5 rounded-2xl border border-primary/20 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <AppIcon name="auto_awesome" size={24} />
        </div>
        <div className={isUrdu ? 'text-right' : ''}>
          <h5 className="font-bold text-primary text-sm">{t.budgeting.reconciliation}</h5>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            {t.budgeting.tokenDesc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Budgeting;