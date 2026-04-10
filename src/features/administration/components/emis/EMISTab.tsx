import React, { useState } from 'react';
import { Button, TextField, Card } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useEMIS } from '../../hooks/useEMIS';
import { EMISReport } from '../../types';
import { StatCard } from '../shared/StatCard';

export const EMISTab: React.FC = () => {
  const { isUrdu } = useLanguage();
  const { reports, addReport, statistics } = useEMIS();
  
  const [showForm, setShowForm] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [month, setMonth] = useState('');
  const [boys, setBoys] = useState('');
  const [girls, setGirls] = useState('');
  const [attendance, setAttendance] = useState('');

  const handleAdd = () => {
    if (!schoolName || !month) return;
    
    addReport({
      schoolName,
      month,
      boys: Number(boys) || 0,
      girls: Number(girls) || 0,
      attendance: Number(attendance) || 0,
    });

    setSchoolName('');
    setMonth('');
    setBoys('');
    setGirls('');
    setAttendance('');
    setShowForm(false);
  };

  const columns: Column<EMISReport>[] = [
    {
      key: 'school',
      header: isUrdu ? 'اسکول' : 'School',
      render: (report) => <span className="font-medium">{report.schoolName}</span>,
    },
    {
      key: 'month',
      header: isUrdu ? 'مہینہ' : 'Month',
      render: (report) => <span className="text-sm">{report.month}</span>,
    },
    {
      key: 'enrollment',
      header: isUrdu ? 'اندراج' : 'Enrollment',
      render: (report) => (
        <div className="text-sm">
          <div>👦 {report.boys}</div>
          <div>👧 {report.girls}</div>
          <div className="font-bold">Total: {report.boys + report.girls}</div>
        </div>
      ),
    },
    {
      key: 'attendance',
      header: isUrdu ? 'حاضری' : 'Attendance',
      render: (report) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-variant rounded-full h-2">
            <div 
              className="bg-success h-2 rounded-full" 
              style={{ width: `${report.attendance}%` }}
            />
          </div>
          <span className="font-mono text-sm">{report.attendance}%</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {isUrdu ? 'ای ایم آئی ایس رپورٹس' : 'EMIS Monthly Reports'}
        </h3>
        <Button 
          variant="filled" 
          label={isUrdu ? 'نئی رپورٹ' : 'New Report'} 
          icon="add" 
          onClick={() => setShowForm(!showForm)} 
        />
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        <StatCard label="Total Reports" value={statistics.total.toString()} icon="school" color="text-primary" />
        <StatCard label="Boys" value={statistics.totalBoys.toString()} icon="boy" color="text-blue-500" />
        <StatCard label="Girls" value={statistics.totalGirls.toString()} icon="girl" color="text-pink-500" />
        <StatCard label="Avg Attendance" value={`${statistics.avgAttendance}%`} icon="percent" color="text-success" />
      </div>

      {showForm && (
        <Card variant="outlined" className="bg-surface p-4">
          <h4 className="font-bold mb-4">New EMIS Report</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="School Name" icon="school" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
            <TextField label="Month" type="month" value={month} onChange={e => setMonth(e.target.value)} />
            <TextField label="Boys" type="number" icon="boy" value={boys} onChange={e => setBoys(e.target.value)} />
            <TextField label="Girls" type="number" icon="girl" value={girls} onChange={e => setGirls(e.target.value)} />
            <TextField label="Avg Attendance %" type="number" icon="percent" value={attendance} onChange={e => setAttendance(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outlined" label="Cancel" onClick={() => setShowForm(false)} />
            <Button variant="filled" label="Save" icon="save" onClick={handleAdd} />
          </div>
        </Card>
      )}

      <DataTable
        data={reports}
        columns={columns}
        emptyState={{
          icon: 'school',
          title: 'No reports',
          description: 'EMIS reports will appear here',
        }}
      />
    </div>
  );
};
