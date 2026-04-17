import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
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

const EDUCATION_HINTS = [
  'GPS = Primary School',
  'GMS = Middle School',
  'GHS = High School',
  'GHSS = Higher Secondary School',
  'GGPS / GGMS / GGHS / GGHSS = Female School Variants',
];

// ============================================================================
// TYPES
// ============================================================================

type EducationLevelFilter =
  | 'all'
  | 'primary'
  | 'middle'
  | 'high'
  | 'higher_secondary'
  | 'education_office'
  | 'other';

type SchoolGenderFilter = 'all' | 'male' | 'female';
type StaffTypeFilter = 'all' | 'teaching' | 'non_teaching';

interface EducationFilters {
  status: string;
  district: string;
  tehsil: string;
  schoolLevel: EducationLevelFilter;
  schoolGender: SchoolGenderFilter;
  staffType: StaffTypeFilter;
  retiringYear: string;
  hasGPF: boolean | null;
}

const DEFAULT_FILTERS: EducationFilters = {
  status: 'All',
  district: 'All',
  tehsil: 'All',
  schoolLevel: 'all',
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

// PERF: getEducationMeta is now only called during cache build (once per employee
// per employees-array reference change). All render paths consume the cache.
function getEducationMeta(employee: EmployeeRecord) {
  const info = getDepartmentInfo(
    employee.employees.school_full_name || '',
    employee.employees.office_name || '',
    employee.employees.tehsil || '',
    employee.employees.district || '',
    employee.employees.designation_full || employee.employees.designation || ''
  );

  let level: EducationLevelFilter = 'other';

  if (info.organizationType === 'primary_school') level = 'primary';
  else if (info.organizationType === 'middle_school') level = 'middle';
  else if (info.organizationType === 'high_school') level = 'high';
  else if (info.organizationType === 'higher_secondary_school') level = 'higher_secondary';
  else if (
    info.organizationType === 'education_office' ||
    info.organizationType === 'directorate'
  ) {
    level = 'education_office';
  }

  return {
    info,
    level,
    gender: info.isGirlsInstitution ? 'female' : 'male',
  } as const;
}

function getLevelBadgeLabel(level: EducationLevelFilter): string {
  switch (level) {
    case 'primary':      return 'Primary';
    case 'middle':       return 'Middle';
    case 'high':         return 'High';
    case 'higher_secondary': return 'Higher Secondary';
    case 'education_office': return 'Education Office';
    default:             return 'Other';
  }
}

// PERF: accepts pre-computed meta so getDepartmentInfo is NOT called again here
function matchesSearch(
  emp: EmployeeRecord,
  term: string,
  meta: ReturnType<typeof getEducationMeta>
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

// PERF: EducationSummary now accepts the pre-built meta cache so it does NOT
// call getEducationMeta or getDepartmentInfo at all during stat computation.
const EducationSummary: React.FC<{
  employees: EmployeeRecord[];
  metaCache: Map<string, ReturnType<typeof getEducationMeta>>;
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
        else if (meta.level === 'education_office') offices++;
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <Card variant="filled" className="p-3 bg-primary-container/40 text-center rounded-xl">
        <div className="text-2xl font-bold text-primary">{stats.total.toLocaleString()}</div>
        <div className="text-xs text-on-surface-variant uppercase tracking-wide">Total</div>
      </Card>
      <Card variant="filled" className="p-3 bg-green-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-green-700">{stats.active.toLocaleString()}</div>
        <div className="text-xs text-green-600 uppercase tracking-wide">Active</div>
      </Card>
      <Card variant="filled" className="p-3 bg-orange-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-orange-700">{stats.retired.toLocaleString()}</div>
        <div className="text-xs text-orange-600 uppercase tracking-wide">Inactive</div>
      </Card>
      <Card variant="filled" className="p-3 bg-blue-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-blue-700">{stats.teaching.toLocaleString()}</div>
        <div className="text-xs text-blue-600 uppercase tracking-wide">Teaching</div>
      </Card>
      <Card variant="filled" className="p-3 bg-pink-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-pink-700">{stats.femaleInstitutions.toLocaleString()}</div>
        <div className="text-xs text-pink-600 uppercase tracking-wide">Female Inst.</div>
      </Card>
      <Card variant="filled" className="p-3 bg-red-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-red-700">{stats.retiringThisYear.toLocaleString()}</div>
        <div className="text-xs text-red-600 uppercase tracking-wide">Retiring {new Date().getFullYear()}</div>
      </Card>
      <Card variant="filled" className="p-3 bg-amber-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-amber-700">{stats.primary.toLocaleString()}</div>
        <div className="text-xs text-amber-600 uppercase tracking-wide">Primary</div>
      </Card>
      <Card variant="filled" className="p-3 bg-cyan-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-cyan-700">{stats.middle.toLocaleString()}</div>
        <div className="text-xs text-cyan-600 uppercase tracking-wide">Middle</div>
      </Card>
      <Card variant="filled" className="p-3 bg-indigo-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-indigo-700">{stats.high.toLocaleString()}</div>
        <div className="text-xs text-indigo-600 uppercase tracking-wide">High</div>
      </Card>
      <Card variant="filled" className="p-3 bg-violet-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-violet-700">{stats.higherSecondary.toLocaleString()}</div>
        <div className="text-xs text-violet-600 uppercase tracking-wide">Higher Sec.</div>
      </Card>
      <Card variant="filled" className="p-3 bg-slate-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-slate-700">{stats.offices.toLocaleString()}</div>
        <div className="text-xs text-slate-600 uppercase tracking-wide">Ed. Offices</div>
      </Card>
      <Card variant="filled" className="p-3 bg-rose-100 text-center rounded-xl">
        <div className="text-2xl font-bold text-rose-700">{stats.nonTeaching.toLocaleString()}</div>
        <div className="text-xs text-rose-600 uppercase tracking-wide">Non-Teaching</div>
      </Card>
    </div>
  );
});
EducationSummary.displayName = 'EducationSummary';

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
    <Card
      variant="filled"
      className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-primary-container/50 rounded-xl animate-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white">
          <AppIcon name="check" />
        </div>
        <div>
          <span className="font-bold text-lg">{selectedCount.toLocaleString()}</span>
          <span className="text-on-surface-variant ml-2">selected</span>
          {!isAllSelected && totalCount > selectedCount && (
            <button
              onClick={onSelectAllFiltered}
              className="ml-3 text-primary text-sm hover:underline font-medium"
            >
              Select all {totalCount.toLocaleString()}
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <Button variant="tonal" icon="download" label="Export CSV" onClick={onExport} />
        <Button variant="tonal" icon="print" label="Print" onClick={() => window.print()} />
        <Button variant="tonal" icon="delete" label="Delete" onClick={onDelete} className="text-error" />
        <Button variant="text" icon="close" onClick={onClear} />
      </div>
    </Card>
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
    <div className="p-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-low rounded-b-xl">
      <div className="flex items-center gap-3">
        <span className="text-sm text-on-surface-variant">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-outline-variant rounded-lg px-3 py-1.5 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-on-surface-variant">
          <strong>{startItem.toLocaleString()}</strong>-
          <strong>{endItem.toLocaleString()}</strong> of{' '}
          <strong>{totalItems.toLocaleString()}</strong>
        </span>
        <div className="flex gap-1">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1}
            className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="First page">
            <AppIcon name="first_page" size={20} />
          </button>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
            className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Previous page">
            <AppIcon name="chevron_left" size={20} />
          </button>
          <div className="flex items-center gap-1 px-2">
            <input
              type="number" min={1} max={totalPages || 1} value={currentPage}
              onChange={(e) => {
                const page = Math.max(1, Math.min(totalPages || 1, Number(e.target.value) || 1));
                onPageChange(page);
              }}
              className="w-14 text-center border border-outline-variant rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-on-surface-variant">/ {(totalPages || 1).toLocaleString()}</span>
          </div>
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Next page">
            <AppIcon name="chevron_right" size={20} />
          </button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-full hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed transition-all" title="Last page">
            <AppIcon name="last_page" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

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

const EducationFilterPanel: React.FC<{
  filters: EducationFilters;
  onChange: (filters: EducationFilters) => void;
  onClose: () => void;
}> = ({ filters, onChange, onClose }) => {
  const [local, setLocal] = useState<EducationFilters>(filters);

  const update = useCallback(
    <K extends keyof EducationFilters>(key: K, value: EducationFilters[K]) => {
      setLocal((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (local.status !== 'All') count++;
    if (local.district !== 'All') count++;
    if (local.tehsil !== 'All') count++;
    if (local.schoolLevel !== 'all') count++;
    if (local.schoolGender !== 'all') count++;
    if (local.staffType !== 'all') count++;
    if (local.retiringYear) count++;
    if (local.hasGPF !== null) count++;
    return count;
  }, [local]);

  const tehsilOptions = local.district !== 'All' ? DISTRICT_TEHSIL_MAP[local.district] || [] : [];

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-surface rounded-3xl shadow-elevation-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <div>
            <h3 className="text-xl font-bold">Education Filters</h3>
            {activeFilterCount > 0 && (
              <span className="text-sm text-primary font-medium">{activeFilterCount} filter(s) active</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
            <AppIcon name="close" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Status" value={local.status} onChange={(e: any) => update('status', e.target.value)}>
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Retired">Retired / Inactive</option>
              {STATUS_OPTIONS.filter((s) => s !== 'Active').map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectField>

            <TextField label="Retiring Year" value={local.retiringYear}
              onChange={(e) => update('retiringYear', e.target.value)} placeholder="e.g. 2027" />

            <SelectField label="District" value={local.district}
              onChange={(e: any) => {
                const district = e.target.value;
                update('district', district);
                update('tehsil', 'All');
              }}>
              <option value="All">All Districts</option>
              {KPK_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </SelectField>

            <SelectField label="Tehsil" value={local.tehsil}
              onChange={(e: any) => update('tehsil', e.target.value)}>
              <option value="All">All Tehsils</option>
              {tehsilOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </SelectField>

            <SelectField label="Institution Level" value={local.schoolLevel}
              onChange={(e: any) => update('schoolLevel', e.target.value)}>
              <option value="all">All</option>
              <option value="primary">Primary</option>
              <option value="middle">Middle</option>
              <option value="high">High</option>
              <option value="higher_secondary">Higher Secondary</option>
              <option value="education_office">Education Office</option>
              <option value="other">Other</option>
            </SelectField>

            <SelectField label="Institution Gender" value={local.schoolGender}
              onChange={(e: any) => update('schoolGender', e.target.value)}>
              <option value="all">All</option>
              <option value="male">Male Institutions</option>
              <option value="female">Female Institutions</option>
            </SelectField>

            <SelectField label="Staff Type" value={local.staffType}
              onChange={(e: any) => update('staffType', e.target.value)}>
              <option value="all">All</option>
              <option value="teaching">Teaching</option>
              <option value="non_teaching">Non Teaching</option>
            </SelectField>

            <SelectField
              label="GPF Account"
              value={local.hasGPF === null ? 'all' : local.hasGPF ? 'has' : 'missing'}
              onChange={(e: any) => {
                const v = e.target.value;
                update('hasGPF', v === 'all' ? null : v === 'has');
              }}>
              <option value="all">Any</option>
              <option value="has">Has GPF</option>
              <option value="missing">No GPF</option>
            </SelectField>
          </div>

          <Card className="p-4 bg-surface-container-low rounded-xl">
            <div className="font-bold text-sm text-primary mb-2">Elementary & Secondary Education Tips</div>
            <ul className="space-y-1 text-sm text-on-surface-variant">
              {EDUCATION_HINTS.map((hint) => (
                <li key={hint} className="flex items-start gap-2">
                  <AppIcon name="info" size={16} className="mt-0.5" />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="p-6 border-t border-outline-variant flex justify-between bg-surface-container">
          <Button variant="text" label="Reset All" onClick={() => setLocal(DEFAULT_FILTERS)} icon="restart_alt" />
          <div className="flex gap-2">
            <Button variant="text" label="Cancel" onClick={onClose} />
            <Button
              variant="filled"
              label={`Apply Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
              onClick={() => { onChange(local); onClose(); }}
              icon="check"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [filters, setFilters]         = useState<EducationFilters>(DEFAULT_FILTERS);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize]       = useState(50);
  const [sortOption, setSortOption]   = useState('name_asc');
  const [showStatistics, setShowStatistics] = useState(true);
  const [viewMode, setViewMode]       = useState<'table' | 'cards'>('table');

  // PERF: single-pass meta cache keyed by employee id.
  // Rebuilt only when the employees array reference changes (add/edit/delete).
  const educationMetaCache = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof getEducationMeta>>();
    for (const emp of employees) {
      cache.set(emp.id, getEducationMeta(emp));
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
  // FILTERING — uses debouncedSearch + educationMetaCache
  // ==========================================================================

  const filteredEmployees = useMemo(() => {
    let result = employees;

    // PERF: use debouncedSearch (not live searchTerm) so filter only fires
    // after the 300 ms debounce instead of on every keystroke.
    if (debouncedSearch.trim()) {
      result = result.filter((emp) => {
        const meta = educationMetaCache.get(emp.id)!;
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

    if (filters.schoolLevel !== 'all') {
      result = result.filter((emp) => educationMetaCache.get(emp.id)!.level === filters.schoolLevel);
    }

    if (filters.schoolGender !== 'all') {
      result = result.filter((emp) => educationMetaCache.get(emp.id)!.gender === filters.schoolGender);
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
  }, [employees, debouncedSearch, filters, educationMetaCache]);

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
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Employees"
        subtitle="Elementary & Secondary Education — KPK"
        actions={
          <div className="hidden lg:flex gap-2">
            <Button
              variant="tonal"
              onClick={() => setShowStatistics(!showStatistics)}
              icon={showStatistics ? 'visibility_off' : 'analytics'}
              label={showStatistics ? 'Hide Stats' : 'Stats'}
            />
            <Button
              variant="tonal"
              onClick={() => setShowAdvancedFilters(true)}
              label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
              icon="tune"
            />
            <Button variant="filled" onClick={handleAddNew} label="Add Employee" icon="add" />
          </div>
        }
      />

      <div className="space-y-4">
        {/* PERF: EducationSummary now receives metaCache — no re-computation inside */}
        {showStatistics && (
          <EducationSummary employees={employees} metaCache={educationMetaCache} />
        )}

        <Card className="p-4 rounded-xl bg-surface-container-low border border-outline-variant">
          <div className="font-bold text-primary mb-2 flex items-center gap-2">
            <AppIcon name="school" size={18} />
            Education-Focused Usage
          </div>
          <div className="text-sm text-on-surface-variant">
            Use <strong>School Full Name</strong> for GPS / GGPS / GMS / GGMS / GHS / GGHS / GHSS / GGHSS.
            Use <strong>Office Name</strong> for SDEO / DEO / Directorate / office cases.
            The system will automatically detect letterhead, authority, and signature title.
          </div>
        </Card>

        {/* Search & quick filters */}
        <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto no-scrollbar pb-1">
          <Card
            variant="filled"
            className="flex-1 flex items-center gap-4 p-2 rounded-full shadow-sm min-w-[250px]"
          >
            <div className="pl-4 text-on-surface-variant">
              <AppIcon name="search" />
            </div>
            <input
              type="text"
              placeholder="Search name, CNIC, P.No, school, office, district..."
              className="bg-transparent w-full outline-none h-10 text-sm"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setDebouncedSearch(''); setCurrentPage(1); }}
                className="pr-4 text-on-surface-variant hover:text-error transition-colors"
              >
                <AppIcon name="close" size={18} />
              </button>
            )}
          </Card>

          <div className="flex bg-surface-variant/30 rounded-full p-1 border border-outline-variant/30 min-w-max">
            {['All', 'Active', 'Retired'].map((s) => (
              <button
                key={s}
                onClick={() => updateQuickStatus(s)}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  filters.status === s ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex bg-surface-variant/30 rounded-full p-1 border border-outline-variant/30 min-w-max">
            {[
              { value: 'all', label: 'All Levels' },
              { value: 'primary', label: 'Primary' },
              { value: 'middle', label: 'Middle' },
              { value: 'high', label: 'High' },
              { value: 'higher_secondary', label: 'H. Sec.' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  setFilters((prev) => ({ ...prev, schoolLevel: item.value as EducationLevelFilter }));
                  setCurrentPage(1);
                }}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  filters.schoolLevel === item.value ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="px-4 py-2 rounded-full bg-primary text-white flex items-center gap-2 min-w-max lg:hidden"
          >
            <AppIcon name="tune" size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-primary text-xs rounded-full px-2 py-0.5 font-bold">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-on-surface-variant">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-outline-variant rounded-lg px-3 py-1.5 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex border border-outline-variant rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'px-3 py-1.5 flex items-center gap-1 transition-colors',
                viewMode === 'table' ? 'bg-primary text-white' : 'bg-surface hover:bg-surface-variant'
              )}
            >
              <AppIcon name="table_rows" size={18} />
              <span className="text-sm hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={clsx(
                'px-3 py-1.5 flex items-center gap-1 transition-colors',
                viewMode === 'cards' ? 'bg-primary text-white' : 'bg-surface hover:bg-surface-variant'
              )}
            >
              <AppIcon name="grid_view" size={18} />
              <span className="text-sm hidden sm:inline">Cards</span>
            </button>
          </div>

          {sortedEmployees.length > 0 && (
            <Button
              variant="text"
              icon="download"
              label={`Export (${sortedEmployees.length})`}
              onClick={handleExportAll}
              className="ml-auto"
            />
          )}
        </div>

        {/* Active filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-on-surface-variant flex-wrap p-3 bg-surface-variant/30 rounded-xl">
            <AppIcon name="filter_list" size={18} />
            <span className="font-medium">Active:</span>
            {debouncedSearch && <Badge label={`"${debouncedSearch}"`} color="primary" />}
            {filters.status !== 'All' && <Badge label={filters.status} color="primary" />}
            {filters.district !== 'All' && <Badge label={filters.district} color="secondary" />}
            {filters.tehsil !== 'All' && <Badge label={filters.tehsil} color="secondary" />}
            {filters.schoolLevel !== 'all' && <Badge label={getLevelBadgeLabel(filters.schoolLevel)} color="tertiary" />}
            {filters.schoolGender !== 'all' && (
              <Badge label={filters.schoolGender === 'female' ? 'Female Institutions' : 'Male Institutions'} color="secondary" />
            )}
            {filters.staffType !== 'all' && (
              <Badge label={filters.staffType === 'teaching' ? 'Teaching' : 'Non Teaching'} />
            )}
            {filters.retiringYear && <Badge label={`Retiring ${filters.retiringYear}`} color="error" />}
            {filters.hasGPF !== null && <Badge label={filters.hasGPF ? 'Has GPF' : 'No GPF'} color="neutral" />}
            <button
              onClick={clearFilters}
              className="text-primary hover:underline text-xs ml-2 flex items-center gap-1 font-medium"
            >
              <AppIcon name="close" size={14} /> Clear All
            </button>
          </div>
        )}

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
                      <tbody>
                        {paginatedEmployees.map((emp) => {
                          // PERF: read from cache — zero getDepartmentInfo calls here
                          const meta = educationMetaCache.get(emp.id)!;

                          return (
                            <tr
                              key={emp.id}
                              className={clsx(
                                'border-t border-outline-variant hover:bg-surface-variant/30 cursor-pointer transition-colors',
                                selectedEmployees.has(emp.id) && 'bg-primary-container/20'
                              )}
                              onClick={() => handleEdit(emp)}
                            >
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedEmployees.has(emp.id)}
                                  onChange={() => handleToggleSelect(emp.id)}
                                  className="rounded accent-primary"
                                />
                              </td>
                              <td className="p-3">
                                <div className="font-semibold">{emp.employees.name}</div>
                                <div className="text-xs text-on-surface-variant">{emp.employees.personal_no || '-'}</div>
                              </td>
                              <td className="p-3 text-sm">
                                {emp.employees.designation || '-'}
                                <div className="text-xs text-on-surface-variant mt-1">
                                  {emp.employees.staff_type === 'non_teaching' ? 'Non Teaching' : 'Teaching'}
                                </div>
                              </td>
                              <td className="p-3 text-sm max-w-[240px]">
                                <div className="truncate font-medium"
                                  title={emp.employees.school_full_name || emp.employees.office_name || ''}>
                                  {emp.employees.school_full_name || emp.employees.office_name || '-'}
                                </div>
                                <div className="text-xs text-on-surface-variant truncate">
                                  {emp.employees.district || '-'} • {emp.employees.tehsil || '-'}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge label={getLevelBadgeLabel(meta.level)} color="secondary" />
                                <div className="mt-1">
                                  <Badge label={meta.gender === 'female' ? 'Female' : 'Male'} color="neutral" />
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge
                                  label={emp.employees.status}
                                  color={emp.employees.status === 'Active' ? 'success' : 'neutral'}
                                />
                              </td>
                              <td className="p-3 text-sm">
                                {emp.service_history.date_of_retirement
                                  ? formatDate(emp.service_history.date_of_retirement, 'dd/MM/yyyy')
                                  : '-'}
                              </td>
                              <td className="p-3 font-mono text-xs">{emp.employees.cnic_no || '-'}</td>
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-center gap-1">
                                  <button
                                    onClick={() => handleEdit(emp)}
                                    className="p-1.5 hover:bg-surface-variant rounded-full text-primary transition-colors"
                                    title="Edit"
                                  >
                                    <AppIcon name="edit" size={18} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Delete ${emp.employees.name}?`)) {
                                        onDelete(emp.id);
                                        showToast('Employee deleted', 'success');
                                      }
                                    }}
                                    className="p-1.5 hover:bg-error/10 rounded-full text-error transition-colors"
                                    title="Delete"
                                  >
                                    <AppIcon name="delete" size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedEmployees.map((emp) => {
                    // PERF: read from cache
                    const meta = educationMetaCache.get(emp.id)!;

                    return (
                      <Card
                        key={emp.id}
                        className={clsx(
                          'p-4 cursor-pointer hover:shadow-lg transition-all rounded-xl',
                          selectedEmployees.has(emp.id) && 'ring-2 ring-primary'
                        )}
                        onClick={() => handleEdit(emp)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.has(emp.id)}
                              onChange={(e) => { e.stopPropagation(); handleToggleSelect(emp.id); }}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded accent-primary"
                            />
                            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-xl font-bold text-primary">
                              {emp.employees.name?.[0] || '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold truncate">{emp.employees.name}</div>
                              <div className="text-sm text-on-surface-variant truncate">
                                {emp.employees.designation || 'No Designation'}
                              </div>
                            </div>
                          </div>
                          <Badge
                            label={emp.employees.status}
                            color={emp.employees.status === 'Active' ? 'success' : 'neutral'}
                          />
                        </div>

                        <div className="mt-3 pt-3 border-t border-outline-variant space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Institution</span>
                            <span className="text-right max-w-[60%] truncate">
                              {emp.employees.school_full_name || emp.employees.office_name || '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Type</span>
                            <span>{getLevelBadgeLabel(meta.level)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">BPS</span>
                            <span className="font-mono font-medium">{emp.employees.bps || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Personal No</span>
                            <span className="font-mono">{emp.employees.personal_no || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Retirement</span>
                            <span>
                              {emp.service_history.date_of_retirement
                                ? formatDate(emp.service_history.date_of_retirement, 'dd/MM/yyyy')
                                : '-'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2 flex-wrap">
                          <Badge label={meta.gender === 'female' ? 'Female' : 'Male'} color="secondary" />
                          <Badge
                            label={emp.employees.staff_type === 'non_teaching' ? 'Non Teaching' : 'Teaching'}
                            color="tertiary"
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
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
                  const meta = educationMetaCache.get(emp.id)!;

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
      </div>

      <FAB onClick={handleAddNew} icon="person_add" />

      {/* Filter Modal */}
      {showAdvancedFilters && (
        <EducationFilterPanel
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
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          <div className="relative w-full max-w-5xl bg-surface-container-low rounded-t-3xl lg:rounded-3xl shadow-elevation-4 flex flex-col h-[100dvh] lg:h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex-none px-6 py-4 border-b border-outline-variant bg-surface-container flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-on-surface">
                  {formData.employees.name || 'New Employee'}
                </h3>
                <div className="text-xs text-on-surface-variant font-mono">
                  {(formData.employees.designation || 'No designation') + ' • ' + (formData.employees.personal_no || 'No P.No')}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <AppIcon name="close" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex-none border-b border-outline-variant overflow-x-auto no-scrollbar">
              <div className="flex min-w-max">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      'flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap',
                      activeTab === tab.id
                        ? 'border-primary text-primary bg-surface-variant/30'
                        : 'border-transparent text-on-surface-variant hover:bg-surface-variant/20'
                    )}
                  >
                    <AppIcon name={tab.icon} size={18} filled={activeTab === tab.id} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duplicate warning */}
            {duplicateWarning && (
              <div className="bg-error-container text-on-error-container p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AppIcon name="warning" size={32} />
                  <div>
                    <div className="font-bold">Duplicate Employee Found</div>
                    <div className="text-sm">
                      {duplicateWarning.employees.name} ({duplicateWarning.employees.personal_no}) already exists.
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="text" label="Cancel" onClick={() => setShowModal(false)} className="text-on-error-container" />
                  <Button variant="filled" label="Edit Existing" onClick={handleSwitchToExisting} className="bg-error text-white" />
                </div>
              </div>
            )}

            {/* Form content */}
            <div ref={modalScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-container-low">
              <form onSubmit={handleSave}>
                {activeTab === 'posting' && (
                  <div className="mb-4">
                    <InstitutionPreviewCard employee={formData} />
                  </div>
                )}

                {/* MASTER TAB */}
                {activeTab === 'master' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
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
                  </div>
                )}

                {/* POSTING TAB */}
                {activeTab === 'posting' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
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
                  </div>
                )}

                {/* FINANCIAL TAB */}
                {activeTab === 'financial' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
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
                    <div className="md:col-span-2 border-t border-outline-variant my-4 pt-4">
                      <h4 className="font-bold text-sm text-on-surface-variant mb-4">Fund Accounts</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField label="GPF Account No" value={formData.employees.gpf_account_no}
                          onChange={(e) => updateDeep(['employees', 'gpf_account_no'], e.target.value)} />
                        <TextField label="PPO No (If Retired)" value={formData.employees.ppo_no}
                          onChange={(e) => updateDeep(['employees', 'ppo_no'], e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* PAYROLL TAB */}
                {activeTab === 'payroll' && (
                  <div className="space-y-6 animate-in fade-in">
                    <Card variant="filled" className="bg-primary-container/30 border border-primary/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl">
                      <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Gross Salary (LPC Entitlement)</div>
                      <div className="text-3xl font-bold font-mono text-primary">{formatCurrency(grossPay)}</div>
                    </Card>

                    <div className="bg-surface p-4 rounded-xl border border-outline-variant">
                      <h4 className="font-bold text-sm uppercase mb-4 text-primary flex items-center gap-2">
                        <AppIcon name="payments" size={18} /> Pay & Regular Allowances
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

                    <div className="bg-surface p-4 rounded-xl border border-outline-variant">
                      <h4 className="font-bold text-sm uppercase mb-4 text-primary flex items-center gap-2">
                        <AppIcon name="trending_up" size={18} /> Adhoc Reliefs
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                  </div>
                )}

                {/* DEDUCTIONS TAB */}
                {activeTab === 'deductions' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <Card variant="filled" className="bg-error-container/30 text-center py-4 rounded-xl">
                        <div className="text-xs uppercase font-bold text-error/80">Total Deductions</div>
                        <div className="text-2xl font-bold text-error">{formatCurrency(totalDeduction)}</div>
                      </Card>
                      <Card variant="filled" className="bg-primary-container/30 text-center py-4 rounded-xl">
                        <div className="text-xs uppercase font-bold text-primary/80">Net Pay</div>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(netPay)}</div>
                      </Card>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                  </div>
                )}

                {/* LOANS TAB */}
                {activeTab === 'loans' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    <TextField label="GPF Advance Recovery" type="number" value={formData.financials.gpf_loan_instal}
                      onChange={(e) => updateDeep(['financials', 'gpf_loan_instal'], Number(e.target.value))} />
                    <TextField label="HBA Loan Installment" type="number" value={formData.financials.hba_loan_instal}
                      onChange={(e) => updateDeep(['financials', 'hba_loan_instal'], Number(e.target.value))} />
                    <TextField label="Other Recovery" type="number" value={formData.financials.recovery}
                      onChange={(e) => updateDeep(['financials', 'recovery'], Number(e.target.value))} />
                  </div>
                )}

                {/* PENSION TAB */}
                {activeTab === 'pension' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    <TextField label="LWP Days (Leave Without Pay)" type="number" value={formData.service_history.lwp_days}
                      onChange={(e) => updateDeep(['service_history', 'lwp_days'], Number(e.target.value))} />

                    <TextField label="Leaves Taken (For Account)" type="number" value={formData.service_history.leave_taken_days}
                      onChange={(e) => updateDeep(['service_history', 'leave_taken_days'], Number(e.target.value))} />

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-surface-variant/30 rounded-xl">
                      <TextField label="LPR Days (Encashment)" type="number" value={formData.service_history.lpr_days ?? 365}
                        onChange={(e) => updateDeep(['service_history', 'lpr_days'], Number(e.target.value))} />

                      <TextField label="Commutation Portion (%)" type="number"
                        value={(formData.extras as any)?.commutation_portion ?? 35}
                        onChange={(e) => updateDeep(['extras', 'commutation_portion'], Number(e.target.value))}
                        placeholder="35" />

                      <div className="flex flex-col justify-end pb-2">
                        <span className="text-xs text-on-surface-variant uppercase mb-1">Encashment Amount (Est.)</span>
                        <span className="text-xl font-bold font-mono text-primary">{formatCurrency(lprAmount)}</span>
                        <span className="text-[10px] text-on-surface-variant">(Basic Pay / 30) × Days</span>
                      </div>
                    </div>

                    <div className="md:col-span-2 mt-2">
                      {!isDeceased && (
                        <div className="p-4 border border-outline-variant rounded-xl bg-surface-container-low">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-sm uppercase text-primary flex items-center gap-2">
                              <AppIcon name="calculate" /> Pension Estimates
                            </h4>
                            <Badge
                              label={isEmployeeActive ? 'Calculated Till Date (Active)' : 'Calculated at Retirement'}
                              color={isEmployeeActive ? 'secondary' : 'neutral'}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="col-span-2 md:col-span-1">
                              <div className="text-xs text-on-surface-variant uppercase">Qualifying Service</div>
                              <div className="font-bold text-lg">
                                {qService} Years{' '}
                                <span className="text-xs font-normal text-on-surface-variant">(Max 30)</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-on-surface-variant uppercase">Gross Pension</div>
                              <div className="font-bold text-lg">{formatCurrency(grossPensionCalc)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-on-surface-variant uppercase text-green-600">
                                Net Pension ({100 - (((formData.extras as any)?.commutation_portion ?? 35) as number)}%)
                              </div>
                              <div className="font-bold text-lg text-green-600">{formatCurrency(netPensionCalc)}</div>
                            </div>

                            <div className="col-span-2 md:col-span-3 p-3 bg-primary-container/20 border border-primary/30 rounded-lg flex flex-col md:flex-row justify-between items-center gap-2">
                              <div>
                                <div className="text-xs font-bold text-primary uppercase">Monthly Payable Pension</div>
                                <div className="text-[10px] text-on-surface-variant">(Net + Adhoc Reliefs + Medical Allowances)</div>
                              </div>
                              <div className="text-2xl font-bold font-mono text-primary">{formatCurrency(monthlyPayablePension)}</div>
                            </div>

                            <div className="col-span-2 md:col-span-3 mt-2 p-3 bg-secondary-container/20 rounded-lg flex justify-between items-center border border-secondary-container">
                              <div>
                                <div className="text-xs font-bold text-secondary uppercase">
                                  Commutation ({(formData.extras as any)?.commutation_portion ?? 35}%)
                                </div>
                                <div className="text-xs opacity-70">
                                  Gross × {commutationPortion.toFixed(2)} × 12 × {ageFactor}
                                </div>
                              </div>
                              <div className="text-xl font-bold font-mono text-secondary">{formatCurrency(commLumpSumCalc)}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {isDeceased && familyPensionCalc && (
                        <div className="p-4 border border-error/30 rounded-xl bg-error-container/5">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-sm uppercase text-error flex items-center gap-2">
                              <AppIcon name="calculate" /> Family Pension Estimates
                            </h4>
                            <Badge
                              label={isDeathInService ? 'Death in Service' : 'Death after Retirement'}
                              color="error"
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="col-span-2 md:col-span-1">
                              <div className="text-xs text-on-surface-variant uppercase">Last Drawn Pay</div>
                              <div className="font-bold text-lg">{formatCurrency(familyPensionCalc.lastPay)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-on-surface-variant uppercase">Gross Pension</div>
                              <div className="font-bold text-lg">{formatCurrency(familyPensionCalc.grossPension)}</div>
                              <div className="text-[10px] text-on-surface-variant">
                                {isDeathInService ? '(Last Pay × Service × 7) / 300' : '50% of Last Pay'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-on-surface-variant uppercase">Commuted ({familyPensionCalc.commutedPortion}%)</div>
                              <div className="font-bold text-lg text-error">{formatCurrency(familyPensionCalc.surrenderedPortion)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-on-surface-variant uppercase text-green-600">Net Pension</div>
                              <div className="font-bold text-lg text-green-600">{formatCurrency(familyPensionCalc.netPension)}</div>
                            </div>
                            <div className="col-span-2 md:col-span-3 p-3 bg-error-container/20 border border-error/30 rounded-lg">
                              <div className="flex justify-between w-full items-center">
                                <div>
                                  <div className="text-xs font-bold text-error uppercase">Monthly Family Pension</div>
                                  <div className="text-[10px] text-on-surface-variant">(Net + Adhoc Reliefs + Medical)</div>
                                </div>
                                <div className="text-2xl font-bold font-mono text-error">{formatCurrency(familyPensionCalc.netFamilyPension)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 border-t border-outline-variant pt-4 mt-2">
                      <h4 className="font-bold text-sm mb-2">Pension Order Info</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField label="Retirement Order No" value={formData.service_history.retirement_order_no}
                          onChange={(e) => updateDeep(['service_history', 'retirement_order_no'], e.target.value)} />
                        <TextField label="Order Date" type="date" value={formData.service_history.retirement_order_date}
                          onChange={(e) => updateDeep(['service_history', 'retirement_order_date'], e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* FAMILY TAB */}
                {activeTab === 'family' && (
                  <div className="animate-in fade-in">
                    {isDeceased && (
                      <div className="mb-6 p-4 border border-error bg-error-container/10 rounded-xl">
                        <h4 className="font-bold text-error mb-4 flex items-center gap-2">
                          <AppIcon name="diversity_3" /> Family Pension Beneficiary (Widow/Heir)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold">Family Members</h4>
                      <Button
                        type="button" variant="tonal" icon="add" label="Add Member"
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

                    <div className="space-y-4">
                      {formData.family_members.length === 0 && (
                        <div className="text-center text-on-surface-variant p-8 border border-dashed border-outline-variant rounded-xl">
                          No family members added yet.
                        </div>
                      )}

                      {formData.family_members.map((fm, idx) => (
                        <div key={fm.id} className="p-4 border border-outline-variant rounded-xl bg-surface relative group">
                          <button
                            type="button"
                            className="absolute top-2 right-2 text-error p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10 rounded"
                            onClick={() => {
                              const next = [...formData.family_members];
                              next.splice(idx, 1);
                              setFormData((prev) => ({ ...prev, family_members: next }));
                            }}
                          >
                            <AppIcon name="delete" />
                          </button>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="flex-none p-4 border-t border-outline-variant bg-surface-container flex justify-end gap-2">
              <Button variant="text" label="Cancel" onClick={() => setShowModal(false)} />
              <Button variant="filled" label="Save Employee" onClick={handleSave} icon="save" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
