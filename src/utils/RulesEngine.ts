import { EmployeeRecord } from '../types';

/**
 * KP Revised Pay Scales 2022 - Annual Increment Table
 */
export const ANNUAL_INCREMENTS: Record<number, number> = {
  1: 290,
  2: 330,
  3: 390,
  4: 440,
  5: 500,
  6: 560,
  7: 610,
  8: 670,
  9: 730,
  10: 800,
  11: 880,
  12: 960,
  13: 1050,
  14: 1170,
  15: 1320,
  16: 1520,
  17: 2300,
  18: 2870,
  19: 3050,
  20: 4600,
  21: 5000,
  22: 5870,
};

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
