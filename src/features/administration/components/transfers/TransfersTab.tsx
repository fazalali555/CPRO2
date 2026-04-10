import React, { useState } from 'react';
import { Button, Badge, TextField, SelectField } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useEmployeeContext } from '../../../../contexts/EmployeeContext';
import { useTransfers } from '../../hooks/useTransfers';
import { TransferRequest } from '../../types';

interface TransfersTabProps {
  onGenerateOrder?: (data: any) => void;
}

export const TransfersTab: React.FC<TransfersTabProps> = ({ onGenerateOrder }) => {
  const { t, isUrdu } = useLanguage();
  const { employees } = useEmployeeContext();
  const { requests, addRequest, updateStatus } = useTransfers();
  
  const [employeeId, setEmployeeId] = useState('');
  const [toSchool, setToSchool] = useState('');
  const [reason, setReason] = useState('');

  const handleAdd = () => {
    if (!employeeId || !toSchool.trim()) return;
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    addRequest({
      employeeId,
      employeeName: emp.employees.name,
      fromSchool: emp.employees.school_full_name,
      toSchool,
      reason,
    });

    setEmployeeId('');
    setToSchool('');
    setReason('');
  };

  const handleGenerateOrder = (r: TransferRequest) => {
    if (onGenerateOrder) {
      const data = {
        office: {
          title: isUrdu ? 'ڈسٹرکٹ ایجوکیشن آفیسر (میل)' : 'District Education Officer (Male)',
          department: isUrdu ? 'ایلیمینٹری اینڈ سیکنڈری ایجوکیشن' : 'Elementary & Secondary Education',
          city: isUrdu ? 'پشاور' : 'Peshawar',
          schoolName: r.fromSchool
        },
        fileNo: `DEO/Transfer/${r.id}`,
        subject: isUrdu ? 'تبادلہ و پوسٹنگ آرڈر' : 'TRANSFER / POSTING ORDER',
        recipient: {
          title: isUrdu ? 'متعلقہ افسران' : 'All Concerned',
          address: isUrdu ? 'ڈسٹرکٹ دفتر' : 'District Office'
        },
        content: isUrdu
          ? `حکم دیا جاتا ہے کہ ${r.employeeName} کو ${r.fromSchool} سے تبدیل کرکے ${r.toSchool} میں تعینات کیا جاتا ہے۔\nوجہ: ${r.reason || 'انتظامی ضرورت'}`
          : `It is hereby ordered that ${r.employeeName} is transferred from ${r.fromSchool} and posted to ${r.toSchool}.\nReason: ${r.reason || 'Administrative exigency'}`,
        signatory: {
          name: isUrdu ? 'محمد عارف' : 'Muhammad Arif',
          designation: isUrdu ? 'ڈسٹرکٹ ایجوکیشن آفیسر (ایم)' : 'District Education Officer (M)'
        }
      };
      onGenerateOrder(data);
    }
  };

  const columns: Column<TransferRequest>[] = [
    {
      key: 'employee',
      header: isUrdu ? 'ملازم' : 'Employee',
      render: (r) => <span className="font-medium">{r.employeeName}</span>,
    },
    {
      key: 'from',
      header: isUrdu ? 'موجودہ اسکول' : 'From',
      render: (r) => <span className="text-xs">{r.fromSchool}</span>,
    },
    {
      key: 'to',
      header: isUrdu ? 'نیا اسکول' : 'To',
      render: (r) => <span className="text-xs">{r.toSchool}</span>,
    },
    {
      key: 'status',
      header: isUrdu ? 'حالت' : 'Status',
      render: (r) => (
        <Badge 
          label={r.status} 
          variant={r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'error' : 'default'} 
        />
      ),
    },
    {
      key: 'actions',
      header: isUrdu ? 'کارروائی' : 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button 
            variant="tonal" 
            label={isUrdu ? 'منظور' : 'Approve'} 
            onClick={() => updateStatus(r.id, 'Approved')} 
            className="h-7 text-[10px] px-2" 
          />
          <Button 
            variant="outlined" 
            label={isUrdu ? 'رد' : 'Reject'} 
            onClick={() => updateStatus(r.id, 'Rejected')} 
            className="h-7 text-[10px] px-2" 
          />
          <Button 
            variant="text" 
            label={isUrdu ? 'آرڈر' : 'Order'} 
            onClick={() => handleGenerateOrder(r)} 
            className="h-7 text-[10px] px-2" 
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {t.admin.transfers}
        </h3>
        <Button 
          variant="filled" 
          label={t.admin.createOrder} 
          icon="post_add" 
          onClick={handleAdd} 
        />
      </div>

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
          label={isUrdu ? 'نئی تعیناتی اسکول' : 'New Posting School'} 
          icon="school" 
          value={toSchool} 
          onChange={e => setToSchool(e.target.value)} 
        />
        <TextField 
          label={isUrdu ? 'وجہ' : 'Reason'} 
          icon="assignment" 
          value={reason} 
          onChange={e => setReason(e.target.value)} 
        />
      </div>

      <DataTable
        data={requests}
        columns={columns}
        emptyState={{
          icon: 'swap_horiz',
          title: 'No transfer requests',
          description: 'Transfer requests will appear here.',
        }}
      />
    </div>
  );
};
