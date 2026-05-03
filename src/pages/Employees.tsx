import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { differenceInYears, parseISO } from 'date-fns';

import {
  EmployeeRecord,
  OfficialFamilyMember,
  CURRENT_SCHEMA_VERSION,
} from '../types';

import {
  calculateRetirementDate,
  calculateServiceDuration,
  calculatePayroll,
  KPK_DISTRICTS,
  DISTRICT_TEHSIL_MAP,
  formatCurrency,
  isDeceasedStatus,
  getDepartmentInfo,
} from '../utils';

import { formatDate } from '../utils/dateUtils';
import { AppIcon } from '../components/AppIcon';
import {
  Card,
  Button,
  TextField,
  FAB,
  EmptyState,
  SelectField,
  Badge,
} from '../components/M3';
import { PageHeader } from '../components/PageHeader';
import { MobileListCard } from '../components/MobileListCard';
import { useToast } from '../contexts/ToastContext';
import clsx from 'clsx';
import {
  calculatePension,
  calculateFamilyPension,
  resolveAgeFactor,
} from '../lib/pension';
import { useEmployeeContext } from '../contexts/EmployeeContext';
import { APP_NAME } from '../config/branding';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS = [
  { id: 'master', label: 'Employees (Master)', icon: 'person' },
  { id: 'posting', label: 'Posting & Service', icon: 'work' },
  { id: 'financial', label: 'Financial (Bank)', icon: 'account_balance' },
  { id: 'payroll', label: 'Payroll (LPC)', icon: 'payments' },
  { id: 'deductions', label: 'Deductions', icon: 'remove_circle_outline' },
  { id: 'loans', label: 'Loans & Recoveries', icon: 'money_off' },
  { id: 'pension', label: 'Pension & Leave', icon: 'elderly' },
  { id: 'family', label: 'Family', icon: 'family_restroom' },
] as const;

const INACTIVE_STATUSES = [
  'Retired',
  'Death in Service',
  'Death after Retirement',
  'LPR',
  'Superannuation',
  'Premature',
  'Medical Board',
  'Compulsory Retire',
];

const STATUS_OPTIONS = [
  'Active',
  'Superannuation',
  'Premature',
  'Medical Board',
  'Death in Service',
  'Death after Retirement',
  'Compulsory Retire',
  'LPR',
] as const;

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)', field: 'employees.name', dir: 'asc' as const },
  { value: 'name_desc', label: 'Name (Z-A)', field: 'employees.name', dir: 'desc' as const },
  { value: 'bps_asc', label: 'BPS (Low → High)', field: 'employees.bps', dir: 'asc' as const },
  { value: 'bps_desc', label: 'BPS (High → Low)', field: 'employees.bps', dir: 'desc' as const },
  { value: 'retirement_asc', label: 'Retirement (Earliest)', field: 'service_history.date_of_retirement', dir: 'asc' as const },
  { value: 'retirement_desc', label: 'Retirement (Latest)', field: 'service_history.date_of_retirement', dir: 'desc' as const },
  { value: 'salary_asc', label: 'Basic Pay (Low → High)', field: 'financials.basic_pay', dir: 'asc' as const },
  { value: 'salary_desc', label: 'Basic Pay (High → Low)', field: 'financials.basic_pay', dir: 'desc' as const },
  { value: 'created_desc', label: 'Recently Added', field: 'createdAt', dir: 'desc' as const },
  { value: 'updated_desc', label: 'Recently Modified', field: 'updatedAt', dir: 'desc' as const },
];

const INSTITUTION_HINTS = [
  'GPS = Primary School',
  'GMS = Middle School',
  'GHS = High School',
  'GHSS = Higher Secondary School',
  'Hospitals = Health Department',
  'Police = Police Department',
];

// ============================================================================
// TYPES
// ============================================================================

type InstitutionLevelFilter =
  | 'all'
  | 'primary'
  | 'middle'
  | 'high'
  | 'higher_secondary'
  | 'office'
  | 'other';

type SchoolGenderFilter = 'all' | 'male' | 'female';
type StaffTypeFilter = 'all' | 'teaching' | 'non_teaching';

interface EmployeeFilters {
  status: string;
  district: string;
  tehsil: string;
  institutionLevel: InstitutionLevelFilter;
  schoolGender: SchoolGenderFilter;
  staffType: StaffTypeFilter;
  retiringYear: string;
  hasGPF: boolean | null;
}

const DEFAULT_FILTERS: EmployeeFilters = {
  status: 'All',
  district: 'All',
  tehsil: 'All',
  institutionLevel: 'all',
  schoolGender: 'all',
  staffType: 'all',
  retiringYear: '',
  hasGPF: null,
};

// ============================================================================
// HELPERS
// ============================================================================

function normalizeText(value: string | undefined | null): string {
  return String(value || '').trim().toLowerCase();
}

// PERF: getInstitutionMeta is now only called during cache build (once per employee
// per employees-array reference change). All render paths consume the cache.
function getInstitutionMeta(employee: EmployeeRecord) {
  const info = getDepartmentInfo(
    employee.employees.school_full_name || '',
    employee.employees.office_name || '',
    employee.employees.tehsil || '',
    employee.employees.district || '',
    employee.employees.designation_full || employee.employees.designation || '',
    employee.employees.department // Passing explicit department if available
  );

  let level: InstitutionLevelFilter = 'other';

  if (info.organizationType === 'primary_school') level = 'primary';
  else if (info.organizationType === 'middle_school') level = 'middle';
  else if (info.organizationType === 'high_school') level = 'high';
  else if (info.organizationType === 'higher_secondary_school') level = 'higher_secondary';
  else if (
    info.organizationType.includes('office') ||
    info.organizationType === 'directorate'
  ) {
    level = 'office';
  }

  return {
    info,
    level,
    gender: info.isGirlsInstitution ? 'female' : 'male',
  } as const;
}

function getLevelBadgeLabel(level: InstitutionLevelFilter): string {
  switch (level) {
    case 'primary':      return 'Primary';
    case 'middle':       return 'Middle';
    case 'high':         return 'High';
    case 'higher_secondary': return 'Higher Secondary';
    case 'office':       return 'Office';
    default:             return 'Other';
  }
}

