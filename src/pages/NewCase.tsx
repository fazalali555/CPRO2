
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaseRecord, EmployeeRecord, CaseType, CURRENT_CASE_SCHEMA_VERSION } from '../types';
import { getDefaultChecklist } from '../utils';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, TextField } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { useToast } from '../contexts/ToastContext';

import { useEmployeeContext } from '../contexts/EmployeeContext';

const CASE_TYPES: { id: CaseType; label: string; icon: string }[] = [
  { id: 'retirement', label: 'Retirement', icon: 'elderly' },
  { id: 'pension', label: 'Pension', icon: 'payments' },
  { id: 'gpf_refundable', label: 'GPF Refundable', icon: 'currency_exchange' },
  { id: 'gpf_non_refundable', label: 'GPF Non-Ref', icon: 'money_off' },
  { id: 'gpf_final', label: 'GPF Final', icon: 'savings' },
  { id: 'lpr', label: 'LPR Encashment', icon: 'event_busy' },
  { id: 'benevolent_fund', label: 'B.F (Benevolent Fund)', icon: 'volunteer_activism' },
  { id: 'rbdc', label: 'RB&DC', icon: 'diversity_1' },
  { id: 'eef', label: 'E.E.F (Employee Education Foundation)', icon: 'school' },
  { id: 'financial_assistance', label: 'Financial Assistance', icon: 'health_and_safety' },
  { id: 'payroll', label: 'Payroll / Salary Change', icon: 'receipt_long' },
  { id: 'other', label: 'General Inquiry', icon: 'help_center' },
];

export const NewCase: React.FC = () => {
  const { employees, addCase: onAddCase } = useEmployeeContext();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedType, setSelectedType] = useState<CaseType | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [deadline, setDeadline] = useState('');
  const [search, setSearch] = useState('');

  const filteredEmployees = employees.filter(e => 
    e.employees.name.toLowerCase().includes(search.toLowerCase()) || 
    e.employees.cnic_no.includes(search) || 
    e.employees.personal_no.includes(search) ||
    (e.employees.school_full_name || '').toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const handleCreate = () => {
    if (!selectedEmpId || !selectedType) return;
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    const newCase: CaseRecord = {
      id: Date.now().toString(),
      schemaVersion: CURRENT_CASE_SCHEMA_VERSION,
      employee_id: selectedEmpId,
      case_type: selectedType,
      status: 'draft',
      priority: priority,
      deadline: deadline || undefined,
      title: `${CASE_TYPES.find(t => t.id === selectedType)?.label} Case - ${emp.employees.name}`,
      checklist: getDefaultChecklist(selectedType),
      documents: [],
      notes: [],
      auditLog: [],
      extras: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onAddCase(newCase);
    showToast('Case created successfully', 'success');
    navigate(`/cases/${newCase.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <PageHeader title="Start New Case" subtitle={`Step ${step} of 2`} />

      {step === 1 && (
        <Card variant="outlined" className="p-6 bg-surface-container-low min-h-[400px]">
          <h3 className="text-lg font-bold mb-4">Select Employee</h3>
          <div className="relative mb-6">
            <TextField label="Search Employee" icon="search" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            {filteredEmployees.map(emp => (
              <button 
                key={emp.id}
                onClick={() => { setSelectedEmpId(emp.id); setStep(2); }}
                className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface-variant/50 border border-transparent hover:border-outline-variant transition-all text-left"
              >
                <div>
                  <div className="font-bold text-on-surface">{emp.employees.name}</div>
                  <div className="text-sm text-on-surface-variant">{[emp.employees.designation, emp.employees.school_full_name].filter(Boolean).join(' • ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs bg-surface-variant px-2 py-1 rounded">{emp.employees.personal_no || 'No Personnel #'}</div>
                </div>
              </button>
            ))}
            {filteredEmployees.length === 0 && search && (
              <div className="text-center py-8 text-on-surface-variant">No employees found matching "{search}"</div>
            )}
            {employees.length === 0 && (
               <div className="text-center py-8 text-on-surface-variant">No employees in system. Please add an employee first.</div>
            )}
          </div>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card variant="outlined" className="p-6 bg-surface-container-low">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold">Select Case Type</h3>
               <button onClick={() => setStep(1)} className="text-sm text-primary hover:underline">Change Employee</button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
               {CASE_TYPES.map(t => (
                 <button
                   key={t.id}
                   onClick={() => setSelectedType(t.id)}
                   className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedType === t.id ? 'border-primary bg-primary-container/30' : 'border-transparent bg-surface hover:bg-surface-variant/50'}`}
                 >
                   <div className={`p-3 rounded-full ${selectedType === t.id ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface-variant'}`}>
                     <AppIcon name={t.icon} />
                   </div>
                   <span className="text-sm font-medium text-center leading-tight">{t.label}</span>
                 </button>
               ))}
             </div>
          </Card>

          <Card variant="outlined" className="p-6 bg-surface-container-low">
            <h3 className="text-lg font-bold mb-4">Tracking & Priority</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-primary uppercase mb-2">Priority Level</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 px-1 rounded-lg border text-xs font-bold transition-all capitalize ${priority === p ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-variant/30'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <TextField 
                  label="Deadline (Optional)" 
                  type="date" 
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)} 
                  className="w-full"
                />
                <p className="text-[10px] text-on-surface-variant mt-1 italic px-1">Sets the target date for case completion.</p>
              </div>
            </div>
          </Card>
          
          <div className="flex justify-end">
            <Button variant="filled" label="Create Case" icon="check" disabled={!selectedType} onClick={handleCreate} />
          </div>
        </div>
      )}
    </div>
  );
};
