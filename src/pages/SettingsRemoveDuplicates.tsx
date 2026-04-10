
import React, { useState, useEffect } from 'react';
import { EmployeeRecord, CaseRecord } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, Checkbox, Badge } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { useToast } from '../contexts/ToastContext';
import { detectDuplicateGroups, DuplicateGroup } from '../utils';

import { useEmployeeContext } from '../contexts/EmployeeContext';

export const SettingsRemoveDuplicates: React.FC = () => {
  const { employees, cases, setEmployees, setCases } = useEmployeeContext();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [loading, setLoading] = useState(true);

  // Analysis Effect
  useEffect(() => {
    const runDetection = () => {
      const detected = detectDuplicateGroups(employees);
      setGroups(detected);
      setLoading(false);
    };
    // Defer to allow UI render
    setTimeout(runDetection, 100);
  }, [employees]);

  const handleResolve = (groupId: string) => {
    const g = groups.find(x => x.groupId === groupId);
    if (g) setSelectedGroup(g);
  };

  const handleProcessComplete = () => {
    setSelectedGroup(null);
    setLoading(true);
    setTimeout(() => {
        const detected = detectDuplicateGroups(employees);
        setGroups(detected);
        setLoading(false);
    }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <PageHeader 
        title="Remove Duplicate Employees" 
        subtitle="Advanced Tool to merge or delete duplicate records" 
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
         <Card variant="filled" className="text-center bg-surface-container-low">
            <div className="text-xs uppercase text-on-surface-variant">Total Employees</div>
            <div className="text-2xl font-bold">{employees.length}</div>
         </Card>
         <Card variant="filled" className="text-center bg-surface-container-low">
            <div className="text-xs uppercase text-on-surface-variant">Duplicate Groups</div>
            <div className="text-2xl font-bold text-error">{groups.length}</div>
         </Card>
         <Card variant="filled" className="text-center bg-surface-container-low">
            <div className="text-xs uppercase text-on-surface-variant">Records Affected</div>
            <div className="text-2xl font-bold text-error">
                {groups.reduce((acc, g) => acc + g.ids.length, 0)}
            </div>
         </Card>
         <Card variant="filled" className="text-center bg-surface-container-low">
            <div className="text-xs uppercase text-on-surface-variant">Clean Records</div>
            <div className="text-2xl font-bold text-success">
                {employees.length - groups.reduce((acc, g) => acc + g.ids.length, 0)}
            </div>
         </Card>
      </div>

      {loading ? (
        <div className="p-8 text-center text-on-surface-variant animate-pulse">Analyzing records...</div>
      ) : (
        <div className="space-y-4">
           {groups.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant">
                 <AppIcon name="check_circle" size={48} className="text-success mb-4 opacity-50" />
                 <h3 className="text-xl font-bold">No Duplicates Found</h3>
                 <p>Your employee database is clean.</p>
              </div>
           )}

           {groups.map(group => (
             <Card key={group.groupId} variant="outlined" className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:bg-surface-container-low transition-colors">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">Group ({group.ids.length} records)</span>
                      {group.reasons.map(r => (
                         <Badge key={r} label={r} color="error" />
                      ))}
                   </div>
                   <div className="text-xs text-on-surface-variant font-mono">
                      IDs: {group.ids.join(', ')}
                   </div>
                </div>
                <Button 
                   variant="filled" 
                   label="Review & Resolve" 
                   icon="content_copy" 
                   onClick={() => handleResolve(group.groupId)} 
                />
             </Card>
           ))}
        </div>
      )}

      {selectedGroup && (
         <ReviewModal 
            group={selectedGroup} 
            allEmployees={employees}
            allCases={cases}
            onClose={() => setSelectedGroup(null)}
            onResolve={(newEmployees, newCases) => {
               setEmployees(newEmployees);
               setCases(newCases);
               handleProcessComplete();
               showToast('Duplicates resolved successfully', 'success');
            }}
         />
      )}
    </div>
  );
};

// --- SUB COMPONENT: REVIEW MODAL ---

