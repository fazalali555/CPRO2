import React, { useMemo } from 'react';
import { EmployeeRecord } from '../../types';
import { normalizeDesignation, toShortDesignation } from './bm2';
import { loadBm2Edits } from './storage';

export type Bm20Row = {
  code: string;
  desc: string;
  original: number;
  modified: number;
  actualPrev7: number;
  actualCurr5: number;
  totalColumns: number;
  anticipated: number;
  totalExpend: number;
  surrender: number;
  excess: number;
  isRed?: boolean;
  isBold?: boolean;
};

type Bm20Props = {
  officeName: string;
  fiscalYearLabel: string;
  previousFiscalYearLabel?: string;
  rows: Bm20Row[];
  breakAfterTotalSalary?: boolean;
  ddoCode?: string;
  employees?: EmployeeRecord[];
  currentMap?: Record<string, { budget: number; modified: number; months: Record<string, number>; desc?: string; anticipated?: number }>;
};

const formatNumber = (value: number | string | undefined) => {
  if (value === '' || value === null || value === undefined) return '';
  if (typeof value === 'string') {
    const num = Number(value.replace(/,/g, ''));
    return isNaN(num) ? value : num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
  }
  return value.toLocaleString('en-PK', { maximumFractionDigits: 0 });
};

export const Bm20: React.FC<Bm20Props> = ({ officeName, fiscalYearLabel, previousFiscalYearLabel, rows, breakAfterTotalSalary, ddoCode = '', employees = [], currentMap = {} }) => {
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap');
    @media print {
      @page { size: A4 landscape; margin: 12mm 10mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .font-arial { font-family: 'Arimo', Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin: 0; font-size: 11px; table-layout: fixed; }
    th, td { border: 1px solid black; padding: 4px 6px; vertical-align: middle; }
    .text-red-custom { color: #D00000; }
  `;

  const prevYearLabel = previousFiscalYearLabel || '2024-25';
  const currentYearLabel = fiscalYearLabel || '2025-26';

  const filteredEmployees = useMemo(() => {
    const targetDdo = (ddoCode || '').trim().toUpperCase();
    return (employees || []).filter(e => {
      const empDdo = (e.employees.ddo_code || '').trim().toUpperCase();
      const status = (e.employees.status || '').toLowerCase();
      if (!targetDdo) return status === 'active';
      return empDdo === targetDdo && status === 'active';
    });
  }, [employees, ddoCode]);

  const designationAgg = useMemo(() => {
    const map = new Map<string, { count: number; a01101: number; a01151: number; a01102: number; a01152: number }>();
    filteredEmployees.forEach(e => {
      const bps = Number(e.employees.bps) || 0;
      const isGazetted = bps >= 16;
      const rawDesignation = e.employees.designation_full || e.employees.designation || '';
      const desNorm = normalizeDesignation(rawDesignation, bps);
      const key = desNorm;
      const f: any = e.financials || {};
      const basicMonthly = Number(f.last_pay_with_increment) || Number(f.last_basic_pay) || 0;
      const personalMonthly = Number(f.p_pay) || 0;
      const basicYear = Math.round(basicMonthly * 12);
      const personalYear = Math.round(personalMonthly * 12);
      const prev = map.get(key) || { count: 0, a01101: 0, a01151: 0, a01102: 0, a01152: 0 };
      prev.count += 1;
      if (isGazetted) {
        prev.a01101 += basicYear;
        prev.a01102 += personalYear;
      } else {
        prev.a01151 += basicYear;
        prev.a01152 += personalYear;
      }
      map.set(key, prev);
      const shortKey = toShortDesignation(desNorm);
      if (shortKey && shortKey !== key) {
        const prevShort = map.get(shortKey) || { count: 0, a01101: 0, a01151: 0, a01102: 0, a01152: 0 };
        prevShort.count += 1;
        if (isGazetted) {
          prevShort.a01101 += basicYear;
          prevShort.a01102 += personalYear;
        } else {
          prevShort.a01151 += basicYear;
          prevShort.a01152 += personalYear;
        }
        map.set(shortKey, prevShort);
      }
    });
    return map;
  }, [filteredEmployees]);

  const bm2Edits = useMemo(() => {
    return loadBm2Edits(ddoCode || '');
  }, [ddoCode]);

  const adjustedRows = useMemo(() => {
    const isSalaryCode = (code: string) => code.startsWith('A011') || code.startsWith('A012');
    const isPayCode = (code: string) => code.startsWith('A011');
    const isAllowCode = (code: string) => code.startsWith('A012');

    const rowsCopy = rows.map(r => ({ ...r }));

    const monthlySumByCode: Record<string, number> = {};
    let weatherAnnualTotal = 0;
    filteredEmployees.forEach(e => {
      const f: any = e.financials || {};
      const bps = Number(e.employees.bps) || 0;
      const isGazetted = bps >= 16;
      const basicMonthly = Number(f.last_pay_with_increment) || Number(f.last_basic_pay) || 0;
      const personalMonthly = Number(f.p_pay) || 0;
      if (isGazetted) {
        monthlySumByCode['A01101'] = (monthlySumByCode['A01101'] || 0) + basicMonthly;
        monthlySumByCode['A01102'] = (monthlySumByCode['A01102'] || 0) + personalMonthly;
      } else {
        monthlySumByCode['A01151'] = (monthlySumByCode['A01151'] || 0) + basicMonthly;
        monthlySumByCode['A01152'] = (monthlySumByCode['A01152'] || 0) + personalMonthly;
      }
      const allowMonthly: Record<string, number> = {
        A01202: Number(f.hra) || 0,
        A01203: Number(f.ca) || 0,
        A01217: Number(f.ma) || 0,
        A0120D: Number(f.integrated_allow) || 0,
        A01207: Number(f.wa) || 0,
        A01208: Number(f.dress_allow) || 0,
        A0124H: Number(f.spl_allow) || 0,
        A01233: Number(f.uaa) || 0,
        A0121T: Number(f.adhoc_2013) || 0,
        A0122C: Math.max(Number(f.adhoc_2015) || 0, Number(f.adhoc_10pct) || 0),
        A0124R: Math.max(Number(f.adhoc_2022) || 0, Number(f.adhoc_2022_ps17) || 0),
        A0124X: Number(f.adhoc_2023_35) || 0,
        A0125E: Number(f.adhoc_2024_25) || 0,
        A0125P: Number(f.adhoc_2025_10) || 0,
        A0124N: Number(f.dra_2022kp) || 0,
        A0125Q: Number(f.dra_2025_15) || 0,
        A01253: Number(f.science_teaching_allow) || 0,
        A01289: Number(f.teaching_allow) || 0,
        A01239: Number(f.spl_allow_female) || 0,
        A01238: Number(f.charge_allow) || 0,
        A0122N: Number(f.spl_allow_disable) || 0,
        A01226: Number(f.computer_allow) || 0,
        A01270: Number(f.mphil_allow) || 0,
        A0124: Number(f.entertainment_allow) || 0,
      };
      Object.entries(allowMonthly).forEach(([code, val]) => {
        if (!val) return;
        monthlySumByCode[code] = (monthlySumByCode[code] || 0) + val;
      });
      if (bps < 7) {
        weatherAnnualTotal += 9200;
      }
    });

    rowsCopy.forEach(r => {
      const code = (r.code || '').trim();
      if (!code) return;
      const edit = bm2Edits[code];
      const overrideRaw =
        edit && Object.prototype.hasOwnProperty.call(edit, 'rev25') && typeof edit.rev25 === 'number'
          ? Number(edit.rev25)
          : undefined;

      if (isSalaryCode(code)) {
        let anticipated: number;
        if (code === 'A0124L') {
          anticipated = weatherAnnualTotal;
        } else {
          const monthly = monthlySumByCode[code] || 0;
          const rev7 = Math.round(monthly * 7);
          anticipated = rev7;
        }
        if (overrideRaw !== undefined && Number.isFinite(overrideRaw)) {
          anticipated = Math.max(0, overrideRaw);
        }
        r.anticipated = anticipated;
        r.totalExpend = (r.actualCurr5 || 0) + (r.anticipated || 0);
      } else {
        const original = r.original || currentMap[code]?.budget || 0;
        const actualCurr5 = r.actualCurr5 || 0;
        const autoAnticipated = Math.max(0, original - actualCurr5);
        let anticipated = overrideRaw !== undefined && Number.isFinite(overrideRaw) ? overrideRaw : autoAnticipated;
        if (!Number.isFinite(anticipated)) anticipated = autoAnticipated;
        if (anticipated < 0) anticipated = 0;
        r.anticipated = anticipated;
        r.totalExpend = (r.actualCurr5 || 0) + (r.anticipated || 0);
      }
      const o = Number(r.original || 0);
      const t = Number(r.totalExpend || 0);
      r.surrender = Math.max(0, o - t);
      r.excess = Math.max(0, t - o);
    });

    const sumRows = (predicate: (r: Bm20Row) => boolean) => {
      return rowsCopy.filter(predicate).reduce(
        (acc, r) => {
          acc.original += r.original || 0;
          acc.modified += r.modified || 0;
          acc.actualPrev7 += r.actualPrev7 || 0;
          acc.actualCurr5 += r.actualCurr5 || 0;
          acc.totalColumns += r.totalColumns || 0;
          acc.anticipated += r.anticipated || 0;
          acc.totalExpend += r.totalExpend || 0;
          acc.surrender += r.surrender || 0;
          acc.excess += r.excess || 0;
          return acc;
        },
        {
          original: 0,
          modified: 0,
          actualPrev7: 0,
          actualCurr5: 0,
          totalColumns: 0,
          anticipated: 0,
          totalExpend: 0,
          surrender: 0,
          excess: 0,
        }
      );
    };

    const salarySum = sumRows(r => isSalaryCode((r.code || '').trim()));
    const paySum = sumRows(r => isPayCode((r.code || '').trim()));
    const allowSum = sumRows(r => isAllowCode((r.code || '').trim()));
    const nonSalarySum = sumRows(r => {
      const code = (r.code || '').trim();
      return !!code && !isSalaryCode(code);
    });
    const grandSum = {
      original: salarySum.original + nonSalarySum.original,
      modified: salarySum.modified + nonSalarySum.modified,
      actualPrev7: salarySum.actualPrev7 + nonSalarySum.actualPrev7,
      actualCurr5: salarySum.actualCurr5 + nonSalarySum.actualCurr5,
      totalColumns: salarySum.totalColumns + nonSalarySum.totalColumns,
      anticipated: salarySum.anticipated + nonSalarySum.anticipated,
      totalExpend: salarySum.totalExpend + nonSalarySum.totalExpend,
      surrender: salarySum.surrender + nonSalarySum.surrender,
      excess: salarySum.excess + nonSalarySum.excess,
    };

    rowsCopy.forEach(r => {
      const descUpper = (r.desc || '').toUpperCase();
      if (descUpper.includes('TOTAL PAY') && !descUpper.includes('ALLOW')) {
        r.anticipated = paySum.anticipated;
        r.totalExpend = paySum.totalExpend;
        r.surrender = paySum.surrender;
        r.excess = paySum.excess;
        return;
      }
      if (descUpper.includes('TOTAL ALLOW')) {
        r.anticipated = allowSum.anticipated;
        r.totalExpend = allowSum.totalExpend;
        r.surrender = allowSum.surrender;
        r.excess = allowSum.excess;
        return;
      }
      if (descUpper.includes('TOTAL SALARY')) {
        r.anticipated = salarySum.anticipated;
        r.totalExpend = salarySum.totalExpend;
        r.surrender = salarySum.surrender;
        r.excess = salarySum.excess;
        return;
      }
      if (descUpper.includes('TOTAL NON')) {
        r.anticipated = nonSalarySum.anticipated;
        r.totalExpend = nonSalarySum.totalExpend;
        r.surrender = nonSalarySum.surrender;
        r.excess = nonSalarySum.excess;
        return;
      }
      if (descUpper.includes('GRAND TOTAL')) {
        r.anticipated = grandSum.anticipated;
        r.totalExpend = grandSum.totalExpend;
        r.surrender = grandSum.surrender;
        r.excess = grandSum.excess;
        return;
      }
      const o = Number(r.original || 0);
      const t = Number(r.totalExpend || 0);
      r.surrender = Math.max(0, o - t);
      r.excess = Math.max(0, t - o);
    });

    return rowsCopy;
  }, [rows, currentMap, ddoCode, filteredEmployees]);

  const nonZeroRows = useMemo(() => {
    return adjustedRows.filter(r => {
      const nums = [
        r.original,
        r.modified,
        r.actualPrev7,
        r.actualCurr5,
        r.totalColumns,
        r.anticipated,
        r.totalExpend,
        r.surrender,
        r.excess,
      ];
      return nums.some(v => (Number(v) || 0) !== 0);
    });
  }, [adjustedRows]);

  return (
    <div className="bg-white p-4 font-arial text-black text-[11px] bm20-root">
      <style>{styles}</style>
      <div className="bg-white mx-auto" style={{ width: '100%', padding: '5mm', boxSizing: 'border-box' }}>
        <div className="text-center mb-1">
          <h1 className="font-bold text-[13px] uppercase leading-tight">OFFICE OF THE {officeName || 'MINISTRY NAME'} ({ddoCode || 'DDO'})</h1>
          <h2 className="font-bold text-[13px] uppercase leading-tight">STATEMENT OF EXCESS AND SURRENDER / REVISED BUDGET FY {currentYearLabel} FORM BM-20</h2>
        </div>
        <div className="w-full flex justify-center">
          <table className="table-fixed bm20-table">
            <colgroup>
              <col style={{ width: '5%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
            </colgroup>
            <thead>
              <tr className="bg-black text-white text-center h-[8mm]">
                <th colSpan={2} className="align-middle">Minor Head<br/>Function</th>
                <th className="align-middle">Orignal<br/>Appropriation<br/>of the current<br/>Financial Year<br/>{currentYearLabel}</th>
                <th className="align-middle">Modified<br/>Grant</th>
                <th className="align-middle">Actual for last<br/>7 Months<br/>{prevYearLabel}</th>
                <th className="align-middle">Acutal for<br/>1st 5 month<br/>{currentYearLabel}</th>
                <th className="align-middle">Total<br/>Columns</th>
                <th className="align-middle">Anticipated<br/>Expend: for<br/>remainig 7 months<br/>{currentYearLabel}</th>
                <th className="align-middle">Total<br/>Expend:<br/>(R.ES)<br/>col: 6 + 7</th>
                <th className="align-middle">Surrenders</th>
                <th className="align-middle">Excesses</th>
              </tr>
            </thead>
            <tbody>
              {nonZeroRows.map((row, index) => {
                const textClass = row.isRed ? 'text-red-custom' : 'text-black';
                const fontClass = row.isBold ? 'font-bold' : '';
                const descUpper = row.desc?.toUpperCase() || '';
                const isSalaryTotal = descUpper.includes('TOTAL SALARY');
                const isNonSalaryStart = descUpper.includes('NON SALARY') && !descUpper.includes('TOTAL');
                const isGrandTotal = descUpper.includes('GRAND TOTAL');
                const rowType = isSalaryTotal ? 'total-salary' : isNonSalaryStart ? 'non-salary' : isGrandTotal ? 'grand-total' : '';
                const rowClass = [
                  textClass,
                  fontClass,
                  isSalaryTotal && breakAfterTotalSalary ? 'bm20-total-salary' : '',
                  isNonSalaryStart ? 'bm20-non-salary-start' : '',
                  isGrandTotal ? 'bm20-grand-total' : ''
                ]
                  .filter(Boolean)
                  .join(' ');
                const desKeyRaw = row.desc || '';
                const desKeyNorm = normalizeDesignation(desKeyRaw || '', 0);
                const agg = designationAgg.get(desKeyNorm) || designationAgg.get(toShortDesignation(desKeyNorm));
                const details = agg
                  ? ` (Count: ${agg.count}; ${agg.a01101 ? 'A01101: ' + agg.a01101.toLocaleString('en-PK', { maximumFractionDigits: 0 }) + '; ' : ''}${agg.a01151 ? 'A01151: ' + agg.a01151.toLocaleString('en-PK', { maximumFractionDigits: 0 }) + '; ' : ''}${agg.a01102 ? 'A01102: ' + agg.a01102.toLocaleString('en-PK', { maximumFractionDigits: 0 }) + '; ' : ''}${agg.a01152 ? 'A01152: ' + agg.a01152.toLocaleString('en-PK', { maximumFractionDigits: 0 }) : ''})`
                  : '';
                return (
                  <tr key={index} className={rowClass} data-row-type={rowType || undefined}>
                    <td className="text-left">{row.code}</td>
                    <td className="text-left">{row.desc}{details}</td>
                    <td className="text-right">{formatNumber(row.original)}</td>
                    <td className="text-center">{formatNumber(row.modified)}</td>
                    <td className="text-right">{formatNumber(row.actualPrev7)}</td>
                    <td className="text-right">{formatNumber(row.actualCurr5)}</td>
                    <td className="text-right">{formatNumber(row.totalColumns)}</td>
                    <td className="text-right">{formatNumber(row.anticipated)}</td>
                    <td className="text-right">{formatNumber(row.totalExpend)}</td>
                    <td className="text-right">{formatNumber(row.surrender)}</td>
                    <td className="text-right">{formatNumber(row.excess)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
