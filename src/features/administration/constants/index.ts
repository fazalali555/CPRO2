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
  SNE_POSTS: 'clerk_pro_admin_sanctioned_posts',
  TRANSFER_REQUESTS: 'clerk_pro_transfer_requests',
  MEDICAL_CLAIMS: 'clerk_pro_medical_claims',
  LOAN_APPLICATIONS: 'clerk_pro_loan_applications',
  INSPECTIONS: 'clerk_pro_school_inspections',
  EMIS_REPORTS: 'clerk_pro_emis_reports',
  INVENTORY_ITEMS: 'clerk_pro_inventory_items',
  MEETINGS: 'clerk_pro_meetings',
} as const;

// Re-export ACR constants
export * from './acr-constants';
