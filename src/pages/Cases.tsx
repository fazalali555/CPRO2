
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { CaseRecord, EmployeeRecord } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, FAB, EmptyState, Badge } from '../components/M3';
import { DataTable } from '../components/DataTable';
import { MobileListCard } from '../components/MobileListCard';
import { AppIcon } from '../components/AppIcon';

import { useEmployeeContext } from '../contexts/EmployeeContext';

const statusColors: Record<string, "neutral" | "primary" | "secondary" | "success" | "error"> = {
  draft: 'neutral',
  in_progress: 'primary',
  submitted: 'secondary',
  completed: 'success',
  returned: 'error'
};

const typeLabels: Record<string, string> = {
  retirement: 'Retirement',
  pension: 'Pension',
  gpf_refundable: 'GPF Refundable',
  gpf_non_refundable: 'GPF Non-Ref',
  gpf_final: 'GPF Final',
  lpr: 'LPR',
  eef: 'EEF',
  benevolent_fund: 'Benevolent Fund',
  rbdc: 'RBDC',
  payroll: 'Payroll',
  other: 'General'
};

export const Cases: React.FC = () => {
  const { cases, employees, deleteCase: onDeleteCase } = useEmployeeContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const priorityColors: Record<string, "error" | "secondary" | "primary" | "neutral"> = {
    urgent: 'error',
    high: 'secondary',
    medium: 'primary',
    low: 'neutral'
  };

  // Sync state with URL
  useEffect(() => {
    setStatusFilter(searchParams.get('status') || 'all');
  }, [searchParams]);

  const updateStatusFilter = (s: string) => {
    setStatusFilter(s);
    const newParams = new URLSearchParams(searchParams);
    if (s === 'all') newParams.delete('status');
    else newParams.set('status', s);
    setSearchParams(newParams);
  };

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const filteredCases = cases.filter(c => {
    const emp = getEmployee(c.employee_id);
    const empName = emp?.employees.name || '';
    const personnelNo = emp?.employees.personal_no || '';
    const cnic = emp?.employees.cnic_no || '';
    
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        personnelNo.includes(searchTerm) ||
                        cnic.includes(searchTerm);
    
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchType = typeFilter === 'all' || c.case_type === typeFilter;
    const matchPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    
    return matchSearch && matchStatus && matchType && matchPriority;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setPriorityFilter('all');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader 
        title="Cases Management" 
        subtitle="Track pension, GPF, and inquiry workflows"
        action={<div className="hidden lg:block"><Button variant="filled" label="New Case" icon="add" onClick={() => navigate('/cases/new')} /></div>}
      />

      <div className="space-y-4">
        {/* Advanced Filters */}
        <div className="flex flex-col gap-3">
           <div className="flex flex-col md:flex-row gap-3">
             <Card variant="filled" className="flex-1 flex items-center gap-4 p-2 rounded-xl shadow-sm">
               <div className="pl-4 text-on-surface-variant"><AppIcon name="search" /></div>
               <input 
                 type="text" 
                 placeholder="Search by Title, Name, Personnel No, CNIC..." 
                 className="bg-transparent w-full outline-none h-10 text-sm" 
                 value={searchTerm} 
                 onChange={e => setSearchTerm(e.target.value)} 
               />
               {searchTerm && (
                 <button onClick={() => setSearchTerm('')} className="pr-4 text-on-surface-variant hover:text-on-surface">
                   <AppIcon name="close" size={18} />
                 </button>
               )}
             </Card>

             <div className="flex gap-2">
               <select 
                 className="bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                 value={typeFilter}
                 onChange={e => setTypeFilter(e.target.value)}
               >
                 <option value="all">All Types</option>
                 {Object.entries(typeLabels).map(([val, label]) => (
                   <option key={val} value={val}>{label}</option>
                 ))}
               </select>

               <select 
                 className="bg-surface-variant/30 border border-outline-variant/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                 value={priorityFilter}
                 onChange={e => setPriorityFilter(e.target.value)}
               >
                 <option value="all">All Priorities</option>
                 <option value="urgent">Urgent</option>
                 <option value="high">High</option>
                 <option value="medium">Medium</option>
                 <option value="low">Low</option>
               </select>

               {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all') && (
                 <Button variant="text" label="Clear" icon="filter_alt_off" onClick={clearFilters} className="h-10 text-xs" />
               )}
             </div>
           </div>
           
           <div className="flex bg-surface-variant/20 rounded-xl p-1 border border-outline-variant/20 overflow-x-auto no-scrollbar">
             {['all', 'draft', 'in_progress', 'submitted', 'returned', 'completed'].map(s => (
               <button 
                 key={s}
                 onClick={() => updateStatusFilter(s)}
                 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'}`}
               >
                 {s === 'all' ? 'ALL STATUSES' : s.replace('_', ' ').toUpperCase()}
               </button>
             ))}
           </div>
        </div>

        {filteredCases.length === 0 ? (
          <EmptyState 
            icon="folder_open"
            title="No Cases Found"
            description={searchTerm || statusFilter !== 'all' ? "Try adjusting your search filters" : "Start a new case workflow to track progress."}
            action={(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all') ? (
              <Button variant="tonal" label="Clear All Filters" onClick={clearFilters} />
            ) : (
              <Button variant="tonal" label="Create First Case" onClick={() => navigate('/cases/new')} />
            )}
          />
        ) : (
          <>
            <DataTable<CaseRecord> 
              data={filteredCases} 
              onRowClick={(c) => navigate(`/cases/${c.id}`)}
              columns={[
                { header: 'Title', accessor: c => (
                  <div className="flex flex-col">
                    <div className="font-bold text-on-surface">{c.title}</div>
                    <div className="text-[10px] text-on-surface-variant font-mono">ID: {c.id}</div>
                  </div>
                )},
                { header: 'Type', accessor: c => <Badge label={typeLabels[c.case_type] || c.case_type} /> },
                { header: 'Employee', accessor: c => {
                  const emp = getEmployee(c.employee_id);
                  return (
                    <div className="flex flex-col">
                      <div className="font-medium">{emp?.employees.name || 'Unknown'}</div>
                      <div className="text-[10px] text-on-surface-variant">{emp?.employees.personal_no || 'No Personnel No'}</div>
                    </div>
                  );
                }},
                { header: 'Priority', accessor: c => (
                  <Badge 
                    label={c.priority?.toUpperCase() || 'MEDIUM'} 
                    color={priorityColors[c.priority || 'medium']} 
                    variant="tonal"
                  />
                )},
                { header: 'Deadline', accessor: c => {
                  if (!c.deadline) return <span className="text-on-surface-variant/40 italic">-</span>;
                  const isOverdue = new Date(c.deadline) < new Date() && c.status !== 'completed';
                  return (
                    <div className={clsx("flex items-center gap-1", isOverdue ? "text-error font-bold" : "text-on-surface-variant")}>
                      {isOverdue && <AppIcon name="warning" size={14} />}
                      {new Date(c.deadline).toLocaleDateString()}
                    </div>
                  );
                }},
                { header: 'Status', accessor: c => <Badge label={c.status.replace('_', ' ')} color={statusColors[c.status]} /> },
              ]}
            />
            
            <div className="md:hidden pb-20 space-y-3">
              {filteredCases.map(c => {
                const emp = getEmployee(c.employee_id);
                const isOverdue = c.deadline && new Date(c.deadline) < new Date() && c.status !== 'completed';
                return (
                  <MobileListCard 
                    key={c.id} 
                    title={c.title} 
                    subtitle={`${emp?.employees.name || 'Unknown'} • ${typeLabels[c.case_type] || c.case_type}`}
                    avatar={<AppIcon name={isOverdue ? "warning" : "folder"} className={isOverdue ? "text-error" : ""} />} 
                    onClick={() => navigate(`/cases/${c.id}`)}
                    meta={
                      <div className="flex flex-col items-end gap-1">
                        <Badge label={c.status.replace('_', ' ')} color={statusColors[c.status]} />
                        <div className="flex gap-1">
                          <Badge label={c.priority?.toUpperCase() || 'MEDIUM'} color={priorityColors[c.priority || 'medium']} variant="tonal" className="scale-75 origin-right" />
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      <FAB icon="add" onClick={() => navigate('/cases/new')} />
    </div>
  );
};
