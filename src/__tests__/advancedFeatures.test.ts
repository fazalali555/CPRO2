import { describe, it, expect } from 'vitest';
import { calculatePension, calculateServiceDuration } from '../utils';
import { ENHANCED_TEMPLATES } from '../features/clerk-desk/constants/letter-constants';

describe('Advanced Features Suite Unit Tests', () => {
  it('calculates pension and 35% commutation lump sum accurately for AG sheet', () => {
    const basicPay = 80000;
    const serviceYears = 28;
    const age = 60;
    const bps = 17;

    const pension = calculatePension(basicPay, serviceYears, age, bps);

    expect(pension.grossPension).toBe((80000 * 28 * 7) / 300);
    expect(pension.netPensionBase).toBe(pension.grossPension * 0.65);
    expect(pension.commutationLumpSum).toBeGreaterThan(0);
    expect(pension.reliefs.some(r => r.label.includes('2026'))).toBe(true);
  });

  it('calculates net qualifying service duration for Service Verification Certificate', () => {
    const doa = '2000-01-01';
    const dor = '2030-01-01';
    const lwpDays = 30;

    const netDur = calculateServiceDuration(doa, dor, lwpDays);
    expect(netDur.years).toBe(29);
    expect(netDur.months).toBe(11);
  });

  it('contains newly added official letter templates (GPF, Pension Forwarding, Service Book)', () => {
    const gpfTpl = ENHANCED_TEMPLATES.find(t => t.id === 'tpl_gpf_sanction');
    const pensionFwdTpl = ENHANCED_TEMPLATES.find(t => t.id === 'tpl_pension_forwarding');
    const serviceBookTpl = ENHANCED_TEMPLATES.find(t => t.id === 'tpl_service_book_trans');

    expect(gpfTpl).toBeDefined();
    expect(pensionFwdTpl).toBeDefined();
    expect(serviceBookTpl).toBeDefined();
  });
});
