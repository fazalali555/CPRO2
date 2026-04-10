
import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, TextField, SelectField, EmptyState, Checkbox } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { DataTable } from '../components/DataTable';
import { useToast } from '../contexts/ToastContext';
import { PayrollService } from '../services/PayrollService';
import { PrEmployee, PrDDO, PrPeriod, PrPayroll, PrPosting, PrBankAccount, PrPayrollCode, PayrollCodeType } from '../types';

export const SettingsPayrollDb: React.FC = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [refresh, setRefresh] = useState(0);
  const { showToast } = useToast();

  const reload = () => setRefresh(prev => prev + 1);

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <PageHeader title="System Configuration" subtitle="Manage Payroll Rules & Schema" />
      
      <div className="flex overflow-x-auto gap-2 border-b border-outline-variant mb-6 pb-1">
        {['employees', 'ddos', 'periods', 'payroll', 'configuration'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-bold capitalize whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'employees' && <EmployeesManager key={refresh} onUpdate={reload} />}
      {activeTab === 'ddos' && <DDOManager key={refresh} onUpdate={reload} />}
      {activeTab === 'periods' && <PeriodManager key={refresh} onUpdate={reload} />}
      {activeTab === 'payroll' && <PayrollManager key={refresh} onUpdate={reload} />}
      {activeTab === 'configuration' && <ConfigurationManager key={refresh} onUpdate={reload} />}
    </div>
  );
};

// --- SUB COMPONENTS ---

