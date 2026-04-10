import { z } from 'zod';

export const sanctionedPostSchema = z.object({
  designation: z.string()
    .min(2, 'Designation must be at least 2 characters')
    .max(100, 'Designation too long'),
  bps: z.number()
    .int('BPS must be a whole number')
    .min(1, 'BPS must be at least 1')
    .max(22, 'BPS cannot exceed 22'),
  sanctioned: z.number()
    .int('Sanctioned posts must be a whole number')
    .min(1, 'Must have at least 1 sanctioned post')
    .max(1000, 'Sanctioned posts seems too high'),
});

export const transferRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  toSchool: z.string().min(3, 'School name is required'),
  reason: z.string().optional(),
});

export const medicalClaimSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  amount: z.number().positive('Amount must be positive'),
  claimType: z.string().min(1, 'Claim type is required'),
  remarks: z.string().optional(),
});

export const loanApplicationSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  loanType: z.enum(['HBA', 'Vehicle']),
  amount: z.number().positive('Amount must be positive'),
  purpose: z.string().min(5, 'Purpose is required'),
});

export type SanctionedPostInput = z.infer<typeof sanctionedPostSchema>;
export type TransferRequestInput = z.infer<typeof transferRequestSchema>;
export type MedicalClaimInput = z.infer<typeof medicalClaimSchema>;
export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
