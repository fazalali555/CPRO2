import { describe, it, expect } from 'vitest';
import { calculatePension } from '../pension';
import { AGE_FACTORS } from '../../constants';

describe('pension calculations', () => {
  it('computes core values', () => {
    const r = calculatePension({ basicPay: 60000, personalPay: 0, qualifyingServiceYears: 30, commutationPortionPercent: 35, ageAtRetirement: 60 });
    expect(r.pensionablePay).toBe(60000);
    expect(r.grossPension).toBeCloseTo(42000, 4);
    expect(r.commutationAmount).toBeCloseTo(14700, 4);
    expect(r.netPension).toBeCloseTo(27300, 4);
    // Age 60 superannuation is capped at age 60 factor (12.3719)
    expect(r.ageFactor).toBeCloseTo(AGE_FACTORS[60], 4);
    expect(r.commutationLumpSum).toBeCloseTo(14700 * 12 * AGE_FACTORS[60], 2);
    expect(r.monthlyPayablePension).toBeGreaterThan(r.netPension);
  });

  it('matches post 01-JUL-2026 AG KP benchmark case exactly', () => {
    const r = calculatePension({
      basicPay: 97750,
      personalPay: 0,
      retiringYearIncrement: 2380,
      qualifyingServiceYears: 30,
      commutationPortionPercent: 35,
      ageAtRetirement: 60,
      bps: 15,
      retirementDate: '2026-08-20',
    });

    expect(r.pensionablePay).toBe(100130);
    expect(r.grossPension).toBe(70091);
    expect(r.commutationAmount).toBe(24531.85);
    expect(r.netPension).toBe(45559.15);
    expect(r.commutationLumpSum).toBeCloseTo(3642067.14, 2);
    expect(r.adhocRelief2022).toBe(6833.87);
    expect(r.runningAfter2022).toBe(52393.02);
    expect(r.adhocRelief2023).toBe(9168.78);
    expect(r.runningAfter2023).toBe(61561.80);
    expect(r.adhocRelief2024).toBe(9234.27);
    expect(r.runningAfter2024).toBe(70796.07);
    expect(r.adhocRelief2025).toBe(4955.72);
    expect(r.runningAfter2025).toBe(75751.79);
    expect(r.adhocRelief2026).toBe(5302.63);
    expect(r.runningAfter2026).toBe(81054.42);
    expect(r.medicalAllowance2010).toBe(11389.79);
    expect(r.medicalAllowance2022).toBe(2847.45);
    expect(r.monthlyPayablePension).toBe(95291.66);
  });

  it('excludes future adhoc reliefs for historical retirement dates (e.g. 2023-03-17)', () => {
    const r = calculatePension({
      basicPay: 61720,
      personalPay: 0,
      qualifyingServiceYears: 30,
      commutationPortionPercent: 35,
      ageAtRetirement: 60,
      bps: 13,
      retirementDate: '2023-03-17',
    });

    expect(r.grossPension).toBe(43204);
    expect(r.commutationAmount).toBe(15121.40);
    expect(r.netPension).toBeCloseTo(28082.60, 2);
    expect(r.adhocRelief2022).toBe(4212.39);
    expect(r.runningAfter2022).toBe(32294.99);
    expect(r.adhocRelief2023).toBe(5651.62);
    expect(r.runningAfter2023).toBe(37946.61);

    // 2024, 2025, 2026 reliefs MUST BE EXCLUDED (0) for 2023 retirement
    expect(r.adhocRelief2024).toBe(0);
    expect(r.runningAfter2024).toBe(37946.61);
    expect(r.adhocRelief2025).toBe(0);
    expect(r.runningAfter2025).toBe(37946.61);
    expect(r.adhocRelief2026).toBe(0);
    expect(r.runningAfter2026).toBe(37946.61);
  });

  it('caps qualifying service at 30', () => {
    const r = calculatePension({ basicPay: 50000, personalPay: 5000, qualifyingServiceYears: 45, commutationPortionPercent: 35, ageAtRetirement: 60 });
    expect(r.qualifyingServiceYears).toBe(30);
  });

  it('rejects negative inputs', () => {
    expect(() => calculatePension({ basicPay: -1, personalPay: 0, qualifyingServiceYears: 10 })).toThrow();
    expect(() => calculatePension({ basicPay: 0, personalPay: -5, qualifyingServiceYears: 10 })).toThrow();
    expect(() => calculatePension({ basicPay: 0, personalPay: 0, qualifyingServiceYears: -1 })).toThrow();
  });

  it('rejects invalid commutation percent', () => {
    expect(() => calculatePension({ basicPay: 0, personalPay: 0, qualifyingServiceYears: 10, commutationPortionPercent: 200 })).toThrow();
  });
});
