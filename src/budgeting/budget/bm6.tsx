import React, { useMemo, useEffect } from 'react';
import { EmployeeRecord } from '../../types';
import { buildSignatureFromOffice } from './posts';
import { normalizeDesignation, toShortDesignation, normalizeBpsForBudget } from './bm2';

type PayAllowancesStatementProps = {
  officeName: string;
  ddoCode: string;
  fiscalYearLabel: string;
  employees: EmployeeRecord[];
};

type MissingPayrollEmployee = {
  personalNo: string;
  name: string;
  school: string;
};

const formatNumber = (value: number): string => {
  if (!value) return '0';
  return value.toLocaleString();
};

const PAY_SCALES: Record<number, { min: number; inc: number; max: number }> = {
  1: { min: 13550, inc: 430, max: 26450 },
  2: { min: 13820, inc: 490, max: 28520 },
  3: { min: 14260, inc: 580, max: 31660 },
  4: { min: 14690, inc: 660, max: 34490 },
  5: { min: 15230, inc: 750, max: 37730 },
  6: { min: 15760, inc: 840, max: 40960 },
  7: { min: 16310, inc: 910, max: 43610 },
  8: { min: 16890, inc: 1000, max: 46890 },
  9: { min: 17470, inc: 1090, max: 50170 },
  10: { min: 18050, inc: 1190, max: 53750 },
  11: { min: 18650, inc: 1310, max: 57950 },
  12: { min: 19770, inc: 1430, max: 62670 },
  13: { min: 21160, inc: 1560, max: 67960 },
  14: { min: 22530, inc: 1740, max: 74730 },
  15: { min: 23920, inc: 1980, max: 83320 },
  16: { min: 28070, inc: 2260, max: 95870 },
  17: { min: 45070, inc: 3420, max: 113470 },
  18: { min: 56880, inc: 4260, max: 142080 },
  19: { min: 87840, inc: 4530, max: 178440 },
  20: { min: 102470, inc: 6690, max: 196130 },
  21: { min: 113790, inc: 7420, max: 217670 },
  22: { min: 122190, inc: 8710, max: 244130 },
};

const HRA_VACANT: Record<number, number> = {
  1: 2005, 2: 2049, 3: 2120, 4: 2187, 5: 2255, 6: 2315, 7: 2383, 8: 2474,
  9: 2579, 10: 2670, 11: 2778, 12: 2940, 13: 3135, 14: 3321, 15: 3524,
  16: 4091, 17: 6649, 18: 8714, 19: 13284, 20: 15758, 21: 17469, 22: 18684,
};

const getVacantCA = (bps: number): number => {
  if (bps >= 1 && bps <= 4) return 1785;
  if (bps >= 5 && bps <= 10) return 1932;
  if (bps >= 11 && bps <= 15) return 2856;
  if (bps >= 16 && bps <= 22) return 5000;
  return 0;
};

