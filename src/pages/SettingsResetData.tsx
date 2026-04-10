
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, TextField } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { useToast } from '../contexts/ToastContext';
import { clearCaseDocuments } from '../utils'; 
import { EmployeeRecord, CaseRecord } from '../types';

import { useEmployeeContext } from '../contexts/EmployeeContext';

export const SettingsResetData: React.FC = () => {
  const { setEmployees, setCases } = useEmployeeContext();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (confirmText !== 'RESET') return;
    setIsResetting(true);

    try {
      // 1. Clear LocalStorage
      localStorage.removeItem('kpk_rpms_employees');
      localStorage.removeItem('kpk_rpms_cases');
      localStorage.removeItem('kpk_rpms_last_export_csv');
      localStorage.removeItem('kpk_rpms_last_export_meta');
      
      // 2. Clear IDB Docs (Selective wipe of case documents)
      await clearCaseDocuments();

      // 3. Reset State in App
      setEmployees([]);
      setCases([]);

      showToast('All employees and cases removed.', 'success');
      navigate('/');
    } catch (e) {
      console.error(e);
      showToast('Failed to reset data', 'error');
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <PageHeader title="Reset Data" subtitle="Danger Zone" />
      
      <Card variant="outlined" className="p-6 border-error bg-error-container/10">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-error-container text-on-error-container rounded-full">
            <AppIcon name="warning" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-error">Warning: Irreversible Action</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              This action will <strong>permanently delete</strong>:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1 text-on-surface">
              <li>All Employee Records</li>
              <li>All Cases and Drafts</li>
              <li>All Uploaded Case Documents</li>
              <li>Cached CSV Exports</li>
            </ul>
            <p className="text-sm font-bold mt-4">
              It will NOT delete:
            </p>
            <ul className="list-disc list-inside text-sm mt-1 text-on-surface-variant">
              <li>PDF Templates (saved in system)</li>
              <li>App Settings / Theme</li>
              <li>Application Code</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold">
            Type <span className="font-mono text-error">RESET</span> to confirm:
          </label>
          <TextField 
            label="Confirmation" 
            value={confirmText} 
            onChange={e => setConfirmText(e.target.value)} 
            placeholder="RESET"
            className="bg-white"
          />
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="text" label="Cancel" onClick={() => navigate('/settings')} />
            <Button 
              variant="filled" 
              label={isResetting ? "Resetting..." : "Reset Data Now"} 
              icon="delete_forever" 
              className="bg-error text-white hover:bg-red-700" 
              disabled={confirmText !== 'RESET' || isResetting}
              onClick={handleReset}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
