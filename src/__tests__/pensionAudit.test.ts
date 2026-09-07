import { describe, it, expect } from 'vitest';
import { calculatePension, calculateServiceDuration, calculatePayroll } from '../utils';
import { unflattenEmployee } from '../utils/employeeAdapter';
import { EmployeeRecord } from '../types';

describe('Pension & Financial Engine Audit Tests', () => {
  it('correctly calculates qualifying service and service duration', () => {
    const dur = calculateServiceDuration('2000-01-01', '2030-01-01', 0);
    expect(dur.years).toBe(30);
    expect(dur.months).toBe(0);
    expect(dur.days).toBe(0);
  });

  it('safely handles invalid or inverted date ranges in calculateServiceDuration', () => {
    const inverted = calculateServiceDuration('2030-01-01', '2000-01-01', 0);
    expect(inverted.years).toBe(0);
    expect(inverted.text).toBe('Invalid Dates');

    const invalid = calculateServiceDuration('invalid-date', '2030-01-01', 0);
    expect(invalid.years).toBe(0);
    expect(invalid.text).toBe('Invalid Dates');
  });

  it('includes Adhoc Relief 2026 in monthly pension calculations', () => {
    const basicPay = 100000;
    const serviceYears = 30;
    const age = 60;
    const bps = 18;

    const res = calculatePension(basicPay, serviceYears, age, bps);

    expect(res.grossPension).toBe(70000);
    expect(res.netPensionBase).toBe(45500);

    // Reliefs: Medical (20%), Adhoc 2022 (15%), Adhoc 2023 (15%), Adhoc 2024 (10%), Adhoc 2026 (7%)
    const adhoc2026Relief = res.reliefs.find(r => r.label.includes('Adhoc Relief 2026'));
    expect(adhoc2026Relief).toBeDefined();
    expect(adhoc2026Relief?.amount).toBe(45500 * 0.07);
  });

  it('calculates total allowances including adhoc_2026 via calculatePayroll', () => {
    const financials: Partial<EmployeeRecord['financials']> = {
      basic_pay: 50000,
      hra: 5000,
      ca: 2000,
      ma: 1500,
      adhoc_2025_10: 5000,
      adhoc_2026: 3500,
    };

    const payroll = calculatePayroll(financials as EmployeeRecord['financials']);
    expect(payroll.grossPay).toBe(50000 + 5000 + 2000 + 1500 + 5000 + 3500);
  });

  it('safely adapts raw employee records with string and numeric values without NaN', () => {
    const rawRow = {
      name: 'Audit Test Employee',
      bps: '16',
      basic_pay: '45000',
      adhoc_2026: '3150',
      gpf: '3000',
    };

    const record = unflattenEmployee(rawRow);
    expect(record.employees.name).toBe('Audit Test Employee');
    expect(record.employees.bps).toBe(16);
    expect(record.financials.basic_pay).toBe(45000);
    expect(record.financials.adhoc_2026).toBe(3150);
    expect(record.financials.gpf).toBe(3000);
  });
});
