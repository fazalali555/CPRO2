export interface SanctionedPost {
  id: string;
  designation: string;
  bps: number;
  sanctioned: number;
  filled: number;
  vacant: number;
  status: 'Active' | 'Inactive';
}

export interface TransferRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  fromSchool: string;
  toSchool: string;
  reason: string;
  appliedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface MedicalClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  claimType: string;
  remarks: string;
  submittedAt: string;
  status: 'Submitted' | 'Approved' | 'Rejected';
}

export interface LoanApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  loanType: 'HBA' | 'Vehicle';
  amount: number;
  purpose: string;
  status: 'Submitted' | 'Approved' | 'Rejected';
  submittedAt: string;
}

export interface SchoolInspection {
  id: string;
  schoolName: string;
  officerName: string;
  inspectionDate: string;
  checklist: ChecklistItem[];
  deficiencies: string[];
  photos: string[];
  status: 'Compliant' | 'Deficient';
}

export interface ChecklistItem {
  id: string;
  label: string;
  ok: boolean;
}

export interface EMISReport {
  id: string;
  schoolName: string;
  month: string;
  boys: number;
  girls: number;
  attendance: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  reorder: number;
  unit: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  participants: string[];
  agenda: string;
  minutes: string;
  actionItems: string[];
}

export type AdminTab = 
  | 'sne' 
  | 'seniority' 
  | 'increment' 
  | 'transfers' 
  | 'claims' 
  | 'loans' 
  | 'inspection' 
  | 'emis' 
  | 'inventory' 
  | 'meetings';

// Institution types
export * from './institution';

// ACR types
export * from './acr';