const EmployeesManager = ({ onUpdate }: any) => {
  const [employees, setEmployees] = useState<PrEmployee[]>([]);
  const [editing, setEditing] = useState<Partial<PrEmployee> | null>(null);
  const [subTab, setSubTab] = useState<'info' | 'postings' | 'banks'>('info');
  const { showToast } = useToast();

  useEffect(() => {
    setEmployees(PayrollService.getEmployees());
  }, []);

  const handleSave = () => {
    try {
      if (!editing) return;
      if (!editing.personnel_no || !editing.cnic_no || !editing.name) {
        throw new Error("Name, Personnel No, and CNIC are required.");
      }
      // Normalization
      const payload = { ...editing } as PrEmployee;
      if (payload.cnic_no) payload.cnic_no = payload.cnic_no.replace(/-/g, '');
      
      const saved = PayrollService.saveEmployee(payload);
      setEditing(saved); // Update ID if new
      setEmployees(PayrollService.getEmployees());
      showToast('Employee saved', 'success');
      onUpdate();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleEdit = (emp: PrEmployee) => {
    setEditing(emp);
    setSubTab('info');
  };

  const handleApplyRules = () => {
    if (confirm("This will update Gender and Staff Type for ALL employees based on CNIC and Designation rules. Continue?")) {
      const count = PayrollService.applyRulesToAllEmployees();
      setEmployees(PayrollService.getEmployees());
      showToast(`Updated ${count} employees`, 'success');
      onUpdate();
    }
  };

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="text" icon="arrow_back" onClick={() => setEditing(null)} />
          <h3 className="font-bold text-xl">Editing: {editing.name || 'New Employee'}</h3>
        </div>

        <div className="flex border-b border-outline-variant mb-4">
           <button onClick={() => setSubTab('info')} className={`px-4 py-2 border-b-2 font-bold ${subTab==='info' ? 'border-primary text-primary' : 'border-transparent'}`}>Basic Info</button>
           <button onClick={() => setSubTab('postings')} disabled={!editing.employee_id} className={`px-4 py-2 border-b-2 font-bold ${subTab==='postings' ? 'border-primary text-primary' : 'border-transparent disabled:opacity-50'}`}>Postings</button>
           <button onClick={() => setSubTab('banks')} disabled={!editing.employee_id} className={`px-4 py-2 border-b-2 font-bold ${subTab==='banks' ? 'border-primary text-primary' : 'border-transparent disabled:opacity-50'}`}>Bank Accounts</button>
        </div>

        {subTab === 'info' && (
          <Card variant="outlined" className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField label="Name" required value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
              <TextField label="Father Name" value={editing.father_name} onChange={e => setEditing({...editing, father_name: e.target.value})} />
              <TextField label="CNIC (13 digits)" required value={editing.cnic_no} onChange={e => setEditing({...editing, cnic_no: e.target.value})} maxLength={13} placeholder="No dashes" />
              
              <TextField label="Personnel No" required value={editing.personnel_no} onChange={e => setEditing({...editing, personnel_no: e.target.value})} />
              <TextField label="NTN No" value={editing.ntn_no} onChange={e => setEditing({...editing, ntn_no: e.target.value})} />
              <TextField label="Nationality" value={editing.nationality} onChange={e => setEditing({...editing, nationality: e.target.value})} />
              
              <TextField label="DOB (DD.MM.YYYY)" value={editing.dob} onChange={e => setEditing({...editing, dob: e.target.value})} placeholder="DD.MM.YYYY" />
              <TextField label="Entry Date (DD.MM.YYYY)" value={editing.date_of_entry} onChange={e => setEditing({...editing, date_of_entry: e.target.value})} placeholder="DD.MM.YYYY" />
              <TextField label="Employment Category" value={editing.employment_category} onChange={e => setEditing({...editing, employment_category: e.target.value})} placeholder="Permanent/Temporary" />
              
              <TextField label="Designation (Short)" value={editing.designation_short} onChange={e => setEditing({...editing, designation_short: e.target.value})} />
              <TextField label="Designation (Full)" value={editing.designation_full} onChange={e => setEditing({...editing, designation_full: e.target.value})} className="md:col-span-2" />
              <TextField label="BPS" value={editing.bps} onChange={e => setEditing({...editing, bps: e.target.value})} />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="filled" label="Save Changes" icon="save" onClick={handleSave} />
            </div>
          </Card>
        )}

        {subTab === 'postings' && editing.employee_id && (
           <PostingsManager employeeId={editing.employee_id} />
        )}

        {subTab === 'banks' && editing.employee_id && (
           <BanksManager employeeId={editing.employee_id} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4 gap-2">
        <Button variant="tonal" label="Apply Gender/Staff Rules" icon="update" onClick={handleApplyRules} />
        <Button variant="filled" label="Add New Employee" icon="add" onClick={() => setEditing({})} />
      </div>
      <DataTable 
        data={employees}
        columns={[
          { header: 'Name', accessor: (e: any) => e.name },
          { header: 'CNIC', accessor: (e: any) => e.cnic_no },
          { header: 'Personnel #', accessor: (e: any) => e.personnel_no },
          { header: 'Desig.', accessor: (e: any) => e.designation_short },
          { header: 'Actions', accessor: (e: any) => <Button variant="tonal" icon="edit" label="Edit" className="h-8" onClick={() => handleEdit(e)} /> }
        ]}
      />
    </div>
  );
};

const PostingsManager = ({ employeeId }: { employeeId: string }) => {
  const [postings, setPostings] = useState<PrPosting[]>([]);
  const [isEditing, setIsEditing] = useState<Partial<PrPosting> | null>(null);
  const [ddos, setDdos] = useState<PrDDO[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    setPostings(PayrollService.getPostings(employeeId));
    setDdos(PayrollService.getDDOs());
  }, [employeeId]);

  const handleSave = () => {
    if (!isEditing?.ddo_code) return showToast("DDO Code required", "error");
    PayrollService.savePosting({ ...isEditing, employee_id: employeeId } as PrPosting);
    setPostings(PayrollService.getPostings(employeeId));
    setIsEditing(null);
    showToast("Posting saved", "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete posting?")) {
      PayrollService.deletePosting(id);
      setPostings(PayrollService.getPostings(employeeId));
    }
  };

  return (
    <Card variant="outlined" className="p-4">
       <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Posting History</h3>
          <Button variant="tonal" icon="add" label="Add Posting" onClick={() => setIsEditing({})} />
       </div>
       
       {isEditing && (
         <div className="bg-surface-variant/30 p-4 rounded-lg mb-4 grid grid-cols-2 gap-4">
            <SelectField label="DDO" value={isEditing.ddo_code} onChange={(e:any) => setIsEditing({...isEditing, ddo_code: e.target.value})}>
               <option value="">Select DDO</option>
               {ddos.map(d => <option key={d.ddo_code} value={d.ddo_code}>{d.office_name} ({d.ddo_code})</option>)}
            </SelectField>
            <TextField label="School/Office Name" value={isEditing.school_full_name} onChange={e => setIsEditing({...isEditing, school_full_name: e.target.value})} />
            <TextField label="Start Date" type="date" value={isEditing.start_date} onChange={e => setIsEditing({...isEditing, start_date: e.target.value})} />
            <TextField label="End Date" type="date" value={isEditing.end_date} onChange={e => setIsEditing({...isEditing, end_date: e.target.value})} />
            <div className="col-span-2 flex justify-end gap-2">
               <Button variant="text" label="Cancel" onClick={() => setIsEditing(null)} />
               <Button variant="filled" label="Save" onClick={handleSave} />
            </div>
         </div>
       )}

       <DataTable data={postings} columns={[
          { header: 'DDO', accessor: (p: any) => p.ddo_code },
          { header: 'Office', accessor: (p: any) => p.school_full_name },
          { header: 'Start', accessor: (p: any) => p.start_date || '-' },
          { header: 'End', accessor: (p: any) => p.end_date || 'Present' },
          { header: '', accessor: (p: any) => <Button variant="text" icon="delete" className="text-error" onClick={() => handleDelete(p.posting_id)} /> }
       ]} />
    </Card>
  );
};

const BanksManager = ({ employeeId }: { employeeId: string }) => {
  const [banks, setBanks] = useState<PrBankAccount[]>([]);
  const [isEditing, setIsEditing] = useState<Partial<PrBankAccount> | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setBanks(PayrollService.getBankAccounts(employeeId));
  }, [employeeId]);

  const handleSave = () => {
    if (!isEditing?.bank_ac_no) return showToast("Account No required", "error");
    PayrollService.saveBankAccount({ ...isEditing, employee_id: employeeId } as PrBankAccount);
    setBanks(PayrollService.getBankAccounts(employeeId));
    setIsEditing(null);
    showToast("Bank account saved", "success");
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete bank account?")) {
      PayrollService.deleteBankAccount(id);
      setBanks(PayrollService.getBankAccounts(employeeId));
    }
  };

  return (
    <Card variant="outlined" className="p-4">
       <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Bank Accounts</h3>
          <Button variant="tonal" icon="add" label="Add Account" onClick={() => setIsEditing({ is_primary: true })} />
       </div>
       
       {isEditing && (
         <div className="bg-surface-variant/30 p-4 rounded-lg mb-4 grid grid-cols-2 gap-4">
            <TextField label="Bank Name" value={isEditing.bank_name} onChange={e => setIsEditing({...isEditing, bank_name: e.target.value})} />
            <TextField label="Branch Name" value={isEditing.branch_name} onChange={e => setIsEditing({...isEditing, branch_name: e.target.value})} />
            <TextField label="Account No" value={isEditing.bank_ac_no} onChange={e => setIsEditing({...isEditing, bank_ac_no: e.target.value})} />
            <TextField label="Branch Code" value={isEditing.branch_code} onChange={e => setIsEditing({...isEditing, branch_code: e.target.value})} />
            <div className="col-span-2">
               <Checkbox label="Primary Account" checked={!!isEditing.is_primary} onChange={e => setIsEditing({...isEditing, is_primary: e.target.checked})} />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
               <Button variant="text" label="Cancel" onClick={() => setIsEditing(null)} />
               <Button variant="filled" label="Save" onClick={handleSave} />
            </div>
         </div>
       )}

       <DataTable data={banks} columns={[
          { header: 'Bank', accessor: (b: any) => b.bank_name },
          { header: 'Branch', accessor: (b: any) => `${b.branch_name} (${b.branch_code})` },
          { header: 'Account No', accessor: (b: any) => b.bank_ac_no },
          { header: 'Status', accessor: (b: any) => b.is_primary ? <span className="text-green-700 font-bold text-xs">PRIMARY</span> : <span className="text-gray-500 text-xs">SECONDARY</span> },
          { header: '', accessor: (b: any) => <Button variant="text" icon="delete" className="text-error" onClick={() => handleDelete(b.bank_account_id)} /> }
       ]} />
    </Card>
  );
};

