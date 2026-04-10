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
    // Age 60 -> Age Next Birthday 61
    expect(r.ageFactor).toBeCloseTo(AGE_FACTORS[61], 4);
    expect(r.commutationLumpSum).toBeCloseTo(14700 * 12 * AGE_FACTORS[61], 2);
    expect(r.monthlyPayablePension).toBeGreaterThan(r.netPension);
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
