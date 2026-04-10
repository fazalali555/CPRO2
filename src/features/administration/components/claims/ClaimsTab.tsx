import React, { useState } from 'react';
import { Button, Badge, TextField, SelectField, Card } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useEmployeeContext } from '../../../../contexts/EmployeeContext';
import { useMedicalClaims } from '../../hooks/useMedicalClaims';
import { MedicalClaim } from '../../types';
import { StatCard } from '../shared/StatCard';
import { ApplicationViewer } from '../shared/ApplicationViewer';

export const ClaimsTab: React.FC = () => {
  const { t, isUrdu } = useLanguage();
  const { employees } = useEmployeeContext();
  const { claims, addClaim, updateStatus, statistics } = useMedicalClaims();
  
  const [showForm, setShowForm] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<MedicalClaim | null>(null);
  const [editingClaim, setEditingClaim] = useState<MedicalClaim | null>(null);
  
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [claimType, setClaimType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [billDate, setBillDate] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [relationship, setRelationship] = useState('Self');

  const handleAdd = () => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp || !amount) {
      alert('Please select employee and enter amount');
      return;
    }

    const claimData = {
      employeeId,
      employeeName: emp.employees.name,
      amount: Number(amount) || 0,
      claimType: claimType || 'OPD',
      remarks,
      billDate,
      hospitalName,
      patientName: patientName || emp.employees.name,
      relationship,
    };

    if (editingClaim) {
      // Update existing claim (in real app)
      setEditingClaim(null);
    } else {
      addClaim(claimData);
    }

    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setEmployeeId('');
    setAmount('');
    setClaimType('');
    setRemarks('');
    setBillDate('');
    setHospitalName('');
    setPatientName('');
    setRelationship('Self');
  };

  const handleView = (claim: MedicalClaim) => {
    setSelectedClaim(claim);
    setShowViewer(true);
  };

  const handleEdit = (claim: MedicalClaim) => {
    setEditingClaim(claim);
    setEmployeeId(claim.employeeId);
    setAmount(claim.amount.toString());
    setClaimType(claim.claimType);
    setRemarks(claim.remarks || '');
    setBillDate((claim as any).billDate || '');
    setHospitalName((claim as any).hospitalName || '');
    setPatientName((claim as any).patientName || '');
    setRelationship((claim as any).relationship || 'Self');
    setShowForm(true);
  };

  const handlePrint = () => {
    if (!selectedClaim) return;
    
    // Create printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const emp = employees.find(e => e.id === selectedClaim.employeeId);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Claim - ${selectedClaim.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .field { margin: 10px 0; display: flex; }
          .label { font-weight: bold; width: 200px; }
          .value { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; }
          .signature { margin-top: 60px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MEDICAL REIMBURSEMENT CLAIM</h1>
          <p>Claim No: ${selectedClaim.id}</p>
        </div>
        
        <div class="section">
          <h3>Employee Information</h3>
          <div class="field">
            <div class="label">Name:</div>
            <div class="value">${selectedClaim.employeeName}</div>
          </div>
          <div class="field">
            <div class="label">Personal No:</div>
            <div class="value">${emp?.employees.personal_no || 'N/A'}</div>
          </div>
          <div class="field">
            <div class="label">Designation:</div>
            <div class="value">${emp?.employees.designation || 'N/A'}</div>
          </div>
          <div class="field">
            <div class="label">BPS:</div>
            <div class="value">${emp?.employees.bps || 'N/A'}</div>
          </div>
        </div>

        <div class="section">
          <h3>Claim Details</h3>
          <div class="field">
            <div class="label">Patient Name:</div>
            <div class="value">${(selectedClaim as any).patientName || selectedClaim.employeeName}</div>
          </div>
          <div class="field">
            <div class="label">Relationship:</div>
            <div class="value">${(selectedClaim as any).relationship || 'Self'}</div>
          </div>
          <div class="field">
            <div class="label">Claim Type:</div>
            <div class="value">${selectedClaim.claimType}</div>
          </div>
          <div class="field">
            <div class="label">Hospital/Clinic:</div>
            <div class="value">${(selectedClaim as any).hospitalName || 'N/A'}</div>
          </div>
          <div class="field">
            <div class="label">Bill Date:</div>
            <div class="value">${(selectedClaim as any).billDate ? new Date((selectedClaim as any).billDate).toLocaleDateString() : 'N/A'}</div>
          </div>
          <div class="field">
            <div class="label">Claim Amount:</div>
            <div class="value"><strong>PKR ${selectedClaim.amount.toLocaleString()}</strong></div>
          </div>
          <div class="field">
            <div class="label">Remarks:</div>
            <div class="value">${selectedClaim.remarks || 'N/A'}</div>
          </div>
        </div>

        <div class="section">
          <h3>Status</h3>
          <div class="field">
            <div class="label">Current Status:</div>
            <div class="value"><strong>${selectedClaim.status}</strong></div>
          </div>
          <div class="field">
            <div class="label">Submitted Date:</div>
            <div class="value">${new Date(selectedClaim.submittedAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="signature">
          <table>
            <tr>
              <td style="width: 50%;">
                <p>Signature of Employee</p>
                <br><br>
                _________________________
              </td>
              <td style="width: 50%;">
                <p>Signature of Approving Authority</p>
                <br><br>
                _________________________
              </td>
            </tr>
          </table>
        </div>

        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer;">
          Print This Document
        </button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns: Column<MedicalClaim>[] = [
    {
      key: 'id',
      header: isUrdu ? '#' : '#',
      render: (claim, index) => <span className="font-mono text-xs">{index + 1}</span>,
      className: 'w-12',
    },
    {
      key: 'employee',
      header: isUrdu ? 'ملازم' : 'Employee',
      render: (claim) => (
        <div>
          <div className="font-medium">{claim.employeeName}</div>
          <div className="text-xs text-on-surface-variant">{claim.claimType}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: isUrdu ? 'رقم' : 'Amount',
      render: (claim) => (
        <span className="font-mono font-bold">PKR {claim.amount.toLocaleString()}</span>
      ),
      className: 'text-right',
    },
    {
      key: 'date',
      header: isUrdu ? 'تاریخ' : 'Date',
      render: (claim) => (
        <span className="text-sm">{new Date(claim.submittedAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'status',
      header: isUrdu ? 'حالت' : 'Status',
      render: (claim) => (
        <Badge 
          variant={
            claim.status === 'Approved' ? 'success' : 
            claim.status === 'Rejected' ? 'error' : 
            'warning'
          }
          label={claim.status}
        />
      ),
    },
    {
      key: 'actions',
      header: isUrdu ? 'کارروائی' : 'Actions',
      render: (claim) => (
        <div className="flex gap-1">
          <Button 
            variant="text" 
            label={isUrdu ? 'دیکھیں' : 'View'} 
            icon="visibility"
            onClick={() => handleView(claim)}
            className="h-7 text-[10px] px-2"
          />
          <Button 
            variant="text" 
            label={isUrdu ? 'ترمیم' : 'Edit'} 
            icon="edit"
            onClick={() => handleEdit(claim)}
            className="h-7 text-[10px] px-2"
          />
          {claim.status === 'Submitted' && (
            <>
              <Button 
                variant="text" 
                label={isUrdu ? '✓' : '✓'} 
                onClick={() => updateStatus(claim.id, 'Approved')}
                className="h-7 text-[10px] px-2 text-success"
              />
              <Button 
                variant="text" 
                label={isUrdu ? '✗' : '✗'} 
                onClick={() => updateStatus(claim.id, 'Rejected')}
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
          {isUrdu ? 'طبی تلافی' : 'Medical Reimbursement Claims'}
        </h3>
        <div className="flex gap-2">
          <Button variant="outlined" label={isUrdu ? 'ایکسپورٹ' : 'Export'} icon="download" />
          <Button 
            variant="filled" 
            label={isUrdu ? 'نیا دعویٰ' : 'New Claim'} 
            icon="add" 
            onClick={() => {
              resetForm();
              setEditingClaim(null);
              setShowForm(!showForm);
            }} 
          />
        </div>
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        <StatCard 
          label={isUrdu ? 'کل دعوے' : 'Total Claims'} 
          value={statistics.total.toString()} 
          icon="medical_services" 
          color="text-primary" 
        />
        <StatCard 
          label={isUrdu ? 'زیر التواء' : 'Pending'} 
          value={statistics.submitted.toString()} 
          icon="pending" 
          color="text-warning" 
        />
        <StatCard 
          label={isUrdu ? 'منظور شدہ' : 'Approved'} 
          value={statistics.approved.toString()} 
          icon="check_circle" 
          color="text-success" 
        />
        <StatCard 
          label={isUrdu ? 'منظور شدہ رقم' : 'Approved Amount'} 
          value={`PKR ${(statistics.approvedAmount / 1000).toFixed(0)}K`} 
          icon="payments" 
          color="text-success" 
        />
      </div>

      {showForm && (
        <Card variant="outlined" className="bg-surface p-4">
          <h4 className="font-bold mb-4">
            {editingClaim ? (isUrdu ? 'دعویٰ میں ترمیم' : 'Edit Claim') : (isUrdu ? 'نیا طبی دعویٰ' : 'New Medical Claim')}
          </h4>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
            <SelectField 
              label={isUrdu ? 'ملازم منتخب کریں' : 'Select Employee'} 
              value={employeeId} 
              onChange={e => setEmployeeId(e.target.value)}
            >
              <option value="">{isUrdu ? 'منتخب کریں' : 'Select'}</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.employees.name} • {e.employees.personal_no}
                </option>
              ))}
            </SelectField>
            <TextField 
              label={isUrdu ? 'مریض کا نام' : 'Patient Name'} 
              icon="person" 
              value={patientName} 
              onChange={e => setPatientName(e.target.value)}
              placeholder="Leave blank if self"
            />
            <SelectField 
              label={isUrdu ? 'تعلق' : 'Relationship'} 
              value={relationship} 
              onChange={e => setRelationship(e.target.value)}
            >
              <option value="Self">Self</option>
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Parent">Parent</option>
            </SelectField>
            <TextField 
              label={isUrdu ? 'قسم' : 'Claim Type'} 
              icon="medical_services" 
              value={claimType} 
              onChange={e => setClaimType(e.target.value)}
              placeholder="OPD, IPD, Surgery, etc."
            />
            <TextField 
              label={isUrdu ? 'رقم' : 'Amount'} 
              type="number" 
              icon="payments" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
            />
            <TextField 
              label={isUrdu ? 'بل کی تاریخ' : 'Bill Date'} 
              type="date" 
              value={billDate} 
              onChange={e => setBillDate(e.target.value)} 
            />
            <TextField 
              label={isUrdu ? 'ہسپتال/کلینک' : 'Hospital/Clinic'} 
              icon="local_hospital" 
              value={hospitalName} 
              onChange={e => setHospitalName(e.target.value)}
              className="md:col-span-2"
            />
            <TextField 
              label={isUrdu ? 'تفصیل' : 'Remarks'} 
              icon="description" 
              value={remarks} 
              onChange={e => setRemarks(e.target.value)}
              className="md:col-span-2"
            />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button 
              variant="outlined" 
              label={isUrdu ? 'منسوخ' : 'Cancel'} 
              onClick={() => {
                setShowForm(false);
                setEditingClaim(null);
                resetForm();
              }} 
            />
            <Button 
              variant="filled" 
              label={editingClaim ? (isUrdu ? 'اپ ڈیٹ' : 'Update') : (isUrdu ? 'محفوظ' : 'Save')} 
              icon="save" 
              onClick={handleAdd} 
            />
          </div>
        </Card>
      )}

      <DataTable
        data={claims}
        columns={columns}
        emptyState={{
          icon: 'medical_services',
          title: isUrdu ? 'کوئی دعویٰ نہیں' : 'No claims found',
          description: isUrdu ? 'طبی دعوے یہاں ظاہر ہوں گے' : 'Medical claims will appear here',
        }}
      />

      {/* Application Viewer Modal */}
      {showViewer && selectedClaim && (
        <ApplicationViewer
          title={isUrdu ? 'طبی تلافی کی درخواست' : 'Medical Reimbursement Claim'}
          applicationNumber={`CLAIM-${selectedClaim.id}`}
          status={selectedClaim.status}
          statusVariant={
            selectedClaim.status === 'Approved' ? 'success' : 
            selectedClaim.status === 'Rejected' ? 'error' : 
            'warning'
          }
          sections={[
            {
              title: isUrdu ? 'ملازم کی معلومات' : 'Employee Information',
              icon: 'person',
              fields: [
                { label: isUrdu ? 'نام' : 'Name', value: selectedClaim.employeeName },
                { label: isUrdu ? 'ذاتی نمبر' : 'Personal No.', value: employees.find(e => e.id === selectedClaim.employeeId)?.employees.personal_no || 'N/A' },
                { label: isUrdu ? 'عہدہ' : 'Designation', value: employees.find(e => e.id === selectedClaim.employeeId)?.employees.designation || 'N/A' },
                { label: isUrdu ? 'بی پی ایس' : 'BPS', value: employees.find(e => e.id === selectedClaim.employeeId)?.employees.bps || 'N/A' },
              ],
            },
            {
              title: isUrdu ? 'دعویٰ کی تفصیلات' : 'Claim Details',
              icon: 'medical_services',
              fields: [
                { label: isUrdu ? 'مریض' : 'Patient', value: (selectedClaim as any).patientName || selectedClaim.employeeName },
                { label: isUrdu ? 'تعلق' : 'Relationship', value: (selectedClaim as any).relationship || 'Self' },
                { label: isUrdu ? 'قسم' : 'Type', value: selectedClaim.claimType, type: 'badge', variant: 'default' },
                { label: isUrdu ? 'ہسپتال' : 'Hospital', value: (selectedClaim as any).hospitalName || 'N/A' },
                { label: isUrdu ? 'بل کی تاریخ' : 'Bill Date', value: (selectedClaim as any).billDate || 'N/A', type: 'date' },
                { label: isUrdu ? 'رقم' : 'Amount', value: selectedClaim.amount, type: 'currency' },
                { label: isUrdu ? 'تفصیل' : 'Remarks', value: selectedClaim.remarks || 'N/A' },
                { label: isUrdu ? 'جمع کروائی' : 'Submitted', value: selectedClaim.submittedAt, type: 'date' },
              ],
            },
          ]}
          onPrint={handlePrint}
          onEdit={() => {
            setShowViewer(false);
            handleEdit(selectedClaim);
          }}
          onApprove={() => {
            updateStatus(selectedClaim.id, 'Approved');
            setShowViewer(false);
          }}
          onReject={() => {
            updateStatus(selectedClaim.id, 'Rejected');
            setShowViewer(false);
          }}
          onClose={() => setShowViewer(false)}
        />
      )}

      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
        <AppIcon name="tips_and_updates" className="text-primary mt-1" />
        <div className={isUrdu ? 'text-right' : ''}>
          <h5 className="font-bold text-primary text-sm">
            {isUrdu ? 'کلرک کے لیے ہدایات' : 'Instructions for Clerk'}
          </h5>
          <ul className="text-xs text-on-surface-variant list-disc list-inside space-y-1 mt-1">
            <li>{isUrdu ? 'تمام فیلڈز درست بھریں' : 'Fill all fields accurately'}</li>
            <li>{isUrdu ? 'اصل بلز منسلک کریں' : 'Attach original bills'}</li>
            <li>{isUrdu ? 'پرنٹ کر کے منظوری کے لیے بھیجیں' : 'Print and forward for approval'}</li>
            <li>{isUrdu ? 'ریکارڈ محفوظ رکھیں' : 'Maintain proper records'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
