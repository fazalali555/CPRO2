import { describe, it, expect } from 'vitest';
import { 
  isEligibleForRetiringIncrement, 
  getRetiringIncrementDetails, 
  ANNUAL_INCREMENTS 
} from '../utils/RulesEngine';
import { calculatePension as calculateLibPension } from '../lib/pension';
import { calculatePension as calculateUtilsPension } from '../utils';

describe('Retiring / Premature Increment Rules & Calculations', () => {
  describe('isEligibleForRetiringIncrement', () => {
    it('returns true for dates between 1st June and 30th November (inclusive)', () => {
      expect(isEligibleForRetiringIncrement('2026-06-01')).toBe(true);
      expect(isEligibleForRetiringIncrement('2026-07-01')).toBe(true);
      expect(isEligibleForRetiringIncrement('2026-07-15')).toBe(true);
      expect(isEligibleForRetiringIncrement('2026-08-20')).toBe(true);
      expect(isEligibleForRetiringIncrement('2026-10-31')).toBe(true);
      expect(isEligibleForRetiringIncrement('2026-11-30')).toBe(true);
    });

    it('returns false for dates outside the June 1 - Nov 30 window', () => {
      expect(isEligibleForRetiringIncrement('2026-05-31')).toBe(false);
      expect(isEligibleForRetiringIncrement('2026-01-15')).toBe(false);
      expect(isEligibleForRetiringIncrement('2026-03-23')).toBe(false);
      expect(isEligibleForRetiringIncrement('2026-12-01')).toBe(false);
      expect(isEligibleForRetiringIncrement('2026-12-31')).toBe(false);
      expect(isEligibleForRetiringIncrement('')).toBe(false);
      expect(isEligibleForRetiringIncrement(undefined)).toBe(false);
    });
  });

  describe('getRetiringIncrementDetails', () => {
    it('returns accurate BPS increment amount for eligible retirement dates', () => {
      const bps16 = getRetiringIncrementDetails(16, '2026-08-15');
      expect(bps16.eligible).toBe(true);
      expect(bps16.amount).toBe(ANNUAL_INCREMENTS[16]); // 1520
      expect(bps16.reason).toContain('eligible for 1 annual increment for BPS-16');

      const bps17 = getRetiringIncrementDetails(17, '2026-07-10');
      expect(bps17.eligible).toBe(true);
      expect(bps17.amount).toBe(ANNUAL_INCREMENTS[17]); // 2300

      const bps18 = getRetiringIncrementDetails(18, '2026-11-01');
      expect(bps18.eligible).toBe(true);
      expect(bps18.amount).toBe(ANNUAL_INCREMENTS[18]); // 2870
    });

    it('returns 0 amount for ineligible dates', () => {
      const res = getRetiringIncrementDetails(16, '2026-04-10');
      expect(res.eligible).toBe(false);
      expect(res.amount).toBe(0);
      expect(res.reason).toContain('does not fall between 1st June and 30th November');
    });

    it('honors manual overrides regardless of date', () => {
      const override = getRetiringIncrementDetails(16, '2026-02-10', 5000);
      expect(override.eligible).toBe(true);
      expect(override.amount).toBe(5000);
      expect(override.reason).toContain('Manual override');
    });
  });

  describe('calculatePension (src/lib/pension.ts)', () => {
    it('automatically applies retiring increment when retiring in July/August without explicit override', () => {
      const res = calculateLibPension({
        basicPay: 50000,
        personalPay: 0,
        qualifyingServiceYears: 30,
        commutationPortionPercent: 35,
        ageAtRetirement: 60,
        bps: 16,
        retirementDate: '2026-08-15',
      });

      // BPS 16 increment under RBPS-2026 is 2720
      expect(res.retiringYearIncrement).toBe(2720);
      expect(res.pensionablePay).toBe(50000 + 2720);
      // gross pension = (52720 * 30 * 7) / 300 = 36904
      expect(res.grossPension).toBe(36904);
    });

    it('matches official benchmark for Muhammad Afzal Khan (BPS-15, retired 2026-08-04)', () => {
      const res = calculateLibPension({
        basicPay: 92990,
        personalPay: 0,
        qualifyingServiceYears: 30,
        commutationPortionPercent: 35,
        ageAtRetirement: 60,
        bps: 15,
        retirementDate: '2026-08-04',
      });

      expect(res.retiringYearIncrement).toBe(2380);
      expect(res.pensionablePay).toBe(95370);
      expect(res.grossPension).toBe(66759);
      expect(res.commutationAmount).toBe(23365.65);
      expect(res.netPension).toBe(43393.35);
      expect(res.commutationLumpSum).toBe(3468929.82);
      expect(res.adhocRelief2022).toBe(6509.00);
      expect(res.adhocRelief2023).toBe(8732.91);
      expect(res.adhocRelief2024).toBe(8795.29);
      expect(res.adhocRelief2025).toBe(4720.14);
      expect(res.adhocRelief2026).toBe(5050.55);
      expect(res.medicalAllowance2010).toBe(10848.34);
      expect(res.medicalAllowance2022).toBe(2712.09);
      expect(res.monthlyPayablePension).toBe(90761.67);
    });

    it('does not apply retiring increment automatically when retiring in March', () => {
      const res = calculateLibPension({
        basicPay: 50000,
        personalPay: 0,
        qualifyingServiceYears: 30,
        commutationPortionPercent: 35,
        ageAtRetirement: 60,
        bps: 16,
        retirementDate: '2026-03-15',
      });

      expect(res.retiringYearIncrement).toBe(0);
      expect(res.pensionablePay).toBe(50000);
      expect(res.grossPension).toBe(35000);
    });

    it('respects explicitly provided retiringYearIncrement', () => {
      const res = calculateLibPension({
        basicPay: 50000,
        personalPay: 0,
        qualifyingServiceYears: 30,
        commutationPortionPercent: 35,
        ageAtRetirement: 60,
        bps: 16,
        retirementDate: '2026-08-15',
        retiringYearIncrement: 3000,
      });

      expect(res.retiringYearIncrement).toBe(3000);
      expect(res.pensionablePay).toBe(53000);
      expect(res.grossPension).toBe((53000 * 30 * 7) / 300);
    });
  });

  describe('calculatePension (src/utils.ts)', () => {
    it('maintains backward compatibility with 4 arguments (default 0 increment)', () => {
      const res = calculateUtilsPension(100000, 30, 60, 18);
      expect(res.grossPension).toBe(70000);
      expect(res.netPensionBase).toBe(45500);
      expect(res.retiringIncrement).toBe(0);
      expect(res.pensionablePay).toBe(100000);
    });

    it('includes retiring increment in pensionable pay and gross pension when 5th argument is passed', () => {
      const increment = 2870; // BPS 18
      const res = calculateUtilsPension(100000, 30, 60, 18, increment);
      
      expect(res.retiringIncrement).toBe(2870);
      expect(res.pensionablePay).toBe(102870);
      // gross = (102870 * 30 * 7) / 300 = 72009
      expect(res.grossPension).toBe(72009);
      expect(res.netPensionBase).toBe(72009 * 0.65);
    });
  });
});
