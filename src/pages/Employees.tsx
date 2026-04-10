import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmployeeRecord, OfficialFamilyMember, CURRENT_SCHEMA_VERSION } from '../types';
import { calculateRetirementDate, calculateServiceDuration, calculatePayroll, KPK_DISTRICTS, DISTRICT_TEHSIL_MAP, formatCurrency, isDeceasedStatus } from '../utils';
import { formatDate } from '../utils/dateUtils';
import { differenceInYears, parseISO } from 'date-fns';
import { AppIcon } from '../components/AppIcon';
import { Card, Button, TextField, FAB, EmptyState, SelectField, Badge } from '../components/M3';
import { PageHeader } from '../components/PageHeader';
import { DataTable } from '../components/DataTable';
import { MobileListCard } from '../components/MobileListCard';
import { useToast } from '../contexts/ToastContext';
import clsx from 'clsx';
import { calculatePension, calculateFamilyPension, resolveAgeFactor } from '../lib/pension';

import { useEmployeeContext } from '../contexts/EmployeeContext';

// --- Constants & Options ---
const TABS = [
  { id: 'master', label: 'Employees (Master)', icon: 'person' },
  { id: 'posting', label: 'Posting & Service', icon: 'work' },
  { id: 'financial', label: 'Financial (Bank)', icon: 'account_balance' },
  { id: 'payroll', label: 'Payroll (LPC)', icon: 'payments' },
  { id: 'deductions', label: 'Deductions', icon: 'remove_circle_outline' },
  { id: 'loans', label: 'Loans & Recoveries', icon: 'money_off' },
  { id: 'pension', label: 'Pension & Leave', icon: 'elderly' },
  { id: 'family', label: 'Family', icon: 'family_restroom' },
];

const INACTIVE_STATUSES = ['Retired', 'Death in Service', 'Death after Retirement', 'LPR', 'Superannuation', 'Premature', 'Medical Board', 'Compulsory Retire'];

// Helper for dynamic map
const DynamicMapEditor = ({ title, map, onChange }: { title: string, map: Record<string, number>, onChange: (newMap: Record<string, number>) => void }) => {
  const [key, setKey] = useState('');
  const [val, setVal] = useState('');
  
  const add = () => {
    if(key && val) {
       const safeKey = key.trim().replace(/\s+/g, '_').toLowerCase();
       onChange({...map, [safeKey]: Number(val)});
       setKey(''); setVal('');
    }
  };

  return (
    <div className="bg-surface-container p-4 rounded-xl border border-outline-variant mt-4">
       <h4 className="font-bold text-sm uppercase mb-3 text-primary">{title}</h4>
       {Object.entries(map).length > 0 && (
         <div className="space-y-2 mb-4">
           {Object.entries(map).map(([k,v]) => (
              <div key={k} className="flex justify-between items-center bg-surface p-2 rounded border border-outline-variant/50">
                 <span className="capitalize text-sm font-medium">{k.replace(/_/g, ' ')}</span>
                 <div className="flex items-center gap-3">
                    <span className="font-mono font-bold">{formatCurrency(Number(v))}</span>
                    <button type="button" onClick={() => {
                        const next = {...map};
                        delete next[k];
                        onChange(next);
                    }} className="text-error hover:bg-error/10 p-1 rounded"><AppIcon name="close" size={16} /></button>
                 </div>
              </div>
           ))}
         </div>
       )}
       <div className="flex gap-2 items-end">
          <TextField label="Name (e.g. Adhoc 2026)" value={key} onChange={e=>setKey(e.target.value)} className="flex-1" />
          <TextField label="Amount" value={val} onChange={e=>setVal(e.target.value)} type="number" className="w-32" />
          <Button type="button" onClick={add} variant="tonal" icon="add" className="h-14 mb-[1px]" />
       </div>
    </div>
  )
}

