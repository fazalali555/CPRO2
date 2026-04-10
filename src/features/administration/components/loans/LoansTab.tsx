import React, { useState } from 'react';
import { Button, Badge, TextField, SelectField, Card } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useEmployeeContext } from '../../../../contexts/EmployeeContext';
import { useLoans } from '../../hooks/useLoans';
import { LoanApplication } from '../../types';
import { StatCard } from '../shared/StatCard';
import { ApplicationViewer } from '../shared/ApplicationViewer';

export const LoansTab: React.FC = () => {
  const { t, isUrdu } = useLanguage();
  const { employees } = useEmployeeContext();
  const { applications, addApplication, updateStatus, statistics } = useLoans();
  
  const [showForm, setShowForm] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [editingLoan, setEditingLoan] = useState<LoanApplication | null>(null);
  
  const [employeeId, setEmployeeId] = useState('');
  const [loanType, setLoanType] = useState<LoanApplication['loanType']>('HBA');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [installments, setInstallments] = useState('60');
  const [guarantor1, setGuarantor1] = useState('');
  const [guarantor2, setGuarantor2] = useState('');

  const handleAdd = () => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp || !amount || !purpose) {
      alert('Please fill all required fields');
      return;
    }

    addApplication({
      employeeId,
      employeeName: emp.employees.name,
      loanType,
      amount: Number(amount),
      purpose,
      installments: Number(installments),
      guarantor1,
      guarantor2,
    } as any);

    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setEmployeeId('');
    setAmount('');
    setPurpose('');
    setInstallments('60');
    setGuarantor1('');
    setGuarantor2('');
  };

  const handleView = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setShowViewer(true);
  };

  const handlePrint = () => {
    if (!selectedLoan) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const emp = employees.find(e => e.id === selectedLoan.employeeId);
    const monthlyInstallment = selectedLoan.amount / ((selectedLoan as any).installments || 60);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Loan Application - ${selectedLoan.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 10px; }
          .logo { font-size: 24px; font-weight: bold; }
          .section { margin: 20px 0; }
          .field { margin: 10px 0; display: flex; }
          .label { font-weight: bold; width: 250px; }
          .value { flex: 1; border-bottom: 1px dotted #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #000; padding: 10px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .undertaking { border: 2px solid #000; padding: 15px; margin: 20px 0; background: #f9f9f9; }
          .signature-section { margin-top: 60px; }
          .signature-box { display: inline-block; width: 45%; margin: 10px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">GOVERNMENT OF KHYBER PAKHTUNKHWA</div>
          <h2>ELEMENTARY & SECONDARY EDUCATION DEPARTMENT</h2>
          <h3>${selectedLoan.loanType === 'HBA' ? 'HOUSE BUILDING ADVANCE' : 'VEHICLE ADVANCE'} APPLICATION</h3>
          <p>Application No: LOAN-${selectedLoan.id}</p>
        </div>
        
        <div class="section">
          <h3 style="background: #e0e0e0; padding: 8px;">PART-A: PERSONAL INFORMATION</h3>
          <div class="field">
            <div class="label">1. Name of Applicant:</div>
            <div class="value">${selectedLoan.employeeName}</div>
          </div>
          <div class="field">
            <div class="label">2. Personal Number:</div>
            <div class="value">${emp?.employees.personal_no || ''}</div>
          </div>
          <div class="field">
            <div class="label">3. Designation:</div>
            <div class="value">${emp?.employees.designation || ''}</div>
          </div>
          <div class="field">
            <div class="label">4. BPS:</div>
            <div class="value">${emp?.employees.bps || ''}</div>
          </div>
          <div class="field">
            <div class="label">5. Date of Birth:</div>
            <div class="value">${emp?.employees.date_of_birth ? new Date(emp.employees.date_of_birth).toLocaleDateString() : ''}</div>
          </div>
          <div class="field">
            <div class="label">6. Date of Appointment:</div>
            <div class="value">${emp?.service_history.date_of_appointment ? new Date(emp.service_history.date_of_appointment).toLocaleDateString() : ''}</div>
          </div>
          <div class="field">
            <div class="label">7. Present Office:</div>
            <div class="value">${emp?.employees.school_full_name || ''}</div>
          </div>
        </div>

        <div class="section">
          <h3 style="background: #e0e0e0; padding: 8px;">PART-B: LOAN DETAILS</h3>
          <div class="field">
            <div class="label">1. Type of Advance:</div>
            <div class="value">${selectedLoan.loanType === 'HBA' ? 'House Building Advance' : 'Vehicle Advance'}</div>
          </div>
          <div class="field">
            <div class="label">2. Amount Applied:</div>
            <div class="value"><strong>PKR ${selectedLoan.amount.toLocaleString()}</strong></div>
          </div>
          <div class="field">
            <div class="label">3. Purpose:</div>
            <div class="value">${selectedLoan.purpose}</div>
          </div>
          <div class="field">
            <div class="label">4. No. of Installments:</div>
            <div class="value">${(selectedLoan as any).installments || 60} months</div>
          </div>
          <div class="field">
            <div class="label">5. Monthly Installment:</div>
            <div class="value">PKR ${monthlyInstallment.toFixed(2)}</div>
          </div>
        </div>

        <div class="section">
          <h3 style="background: #e0e0e0; padding: 8px;">PART-C: GUARANTORS</h3>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name of Guarantor</th>
                <th>Designation</th>
                <th>Signature</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${(selectedLoan as any).guarantor1 || ''}</td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>2</td>
                <td>${(selectedLoan as any).guarantor2 || ''}</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="undertaking">
          <h4>UNDERTAKING</h4>
          <p>I, <strong>${selectedLoan.employeeName}</strong>, hereby undertake that:</p>
          <ol>
            <li>The information provided above is correct to the best of my knowledge.</li>
            <li>I have not availed any ${selectedLoan.loanType} before or if availed, it has been fully paid.</li>
            <li>I undertake to repay the advance in ${(selectedLoan as any).installments || 60} monthly installments.</li>
            <li>In case of retirement/death, the outstanding amount will be recovered from my final dues/family.</li>
            <li>I authorize the department to deduct monthly installments from my salary.</li>
          </ol>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <p>Date: _______________</p>
            <br><br>
            <p>________________________________</p>
            <p><strong>Signature of Applicant</strong></p>
          </div>
          <div class="signature-box" style="float: right;">
            <p>Date: _______________</p>
            <br><br>
            <p>________________________________</p>
            <p><strong>Signature of Controlling Officer</strong></p>
          </div>
        </div>

        <div style="clear: both; margin-top: 40px; border-top: 2px solid #000; padding-top: 20px;">
          <h4>FOR OFFICE USE ONLY</h4>
          <div class="field">
            <div class="label">Recommended / Not Recommended:</div>
            <div class="value"></div>
          </div>
          <div class="field">
            <div class="label">Remarks:</div>
            <div class="value"></div>
          </div>
          <br>
          <div class="signature-box">
            <p>________________________________</p>
            <p><strong>District Education Officer</strong></p>
          </div>
        </div>

        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 30px; background: #007bff; color: white; border: none; cursor: pointer; font-size: 16px;">
          PRINT APPLICATION
        </button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns: Column<LoanApplication>[] = [
    {
      key: 'id',
      header: '#',
      render: (_, index) => <span className="font-mono text-xs">{index + 1}</span>,
      className: 'w-12',
    },
    {
      key: 'employee',
      header: isUrdu ? 'ملازم' : 'Employee',
      render: (app) => <span className="font-medium">{app.employeeName}</span>,
    },
    {
      key: 'type',
      header: isUrdu ? 'قسم' : 'Type',
      render: (app) => (
        <Badge 
          variant={app.loanType === 'HBA' ? 'primary' : 'default'}
          label={app.loanType}
        />
      ),
    },
    {
      key: 'amount',
      header: isUrdu ? 'رقم' : 'Amount',
      render: (app) => (
        <span className="font-mono font-bold">PKR {app.amount.toLocaleString()}</span>
      ),
      className: 'text-right',
    },
    {
      key: 'purpose',
      header: isUrdu ? 'مقصد' : 'Purpose',
      render: (app) => <div className="text-sm max-w-xs truncate">{app.purpose}</div>,
    },
    {
      key: 'status',
      header: isUrdu ? 'حالت' : 'Status',
      render: (app) => (
        <Badge 
          variant={
            app.status === 'Approved' ? 'success' : 
            app.status === 'Rejected' ? 'error' : 
            'warning'
          }
          label={app.status}
        />
      ),
    },
    {
      key: 'actions',
      header: isUrdu ? 'کارروائی' : 'Actions',
      render: (app) => (
        <div className="flex gap-1">
          <Button 
            variant="text" 
            label={isUrdu ? 'دیکھیں' : 'View'} 
            icon="visibility"
            onClick={() => handleView(app)}
            className="h-7 text-[10px] px-2"
          />
          {app.status === 'Submitted' && (
            <>
              <Button 
                variant="text" 
                label="✓"
                onClick={() => updateStatus(app.id, 'Approved')}
                className="h-7 text-[10px] px-2 text-success"
              />
              <Button 
                variant="text" 
                label="✗"
                onClick={() => updateStatus(app.id, 'Rejected')}
                className="h-7 text-[10px] px-2 text-error"
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {isUrdu ? 'قرضے' : 'HBA & Vehicle Loans'}
        </h3>
        <div className="flex gap-2">
          <Button variant="outlined" label="Export" icon="download" />
          <Button 
            variant="filled" 
            label={isUrdu ? 'نئی درخواست' : 'New Application'} 
            icon="add" 
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }} 
          />
        </div>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        <StatCard label="Total" value={statistics.total.toString()} icon="directions_car" color="text-primary" />
        <StatCard label="HBA" value={statistics.hba.toString()} icon="home" color="text-blue-500" />
        <StatCard label="Vehicle" value={statistics.vehicle.toString()} icon="directions_car" color="text-green-500" />
        <StatCard label="Approved" value={`PKR ${(statistics.approvedAmount / 1000000).toFixed(1)}M`} icon="payments" color="text-success" />
      </div>

      {showForm && (
        <Card variant="outlined" className="bg-surface p-4">
          <h4 className="font-bold mb-4">New Loan Application</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Employee" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">Select</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.employees.name} • {e.employees.personal_no}</option>
              ))}
            </SelectField>
            <SelectField label="Loan Type" value={loanType} onChange={e => setLoanType(e.target.value as LoanApplication['loanType'])}>
              <option value="HBA">House Building Advance</option>
              <option value="Vehicle">Vehicle Loan</option>
            </SelectField>
            <TextField label="Amount (PKR)" type="number" icon="payments" value={amount} onChange={e => setAmount(e.target.value)} />
            <TextField label="Installments (months)" type="number" value={installments} onChange={e => setInstallments(e.target.value)} />
            <TextField label="Purpose" icon="description" value={purpose} onChange={e => setPurpose(e.target.value)} className="md:col-span-2" />
            <TextField label="Guarantor 1 Name" icon="person" value={guarantor1} onChange={e => setGuarantor1(e.target.value)} />
            <TextField label="Guarantor 2 Name" icon="person" value={guarantor2} onChange={e => setGuarantor2(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outlined" label="Cancel" onClick={() => setShowForm(false)} />
            <Button variant="filled" label="Submit Application" icon="send" onClick={handleAdd} />
          </div>
        </Card>
      )}

      <DataTable
        data={applications}
        columns={columns}
        emptyState={{
          icon: 'directions_car',
          title: 'No applications',
          description: 'Loan applications will appear here',
        }}
      />

      {showViewer && selectedLoan && (
        <ApplicationViewer
          title={`${selectedLoan.loanType === 'HBA' ? 'House Building' : 'Vehicle'} Loan Application`}
          applicationNumber={`LOAN-${selectedLoan.id}`}
          status={selectedLoan.status}
          statusVariant={
            selectedLoan.status === 'Approved' ? 'success' : 
            selectedLoan.status === 'Rejected' ? 'error' : 
            'warning'
          }
          sections={[
            {
              title: 'Employee Information',
              icon: 'person',
              fields: [
                { label: 'Name', value: selectedLoan.employeeName },
                { label: 'Personal No.', value: employees.find(e => e.id === selectedLoan.employeeId)?.employees.personal_no || 'N/A' },
                { label: 'Designation', value: employees.find(e => e.id === selectedLoan.employeeId)?.employees.designation || 'N/A' },
                { label: 'BPS', value: employees.find(e => e.id === selectedLoan.employeeId)?.employees.bps || 'N/A' },
              ],
            },
            {
              title: 'Loan Details',
              icon: 'payments',
              fields: [
                { label: 'Type', value: selectedLoan.loanType, type: 'badge', variant: 'primary' },
                { label: 'Amount', value: selectedLoan.amount, type: 'currency' },
                { label: 'Purpose', value: selectedLoan.purpose },
                { label: 'Installments', value: `${(selectedLoan as any).installments || 60} months` },
                { label: 'Monthly Installment', value: (selectedLoan.amount / ((selectedLoan as any).installments || 60)).toFixed(2), type: 'currency' },
                { label: 'Guarantor 1', value: (selectedLoan as any).guarantor1 || 'N/A' },
                { label: 'Guarantor 2', value: (selectedLoan as any).guarantor2 || 'N/A' },
                { label: 'Submitted', value: selectedLoan.submittedAt, type: 'date' },
              ],
            },
          ]}
          onPrint={handlePrint}
          onApprove={() => {
            updateStatus(selectedLoan.id, 'Approved');
            setShowViewer(false);
          }}
          onReject={() => {
            updateStatus(selectedLoan.id, 'Rejected');
            setShowViewer(false);
          }}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  );
};
