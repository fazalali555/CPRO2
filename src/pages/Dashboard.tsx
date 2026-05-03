
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../types';
import { AppIcon } from '../components/AppIcon';
import { Card, Button, EmptyState, TextField } from '../components/M3';
import { format, isAfter, isBefore, addDays, isValid, startOfToday } from 'date-fns';
import { auditService, securityService } from '../services/SecurityService';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '../config/branding';

import { useEmployeeContext } from '../contexts/EmployeeContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const Dashboard: React.FC = () => {
  const { employees, cases } = useEmployeeContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const currentUser = securityService.getCurrentUser();
  const userName = currentUser?.name || 'Clerk';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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
    switch (s) {
      case 'completed': return 'text-green-700 bg-green-100';
      case 'submitted': return 'text-blue-700 bg-blue-100';
      case 'returned': return 'text-red-700 bg-red-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  // Empty State: No data at all
  if (totalEmployees === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-mesh">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full"
        >
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-on-surface tracking-tighter mb-4">
              Welcome to <span className="text-primary">Clerk Pro</span>
            </h1>
            <p className="text-on-surface-variant/60 font-medium uppercase tracking-[0.3em] text-sm">Automated Operations Hub • Fazal Ali</p>
          </div>

          <Card variant="outlined" className="glass !p-12 !rounded-[48px] text-center shadow-premium relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-tertiary to-primary" />

            <div className="w-24 h-24 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <AppIcon name="group_add" size={48} />
            </div>

            <h3 className="text-2xl font-bold text-on-surface mb-3 tracking-tight">Your digital desk is ready</h3>
            <p className="text-on-surface-variant/70 mb-10 max-w-sm mx-auto leading-relaxed">
              Add your first employee record to unlock the power of automated pension tracking, case management, and smart analytics.
            </p>

            <Button
              variant="filled"
              onClick={() => navigate('/employees')}
              label="Initialize First Record"
              icon="add"
              className="h-14 px-8 text-lg shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            />

            {/* Decorative elements */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-tertiary/5 rounded-full blur-3xl" />
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-8 max-w-7xl mx-auto pb-24 lg:pb-8 px-4 md:px-6 bg-mesh min-h-screen"
    >

      {/* 1. Premium Hero Header & Profile */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-tertiary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-16 h-16 rounded-full glass flex items-center justify-center text-primary font-bold text-xl shadow-premium">
              {userInitials}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface">
              {getGreeting()}, <span className="text-primary">{userName}</span>
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">{APP_NAME}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="text-xs font-medium text-on-surface-variant/80">{format(new Date(), 'EEEE, do MMMM yyyy')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">System Status</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Operational
            </span>
          </div>
          <Button
            variant="tonal"
            icon="settings"
            onClick={() => navigate('/settings')}
            className="w-12 h-12 !p-0 rounded-2xl glass"
          />
        </div>
      </motion.div>

      {/* 2. Command Center Search */}
      <motion.div variants={itemVariants} className="relative z-10">
        <div className="absolute -inset-2 bg-gradient-to-b from-primary/5 to-transparent rounded-[32px] blur-xl opacity-50"></div>
        <Card variant="outlined" className="relative glass !p-2 !rounded-[24px] shadow-premium overflow-hidden border-white/40 dark:border-white/10">
          <div className="flex items-center gap-2 px-3 h-14">
            <AppIcon name="search" className="text-primary animate-pulse" size={24} />
            <input
              type="text"
              placeholder="Command search... (Staff, Cases, EMIS)"
              className="bg-transparent border-none outline-none flex-1 text-lg font-medium text-on-surface placeholder:text-on-surface-variant/40"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className="hidden sm:flex items-center gap-1.5 bg-surface-variant/50 px-2.5 py-1 rounded-lg border border-outline-variant/30">
              <span className="text-[10px] font-bold text-on-surface-variant">⌘ K</span>
            </div>
          </div>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 border-t border-outline-variant/20 max-h-[400px] overflow-y-auto px-2 pb-2"
              >
                {searchResults.map((r, idx) => (
                  <motion.div
                    key={`${r.type}_${idx}`}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group py-3 flex items-center justify-between hover:bg-primary/5 px-4 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                    onClick={() => navigate(r.route)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-variant/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                        <AppIcon name={r.type === 'Employee' ? 'person' : r.type === 'Case' ? 'folder' : 'analytics'} size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-primary tracking-widest">{r.type}</div>
                        <div className="font-bold text-on-surface group-hover:text-primary transition-colors">{r.title}</div>
                        <div className="text-xs text-on-surface-variant">{r.subtitle}</div>
                      </div>
                    </div>
                    <AppIcon name="arrow_forward" size={18} className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>


      {/* 3. Stats Grid (Clickable) */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatTile
          label="Total Staff"
          value={totalEmployees}
          icon="groups"
          color="primary"
          onClick={() => navigate('/employees')}
        />
        <StatTile
          label="Active Duty"
          value={activeEmployees}
          icon="badge"
          color="emerald"
          onClick={() => navigate('/employees?status=Active')}
        />
        <StatTile
          label="Retired / LPR"
          value={retiredEmployees}
          icon="elderly"
          color="orange"
          onClick={() => navigate('/employees?status=Retired')}
        />
        <StatTile
          label="GPF Subscribers"
          value={gpfSubscribers}
          icon="savings"
          color="purple"
          onClick={() => navigate('/employees?gpf=true')}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

        {/* 4. Main Content Area */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">

          {/* REMINDERS & ALERTS SECTION */}
          {(overdueCases.length > 0 || upcomingDeadlines.length > 0) && (
            <motion.div variants={itemVariants}>
              <Card variant="outlined" className="glass border-red-500/20 !p-0 overflow-hidden shadow-premium">
                <div className="bg-red-500/10 px-5 py-3 border-b border-red-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40">
                      <AppIcon name="notification_important" size={20} />
                    </div>
                    <h3 className="font-bold text-on-surface text-sm uppercase tracking-widest">Critical Reminders</h3>
                  </div>
                  <Badge label={`${overdueCases.length + upcomingDeadlines.length} Alerts`} color="error" />
                </div>
                <div className="divide-y divide-outline-variant/10">
                  {overdueCases.map(c => (
                    <motion.div
                      key={c.id}
                      whileHover={{ x: 5, backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                      className="p-4 flex items-center justify-between cursor-pointer transition-colors"
                      onClick={() => navigate(`/cases/${c.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-sm shadow-red-500" />
                        <div>
                          <div className="text-sm font-bold text-on-surface truncate max-w-[200px] md:max-w-md">{c.title}</div>
                          <div className="text-[10px] text-red-600 font-bold uppercase tracking-tighter mt-0.5">OVERDUE since {format(getValidDate(c.deadline) || today, 'dd MMM')}</div>
                        </div>
                      </div>
                      <AppIcon name="chevron_right" className="text-red-400" />
                    </motion.div>
                  ))}
                  {upcomingDeadlines.map(c => (
                    <motion.div
                      key={c.id}
                      whileHover={{ x: 5, backgroundColor: 'rgba(245, 158, 11, 0.05)' }}
                      className="p-4 flex items-center justify-between cursor-pointer transition-colors"
                      onClick={() => navigate(`/cases/${c.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <div>
                          <div className="text-sm font-bold text-on-surface truncate max-w-[200px] md:max-w-md">{c.title}</div>
                          <div className="text-[10px] text-orange-600 font-bold uppercase tracking-tighter mt-0.5">DUE IN {Math.ceil(((getValidDate(c.deadline) || today).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} DAYS</div>
                        </div>
                      </div>
                      <AppIcon name="chevron_right" className="text-orange-400" />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Pending Documents Widget */}
          {cases.length > 0 && totalPendingItems > 0 && (
            <motion.div variants={itemVariants}>
              <Card
                variant="outlined"
                className="glass border-primary/20 cursor-pointer hover:shadow-premium transition-all active:scale-[0.99] group overflow-hidden"
                onClick={() => navigate('/cases?status=in_progress')}
              >
                <div className="flex items-center gap-5 relative z-10">
                  <div className="p-4 bg-primary text-on-primary rounded-[20px] shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                    <AppIcon name="pending_actions" size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-on-surface text-xl">{totalPendingItems} Pending Items</h3>
                    <p className="text-sm text-on-surface-variant/80">Missing documents across {casesWithPendingItems} active cases.</p>
                  </div>
                  <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <AppIcon name="arrow_forward" size={20} />
                  </div>
                </div>
                {/* Background glow */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
              </Card>
            </motion.div>
          )}

          {/* REPORTING DASHBOARD: Case Distribution */}
          <motion.div variants={itemVariants}>
            <Card variant="outlined" className="glass shadow-premium overflow-hidden border-primary/10">
              <div className="flex justify-between items-center mb-8 p-1">
                <div>
                  <h3 className="font-bold text-on-surface text-lg">Case Performance</h3>
                  <p className="text-xs font-medium text-on-surface-variant/60 uppercase tracking-widest">Efficiency Analytics</p>
                </div>
                <div className="text-right glass px-4 py-2 rounded-2xl border-primary/10 shadow-sm">
                  <div className="text-2xl font-bold text-primary tracking-tighter">{cases.length}</div>
                  <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase">Total Cases</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
                  color="bg-tertiary"
                />
                <ProgressBar
                  label="Completed"
                  value={completedCases.length}
                  total={cases.length}
                  color="bg-emerald-500"
                />
                <ProgressBar
                  label="Overdue"
                  value={overdueCases.length}
                  total={cases.length}
                  color="bg-red-500"
                />
              </div>
            </Card>
          </motion.div>

          {/* RETIRING THIS YEAR WIDGET */}

          <motion.div variants={itemVariants}>
            <Card variant="outlined" className="glass border-orange-500/10 !p-0 overflow-hidden shadow-premium">
              <div className="flex justify-between items-center p-5 border-b border-orange-500/5 bg-orange-500/[0.03]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/30">
                    <AppIcon name="event_busy" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-sm uppercase tracking-widest">Retiring in {currentYear}</h3>
                    <p className="text-[10px] font-medium text-on-surface-variant/60">Upcoming superannuations</p>
                  </div>
                </div>
                <Button
                  variant="tonal"
                  label={`View All (${retiringCount})`}
                  onClick={() => navigate(`/employees?retiringYear=${currentYear}`)}
                  className="h-9 text-xs glass border-orange-500/10"
                />
              </div>

              <div className="p-2">
                {retiringDisplay.length > 0 ? (
                  <div className="space-y-1">
                    {retiringDisplay.map(e => (
                      <motion.div
                        key={e.id}
                        whileHover={{ x: 5, backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                        onClick={() => navigate(`/employees?status=All&searchTerm=${e.employees.personal_no}`)}
                        className="flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                              {e.employees.name.charAt(0)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-surface border-2 border-orange-500 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-on-surface truncate text-sm">{e.employees.name}</div>
                            <div className="text-[10px] font-medium text-on-surface-variant/60 truncate uppercase tracking-tighter">
                              {e.employees.designation} • {e.employees.school_full_name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-sm text-orange-600">
                            {e.service_history.date_of_retirement ? format(new Date(e.service_history.date_of_retirement), 'dd MMM') : '-'}
                          </div>
                          <div className="text-[10px] text-on-surface-variant/50 uppercase font-bold">Retirement</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-on-surface-variant/40 italic text-sm">
                    No employees retiring in {currentYear}.
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* 5. Right Sidebar: Audit Trail & Actions */}
        <div className="space-y-6 md:space-y-8">
          <motion.div variants={itemVariants}>
            <Card variant="elevated" className="glass shadow-premium border-primary/5">
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-6 ml-1 opacity-60">Command Launcher</h3>
              <div className="grid grid-cols-1 gap-3">
                <QuickAction
                  icon="person_add"
                  label="Add Employee"
                  desc="New service record"
                  onClick={() => navigate('/employees')}
                  primary
                />
                <QuickAction
                  icon="edit_document"
                  label="Start Case"
                  desc="Pension/GPF/Inquiry"
                  onClick={() => navigate('/cases/new')}
                />
                <QuickAction
                  icon="calendar_month"
                  label="Deadlines"
                  desc="View case calendar"
                  onClick={() => navigate('/cases')}
                />
                <QuickAction
                  icon="query_stats"
                  label="Audit Logs"
                  desc="System activity"
                  onClick={() => navigate('/admin')}
                />
              </div>
            </Card>
          </motion.div>

          {/* RECENT AUDIT TRAIL */}
          <motion.div variants={itemVariants}>
            <Card variant="outlined" className="glass shadow-premium !p-0 overflow-hidden border-outline-variant/10">
              <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-variant/10">
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-on-surface-variant/60">System Logs</h3>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar divide-y divide-outline-variant/5">
                {auditService.getAllLogs().slice(0, 10).map((log, idx) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    className="p-4 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">{log.action}</span>
                      <span className="text-[9px] font-medium text-on-surface-variant/40">{format(new Date(log.timestamp), 'HH:mm')}</span>
                    </div>
                    <p className="text-xs text-on-surface mt-1.5 leading-relaxed font-medium">{log.details}</p>
                  </motion.div>
                ))}
                {auditService.getAllLogs().length === 0 && (
                  <div className="py-12 text-center">
                    <AppIcon name="history" size={32} className="text-on-surface-variant/20 mb-2" />
                    <p className="text-[10px] text-on-surface-variant/40 italic">No activity logs found.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const ProgressBar = ({ label, value, total, color }: any) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</span>
        <span className="text-xs font-mono font-bold text-on-surface">{value} <span className="text-[10px] text-on-surface-variant/40">({percentage}%)</span></span>
      </div>
      <div className="w-full h-2.5 bg-surface-variant/30 rounded-full overflow-hidden shadow-inner border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${color} rounded-full shadow-lg relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
        </motion.div>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, icon, color, onClick }: any) => {
  const colorMap: any = {
    primary: 'from-primary/20 to-primary/5 text-primary border-primary/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 text-orange-700 dark:text-orange-400 border-orange-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-700 dark:text-purple-400 border-purple-500/20',
  };

  return (
    <motion.button
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden p-5 rounded-[24px] glass flex flex-col justify-between text-left transition-all shadow-premium group min-h-[140px]`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-50 group-hover:opacity-100 transition-opacity`} />

      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="p-3 bg-white/50 dark:bg-black/20 rounded-2xl shadow-sm text-inherit">
          <AppIcon name={icon} size={28} />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
          <AppIcon name="arrow_outward" size={18} />
        </div>
      </div>

      <div className="relative z-10">
        <motion.h3
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-4xl font-bold text-on-surface tracking-tighter"
        >
          {value}
        </motion.h3>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
          {label}
        </p>
      </div>

      {/* Decorative background circle */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-[0.03] rounded-full blur-2xl" />
    </motion.button>
  );
};

const QuickAction = ({ icon, label, desc, onClick, primary }: any) => (
  <motion.button
    whileHover={{ x: 5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group
      ${primary
        ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
        : 'glass hover:bg-primary/5 text-on-surface'
      }`}
  >
    <div className={`p-3 rounded-xl transition-colors ${primary ? 'bg-white/20' : 'bg-primary/10 group-hover:bg-primary group-hover:text-on-primary'}`}>
      <AppIcon name={icon} size={22} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-sm leading-tight truncate tracking-tight">{label}</div>
      <div className={`text-[10px] font-medium mt-0.5 truncate uppercase tracking-tighter ${primary ? 'text-on-primary/70' : 'text-on-surface-variant/60'}`}>{desc}</div>
    </div>
    <AppIcon name="arrow_forward" size={18} className={`opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${primary ? 'text-white' : 'text-primary'}`} />
  </motion.button>
);

export default Dashboard;
