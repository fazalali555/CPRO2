import { EmployeeRecord } from '../types';

/**
 * KP / Federal Revised Pay Scales 2026 - Annual Increment Table
 * (Active scale, effective from July 1, 2026)
 */
export const ANNUAL_INCREMENTS_2026: Record<number, number> = {
  1: 520,
  2: 590,
  3: 700,
  4: 800,
  5: 910,
  6: 1010,
  7: 1100,
  8: 1210,
  9: 1310,
  10: 1430,
  11: 1580,
  12: 1720,
  13: 1880,
  14: 2090,
  15: 2380,
  16: 2720,
  17: 4110,
  18: 5120,
  19: 5450,
  20: 8040,
  21: 8920,
  22: 10470,
};

/**
 * KP / Federal Revised Pay Scales 2022 - Annual Increment Table
 * (Applicable for retirements between July 1, 2022 and June 30, 2026)
 */
export const ANNUAL_INCREMENTS_2022: Record<number, number> = {
  1: 430,
  2: 490,
  3: 580,
  4: 660,
  5: 750,
  6: 840,
  7: 910,
  8: 1000,
  9: 1090,
  10: 1190,
  11: 1310,
  12: 1430,
  13: 1560,
  14: 1740,
  15: 1980,
  16: 2260,
  17: 3420,
  18: 4260,
  19: 4530,
  20: 6690,
  21: 7420,
  22: 8710,
};

// Current active scale defaults to 2026
export const ANNUAL_INCREMENTS: Record<number, number> = ANNUAL_INCREMENTS_2026;

/**
 * Calculates the next basic pay after annual increment (1st December)
 */
export const calculateAnnualIncrement = (bps: number, currentBasicPay: number): number => {
  const increment = ANNUAL_INCREMENTS[bps] || 0;
  return currentBasicPay + increment;
};

/**
 * Sorts employees for seniority list generation
 * Logic: 
 * 1. BPS (Descending)
 * 2. Date of Regularization (Earlier = Senior)
 * 3. Length of Service (Date of Appointment)
 */
export const generateSeniorityList = (employees: EmployeeRecord[]): EmployeeRecord[] => {
  return [...employees].sort((a, b) => {
    // 1. Compare BPS (Higher BPS is more senior)
    if (b.employees.bps !== a.employees.bps) {
      return b.employees.bps - a.employees.bps;
    }

    // 2. Compare Date of Regularization (Earlier is more senior)
    const regA = new Date(a.service_history.date_of_regularization || a.service_history.date_of_appointment).getTime();
    const regB = new Date(b.service_history.date_of_regularization || b.service_history.date_of_appointment).getTime();
    
    if (regA !== regB) {
      return regA - regB;
    }

    // 3. Compare Length of Service / Appointment Date
    const appA = new Date(a.service_history.date_of_appointment).getTime();
    const appB = new Date(b.service_history.date_of_appointment).getTime();
    
    return appA - appB;
  });
};

/**
 * Checks if an employee is eligible for an increment this December
 * (Must have 6 months of service before 1st December)
 */
export const isEligibleForIncrement = (appointmentDate: string): boolean => {
  if (!appointmentDate) return false;
  const appDate = new Date(appointmentDate);
  if (isNaN(appDate.getTime())) return false;
  const cutoff = new Date(appDate.getFullYear(), 5, 1); // June 1st of the appointment year
  return appDate <= cutoff;
};

/**
 * Checks if a retiring civil servant is eligible for one premature / retiring annual increment
 * under Federal Finance Division O.M. No. F.3(20)R-2/98 & KP Civil Service Rules.
 *
 * Rule:
 * Civil servants who retire between 1st June and 30th November (inclusive) have completed
 * at least 6 months of service in their retirement calendar year prior to the normal 1st December
 * increment date. Therefore, they are granted 1 annual increment for pension & LPC calculation.
 */
export const isEligibleForRetiringIncrement = (retirementDate?: string): boolean => {
  if (!retirementDate) return false;
  try {
    // Expected formats: YYYY-MM-DD or parseable ISO/date string
    const match = retirementDate.match(/(\d{4})-(\d{2})-(\d{2})/);
    let month = 0;
    let day = 0;
    if (match) {
      month = parseInt(match[2], 10);
      day = parseInt(match[3], 10);
    } else {
      const d = new Date(retirementDate);
      if (isNaN(d.getTime())) return false;
      month = d.getMonth() + 1; // 1-12
      day = d.getDate();
    }

    // Between June 1st (06-01) and November 30th (11-30) inclusive
    if (month > 6 && month < 11) return true; // July, August, September, October
    if (month === 6 && day >= 1) return true;  // June 1 to June 30
    if (month === 11 && day <= 30) return true; // November 1 to November 30
    return false;
  } catch {
    return false;
  }
};

export interface RetiringIncrementInfo {
  eligible: boolean;
  amount: number;
  reason: string;
}

/**
 * Returns full details of the retiring increment (eligibility, scale increment amount, and rationale).
 */
export const getRetiringIncrementDetails = (
  bps?: number,
  retirementDate?: string,
  manualOverride?: number
): RetiringIncrementInfo => {
  if (manualOverride !== undefined && manualOverride !== null && !isNaN(Number(manualOverride)) && Number(manualOverride) > 0) {
    return {
      eligible: true,
      amount: Number(manualOverride),
      reason: `Manual override of Rs. ${Number(manualOverride).toLocaleString()} applied.`,
    };
  }

  const validBps = Number(bps) || 0;
  const scaleTable = (retirementDate && retirementDate < '2026-07-01') ? ANNUAL_INCREMENTS_2022 : ANNUAL_INCREMENTS_2026;
  const standardIncrement = scaleTable[validBps] || 0;
  const eligible = isEligibleForRetiringIncrement(retirementDate);

  if (eligible) {
    return {
      eligible: true,
      amount: standardIncrement,
      reason: `Retirement date (${retirementDate || 'N/A'}) is between 1st June and 30th November: eligible for 1 annual increment for BPS-${validBps} (Rs. ${standardIncrement.toLocaleString()}).`,
    };
  }

  return {
    eligible: false,
    amount: 0,
    reason: retirementDate
      ? `Retirement date (${retirementDate}) does not fall between 1st June and 30th November (less than 6 months service in retirement year or retiring after 1st Dec increment).`
      : 'No retirement date specified.',
  };
};

