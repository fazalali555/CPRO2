export const ADMIN_TABS = [
  { id: 'sne', labelKey: 'admin.sneStrength', icon: 'groups' },
  { id: 'seniority', labelKey: 'admin.seniorityList', icon: 'format_list_numbered' },
  { id: 'acr', labelKey: 'admin.acr', icon: 'assignment_ind' },
  { id: 'increment', labelKey: 'admin.annualIncrements', icon: 'trending_up' },
  { id: 'transfers', labelKey: 'admin.transfers', icon: 'swap_horiz' },
  { id: 'claims', labelKey: 'admin.medicalClaims', icon: 'medical_services' },
  { id: 'loans', labelKey: 'admin.loans', icon: 'directions_car' },
  { id: 'inspection', labelKey: 'admin.inspection', icon: 'checklist' },
  { id: 'emis', labelKey: 'admin.emis', icon: 'school' },
  { id: 'inventory', labelKey: 'admin.inventory', icon: 'inventory_2' },
  { id: 'meetings', labelKey: 'admin.meetings', icon: 'event' },
] as const;

export const STORAGE_KEYS = {
  SNE_POSTS: 'kpk_admin_sanctioned_posts',
  TRANSFER_REQUESTS: 'kpk_transfer_requests',
  MEDICAL_CLAIMS: 'kpk_medical_claims',
  LOAN_APPLICATIONS: 'kpk_loan_applications',
  INSPECTIONS: 'kpk_school_inspections',
  EMIS_REPORTS: 'kpk_emis_reports',
  INVENTORY_ITEMS: 'kpk_inventory_items',
  MEETINGS: 'kpk_meetings',
} as const;

// Re-export ACR constants
export * from './acr-constants';
