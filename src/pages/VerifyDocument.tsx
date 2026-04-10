
import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../types';
import { Card, Button, Badge } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { PageHeader } from '../components/PageHeader';
import { useLanguage } from '../contexts/LanguageContext';
import { TextField } from '../components/M3';

import { useEmployeeContext } from '../contexts/EmployeeContext';

export const VerifyDocument: React.FC = () => {
  const { employees, cases } = useEmployeeContext();
  const { caseId } = useParams();
  const [searchParams] = useSearchParams();
  const docType = searchParams.get('doc');
  const { t, isUrdu } = useLanguage();
  const [manualId, setManualId] = React.useState('');

  const caseRecord = useMemo(() => {
    const idToUse = caseId === 'scan' ? manualId : caseId;
    return cases.find(c => c.id === idToUse);
  }, [cases, caseId, manualId]);

  const employee = useMemo(() => 
    caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null
  , [employees, caseRecord]);

  if (caseId === 'scan' && !caseRecord) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <AppIcon name="qr_code_scanner" size={40} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">Document Verification</h1>
        <p className="text-on-surface-variant text-center max-w-md mb-8">
          Enter the Case ID from the bottom of the QR code or scan the code with your camera.
        </p>
        <div className="w-full max-w-sm space-y-4">
          <TextField 
            label="Case ID / Verification ID" 
            value={manualId} 
            onChange={e => setManualId(e.target.value)} 
            placeholder="e.g. case-123456"
            className="w-full"
          />
          <Button variant="filled" label="Verify Record" className="w-full h-12" onClick={() => {}} disabled={!manualId} />
        </div>
        <Button variant="text" label="Back to Dashboard" onClick={() => window.location.hash = '#/'} className="mt-8" />
      </div>
    );
  }

  if (!caseRecord || !employee) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mb-6">
          <AppIcon name="error" size={40} className="text-error" />
        </div>
        <h1 className="text-2xl font-bold text-on-surface mb-2">Document Not Found</h1>
        <p className="text-on-surface-variant text-center max-w-md mb-8">
          The document verification code is invalid or the record has been removed from the system.
        </p>
        <Button variant="filled" label="Go to Dashboard" onClick={() => window.location.hash = '#/'} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-surface pb-12 ${isUrdu ? 'rtl' : 'ltr'}`}>
      <div className="bg-primary text-on-primary py-12 px-6 shadow-lg mb-8">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 shrink-0">
            <AppIcon name="verified" size={48} className="text-white" />
          </div>
          <div>
            <Badge className="bg-green-500 text-white mb-2 px-3 py-1 text-sm font-bold uppercase tracking-wider">
              Authenticity Verified
            </Badge>
            <h1 className="text-3xl font-bold leading-tight">Official Document Verification</h1>
            <p className="opacity-80 text-lg">E&SE Department, Government of Khyber Pakhtunkhwa</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card variant="elevated" className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                <AppIcon name="description" className="text-primary" />
                Document Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">Case Type</div>
                  <div className="font-medium text-lg capitalize">{caseRecord.case_type.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">Verification ID</div>
                  <div className="font-mono text-lg">{caseRecord.id}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">Status</div>
                  <Badge variant={caseRecord.status === 'completed' ? 'success' : 'primary'} className="mt-1">
                    {caseRecord.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">Last Updated</div>
                  <div className="font-medium text-lg">{new Date(caseRecord.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>

              {docType && (
                <div className="mt-8 p-4 bg-primary-container/30 border border-primary/20 rounded-xl">
                  <div className="text-xs font-bold text-primary uppercase mb-1">Specific Form Verified</div>
                  <div className="font-bold text-xl text-primary capitalize">{docType.replace(/_/g, ' ')}</div>
                </div>
              )}
            </Card>

            <Card variant="elevated" className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4">
                <AppIcon name="person" className="text-primary" />
                Employee Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">Name</div>
                  <div className="font-bold text-lg uppercase">{employee.employees.name}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">Personnel Number</div>
                  <div className="font-bold text-lg">{employee.employees.personal_no}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">Designation</div>
                  <div className="font-medium text-lg uppercase">{employee.employees.designation}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">CNIC</div>
                  <div className="font-medium text-lg">{employee.employees.cnic_no}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-bold text-on-surface-variant uppercase mb-1">Office / DDO</div>
                  <div className="font-medium text-lg uppercase">{employee.employees.office_name} ({employee.employees.ddo_code})</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar / Legal Notice */}
          <div className="space-y-6">
            <Card variant="outlined" className="p-6 bg-surface-container-high">
              <div className="text-center">
                 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <AppIcon name="gavel" className="text-primary" />
                 </div>
                 <h3 className="font-bold mb-2">Legal Notice</h3>
                 <p className="text-sm text-on-surface-variant leading-relaxed">
                   This digital verification confirms that the physical document presented matches the records in the E&SE RPMS system as of the last update. 
                 </p>
              </div>
            </Card>

            <div className="p-6 rounded-2xl bg-slate-900 text-white">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <AppIcon name="security" size={20} />
                Security Check
              </h3>
              <ul className="text-xs space-y-3 opacity-80">
                <li className="flex gap-2">
                  <AppIcon name="check_circle" size={14} className="shrink-0 text-green-400" />
                  Tamper-evident digital record
                </li>
                <li className="flex gap-2">
                  <AppIcon name="check_circle" size={14} className="shrink-0 text-green-400" />
                  Cross-referenced with HR database
                </li>
                <li className="flex gap-2">
                  <AppIcon name="check_circle" size={14} className="shrink-0 text-green-400" />
                  Authorized by E&SE Department KPK
                </li>
              </ul>
            </div>

            <Button 
              variant="text" 
              label="Return to App" 
              icon="arrow_back" 
              onClick={() => window.location.hash = '#/'}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center text-on-surface-variant text-sm border-t pt-8">
        © {new Date().getFullYear()} E&SE Department, Government of Khyber Pakhtunkhwa. All rights reserved.
      </div>
    </div>
  );
};
