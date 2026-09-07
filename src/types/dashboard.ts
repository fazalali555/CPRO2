import { EmployeeRecord, CaseRecord } from '../types';

export type SearchResultType = 
  | 'Employee'
  | 'Case'
  | 'Transfer'
  | 'Inspection'
  | 'EMIS'
  | 'Inventory'
  | 'Meeting'
  | 'Claim'
  | 'Loan';

export interface SearchResult {
  type: SearchResultType;
  title: string;
  subtitle: string;
  route: string;
}

export interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

export interface StatTileProps {
  label: string;
  value: number;
  icon: string;
  color: 'primary' | 'emerald' | 'orange' | 'purple';
  onClick: () => void;
}

export interface QuickActionProps {
  icon: string;
  label: string;
  desc: string;
  onClick: () => void;
  primary?: boolean;
}

export interface PendingChecklistMetrics {
  totalPendingItems: number;
  casesWithPendingItems: number;
}