const ConfigurationManager = ({ onUpdate }: any) => {
  const [activeType, setActiveType] = useState<PayrollCodeType>('allowance');
  const [codes, setCodes] = useState<PrPayrollCode[]>([]);
  const [editing, setEditing] = useState<Partial<PrPayrollCode> | null>(null);
  const { showToast } = useToast();

  const refreshCodes = () => {
    setCodes(PayrollService.getCodes(activeType));
  };

  useEffect(() => {
    refreshCodes();
  }, [activeType]);

  const handleSave = () => {
    if (!editing?.code || !editing.db_short || !editing.label) {
      showToast('All fields required', 'error');
      return;
    }
    PayrollService.saveCode({ ...editing, type: activeType } as PrPayrollCode);
    setEditing(null);
    refreshCodes();
    showToast('Code saved', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this code definition?')) {
      PayrollService.deleteCode(id);
      refreshCodes();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-outline-variant pb-1">
         {['allowance', 'deduction', 'loan'].map(t => (
           <button 
             key={t}
             onClick={() => setActiveType(t as PayrollCodeType)} 
             className={`px-4 py-2 font-bold capitalize ${activeType === t ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}`}
           >
             {t}s
           </button>
         ))}
      </div>

      {!editing ? (
        <>
          <div className="flex justify-between items-center mb-4">
             <div className="text-sm text-on-surface-variant italic">Add/Edit fields for dynamic payroll calculations (e.g., Adhoc Relief 2026).</div>
             <Button variant="filled" label={`Add ${activeType}`} icon="add" onClick={() => setEditing({})} />
          </div>
          <DataTable
            data={codes}
            columns={
              activeType === 'allowance'
                ? [
                    { header: 'Code', accessor: (c: any) => c.code },
                    {
                      header: 'DB Short',
                      accessor: (c: any) => (
                        <span className="font-mono bg-surface-variant px-2 py-1 rounded text-xs">
                          {c.db_short}
                        </span>
                      )
                    },
                    { header: 'Label', accessor: (c: any) => c.label },
                    { header: 'GL BPS ≥16', accessor: (c: any) => c.object_code_high || '' },
                    { header: 'GL BPS <16', accessor: (c: any) => c.object_code_low || '' },
                    { header: 'Change Code', accessor: (c: any) => c.change_code || '' },
                    {
                      header: 'Actions',
                      accessor: (c: any) => (
                        <div className="flex gap-2">
                          <Button variant="text" icon="edit" onClick={() => setEditing(c)} />
                          <Button
                            variant="text"
                            icon="delete"
                            className="text-error"
                            onClick={() => handleDelete(c.id)}
                          />
                        </div>
                      )
                    }
                  ]
                : [
                    { header: 'Code', accessor: (c: any) => c.code },
                    {
                      header: 'DB Short',
                      accessor: (c: any) => (
                        <span className="font-mono bg-surface-variant px-2 py-1 rounded text-xs">
                          {c.db_short}
                        </span>
                      )
                    },
                    { header: 'Label', accessor: (c: any) => c.label },
                    {
                      header: 'Actions',
                      accessor: (c: any) => (
                        <div className="flex gap-2">
                          <Button variant="text" icon="edit" onClick={() => setEditing(c)} />
                          <Button
                            variant="text"
                            icon="delete"
                            className="text-error"
                            onClick={() => handleDelete(c.id)}
                          />
                        </div>
                      )
                    }
                  ]
            }
          />
        </>
      ) : (
        <Card variant="outlined" className="p-4 space-y-4 max-w-lg mx-auto">
           <h3 className="font-bold">Edit {activeType} Definition</h3>
           <TextField label="Code (e.g. 2450)" value={editing.code} onChange={e => setEditing({...editing, code: e.target.value})} />
           <TextField label="DB Short Name (e.g. adhoc_2026)" value={editing.db_short} onChange={e => setEditing({...editing, db_short: e.target.value})} />
           <TextField label="Label (e.g. Adhoc Relief 2026)" value={editing.label} onChange={e => setEditing({...editing, label: e.target.value})} />
           {activeType === 'allowance' && (
             <>
               <TextField
                 label="GL Code BPS ≥16 (e.g. A01101)"
                 value={editing.object_code_high || ''}
                 onChange={e => setEditing({ ...editing, object_code_high: e.target.value })}
               />
               <TextField
                 label="GL Code BPS <16 (e.g. A01151)"
                 value={editing.object_code_low || ''}
                 onChange={e => setEditing({ ...editing, object_code_low: e.target.value })}
               />
               <TextField
                 label="Change Code (optional)"
                 value={editing.change_code || ''}
                 onChange={e => setEditing({ ...editing, change_code: e.target.value })}
               />
             </>
           )}
           <div className="flex justify-end gap-2">
              <Button variant="text" label="Cancel" onClick={() => setEditing(null)} />
              <Button variant="filled" label="Save" onClick={handleSave} />
           </div>
        </Card>
      )}
    </div>
  );
};

const DDOManager = ({ onUpdate }: any) => {
  const [list, setList] = useState<PrDDO[]>([]);
  const [editing, setEditing] = useState<Partial<PrDDO> | null>(null);
  const { showToast } = useToast();

  useEffect(() => setList(PayrollService.getDDOs()), []);

  const handleSave = () => {
    try {
      if(!editing?.ddo_code) throw new Error("DDO Code required");
      PayrollService.saveDDO(editing as PrDDO);
      setEditing(null);
      setList(PayrollService.getDDOs());
      showToast('DDO Saved', 'success');
    } catch(e: any) { showToast(e.message, 'error'); }
  };

  return (
    <div>
      {!editing ? (
        <>
          <div className="flex justify-end mb-4"><Button variant="filled" label="Add DDO" icon="add" onClick={() => setEditing({})} /></div>
          <DataTable data={list} columns={[
            { header: 'Code', accessor: (d: any) => d.ddo_code },
            { header: 'Office Name', accessor: (d: any) => d.office_name },
            { header: 'Edit', accessor: (d: any) => <Button variant="text" icon="edit" onClick={() => setEditing(d)} /> }
          ]} />
        </>
      ) : (
        <Card variant="outlined" className="p-4 space-y-4">
          <TextField label="DDO Code" value={editing.ddo_code} onChange={e => setEditing({...editing, ddo_code: e.target.value})} />
          <TextField label="Office Name" value={editing.office_name} onChange={e => setEditing({...editing, office_name: e.target.value})} />
          <div className="flex justify-end gap-2"><Button variant="text" label="Cancel" onClick={() => setEditing(null)} /><Button variant="filled" label="Save" onClick={handleSave} /></div>
        </Card>
      )}
    </div>
  );
};

const PeriodManager = ({ onUpdate }: any) => {
  const [list, setList] = useState<PrPeriod[]>([]);
  const [ddos, setDdos] = useState<PrDDO[]>([]);
  const [editing, setEditing] = useState<Partial<PrPeriod> | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setList(PayrollService.getPeriods());
    setDdos(PayrollService.getDDOs());
  }, []);

  const handleSave = () => {
    try {
      if (!editing?.ddo_code || !editing.period_year || !editing.period_month) throw new Error("Required fields missing");
      const label = `${editing.period_month}-${editing.period_year}`;
      PayrollService.savePeriod({ ...editing, statement_label: label } as PrPeriod);
      setEditing(null);
      setList(PayrollService.getPeriods());
      showToast('Period Saved', 'success');
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  return (
    <div>
      {!editing ? (
        <>
          <div className="flex justify-end mb-4"><Button variant="filled" label="Create Period" icon="add" onClick={() => setEditing({ period_year: new Date().getFullYear() })} /></div>
          <DataTable data={list} columns={[
            { header: 'DDO', accessor: (p: any) => p.ddo_code },
            { header: 'Label', accessor: (p: any) => p.statement_label },
            { header: 'Month', accessor: (p: any) => p.period_month },
            { header: 'Year', accessor: (p: any) => p.period_year },
          ]} />
        </>
      ) : (
        <Card variant="outlined" className="p-4 space-y-4">
          <SelectField label="DDO" value={editing.ddo_code} onChange={(e:any) => setEditing({...editing, ddo_code: e.target.value})}>
            <option value="">Select DDO</option>
            {ddos.map(d => <option key={d.ddo_code} value={d.ddo_code}>{d.ddo_code} - {d.office_name}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Month" value={editing.period_month} onChange={(e:any) => setEditing({...editing, period_month: e.target.value})}>
              <option value="">Select Month</option>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
            </SelectField>
            <TextField label="Year" type="number" value={editing.period_year} onChange={e => setEditing({...editing, period_year: Number(e.target.value)})} />
          </div>
          <div className="flex justify-end gap-2"><Button variant="text" label="Cancel" onClick={() => setEditing(null)} /><Button variant="filled" label="Save" onClick={handleSave} /></div>
        </Card>
      )}
    </div>
  );
};

const PayrollManager = ({ onUpdate }: any) => {
  const [periods, setPeriods] = useState<PrPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [editingPayroll, setEditingPayroll] = useState<PrPayroll | null>(null);
  const [employees, setEmployees] = useState<PrEmployee[]>([]);
  
  // Detail State
  const [detailsTab, setDetailsTab] = useState<'allowances'|'deductions'>('allowances');
  const [items, setItems] = useState<any[]>([]);
  const { showToast } = useToast();

  // Codes for dropdown
  const [availableCodes, setAvailableCodes] = useState<PrPayrollCode[]>([]);

  useEffect(() => {
    setPeriods(PayrollService.getPeriods());
    setEmployees(PayrollService.getEmployees());
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      setPayrolls(PayrollService.getPayrollByPeriod(selectedPeriod));
    } else {
      setPayrolls([]);
    }
  }, [selectedPeriod]);

  // Load items when editing a payroll record
  useEffect(() => {
    if (editingPayroll) {
      setItems(PayrollService.getItems(editingPayroll.payroll_id, detailsTab === 'allowances' ? 'allowances' : 'deductions'));
      setAvailableCodes(PayrollService.getCodes(detailsTab === 'allowances' ? 'allowance' : 'deduction'));
    }
  }, [editingPayroll, detailsTab]);

  const handleAddPayroll = (empId: string) => {
    try {
      const newPay = PayrollService.savePayroll({
        payroll_id: '',
        period_id: selectedPeriod,
        employee_id: empId,
        gross_pay: 0,
        total_deductions: 0,
        net_pay: 0
      });
      setPayrolls(PayrollService.getPayrollByPeriod(selectedPeriod));
      setEditingPayroll(newPay);
    } catch(e) { showToast('Error adding payroll', 'error'); }
  };

  const handleAddItem = (codeObj: any, amount: number) => {
    if (!editingPayroll) return;
    const type = detailsTab;
    const item: any = {
      payroll_id: editingPayroll.payroll_id,
      amount: amount
    };
    
    if (type === 'allowances') {
      item.wage_code = codeObj.code;
      item.wage_name = codeObj.label;
      item.db_short = codeObj.db_short;
    } else {
      item.ded_code = codeObj.code;
      item.ded_name = codeObj.label;
      item.db_short = codeObj.db_short;
    }

    PayrollService.saveItem(item, type as any);
    // Refresh items and parent
    setItems(PayrollService.getItems(editingPayroll.payroll_id, type as any));
    const updatedParent = PayrollService.getPayrollByPeriod(selectedPeriod).find(p => p.payroll_id === editingPayroll.payroll_id);
    if(updatedParent) setEditingPayroll(updatedParent); // Update totals in UI
  };

  const handleDeleteItem = (id: string) => {
    if(!editingPayroll) return;
    PayrollService.deleteItem(id, detailsTab === 'allowances' ? 'allowances' : 'deductions');
    setItems(PayrollService.getItems(editingPayroll.payroll_id, detailsTab === 'allowances' ? 'allowances' : 'deductions'));
    const updatedParent = PayrollService.getPayrollByPeriod(selectedPeriod).find(p => p.payroll_id === editingPayroll.payroll_id);
    if(updatedParent) setEditingPayroll(updatedParent);
  };

  if (!selectedPeriod) {
    return (
      <div className="space-y-4">
        <label className="block font-bold">Select Payroll Period</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {periods.map(p => (
            <Card key={p.period_id} variant="outlined" onClick={() => setSelectedPeriod(p.period_id)} className="cursor-pointer hover:bg-surface-variant">
              <div className="font-bold">{p.statement_label}</div>
              <div className="text-xs">{p.ddo_code}</div>
            </Card>
          ))}
        </div>
        {periods.length === 0 && <div className="text-gray-500">No periods found. Create one in Periods tab.</div>}
      </div>
    );
  }

  if (editingPayroll) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="text" icon="arrow_back" onClick={() => setEditingPayroll(null)} />
          <h3 className="font-bold text-xl">Payroll Entry Details</h3>
        </div>

        <Card variant="filled" className="grid grid-cols-3 gap-4 text-center">
           <div>
             <div className="text-xs uppercase">Gross Pay</div>
             <div className="font-bold text-xl">{editingPayroll.gross_pay}</div>
           </div>
           <div>
             <div className="text-xs uppercase">Deductions</div>
             <div className="font-bold text-xl text-error">{editingPayroll.total_deductions}</div>
           </div>
           <div>
             <div className="text-xs uppercase">Net Pay</div>
             <div className="font-bold text-xl text-primary">{editingPayroll.net_pay}</div>
           </div>
        </Card>

        <div className="flex gap-2 border-b border-outline-variant pb-1">
           <button onClick={() => setDetailsTab('allowances')} className={`px-4 py-2 font-bold ${detailsTab==='allowances' ? 'text-primary border-b-2 border-primary' : ''}`}>Allowances</button>
           <button onClick={() => setDetailsTab('deductions')} className={`px-4 py-2 font-bold ${detailsTab==='deductions' ? 'text-primary border-b-2 border-primary' : ''}`}>Deductions</button>
        </div>

        <div className="flex gap-2 items-end bg-surface-container-low p-2 rounded-lg">
           <SelectField label="Select Code" id="codeSelect" className="flex-grow">
              <option value="">-- Select --</option>
              {availableCodes.map(c => (
                 <option key={c.id} value={JSON.stringify(c)}>{c.code} - {c.label}</option>
              ))}
           </SelectField>
           <TextField label="Amount" id="amountInput" type="number" className="w-32" />
           <Button variant="filled" label="Add" onClick={() => {
              const select = document.getElementById('codeSelect') as HTMLSelectElement;
              const input = document.getElementById('amountInput') as HTMLInputElement;
              if (select.value && input.value) {
                 handleAddItem(JSON.parse(select.value), Number(input.value));
                 input.value = '';
              }
           }} />
        </div>

        <DataTable data={items} columns={[
           { header: 'Code', accessor: (i: any) => i.wage_code || i.ded_code },
           { header: 'Name', accessor: (i: any) => i.wage_name || i.ded_name },
           { header: 'Short', accessor: (i: any) => i.db_short },
           { header: 'Amount', accessor: (i: any) => i.amount },
           { header: '', accessor: (i: any) => <Button variant="text" icon="delete" className="text-error" onClick={() => handleDeleteItem(i.allow_id || i.ded_id)} /> }
        ]} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="text" icon="arrow_back" label="Back to Periods" onClick={() => setSelectedPeriod('')} />
        
        <div className="flex gap-2">
           <select id="empSelect" className="border p-2 rounded">
              <option value="">Select Employee to Add</option>
              {employees.map(e => <option key={e.employee_id} value={e.employee_id}>{e.name} ({e.personnel_no})</option>)}
           </select>
           <Button variant="filled" label="Add Entry" onClick={() => {
              const sel = document.getElementById('empSelect') as HTMLSelectElement;
              if(sel.value) handleAddPayroll(sel.value);
           }} />
        </div>
      </div>

      <DataTable data={payrolls} columns={[
        { header: 'Personnel No', accessor: (p: any) => p.personnel_no },
        { header: 'Name', accessor: (p: any) => p.employee_name },
        { header: 'Gross', accessor: (p: any) => p.gross_pay },
        { header: 'Net', accessor: (p: any) => p.net_pay },
        { header: 'Action', accessor: (p: any) => <Button variant="tonal" label="Edit" onClick={() => setEditingPayroll(p)} /> }
      ]} />
    </div>
  );
};