export const PayAllowancesStatement: React.FC<PayAllowancesStatementProps> = ({
  officeName, ddoCode, fiscalYearLabel, employees,
}) => {

  // Calculate fiscal year labels
  const parsedYearMatch = (fiscalYearLabel || '').match(/20\d{2}/);
  const fiscalStartYear = parsedYearMatch ? Number(parsedYearMatch[0]) : new Date().getFullYear();
  const postsYear2Label = `${fiscalStartYear + 1}-${String(fiscalStartYear + 2).slice(-2)}`;

  const allowanceHeaders = [
    { label: 'A01101', code: '', rotated: false, sub: '' },
    { label: 'A01151', code: '', rotated: false, sub: '' },
    { label: 'H.R.A', code: 'A01202', rotated: true },
    { label: 'C.A', code: 'A01203', rotated: true },
    { label: 'Medical Allowance', code: 'A01217', rotated: true },
    { label: 'Intigrated Allowance', code: 'A0120D', rotated: true },
    { label: 'Washing Allow.', code: 'A01207', rotated: true },
    { label: 'Dress Allowance', code: 'A01208', rotated: true },
    { label: 'Special Allowance 2021', code: 'A0124H', rotated: true },
    { label: 'U.A.A', code: 'A01233', rotated: true },
    { label: 'Adhoc Releif 2013', code: 'A0121T', rotated: true },
    { label: 'Adhoc Releif 2015', code: 'A0122C', rotated: true },
    { label: 'Adhoc Relief 2022', code: 'A0124R', rotated: true },
    { label: 'Adhoc Relief 2023', code: 'A0124X', rotated: true },
    { label: 'Adhoc Relief 2024', code: 'A0125E', rotated: true },
    { label: 'Adhoc Relief 2025', code: 'A0125P', rotated: true },
    { label: 'Dispr Red Allowance 2022', code: 'A0124N', rotated: true },
    { label: 'Dispr Red Allowance 2025', code: 'A0125Q', rotated: true },
    { label: 'Weather Allowance', code: 'A0124L', rotated: true },
    { label: 'Science Teaching Allowance', code: 'A01253', rotated: true },
    { label: 'Teaching Allowance', code: 'A01289', rotated: true },
    { label: 'Special Allowance', code: 'A01239', rotated: true },
    { label: 'Allowance To Disbal', code: 'A01238', rotated: true },
    { label: 'Special Conveyance for the year', code: 'A0122N', rotated: true },
    { label: 'Computer Allowance', code: 'A01226', rotated: true },
    { label: 'M.Phil Allowance', code: 'A01270', rotated: true },
    { label: 'Entertainment Allowance', code: 'A0124', rotated: true },
  ];

  const filteredEmployees = useMemo(() => {
    const targetDdo = (ddoCode || '').trim().toUpperCase();
    return employees.filter(e => {
      const empDdo = (e.employees.ddo_code || '').trim().toUpperCase();
      const statusRaw = e.employees.status || '';
      const status = statusRaw.toLowerCase();
      const isRemovedOrTransferred = status.includes('transfer') || status.includes('posted out') || 
        status.includes('removed') || status.includes('terminated') || status.includes('died') || status.includes('retired');
      if (!targetDdo) return status === 'active' || isRemovedOrTransferred;
      return empDdo === targetDdo && (status === 'active' || isRemovedOrTransferred);
    });
  }, [employees, ddoCode]);

  const { signatureTitle, signatureBody } = useMemo(
    () => buildSignatureFromOffice(officeName, filteredEmployees),
    [officeName, filteredEmployees]
  );

  const { rows, visibleAllowanceHeaders, hasPersonalPay, personalCodeLabel, projectionByCode, basicByDesignation, missingPayrollEmployees } = useMemo(() => {
    const baseAllowanceHeaders = allowanceHeaders.slice(2);
    const allowanceCodes = baseAllowanceHeaders.map(h => h.code);
    const weatherIdx = allowanceCodes.indexOf('A0124L');
    const result: any[] = [];
    const totalCodes = new Array(allowanceCodes.length).fill(0);
    let totalBasic = 0, totalA01101 = 0, totalA01151 = 0, totalPersonalYear = 0;
    let totalPersonalOfficer = 0, totalPersonalStaff = 0, totalAllowances = 0, totalProvision = 0;
    let hasOfficerPersonal = false, hasStaffPersonal = false;
    const basicByDesignation: Record<string, number> = {};
    const missingPayrollEmployees: MissingPayrollEmployee[] = [];

    let sanctionedNextByKey: Record<string, number> = {};
    try {
      const key = `budgeting/posts/sanctioned/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') sanctionedNextByKey = parsed as Record<string, number>;
      }
    } catch { sanctionedNextByKey = {}; }

    filteredEmployees.forEach(emp => {
      const f: any = emp.financials || {};
      const hasBasic = Number(f.last_basic_pay) > 0 || Number(f.last_pay_with_increment) > 0;
      const hasAnyAllowance = f.hra || f.ca || f.ma || f.integrated_allow || f.wa || f.dress_allow || 
        f.spl_allow || f.uaa || f.science_teaching_allow || f.teaching_allow || f.charge_allow || 
        f.computer_allow || f.mphil_allow || f.entertainment_allow || f.spl_allow_female || 
        f.spl_allow_disable || f.adhoc_2013 || f.adhoc_2015 || f.adhoc_10pct || f.adhoc_2022 || 
        f.adhoc_2022_ps17 || f.adhoc_2023_35 || f.adhoc_2024_25 || f.adhoc_2025_10 || f.dra_2022kp || f.dra_2025_15;
      const hasAnyExtra = f.allowances_extra && Object.values(f.allowances_extra).some(v => Number(v) > 0);
      
      const statusRaw = emp.employees.status || '';
      const status = statusRaw.toLowerCase();
      const isRemovedOrTransferred = status.includes('transfer') || status.includes('posted out') ||
        status.includes('removed') || status.includes('terminated') || status.includes('died') || status.includes('retired');
      
      if (!isRemovedOrTransferred && !hasBasic && !hasAnyAllowance && !hasAnyExtra) {
        missingPayrollEmployees.push({
          personalNo: emp.employees.personal_no || '',
          name: emp.employees.name || '',
          school: emp.employees.school_full_name || '',
        });
      }
    });

    const employeesBase = filteredEmployees.map(emp => {
      const f: any = emp.financials || {};
      const bpsActual = Number(emp.employees.bps) || 0;
      const rawDesignation = emp.employees.designation_full || emp.employees.designation || '';
      const designation = normalizeDesignation(rawDesignation, bpsActual);
      const postBps = normalizeBpsForBudget(designation, bpsActual);
      const isGazetted = bpsActual >= 16;
      
      const statusRaw = emp.employees.status || '';
      const status = statusRaw.toLowerCase();
      const isRemovedOrTransferred = status.includes('transfer') || status.includes('posted out') ||
        status.includes('removed') || status.includes('terminated') || status.includes('died') || status.includes('retired');

      // Get scale FIRST - this contains the correct increment values
      const scale = PAY_SCALES[bpsActual];
      const baseBasic = Number(f.last_basic_pay) || 0;
      // ✅ FIX: Use scale.inc instead of ANNUAL_INCREMENTS
      const increment = scale?.inc || 0;
      const currentBasic = Number(f.last_pay_with_increment) || baseBasic || 0;

      let actualBasic = currentBasic;
      let personalMonthly = Number(f.p_pay) || 0;

      if (isRemovedOrTransferred) {
        // VACANT POST (removed/transferred) - minimum salary only, NO increment
        actualBasic = scale?.min || 0;
        personalMonthly = 0;
      } else if (currentBasic > 0 && increment) {
        // FILLED POST - add one annual increment
        if (scale && currentBasic >= scale.max) {
          // At max scale - increment goes to personal pay
          actualBasic = currentBasic;
          personalMonthly += increment;
        } else {
          // Add one annual increment to basic pay
          actualBasic = currentBasic + increment;
        }
      } else if (currentBasic === 0 && scale) {
        // No payroll data but employee exists - use minimum
        actualBasic = scale.min;
      }

      const totalBasicYear = actualBasic * 12;
      const personalYear = personalMonthly * 12;
      const weatherOneTime = bpsActual < 7 ? 9200 : 0;

      let monthlyByCode: Record<string, number>;
      
      if (isRemovedOrTransferred) {
        // VACANT POST - use minimum-based allowance calculations
        const minBasic = scale?.min || 0;
        const uaa = bpsActual >= 1 && bpsActual <= 15 ? 1000 : bpsActual === 16 ? 1500 : bpsActual >= 17 ? 2000 : 0;
        
        monthlyByCode = {
          A01202: HRA_VACANT[bpsActual] || 0,
          A01203: getVacantCA(bpsActual),
          A01217: 1500,
          A0120D: bpsActual < 7 ? 600 : 0,
          A01207: bpsActual < 7 ? 1000 : 0,
          A01208: bpsActual < 7 ? 1000 : 0,
          A0124H: 0,
          A01233: uaa,
          A0121T: 0,
          A0122C: 0,
          A0124R: minBasic * 0.15,
          A0124X: bpsActual <= 16 ? minBasic * 0.35 : minBasic * 0.3,
          A0125E: minBasic * 0.25,
          A0125P: minBasic * 0.1,
          A0124N: minBasic * 0.15,
          A0125Q: minBasic * 0.15,
          A0124L: 0,
          A01253: 0,
          A01289: 0,
          A01239: 800,
          A01238: 0,
          A0122N: 0,
          A01226: 0,
          A01270: 0,
          A0124: 0,
        };
      } else {
        // FILLED POST - use actual allowances from payroll
        monthlyByCode = {
          A01202: f.hra || 0,
          A01203: f.ca || 0,
          A01217: f.ma || 0,
          A0120D: f.integrated_allow || 0,
          A01207: f.wa || 0,
          A01208: f.dress_allow || 0,
          A0124H: f.spl_allow || 0,
          A01233: f.uaa || 0,
          A0121T: f.adhoc_2013 || 0,
          A0122C: Math.max(f.adhoc_2015 || 0, f.adhoc_10pct || 0),
          A0124R: Math.max(f.adhoc_2022 || 0, f.adhoc_2022_ps17 || 0),
          A0124X: f.adhoc_2023_35 || 0,
          A0125E: f.adhoc_2024_25 || 0,
          A0125P: f.adhoc_2025_10 || 0,
          A0124N: f.dra_2022kp || 0,
          A0125Q: f.dra_2025_15 || 0,
          A0124L: weatherOneTime,
          A01253: f.science_teaching_allow || 0,
          A01289: f.teaching_allow || 0,
          A01239: f.spl_allow_female || 0,
          A01238: f.charge_allow || 0,
          A0122N: f.spl_allow_disable || 0,
          A01226: f.computer_allow || 0,
          A01270: f.mphil_allow || 0,
          A0124: f.entertainment_allow || 0,
        };
      }

      const codesMonthly = allowanceCodes.map(code => Math.round(monthlyByCode[code] || 0));
      
      const extraMonthly = isRemovedOrTransferred ? 0 : Object.values(f.allowances_extra || {}).reduce(
        (sum: number, val: any) => sum + (Number(val) || 0), 0
      ) as number;
      
      const totalAllowMonthlyExWeather = codesMonthly.reduce(
        (sum: number, v: number, i: number) => sum + (i === weatherIdx ? 0 : v), 0
      ) + extraMonthly;
      
      const totalAllowYear = isRemovedOrTransferred 
        ? Math.round(totalAllowMonthlyExWeather * 12)
        : Math.round(totalAllowMonthlyExWeather * 12) + weatherOneTime;

      return {
        emp: {
          ...emp,
          employees: { ...emp.employees, name: isRemovedOrTransferred ? 'VACANT POST' : emp.employees.name },
        } as any,
        f,
        bps: bpsActual,
        postBps,
        isGazetted,
        designation,
        shortDes: toShortDesignation(designation),
        baseBasic,
        increment: isRemovedOrTransferred ? 0 : increment,
        actualBasic,
        totalBasicYear,
        personalMonthly,
        personalYear,
        a01101Year: isGazetted ? totalBasicYear : 0,
        a01151Year: isGazetted ? 0 : totalBasicYear,
        codesMonthly,
        totalAllowYear,
        totalProvRow: (isGazetted ? totalBasicYear : 0) + (isGazetted ? 0 : totalBasicYear) + personalYear + totalAllowYear,
        isRemovedOrTransferred,
      };
    });

    const actualCountByKey: Record<string, number> = {};
    employeesBase.forEach(row => {
      const key = `${row.designation}|${row.postBps || row.bps}`;
      actualCountByKey[key] = (actualCountByKey[key] || 0) + 1;
    });

    const employeesWithVacancies = [...employeesBase];

    const sanctionedAggregated: Record<string, number> = {};
    Object.entries(sanctionedNextByKey).forEach(([rawKey, rawVal]) => {
      const parts = String(rawKey).split('|');
      const rawDesignation = parts[0] || '';
      const bpsRaw = Number(parts[1]) || 0;
      const normalizedDesignation = normalizeDesignation(rawDesignation, bpsRaw);
      const bpsNorm = normalizeBpsForBudget(normalizedDesignation, bpsRaw);
      const normalizedKey = `${normalizedDesignation}|${bpsNorm}`;
      sanctionedAggregated[normalizedKey] = (sanctionedAggregated[normalizedKey] || 0) + (typeof rawVal === 'number' ? rawVal : Number(rawVal) || 0);
    });

    Object.entries(sanctionedAggregated).forEach(([key, sanctioned]) => {
      const [designationKey, bpsStr] = key.split('|');
      const bps = Number(bpsStr) || 0;
      if (!bps || !sanctioned) return;
      const vacancies = Math.max(0, sanctioned - (actualCountByKey[key] || 0));
      if (!vacancies) return;

      const scale = PAY_SCALES[bps];
      const minBasic = scale?.min || 0;
      // VACANT POST - minimum salary only, NO increment
      const actualBasic = minBasic;
      const totalBasicYear = actualBasic * 12;
      const isGazetted = bps >= 16;

      const uaa = bps >= 1 && bps <= 15 ? 1000 : bps === 16 ? 1500 : bps >= 17 ? 2000 : 0;
      const monthlyByCodeVacant: Record<string, number> = {
        A01202: HRA_VACANT[bps] || 0,
        A01203: getVacantCA(bps),
        A01217: 1500,
        A0120D: bps < 7 ? 600 : 0,
        A01207: bps < 7 ? 1000 : 0,
        A01208: bps < 7 ? 1000 : 0,
        A0124H: 0,
        A01233: uaa,
        A0121T: 0,
        A0122C: 0,
        A0124R: minBasic * 0.15,
        A0124X: bps <= 16 ? minBasic * 0.35 : minBasic * 0.3,
        A0125E: minBasic * 0.25,
        A0125P: minBasic * 0.1,
        A0124N: minBasic * 0.15,
        A0125Q: minBasic * 0.15,
        A0124L: 0,
        A01253: 0,
        A01289: 0,
        A01239: 800,
        A01238: 0,
        A0122N: 0,
        A01226: 0,
        A01270: 0,
        A0124: 0,
      };

      const codesMonthlyVacant = allowanceCodes.map(code => Math.round(monthlyByCodeVacant[code] || 0));
      const totalAllowYear = Math.round(codesMonthlyVacant.reduce((s, v) => s + v, 0) * 12);

      for (let i = 0; i < vacancies; i++) {
        employeesWithVacancies.push({
          emp: {
            employees: {
              personal_no: '',
              name: 'VACANT POST',
              designation: toShortDesignation(designationKey),
              designation_full: designationKey,
              bps,
              ddo_code: ddoCode,
              status: 'active'
            }
          } as any,
          f: {},
          bps,
          postBps: bps,
          isGazetted,
          designation: designationKey,
          shortDes: toShortDesignation(designationKey),
          baseBasic: minBasic,
          increment: 0,
          actualBasic,
          totalBasicYear,
          personalMonthly: 0,
          personalYear: 0,
          a01101Year: isGazetted ? totalBasicYear : 0,
          a01151Year: isGazetted ? 0 : totalBasicYear,
          codesMonthly: codesMonthlyVacant,
          totalAllowYear,
          totalProvRow: totalBasicYear + totalAllowYear,
          isRemovedOrTransferred: false,
        });
      }
    });

    const sorted = employeesWithVacancies.sort((a, b) => {
      if (a.isGazetted !== b.isGazetted) return a.isGazetted ? -1 : 1;
      if (b.bps !== a.bps) return b.bps - a.bps;
      return a.designation.localeCompare(b.designation) || a.emp.employees.name.localeCompare(b.emp.employees.name);
    });

    let serial = 0, currentGroupKey: string | null = null, currentGroupIsGazetted: boolean | null = null, groupProv = 0;

    sorted.forEach(row => {
      const groupKey = `${row.isGazetted ? 'G' : 'N'}|${row.bps}|${row.designation}`;
      const scale = PAY_SCALES[row.bps];

      if (currentGroupKey && groupKey !== currentGroupKey) {
        result.push({ type: 'sub', isGazettedGroup: currentGroupIsGazetted, groupProv: formatNumber(groupProv) });
        groupProv = 0;
      }
      currentGroupKey = groupKey;
      currentGroupIsGazetted = row.isGazetted;
      serial++;

      if (row.personalMonthly > 0) {
        if (row.isGazetted) hasOfficerPersonal = true;
        else hasStaffPersonal = true;
      }

      totalBasic += row.totalBasicYear;
      totalA01101 += row.a01101Year;
      totalA01151 += row.a01151Year;
      totalPersonalYear += row.personalYear;
      if (row.personalMonthly > 0) {
        if (row.isGazetted) totalPersonalOfficer += row.personalYear;
        else totalPersonalStaff += row.personalYear;
      }
      totalAllowances += row.totalAllowYear;
      totalProvision += row.totalProvRow;
      row.codesMonthly.forEach((v, i) => {
        totalCodes[i] += (i === weatherIdx && row.bps < 7 && !row.isRemovedOrTransferred) ? 9200 : v * 12;
      });
      groupProv += row.a01101Year + row.a01151Year + row.personalYear;

      const desKey = `${row.designation}|${row.postBps || row.bps}`;
      basicByDesignation[desKey] = (basicByDesignation[desKey] || 0) + row.a01101Year + row.a01151Year;

      result.push({
        s: String(serial),
        pNo: row.emp.employees.personal_no || '',
        name: row.emp.employees.name || '',
        des: row.shortDes || row.designation || '',
        bps: String(row.bps || ''),
        min: scale?.min?.toLocaleString() || '',
        inc: scale?.inc?.toLocaleString() || '',
        max: scale?.max?.toLocaleString() || '',
        act: row.actualBasic?.toLocaleString() || '',
        personalPay: row.personalMonthly?.toLocaleString() || '',
        a01101: row.a01101Year ? formatNumber(row.a01101Year) : '',
        a01151: row.a01151Year ? formatNumber(row.a01151Year) : '',
        personalYear: row.personalYear ? formatNumber(row.personalYear) : '',
        codes: row.codesMonthly,
        totAllow: formatNumber(row.totalAllowYear),
        totProv: formatNumber(row.totalProvRow),
        isVacant: row.emp.employees.name === 'VACANT POST',
      });
    });

    if (currentGroupKey) {
      result.push({ type: 'sub', isGazettedGroup: currentGroupIsGazetted, groupProv: formatNumber(groupProv) });
    }
    
    if (sorted.length) {
      result.push({
        type: 'grand_total',
        a01101: formatNumber(totalA01101),
        a01151: formatNumber(totalA01151),
        personalYear: formatNumber(totalPersonalYear),
        codes: totalCodes,
        totAllow: formatNumber(totalAllowances),
        totProv: formatNumber(totalProvision)
      });
    }

    const nonZeroIndices = totalCodes.map((t, i) => ({ t, i })).filter(x => x.t !== 0).map(x => x.i);
    const indicesToUse = nonZeroIndices.length > 0 ? nonZeroIndices : allowanceCodes.map((_, i) => i);
    const finalAllowanceHeaders = indicesToUse.map(i => baseAllowanceHeaders[i]);
    const remapCodes = (codes: number[]) => indicesToUse.map(i => codes[i]);
    const finalRows = result.map(row => Array.isArray(row.codes) ? { ...row, codes: remapCodes(row.codes) } : row);

    const hasPersonalPay = hasOfficerPersonal || hasStaffPersonal;
    const personalCodeLabel = hasPersonalPay
      ? (hasOfficerPersonal && !hasStaffPersonal ? 'A01102' : !hasOfficerPersonal && hasStaffPersonal ? 'A01152' : 'A01102-52')
      : '';

    const projectionByCode: Record<string, number> = { A01101: totalA01101, A01151: totalA01151 };
    if (totalPersonalOfficer > 0) projectionByCode['A01102'] = totalPersonalOfficer;
    if (totalPersonalStaff > 0) projectionByCode['A01152'] = totalPersonalStaff;
    allowanceCodes.forEach((code, idx) => { projectionByCode[code] = totalCodes[idx] || 0; });

    return {
      rows: finalRows,
      visibleAllowanceHeaders: finalAllowanceHeaders,
      hasPersonalPay,
      personalCodeLabel,
      projectionByCode,
      basicByDesignation,
      missingPayrollEmployees
    };
  }, [allowanceHeaders, filteredEmployees, ddoCode]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `budgeting/bm6/projections/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`,
        JSON.stringify(projectionByCode || {})
      );
    } catch {}
  }, [projectionByCode, ddoCode]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `budgeting/bm6/groupBasic/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`,
        JSON.stringify(basicByDesignation || {})
      );
    } catch {}
  }, [basicByDesignation, ddoCode]);

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: legal landscape; 
            margin: 5mm; 
          }
          
          *, *::before, *::after,
          html, body,
          div, section, article, main, aside, header, footer, nav,
          .bg-white, .bg-surface, .bg-surface-variant, .bg-surface-container,
          .bg-surface-container-low, .bg-surface-container-high,
          [class*="card"], [class*="Card"],
          [class*="panel"], [class*="Panel"],
          [class*="container"], [class*="Container"],
          [class*="wrapper"], [class*="Wrapper"],
          [class*="box"], [class*="Box"],
          [class*="modal"], [class*="Modal"],
          [class*="dialog"], [class*="Dialog"],
          [class*="sheet"], [class*="Sheet"],
          [class*="surface"], [class*="Surface"],
          [class*="paper"], [class*="Paper"],
          [class*="frame"], [class*="Frame"],
          [class*="border"], [class*="Border"],
          [class*="shadow"], [class*="Shadow"],
          [class*="rounded"], [class*="Rounded"] {
            border: none !important;
            border-width: 0 !important;
            border-style: none !important;
            border-color: transparent !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            -moz-box-shadow: none !important;
            border-radius: 0 !important;
            -webkit-border-radius: 0 !important;
            -moz-border-radius: 0 !important;
            outline: none !important;
            background-color: white !important;
            background-image: none !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .bm6-hide-print { 
            display: none !important;
            visibility: hidden !important;
          }
          
          .bm6-table th,
          .bm6-table td {
            border: 1px solid #000 !important;
            background: white !important;
          }
          
          .bm6-vacant-row td {
            background: #f5f5f5 !important;
            font-style: italic;
          }
        }
        
        .bm6-root {
          font-family: Arial, sans-serif;
          font-size: 9px;
          background: white;
          color: black;
          padding: 5mm 8mm;
        }
        
        .bm6-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 7px;
          table-layout: fixed;
          background: white;
        }
        
        .bm6-table th,
        .bm6-table td {
          border: 1px solid black;
          padding: 2px 1px;
          vertical-align: middle;
          text-align: center;
          background: white;
        }
        
        .bm6-vertical {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          white-space: nowrap;
          height: 100px;
          padding: 2px 0;
        }
        
        .bm6-red { color: #D00000; font-weight: bold; }
        
        .bm6-vacant-row td {
          background: #fafafa;
          font-style: italic;
          color: #666;
        }
      `}</style>

      <div className="bm6-root">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, textTransform: 'uppercase' }}>
            {officeName || ddoCode ? `OFFICE OF THE ${officeName || ''} ${ddoCode || ''}`.trim() : filteredEmployees[0]?.employees.school_full_name || 'OFFICE NAME NOT SET'}
          </h1>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
            Statement Showing the Detail of Pay & Allowances for the Year {postsYear2Label}
          </h2>
        </div>

        {missingPayrollEmployees.length > 0 && (
          <div className="bm6-hide-print" style={{ marginBottom: 8, border: '1px solid #ef4444', background: '#fef2f2', padding: 8, fontSize: 9 }}>
            <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: 4 }}>
              The following employees have no payroll entered:
            </div>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', border: 'none' }}>Personal No</th>
                  <th style={{ textAlign: 'left', border: 'none' }}>Name</th>
                  <th style={{ textAlign: 'left', border: 'none' }}>School</th>
                </tr>
              </thead>
              <tbody>
                {missingPayrollEmployees.map((emp, i) => (
                  <tr key={i}>
                    <td style={{ border: 'none' }}>{emp.personalNo || '-'}</td>
                    <td style={{ border: 'none' }}>{emp.name || '-'}</td>
                    <td style={{ border: 'none' }}>{emp.school || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <table className="bm6-table">
          <colgroup>
            <col style={{ width: 16 }} />
            <col style={{ width: 40 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 48 }} />
            <col style={{ width: 22 }} />
            <col style={{ width: 40 }} />
            <col style={{ width: 40 }} />
            <col style={{ width: 40 }} />
            <col style={{ width: 48 }} />
            {hasPersonalPay && <col style={{ width: 28 }} />}
            <col style={{ width: 36 }} />
            <col style={{ width: 36 }} />
            {hasPersonalPay && <col style={{ width: 36 }} />}
            {visibleAllowanceHeaders.map((h, i) => <col key={i} style={{ width: 30 }} />)}
            <col style={{ width: 64 }} />
            <col style={{ width: 72 }} />
          </colgroup>
          <thead>
            <tr className="bm6-hide-print">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <th key={n} className={n >= 6 && n <= 8 ? 'bm6-hide-print' : ''}>{n}</th>
              ))}
              <th className="bm6-red" colSpan={hasPersonalPay ? 5 : 3}>9</th>
              <th colSpan={visibleAllowanceHeaders.length + 1}>10</th>
              <th className="bm6-red">11</th>
            </tr>
            <tr>
              <th rowSpan={2}>S.#</th>
              <th rowSpan={2}>Personal No</th>
              <th rowSpan={2}>Name</th>
              <th rowSpan={2}>Design;</th>
              <th rowSpan={2}>BPS</th>
              <th colSpan={3}>Sanctioned Pay of the Post</th>
              <th rowSpan={2}>Actual Pay<br />(Basic Pay)<br />Due to 1st<br />December<br />of coming FY</th>
              {hasPersonalPay && <th rowSpan={2}>Personal Pay</th>}
              <th colSpan={hasPersonalPay ? 3 : 2}>Amount of provision<br />for the coming FY</th>
              <th colSpan={visibleAllowanceHeaders.length}>Detail of Regular Allowances & other Allowances</th>
              <th rowSpan={2}>Total<br />Provision of<br />Allowances</th>
              <th rowSpan={2}>Total<br />Provision<br />for coming<br />FY</th>
            </tr>
            <tr>
              <th className="bm6-vertical" style={{ height: 80 }}>Minimum</th>
              <th className="bm6-vertical bm6-red" style={{ height: 80 }}>Annual Increment</th>
              <th className="bm6-vertical" style={{ height: 80 }}>Maximum</th>
              <th className="bm6-vertical" style={{ height: 70 }}>A01101</th>
              <th className="bm6-vertical" style={{ height: 70 }}>A01151</th>
              {hasPersonalPay && <th className="bm6-vertical" style={{ height: 70 }}>{personalCodeLabel}</th>}
              {visibleAllowanceHeaders.map((h, i) => (
                <th key={i}><div className="bm6-vertical">{h.label}</div></th>
              ))}
            </tr>
            <tr style={{ fontWeight: 700, height: 16 }}>
              <td colSpan={hasPersonalPay ? 10 : 9}></td>
              <td className="bm6-red">A01101</td>
              <td className="bm6-red">A01151</td>
              {hasPersonalPay && <td className="bm6-red">{personalCodeLabel}</td>}
              {visibleAllowanceHeaders.map((h, i) => <td key={i}>{h.code}</td>)}
              <td colSpan={2}></td>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i) => {
              if (row.type === 'sub') {
                return (
                  <tr key={i} className="bm6-red" style={{ height: 16 }}>
                    <td colSpan={hasPersonalPay ? 10 : 9} style={{ border: 'none' }}></td>
                    <td>{row.isGazettedGroup === true ? row.groupProv : ''}</td>
                    <td>{row.isGazettedGroup === false ? row.groupProv : ''}</td>
                    {hasPersonalPay && <td></td>}
                    <td colSpan={visibleAllowanceHeaders.length + 2} style={{ border: 'none' }}></td>
                  </tr>
                );
              }
              if (row.type === 'grand_total') {
                return (
                  <tr key={i} className="bm6-red" style={{ fontWeight: 700, borderTop: '2px solid black' }}>
                    <td colSpan={hasPersonalPay ? 10 : 9} style={{ textAlign: 'right', color: 'black' }}>Total For 12 Months</td>
                    <td>{row.a01101}</td>
                    <td>{row.a01151}</td>
                    {hasPersonalPay && <td>{row.personalYear}</td>}
                    {row.codes.map((v: any, j: number) => <td key={j}>{v}</td>)}
                    <td>{row.totAllow}</td>
                    <td>{row.totProv}</td>
                  </tr>
                );
              }
              return (
                <tr key={i} className={row.isVacant ? 'bm6-vacant-row' : ''}>
                  <td>{row.s}</td>
                  <td>{row.pNo}</td>
                  <td>{row.name}</td>
                  <td>{row.des}</td>
                  <td>{row.bps}</td>
                  <td>{row.min}</td>
                  <td>{row.inc}</td>
                  <td>{row.max}</td>
                  <td>{row.act}</td>
                  {hasPersonalPay && <td>{row.personalPay}</td>}
                  <td>{row.a01101}</td>
                  <td>{row.a01151}</td>
                  {hasPersonalPay && <td>{row.personalYear}</td>}
                  {row.codes.map((v: number, j: number) => (
                    <td key={j}>{v === 0 ? '0' : v.toLocaleString()}</td>
                  ))}
                  <td>{row.totAllow}</td>
                  <td>{row.totProv}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 10 }}>
          <div>Prepared By: Fazal Ali</div>
          <div style={{ textAlign: 'right' }}>
            <div>{signatureTitle}</div>
            <div style={{ whiteSpace: 'pre-line' }}>{signatureBody}</div>
          </div>
        </div>
      </div>
    </>
  );
};