interface ReviewModalProps {
  group: DuplicateGroup;
  allEmployees: EmployeeRecord[];
  allCases: CaseRecord[];
  onClose: () => void;
  onResolve: (emp: EmployeeRecord[], cases: CaseRecord[]) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ group, allEmployees, allCases, onClose, onResolve }) => {
  const records = group.ids.map(id => allEmployees.find(e => e.id === id)).filter(Boolean) as EmployeeRecord[];
  
  const [selectedId, setSelectedId] = useState<string>(records[0]?.id || '');
  const [merge, setMerge] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<'compare' | 'confirm'>('compare');

  // Fields to compare
  const fields = [
    { label: 'Name', path: 'employees.name' },
    { label: 'CNIC', path: 'employees.cnic_no' },
    { label: 'Personnel No', path: 'employees.personal_no' },
    { label: 'Father Name', path: 'employees.father_name' },
    { label: 'Designation', path: 'employees.designation' },
    { label: 'BPS', path: 'employees.bps' },
    { label: 'Date of Birth', path: 'employees.dob' },
    { label: 'Bank Account', path: 'employees.bank_ac_no' },
    { label: 'GPF Account', path: 'employees.gpf_account_no' },
    { label: 'Date of Appt', path: 'service_history.date_of_appointment' },
  ];

  // Helper to get nested value
  const getVal = (obj: any, path: string) => path.split('.').reduce((o, i) => o?.[i], obj);

  const handleConfirm = () => {
    if (confirmText !== 'DELETE') return;

    const keptOriginal = records.find(r => r.id === selectedId);
    if (!keptOriginal) return;

    // 1. Prepare Merged Record
    let finalRecord = JSON.parse(JSON.stringify(keptOriginal)); // Deep copy

    if (merge) {
       records.forEach(source => {
          if (source.id === selectedId) return; // Skip self
          
          // Merge Logic: Recursive strategy is complex, let's do shallow merge of key sections
          // A) Employees Identity
          Object.keys(source.employees).forEach(key => {
             // @ts-ignore
             if (!finalRecord.employees[key] && source.employees[key]) {
                // @ts-ignore
                finalRecord.employees[key] = source.employees[key];
             }
          });

          // B) Service
          Object.keys(source.service_history).forEach(key => {
             // @ts-ignore
             if (!finalRecord.service_history[key] && source.service_history[key]) {
                // @ts-ignore
                finalRecord.service_history[key] = source.service_history[key];
             }
          });

          // C) Financials
          Object.keys(source.financials).forEach(key => {
             // @ts-ignore
             const targetVal = finalRecord.financials[key];
             // @ts-ignore
             const sourceVal = source.financials[key];
             
             // Handle Arrays/Objects (Arrears, Extras)
             if (typeof sourceVal === 'object' && sourceVal !== null && !Array.isArray(sourceVal)) {
                 // Deep merge for numbers in maps
                 const mergedMap = { ...targetVal }; // Start with target
                 Object.keys(sourceVal).forEach(k => {
                     const tV = mergedMap[k];
                     const sV = sourceVal[k];
                     if (!tV && sV) mergedMap[k] = sV; // If missing/zero in target, take source
                 });
                 // @ts-ignore
                 finalRecord.financials[key] = mergedMap;
             }
             // If numeric and target is 0 but source has value, take source
             else if (typeof targetVal === 'number' && targetVal === 0 && sourceVal > 0) {
                // @ts-ignore
                finalRecord.financials[key] = sourceVal;
             }
          });

          // D) Extras (Merge keys)
          finalRecord.extras = { ...source.extras, ...finalRecord.extras };
          
          // E) Family Members (Simple concat for now, maybe dedup in future)
          // Just taking unique by name/cnic is safer
          source.family_members.forEach(m => {
             if (!finalRecord.family_members.some((fm: any) => fm.cnic === m.cnic || fm.relative_name === m.relative_name)) {
                finalRecord.family_members.push(m);
             }
          });
       });
    }

    // 2. Re-point Cases
    const idsToDelete = group.ids.filter(id => id !== selectedId);
    const updatedCases = allCases.map(c => {
       if (idsToDelete.includes(c.employee_id)) {
          return { ...c, employee_id: selectedId, updatedAt: new Date().toISOString() };
       }
       return c;
    });

    // 3. Update Employees List
    const remainingEmployees = allEmployees.filter(e => !idsToDelete.includes(e.id));
    const finalEmployees = remainingEmployees.map(e => e.id === selectedId ? finalRecord : e);

    onResolve(finalEmployees, updatedCases);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
       <div className="bg-surface-container-low w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-outline-variant flex justify-between items-center">
             <div>
                <h2 className="text-xl font-bold">Resolve Duplicate Conflict</h2>
                <p className="text-sm text-on-surface-variant">Review duplicates and select the master record to keep.</p>
             </div>
             <button onClick={onClose}><AppIcon name="close" /></button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
             {step === 'compare' ? (
                <>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr>
                               <th className="p-2 border-b border-outline-variant w-48 sticky left-0 bg-surface-container-low z-10 font-bold">Field</th>
                               {records.map((rec, idx) => (
                                  <th key={rec.id} className={`p-2 border-b border-outline-variant min-w-[200px] ${selectedId === rec.id ? 'bg-primary-container/30' : ''}`}>
                                     <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                           type="radio" 
                                           name="keep" 
                                           checked={selectedId === rec.id} 
                                           onChange={() => setSelectedId(rec.id)} 
                                           className="w-4 h-4"
                                        />
                                        <span className="font-bold">Record {idx + 1}</span>
                                     </label>
                                     <div className="text-[10px] text-on-surface-variant font-mono mt-1">{rec.id}</div>
                                  </th>
                               ))}
                            </tr>
                         </thead>
                         <tbody>
                            {fields.map(f => (
                               <tr key={f.path} className="hover:bg-surface-variant/20">
                                  <td className="p-2 border-b border-outline-variant/30 font-medium sticky left-0 bg-surface-container-low z-10">{f.label}</td>
                                  {records.map(rec => (
                                     <td key={rec.id} className={`p-2 border-b border-outline-variant/30 text-sm ${selectedId === rec.id ? 'bg-primary-container/10 font-bold' : ''}`}>
                                        {getVal(rec, f.path) || <span className="text-on-surface-variant/30 italic">Empty</span>}
                                     </td>
                                  ))}
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>

                   <div className="mt-6 bg-surface-variant/30 p-4 rounded-xl">
                      <Checkbox 
                         label="Merge missing data from deleted records into the kept record?" 
                         checked={merge} 
                         onChange={(e) => setMerge(e.target.checked)} 
                      />
                      <p className="text-xs text-on-surface-variant ml-8 mt-1">
                         If enabled, empty fields in the selected record will be filled using data from the duplicates being deleted.
                         Cases associated with deleted records will be re-linked to the kept record automatically.
                      </p>
                   </div>
                </>
             ) : (
                <div className="max-w-md mx-auto text-center py-8">
                   <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4 text-error">
                      <AppIcon name="warning" size={32} />
                   </div>
                   <h3 className="text-xl font-bold mb-2">Confirm Deletion</h3>
                   <p className="text-on-surface-variant mb-6">
                      You are about to delete <strong>{records.length - 1}</strong> duplicate records. 
                      This action cannot be undone. Cases linked to deleted records will be moved to the kept record.
                   </p>
                   <div className="mb-6 text-left bg-surface p-4 rounded border border-outline-variant">
                      <label className="block text-xs font-bold mb-1">Type "DELETE" to confirm:</label>
                      <input 
                         type="text" 
                         className="w-full border border-outline-variant rounded p-2" 
                         value={confirmText}
                         onChange={e => setConfirmText(e.target.value)}
                         placeholder="DELETE"
                      />
                   </div>
                </div>
             )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-outline-variant flex justify-end gap-2 bg-surface-container-low">
             {step === 'compare' ? (
                <>
                   <Button variant="text" label="Cancel" onClick={onClose} />
                   <Button variant="filled" label="Review Deletion" onClick={() => setStep('confirm')} />
                </>
             ) : (
                <>
                   <Button variant="text" label="Back" onClick={() => setStep('compare')} />
                   <Button 
                      variant="filled" 
                      label="Confirm & Delete" 
                      className="bg-error text-white" 
                      disabled={confirmText !== 'DELETE'}
                      onClick={handleConfirm}
                   />
                </>
             )}
          </div>

       </div>
    </div>
  );
};
