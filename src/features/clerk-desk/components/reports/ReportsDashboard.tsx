// components/reports/ReportsDashboard.tsx

import React, { useMemo } from 'react';
import { Card, Button, Badge } from '../../../../components/M3';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ExportService } from '../../services/ExportService';
import { StorageService } from '../../services/StorageService';
import { useToast } from '../../../../contexts/ToastContext';
import { StatsGrid, StatCard } from '../common/StatCard';
import { STORAGE_KEYS, DOCUMENT_CATEGORIES } from '../../constants';
import { Letter, Document, Correspondence, Task, Appointment } from '../../types';
import { formatDate } from '../../utils/formatters';

export const ReportsDashboard: React.FC = () => {
  const { showToast } = useToast();

  // Load all data
  const [letters] = useLocalStorage<Letter[]>(STORAGE_KEYS.LETTERS, []);
  const [documents] = useLocalStorage<Document[]>(STORAGE_KEYS.DOCUMENTS, []);
  const [correspondence] = useLocalStorage<Correspondence[]>(STORAGE_KEYS.CORRESPONDENCE, []);
  const [tasks] = useLocalStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const [appointments] = useLocalStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Letters
    const letterStats = {
      total: letters.length,
      draft: letters.filter(l => l.status === 'draft').length,
      final: letters.filter(l => l.status === 'final').length,
      sent: letters.filter(l => l.status === 'sent').length,
      thisMonth: letters.filter(l => new Date(l.createdAt) >= thirtyDaysAgo).length,
      thisWeek: letters.filter(l => new Date(l.createdAt) >= sevenDaysAgo).length,
    };

    // Documents
    const docsByCategory: Record<string, number> = {};
    DOCUMENT_CATEGORIES.forEach(cat => {
      docsByCategory[cat.value] = documents.filter(d => d.category === cat.value).length;
    });
    const docsConfidential = documents.filter(d => d.isConfidential).length;
    const docsExpiringSoon = documents.filter(d => 
      d.expiryDate && new Date(d.expiryDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    // Correspondence
    const corrStats = {
      total: correspondence.length,
      incoming: correspondence.filter(c => c.direction === 'incoming').length,
      outgoing: correspondence.filter(c => c.direction === 'outgoing').length,
      pending: correspondence.filter(c => c.status === 'pending').length,
      replied: correspondence.filter(c => c.status === 'replied').length,
      closed: correspondence.filter(c => c.status === 'closed').length,
      escalated: correspondence.filter(c => c.status === 'escalated').length,
      overdue: correspondence.filter(c => 
        c.status === 'pending' && c.dueDate && new Date(c.dueDate) < now
      ).length,
    };

    // Tasks
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => 
        t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
      ).length,
      dueToday: tasks.filter(t => t.dueDate === today && t.status !== 'completed').length,
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) 
        : 0,
    };

    // Appointments
    const apptStats = {
      total: appointments.length,
      upcoming: appointments.filter(a => a.date >= today && a.status === 'scheduled').length,
      today: appointments.filter(a => a.date === today).length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };

    // Monthly breakdown (last 6 months)
    const monthlyData: { month: string; letters: number; correspondence: number; documents: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      monthlyData.push({
        month: monthStr,
        letters: letters.filter(l => {
          const d = new Date(l.createdAt);
          return d >= monthDate && d <= monthEnd;
        }).length,
        correspondence: correspondence.filter(c => {
          const d = new Date(c.date);
          return d >= monthDate && d <= monthEnd;
        }).length,
        documents: documents.filter(doc => {
          const d = new Date(doc.createdAt);
          return d >= monthDate && d <= monthEnd;
        }).length,
      });
    }

    return {
      letters: letterStats,
      documents: { total: documents.length, byCategory: docsByCategory, confidential: docsConfidential, expiringSoon: docsExpiringSoon },
      correspondence: corrStats,
      tasks: taskStats,
      appointments: apptStats,
      monthly: monthlyData,
      storage: StorageService.getStorageStats(),
    };
  }, [letters, documents, correspondence, tasks, appointments]);

  // Export functions
  const handleExportSummary = () => {
    const summary = `
CLERK DESK SUMMARY REPORT
Generated: ${new Date().toLocaleString()}
=====================================

LETTERS
-------
Total: ${stats.letters.total}
- Drafts: ${stats.letters.draft}
- Final: ${stats.letters.final}
- Sent: ${stats.letters.sent}
- This Week: ${stats.letters.thisWeek}
- This Month: ${stats.letters.thisMonth}

DOCUMENTS
---------
Total: ${stats.documents.total}
- Confidential: ${stats.documents.confidential}
- Expiring Soon: ${stats.documents.expiringSoon}

By Category:
${Object.entries(stats.documents.byCategory).map(([cat, count]) => `  - ${cat}: ${count}`).join('\n')}

CORRESPONDENCE
--------------
Total: ${stats.correspondence.total}
- Incoming: ${stats.correspondence.incoming}
- Outgoing: ${stats.correspondence.outgoing}
- Pending: ${stats.correspondence.pending}
- Replied: ${stats.correspondence.replied}
- Closed: ${stats.correspondence.closed}
- Escalated: ${stats.correspondence.escalated}
- Overdue: ${stats.correspondence.overdue}

TASKS
-----
Total: ${stats.tasks.total}
- Pending: ${stats.tasks.pending}
- In Progress: ${stats.tasks.inProgress}
- Completed: ${stats.tasks.completed}
- Overdue: ${stats.tasks.overdue}
- Due Today: ${stats.tasks.dueToday}
- Completion Rate: ${stats.tasks.completionRate}%

APPOINTMENTS
------------
Total: ${stats.appointments.total}
- Upcoming: ${stats.appointments.upcoming}
- Today: ${stats.appointments.today}
- Completed: ${stats.appointments.completed}
- Cancelled: ${stats.appointments.cancelled}

STORAGE
-------
Used: ${(stats.storage.used / 1024 / 1024).toFixed(2)} MB
Available: ${(stats.storage.total / 1024 / 1024).toFixed(2)} MB
Usage: ${stats.storage.percentage}%

MONTHLY TRENDS
--------------
${stats.monthly.map(m => `${m.month}: Letters(${m.letters}), Correspondence(${m.correspondence}), Documents(${m.documents})`).join('\n')}
`;

    const blob = new Blob([summary], { type: 'text/plain' });
    ExportService.downloadBlob(blob, `clerk-desk-report-${new Date().toISOString().slice(0, 10)}.txt`);
    showToast('Report exported', 'success');
  };

  const handleExportBackup = () => {
    const data = StorageService.exportAll();
    ExportService.exportAsBackup(data);
    showToast('Backup created', 'success');
  };

  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        StorageService.importAll(data);
        showToast('Backup restored. Please refresh the page.', 'success');
      } catch (error) {
        showToast('Invalid backup file', 'error');
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Button
          variant="outlined"
          label="Export Report"
          icon="download"
          onClick={handleExportSummary}
        />
        <Button
          variant="outlined"
          label="Create Backup"
          icon="backup"
          onClick={handleExportBackup}
        />
        <Button
          variant="outlined"
          label="Restore Backup"
          icon="restore"
          onClick={handleImportBackup}
        />
      </div>

      {/* Overview Stats */}
      <StatsGrid
        stats={[
          { label: 'Total Letters', value: stats.letters.total, icon: 'mail', color: 'primary' },
          { label: 'Documents Filed', value: stats.documents.total, icon: 'folder', color: 'success' },
          { label: 'Correspondence', value: stats.correspondence.total, icon: 'forum', color: 'info' },
          { label: 'Tasks', value: stats.tasks.total, icon: 'task', color: 'warning' },
          { label: 'Appointments', value: stats.appointments.total, icon: 'event', color: 'primary' },
          { 
            label: 'Storage Used', 
            value: `${stats.storage.percentage}%`, 
            icon: 'storage', 
            color: stats.storage.percentage > 80 ? 'error' : 'success' 
          },
        ]}
        columns={3}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Letters Summary */}
        <Card variant="elevated" className="bg-surface p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">mail</span>
            <h3 className="text-lg font-bold text-on-surface">Letters Summary</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-surface-variant/20 rounded-lg">
              <span className="text-on-surface-variant">Drafts</span>
              <Badge label={String(stats.letters.draft)} color="warning" />
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-variant/20 rounded-lg">
              <span className="text-on-surface-variant">Finalized</span>
              <Badge label={String(stats.letters.final)} color="success" />
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-variant/20 rounded-lg">
              <span className="text-on-surface-variant">Sent</span>
              <Badge label={String(stats.letters.sent)} color="info" />
            </div>
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
              <span className="text-primary font-medium">This Week</span>
              <Badge label={String(stats.letters.thisWeek)} color="primary" />
            </div>
          </div>
        </Card>

        {/* Correspondence Summary */}
        <Card variant="elevated" className="bg-surface p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-info">forum</span>
            <h3 className="text-lg font-bold text-on-surface">Correspondence</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-info/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-info">{stats.correspondence.incoming}</div>
                <div className="text-xs text-on-surface-variant">Incoming</div>
              </div>
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-success">{stats.correspondence.outgoing}</div>
                <div className="text-xs text-on-surface-variant">Outgoing</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-surface-variant/20 rounded-lg">
              <span className="text-on-surface-variant">Pending</span>
              <Badge label={String(stats.correspondence.pending)} color="warning" />
            </div>
            {stats.correspondence.overdue > 0 && (
              <div className="flex justify-between items-center p-3 bg-error/10 rounded-lg">
                <span className="text-error">Overdue</span>
                <Badge label={String(stats.correspondence.overdue)} color="error" />
              </div>
            )}
          </div>
        </Card>

        {/* Tasks Summary */}
        <Card variant="elevated" className="bg-surface p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-warning">task</span>
            <h3 className="text-lg font-bold text-on-surface">Tasks</h3>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-surface-variant/20 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-on-surface-variant">Completion Rate</span>
                <span className="font-bold text-on-surface">{stats.tasks.completionRate}%</span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-2">
                <div
                  className="bg-success rounded-full h-2 transition-all duration-500"
                  style={{ width: `${stats.tasks.completionRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-warning/10 rounded-lg text-center">
                <div className="text-xl font-bold text-warning">{stats.tasks.pending}</div>
                <div className="text-xs text-on-surface-variant">Pending</div>
              </div>
              <div className="p-2 bg-info/10 rounded-lg text-center">
                <div className="text-xl font-bold text-info">{stats.tasks.inProgress}</div>
                <div className="text-xs text-on-surface-variant">In Progress</div>
              </div>
              <div className="p-2 bg-success/10 rounded-lg text-center">
                <div className="text-xl font-bold text-success">{stats.tasks.completed}</div>
                <div className="text-xs text-on-surface-variant">Done</div>
              </div>
            </div>
            {stats.tasks.overdue > 0 && (
              <div className="flex justify-between items-center p-3 bg-error/10 rounded-lg">
                <span className="text-error">Overdue Tasks</span>
                <Badge label={String(stats.tasks.overdue)} color="error" />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Documents by Category */}
      <Card variant="elevated" className="bg-surface p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-success">folder</span>
          <h3 className="text-lg font-bold text-on-surface">Documents by Category</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {DOCUMENT_CATEGORIES.map(cat => {
            const count = stats.documents.byCategory[cat.value] || 0;
            const percentage = stats.documents.total > 0 
              ? Math.round((count / stats.documents.total) * 100) 
              : 0;

            return (
              <div
                key={cat.value}
                className="p-4 rounded-xl border border-outline/20 text-center hover:bg-surface-variant/10 transition-all"
              >
                <span className="material-symbols-outlined text-2xl text-primary mb-2">{cat.icon}</span>
                <div className="font-bold text-xl text-on-surface">{count}</div>
                <div className="text-xs text-on-surface-variant">{cat.label}</div>
                <div className="w-full bg-surface-variant rounded-full h-1 mt-2">
                  <div
                    className="bg-primary rounded-full h-1"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Monthly Trends */}
      <Card variant="elevated" className="bg-surface p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">trending_up</span>
          <h3 className="text-lg font-bold text-on-surface">Monthly Trends (Last 6 Months)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline/20">
                <th className="text-left py-3 px-4 text-on-surface-variant font-medium">Month</th>
                <th className="text-center py-3 px-4 text-on-surface-variant font-medium">Letters</th>
                <th className="text-center py-3 px-4 text-on-surface-variant font-medium">Correspondence</th>
                <th className="text-center py-3 px-4 text-on-surface-variant font-medium">Documents</th>
                <th className="text-center py-3 px-4 text-on-surface-variant font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.monthly.map((month, index) => {
                const total = month.letters + month.correspondence + month.documents;
                const isCurrentMonth = index === stats.monthly.length - 1;

                return (
                  <tr 
                    key={month.month} 
                    className={`border-b border-outline/10 ${isCurrentMonth ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-3 px-4 font-medium text-on-surface">
                      {month.month}
                      {isCurrentMonth && <Badge label="Current" color="primary" className="ml-2 text-xs" />}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge label={String(month.letters)} color="primary" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge label={String(month.correspondence)} color="info" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge label={String(month.documents)} color="success" />
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-on-surface">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alerts & Notifications */}
      <Card variant="elevated" className="bg-surface p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-warning">notifications</span>
          <h3 className="text-lg font-bold text-on-surface">Alerts & Notifications</h3>
        </div>
        <div className="space-y-3">
          {stats.tasks.overdue > 0 && (
            <div className="flex items-center gap-3 p-4 bg-error/10 rounded-xl">
              <span className="material-symbols-outlined text-error">warning</span>
              <div className="flex-1">
                <div className="font-medium text-error">Overdue Tasks</div>
                <div className="text-sm text-on-surface-variant">
                  You have {stats.tasks.overdue} overdue task(s) that require attention.
                </div>
              </div>
              <Badge label={String(stats.tasks.overdue)} color="error" />
            </div>
          )}

          {stats.correspondence.overdue > 0 && (
            <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-xl">
              <span className="material-symbols-outlined text-warning">schedule</span>
              <div className="flex-1">
                <div className="font-medium text-warning">Pending Correspondence</div>
                <div className="text-sm text-on-surface-variant">
                  {stats.correspondence.overdue} correspondence item(s) are overdue.
                </div>
              </div>
              <Badge label={String(stats.correspondence.overdue)} color="warning" />
            </div>
          )}

          {stats.documents.expiringSoon > 0 && (
            <div className="flex items-center gap-3 p-4 bg-info/10 rounded-xl">
              <span className="material-symbols-outlined text-info">event</span>
              <div className="flex-1">
                <div className="font-medium text-info">Documents Expiring</div>
                <div className="text-sm text-on-surface-variant">
                  {stats.documents.expiringSoon} document(s) will expire within 30 days.
                </div>
              </div>
              <Badge label={String(stats.documents.expiringSoon)} color="info" />
            </div>
          )}

          {stats.storage.percentage > 80 && (
            <div className="flex items-center gap-3 p-4 bg-error/10 rounded-xl">
              <span className="material-symbols-outlined text-error">storage</span>
              <div className="flex-1">
                <div className="font-medium text-error">Storage Warning</div>
                <div className="text-sm text-on-surface-variant">
                  Storage usage is at {stats.storage.percentage}%. Consider cleaning up old data.
                </div>
              </div>
            </div>
          )}

          {stats.tasks.overdue === 0 && 
           stats.correspondence.overdue === 0 && 
           stats.documents.expiringSoon === 0 &&
           stats.storage.percentage <= 80 && (
            <div className="flex items-center gap-3 p-4 bg-success/10 rounded-xl">
              <span className="material-symbols-outlined text-success">check_circle</span>
              <div className="flex-1">
                <div className="font-medium text-success">All Clear!</div>
                <div className="text-sm text-on-surface-variant">
                  No pending alerts. Everything is up to date.
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReportsDashboard;