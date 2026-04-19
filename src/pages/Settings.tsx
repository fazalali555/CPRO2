
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, TextField } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { BackupService } from '../services/BackupService';
import { useToast } from '../contexts/ToastContext';
import { resetBudgetingStorage } from '../budgeting/budget/storage';
import { auditService } from '../services/SecurityService';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => localStorage.getItem('clerk_pro_auto_backup_enabled') === 'true');
  const [lastAutoBackup, setLastAutoBackup] = useState(() => localStorage.getItem('clerk_pro_auto_backup_at') || '');
  const [integrations, setIntegrations] = useState(() => {
    const raw = localStorage.getItem('clerk_pro_integration_config');
    return raw ? JSON.parse(raw) : {
      emis: { endpoint: '', lastSync: '' },
      hrmis: { endpoint: '', lastSync: '' },
      finance: { endpoint: '', lastSync: '' }
    };
  });

  useEffect(() => {
    localStorage.setItem('clerk_pro_auto_backup_enabled', autoBackupEnabled ? 'true' : 'false');
  }, [autoBackupEnabled]);

  useEffect(() => {
    localStorage.setItem('clerk_pro_integration_config', JSON.stringify(integrations));
  }, [integrations]);

  const handleBackup = async () => {
    showToast('Preparing secure backup...', 'info');
    const success = await BackupService.createFullBackup();
    if (success) {
      showToast('Backup downloaded successfully', 'success');
      auditService.log('BACKUP_CREATED', 'Full system backup created');
    } else {
      showToast('Backup failed', 'error');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('Restoring will overwrite current data. Continue?')) {
      showToast('Restoring data...', 'info');
      const success = await BackupService.restoreFromBackup(file);
      if (success) {
        showToast('System restored. Reloading...', 'success');
        auditService.log('BACKUP_RESTORED', 'System restored from backup file');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('Restore failed: Invalid or corrupted backup file', 'error');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runAutoSnapshot = async () => {
    const success = await BackupService.createAutoSnapshot();
    if (success) {
      const ts = localStorage.getItem('clerk_pro_auto_backup_at') || '';
      setLastAutoBackup(ts);
      showToast('Auto snapshot saved locally', 'success');
      auditService.log('AUTO_BACKUP', 'Auto backup snapshot created');
    } else {
      showToast('Auto snapshot failed', 'error');
    }
  };

  const syncIntegration = (key: 'emis' | 'hrmis' | 'finance') => {
    const next = {
      ...integrations,
      [key]: { ...integrations[key], lastSync: new Date().toISOString() }
    };
    setIntegrations(next);
    auditService.log('INTEGRATION_SYNC', `Synced ${key.toUpperCase()} endpoint`);
    showToast(`${key.toUpperCase()} sync completed`, 'success');
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <PageHeader title="Settings" subtitle="System configuration and security" />
      
      <div className="space-y-6">
        {/* Security & Compliance */}
        <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-2">Security & Compliance</div>
        
        <Card variant="outlined" className="p-0 overflow-hidden bg-surface-container-low border-l-4 border-l-primary">
           <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <AppIcon name="security" />
                 </div>
                 <div>
                    <div className="font-bold">Encryption Status</div>
                    <div className="text-xs text-on-surface-variant">256-bit simulated encryption active for backups and sharing</div>
                 </div>
              </div>
              <div className="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold rounded uppercase">Protected</div>
           </div>

           <button 
             onClick={handleBackup}
             className="w-full flex items-center gap-4 p-4 hover:bg-surface-variant/50 transition-colors text-left border-b border-outline-variant/20"
           >
              <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg">
                 <AppIcon name="cloud_download" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-on-surface">Secure Full Backup</div>
                 <div className="text-xs text-on-surface-variant">Export encrypted .bak file containing all cases, employees, and documents</div>
              </div>
              <AppIcon name="chevron_right" className="text-on-surface-variant/50" />
           </button>

           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full flex items-center gap-4 p-4 hover:bg-surface-variant/50 transition-colors text-left border-b border-outline-variant/20"
           >
              <div className="p-2 bg-tertiary-container text-on-tertiary-container rounded-lg">
                 <AppIcon name="cloud_upload" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-on-surface">Restore System</div>
                 <div className="text-xs text-on-surface-variant">Restore entire database from a previously exported backup file</div>
              </div>
              <AppIcon name="chevron_right" className="text-on-surface-variant/50" />
           </button>
           <input type="file" ref={fileInputRef} onChange={handleRestore} className="hidden" accept=".bak" />

           <button 
             onClick={() => {
                const logs = auditService.getAllLogs();
                const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `AuditLogs_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                showToast('Audit logs exported', 'success');
             }}
             className="w-full flex items-center gap-4 p-4 hover:bg-surface-variant/50 transition-colors text-left"
           >
              <div className="p-2 bg-surface-variant text-on-surface-variant rounded-lg">
                 <AppIcon name="history_edu" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-on-surface">Export Audit Trails</div>
                 <div className="text-xs text-on-surface-variant">Download detailed history of all sensitive operations for compliance</div>
              </div>
              <AppIcon name="chevron_right" className="text-on-surface-variant/50" />
           </button>
        </Card>

        <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-2">Automation & Integration</div>
        <Card variant="outlined" className="p-0 overflow-hidden bg-surface-container-low">
           <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-primary/10 text-primary rounded-lg">
                 <AppIcon name="schedule" />
               </div>
               <div>
                 <div className="font-bold">Automated Backup</div>
                 <div className="text-xs text-on-surface-variant">Daily encrypted snapshot stored locally for offline recovery</div>
               </div>
             </div>
             <Button variant="outlined" label={autoBackupEnabled ? 'Enabled' : 'Disabled'} onClick={() => setAutoBackupEnabled(!autoBackupEnabled)} />
           </div>
           <div className="p-4 flex items-center justify-between border-b border-outline-variant/20">
             <div className="text-xs text-on-surface-variant">Last auto snapshot: {lastAutoBackup ? new Date(lastAutoBackup).toLocaleString() : 'Never'}</div>
             <Button variant="tonal" label="Run Now" icon="bolt" onClick={runAutoSnapshot} />
           </div>
           <div className="p-4 space-y-4">
             <div className="text-sm font-bold text-on-surface-variant uppercase">Government Systems</div>
             <div className="grid grid-cols-1 gap-3">
               <div className="flex items-center gap-3">
                 <TextField label="EMIS Endpoint" icon="school" value={integrations.emis.endpoint} onChange={e => setIntegrations({ ...integrations, emis: { ...integrations.emis, endpoint: e.target.value } })} className="flex-1" />
                 <Button variant="tonal" label="Sync" icon="sync" onClick={() => syncIntegration('emis')} />
               </div>
               <div className="flex items-center gap-3">
                 <TextField label="HRMIS Endpoint" icon="badge" value={integrations.hrmis.endpoint} onChange={e => setIntegrations({ ...integrations, hrmis: { ...integrations.hrmis, endpoint: e.target.value } })} className="flex-1" />
                 <Button variant="tonal" label="Sync" icon="sync" onClick={() => syncIntegration('hrmis')} />
               </div>
               <div className="flex items-center gap-3">
                 <TextField label="Finance Endpoint" icon="account_balance" value={integrations.finance.endpoint} onChange={e => setIntegrations({ ...integrations, finance: { ...integrations.finance, endpoint: e.target.value } })} className="flex-1" />
                 <Button variant="tonal" label="Sync" icon="sync" onClick={() => syncIntegration('finance')} />
               </div>
             </div>
           </div>
        </Card>

        {/* Data Management */}
        <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-2">Data Management</div>
        
        <Card variant="outlined" className="p-0 overflow-hidden bg-surface-container-low">
           <div className="w-full flex items-center gap-4 p-4 border-b border-outline-variant/20">
              <div className="p-2 bg-error text-white rounded-lg">
                 <AppIcon name="cached" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-on-surface">Reset Budget Caches</div>
                 <div className="text-xs text-on-surface-variant">Clear BM-2/BM-6 posts, overrides, projections and snapshots</div>
              </div>
              <Button 
                variant="filled" 
                label="Reset Now" 
                icon="restart_alt" 
                onClick={() => { 
                  try { 
                    resetBudgetingStorage(); 
                    showToast('Budget caches reset. Please reload BM-2/BM-6.', 'success'); 
                  } catch { 
                    showToast('Failed to reset caches', 'error'); 
                  } 
                }} 
              />
           </div>
           <button 
             onClick={() => navigate('/settings/import-export')}
             className="w-full flex items-center gap-4 p-4 hover:bg-surface-variant/50 transition-colors text-left border-b border-outline-variant/20"
           >
              <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg">
                 <AppIcon name="import_export" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-on-surface">Import / Export</div>
                 <div className="text-xs text-on-surface-variant">CSV backup and restore for employee data</div>
              </div>
              <AppIcon name="chevron_right" className="text-on-surface-variant/50" />
           </button>

           <button 
             onClick={() => navigate('/settings/payroll-db')}
             className="w-full flex items-center gap-4 p-4 hover:bg-surface-variant/50 transition-colors text-left border-b border-outline-variant/20"
           >
              <div className="p-2 bg-tertiary-container text-on-tertiary-container rounded-lg">
                 <AppIcon name="database" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-on-surface">System Configuration</div>
                 <div className="text-xs text-on-surface-variant">Manage payroll rules, allowances, and DB schema</div>
              </div>
              <AppIcon name="chevron_right" className="text-on-surface-variant/50" />
           </button>

           <button 
             onClick={() => navigate('/settings/payroll-pdf-import')}
             className="w-full flex items-center gap-4 p-4 hover:bg-surface-variant/50 transition-colors text-left border-b border-outline-variant/20"
           >
              <div className="p-2 bg-primary-container text-on-primary-container rounded-lg">
                 <AppIcon name="picture_as_pdf" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-on-surface">Payroll PDF Import</div>
                 <div className="text-xs text-on-surface-variant">Extract official payroll PDF and update employees</div>
              </div>
              <AppIcon name="chevron_right" className="text-on-surface-variant/50" />
           </button>

           <button 
             onClick={() => navigate('/settings/duplicates')}
             className="w-full flex items-center gap-4 p-4 hover:bg-surface-variant/50 transition-colors text-left border-b border-outline-variant/20"
           >
              <div className="p-2 bg-error-container text-on-error-container rounded-lg">
                 <AppIcon name="content_copy" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-on-surface">Remove Duplicates</div>
                 <div className="text-xs text-on-surface-variant">Merge or delete duplicate employee records</div>
              </div>
              <AppIcon name="chevron_right" className="text-on-surface-variant/50" />
           </button>

           <button 
             onClick={() => navigate('/settings/reset')}
             className="w-full flex items-center gap-4 p-4 hover:bg-surface-variant/50 transition-colors text-left group"
           >
              <div className="p-2 bg-error text-white rounded-lg">
                 <AppIcon name="delete_forever" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-error">Reset Data</div>
                 <div className="text-xs text-on-surface-variant">Clear all employees and cases (Danger Zone)</div>
              </div>
              <AppIcon name="chevron_right" className="text-on-surface-variant/50" />
           </button>
        </Card>

        {/* General Settings Placeholder */}
        <div className="text-sm font-bold text-on-surface-variant uppercase tracking-wider ml-2 mt-6">Application</div>
        
        <Card variant="outlined" className="p-0 overflow-hidden bg-surface-container-low opacity-60">
           <div className="w-full flex items-center gap-4 p-4 text-left cursor-not-allowed">
              <div className="p-2 bg-surface-variant text-on-surface-variant rounded-lg">
                 <AppIcon name="palette" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-on-surface">Appearance</div>
                 <div className="text-xs text-on-surface-variant">Theme customization (Coming Soon)</div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};