// PERF: accepts pre-computed meta so getDepartmentInfo is NOT called again here
function matchesSearch(
  emp: EmployeeRecord,
  term: string,
  meta: ReturnType<typeof getInstitutionMeta>
): boolean {
  const t = normalizeText(term);
  if (!t) return true;

  const searchableFields = [
    emp.employees.name,
    emp.employees.father_name,
    emp.employees.cnic_no,
    emp.employees.personal_no,
    emp.employees.mobile_no,
    emp.employees.designation,
    emp.employees.designation_full,
    emp.employees.school_full_name,
    emp.employees.office_name,
    emp.employees.district,
    emp.employees.tehsil,
    emp.employees.gpf_account_no,
    emp.employees.bank_ac_no,
    emp.employees.bank_name,
    emp.employees.branch_name,
    emp.employees.ppo_no,
    emp.employees.ddo_code,
    meta.info.signatureTitleShort,
    meta.info.departmentShort,
    meta.info.authorityTitle,
  ];

  return searchableFields.some((field) =>
    normalizeText(String(field || '')).includes(t)
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const DynamicMapEditor = React.memo(
  ({
    title,
    map,
    onChange,
  }: {
    title: string;
    map: Record<string, number>;
    onChange: (newMap: Record<string, number>) => void;
  }) => {
    const [key, setKey] = useState('');
    const [val, setVal] = useState('');

    const add = useCallback(() => {
      if (!key.trim() || !val.trim()) return;
      const safeKey = key.trim().replace(/\s+/g, '_').toLowerCase();
      onChange({ ...map, [safeKey]: Number(val) || 0 });
      setKey('');
      setVal('');
    }, [key, val, map, onChange]);

    const remove = useCallback(
      (k: string) => {
        const next = { ...map };
        delete next[k];
        onChange(next);
      },
      [map, onChange]
    );

    return (
      <div className="bg-surface-container p-4 rounded-xl border border-outline-variant mt-4">
        <h4 className="font-bold text-sm uppercase mb-3 text-primary">{title}</h4>

        {Object.entries(map).length > 0 && (
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {Object.entries(map).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between items-center bg-surface p-2 rounded border border-outline-variant/50"
              >
                <span className="capitalize text-sm font-medium">
                  {k.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold">{formatCurrency(Number(v))}</span>
                  <button
                    type="button"
                    onClick={() => remove(k)}
                    className="text-error hover:bg-error/10 p-1 rounded"
                  >
                    <AppIcon name="close" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <TextField
            label="Name (e.g. Adhoc 2026)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="flex-1"
          />
          <TextField
            label="Amount"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            type="number"
            className="w-32"
          />
          <Button
            type="button"
            onClick={add}
            variant="tonal"
            icon="add"
            className="h-14 mb-[1px]"
          />
        </div>
      </div>
    );
  }
);
DynamicMapEditor.displayName = 'DynamicMapEditor';

// PERF: DepartmentSummary now accepts the pre-built meta cache so it does NOT
// call getInstitutionMeta or getDepartmentInfo at all during stat computation.
const DepartmentSummary: React.FC<{
  employees: EmployeeRecord[];
  metaCache: Map<string, ReturnType<typeof getInstitutionMeta>>;
}> = React.memo(({ employees, metaCache }) => {
  const stats = useMemo(() => {
    let active = 0, retired = 0, teaching = 0, nonTeaching = 0;
    let femaleInstitutions = 0, primary = 0, middle = 0, high = 0;
    let higherSecondary = 0, offices = 0, retiringThisYear = 0;
    const currentYear = new Date().getFullYear();

    for (const emp of employees) {
      if (emp.employees.status === 'Active') active++;
      if (INACTIVE_STATUSES.includes(emp.employees.status)) retired++;
      if ((emp.employees.staff_type || 'teaching') === 'teaching') teaching++;
      else nonTeaching++;

      const meta = metaCache.get(emp.id);
      if (meta) {
        if (meta.gender === 'female') femaleInstitutions++;
        if (meta.level === 'primary') primary++;
        else if (meta.level === 'middle') middle++;
        else if (meta.level === 'high') high++;
        else if (meta.level === 'higher_secondary') higherSecondary++;
        else if (meta.level === 'office') offices++;
      }

      const dor = emp.service_history.date_of_retirement;
      if (dor && dor.startsWith(String(currentYear))) retiringThisYear++;
    }

    return {
      active, retired, teaching, nonTeaching,
      femaleInstitutions, primary, middle, high,
      higherSecondary, offices, retiringThisYear,
      total: employees.length,
    };
  }, [employees, metaCache]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
    >
      <StatCard 
        label="Total Staff" 
        value={stats.total} 
        icon="groups" 
        color="primary" 
      />
      <StatCard 
        label="Active" 
        value={stats.active} 
        icon="how_to_reg" 
        color="emerald" 
      />
      <StatCard 
        label="Inactive" 
        value={stats.retired} 
        icon="person_off" 
        color="orange" 
      />
      <StatCard 
        label="Professional" 
        value={stats.teaching} 
        icon="work" 
        color="purple" 
      />
      <StatCard 
        label="Female Inst." 
        value={stats.femaleInstitutions} 
        icon="female" 
        color="pink" 
      />
      <StatCard 
        label={`Retiring ${new Date().getFullYear()}`} 
        value={stats.retiringThisYear} 
        icon="event_busy" 
        color="red" 
      />
    </motion.div>
  );
});
DepartmentSummary.displayName = 'DepartmentSummary';

const StatCard = ({ label, value, icon, color }: { label: string, value: number, icon: string, color: string }) => {
  const colors: Record<string, string> = {
    primary: 'from-primary/20 to-primary/5 text-primary border-primary/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 text-orange-700 dark:text-orange-400 border-orange-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-500/20',
    pink: 'from-pink-500/20 to-pink-500/5 text-pink-700 dark:text-pink-400 border-pink-500/20',
    red: 'from-red-500/20 to-red-500/5 text-red-700 dark:text-red-400 border-red-500/20',
  };

  return (
    <div className="relative overflow-hidden p-4 rounded-3xl glass border shadow-premium group transition-all hover:scale-[1.02]">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color] || colors.primary} opacity-40 group-hover:opacity-60 transition-opacity`} />
      <div className="relative z-10 flex items-center gap-4">
        <div className="p-3 bg-white/50 dark:bg-black/20 rounded-2xl shadow-sm text-inherit">
          <AppIcon name={icon} size={24} />
        </div>
        <div>
          <div className="text-2xl font-bold text-on-surface tracking-tighter leading-none">{value.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-70">{label}</div>
        </div>
      </div>
    </div>
  );
};

DepartmentSummary.displayName = 'DepartmentSummary';

const BulkActionsBar: React.FC<{
  selectedCount: number;
  onExport: () => void;
  onDelete: () => void;
  onClear: () => void;
  onSelectAllFiltered: () => void;
  isAllSelected: boolean;
  totalCount: number;
}> = ({
  selectedCount,
  onExport,
  onDelete,
  onClear,
  onSelectAllFiltered,
  isAllSelected,
  totalCount,
}) => {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 glass border-primary/20 bg-primary/5 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-4 shadow-premium"
    >
      <div className="flex items-center gap-5 ml-2">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
          <AppIcon name="done_all" size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-on-surface">{selectedCount.toLocaleString()}</span>
            <span className="text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest">Personnel Selected</span>
          </div>
          {!isAllSelected && totalCount > selectedCount && (
            <button
              onClick={onSelectAllFiltered}
              className="text-xs text-primary font-bold hover:underline tracking-tight"
            >
              Select all {totalCount.toLocaleString()} records
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="filled" icon="download" label="Export" onClick={onExport} className="h-12 px-6 rounded-2xl shadow-lg shadow-primary/20" />
        <Button variant="tonal" icon="delete" label="Delete" onClick={onDelete} className="h-12 px-6 rounded-2xl bg-error/10 text-error border-error/10 hover:bg-error/20" />
        <div className="w-px h-8 bg-outline-variant/30 mx-2" />
        <button 
          onClick={onClear}
          className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-surface-variant text-on-surface-variant transition-colors"
          title="Clear Selection"
        >
          <AppIcon name="close" size={24} />
        </button>
      </div>
    </motion.div>
  );
};


const PaginationControls: React.FC<{
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}> = ({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem   = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="p-6 glass border-t-0 rounded-b-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4 bg-surface-variant/20 px-4 py-2 rounded-2xl border border-outline-variant/10">
        <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-sm font-bold text-on-surface/60">
          <span className="text-on-surface font-black">{startItem.toLocaleString()} - {endItem.toLocaleString()}</span>
          <span className="mx-2 opacity-30">of</span>
          <span className="text-on-surface font-black">{totalItems.toLocaleString()}</span>
        </div>

        <div className="flex gap-1.5 p-1 bg-surface-variant/20 rounded-2xl border border-outline-variant/10">
          <PaginationButton onClick={() => onPageChange(1)} disabled={currentPage === 1} icon="first_page" />
          <PaginationButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} icon="chevron_left" />
          
          <div className="flex items-center gap-2 px-3">
             <input 
               type="number" 
               className="w-12 bg-white dark:bg-surface text-center font-bold text-sm rounded-lg h-8 focus:outline-none ring-1 ring-primary/20"
               value={currentPage}
               onChange={(e) => {
                 const p = parseInt(e.target.value);
                 if (p > 0 && p <= totalPages) onPageChange(p);
               }}
             />
             <span className="text-xs font-bold opacity-30">/ {totalPages}</span>
          </div>

          <PaginationButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} icon="chevron_right" />
          <PaginationButton onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} icon="last_page" />
        </div>
      </div>
    </div>
  );
};

const PaginationButton = ({ onClick, disabled, icon }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-surface disabled:opacity-20 transition-all text-on-surface shadow-sm"
  >
    <AppIcon name={icon} size={20} />
  </button>
);


const InstitutionPreviewCard: React.FC<{ employee: EmployeeRecord }> = ({ employee }) => {
  const info = useMemo(
    () => getDepartmentInfo(
      employee.employees.school_full_name || '',
      employee.employees.office_name || '',
      employee.employees.tehsil || '',
      employee.employees.district || '',
      employee.employees.designation_full || employee.employees.designation || ''
    ),
    [employee]
  );

  const levelLabel =
    info.organizationType === 'primary_school'        ? 'Primary School'
    : info.organizationType === 'middle_school'        ? 'Middle School'
    : info.organizationType === 'high_school'          ? 'High School'
    : info.organizationType === 'higher_secondary_school' ? 'Higher Secondary School'
    : info.organizationType === 'education_office'     ? 'Education Office'
    : info.organizationType === 'directorate'          ? 'Directorate'
    : 'Other / Dynamic';

  return (
    <Card className="p-4 rounded-xl border border-primary/20 bg-primary-container/10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wide text-primary font-bold">Dynamic Institution Preview</div>
          <div className="mt-1 text-lg font-bold">{info.headerTitle}</div>
          <div className="text-sm text-on-surface-variant">{info.departmentShort}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge label={levelLabel} color="primary" />
          <Badge label={info.isGirlsInstitution ? 'Female Institution' : 'Male Institution'} color="secondary" />
          <Badge label={info.salutation} color="tertiary" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-surface border border-outline-variant">
          <div className="text-xs uppercase text-on-surface-variant mb-1">Letterhead</div>
          <div className="font-semibold whitespace-pre-line">{info.letterhead.line1}</div>
          <div className="text-sm mt-1">{info.letterhead.line2}</div>
          <div className="text-sm">{info.letterhead.line3}</div>
        </div>
        <div className="p-3 rounded-lg bg-surface border border-outline-variant">
          <div className="text-xs uppercase text-on-surface-variant mb-1">Authority / Signature</div>
          <div className="font-semibold whitespace-pre-line">{info.signatureTitle}</div>
          <div className="text-sm mt-2 text-on-surface-variant">
            Authority: <span className="font-medium">{info.authorityTitle}</span>
          </div>
          <div className="text-sm text-on-surface-variant">
            Department: <span className="font-medium">{info.departmentShort}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 text-xs text-on-surface-variant">
        Tip: For school records, use <strong>School / Institution Full Name</strong>. For SDEO / DEO / office records, use <strong>Office Name</strong>. The system will automatically detect letterhead, authority, and signature title.
      </div>
    </Card>
  );
};

const EmployeeFilterPanel: React.FC<{
  filters: EmployeeFilters;
  onChange: (filters: EmployeeFilters) => void;
  onClose: () => void;
}> = ({ filters, onChange, onClose }) => {
  const [local, setLocal] = useState<EmployeeFilters>(filters);

  const update = useCallback(
    <K extends keyof EmployeeFilters>(key: K, value: EmployeeFilters[K]) => {
      setLocal((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (local.status !== 'All') count++;
    if (local.district !== 'All') count++;
    if (local.tehsil !== 'All') count++;
    if (local.institutionLevel !== 'all') count++;
    if (local.schoolGender !== 'all') count++;
    if (local.staffType !== 'all') count++;
    if (local.retiringYear) count++;
    if (local.hasGPF !== null) count++;
    return count;
  }, [local]);

  const tehsilOptions = local.district !== 'All' ? DISTRICT_TEHSIL_MAP[local.district as keyof typeof DISTRICT_TEHSIL_MAP] || [] : [];

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md h-full glass-dark shadow-2xl flex flex-col border-l border-white/10"
      >
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tighter">Advanced Filters</h3>
            <p className="text-sm font-bold text-white/40 uppercase tracking-widest mt-1">Refine Personnel Records</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-2xl transition-all text-white/60">
            <AppIcon name="close" size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <FilterSection label="Employment Status" icon="how_to_reg">
                <SelectField value={local.status} onChange={(e: any) => update('status', e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Duty</option>
                  <option value="Retired">Inactive / Retired</option>
                  {STATUS_OPTIONS.filter((s) => s !== 'Active').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </SelectField>
              </FilterSection>

              <FilterSection label="Retirement Target" icon="event_busy">
                <TextField value={local.retiringYear} onChange={(e) => update('retiringYear', e.target.value)} placeholder="e.g. 2026" />
              </FilterSection>

              <FilterSection label="Jurisdiction" icon="map">
                <div className="space-y-4">
                  <SelectField label="District" value={local.district} onChange={(e: any) => {
                    const d = e.target.value;
                    update('district', d);
                    update('tehsil', 'All');
                  }}>
                    <option value="All">All Districts</option>
                    {KPK_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </SelectField>
                  <SelectField label="Tehsil" value={local.tehsil} onChange={(e: any) => update('tehsil', e.target.value)}>
                    <option value="All">All Tehsils</option>
                    {tehsilOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </SelectField>
                </div>
              </FilterSection>

              <FilterSection label="Institution Metrics" icon="business">
                <div className="space-y-4">
                  <SelectField label="Level" value={local.institutionLevel} onChange={(e: any) => update('institutionLevel', e.target.value)}>
                    <option value="all">Any Level</option>
                    <option value="primary">Primary School</option>
                    <option value="middle">Middle School</option>
                    <option value="high">High School</option>
                    <option value="higher_secondary">Higher Secondary School</option>
                    <option value="office">Office / Directorate</option>
                    <option value="other">Other</option>
                  </SelectField>
                  <SelectField label="Gender Focus" value={local.schoolGender} onChange={(e: any) => update('schoolGender', e.target.value)}>
                    <option value="all">Any Gender</option>
                    <option value="male">Male Institutions</option>
                    <option value="female">Female Institutions</option>
                  </SelectField>
                </div>
              </FilterSection>

              <FilterSection label="Staff Classification" icon="badge">
                 <SelectField value={local.staffType} onChange={(e: any) => update('staffType', e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="teaching">Teaching / Professional</option>
                    <option value="non_teaching">Non-Teaching / Support</option>
                 </SelectField>
              </FilterSection>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/10 bg-white/5 flex gap-4">
          <Button variant="text" label="Reset" onClick={() => setLocal(DEFAULT_FILTERS)} className="flex-1 text-white/40 font-bold" />
          <Button
            variant="filled"
            label="Apply Filters"
            onClick={() => { onChange(local); onClose(); }}
            className="flex-[2] h-14 rounded-2xl shadow-lg shadow-primary/20"
            icon="check"
          />
        </div>
      </motion.div>
    </div>
  );
};

const FilterSection = ({ label, icon, children }: any) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-white/40">
      <AppIcon name={icon} size={16} />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{label}</span>
    </div>
    {children}
  </div>
);



// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const Employees: React.FC = () => {
  const {
    employees,
    addEmployee: onAdd,
    deleteEmployee: onDelete,
    updateEmployee: onUpdate,
  } = useEmployeeContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // UI state
  const [searchTerm, setSearchTerm]   = useState('');
  // PERF: debouncedSearch is what's actually used for filtering so typing
  // doesn't re-run 2700-employee filter on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showModal, setShowModal]     = useState(false);
  const [activeTab, setActiveTab]     = useState<(typeof TABS)[number]['id']>('master');
  const [duplicateWarning, setDuplicateWarning] = useState<EmployeeRecord | null>(null);
  const [customTehsil, setCustomTehsil] = useState(false);

  // Filters / view state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters]         = useState<EmployeeFilters>(DEFAULT_FILTERS);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(50);
  const [sortOption, setSortOption]   = useState('name_asc');
  const [showStatistics, setShowStatistics] = useState(true);
  const [viewMode, setViewMode]       = useState<'table' | 'cards'>('table');

  // PERF: single-pass meta cache keyed by employee id.
  // Rebuilt only when the employees array reference changes (add/edit/delete).
  const institutionMetaCache = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof getInstitutionMeta>>();
    for (const emp of employees) {
      cache.set(emp.id, getInstitutionMeta(emp));
    }
    return cache;
  }, [employees]);

  // Debounce search input — 300 ms delay before filtering starts
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 300);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // URL param sync
  useEffect(() => {
    const status      = searchParams.get('status') || 'All';
    const retiringYear = searchParams.get('retiringYear') || '';
    setFilters((prev) => ({ ...prev, status, retiringYear }));
  }, [searchParams]);

  // Initial form
  const initialFormState: EmployeeRecord = {
    id: '',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    employees: {
      name: '',
      designation: '',
      designation_full: '',
      bps: 0,
      school_full_name: '',
      office_name: '',
      staff_type: 'teaching',
      status: 'Active',
      employment_category: 'Permanent',
      mobile_no: '',
      personal_no: '',
      cnic_no: '',
      ntn_no: '',
      father_name: '',
      nationality: 'Pakistani',
      district: 'Battagram',
      tehsil: 'Allai',
      address: '',
      dob: '',
      ddo_code: '',
      bank_ac_no: '',
      bank_name: '',
      branch_name: '',
      branch_code: '',
      bank_branch: '',
      account_type: 'Current',
      gpf_account_no: '',
      ppo_no: '',
      gender: 'Male',
    },
    service_history: {
      date_of_appointment: '',
      date_of_entry: '',
      date_of_retirement: '',
      retirement_order_no: '',
      retirement_order_date: '',
      lwp_days: 0,
      lpr_days: 365,
      leave_taken_days: 0,
      date_of_regularization: '',
      date_of_death: '',
    },
    financials: {
      basic_pay: 0,
      p_pay: 0,
      hra: 0,
      ca: 0,
      ma: 0,
      uaa: 0,
      spl_allow_2021: 0,
      teaching_allow: 0,
      spl_allow_female: 0,
      spl_allow_disable: 0,
      integrated_allow: 0,
      charge_allow: 0,
      wa: 0,
      dress_allow: 0,
      adhoc_2013: 0,
      adhoc_2015: 0,
      adhoc_2022_ps17: 0,
      dra_2022kp: 0,
      adhoc_2023_35: 0,
      adhoc_2024_25: 0,
      adhoc_2025_10: 0,
      dra_2025_15: 0,
      computer_allow: 0,
      mphil_allow: 0,
      entertainment_allow: 0,
      science_teaching_allow: 0,
      weather_allow: 0,
      arrears: {},
      gpf: 0,
      gpf_sub: 0,
      gpf_advance: 0,
      bf: 0,
      eef: 0,
      rb_death: 0,
      adl_g_insurance: 0,
      group_insurance: 0,
      income_tax: 0,
      recovery: 0,
      edu_rop: 0,
      hba_loan_instal: 0,
      gpf_loan_instal: 0,
      allowances_extra: {},
      deductions_extra: {},
    },
    family_members: [],
    extras: {
      commutation_portion: 35,
      retirement_date_source: 'auto',
    } as any,
    createdAt: '',
    updatedAt: '',
  };

  const [formData, setFormData] = useState<EmployeeRecord>(initialFormState);

  // ==========================================================================
  // FILTERING — uses debouncedSearch + institutionMetaCache
  // ==========================================================================

  const filteredEmployees = useMemo(() => {
    let result = employees;

    // PERF: use debouncedSearch (not live searchTerm) so filter only fires
    // after the 300 ms debounce instead of on every keystroke.
    if (debouncedSearch.trim()) {
      result = result.filter((emp) => {
        const meta = institutionMetaCache.get(emp.id)!;
        return matchesSearch(emp, debouncedSearch, meta);
      });
    }

    if (filters.status !== 'All') {
      if (filters.status === 'Retired') {
        result = result.filter((emp) => INACTIVE_STATUSES.includes(emp.employees.status));
      } else {
        result = result.filter((emp) => emp.employees.status === filters.status);
      }
    }

    if (filters.district !== 'All') {
      result = result.filter((emp) => emp.employees.district === filters.district);
    }

    if (filters.tehsil !== 'All') {
      result = result.filter((emp) => emp.employees.tehsil === filters.tehsil);
    }

    if (filters.institutionLevel !== 'all') {
      result = result.filter((emp) => institutionMetaCache.get(emp.id)!.level === filters.institutionLevel);
    }

    if (filters.schoolGender !== 'all') {
      result = result.filter((emp) => institutionMetaCache.get(emp.id)!.gender === filters.schoolGender);
    }

    if (filters.staffType !== 'all') {
      result = result.filter((emp) => (emp.employees.staff_type || 'teaching') === filters.staffType);
    }

    if (filters.retiringYear) {
      result = result.filter(
        (emp) => emp.service_history.date_of_retirement?.startsWith(filters.retiringYear)
      );
    }

    if (filters.hasGPF === true) {
      result = result.filter((emp) => !!emp.employees.gpf_account_no?.trim());
    } else if (filters.hasGPF === false) {
      result = result.filter((emp) => !emp.employees.gpf_account_no?.trim());
    }

    return result;
  }, [employees, debouncedSearch, filters, institutionMetaCache]);

  // ==========================================================================
  // SORTING
  // ==========================================================================

  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];
    const option = SORT_OPTIONS.find((o) => o.value === sortOption);
    if (!option) return sorted;

    sorted.sort((a, b) => {
      const path = option.field.split('.');
      let aVal: any = a;
      let bVal: any = b;

      for (const key of path) {
        aVal = aVal?.[key];
        bVal = bVal?.[key];
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return option.dir === 'asc' ? 1 : -1;
      if (bVal == null) return option.dir === 'asc' ? -1 : 1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
        return option.dir === 'asc' ? cmp : -cmp;
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return option.dir === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [filteredEmployees, sortOption]);

  // ==========================================================================
  // PAGINATION
  // ==========================================================================

  const totalPages = Math.max(1, Math.ceil(sortedEmployees.length / pageSize));

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEmployees.slice(start, start + pageSize);
  }, [sortedEmployees, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(Math.max(1, totalPages));
  }, [totalPages, currentPage]);

  // ==========================================================================
  // FORM HELPERS
  // ==========================================================================

  const checkDuplicate = useCallback(
    (field: 'cnic_no' | 'personal_no', value: string) => {
      if (!value) return;
      const match = employees.find((e) => e.id !== formData.id && e.employees[field] === value.trim());
      if (match) {
        setDuplicateWarning(match);
      } else {
        const otherField = field === 'cnic_no' ? 'personal_no' : 'cnic_no';
        const otherVal   = formData.employees[otherField];
        const otherMatch = employees.find((e) => e.id !== formData.id && e.employees[otherField] === otherVal);
        if (!otherMatch) setDuplicateWarning(null);
      }
    },
    [employees, formData.id, formData.employees]
  );

  const updateDeep = useCallback(
    (path: string[], value: any) => {
      setFormData((prev) => {
        const next = JSON.parse(JSON.stringify(prev));
        let ptr: any = next;
        for (let i = 0; i < path.length - 1; i++) {
          if (!ptr[path[i]]) ptr[path[i]] = {};
          ptr = ptr[path[i]];
        }
        ptr[path[path.length - 1]] = value;
        return next;
      });

      if (path.includes('cnic_no'))    checkDuplicate('cnic_no', value);
      if (path.includes('personal_no')) checkDuplicate('personal_no', value);
    },
    [checkDuplicate]
  );

  const resetForm = useCallback(() => {
    setFormData({
      ...initialFormState,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setDuplicateWarning(null);
    setCustomTehsil(false);
    setActiveTab('master');
  }, []);

  const handleAddNew = useCallback(() => { resetForm(); setShowModal(true); }, [resetForm]);

  const handleEdit = useCallback((emp: EmployeeRecord) => {
    setFormData(JSON.parse(JSON.stringify(emp)));
    setDuplicateWarning(null);
    const tehsils = DISTRICT_TEHSIL_MAP[emp.employees.district] || [];
    setCustomTehsil(!tehsils.includes(emp.employees.tehsil) && emp.employees.tehsil !== '');
    setActiveTab('master');
    setShowModal(true);
  }, []);

  const handleSwitchToExisting = useCallback(() => {
    if (duplicateWarning) handleEdit(duplicateWarning);
  }, [duplicateWarning, handleEdit]);

  const handleSave = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!formData.employees.name || !formData.employees.cnic_no) {
        showToast('Name and CNIC are required', 'error'); return;
      }
      if (!formData.employees.school_full_name && !formData.employees.office_name) {
        showToast('Please enter School Full Name or Office Name', 'error'); return;
      }
      if (duplicateWarning) {
        showToast('Cannot save: Duplicate record exists.', 'error'); return;
      }
      const toSave = { ...formData, updatedAt: new Date().toISOString() };
      if (employees.some((emp) => emp.id === toSave.id)) {
        onUpdate(toSave);
        showToast('Employee Updated', 'success');
      } else {
        onAdd(toSave);
        showToast('Employee Created', 'success');
      }
      setShowModal(false);
    },
    [duplicateWarning, employees, formData, onAdd, onUpdate, showToast]
  );

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  const handleSelectAllPage = useCallback(() => {
    const allPageSelected =
      paginatedEmployees.length > 0 &&
      paginatedEmployees.every((e) => selectedEmployees.has(e.id));
    if (allPageSelected) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(paginatedEmployees.map((e) => e.id)));
    }
  }, [paginatedEmployees, selectedEmployees]);

  const handleSelectAllFiltered = useCallback(() => {
    setSelectedEmployees(new Set(sortedEmployees.map((e) => e.id)));
  }, [sortedEmployees]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedEmployees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    const count = selectedEmployees.size;
    if (count === 0) return;
    if (window.confirm(`Are you sure you want to delete ${count} employee(s)? This action cannot be undone.`)) {
      selectedEmployees.forEach((id) => onDelete(id));
      setSelectedEmployees(new Set());
      showToast(`Successfully deleted ${count} employee(s)`, 'success');
    }
  }, [selectedEmployees, onDelete, showToast]);

  const generateCSV = useCallback((data: EmployeeRecord[]) => {
    const headers = [
      'Name', 'Father Name', 'CNIC', 'Personal No', 'Designation', 'BPS', 'Status',
      'School Full Name', 'Office Name', 'District', 'Tehsil', 'Gender', 'DOB',
      'Date of Appointment', 'Date of Retirement', 'Basic Pay', 'Mobile No',
      'Bank Name', 'Account No', 'GPF Account No', 'PPO No', 'Employment Category', 'Staff Type',
    ];
    const rows = data.map((e) =>
      [
        e.employees.name, e.employees.father_name, e.employees.cnic_no,
        e.employees.personal_no, e.employees.designation, e.employees.bps,
        e.employees.status, e.employees.school_full_name, e.employees.office_name,
        e.employees.district, e.employees.tehsil, e.employees.gender, e.employees.dob,
        e.service_history.date_of_appointment, e.service_history.date_of_retirement,
        e.financials.basic_pay, e.employees.mobile_no, e.employees.bank_name,
        e.employees.bank_ac_no, e.employees.gpf_account_no, e.employees.ppo_no,
        e.employees.employment_category, e.employees.staff_type,
      ].map((val) => `"${String(val || '').replace(/"/g, '""')}"`)
    );
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }, []);

  const downloadCSV = useCallback((csv: string, filename: string) => {
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, []);

  const handleBulkExport = useCallback(() => {
    const selected = employees.filter((e) => selectedEmployees.has(e.id));
    downloadCSV(generateCSV(selected), `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    showToast(`Exported ${selected.length} employee(s) to CSV`, 'success');
  }, [employees, selectedEmployees, generateCSV, downloadCSV, showToast]);

  const handleExportAll = useCallback(() => {
    downloadCSV(generateCSV(sortedEmployees), `all_employees_${new Date().toISOString().split('T')[0]}.csv`);
    showToast(`Exported ${sortedEmployees.length} employee(s) to CSV`, 'success');
  }, [sortedEmployees, generateCSV, downloadCSV, showToast]);

  // ==========================================================================
  // COMPUTED VALUES (form modal only — not involved in list rendering)
  // ==========================================================================

  const institutionPreview = useMemo(
    () => getDepartmentInfo(
      formData.employees.school_full_name || '',
      formData.employees.office_name || '',
      formData.employees.tehsil || '',
      formData.employees.district || '',
      formData.employees.designation_full || formData.employees.designation || ''
    ),
    [
      formData.employees.school_full_name,
      formData.employees.office_name,
      formData.employees.tehsil,
      formData.employees.district,
      formData.employees.designation_full,
      formData.employees.designation,
    ]
  );

  const f = formData.financials;
  const { grossPay, totalDeduction, netPay } = calculatePayroll(formData.financials);

  const lprDays   = formData.service_history.lpr_days ?? 365;
  const lprAmount = Math.round(((f.basic_pay || 0) / 30) * lprDays);

  const isEmployeeActive    = formData.employees.status === 'Active';
  const calculationEndDate  = isEmployeeActive ? new Date().toISOString() : formData.service_history.date_of_retirement;

  const service = useMemo(
    () => calculateServiceDuration(
      formData.service_history.date_of_appointment,
      calculationEndDate,
      formData.service_history.lwp_days
    ),
    [formData.service_history, calculationEndDate]
  );

  const birthDate  = formData.employees.dob ? parseISO(formData.employees.dob) : null;
  const retireDate = calculationEndDate ? parseISO(calculationEndDate) : null;

  let ageAtRetirement = 0;
  if (birthDate && retireDate) ageAtRetirement = differenceInYears(retireDate, birthDate);

  const { factor: ageFactor } = resolveAgeFactor(ageAtRetirement + 1);

  let qService = service.years;
  if (service.months >= 6) qService += 1;
  qService = Math.min(qService, 30);

  const calc = calculatePension({
    basicPay: f.basic_pay || 0,
    personalPay: f.p_pay || 0,
    qualifyingServiceYears: qService,
    commutationPortionPercent: (formData.extras as any)?.commutation_portion ?? 35,
    ageAtRetirement,
  });

  const grossPensionCalc     = calc.grossPension;
  const commutationPortion   = calc.commutationPortion;
  const netPensionCalc       = calc.netPension;
  const commLumpSumCalc      = calc.commutationLumpSum;
  const monthlyPayablePension = calc.monthlyPayablePension;

  const missingDOBEmployees = useMemo(
    () => employees.filter((e) => !e.employees.dob),
    [employees]
  );
  const missingDOBCount = missingDOBEmployees.length;

  const isDeceased       = isDeceasedStatus(formData.employees.status);
  const isDeathInService = formData.employees.status === 'Death in Service';

  const familyPensionCalc = useMemo(() => {
    return calculateFamilyPension(
      formData.employees.status,
      f.basic_pay,
      f.p_pay,
      qService,
      ageAtRetirement,
      (formData.extras as any)?.commutation_portion
    );
  }, [
    formData.employees.status,
    f.basic_pay,
    f.p_pay,
    qService,
    ageAtRetirement,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (formData.extras as any)?.commutation_portion,
  ]);

  const availableTehsils = DISTRICT_TEHSIL_MAP[formData.employees.district] || [];

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (filters.status !== 'All') count++;
    if (filters.district !== 'All') count++;
    if (filters.tehsil !== 'All') count++;
    if (filters.schoolLevel !== 'all') count++;
    if (filters.schoolGender !== 'all') count++;
    if (filters.staffType !== 'all') count++;
    if (filters.retiringYear) count++;
    if (filters.hasGPF !== null) count++;
    return count;
  }, [debouncedSearch, filters]);

  // ==========================================================================
  // AUTO ALLOWANCE RULES
  // ==========================================================================

  useEffect(() => {
    const emp = formData.employees;
    const fin = formData.financials;
    const updates: Partial<typeof fin> = {};
    let hasChanges = false;

    const stage = (key: keyof typeof fin, val: number) => {
      if (fin[key] !== val) { (updates as any)[key] = val; hasChanges = true; }
    };

    const bps    = Number(emp.bps) || 0;
    const desig  = (emp.designation || '').toUpperCase();
    const staff  = (emp.staff_type || '').toLowerCase();
    const gender = emp.gender || 'Male';

    if (bps >= 7) {
      if (fin.wa > 0)               stage('wa', 0);
      if (fin.dress_allow > 0)      stage('dress_allow', 0);
      if (fin.integrated_allow > 0) stage('integrated_allow', 0);
    }

    const isComputer = /\b(COMPUTER[\s\-_]?OPERATOR|KPO|CO)\b/i.test(desig);
    if (!isComputer && fin.computer_allow > 0) stage('computer_allow', 0);

    if (bps >= 7 && fin.weather_allow > 0) stage('weather_allow', 0);

    if (gender !== 'Female' && fin.spl_allow_female > 0) stage('spl_allow_female', 0);

    if (staff !== 'teaching') {
      if (fin.science_teaching_allow > 0) stage('science_teaching_allow', 0);
      if (fin.teaching_allow > 0)         stage('teaching_allow', 0);
    }

    if (hasChanges) {
      setFormData((prev) => ({
        ...prev,
        financials: { ...prev.financials, ...(updates as typeof fin) },
      }));
    }
  }, [
    formData.employees.bps,
    formData.employees.designation,
    formData.employees.staff_type,
    formData.employees.gender,
    formData.financials.wa,
    formData.financials.dress_allow,
    formData.financials.integrated_allow,
    formData.financials.computer_allow,
    formData.financials.weather_allow,
    formData.financials.spl_allow_female,
    formData.financials.science_teaching_allow,
    formData.financials.teaching_allow,
  ]);

  // ==========================================================================
  // QUICK FILTER HELPERS
  // ==========================================================================

  const updateQuickStatus = useCallback(
    (status: string) => {
      setFilters((prev) => ({ ...prev, status }));
      setCurrentPage(1);
      const params: Record<string, string> = {};
      if (status !== 'All') params.status = status;
      if (filters.retiringYear) params.retiringYear = filters.retiringYear;
      setSearchParams(params);
    },
    [filters.retiringYear, setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    setSearchParams({});
  }, [setSearchParams]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <>
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-24 lg:pb-8 px-4 md:px-6 bg-mesh min-h-screen"
    >
      {/* 1. Page Header & Stats Hub */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[22px] bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <AppIcon name="groups" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-on-surface tracking-tighter">Personnel Hub</h1>
            <p className="text-sm font-medium text-on-surface-variant/60 uppercase tracking-[0.2em]">{APP_NAME} Management Suite</p>
          </div>
        </div>
        <div className="flex gap-3">
           <Button 
             variant="filled" 
             icon="person_add" 
             label="Add Employee" 
             onClick={handleAddNew} 
             className="h-12 px-6 shadow-lg shadow-primary/20"
           />
           <Button 
             variant="tonal" 
             icon={showStatistics ? "visibility_off" : "analytics"} 
             label={showStatistics ? "Hide Analytics" : "Show Analytics"} 
             onClick={() => setShowStatistics(!showStatistics)}
             className="h-12 glass"
           />
        </div>
      </motion.div>

      <AnimatePresence>
        {showStatistics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <DepartmentSummary employees={employees} metaCache={institutionMetaCache} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Command Bar: Search & Quick Filters */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors">
            <AppIcon name="search" size={24} />
          </div>
          <input
            type="text"
            placeholder="Search name, CNIC, personal number, school..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-16 pl-14 pr-6 rounded-[24px] glass border-primary/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-lg font-medium shadow-premium"
          />
          {searchTerm && (
            <button 
              onClick={() => { setSearchTerm(''); setDebouncedSearch(''); setCurrentPage(1); }}
              className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center transition-colors"
            >
              <AppIcon name="close" size={18} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <div className="hidden lg:flex p-1.5 glass rounded-[24px] border-primary/10 shadow-premium">
            {[
              { value: 'all', label: 'All Personnel' },
              { value: 'primary', label: 'Primary' },
              { value: 'middle', label: 'Middle' },
              { value: 'high', label: 'High' },
              { value: 'higher_secondary', label: 'Higher Sec' },
              { value: 'office', label: 'Offices' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setFilters((prev) => ({ ...prev, institutionLevel: item.value as InstitutionLevelFilter }));
                  setCurrentPage(1);
                }}
                className={clsx(
                  'px-6 py-2.5 rounded-[18px] text-sm font-bold transition-all',
                  filters.institutionLevel === item.value 
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                    : 'text-on-surface-variant/60 hover:bg-primary/5'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="px-6 py-4 rounded-[24px] glass border-primary/10 shadow-premium flex items-center gap-3 font-bold text-primary hover:bg-primary/5 transition-all"
          >
            <AppIcon name="tune" size={22} />
            <span className="hidden sm:inline">Advanced Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-6 h-6 bg-primary text-white text-[10px] rounded-full flex items-center justify-center shadow-lg shadow-primary/30">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </motion.div>

      {/* 3. Controls & Active Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
          {activeFilterCount > 0 && (
            <>
              <div className="flex items-center gap-2 p-1.5 bg-primary/5 rounded-full border border-primary/10 px-4">
                 <AppIcon name="filter_list" size={16} className="text-primary" />
                 <span className="text-xs font-bold text-primary uppercase tracking-widest">Active Filters</span>
              </div>
              {debouncedSearch && <Badge label={`"${debouncedSearch}"`} color="primary" />}
              {filters.status !== 'All' && <Badge label={filters.status} color="primary" />}
              {filters.district !== 'All' && <Badge label={filters.district} color="secondary" />}
              {filters.institutionLevel !== 'all' && <Badge label={getLevelBadgeLabel(filters.institutionLevel)} color="tertiary" />}
              <button
                onClick={clearFilters}
                className="text-primary hover:bg-primary/5 text-xs px-3 py-1.5 rounded-full font-bold transition-all uppercase tracking-tighter"
              >
                Clear All
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 glass px-4 py-2 rounded-2xl border-primary/5 shadow-sm">
            <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Sort by</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex p-1 bg-surface-variant/20 rounded-2xl border border-outline-variant/10 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'p-2 rounded-xl transition-all',
                viewMode === 'table' ? 'bg-white dark:bg-surface text-primary shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
              )}
              title="Table View"
            >
              <AppIcon name="table_rows" size={20} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={clsx(
                'p-2 rounded-xl transition-all',
                viewMode === 'cards' ? 'bg-white dark:bg-surface text-primary shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'
              )}
              title="Grid View"
            >
              <AppIcon name="grid_view" size={20} />
            </button>
          </div>
        </div>
      </motion.div>

      <BulkActionsBar
        selectedCount={selectedEmployees.size}
        onExport={handleBulkExport}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedEmployees(new Set())}
        onSelectAllFiltered={handleSelectAllFiltered}
        isAllSelected={selectedEmployees.size === sortedEmployees.length && sortedEmployees.length > 0}
        totalCount={sortedEmployees.length}
      />


        {/* Missing DOB warning */}
        {missingDOBCount > 0 && missingDOBCount <= 10 && !debouncedSearch && (
          <Card className="bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-start gap-3">
              <AppIcon name="warning" size={20} className="text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-yellow-800">{missingDOBCount} employee(s) missing Date of Birth</div>
                <div className="text-sm text-yellow-700 mt-1">Retirement dates cannot be auto-calculated for these records.</div>
                <div className="mt-2 max-h-24 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {missingDOBEmployees.slice(0, 5).map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => handleEdit(emp)}
                        className="text-xs bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded border border-yellow-300 transition-colors"
                      >
                        {emp.employees.name} ({emp.employees.personal_no || 'No P.No'})
                      </button>
                    ))}
                    {missingDOBCount > 5 && (
                      <span className="text-xs text-yellow-600 px-2 py-1">+{missingDOBCount - 5} more</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* DATA DISPLAY */}
        {sortedEmployees.length === 0 ? (
          <EmptyState
            icon="group_off"
            title="No employees found"
            description={
              activeFilterCount > 0
                ? 'Try adjusting your filters or search term.'
                : 'Add your first employee to get started.'
            }
          />
        ) : (
          <>
            {/* Desktop Table */}
            {viewMode === 'table' && (
              <div className="hidden md:block">
                <Card className="overflow-hidden rounded-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface-variant text-sm sticky top-0 z-10">
                        <tr>
                          <th className="p-3 text-left w-12">
                            <input
                              type="checkbox"
                              checked={paginatedEmployees.length > 0 && paginatedEmployees.every((e) => selectedEmployees.has(e.id))}
                              onChange={handleSelectAllPage}
                              className="rounded accent-primary"
                            />
                          </th>
                          <th className="p-3 text-left font-semibold">Name</th>
                          <th className="p-3 text-left font-semibold">Designation</th>
                          <th className="p-3 text-left font-semibold">Institution</th>
                          <th className="p-3 text-left font-semibold">Type</th>
                          <th className="p-3 text-left font-semibold">Status</th>
                          <th className="p-3 text-left font-semibold">Retirement</th>
                          <th className="p-3 text-left font-semibold">CNIC</th>
                          <th className="p-3 text-center font-semibold w-24">Actions</th>
                        </tr>
                      </thead>
                      <motion.tbody variants={containerVariants}>
                        {paginatedEmployees.map((emp) => {
                          const meta = institutionMetaCache.get(emp.id)!;
                          return (
                            <motion.tr
                              variants={itemVariants}
                              key={emp.id}
                              className={clsx(
                                'border-t border-outline-variant/30 hover:bg-primary/5 cursor-pointer transition-all group',
                                selectedEmployees.has(emp.id) && 'bg-primary/10'
                              )}
                              onClick={() => handleEdit(emp)}
                            >
                              <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedEmployees.has(emp.id)}
                                  onChange={() => handleToggleSelect(emp.id)}
                                  className="w-5 h-5 rounded-lg border-2 border-outline-variant accent-primary cursor-pointer"
                                />
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-on-surface group-hover:text-primary transition-colors">{emp.employees.name}</div>
                                <div className="text-[10px] font-mono font-bold text-on-surface-variant/40 uppercase tracking-widest">{emp.employees.personal_no || 'No Personal No'}</div>
                              </td>
                              <td className="p-4 text-sm font-medium">
                                <div className="text-on-surface">{emp.employees.designation || '-'}</div>
                                <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mt-0.5">
                                  BPS-{emp.employees.bps || '??'} • {emp.employees.staff_type === 'non_teaching' ? 'Non Teaching' : 'Teaching'}
                                </div>
                              </td>
                              <td className="p-4 text-sm max-w-[240px]">
                                <div className="truncate font-bold text-on-surface/80"
                                  title={emp.employees.school_full_name || emp.employees.office_name || ''}>
                                  {emp.employees.school_full_name || emp.employees.office_name || '-'}
                                </div>
                                <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest truncate">
                                  {emp.employees.district || '-'} • {emp.employees.tehsil || '-'}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1">
                                  <Badge label={getLevelBadgeLabel(meta.level)} color="primary" />
                                  <Badge label={meta.gender === 'female' ? 'Female Inst' : 'Male Inst'} color="neutral" />
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge
                                  label={emp.employees.status}
                                  color={emp.employees.status === 'Active' ? 'success' : 'neutral'}
                                />
                              </td>
                              <td className="p-4 text-sm font-bold font-mono text-on-surface/60">
                                {emp.service_history.date_of_retirement
                                  ? formatDate(emp.service_history.date_of_retirement, 'dd/MM/yyyy')
                                  : '-'}
                              </td>
                              <td className="p-4 font-mono text-xs text-on-surface-variant/60">{emp.employees.cnic_no || '-'}</td>
                              <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleEdit(emp)}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-2xl text-primary transition-all"
                                    title="Edit Profile"
                                  >
                                    <AppIcon name="edit" size={20} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Delete ${emp.employees.name}?`)) {
                                        onDelete(emp.id);
                                        showToast('Employee deleted', 'success');
                                      }
                                    }}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-error/10 rounded-2xl text-error transition-all"
                                    title="Remove"
                                  >
                                    <AppIcon name="delete" size={20} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </motion.tbody>
                    </table>
                  </div>
                  <PaginationControls
                    currentPage={currentPage} totalPages={totalPages}
                    pageSize={pageSize} totalItems={sortedEmployees.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                  />
                </Card>
              </div>
            )}

            {/* Cards view */}
            {viewMode === 'cards' && (
              <div className="space-y-4 pb-20">
                <motion.div 
                  variants={containerVariants}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {paginatedEmployees.map((emp) => {
                    const meta = institutionMetaCache.get(emp.id)!;
                    const isSelected = selectedEmployees.has(emp.id);

                    return (
                      <motion.div
                        variants={itemVariants}
                        key={emp.id}
                        className={clsx(
                          'group relative overflow-hidden p-6 cursor-pointer glass rounded-[32px] border transition-all hover:scale-[1.02] shadow-premium',
                          isSelected ? 'border-primary ring-4 ring-primary/5 bg-primary/5' : 'border-primary/5'
                        )}
                        onClick={() => handleEdit(emp)}
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <AppIcon name="chevron_right" className="text-primary" />
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                              {emp.employees.name?.[0] || '?'}
                            </div>
                            <div className="absolute -bottom-1 -right-1">
                               <Badge 
                                 label={emp.employees.status === 'Active' ? '✓' : '×'} 
                                 color={emp.employees.status === 'Active' ? 'success' : 'neutral'}
                                 className="!p-1 !min-w-0 !w-6 !h-6 flex items-center justify-center rounded-full border-2 border-white dark:border-surface"
                               />
                            </div>
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => { e.stopPropagation(); handleToggleSelect(emp.id); }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-outline-variant accent-primary"
                              />
                              <div className="font-bold text-lg truncate group-hover:text-primary transition-colors">{emp.employees.name}</div>
                            </div>
                            <div className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest truncate mt-0.5">
                              {emp.employees.designation || 'No Designation'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 space-y-3">
                          <div className="flex flex-col gap-1 p-3 bg-primary/5 rounded-2xl">
                            <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">Institution</span>
                            <span className="text-sm font-bold text-on-surface/80 truncate">
                              {emp.employees.school_full_name || emp.employees.office_name || '-'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 glass rounded-2xl border-primary/5">
                               <span className="block text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-1">Scale</span>
                               <span className="font-mono font-bold text-primary">BPS-{emp.employees.bps || '??'}</span>
                            </div>
                            <div className="p-3 glass rounded-2xl border-primary/5">
                               <span className="block text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-1">Level</span>
                               <span className="font-bold text-on-surface/60">{getLevelBadgeLabel(meta.level)}</span>
                            </div>
                          </div>

                          <div className="p-3 glass rounded-2xl border-primary/5 flex justify-between items-center">
                            <div>
                               <span className="block text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest mb-1">Retirement</span>
                               <span className="font-mono font-bold text-on-surface/60 text-sm">
                                 {emp.service_history.date_of_retirement ? formatDate(emp.service_history.date_of_retirement, 'dd/MM/yyyy') : '-'}
                               </span>
                            </div>
                            <Badge label={meta.gender === 'female' ? 'Female' : 'Male'} color="secondary" />
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                           <div className="text-[10px] font-mono font-bold text-on-surface-variant/30 uppercase tracking-[0.2em]">
                             P.No: {emp.employees.personal_no || 'N/A'}
                           </div>
                           <div className="flex gap-1">
                              <Badge label={emp.employees.staff_type === 'non_teaching' ? 'Non-Teach' : 'Teach'} color="tertiary" />
                           </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
                <PaginationControls
                  currentPage={currentPage} totalPages={totalPages}
                  pageSize={pageSize} totalItems={sortedEmployees.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
              </div>
            )}

            {/* Mobile list when table mode on mobile */}
            {viewMode === 'table' && (
              <div className="md:hidden pb-20 space-y-3">
                {paginatedEmployees.map((emp) => {
                  // PERF: read from cache
                  const meta = institutionMetaCache.get(emp.id)!;

                  return (
                    <MobileListCard
                      key={emp.id}
                      title={emp.employees.name}
                      subtitle={[emp.employees.designation, emp.employees.school_full_name || emp.employees.office_name]
                        .filter(Boolean).join(' • ')}
                      avatar={emp.employees.name?.[0] || '?'}
                      onClick={() => handleEdit(emp)}
                      meta={
                        <>
                          <Badge
                            label={emp.employees.status}
                            color={emp.employees.status === 'Active' ? 'success' : 'neutral'}
                          />
                          <Badge label={getLevelBadgeLabel(meta.level)} color="secondary" />
                        </>
                      }
                    />
                  );
                })}
                <PaginationControls
                  currentPage={currentPage} totalPages={totalPages}
                  pageSize={pageSize} totalItems={sortedEmployees.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
              </div>
            )}
          </>
        )}
      </motion.div>

      <FAB onClick={handleAddNew} icon="person_add" />

      {/* Filter Modal */}
      {showAdvancedFilters && (
        <EmployeeFilterPanel
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            setCurrentPage(1);
            const params: Record<string, string> = {};
            if (next.status !== 'All') params.status = next.status;
            if (next.retiringYear) params.retiringYear = next.retiringYear;
            setSearchParams(params);
          }}
          onClose={() => setShowAdvancedFilters(false)}
        />
      )}

      {/* Employee Form Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => setShowModal(false)} 
            />

            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-5xl bg-surface-container-low rounded-t-[40px] lg:rounded-[40px] shadow-2xl flex flex-col h-[100dvh] lg:h-[90vh] overflow-hidden border border-white/10"
            >
              {/* Modal Header */}
              <div className="flex-none px-8 py-6 border-b border-outline-variant bg-surface-container flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                    <AppIcon name="person" size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-on-surface tracking-tighter leading-none">
                      {formData.employees.name || 'New Personnel'}
                    </h3>
                    <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.2em] mt-2">
                      {(formData.employees.designation || 'Classified Designation') + ' • ' + (formData.employees.personal_no || 'P.No Pending')}
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center hover:bg-surface-variant rounded-2xl transition-all">
                  <AppIcon name="close" size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex-none border-b border-outline-variant overflow-x-auto no-scrollbar bg-surface-container-lowest">
                <div className="flex px-4">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        'flex items-center gap-2 px-8 py-5 text-sm font-bold transition-all relative',
                        activeTab === tab.id
                          ? 'text-primary'
                          : 'text-on-surface-variant/40 hover:text-on-surface-variant'
                      )}
                    >
                      <AppIcon name={tab.icon} size={20} filled={activeTab === tab.id} />
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full mx-6" 
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duplicate warning */}
              <AnimatePresence>
                {duplicateWarning && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-error-container/50 backdrop-blur-md text-on-error-container p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-error/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-error text-white flex items-center justify-center shadow-lg shadow-error/30">
                        <AppIcon name="warning" size={24} />
                      </div>
                      <div>
                        <div className="font-black text-lg">Potential Conflict Detected</div>
                        <div className="text-sm font-medium opacity-70">
                          {duplicateWarning.employees.name} ({duplicateWarning.employees.personal_no}) already exists in the system.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="text" label="Cancel Entry" onClick={() => setShowModal(false)} className="font-bold" />
                      <Button variant="filled" label="Modify Existing" onClick={handleSwitchToExisting} className="bg-error text-white h-12 px-6 rounded-2xl shadow-lg shadow-error/20" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form content */}
              <div ref={modalScrollRef} className="flex-1 overflow-y-auto p-8 sm:p-10 bg-mesh no-scrollbar">
                <form id="employee-form" onSubmit={handleSave} className="space-y-10 max-w-4xl mx-auto">
                  {activeTab === 'posting' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                      <InstitutionPreviewCard employee={formData} />
                    </motion.div>
                  )}

                {/* MASTER TAB */}
                {activeTab === 'master' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TextField label="Personnel No" value={formData.employees.personal_no}
                      onChange={(e) => updateDeep(['employees', 'personal_no'], e.target.value)} />

                    <TextField label="CNIC" value={formData.employees.cnic_no}
                      onChange={(e) => updateDeep(['employees', 'cnic_no'], e.target.value)}
                      placeholder="12345-1234567-1" required />

                    <TextField label="NTN No" value={formData.employees.ntn_no}
                      onChange={(e) => updateDeep(['employees', 'ntn_no'], e.target.value)} />

                    <TextField label="Full Name" value={formData.employees.name}
                      onChange={(e) => updateDeep(['employees', 'name'], e.target.value)}
                      className="md:col-span-2" required />

                    <TextField label="Father Name" value={formData.employees.father_name}
                      onChange={(e) => updateDeep(['employees', 'father_name'], e.target.value)} />

                    <TextField label="Date of Birth" type="date" value={formData.employees.dob}
                      onChange={(e) => {
                        updateDeep(['employees', 'dob'], e.target.value);
                        if (e.target.value) {
                          updateDeep(['service_history', 'date_of_retirement'], calculateRetirementDate(e.target.value));
                          updateDeep(['extras', 'retirement_date_source'], 'auto');
                        }
                      }} />

                    <TextField label="Nationality" value={formData.employees.nationality}
                      onChange={(e) => updateDeep(['employees', 'nationality'], e.target.value)} />

                    <SelectField label="Gender" value={formData.employees.gender || 'Male'}
                      onChange={(e: any) => updateDeep(['employees', 'gender'], e.target.value)}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </SelectField>

                    <TextField label="Mobile No" value={formData.employees.mobile_no}
                      onChange={(e) => updateDeep(['employees', 'mobile_no'], e.target.value)} />

                    <TextField label="Address" value={formData.employees.address}
                      onChange={(e) => updateDeep(['employees', 'address'], e.target.value)}
                      className="md:col-span-2" />

                    <SelectField label="District" value={formData.employees.district}
                      onChange={(e: any) => {
                        const district = e.target.value;
                        updateDeep(['employees', 'district'], district);
                        const tehsils = DISTRICT_TEHSIL_MAP[district] || [];
                        if (tehsils.length > 0) updateDeep(['employees', 'tehsil'], tehsils[0]);
                      }}>
                      {KPK_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </SelectField>

                    {customTehsil ? (
                      <div className="relative">
                        <TextField label="Tehsil (Manual Entry)" value={formData.employees.tehsil}
                          onChange={(e) => updateDeep(['employees', 'tehsil'], e.target.value)} />
                        <button type="button" onClick={() => setCustomTehsil(false)}
                          className="absolute right-2 top-2 text-xs text-primary hover:underline">
                          Use list
                        </button>
                      </div>
                    ) : (
                      <SelectField label="Tehsil" value={formData.employees.tehsil}
                        onChange={(e: any) => {
                          if (e.target.value === 'OTHER_CUSTOM') {
                            setCustomTehsil(true);
                            updateDeep(['employees', 'tehsil'], '');
                          } else {
                            updateDeep(['employees', 'tehsil'], e.target.value);
                          }
                        }}>
                        {availableTehsils.map((t) => <option key={t} value={t}>{t}</option>)}
                        <option value="OTHER_CUSTOM">-- Other / Manual --</option>
                      </SelectField>
                    )}

                    <SelectField label="Status" value={formData.employees.status}
                      onChange={(e: any) => updateDeep(['employees', 'status'], e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </SelectField>

                    <SelectField label="Staff Type" value={formData.employees.staff_type}
                      onChange={(e: any) => updateDeep(['employees', 'staff_type'], e.target.value)}>
                      <option value="teaching">Teaching</option>
                      <option value="non_teaching">Non Teaching</option>
                    </SelectField>

                    <SelectField label="Employment Category" value={formData.employees.employment_category}
                      onChange={(e: any) => updateDeep(['employees', 'employment_category'], e.target.value)}>
                      <option value="Permanent">Permanent</option>
                      <option value="Active Temporary">Active Temporary</option>
                      <option value="Contract">Contract</option>
                    </SelectField>

                    <Card className="md:col-span-2 p-4 rounded-xl bg-surface border border-outline-variant">
                      <div className="font-bold text-sm text-primary mb-3">School / Office Entry Guidance</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-on-surface-variant">
                        <div>
                          <div className="font-medium text-on-surface">For School Records</div>
                          <div>Put full institution title in <strong>School / Institution Full Name</strong>, e.g. <em>GHS KANNA BATTAGRAM</em> or <em>GGPS ALLAI</em>.</div>
                        </div>
                        <div>
                          <div className="font-medium text-on-surface">For Office Records</div>
                          <div>Put office title in <strong>Office Name</strong>, e.g. <em>Office of SDEO (Male) Allai</em> or <em>Office of DEO (Female) Battagram</em>.</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* POSTING TAB */}
                {activeTab === 'posting' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TextField label="Designation (Short)" value={formData.employees.designation}
                      onChange={(e) => updateDeep(['employees', 'designation'], e.target.value)} />

                    <TextField label="Designation (Full)" value={formData.employees.designation_full}
                      onChange={(e) => updateDeep(['employees', 'designation_full'], e.target.value)} />

                    <TextField label="BPS (Basic Pay Scale)" type="number" value={formData.employees.bps}
                      onChange={(e) => updateDeep(['employees', 'bps'], Number(e.target.value))} />

                    <TextField label="School / Institution Full Name" value={formData.employees.school_full_name}
                      onChange={(e) => updateDeep(['employees', 'school_full_name'], e.target.value)}
                      className="md:col-span-2" placeholder="e.g. GHS KANNA BATTAGRAM / GGPS ALLAI" />

                    <TextField label="Office Name" value={formData.employees.office_name}
                      onChange={(e) => updateDeep(['employees', 'office_name'], e.target.value)}
                      className="md:col-span-2"
                      placeholder="e.g. Office of SDEO (Male) Allai / Office of DEO (Female) Battagram" />

                    <TextField label="DDO Code" value={formData.employees.ddo_code}
                      onChange={(e) => updateDeep(['employees', 'ddo_code'], e.target.value)} />

                    <div className="md:col-span-2 border-t border-outline-variant my-2 pt-4">
                      <h4 className="font-bold text-sm text-on-surface-variant mb-4 uppercase tracking-wide">Service Dates</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField label="Date of Birth (for retirement calc)" type="date" value={formData.employees.dob}
                          onChange={(e) => {
                            updateDeep(['employees', 'dob'], e.target.value);
                            if (e.target.value) {
                              updateDeep(['service_history', 'date_of_retirement'], calculateRetirementDate(e.target.value));
                              updateDeep(['extras', 'retirement_date_source'], 'auto');
                            }
                          }} />

                        <TextField label="First Appointment" type="date" value={formData.service_history.date_of_appointment}
                          onChange={(e) => updateDeep(['service_history', 'date_of_appointment'], e.target.value)} />

                        <TextField label="Entry into Govt Service" type="date" value={formData.service_history.date_of_entry}
                          onChange={(e) => updateDeep(['service_history', 'date_of_entry'], e.target.value)} />

                        <TextField label="Retirement Date" type="date" value={formData.service_history.date_of_retirement}
                          onChange={(e) => {
                            updateDeep(['service_history', 'date_of_retirement'], e.target.value);
                            updateDeep(['extras', 'retirement_date_source'], 'manual');
                          }} />

                        {isDeceased && (
                          <TextField label="Date of Death" type="date" value={formData.service_history.date_of_death || ''}
                            onChange={(e) => updateDeep(['service_history', 'date_of_death'], e.target.value)} />
                        )}

                        <div className="p-3 bg-surface-variant/30 rounded-lg">
                          <div className="text-xs text-on-surface-variant uppercase mb-1">
                            {isEmployeeActive ? 'Current Service Duration (Till Today)' : 'Total Service Duration'}
                          </div>
                          <div className="font-bold text-lg">{service.text}</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* FINANCIAL TAB */}
                {activeTab === 'financial' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TextField label="Bank Name" value={formData.employees.bank_name}
                      onChange={(e) => updateDeep(['employees', 'bank_name'], e.target.value)} />
                    <TextField label="Branch Name" value={formData.employees.branch_name}
                      onChange={(e) => updateDeep(['employees', 'branch_name'], e.target.value)} />
                    <TextField label="Branch Code" value={formData.employees.branch_code}
                      onChange={(e) => updateDeep(['employees', 'branch_code'], e.target.value)} />
                    <TextField label="Account No" value={formData.employees.bank_ac_no}
                      onChange={(e) => updateDeep(['employees', 'bank_ac_no'], e.target.value)} />
                    <SelectField label="Account Type" value={formData.employees.account_type}
                      onChange={(e: any) => updateDeep(['employees', 'account_type'], e.target.value)}>
                      <option value="PLS">PLS</option>
                      <option value="Current">Current</option>
                    </SelectField>
                    <div className="md:col-span-2 border-t border-outline-variant my-4 pt-8">
                      <h4 className="font-black text-sm text-on-surface-variant mb-6 uppercase tracking-[0.2em]">Fund Accounts</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <TextField label="GPF Account No" value={formData.employees.gpf_account_no}
                          onChange={(e) => updateDeep(['employees', 'gpf_account_no'], e.target.value)} />
                        <TextField label="PPO No (If Retired)" value={formData.employees.ppo_no}
                          onChange={(e) => updateDeep(['employees', 'ppo_no'], e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PAYROLL TAB */}
                {activeTab === 'payroll' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                    <Card variant="filled" className="bg-primary/10 border border-primary/20 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-[32px] shadow-lg shadow-primary/5">
                      <div className="text-sm font-black text-on-surface-variant/60 uppercase tracking-[0.2em]">Gross Salary (LPC Entitlement)</div>
                      <div className="text-4xl font-black font-mono text-primary tracking-tighter">{formatCurrency(grossPay)}</div>
                    </Card>

                    <div className="bg-surface/40 backdrop-blur-md p-8 rounded-[32px] border border-outline-variant/30">
                      <h4 className="font-black text-xs uppercase mb-8 text-primary flex items-center gap-3 tracking-[0.2em]">
                        <AppIcon name="payments" size={20} /> Pay & Regular Allowances
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        <TextField label="Basic Pay" type="number" value={formData.financials.basic_pay}
                          onChange={(e) => updateDeep(['financials', 'basic_pay'], Number(e.target.value))} />
                        <TextField label="Personal Pay (PP)" type="number" value={formData.financials.p_pay}
                          onChange={(e) => updateDeep(['financials', 'p_pay'], Number(e.target.value))} />
                        <TextField label="House Rent (HRA)" type="number" value={formData.financials.hra}
                          onChange={(e) => updateDeep(['financials', 'hra'], Number(e.target.value))} />
                        <TextField label="Conveyance (CA)" type="number" value={formData.financials.ca}
                          onChange={(e) => updateDeep(['financials', 'ca'], Number(e.target.value))} />
                        <TextField label="Medical (MA)" type="number" value={formData.financials.ma}
                          onChange={(e) => updateDeep(['financials', 'ma'], Number(e.target.value))} />
                        <TextField label="U.A.A Allowance" type="number" value={formData.financials.uaa}
                          onChange={(e) => updateDeep(['financials', 'uaa'], Number(e.target.value))} />
                        <TextField label="Washing Allow" type="number" value={formData.financials.wa}
                          onChange={(e) => updateDeep(['financials', 'wa'], Number(e.target.value))} />
                        <TextField label="Dress Allow" type="number" value={formData.financials.dress_allow}
                          onChange={(e) => updateDeep(['financials', 'dress_allow'], Number(e.target.value))} />
                        <TextField label="Integrated Allow" type="number" value={formData.financials.integrated_allow}
                          onChange={(e) => updateDeep(['financials', 'integrated_allow'], Number(e.target.value))} />
                        <TextField label="Teaching Allow" type="number" value={formData.financials.teaching_allow}
                          onChange={(e) => updateDeep(['financials', 'teaching_allow'], Number(e.target.value))} />
                        <TextField label="Science Teaching Allow" type="number" value={formData.financials.science_teaching_allow}
                          onChange={(e) => updateDeep(['financials', 'science_teaching_allow'], Number(e.target.value))} />
                        <TextField label="M.Phil Allowance" type="number" value={formData.financials.mphil_allow}
                          onChange={(e) => updateDeep(['financials', 'mphil_allow'], Number(e.target.value))} />
                        <TextField label="Charge Allow" type="number" value={formData.financials.charge_allow}
                          onChange={(e) => updateDeep(['financials', 'charge_allow'], Number(e.target.value))} />
                        <TextField label="Computer Allow" type="number" value={formData.financials.computer_allow}
                          onChange={(e) => updateDeep(['financials', 'computer_allow'], Number(e.target.value))} />
                        <TextField label="Entertainment Allow" type="number" value={formData.financials.entertainment_allow}
                          onChange={(e) => updateDeep(['financials', 'entertainment_allow'], Number(e.target.value))} />
                        <TextField label="Weather Allow" type="number" value={formData.financials.weather_allow}
                          onChange={(e) => updateDeep(['financials', 'weather_allow'], Number(e.target.value))} />
                        <TextField label="Special Allow 2021" type="number" value={formData.financials.spl_allow_2021}
                          onChange={(e) => updateDeep(['financials', 'spl_allow_2021'], Number(e.target.value))} />
                        <TextField label="Special Allow (Female)" type="number" value={formData.financials.spl_allow_female}
                          onChange={(e) => updateDeep(['financials', 'spl_allow_female'], Number(e.target.value))} />
                        <TextField label="Special Allow (Disable)" type="number" value={formData.financials.spl_allow_disable}
                          onChange={(e) => updateDeep(['financials', 'spl_allow_disable'], Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="bg-surface/40 backdrop-blur-md p-8 rounded-[32px] border border-outline-variant/30">
                      <h4 className="font-black text-xs uppercase mb-8 text-primary flex items-center gap-3 tracking-[0.2em]">
                        <AppIcon name="trending_up" size={20} /> Adhoc Reliefs
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        <TextField label="Adhoc 2013" type="number" value={formData.financials.adhoc_2013}
                          onChange={(e) => updateDeep(['financials', 'adhoc_2013'], Number(e.target.value))} />
                        <TextField label="Adhoc 2015" type="number" value={formData.financials.adhoc_2015}
                          onChange={(e) => updateDeep(['financials', 'adhoc_2015'], Number(e.target.value))} />
                        <TextField label="Adhoc 2022" type="number" value={formData.financials.adhoc_2022_ps17}
                          onChange={(e) => updateDeep(['financials', 'adhoc_2022_ps17'], Number(e.target.value))} />
                        <TextField label="DRA 2022" type="number" value={formData.financials.dra_2022kp}
                          onChange={(e) => updateDeep(['financials', 'dra_2022kp'], Number(e.target.value))} />
                        <TextField label="Adhoc 2023" type="number" value={formData.financials.adhoc_2023_35}
                          onChange={(e) => updateDeep(['financials', 'adhoc_2023_35'], Number(e.target.value))} />
                        <TextField label="Adhoc 2024" type="number" value={formData.financials.adhoc_2024_25}
                          onChange={(e) => updateDeep(['financials', 'adhoc_2024_25'], Number(e.target.value))} />
                        <TextField label="Adhoc 2025" type="number" value={formData.financials.adhoc_2025_10}
                          onChange={(e) => updateDeep(['financials', 'adhoc_2025_10'], Number(e.target.value))} />
                        <TextField label="DRA 2025" type="number" value={formData.financials.dra_2025_15}
                          onChange={(e) => updateDeep(['financials', 'dra_2025_15'], Number(e.target.value))} />
                      </div>
                    </div>

                    <DynamicMapEditor
                      title="Other / Custom Allowances"
                      map={formData.financials.allowances_extra || {}}
                      onChange={(newMap) => updateDeep(['financials', 'allowances_extra'], newMap)}
                    />
                  </motion.div>
                )}

                {/* DEDUCTIONS TAB */}
                {activeTab === 'deductions' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                      <Card variant="filled" className="bg-error/10 text-center py-6 rounded-[32px] border border-error/20">
                        <div className="text-[10px] uppercase font-black text-error/60 tracking-widest">Total Deductions</div>
                        <div className="text-3xl font-black text-error font-mono">{formatCurrency(totalDeduction)}</div>
                      </Card>
                      <Card variant="filled" className="bg-primary/10 text-center py-6 rounded-[32px] border border-primary/20">
                        <div className="text-[10px] uppercase font-black text-primary/60 tracking-widest">Net Payable</div>
                        <div className="text-3xl font-black text-primary font-mono">{formatCurrency(netPay)}</div>
                      </Card>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                      <TextField label="GP Fund Sub" type="number" value={formData.financials.gpf}
                        onChange={(e) => updateDeep(['financials', 'gpf'], Number(e.target.value))} />
                      <TextField label="Benevolent Fund" type="number" value={formData.financials.bf}
                        onChange={(e) => updateDeep(['financials', 'bf'], Number(e.target.value))} />
                      <TextField label="Group Insurance" type="number" value={formData.financials.group_insurance}
                        onChange={(e) => updateDeep(['financials', 'group_insurance'], Number(e.target.value))} />
                      <TextField label="R.B & Death" type="number" value={formData.financials.rb_death}
                        onChange={(e) => updateDeep(['financials', 'rb_death'], Number(e.target.value))} />
                      <TextField label="Income Tax" type="number" value={formData.financials.income_tax}
                        onChange={(e) => updateDeep(['financials', 'income_tax'], Number(e.target.value))} />
                      <TextField label="E.E.F" type="number" value={formData.financials.eef}
                        onChange={(e) => updateDeep(['financials', 'eef'], Number(e.target.value))} />
                    </div>
                    <DynamicMapEditor
                      title="Other / Custom Deductions"
                      map={formData.financials.deductions_extra || {}}
                      onChange={(newMap) => updateDeep(['financials', 'deductions_extra'], newMap)}
                    />
                  </motion.div>
                )}

                {/* LOANS TAB */}
                {activeTab === 'loans' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TextField label="GPF Advance Recovery" type="number" value={formData.financials.gpf_loan_instal}
                      onChange={(e) => updateDeep(['financials', 'gpf_loan_instal'], Number(e.target.value))} />
                    <TextField label="HBA Loan Installment" type="number" value={formData.financials.hba_loan_instal}
                      onChange={(e) => updateDeep(['financials', 'hba_loan_instal'], Number(e.target.value))} />
                    <TextField label="Other Recovery" type="number" value={formData.financials.recovery}
                      onChange={(e) => updateDeep(['financials', 'recovery'], Number(e.target.value))} />
                  </motion.div>
                )}

                {/* PENSION TAB */}
                {activeTab === 'pension' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <TextField label="LWP Days (Leave Without Pay)" type="number" value={formData.service_history.lwp_days}
                      onChange={(e) => updateDeep(['service_history', 'lwp_days'], Number(e.target.value))} />

                    <TextField label="Leaves Taken (For Account)" type="number" value={formData.service_history.leave_taken_days}
                      onChange={(e) => updateDeep(['service_history', 'leave_taken_days'], Number(e.target.value))} />

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-primary/5 rounded-[32px] border border-primary/10">
                      <TextField label="LPR Days (Encashment)" type="number" value={formData.service_history.lpr_days ?? 365}
                        onChange={(e) => updateDeep(['service_history', 'lpr_days'], Number(e.target.value))} />

                      <TextField label="Commutation Portion (%)" type="number"
                        value={(formData.extras as any)?.commutation_portion ?? 35}
                        onChange={(e) => updateDeep(['extras', 'commutation_portion'], Number(e.target.value))}
                        placeholder="35" />

                      <div className="flex flex-col justify-end pb-2">
                        <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest mb-1">Encashment Amount (Est.)</span>
                        <span className="text-2xl font-black font-mono text-primary tracking-tighter">{formatCurrency(lprAmount)}</span>
                        <span className="text-[10px] text-on-surface-variant/40 mt-1">(Basic Pay / 30) × Days</span>
                      </div>
                    </div>

                    <div className="md:col-span-2 mt-4">
                      {!isDeceased && (
                        <div className="p-8 border border-outline-variant/30 rounded-[40px] bg-surface/40 backdrop-blur-md shadow-xl">
                          <div className="flex justify-between items-center mb-8">
                            <h4 className="font-black text-xs uppercase text-primary flex items-center gap-3 tracking-[0.2em]">
                              <AppIcon name="calculate" /> Pension Metrics
                            </h4>
                            <Badge
                              label={isEmployeeActive ? 'Calculated Till Date (Active)' : 'Calculated at Retirement'}
                              color={isEmployeeActive ? 'secondary' : 'neutral'}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                            <div className="col-span-2 md:col-span-1">
                              <div className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Qualifying Service</div>
                              <div className="font-black text-xl mt-1">
                                {qService} Years{' '}
                                <span className="text-xs font-bold text-on-surface-variant/40">(Max 30)</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Gross Pension</div>
                              <div className="font-black text-xl mt-1 font-mono">{formatCurrency(grossPensionCalc)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-green-600/60 uppercase tracking-widest">
                                Net Pension ({100 - (((formData.extras as any)?.commutation_portion ?? 35) as number)}%)
                              </div>
                              <div className="font-black text-xl mt-1 text-green-600 font-mono">{formatCurrency(netPensionCalc)}</div>
                            </div>

                            <div className="col-span-2 md:col-span-3 p-6 bg-primary/10 border border-primary/20 rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg shadow-primary/5">
                              <div>
                                <div className="text-xs font-black text-primary uppercase tracking-[0.2em]">Monthly Payable Pension</div>
                                <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase mt-1 tracking-widest">(Net + Adhoc Reliefs + Medical)</div>
                              </div>
                              <div className="text-3xl font-black font-mono text-primary tracking-tighter">{formatCurrency(monthlyPayablePension)}</div>
                            </div>

                            <div className="col-span-2 md:col-span-3 mt-2 p-6 bg-secondary/10 rounded-[32px] flex justify-between items-center border border-secondary/20 shadow-lg shadow-secondary/5">
                              <div>
                                <div className="text-xs font-black text-secondary uppercase tracking-[0.2em]">
                                  Commutation ({(formData.extras as any)?.commutation_portion ?? 35}%)
                                </div>
                                <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase mt-1 tracking-widest">
                                  Gross × {commutationPortion.toFixed(2)} × 12 × {ageFactor}
                                </div>
                              </div>
                              <div className="text-2xl font-black font-mono text-secondary tracking-tighter">{formatCurrency(commLumpSumCalc)}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {isDeceased && familyPensionCalc && (
                        <div className="p-8 border border-error/30 rounded-[40px] bg-error/5 backdrop-blur-md shadow-xl">
                          <div className="flex justify-between items-center mb-8">
                            <h4 className="font-black text-xs uppercase text-error flex items-center gap-3 tracking-[0.2em]">
                              <AppIcon name="calculate" /> Family Pension Estimates
                            </h4>
                            <Badge
                              label={isDeathInService ? 'Death in Service' : 'Death after Retirement'}
                              color="error"
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                            <div className="col-span-2 md:col-span-1">
                              <div className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Last Drawn Pay</div>
                              <div className="font-black text-xl mt-1 font-mono">{formatCurrency(familyPensionCalc.lastPay)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">Gross Pension</div>
                              <div className="font-black text-xl mt-1 font-mono">{formatCurrency(familyPensionCalc.grossPension)}</div>
                              <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase mt-1 tracking-widest">
                                {isDeathInService ? '(L.Pay × Serv × 7) / 300' : '50% of L.Pay'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-error/60 uppercase tracking-widest">Commuted ({familyPensionCalc.commutedPortion}%)</div>
                              <div className="font-black text-xl mt-1 text-error font-mono">{formatCurrency(familyPensionCalc.surrenderedPortion)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-green-600/60 uppercase tracking-widest">Net Pension</div>
                              <div className="font-black text-xl mt-1 text-green-600 font-mono">{formatCurrency(familyPensionCalc.netPension)}</div>
                            </div>
                            <div className="col-span-2 md:col-span-3 p-6 bg-error/10 border border-error/20 rounded-[32px] shadow-lg shadow-error/5">
                              <div className="flex justify-between w-full items-center">
                                <div>
                                  <div className="text-xs font-black text-error uppercase tracking-[0.2em]">Monthly Family Pension</div>
                                  <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase mt-1 tracking-widest">(Net + Adhoc Reliefs + Medical)</div>
                                </div>
                                <div className="text-3xl font-black font-mono text-error tracking-tighter">{formatCurrency(familyPensionCalc.netFamilyPension)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 border-t border-outline-variant pt-8 mt-4">
                      <h4 className="font-black text-xs uppercase mb-6 tracking-[0.2em] text-on-surface-variant/60">Pension Order Info</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <TextField label="Retirement Order No" value={formData.service_history.retirement_order_no}
                          onChange={(e) => updateDeep(['service_history', 'retirement_order_no'], e.target.value)} />
                        <TextField label="Order Date" type="date" value={formData.service_history.retirement_order_date}
                          onChange={(e) => updateDeep(['service_history', 'retirement_order_date'], e.target.value)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* FAMILY TAB */}
                {activeTab === 'family' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                    {isDeceased && (
                      <div className="p-8 border border-error/20 bg-error/5 rounded-[40px] backdrop-blur-md">
                        <h4 className="font-black text-xs uppercase text-error mb-8 flex items-center gap-3 tracking-[0.2em]">
                          <AppIcon name="diversity_3" /> Family Pension Beneficiary
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <TextField label="Beneficiary Name" value={(formData.extras as any)?.beneficiary?.name || ''}
                            onChange={(e) => updateDeep(['extras', 'beneficiary', 'name'], e.target.value)} />
                          <SelectField label="Relation" value={(formData.extras as any)?.beneficiary?.relation || ''}
                            onChange={(e: any) => updateDeep(['extras', 'beneficiary', 'relation'], e.target.value)}>
                            <option value="">Select Relation</option>
                            <option value="Widow">Widow</option>
                            <option value="Widower">Widower</option>
                            <option value="Son">Son</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                          </SelectField>
                          <TextField label="Beneficiary Age" value={(formData.extras as any)?.beneficiary?.age || ''}
                            onChange={(e) => updateDeep(['extras', 'beneficiary', 'age'], e.target.value)} />
                          <TextField label="Beneficiary CNIC" value={(formData.extras as any)?.beneficiary?.cnic || ''}
                            onChange={(e) => updateDeep(['extras', 'beneficiary', 'cnic'], e.target.value)} />
                          <TextField label="Bank Name" value={(formData.extras as any)?.beneficiary?.bank_name || ''}
                            onChange={(e) => updateDeep(['extras', 'beneficiary', 'bank_name'], e.target.value)} />
                          <TextField label="Branch Name" value={(formData.extras as any)?.beneficiary?.branch_name || ''}
                            onChange={(e) => updateDeep(['extras', 'beneficiary', 'branch_name'], e.target.value)} />
                          <TextField label="Account No" value={(formData.extras as any)?.beneficiary?.account_no || ''}
                            onChange={(e) => updateDeep(['extras', 'beneficiary', 'account_no'], e.target.value)} />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-4">
                      <div>
                        <h4 className="font-black text-xl text-on-surface tracking-tighter">Family Members</h4>
                        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest mt-1">Dependency Records</p>
                      </div>
                      <Button
                        type="button" variant="tonal" icon="add" label="Add Member"
                        className="rounded-2xl h-12 px-6"
                        onClick={() => {
                          const newMember: OfficialFamilyMember = {
                            id: Date.now().toString(),
                            relative_name: '',
                            relation: 'Wife',
                            cnic: '',
                            age: '',
                          };
                          setFormData((prev) => ({ ...prev, family_members: [...prev.family_members, newMember] }));
                        }}
                      />
                    </div>

                    <div className="space-y-6">
                      {formData.family_members.length === 0 && (
                        <div className="text-center text-on-surface-variant/40 p-12 border-2 border-dashed border-outline-variant/30 rounded-[40px] font-bold text-sm uppercase tracking-widest">
                          No personnel dependencies recorded.
                        </div>
                      )}

                      {formData.family_members.map((fm, idx) => (
                        <motion.div 
                          key={fm.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-8 border border-outline-variant/30 rounded-[40px] bg-white/5 relative group transition-all hover:bg-white/10"
                        >
                          <button
                            type="button"
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-error/40 hover:text-error hover:bg-error/10 rounded-xl transition-all"
                            onClick={() => {
                              const next = [...formData.family_members];
                              next.splice(idx, 1);
                              setFormData((prev) => ({ ...prev, family_members: next }));
                            }}
                          >
                            <AppIcon name="delete" size={20} />
                          </button>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
                            <TextField label="Name" value={fm.relative_name}
                              onChange={(e) => {
                                const next = [...formData.family_members];
                                next[idx].relative_name = e.target.value;
                                setFormData((prev) => ({ ...prev, family_members: next }));
                              }} />

                            <SelectField label="Relation" value={fm.relation}
                              onChange={(e: any) => {
                                const next = [...formData.family_members];
                                next[idx].relation = e.target.value;
                                setFormData((prev) => ({ ...prev, family_members: next }));
                              }}>
                              <option value="Wife">Wife</option>
                              <option value="Husband">Husband</option>
                              <option value="Son">Son</option>
                              <option value="Daughter">Daughter</option>
                              <option value="Father">Father</option>
                              <option value="Mother">Mother</option>
                            </SelectField>

                            <TextField label="Age" value={fm.age}
                              onChange={(e) => {
                                const next = [...formData.family_members];
                                next[idx].age = e.target.value;
                                setFormData((prev) => ({ ...prev, family_members: next }));
                              }} />

                            <SelectField label="Marital Status" value={fm.marital_status || ''}
                              onChange={(e: any) => {
                                const next = [...formData.family_members];
                                next[idx].marital_status = e.target.value;
                                setFormData((prev) => ({ ...prev, family_members: next }));
                              }}>
                              <option value="">Select</option>
                              <option value="Married">Married</option>
                              <option value="Unmarried">Unmarried</option>
                              <option value="Widow">Widow</option>
                            </SelectField>

                            <TextField label="CNIC" value={fm.cnic}
                              onChange={(e) => {
                                const next = [...formData.family_members];
                                next[idx].cnic = e.target.value;
                                setFormData((prev) => ({ ...prev, family_members: next }));
                              }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </form>
            </div>

            {/* Sticky footer */}
            <div className="flex-none p-6 border-t border-outline-variant bg-surface-container flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2 text-on-surface-variant/40">
                  <AppIcon name="security" size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">End-to-end encrypted records</span>
               </div>
               <div className="flex gap-3 w-full sm:w-auto">
                 <Button variant="text" label="Discard Changes" onClick={() => setShowModal(false)} className="font-bold h-12 px-8 flex-1 sm:flex-none" />
                 <Button 
                   type="submit" 
                   form="employee-form"
                   variant="filled" 
                   label={formData.id ? "Apply Changes" : "Register Personnel"} 
                   className="h-12 px-10 rounded-2xl shadow-lg shadow-primary/20 flex-1 sm:flex-none" 
                   icon="check_circle"
                 />
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};
