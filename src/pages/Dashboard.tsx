
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../types';
import { AppIcon } from '../components/AppIcon';
import { Card, Button, EmptyState, TextField } from '../components/M3';
import { format, isAfter, isBefore, addDays, isValid } from 'date-fns';
import { auditService } from '../services/SecurityService';

import { useEmployeeContext } from '../contexts/EmployeeContext';

const Dashboard: React.FC = () => {
  const { employees, cases } = useEmployeeContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 1. Computed Statistics
  const totalEmployees = employees.length;
  const currentYear = new Date().getFullYear();
  const today = new Date();
  const getValidDate = (value?: string) => {
    if (!value) return null;
    const d = new Date(value);
    return isValid(d) ? d : null;
  };
  
  // V2 Schema Accessors
  const activeEmployees = employees.filter(e => e.employees.status === 'Active').length;
  
  // Expanded retired/inactive statuses
  const inactiveStatuses = ['Retired', 'LPR', 'Deceased', 'Superannuation', 'Premature', 'Medical Board', 'Compulsory Retire'];
  const retiredEmployees = employees.filter(e => inactiveStatuses.includes(e.employees.status)).length;
  
  const gpfSubscribers = employees.filter(e => e.employees.gpf_account_no && e.employees.gpf_account_no.trim().length > 0).length;
  
  // Retiring This Year Logic
  const retiringEmployees = employees.filter(e => {
    const rd = e.service_history.date_of_retirement;
    if (!rd) return false;
    // Simple year check YYYY-MM-DD
    return rd.startsWith(String(currentYear));
  }).sort((a, b) => {
    const da = a.service_history.date_of_retirement || '';
    const db = b.service_history.date_of_retirement || '';
    return da.localeCompare(db);
  });

  const retiringCount = retiringEmployees.length;
  const retiringDisplay = retiringEmployees.slice(0, 5);

  // Case Stats
  const activeCases = cases.filter(c => ['in_progress', 'draft', 'returned'].includes(c.status));
  const completedCases = cases.filter(c => c.status === 'completed');
  const submittedCases = cases.filter(c => c.status === 'submitted');

  // Deadline Reminders (Cases due in next 7 days)
  const upcomingDeadlines = cases.filter(c => {
    if (!c.deadline || c.status === 'completed') return false;
    const deadlineDate = getValidDate(c.deadline);
    if (!deadlineDate) return false;
    return isBefore(deadlineDate, addDays(today, 7)) && isAfter(deadlineDate, today);
  }).sort((a, b) => {
    const da = getValidDate(a.deadline);
    const db = getValidDate(b.deadline);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.getTime() - db.getTime();
  });

  // Overdue Cases
  const overdueCases = cases.filter(c => {
    if (!c.deadline || c.status === 'completed') return false;
    const deadlineDate = getValidDate(c.deadline);
    if (!deadlineDate) return false;
    return isBefore(deadlineDate, today);
  });

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase();
    const load = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    };
    const results: any[] = [];
    employees.forEach(e => {
      if (
        e.employees.name.toLowerCase().includes(q) ||
        e.employees.personal_no.toLowerCase().includes(q) ||
        e.employees.school_full_name.toLowerCase().includes(q)
      ) {
        results.push({ type: 'Employee', title: e.employees.name, subtitle: e.employees.school_full_name, route: `/employees?searchTerm=${e.employees.personal_no}` });
      }
    });
    cases.forEach(c => {
      if (c.title.toLowerCase().includes(q)) {
        results.push({ type: 'Case', title: c.title, subtitle: c.case_type, route: `/cases/${c.id}` });
      }
    });
    load('clerk_pro_transfer_requests').forEach((r: any) => {
      if ((r.employeeName || '').toLowerCase().includes(q) || (r.toSchool || '').toLowerCase().includes(q)) {
        results.push({ type: 'Transfer', title: r.employeeName, subtitle: `${r.fromSchool} → ${r.toSchool}`, route: '/admin' });
      }
    });
    load('clerk_pro_school_inspections').forEach((r: any) => {
      if ((r.schoolName || '').toLowerCase().includes(q)) {
        results.push({ type: 'Inspection', title: r.schoolName, subtitle: r.inspectionDate, route: '/admin' });
      }
    });
    load('clerk_pro_emis_reports').forEach((r: any) => {
      if ((r.schoolName || '').toLowerCase().includes(q) || (r.month || '').toLowerCase().includes(q)) {
        results.push({ type: 'EMIS', title: r.schoolName, subtitle: r.month, route: '/admin' });
      }
    });
    load('clerk_pro_inventory_items').forEach((r: any) => {
      if ((r.name || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q)) {
        results.push({ type: 'Inventory', title: r.name, subtitle: `${r.qty} ${r.unit}`, route: '/admin' });
      }
    });
    load('clerk_pro_meetings').forEach((r: any) => {
      if ((r.title || '').toLowerCase().includes(q) || (r.date || '').toLowerCase().includes(q)) {
        results.push({ type: 'Meeting', title: r.title, subtitle: r.date, route: '/admin' });
      }
    });
    load('clerk_pro_medical_claims').forEach((r: any) => {
      if ((r.employeeName || '').toLowerCase().includes(q)) {
        results.push({ type: 'Claim', title: r.employeeName, subtitle: `PKR ${r.amount}`, route: '/admin' });
      }
    });
    load('clerk_pro_loan_applications').forEach((r: any) => {
      if ((r.employeeName || '').toLowerCase().includes(q)) {
        results.push({ type: 'Loan', title: r.employeeName, subtitle: `${r.loanType} • PKR ${r.amount}`, route: '/admin' });
      }
    });
    setSearchResults(results.slice(0, 12));
  }, [query, employees, cases]);

  // Pending Checklist Logic
  let totalPendingItems = 0;
  let casesWithPendingItems = 0;
  activeCases.forEach(c => {
    const pendingCount = c.checklist.filter(i => !i.done).length;
    if (pendingCount > 0) {
      totalPendingItems += pendingCount;
      casesWithPendingItems++;
    }
  });

  // Recent Cases (Last 5)
  const recentCases = [...cases]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getEmployeeName = (id: string) => {
    const e = employees.find(emp => emp.id === id);
    return e ? e.employees.name : 'Unknown';
  };

  // Status Colors for Recent List
  const getStatusColor = (s: string) => {
    switch(s) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'submitted': return 'text-blue-700 bg-blue-100';
      case 'returned': return 'text-red-700 bg-red-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  // Empty State: No data at all
  if (totalEmployees === 0) {
    return (
      <div className="max-w-xl mx-auto pt-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-official font-bold text-on-surface mb-2">Welcome to Clerk Pro</h1>
          <p className="text-on-surface-variant italic">by Fazal Ali</p>
        </div>
        <EmptyState 
          icon="group_add" 
          title="No Employees Yet" 
          description="Get started by adding your first employee service record to enable dashboard analytics." 
          action={
             <Button variant="filled" onClick={() => navigate('/employees')} label="Add First Employee" icon="add" />
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-24 lg:pb-8">
      
      {/* 1. Hero Header & Quick Search */}
      <Card variant="filled" className="bg-surface-container-low p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-normal text-on-surface">Clerk Pro Dashboard</h2>
          <p className="text-sm font-bold text-on-surface-variant/80 uppercase tracking-wide">Automated Operations Hub • Fazal Ali</p>
        </div>
        
        {/* Mobile-friendly Quick Search Entry */}
        <button 
          onClick={() => navigate('/employees')}
          className="w-full md:w-auto min-w-[280px] bg-white/50 hover:bg-white border border-outline-variant/30 rounded-full px-4 py-2.5 flex items-center gap-3 text-on-surface-variant transition-all text-left active:scale-[0.99] shadow-sm"
        >
          <AppIcon name="search" />
          <span className="text-sm flex-1">Search staff...</span>
          <span className="text-[10px] bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded-full font-bold uppercase">
             Total: {totalEmployees}
          </span>
        </button>
      </Card>

      <Card variant="outlined" className="bg-surface">
        <TextField label="(Employees, Cases, EMIS)" icon="search" value={query} onChange={e => setQuery(e.target.value)} />
        {searchResults.length > 0 && (
          <div className="mt-4 divide-y divide-outline-variant/30">
            {searchResults.map((r, idx) => (
              <div key={`${r.type}_${idx}`} className="py-3 flex items-center justify-between hover:bg-surface-variant/30 px-2 rounded-lg cursor-pointer" onClick={() => navigate(r.route)}>
                <div>
                  <div className="text-xs uppercase text-on-surface-variant">{r.type}</div>
                  <div className="font-bold text-on-surface">{r.title}</div>
                  <div className="text-xs text-on-surface-variant">{r.subtitle}</div>
                </div>
                <AppIcon name="chevron_right" className="text-on-surface-variant" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 2. Stats Grid (Clickable) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatTile 
          label="Total Staff" 
          value={totalEmployees} 
          icon="groups" 
          colorClass="text-blue-700" 
          bgClass="bg-blue-100"
          onClick={() => navigate('/employees')} 
        />
        <StatTile 
          label="Active Duty" 
          value={activeEmployees} 
          icon="badge" 
          colorClass="text-emerald-700" 
          bgClass="bg-emerald-100"
          onClick={() => navigate('/employees?status=Active')}
        />
        <StatTile 
          label="Retired / LPR" 
          value={retiredEmployees} 
          icon="elderly" 
          colorClass="text-orange-700" 
          bgClass="bg-orange-100"
          onClick={() => navigate('/employees?status=Retired')} 
        />
        <StatTile 
          label="GPF Subscribers" 
          value={gpfSubscribers} 
          icon="savings" 
          colorClass="text-purple-700" 
          bgClass="bg-purple-100"
          onClick={() => navigate('/employees?gpf=true')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        
        {/* 3. Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* REMINDERS & ALERTS SECTION */}
          {(overdueCases.length > 0 || upcomingDeadlines.length > 0) && (
            <Card variant="outlined" className="bg-red-50 border-red-200 p-0 overflow-hidden">
              <div className="bg-red-100 px-4 py-2 border-b border-red-200 flex items-center gap-2">
                <AppIcon name="notification_important" className="text-red-700" size={20} />
                <h3 className="font-bold text-red-900 text-sm uppercase tracking-wide">Critical Reminders</h3>
              </div>
              <div className="divide-y divide-red-100">
                {overdueCases.map(c => (
                  <div key={c.id} className="p-3 flex items-center justify-between hover:bg-red-100/50 cursor-pointer" onClick={() => navigate(`/cases/${c.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                      <div>
                        <div className="text-sm font-bold text-red-900 truncate max-w-[200px]">{c.title}</div>
                        <div className="text-[10px] text-red-700 uppercase">OVERDUE since {format(getValidDate(c.deadline) || today, 'dd MMM')}</div>
                      </div>
                    </div>
                    <AppIcon name="chevron_right" className="text-red-400" />
                  </div>
                ))}
                {upcomingDeadlines.map(c => (
                  <div key={c.id} className="p-3 flex items-center justify-between hover:bg-orange-50 cursor-pointer" onClick={() => navigate(`/cases/${c.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <div>
                        <div className="text-sm font-bold text-on-surface truncate max-w-[200px]">{c.title}</div>
                        <div className="text-[10px] text-orange-700 uppercase">DUE IN {Math.ceil(((getValidDate(c.deadline) || today).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} DAYS</div>
                      </div>
                    </div>
                    <AppIcon name="chevron_right" className="text-orange-400" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Pending Documents Widget */}
          {cases.length > 0 && totalPendingItems > 0 && (
            <Card 
              variant="outlined" 
              className="bg-slate-50 border-slate-200 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
              onClick={() => navigate('/cases?status=in_progress')}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-100 text-slate-700 rounded-full">
                  <AppIcon name="pending_actions" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg">{totalPendingItems} Pending Items</h3>
                  <p className="text-sm text-slate-700">Missing documents across {casesWithPendingItems} active cases.</p>
                </div>
                <AppIcon name="chevron_right" className="text-slate-400" />
              </div>
            </Card>
          )}

          {/* REPORTING DASHBOARD: Case Distribution */}
          <Card variant="outlined" className="bg-surface">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <h3 className="font-bold text-on-surface">Case Performance Metrics</h3>
                   <p className="text-xs text-on-surface-variant">Efficiency & distribution analytics</p>
                </div>
                <div className="text-right">
                   <div className="text-2xl font-bold text-primary">{cases.length}</div>
                   <div className="text-[10px] text-on-surface-variant uppercase">Total Cases</div>
                </div>
             </div>
             
             <div className="space-y-6">
                <ProgressBar 
                  label="In Progress" 
                  value={activeCases.length} 
                  total={cases.length} 
                  color="bg-primary" 
                />
                <ProgressBar 
                  label="Submitted" 
                  value={submittedCases.length} 
                  total={cases.length} 
                  color="bg-secondary" 
                />
                <ProgressBar 
                  label="Completed" 
                  value={completedCases.length} 
                  total={cases.length} 
                  color="bg-green-600" 
                />
                <ProgressBar 
                  label="Overdue" 
                  value={overdueCases.length} 
                  total={cases.length} 
                  color="bg-red-600" 
                />
             </div>
          </Card>

          {/* RETIRING THIS YEAR WIDGET */}
          <Card variant="outlined" className="bg-surface border-orange-200">
             <div className="flex justify-between items-center mb-4 border-b border-orange-100 pb-2">
                <div className="flex items-center gap-2">
                   <div className="p-1.5 bg-orange-100 text-orange-700 rounded-lg">
                      <AppIcon name="event_busy" size={20} />
                   </div>
                   <div>
                      <h3 className="font-bold text-on-surface">Retiring in {currentYear}</h3>
                      <p className="text-xs text-on-surface-variant">Upcoming superannuations</p>
                   </div>
                </div>
                <Button 
                   variant="text" 
                   label={`View All (${retiringCount})`} 
                   onClick={() => navigate(`/employees?retiringYear=${currentYear}`)} 
                   className="h-8 text-xs" 
                />
             </div>
             
             {retiringDisplay.length > 0 ? (
                <div className="space-y-2">
                   {retiringDisplay.map(e => (
                      <div key={e.id} 
                           onClick={() => navigate(`/employees?status=All&searchTerm=${e.employees.personal_no}`)}
                           className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer group"
                      >
                         <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-xs shrink-0">
                               {e.employees.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                               <div className="font-bold text-sm truncate">{e.employees.name}</div>
                               <div className="text-xs text-on-surface-variant truncate">{e.employees.designation} • {e.employees.school_full_name}</div>
                            </div>
                         </div>
                         <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-sm text-orange-700">
                               {e.service_history.date_of_retirement ? format(new Date(e.service_history.date_of_retirement), 'dd MMM') : '-'}
                            </div>
                            <div className="text-[10px] text-on-surface-variant uppercase">Retirement</div>
                         </div>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="text-center py-6 text-on-surface-variant/60">
                   No employees retiring in {currentYear}.
                </div>
             )}
          </Card>
        </div>

        {/* 4. Right Sidebar: Audit Trail & Actions */}
        <div className="space-y-6">
          <Card variant="elevated" className="bg-surface-container-low">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 ml-1">Quick Actions</h3>
            <div className="space-y-2">
               <QuickAction 
                 icon="person_add" 
                 label="New Employee Entry" 
                 desc="Add service record"
                 onClick={() => navigate('/employees')} 
                 primary
               />
               <QuickAction 
                 icon="edit_document" 
                 label="Start New Case" 
                 desc="Pension/GPF/Inquiry"
                 onClick={() => navigate('/cases/new')} 
               />
               <QuickAction 
                 icon="calendar_month" 
                 label="Case Calendar" 
                 desc="Deadlines & Hearings"
                 onClick={() => navigate('/cases')} 
               />
               <QuickAction 
                 icon="query_stats" 
                 label="Audit Reports" 
                 desc="Track system changes"
                 onClick={() => navigate('/admin')} 
               />
            </div>
          </Card>

          {/* RECENT AUDIT TRAIL */}
          <Card variant="outlined" className="bg-surface p-0 overflow-hidden">
             <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-wide text-on-surface-variant">System Audit Trail</h3>
                <AppIcon name="history" size={18} className="text-on-surface-variant" />
             </div>
             <div className="max-h-[300px] overflow-y-auto divide-y divide-outline-variant/10">
                {auditService.getAllLogs().slice(0, 10).map(log => (
                  <div key={log.id} className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold text-primary uppercase">{log.action}</span>
                      <span className="text-[9px] text-on-surface-variant">{format(new Date(log.timestamp), 'HH:mm')}</span>
                    </div>
                    <p className="text-[11px] text-on-surface mt-1 leading-tight">{log.details}</p>
                  </div>
                ))}
                {auditService.getAllLogs().length === 0 && (
                  <div className="p-6 text-center text-[10px] text-on-surface-variant italic">No activity logs found.</div>
                )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ProgressBar = ({ label, value, total, color }: any) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-on-surface-variant uppercase">{label}</span>
        <span className="text-xs font-mono font-bold text-on-surface">{value} ({percentage}%)</span>
      </div>
      <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const StatTile = ({ label, value, icon, colorClass, bgClass, onClick }: any) => (
  <button 
    onClick={onClick}
    className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden h-32 lg:h-auto text-left hover:shadow-md hover:-translate-y-0.5 transition-all w-full active:scale-[0.98]"
  >
    <div className="flex justify-between items-start mb-2 w-full">
      <div className={`p-2 rounded-lg ${bgClass} ${colorClass} bg-opacity-20`}>
        <AppIcon name={icon} size={24} />
      </div>
      <AppIcon name="arrow_forward" size={16} className="text-on-surface-variant/30" />
    </div>
    <div>
      <h3 className="text-2xl font-bold text-on-surface font-mono">{value}</h3>
      <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide mt-1 truncate">{label}</p>
    </div>
  </button>
);

const QuickAction = ({ icon, label, desc, onClick, primary }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] text-left group
      ${primary 
        ? 'bg-primary-container text-on-primary-container hover:shadow-md' 
        : 'hover:bg-surface-variant/50 text-on-surface'
      }`}
  >
    <div className={`p-2 rounded-full ${primary ? 'bg-primary/20' : 'bg-surface-variant/50 group-hover:bg-white'}`}>
      <AppIcon name={icon} size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-sm leading-tight truncate">{label}</div>
      <div className={`text-xs mt-0.5 truncate ${primary ? 'text-on-primary-container/70' : 'text-on-surface-variant'}`}>{desc}</div>
    </div>
    <AppIcon name="chevron_right" size={18} className="opacity-30 shrink-0" />
  </button>
);

export default Dashboard;
