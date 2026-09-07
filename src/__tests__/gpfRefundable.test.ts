import { describe, it, expect } from 'vitest';
import { calculateGpfRefundable, getGpfRefundableDefaults } from '../utils';
import { EmployeeRecord } from '../types';

describe('GPF Refundable Calculations & Defaults', () => {
  describe('calculateGpfRefundable', () => {
    it('automatically calculates 80% admissible limit as requested amount when custom is not provided', () => {
      // e.g. Current Balance = 165,465 -> 80% = 132,372
      const result = calculateGpfRefundable(165465, 36);
      expect(result.currentBalance).toBe(165465);
      expect(result.admissibleLimit).toBe(132372);
      expect(result.amountRequested).toBe(132372);
      expect(result.installments).toBe(36);
      // Monthly deduction: Math.ceil(132372 / 36) = 3677
      expect(result.monthlyDeduction).toBe(3677);
    });

    it('allows custom amount requested to override the 80% default', () => {
      const result = calculateGpfRefundable(165465, 36, 100000);
      expect(result.currentBalance).toBe(165465);
      expect(result.admissibleLimit).toBe(132372);
      expect(result.amountRequested).toBe(100000);
      // Math.ceil(100000 / 36) = 2778
      expect(result.monthlyDeduction).toBe(2778);
    });

    it('calculates monthly deduction accurately when installments are changed', () => {
      const result = calculateGpfRefundable(165465, 24, 100000);
      expect(result.installments).toBe(24);
      expect(result.amountRequested).toBe(100000);
      // Math.ceil(100000 / 24) = 4167
      expect(result.monthlyDeduction).toBe(4167);
    });

    it('handles zero or negative balance gracefully', () => {
      const result = calculateGpfRefundable(0, 36);
      expect(result.admissibleLimit).toBe(0);
      expect(result.amountRequested).toBe(0);
      expect(result.monthlyDeduction).toBe(0);
    });
  });

  describe('getGpfRefundableDefaults', () => {
    const mockEmployee: EmployeeRecord = {
      id: 'emp-synthetic-01',
      schemaVersion: 1,
      employees: {
        personal_no: '12345678',
        name: 'Synthetic Test Employee',
        father_name: 'Test Father',
        cnic_no: '12345-1234567-1',
        dob: '1985-05-15',
        designation: 'PST',
        bps: 14,
        status: 'Active',
        gpf_account_no: 'GPF-998877',
      } as unknown as EmployeeRecord['employees'],
      financials: {
        basic_pay: 45000,
        hra: 5000,
        ca: 2000,
        ma: 1500,
        gpf: 3000,
        bf: 1000,
      } as unknown as EmployeeRecord['financials'],
      service_history: {} as unknown as EmployeeRecord['service_history'],
      family_members: [],
      extras: {
        gpf_balance: 200000,
      },
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
    };

    it('fetches basic pay, net pay, gpf account no, and derives 80% advance from employee record', () => {
      const defaults = getGpfRefundableDefaults(mockEmployee);
      
      expect(defaults.gpf_account_no).toBe('GPF-998877');
      expect(defaults.basic_pay).toBe(45000);
      // gross = 45000 + 5000 + 2000 + 1500 = 53500; deductions = 3000 + 1000 = 4000; net = 49500
      expect(defaults.net_pay).toBe(49500);
      expect(defaults.current_balance).toBe(200000);
      expect(defaults.installments).toBe(36);
      // 80% of 200,000 = 160,000
      expect(defaults.amount_requested).toBe(160000);
      // Math.ceil(160000 / 36) = 4445
      expect(defaults.monthly_deduction).toBe(4445);
      expect(defaults.monthly_recovery).toBe(4445);
    });

    it('preserves existing user overrides in extras', () => {
      const existingExtras: Record<string, unknown> = {
        gpf_account_no: 'CUSTOM-ACC',
        basic_pay: 50000,
        net_pay: 52000,
        current_balance: 100000,
        amount_requested: 50000,
        installments: 20,
      };

      const defaults = getGpfRefundableDefaults(mockEmployee, existingExtras);
      expect(defaults.gpf_account_no).toBe('CUSTOM-ACC');
      expect(defaults.basic_pay).toBe(50000);
      expect(defaults.net_pay).toBe(52000);
      expect(defaults.current_balance).toBe(100000);
      expect(defaults.amount_requested).toBe(50000);
      expect(defaults.installments).toBe(20);
      expect(defaults.monthly_deduction).toBe(2500); // 50000 / 20
    });

    it('fetches gpf_account_no from employee.financials if present', () => {
      const empWithFinancialGpf: EmployeeRecord = {
        ...mockEmployee,
        employees: {
          ...mockEmployee.employees,
          gpf_account_no: '',
        },
        financials: {
          ...mockEmployee.financials,
          gpf_account_no: 'FIN-GPF-12345',
        },
      };

      const defaults = getGpfRefundableDefaults(empWithFinancialGpf);
      expect(defaults.gpf_account_no).toBe('FIN-GPF-12345');
    });
  });
});
