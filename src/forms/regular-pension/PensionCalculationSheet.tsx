import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { calculatePension } from '../../lib/pension';
import { getRetiringIncrementDetails } from '../../utils/RulesEngine';

interface Props {
  employee?: EmployeeRecord;
  caseRecord?: CaseRecord;
}

// Format date as 'YYYY - MM - Day' / 'YYYY - MM - DD' matching official calculation sheet
const formatDashDate = (dateStr?: string): string => {
  if (!dateStr) return '____ - __ - __';
  try {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[1]} - ${match[2]} - ${match[3]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy} - ${mm} - ${dd}`;
  } catch {
    return dateStr;
  }
};

// Calculate Date of Restoration (12 years after retirement date: DD-MM-YYYY)
const calculateRestorationDate = (retirementDateStr?: string): string => {
  if (!retirementDateStr) return '__-__-____';
  try {
    const match = retirementDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const yyyy = parseInt(match[1], 10) + 12;
      return `${match[3]}-${match[2]}-${yyyy}`;
    }
    const d = new Date(retirementDateStr);
    if (isNaN(d.getTime())) return retirementDateStr;
    const yyyy = d.getFullYear() + 12;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return '__-__-____';
  }
};

// Standard accounting subtraction for civil service (borrowing 30 days when day2 < day1)
const calculateServiceYMD = (startStr?: string, endStr?: string) => {
  if (!startStr || !endStr) return { years: 0, months: 0, days: 0, text: '0 y, 0 m, 0 d' };
  try {
    const sMatch = startStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const eMatch = endStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let y1 = 0, m1 = 0, d1 = 0;
    let y2 = 0, m2 = 0, d2 = 0;
    if (sMatch && eMatch) {
      y1 = parseInt(sMatch[1], 10);
      m1 = parseInt(sMatch[2], 10);
      d1 = parseInt(sMatch[3], 10);
      y2 = parseInt(eMatch[1], 10);
      m2 = parseInt(eMatch[2], 10);
      d2 = parseInt(eMatch[3], 10);
    } else {
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return { years: 0, months: 0, days: 0, text: '0 y, 0 m, 0 d' };
      y1 = s.getFullYear(); m1 = s.getMonth() + 1; d1 = s.getDate();
      y2 = e.getFullYear(); m2 = e.getMonth() + 1; d2 = e.getDate();
    }

    if (d2 < d1) {
      d2 += 30;
      m2 -= 1;
    }
    if (m2 < m1) {
      m2 += 12;
      y2 -= 1;
    }

    const days = Math.max(0, d2 - d1);
    const months = Math.max(0, m2 - m1);
    const years = Math.max(0, y2 - y1);
    return { years, months, days, text: `${years} y, ${months} m, ${days} d` };
  } catch {
    return { years: 0, months: 0, days: 0, text: '0 y, 0 m, 0 d' };
  }
};

const formatNum = (num: number, decimals: number = 2): string => {
  return (num || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const PensionCalculationSheet: React.FC<Props> = ({ employee, caseRecord }) => {
  const emp = employee?.employees;
  const service = employee?.service_history;
  const fin = employee?.financials;

  const doa = service?.date_of_appointment || '';
  const dor = service?.date_of_retirement || '';
  const dob = emp?.dob || '';
  const bps = Number(emp?.bps) || 15;
  const basicPay = fin?.basic_pay || 0;
  const personalPay = fin?.p_pay || 0;

  // Length of service and age calculation (civil service accounting)
  const serviceDiff = calculateServiceYMD(doa, dor);
  const ageDiff = calculateServiceYMD(dob, dor);
  const ageYears = ageDiff.years || 60;

  // Qualifying service capped at 30
  let qServiceYears = serviceDiff.years;
  if (serviceDiff.months >= 6) qServiceYears += 1;
  qServiceYears = Math.min(Math.max(qServiceYears, 0), 30);

  // Commutation option
  const commPct = Number(
    caseRecord?.extras?.commutation_portion ?? employee?.extras?.commutation_portion ?? 35
  );

  // Retiring / premature increment
  const manualIncrement = caseRecord?.extras?.retiring_year_increment ?? employee?.extras?.retiring_year_increment;
  const incrementDetails = getRetiringIncrementDetails(
    bps,
    dor,
    typeof manualIncrement === 'number' ? manualIncrement : undefined
  );
  const retiringIncrement = incrementDetails.amount;

  // Single authoritative calculation from src/lib/pension.ts
  const calc = calculatePension({
    basicPay,
    personalPay,
    qualifyingServiceYears: qServiceYears,
    commutationPortionPercent: commPct,
    ageAtRetirement: ageYears,
    bps,
    retirementDate: dor,
    retiringYearIncrement: retiringIncrement,
  });

  const commutationRate = (12 * calc.ageFactor).toFixed(4);
  const restorationDate = calculateRestorationDate(dor);
  const empName = emp?.name || 'Government Servant';
  const pensionType = (caseRecord?.extras?.service_category as string) || employee?.employees?.status || 'Superannuation';

  return (
    <div
      className="bg-white text-black font-sans text-[11pt] leading-normal relative print-page mx-auto shadow-md border-2 border-black p-8 print:p-6 print:border-2 print:border-black print:shadow-none box-border"
      style={{ width: '210mm', minHeight: '297mm' }}
    >
      {/* Title matching official calculation sheet */}
      <div className="mb-4">
        <h1 className="text-[14pt] font-bold tracking-tight">
          Pension Calculation in respect of {empName} (BPS-{bps})
        </h1>
        <div className="text-center text-[10.5pt] font-medium mt-2 leading-relaxed">
          <div>Retired from Government of Khyber Pakhtunkhwa on {pensionType} Pension</div>
          <div>Opted for {commPct}% commutation</div>
        </div>
      </div>

      {/* Date & Service Breakdown */}
      <div className="mb-4 flex flex-col items-end">
        <div className="w-full max-w-[420px]">
          <div className="text-right text-[10pt] font-semibold text-gray-700 mb-0.5">
            Year - Month - Day
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">Date of Retirement :</span>
              <span className="font-mono">{formatDashDate(dor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date of Birth :</span>
              <span className="font-mono">{formatDashDate(dob)}</span>
            </div>
            <div className="border-b border-black my-1" />
            <div className="flex justify-between pb-2">
              <span className="font-medium">Age at Retirement :</span>
              <span className="font-mono">{ageYears} y</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Date of Retirement :</span>
              <span className="font-mono">{formatDashDate(dor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Date of Appointment :</span>
              <span className="font-mono">{formatDashDate(doa)}</span>
            </div>
            <div className="border-b border-black my-1" />
            <div className="flex justify-between">
              <span className="font-medium">Length Service :</span>
              <span className="font-mono">{serviceDiff.text}</span>
            </div>
            <div className="border-b border-black my-1" />
          </div>
        </div>
      </div>

      {/* Financial Emoluments & Commutation Table */}
      <div className="mb-4 flex flex-col items-end">
        <div className="w-full max-w-[420px] space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">Qualifying Service :</span>
            <span className="font-mono">{qServiceYears} years</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Basic Pay :</span>
            <span className="font-mono">{formatNum(basicPay)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Retiring Year Increment :</span>
            <span className="font-mono">{formatNum(calc.retiringYearIncrement)}</span>
          </div>
          <div className="border-b border-black my-1" />
          <div className="flex justify-between">
            <span className="font-medium">Total Emoluments :</span>
            <span className="font-mono">{formatNum(calc.pensionablePay)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Gross Pension :</span>
            <span className="font-mono">{formatNum(calc.grossPension)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">{commPct}% Commuted Portion :</span>
            <span className="font-mono">{formatNum(calc.commutationAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Net Pension :</span>
            <span className="font-mono">{formatNum(calc.netPension)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Commutation Rate :</span>
            <span className="font-mono">{commutationRate}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Commutation Amount :</span>
            <span className="font-mono">{formatNum(calc.commutationLumpSum)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Date of Restoration :</span>
            <span className="font-mono">{restorationDate}</span>
          </div>
        </div>
      </div>

      {/* Itemized Adhoc Increases & Monthly Pension Breakdown Table */}
      <div className="mb-6 flex flex-col items-end">
        <div className="w-full max-w-[420px] border-t border-black pt-2">
          {/* Top header row: Net Pension */}
          <div className="flex justify-between bg-gray-200 px-2 py-1 font-medium">
            <span>Net Pension :</span>
            <span className="font-mono">{formatNum(calc.netPension)}</span>
          </div>

          <div className="space-y-0.5 mt-1">
            {calc.adhocRelief2022 > 0 && (
              <div className="flex justify-between px-2 py-0.5">
                <span className="w-1/2">15% increase of 2022</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.adhocRelief2022)}</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.runningAfter2022)}</span>
              </div>
            )}
            {calc.adhocRelief2023 > 0 && (
              <div className="flex justify-between px-2 py-0.5">
                <span className="w-1/2">17.5% increase of 2023</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.adhocRelief2023)}</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.runningAfter2023)}</span>
              </div>
            )}
            {calc.adhocRelief2024 > 0 && (
              <div className="flex justify-between px-2 py-0.5">
                <span className="w-1/2">15% increase of 2024</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.adhocRelief2024)}</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.runningAfter2024)}</span>
              </div>
            )}
            {calc.adhocRelief2025 > 0 && (
              <div className="flex justify-between px-2 py-0.5">
                <span className="w-1/2">7% increase of 2025</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.adhocRelief2025)}</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.runningAfter2025)}</span>
              </div>
            )}
            {calc.adhocRelief2026 > 0 && (
              <div className="flex justify-between px-2 py-0.5">
                <span className="w-1/2">7% increase of 2026</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.adhocRelief2026)}</span>
                <span className="font-mono w-1/4 text-right">{formatNum(calc.runningAfter2026)}</span>
              </div>
            )}

            {/* Medical Allowances */}
            <div className="flex justify-between bg-gray-200 px-2 py-0.5 mt-1 font-medium">
              <span className="w-2/3">{calc.medicalAllowanceRate * 100}% Medical Allowance of 2010</span>
              <span className="font-mono w-1/3 text-right">{formatNum(calc.medicalAllowance2010)}</span>
            </div>
            <div className="flex justify-between bg-gray-200 px-2 py-0.5 font-medium">
              <span className="w-2/3">25% increase on Medical Allowance</span>
              <span className="font-mono w-1/3 text-right">{formatNum(calc.medicalAllowance2022)}</span>
            </div>

            {/* Net Pension Payable */}
            <div className="flex justify-between border-y-2 border-black px-2 py-1.5 mt-2 font-bold text-[11.5pt]">
              <span>Net Pension Payable Rs.</span>
              <span className="font-mono">{formatNum(calc.monthlyPayablePension)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Signatures */}
      <div className="mt-8 pt-4 flex justify-between items-end text-xs font-bold">
        <div className="text-center">
          <div className="h-8"></div>
          <div className="border-t border-black pt-1 px-4">Dealing Assistant / Assistant Director</div>
        </div>
        <div className="text-center">
          <div className="h-8"></div>
          <div className="border-t border-black pt-1 px-4">District Accounts Officer / AG KP</div>
        </div>
      </div>
    </div>
  );
};
