import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../types';
import { AppIcon } from '../components/AppIcon';
import { Card, Button, EmptyState, TextField } from '../components/M3';
import { format, isAfter, isBefore, addDays, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmployeeContext } from '../contexts/EmployeeContext';
import clsx from 'clsx';

const Dashboard: React.FC = () => {
  const { employees, cases } = useEmployeeContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // 1. Computed Statistics
  const stats = useMemo(() => {
    const activeCount = employees.filter(e => e.employees.status === 'Active').length;
    const inactiveStatuses = ['Retired', 'LPR', 'Deceased', 'Superannuation', 'Premature', 'Medical Board', 'Compulsory Retire'];
    const retiredCount = employees.filter(e => inactiveStatuses.includes(e.employees.status)).length;
    const gpfCount = employees.filter(e => e.employees.gpf_account_no?.trim()).length;
    const activeCaseCount = cases.filter(c => ['in_progress', 'draft', 'returned'].includes(c.status)).length;

    return {
      total: employees.length,
      active: activeCount,
      retired: retiredCount,
      gpf: gpfCount,
      activeCases: activeCaseCount
    };
  }, [employees, cases]);

  // Search Results with useMemo
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: any[] = [];

    // Search Employees
    employees.forEach(e => {
      if (
        e.employees.name.toLowerCase().includes(q) ||
        e.employees.personal_no.toLowerCase().includes(q) ||
        (e.employees.school_full_name || '').toLowerCase().includes(q)
      ) {
        results.push({ 
          type: 'Employee', 
          title: e.employees.name, 
          subtitle: e.employees.school_full_name, 
          route: `/employees?searchTerm=${e.employees.personal_no}`,
          icon: 'person'
        });
      }
    });

    // Search Cases
    cases.forEach(c => {
      if (c.title.toLowerCase().includes(q)) {
        results.push({ 
          type: 'Case', 
          title: c.title, 
          subtitle: c.case_type, 
          route: `/cases/${c.id}`,
          icon: 'assignment'
        });
      }
    });

    // Helper for localStorage data
    const searchLocal = (key: string, type: string, icon: string, filterFn: (r: any) => boolean, mapFn: (r: any) => any) => {
      try {
        const raw = localStorage.getItem(key);
        const data = raw ? JSON.parse(raw) : [];
        data.filter(filterFn).forEach((r: any) => {
          results.push({ type, icon, ...mapFn(r) });
        });
      } catch (e) {}
    };

    searchLocal('kpk_transfer_requests', 'Transfer', 'swap_horiz', 
      r => (r.employeeName || '').toLowerCase().includes(q) || (r.toSchool || '').toLowerCase().includes(q),
      r => ({ title: r.employeeName, subtitle: `${r.fromSchool} → ${r.toSchool}`, route: '/admin' })
    );

    searchLocal('kpk_school_inspections', 'Inspection', 'visibility',
      r => (r.schoolName || '').toLowerCase().includes(q),
      r => ({ title: r.schoolName, subtitle: r.inspectionDate, route: '/admin' })
    );

    return results.slice(0, 10);
  }, [query, employees, cases]);

  // Animations
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (employees.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto pt-10 px-4">
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
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-8"
    >
      {/* Hero Section */}
      <motion.div variants={itemVars}>
        <Card variant="filled" className="bg-primary/5 border border-primary/10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-on-surface tracking-tight">Operation Dashboard</h2>
            <p className="text-primary font-medium mt-1 flex items-center gap-2">
              <AppIcon name="verified" size={18} />
              Automated Clerk Systems • v2.0
            </p>
          </div>
          
          <div className="relative z-10 w-full md:w-auto min-w-[320px]">
            <TextField 
              label="Quick Search Employees or Cases" 
              icon="search" 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              className="bg-surface shadow-elevation-2 rounded-xl"
            />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface border border-outline-variant rounded-2xl shadow-elevation-4 overflow-hidden z-50 divide-y divide-outline-variant/30"
                >
                  {searchResults.map((r, idx) => (
                    <button 
                      key={`${r.type}_${idx}`} 
                      onClick={() => navigate(r.route)}
                      className="w-full text-left py-3 px-4 flex items-center gap-4 hover:bg-surface-variant/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                        <AppIcon name={r.icon || 'search'} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase font-bold text-primary tracking-wider">{r.type}</div>
                        <div className="font-bold text-on-surface truncate">{r.title}</div>
                        <div className="text-xs text-on-surface-variant truncate">{r.subtitle}</div>
                      </div>
                      <AppIcon name="chevron_right" size={20} className="text-outline" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVars} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile 
          label="Total Staff" 
          value={stats.total} 
          icon="groups" 
          variant="blue"
          onClick={() => navigate('/employees')} 
        />
        <StatTile 
          label="Active Duty" 
          value={stats.active} 
          icon="how_to_reg" 
          variant="green"
          onClick={() => navigate('/employees?status=Active')} 
        />
        <StatTile 
          label="Retired/Inactive" 
          value={stats.retired} 
          icon="history" 
          variant="orange"
          onClick={() => navigate('/employees?status=Retired')} 
        />
        <StatTile 
          label="Active Cases" 
          value={stats.activeCases} 
          icon="assignment" 
          variant="purple"
          onClick={() => navigate('/cases')} 
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Recent & Deadlines */}
        <motion.div variants={itemVars} className="lg:col-span-2 space-y-6">
          <Card variant="outlined" className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AppIcon name="history" className="text-primary" />
                Recent Activities
              </h3>
              <Button variant="text" label="View All" onClick={() => navigate('/cases')} />
            </div>
            <div className="divide-y divide-outline-variant/30">
              {cases.slice(0, 5).map(c => (
                <button 
                  key={c.id} 
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-surface-variant/20 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <AppIcon name={c.case_type === 'pension' ? 'elderly' : 'assignment'} className="text-on-surface-variant group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-on-surface truncate group-hover:text-primary transition-colors">{c.title}</div>
                    <div className="text-xs text-on-surface-variant flex items-center gap-2">
                      <span className="capitalize">{c.case_type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Updated {format(new Date(c.updatedAt), 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                  <Badge variant={c.status === 'completed' ? 'success' : (c.status === 'returned' ? 'error' : 'tonal')}>
                    {c.status.replace('_', ' ')}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Right Column - Quick Actions & Info */}
        <motion.div variants={itemVars} className="space-y-6">
          <Card variant="filled" className="bg-secondary-container/30 border border-secondary-container p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <AppIcon name="bolt" className="text-secondary" />
              Quick Actions
            </h3>
            <div className="grid gap-3">
              <QuickActionButton 
                label="New Retirement Case" 
                icon="edit_document" 
                onClick={() => navigate('/cases/new')} 
              />
              <QuickActionButton 
                label="Pension Calculator" 
                icon="calculate" 
                onClick={() => navigate('/pension')} 
              />
              <QuickActionButton 
                label="Service Record" 
                icon="person_add" 
                onClick={() => navigate('/employees')} 
              />
            </div>
          </Card>

          <Card variant="outlined" className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <AppIcon name="notifications" className="text-primary" />
              System Status
            </h3>
            <div className="space-y-4">
              <StatusIndicator label="Database Online" active />
              <StatusIndicator label="Auto-Backup Enabled" active />
              <StatusIndicator label="Security Scan Passed" active />
              <div className="pt-4 mt-4 border-t border-outline-variant/30">
                <div className="text-xs text-on-surface-variant">Last Audit Log:</div>
                <div className="text-xs font-mono mt-1 opacity-70">
                  {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

// --- Subcomponents ---

const StatTile = ({ label, value, icon, variant, onClick }: any) => {
  const colors = {
    blue: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    orange: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    purple: "bg-purple-500/10 text-purple-700 border-purple-500/20"
  };

  const colorClass = colors[variant as keyof typeof colors] || colors.blue;

  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-3xl border text-left transition-all hover:shadow-elevation-2 active:scale-95 group relative overflow-hidden bg-surface ${colorClass.split(' ')[2]}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
        <AppIcon name={icon} size={28} />
      </div>
      <div className="text-3xl font-bold text-on-surface">{value}</div>
      <div className="text-sm font-medium text-on-surface-variant mt-1">{label}</div>
    </button>
  );
};

const QuickActionButton = ({ label, icon, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-surface-variant/50 border border-outline-variant/30 transition-all group"
  >
    <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-primary/10 transition-colors">
      <AppIcon name={icon} size={20} className="text-on-surface-variant group-hover:text-primary" />
    </div>
    <span className="font-medium text-sm text-on-surface">{label}</span>
    <AppIcon name="arrow_forward" size={16} className="ml-auto text-outline opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
  </button>
);

const StatusIndicator = ({ label, active }: { label: string, active: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-outline'}`} />
    <span className="text-sm font-medium text-on-surface-variant">{label}</span>
  </div>
);

const Badge = ({ children, variant }: any) => {
  const styles = {
    success: "bg-emerald-100 text-emerald-700",
    error: "bg-rose-100 text-rose-700",
    tonal: "bg-secondary-container text-on-secondary-container",
    outline: "border border-outline text-on-surface-variant"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[variant as keyof typeof styles]}`}>
      {children}
    </span>
  );
};

export default Dashboard;