export const Employees: React.FC = () => {
  const { employees, addEmployee: onAdd, deleteEmployee: onDelete, updateEmployee: onUpdate } = useEmployeeContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('master');
  const [duplicateWarning, setDuplicateWarning] = useState<EmployeeRecord | null>(null);
  const [customTehsil, setCustomTehsil] = useState(false);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [gpfFilter, setGpfFilter] = useState(searchParams.get('gpf') === 'true');
  const [retiringYearFilter, setRetiringYearFilter] = useState(searchParams.get('retiringYear') || '');

  const { showToast } = useToast();
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Sync state with URL params
  useEffect(() => {
    setStatusFilter(searchParams.get('status') || 'All');
    setGpfFilter(searchParams.get('gpf') === 'true');
    setRetiringYearFilter(searchParams.get('retiringYear') || '');
  }, [searchParams]);

  // Update URL on filter change
  const updateFilter = (status: string) => {
    setStatusFilter(status);
    const params: any = {};
    if (status !== 'All') params.status = status;
    if (gpfFilter) params.gpf = 'true';
    if (retiringYearFilter) params.retiringYear = retiringYearFilter;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setGpfFilter(false);
    setRetiringYearFilter('');
    setSearchParams({});
  };

  // --- Form State ---
  const initialFormState: EmployeeRecord = {
    id: '',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    employees: {
      name: '', designation: '', designation_full: '', bps: 0, school_full_name: '', office_name: '', staff_type: 'teaching',
      status: 'Active', employment_category: 'Permanent', mobile_no: '', personal_no: '', cnic_no: '', ntn_no: '',
      father_name: '', nationality: 'Pakistani', district: 'Battagram', tehsil: 'Allai', address: '', dob: '',
      ddo_code: '', bank_ac_no: '', bank_name: '', branch_name: '', branch_code: '', bank_branch: '', account_type: 'Current', gpf_account_no: '', ppo_no: '', gender: 'Male'
    },
    service_history: {
      date_of_appointment: '', date_of_entry: '', date_of_retirement: '',
      retirement_order_no: '', retirement_order_date: '', lwp_days: 0, lpr_days: 365, leave_taken_days: 0,
      date_of_regularization: '', date_of_death: ''
    },
    financials: {
      basic_pay: 0,
      p_pay: 0, hra: 0, ca: 0, ma: 0, uaa: 0,
      spl_allow_2021: 0, // ✅ FIXED: single source
      teaching_allow: 0, spl_allow_female: 0, spl_allow_disable: 0,
      integrated_allow: 0, charge_allow: 0, wa: 0, dress_allow: 0,
      
      // Adhoc Reliefs
      adhoc_2013: 0, adhoc_2015: 0, adhoc_2022_ps17: 0, dra_2022kp: 0,
      adhoc_2023_35: 0, adhoc_2024_25: 0, adhoc_2025_10: 0, dra_2025_15: 0,

      // New Allowances
      computer_allow: 0, mphil_allow: 0, entertainment_allow: 0,
      science_teaching_allow: 0, weather_allow: 0,

      arrears: {},
      gpf: 0, gpf_sub: 0, gpf_advance: 0, bf: 0, eef: 0, rb_death: 0, adl_g_insurance: 0, 
      group_insurance: 0, income_tax: 0, recovery: 0, edu_rop: 0,
      hba_loan_instal: 0, gpf_loan_instal: 0,
      allowances_extra: {}, deductions_extra: {}
    },
    family_members: [],
    extras: {
      commutation_portion: 35
    },
    createdAt: '',
    updatedAt: ''
  };

  const [formData, setFormData] = useState<EmployeeRecord>(initialFormState);

  // --- Duplicate Detection ---
  const checkDuplicate = (field: 'cnic_no' | 'personal_no', value: string) => {
    if (!value) return;
    const match = employees.find(e => {
      if (e.id === formData.id) return false;
      return e.employees[field] === value.trim();
    });
    
    if (match) {
      setDuplicateWarning(match);
    } else {
      const otherField = field === 'cnic_no' ? 'personal_no' : 'cnic_no';
      const otherVal = formData.employees[otherField];
      const otherMatch = employees.find(e => e.id !== formData.id && e.employees[otherField] === otherVal);
      if (!otherMatch) setDuplicateWarning(null);
    }
  };

  // --- Helpers ---
  const updateDeep = (path: string[], value: any) => {
    setFormData(prev => {
      const next = { ...prev };
      let ptr: any = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (!ptr[path[i]]) ptr[path[i]] = {};
        ptr = ptr[path[i]];
      }
      ptr[path[path.length - 1]] = value;
      return next;
    });

    if (path.includes('cnic_no')) checkDuplicate('cnic_no', value);
    if (path.includes('personal_no')) checkDuplicate('personal_no', value);
  };

  const handleAddNew = () => {
    setFormData({ ...initialFormState, id: Date.now().toString(), createdAt: new Date().toISOString() });
    setDuplicateWarning(null);
    setCustomTehsil(false);
    setActiveTab('master');
    setShowModal(true);
  };

  const handleEdit = (emp: EmployeeRecord) => {
    setFormData(JSON.parse(JSON.stringify(emp)));
    setDuplicateWarning(null);
    const tehsils = DISTRICT_TEHSIL_MAP[emp.employees.district] || [];
    setCustomTehsil(!tehsils.includes(emp.employees.tehsil) && emp.employees.tehsil !== '');
    setActiveTab('master');
    setShowModal(true);
  };

  const handleSwitchToExisting = () => {
    if (duplicateWarning) {
      handleEdit(duplicateWarning);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employees.name || !formData.employees.cnic_no) {
      showToast('Name and CNIC are required', 'error');
      return;
    }
    
    if (duplicateWarning) {
      showToast('Cannot save: Duplicate record exists.', 'error');
      return;
    }
    
    const toSave = {
      ...formData,
      updatedAt: new Date().toISOString()
    };

    if (employees.some(emp => emp.id === toSave.id)) {
      onUpdate(toSave);
      showToast('Employee Updated', 'success');
    } else {
      onAdd(toSave);
      showToast('Employee Created', 'success');
    }
    setShowModal(false);
  };

  // --- Computed Values ---
  const f = formData.financials;
  const { grossPay, totalDeduction, netPay } = calculatePayroll(formData.financials);

  // LPR & Pension Calculations
  const lprDays = formData.service_history.lpr_days ?? 365;
  const lprAmount = Math.round(((f.basic_pay || 0) / 30) * lprDays); // ✅ FIXED: was last_basic_pay

  const isEmployeeActive = formData.employees.status === 'Active';
  const calculationEndDate = isEmployeeActive 
      ? new Date().toISOString() 
      : formData.service_history.date_of_retirement;

  const service = useMemo(() => calculateServiceDuration(
    formData.service_history.date_of_appointment,
    calculationEndDate,
    formData.service_history.lwp_days
  ), [formData.service_history, calculationEndDate]);

  const birthDate = formData.employees.dob ? parseISO(formData.employees.dob) : null;
  const retireDate = calculationEndDate ? parseISO(calculationEndDate) : null;
  
  let ageAtRetirement = 0;
  if (birthDate && retireDate) {
     ageAtRetirement = differenceInYears(retireDate, birthDate);
  }
  const { factor: ageFactor } = resolveAgeFactor(ageAtRetirement);

  let qService = service.years;
  if (service.months >= 6) qService += 1;
  qService = Math.min(qService, 30);

  const calc = calculatePension({
    basicPay: f.basic_pay || 0, // ✅ FIXED: was last_basic_pay
    personalPay: f.p_pay || 0,
    qualifyingServiceYears: qService,
    commutationPortionPercent: formData.extras?.commutation_portion ?? 35,
    ageAtRetirement
  });
  const pensionablePay = calc.pensionablePay;
  const grossPensionCalc = calc.grossPension;
  const commutationPortion = calc.commutationPortion;
  const commAmountCalc = calc.commutationAmount;
  const netPensionCalc = calc.netPension;
  const commLumpSumCalc = calc.commutationLumpSum;
  const monthlyPayablePension = calc.monthlyPayablePension;

  // --- Filtering Logic ---
  const filtered = employees.filter(e => {
    const searchMatch = 
      e.employees.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.employees.cnic_no.includes(searchTerm) ||
      e.employees.personal_no?.includes(searchTerm) ||
      (e.employees.school_full_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    let statusMatch = true;
    if (statusFilter !== 'All') {
      if (statusFilter === 'Retired') {
        statusMatch = INACTIVE_STATUSES.includes(e.employees.status);
      } else {
        statusMatch = e.employees.status === statusFilter;
      }
    }

    let gpfMatch = true;
    if (gpfFilter) {
      gpfMatch = !!(e.employees.gpf_account_no && e.employees.gpf_account_no.trim().length > 0);
    }

    let yearMatch = true;
    if (retiringYearFilter) {
      const rd = e.service_history.date_of_retirement;
      yearMatch = rd ? rd.startsWith(retiringYearFilter) : false;
    }

    return searchMatch && statusMatch && gpfMatch && yearMatch;
  });

  const missingDOBEmployees = employees.filter(e => !e.employees.dob);
  const missingDOBCount = missingDOBEmployees.length;
  
  const isDeceased = isDeceasedStatus(formData.employees.status);
  const isDeathInService = formData.employees.status === 'Death in Service';

  // --- Family Pension Calculations ---
  const familyPensionCalc = useMemo(() => {
    return calculateFamilyPension(
       formData.employees.status,
       f.basic_pay, // ✅ FIXED: was last_basic_pay
       f.p_pay,
       qService,
       ageAtRetirement,
       formData.extras?.commutation_portion
    );
  }, [formData.employees.status, f.basic_pay, f.p_pay, qService, ageAtRetirement, formData.extras?.commutation_portion]);

  const availableTehsils = DISTRICT_TEHSIL_MAP[formData.employees.district] || [];

  // --- Allowance Rules Enforcement ---
  useEffect(() => {
    const f = formData.financials;
    const e = formData.employees;
    const updates: Partial<typeof f> = {};
    let hasChanges = false;

    const stage = (key: keyof typeof f, val: number) => {
      if (f[key] !== val) {
        updates[key] = val as any;
        hasChanges = true;
      }
    };

    const bps = Number(e.bps) || 0;
    const desig = (e.designation || '').toUpperCase();
    const staff = (e.staff_type || '').toLowerCase();
    const gender = e.gender || 'Male';

    // 1. Washing, Dress, Integrated: BPS < 7 only
    if (bps >= 7) {
       if (f.wa > 0) stage('wa', 0);
       if (f.dress_allow > 0) stage('dress_allow', 0);
       if (f.integrated_allow > 0) stage('integrated_allow', 0);
    }

    // 2. Computer Allowance: Use word boundary regex
    const isComputer = /\b(COMPUTER[\s\-_]?OPERATOR|KPO|CO)\b/i.test(desig);
    if (!isComputer && f.computer_allow > 0) {
       stage('computer_allow', 0);
    }

    // 3. Weather Allowance: BPS < 7
    if (bps >= 7 && f.weather_allow > 0) {
       stage('weather_allow', 0);
    }

    // 4. Female Allowance: Female only
    if (gender !== 'Female' && f.spl_allow_female > 0) {
       stage('spl_allow_female', 0);
    }

    // 5. Teaching allowances: teaching staff only
    if (staff !== 'teaching') {
       if (f.science_teaching_allow > 0) stage('science_teaching_allow', 0);
       if (f.teaching_allow > 0) stage('teaching_allow', 0);
    }

    if (hasChanges) {
       setFormData(prev => ({
         ...prev,
         financials: { ...prev.financials, ...(updates as typeof f) }
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
    formData.financials.teaching_allow
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Employees" subtitle="Manage personnel records" action={<div className="hidden lg:block"><Button variant="filled" onClick={handleAddNew} label="Add Employee" icon="add" /></div>} />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto no-scrollbar pb-1">
           <Card variant="filled" className="flex-1 flex items-center gap-4 p-2 rounded-full shadow-sm min-w-[200px]">
             <div className="pl-4 text-on-surface-variant"><AppIcon name="search" /></div>
             <input type="text" placeholder="Search by Name, CNIC, or School..." className="bg-transparent w-full outline-none h-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </Card>

           <div className="flex bg-surface-variant/30 rounded-full p-1 border border-outline-variant/30 min-w-max">
             {['All', 'Active', 'Retired'].map(s => (
               <button 
                 key={s}
                 onClick={() => updateFilter(s)}
                 className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter === s ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'}`}
               >
                 {s}
               </button>
             ))}
           </div>
        </div>

        {(gpfFilter || statusFilter !== 'All' || retiringYearFilter || searchTerm) && (
           <div className="flex items-center gap-2 text-sm text-on-surface-variant flex-wrap">
              <span>Filters:</span>
              {statusFilter !== 'All' && <Badge label={`Status: ${statusFilter}`} color="primary" />}
              {gpfFilter && <Badge label="GPF Subscribers" color="secondary" />}
              {retiringYearFilter && <Badge label={`Retiring: ${retiringYearFilter}`} color="error" />}
              <button onClick={clearFilters} className="text-primary hover:underline text-xs ml-2">Clear All</button>
           </div>
        )}

        {missingDOBCount > 0 && !searchTerm && (
           <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex flex-col gap-2 border border-yellow-200">
              <div className="flex items-center gap-2">
                <AppIcon name="warning" size={18} />
                <span><strong>{missingDOBCount}</strong> employees are missing Date of Birth. Retirement dates cannot be auto-calculated.</span>
              </div>
              <div className="pl-6">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="font-semibold">
                      <th className="text-left pr-2">Personal No</th>
                      <th className="text-left pr-2">Name</th>
                      <th className="text-left">School</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingDOBEmployees.map(emp => (
                      <tr key={emp.id}>
                        <td className="pr-2 font-mono">{emp.employees.personal_no || '-'}</td>
                        <td className="pr-2">{emp.employees.name || '-'}</td>
                        <td>{emp.employees.school_full_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon="group_off" title="No employees found" description="Adjust your filters or add a new record." />
        ) : (
          <>
            <DataTable 
              data={filtered} 
              onRowClick={handleEdit}
              columns={[
                { header: 'Name', accessor: e => <div className="font-bold">{e.employees.name}</div> },
                { header: 'Designation', accessor: e => e.employees.designation },
                { header: 'School', accessor: e => e.employees.school_full_name || '-' },
                { header: 'Status', accessor: e => <Badge label={e.employees.status} color={e.employees.status === 'Active' ? 'success' : 'neutral'} /> },
                { header: 'Retirement Date', accessor: e => e.service_history.date_of_retirement ? formatDate(e.service_history.date_of_retirement, 'dd/MM/yyyy') : '-' },
                { header: 'CNIC', accessor: e => <span className="font-mono text-xs">{e.employees.cnic_no}</span> },
                { header: '', accessor: e => <button onClick={ev => {ev.stopPropagation(); onDelete(e.id)}} className="text-error"><AppIcon name="delete" /></button> }
              ]}
            />
            <div className="md:hidden pb-20 space-y-3">
              {filtered.map(emp => (
                <MobileListCard 
                  key={emp.id} 
                  title={emp.employees.name} 
                  subtitle={[emp.employees.designation, emp.employees.school_full_name].filter(Boolean).join(' • ')} 
                  avatar={emp.employees.name[0]} 
                  onClick={() => handleEdit(emp)} 
                  meta={<><span>{emp.employees.status}</span><span className="font-mono">{emp.employees.personal_no}</span></>} 
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      <FAB onClick={handleAddNew} icon="person_add" />

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-5xl bg-surface-container-low rounded-t-3xl lg:rounded-3xl shadow-elevation-4 flex flex-col h-[100dvh] lg:h-[90vh] overflow-hidden">
            
            <div className="flex-none px-6 py-4 border-b border-outline-variant bg-surface-container flex justify-between items-center">
              <div>
                <h3 className="text-xl text-on-surface">{formData.employees.name || 'New Employee'}</h3>
                <div className="text-xs text-on-surface-variant font-mono">{formData.employees.designation}</div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setShowModal(false)}><AppIcon name="close" /></button>
              </div>
            </div>

            <div className="flex-none border-b border-outline-variant bg-surface-container-low overflow-x-auto no-scrollbar">
              <div className="flex px-2 min-w-max">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={clsx("flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all", activeTab === tab.id ? "border-primary text-primary bg-surface-variant/30" : "border-transparent text-on-surface-variant")}
                  >
                    <AppIcon name={tab.icon} size={18} filled={activeTab === tab.id} />{tab.label}
                  </button>
                ))}
              </div>
            </div>

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

            <div ref={modalScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-container-low">
              <form onSubmit={handleSave} className="space-y-6 pb-20">
                
                {activeTab === 'master' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    <input type="hidden" value={formData.id} />
                    
                    <TextField label="Personnel No" value={formData.employees.personal_no} onChange={e => updateDeep(['employees', 'personal_no'], e.target.value)} />
                    <TextField label="CNIC" value={formData.employees.cnic_no} onChange={e => updateDeep(['employees', 'cnic_no'], e.target.value)} placeholder="12345-1234567-1" required />
                    <TextField label="NTN No" value={formData.employees.ntn_no} onChange={e => updateDeep(['employees', 'ntn_no'], e.target.value)} />
                    
                    <TextField label="Full Name" value={formData.employees.name} onChange={e => updateDeep(['employees', 'name'], e.target.value)} className="md:col-span-2" required />
                    <TextField label="Father Name" value={formData.employees.father_name} onChange={e => updateDeep(['employees', 'father_name'], e.target.value)} />
                    
                    <TextField label="Date of Birth (DD/MM/YYYY)" type="date" value={formData.employees.dob} onChange={e => {
                        updateDeep(['employees', 'dob'], e.target.value);
                        if(e.target.value) {
                           updateDeep(['service_history', 'date_of_retirement'], calculateRetirementDate(e.target.value));
                           updateDeep(['extras', 'retirement_date_source'], 'auto');
                        }
                    }} />
                    
                    <TextField label="Nationality" value={formData.employees.nationality} onChange={e => updateDeep(['employees', 'nationality'], e.target.value)} />
                    <SelectField label="Gender" value={formData.employees.gender || 'Male'} onChange={(e:any) => updateDeep(['employees', 'gender'], e.target.value)}>
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                    </SelectField>
                    <TextField label="Mobile No" value={formData.employees.mobile_no} onChange={e => updateDeep(['employees', 'mobile_no'], e.target.value)} />
                    
                    <TextField label="Address" value={formData.employees.address} onChange={e => updateDeep(['employees', 'address'], e.target.value)} className="md:col-span-2" />
                    
                    <SelectField label="District" value={formData.employees.district} onChange={(e:any) => updateDeep(['employees', 'district'], e.target.value)}>
                       {KPK_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </SelectField>
                    
                    {customTehsil ? (
                       <div className="relative">
                          <TextField label="Tehsil (Manual Entry)" value={formData.employees.tehsil} onChange={e => updateDeep(['employees', 'tehsil'], e.target.value)} />
                          <button type="button" onClick={() => setCustomTehsil(false)} className="absolute right-2 top-2 text-xs text-primary underline">Switch to List</button>
                       </div>
                    ) : (
                       <SelectField label="Tehsil" value={formData.employees.tehsil} onChange={(e:any) => {
                          if(e.target.value === 'OTHER_CUSTOM') {
                             setCustomTehsil(true);
                             updateDeep(['employees', 'tehsil'], '');
                          } else {
                             updateDeep(['employees', 'tehsil'], e.target.value);
                          }
                       }}>
                          {availableTehsils.map(t => <option key={t} value={t}>{t}</option>)}
                          <option value="OTHER_CUSTOM">-- Other / Manual --</option>
                       </SelectField>
                    )}

                    <SelectField label="Status" value={formData.employees.status} onChange={(e:any) => {
                        const newStatus = e.target.value;
                        updateDeep(['employees', 'status'], newStatus);
                    }}>
                       <option value="Active">Active</option>
                       <option value="Superannuation">Superannuation</option>
                       <option value="Premature">Premature</option>
                       <option value="Medical Board">Medical Board</option>
                       <option value="Death in Service">Death in Service</option>
                       <option value="Death after Retirement">Death after Retirement</option>
                       <option value="Compulsory Retire">Compulsory Retire</option>
                       <option value="LPR">LPR</option>
                    </SelectField>
                    
                    <SelectField label="Staff Type" value={formData.employees.staff_type} onChange={(e:any) => updateDeep(['employees', 'staff_type'], e.target.value)}>
                       <option value="teaching">Teaching</option>
                       <option value="non_teaching">Non Teaching</option>
                    </SelectField>
                    
                    <SelectField label="Employment Category" value={formData.employees.employment_category} onChange={(e:any) => updateDeep(['employees', 'employment_category'], e.target.value)}>
                       <option value="Permanent">Permanent</option>
                       <option value="Active Temporary">Active Temporary</option>
                       <option value="Contract">Contract</option>
                    </SelectField>
                  </div>
                )}

                {activeTab === 'posting' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    <TextField label="Designation (Short)" value={formData.employees.designation} onChange={e => updateDeep(['employees', 'designation'], e.target.value)} />
                    <TextField label="Designation (Full)" value={formData.employees.designation_full} onChange={e => updateDeep(['employees', 'designation_full'], e.target.value)} />
                    <TextField label="BPS (Basic Pay Scale)" type="number" value={formData.employees.bps} onChange={e => updateDeep(['employees', 'bps'], Number(e.target.value))} />
                    
                    <TextField label="School / Office Name" value={formData.employees.school_full_name} onChange={e => updateDeep(['employees', 'school_full_name'], e.target.value)} className="md:col-span-2" />
                    <TextField label="Attached Office / Dept" value={formData.employees.office_name} onChange={e => updateDeep(['employees', 'office_name'], e.target.value)} className="md:col-span-2" placeholder="e.g. Office of SDEO (M) Allai" />
                    <TextField label="DDO Code" value={formData.employees.ddo_code} onChange={e => updateDeep(['employees', 'ddo_code'], e.target.value)} />
                    
                    <div className="md:col-span-2 border-t border-outline-variant my-4 pt-4">
                       <h4 className="font-bold text-sm text-on-surface-variant mb-4">Service History Dates</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextField 
                            label="Date of Birth" 
                            type="date" 
                            value={formData.employees.dob} 
                            onChange={e => {
                                updateDeep(['employees', 'dob'], e.target.value);
                                if(e.target.value) {
                                   updateDeep(['service_history', 'date_of_retirement'], calculateRetirementDate(e.target.value));
                                   updateDeep(['extras', 'retirement_date_source'], 'auto');
                                }
                            }} 
                          />
                          <TextField label="First Appointment" type="date" value={formData.service_history.date_of_appointment} onChange={e => updateDeep(['service_history', 'date_of_appointment'], e.target.value)} />
                          <TextField label="Entry into Govt Service" type="date" value={formData.service_history.date_of_entry} onChange={e => updateDeep(['service_history', 'date_of_entry'], e.target.value)} />
                          <TextField label="Retirement Date" type="date" value={formData.service_history.date_of_retirement} onChange={e => {
                              updateDeep(['service_history', 'date_of_retirement'], e.target.value);
                              updateDeep(['extras', 'retirement_date_source'], 'manual');
                          }} />
                          {isDeceased && (
                            <TextField 
                              label="Date of Death" 
                              type="date" 
                              value={formData.service_history.date_of_death || ''} 
                              onChange={e => updateDeep(['service_history', 'date_of_death'], e.target.value)} 
                            />
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

                {activeTab === 'financial' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    <TextField label="Bank Name" value={formData.employees.bank_name} onChange={e => updateDeep(['employees', 'bank_name'], e.target.value)} />
                    <TextField label="Branch Name" value={formData.employees.branch_name} onChange={e => updateDeep(['employees', 'branch_name'], e.target.value)} />
                    <TextField label="Branch Code" value={formData.employees.branch_code} onChange={e => updateDeep(['employees', 'branch_code'], e.target.value)} />
                    <TextField label="Account No" value={formData.employees.bank_ac_no} onChange={e => updateDeep(['employees', 'bank_ac_no'], e.target.value)} />
                    <SelectField label="Account Type" value={formData.employees.account_type} onChange={(e:any) => updateDeep(['employees', 'account_type'], e.target.value)}>
                       <option value="PLS">PLS</option>
                       <option value="Current">Current</option>
                    </SelectField>
                    
                    <div className="md:col-span-2 border-t border-outline-variant my-4 pt-4">
                       <h4 className="font-bold text-sm text-on-surface-variant mb-4">Fund Accounts</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextField label="GPF Account No" value={formData.employees.gpf_account_no} onChange={e => updateDeep(['employees', 'gpf_account_no'], e.target.value)} />
                          <TextField label="PPO No (If Retired)" value={formData.employees.ppo_no} onChange={e => updateDeep(['employees', 'ppo_no'], e.target.value)} />
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'payroll' && (
                  <div className="space-y-6 animate-in fade-in">
                    <Card variant="filled" className="bg-primary-container/20 border border-primary/20 p-6 flex items-center justify-between">
                       <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Gross Salary (LPC Entitlement)</div>
                       <div className="text-3xl font-bold font-mono text-primary">{formatCurrency(grossPay)}</div>
                    </Card>

                    <div className="bg-surface p-4 rounded-xl border border-outline-variant">
                       <h4 className="font-bold text-sm uppercase mb-4 text-primary">Pay & Regular Allowances</h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* ✅ FIXED: Changed to basic_pay */}
                          <TextField label="Basic Pay" type="number" value={formData.financials.basic_pay} onChange={e => updateDeep(['financials', 'basic_pay'], Number(e.target.value))} />
                          <TextField label="Personal Pay (PP)" type="number" value={formData.financials.p_pay} onChange={e => updateDeep(['financials', 'p_pay'], Number(e.target.value))} />
                          <TextField label="House Rent (HRA)" type="number" value={formData.financials.hra} onChange={e => updateDeep(['financials', 'hra'], Number(e.target.value))} />
                          <TextField label="Conveyance (CA)" type="number" value={formData.financials.ca} onChange={e => updateDeep(['financials', 'ca'], Number(e.target.value))} />
                          <TextField label="Medical (MA)" type="number" value={formData.financials.ma} onChange={e => updateDeep(['financials', 'ma'], Number(e.target.value))} />
                          <TextField label="U.A.A Allowance" type="number" value={formData.financials.uaa} onChange={e => updateDeep(['financials', 'uaa'], Number(e.target.value))} />
                          
                          <TextField label="Washing Allow" type="number" value={formData.financials.wa} onChange={e => updateDeep(['financials', 'wa'], Number(e.target.value))} />
                          <TextField label="Dress Allow" type="number" value={formData.financials.dress_allow} onChange={e => updateDeep(['financials', 'dress_allow'], Number(e.target.value))} />
                          <TextField label="Integrated Allow" type="number" value={formData.financials.integrated_allow} onChange={e => updateDeep(['financials', 'integrated_allow'], Number(e.target.value))} />
                          
                          <TextField label="Teaching Allow" type="number" value={formData.financials.teaching_allow} onChange={e => updateDeep(['financials', 'teaching_allow'], Number(e.target.value))} />
                          <TextField label="Science Teaching Allow" type="number" value={formData.financials.science_teaching_allow} onChange={e => updateDeep(['financials', 'science_teaching_allow'], Number(e.target.value))} />
                          <TextField label="M.Phil Allowance" type="number" value={formData.financials.mphil_allow} onChange={e => updateDeep(['financials', 'mphil_allow'], Number(e.target.value))} />
                          
                          <TextField label="Charge Allow" type="number" value={formData.financials.charge_allow} onChange={e => updateDeep(['financials', 'charge_allow'], Number(e.target.value))} />
                          <TextField label="Computer Allow" type="number" value={formData.financials.computer_allow} onChange={e => updateDeep(['financials', 'computer_allow'], Number(e.target.value))} />
                          <TextField label="Entertainment Allow" type="number" value={formData.financials.entertainment_allow} onChange={e => updateDeep(['financials', 'entertainment_allow'], Number(e.target.value))} />
                          
                          <TextField label="Weather Allow" type="number" value={formData.financials.weather_allow} onChange={e => updateDeep(['financials', 'weather_allow'], Number(e.target.value))} />
                          {/* ✅ FIXED: Single field for special allowance */}
                          <TextField label="Special Allow 2021" type="number" value={formData.financials.spl_allow_2021} onChange={e => updateDeep(['financials', 'spl_allow_2021'], Number(e.target.value))} />
                          <TextField label="Special Allow (Female)" type="number" value={formData.financials.spl_allow_female} onChange={e => updateDeep(['financials', 'spl_allow_female'], Number(e.target.value))} />
                          <TextField label="Special Allow (Disable)" type="number" value={formData.financials.spl_allow_disable} onChange={e => updateDeep(['financials', 'spl_allow_disable'], Number(e.target.value))} />
                       </div>
                    </div>

                    <div className="bg-surface p-4 rounded-xl border border-outline-variant">
                       <h4 className="font-bold text-sm uppercase mb-4 text-primary">Adhoc Reliefs</h4>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <TextField label="Adhoc 2013 (10%)" type="number" value={formData.financials.adhoc_2013} onChange={e => updateDeep(['financials', 'adhoc_2013'], Number(e.target.value))} />
                          <TextField label="Adhoc 2015" type="number" value={formData.financials.adhoc_2015} onChange={e => updateDeep(['financials', 'adhoc_2015'], Number(e.target.value))} />
                          
                          <TextField label="Adhoc 2022 (15%)" type="number" value={formData.financials.adhoc_2022_ps17} onChange={e => updateDeep(['financials', 'adhoc_2022_ps17'], Number(e.target.value))} />
                          <TextField label="DRA 2022 (15%)" type="number" value={formData.financials.dra_2022kp} onChange={e => updateDeep(['financials', 'dra_2022kp'], Number(e.target.value))} />
                          <TextField label="Adhoc 2023 (35%)" type="number" value={formData.financials.adhoc_2023_35} onChange={e => updateDeep(['financials', 'adhoc_2023_35'], Number(e.target.value))} />
                          <TextField label="Adhoc 2024 (25%)" type="number" value={formData.financials.adhoc_2024_25} onChange={e => updateDeep(['financials', 'adhoc_2024_25'], Number(e.target.value))} />
                          <TextField label="Adhoc 2025 (10%)" type="number" value={formData.financials.adhoc_2025_10} onChange={e => updateDeep(['financials', 'adhoc_2025_10'], Number(e.target.value))} />
                          <TextField label="DRA 2025 (15%)" type="number" value={formData.financials.dra_2025_15} onChange={e => updateDeep(['financials', 'dra_2025_15'], Number(e.target.value))} />
                       </div>
                    </div>

                    <DynamicMapEditor 
                       title="Other / Custom Allowances" 
                       map={formData.financials.allowances_extra || {}} 
                       onChange={(newMap) => updateDeep(['financials', 'allowances_extra'], newMap)} 
                    />
                  </div>
                )}

                {activeTab === 'deductions' && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-4">
                       <Card variant="filled" className="bg-error-container text-on-error-container text-center py-4">
                          <div className="text-xs uppercase font-bold opacity-80">Total Deductions</div>
                          <div className="text-2xl font-bold">{formatCurrency(totalDeduction)}</div>
                       </Card>
                       <Card variant="filled" className="bg-primary-container text-on-primary-container text-center py-4">
                          <div className="text-xs uppercase font-bold opacity-80">Net Pay</div>
                          <div className="text-2xl font-bold">{formatCurrency(netPay)}</div>
                       </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <TextField label="GP Fund Sub" type="number" value={formData.financials.gpf} onChange={e => updateDeep(['financials', 'gpf'], Number(e.target.value))} />
                       <TextField label="Benevolent Fund" type="number" value={formData.financials.bf} onChange={e => updateDeep(['financials', 'bf'], Number(e.target.value))} />
                       <TextField label="Group Insurance" type="number" value={formData.financials.group_insurance} onChange={e => updateDeep(['financials', 'group_insurance'], Number(e.target.value))} />
                       <TextField label="R.B & Death" type="number" value={formData.financials.rb_death} onChange={e => updateDeep(['financials', 'rb_death'], Number(e.target.value))} />
                       <TextField label="Income Tax" type="number" value={formData.financials.income_tax} onChange={e => updateDeep(['financials', 'income_tax'], Number(e.target.value))} />
                       <TextField label="E.E.F" type="number" value={formData.financials.eef} onChange={e => updateDeep(['financials', 'eef'], Number(e.target.value))} />
                    </div>

                    <DynamicMapEditor 
                       title="Other / Custom Deductions" 
                       map={formData.financials.deductions_extra || {}} 
                       onChange={(newMap) => updateDeep(['financials', 'deductions_extra'], newMap)} 
                    />
                  </div>
                )}

                {activeTab === 'loans' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                     <TextField label="GPF Advance Recovery" type="number" value={formData.financials.gpf_loan_instal} onChange={e => updateDeep(['financials', 'gpf_loan_instal'], Number(e.target.value))} />
                     <TextField label="HBA Loan Installment" type="number" value={formData.financials.hba_loan_instal} onChange={e => updateDeep(['financials', 'hba_loan_instal'], Number(e.target.value))} />
                     <TextField label="Other Recovery" type="number" value={formData.financials.recovery} onChange={e => updateDeep(['financials', 'recovery'], Number(e.target.value))} />
                  </div>
                )}

                {activeTab === 'pension' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                     <TextField label="LWP Days (Leave Without Pay)" type="number" value={formData.service_history.lwp_days} onChange={e => updateDeep(['service_history', 'lwp_days'], Number(e.target.value))} />
                     <TextField label="Leaves Taken (For Account)" type="number" value={formData.service_history.leave_taken_days} onChange={e => updateDeep(['service_history', 'leave_taken_days'], Number(e.target.value))} />
                     
                     <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-surface-variant/30 rounded-lg">
                        <TextField label="LPR Days (Encashment)" type="number" value={formData.service_history.lpr_days ?? 365} onChange={e => updateDeep(['service_history', 'lpr_days'], Number(e.target.value))} />
                        
                        <TextField 
                           label="Commutation Portion (%)" 
                           type="number" 
                           value={formData.extras?.commutation_portion ?? 35} 
                           onChange={e => updateDeep(['extras', 'commutation_portion'], Number(e.target.value))} 
                           placeholder="35"
                        />
                        
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
                                    label={isEmployeeActive ? "Calculated Till Date (Active)" : "Calculated at Retirement"} 
                                    color={isEmployeeActive ? "secondary" : "neutral"} 
                                 />
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                 <div className="col-span-2 md:col-span-1">
                                    <div className="text-xs text-on-surface-variant uppercase">Qualifying Service</div>
                                    <div className="font-bold text-lg">{qService} Years <span className="text-xs font-normal text-on-surface-variant">(Max 30)</span></div>
                                 </div>
                                 
                                 <div>
                                    <div className="text-xs text-on-surface-variant uppercase">Gross Pension</div>
                                    <div className="font-bold text-lg">{formatCurrency(grossPensionCalc)}</div>
                                 </div>
                                 <div>
                                    <div className="text-xs text-on-surface-variant uppercase text-success">Net Pension ({100 - (formData.extras?.commutation_portion ?? 35)}%)</div>
                                    <div className="font-bold text-lg text-success">{formatCurrency(netPensionCalc)}</div>
                                 </div>

                                 <div className="col-span-2 md:col-span-3 p-3 bg-primary-container/20 border border-primary/30 rounded-lg flex flex-col md:flex-row justify-between items-center gap-2">
                                    <div>
                                       <div className="text-xs font-bold text-primary uppercase">Monthly Payable Pension</div>
                                       <div className="text-[10px] text-on-surface-variant">(Net + Adhoc Reliefs 2022-2025 + Medical Allowances)</div>
                                    </div>
                                    <div className="text-2xl font-bold font-mono text-primary">
                                       {formatCurrency(monthlyPayablePension)}
                                    </div>
                                 </div>

                                 <div className="col-span-2 md:col-span-3 mt-2 p-3 bg-secondary-container/20 rounded-lg flex justify-between items-center border border-secondary-container">
                                    <div>
                                       <div className="text-xs font-bold text-secondary uppercase">Commutation ({formData.extras?.commutation_portion ?? 35}%)</div>
                                       <div className="text-xs opacity-70">Gross × {commutationPortion.toFixed(2)} × 12 × {ageFactor}</div>
                                    </div>
                                    <div className="text-xl font-bold font-mono text-secondary">
                                       {formatCurrency(commLumpSumCalc)}
                                    </div>
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
                                    label={isDeathInService ? "Death in Service" : "Death after Retirement"} 
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
                                       {isDeathInService ? "(Last Pay × Service × 7) / 300" : "50% of Last Pay"}
                                    </div>
                                 </div>

                                 <div>
                                     <div className="text-xs text-on-surface-variant uppercase">Commuted / Surrendered ({familyPensionCalc.commutedPortion}%)</div>
                                     <div className="font-bold text-lg text-error">{formatCurrency(familyPensionCalc.surrenderedPortion)}</div>
                                 </div>

                                 <div>
                                    <div className="text-xs text-on-surface-variant uppercase text-success">Net Pension</div>
                                    <div className="font-bold text-lg text-success">{formatCurrency(familyPensionCalc.netPension)}</div>
                                    <div className="text-[10px] text-on-surface-variant">Gross - Surrendered</div>
                                 </div>

                                 <div className="col-span-2 md:col-span-3 p-3 bg-error-container/20 border border-error/30 rounded-lg flex flex-col justify-between items-start gap-2">
                                    <div className="flex justify-between w-full">
                                        <div>
                                            <div className="text-xs font-bold text-error uppercase">Monthly Family Pension</div>
                                            <div className="text-[10px] text-on-surface-variant">(Net + Adhoc Reliefs + Medical Allowances)</div>
                                        </div>
                                        <div className="text-2xl font-bold font-mono text-error">
                                            {formatCurrency(familyPensionCalc.netFamilyPension)}
                                        </div>
                                    </div>
                                    
                                    <div className="w-full mt-2 pt-2 border-t border-error/20 text-xs space-y-1">
                                       <div className="flex justify-between opacity-70">
                                          <span>Family Pension Base (75% of Net / 50% Gross)</span>
                                          <span>{formatCurrency(familyPensionCalc.familyPensionBase)}</span>
                                       </div>
                                       {familyPensionCalc.increases.length > 0 && (
                                           <div className="flex justify-between opacity-70">
                                              <span>Adhoc Reliefs (2010-2025)</span>
                                              <span>+{formatCurrency(familyPensionCalc.increases[familyPensionCalc.increases.length-1].runningTotal - familyPensionCalc.familyPensionBase)}</span>
                                           </div>
                                       )}
                                       <div className="flex justify-between opacity-70">
                                          <span>Medical Allowance (2010 + Increase)</span>
                                          <span>+{formatCurrency(familyPensionCalc.medicalAllowance2010 + familyPensionCalc.medicalAllowanceIncrease)}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="md:col-span-2 border-t border-outline-variant pt-4 mt-2">
                        <h4 className="font-bold text-sm mb-2">Pension Order Info</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <TextField label="Retirement Order No" value={formData.service_history.retirement_order_no} onChange={e => updateDeep(['service_history', 'retirement_order_no'], e.target.value)} />
                           <TextField label="Order Date" type="date" value={formData.service_history.retirement_order_date} onChange={e => updateDeep(['service_history', 'retirement_order_date'], e.target.value)} />
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === 'family' && (
                  <div className="animate-in fade-in">
                     {isDeceased && (
                       <div className="mb-6 p-4 border border-error bg-error-container/10 rounded-xl">
                          <h4 className="font-bold text-error mb-4 flex items-center gap-2">
                             <AppIcon name="diversity_3" /> Family Pension Beneficiary (Widow/Heir)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <TextField label="Beneficiary Name" value={formData.extras.beneficiary?.name || ''} onChange={e => updateDeep(['extras', 'beneficiary', 'name'], e.target.value)} />
                             <SelectField label="Relation" value={formData.extras.beneficiary?.relation || ''} onChange={(e:any) => updateDeep(['extras', 'beneficiary', 'relation'], e.target.value)}>
                                <option value="">Select Relation</option>
                                <option value="Widow">Widow</option>
                                <option value="Widower">Widower</option>
                                <option value="Son">Son</option>
                                <option value="Daughter">Daughter</option>
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                             </SelectField>
                             <TextField label="Beneficiary Age" value={formData.extras.beneficiary?.age || ''} onChange={e => updateDeep(['extras', 'beneficiary', 'age'], e.target.value)} />
                             <TextField label="Beneficiary CNIC" value={formData.extras.beneficiary?.cnic || ''} onChange={e => updateDeep(['extras', 'beneficiary', 'cnic'], e.target.value)} />
                             <TextField label="Bank Name" value={formData.extras.beneficiary?.bank_name || ''} onChange={e => updateDeep(['extras', 'beneficiary', 'bank_name'], e.target.value)} />
                             <TextField label="Branch Name" value={formData.extras.beneficiary?.branch_name || ''} onChange={e => updateDeep(['extras', 'beneficiary', 'branch_name'], e.target.value)} />
                             <TextField label="Account No" value={formData.extras.beneficiary?.account_no || ''} onChange={e => updateDeep(['extras', 'beneficiary', 'account_no'], e.target.value)} />
                          </div>
                       </div>
                     )}

                     <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold">Family Members</h4>
                        <Button type="button" variant="tonal" icon="add" label="Add Member" onClick={() => {
                           const newMember: OfficialFamilyMember = {
                              id: Date.now().toString(),
                              relative_name: '',
                              relation: 'Wife',
                              cnic: '',
                              age: ''
                           };
                           setFormData(prev => ({...prev, family_members: [...prev.family_members, newMember]}));
                        }} />
                     </div>
                     <div className="space-y-4">
                        {formData.family_members.length === 0 && <div className="text-center text-on-surface-variant p-4">No family members added.</div>}
                        {formData.family_members.map((fm, idx) => (
                           <div key={fm.id} className="p-4 border border-outline-variant rounded-xl bg-surface relative group">
                              <button type="button" className="absolute top-2 right-2 text-error p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                 onClick={() => {
                                    const next = [...formData.family_members];
                                    next.splice(idx, 1);
                                    setFormData(prev => ({...prev, family_members: next}));
                                 }}
                              >
                                 <AppIcon name="delete" />
                              </button>
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                 <TextField label="Name" value={fm.relative_name} onChange={e => {
                                    const next = [...formData.family_members];
                                    next[idx].relative_name = e.target.value;
                                    setFormData(prev => ({...prev, family_members: next}));
                                 }} />
                                 <SelectField label="Relation" value={fm.relation} onChange={(e: any) => {
                                    const next = [...formData.family_members];
                                    next[idx].relation = e.target.value;
                                    setFormData(prev => ({...prev, family_members: next}));
                                 }}>
                                    <option value="Wife">Wife</option>
                                    <option value="Husband">Husband</option>
                                    <option value="Son">Son</option>
                                    <option value="Daughter">Daughter</option>
                                    <option value="Father">Father</option>
                                    <option value="Mother">Mother</option>
                                 </SelectField>
                                 <TextField label="Age" value={fm.age} onChange={e => {
                                    const next = [...formData.family_members];
                                    next[idx].age = e.target.value;
                                    setFormData(prev => ({...prev, family_members: next}));
                                 }} />
                                 <SelectField label="Marital Status" value={fm.marital_status || ''} onChange={(e:any) => {
                                    const next = [...formData.family_members];
                                    next[idx].marital_status = e.target.value;
                                    setFormData(prev => ({...prev, family_members: next}));
                                 }}>
                                    <option value="">Select</option>
                                    <option value="Married">Married</option>
                                    <option value="Unmarried">Unmarried</option>
                                    <option value="Widow">Widow</option>
                                 </SelectField>
                                 <TextField label="CNIC" value={fm.cnic} onChange={e => {
                                    const next = [...formData.family_members];
                                    next[idx].cnic = e.target.value;
                                    setFormData(prev => ({...prev, family_members: next}));
                                 }} />
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

              </form>
            </div>

            <div className="flex-none p-4 border-t border-outline-variant bg-surface-container flex justify-end gap-2">
              <Button variant="text" label="Cancel" onClick={() => setShowModal(false)} />
              <Button variant="filled" label="Save Employee" onClick={handleSave} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};