import React, { useState } from 'react';
import { Button, Badge, TextField, SelectField, Card } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useACR } from '../../hooks/useACR';
import { ACRRecord } from '../../types/acr';
import { StatCard } from '../shared/StatCard';
import { ACRForm } from './ACRForm';
import { ACR_CATEGORIES, ACR_GRADES, ACR_STATUS_COLORS } from '../../constants/acr-constants';

export const ACRTab: React.FC = () => {
  const { isUrdu } = useLanguage();
  const { acrs, statistics, updateACR, getACRYears } = useACR();

  const [showForm, setShowForm] = useState(false);
  const [editingACR, setEditingACR] = useState<ACRRecord | null>(null);
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const years = getACRYears();

  const filteredACRs = acrs.filter(acr => {
    if (filterYear && acr.period.year !== filterYear) return false;
    if (filterStatus && acr.status !== filterStatus) return false;
    if (searchQuery && !acr.employee_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = (id: string, status: ACRRecord['status']) => {
    updateACR(id, { status });
  };

  const columns: Column<ACRRecord>[] = [
    {
      key: 'employee',
      header: isUrdu ? 'ملازم' : 'Employee',
      render: (acr) => (
        <div>
          <div className="font-bold">{acr.employee_name}</div>
          <div className="text-xs text-on-surface-variant">
            {acr.personal_info.designation} • BPS-{acr.personal_info.bps}
          </div>
        </div>
      ),
    },
    {
      key: 'period',
      header: isUrdu ? 'سال' : 'Year',
      render: (acr) => (
        <div>
          <div className="font-medium">{acr.period.year}</div>
          <div className="text-xs text-on-surface-variant">
            {ACR_CATEGORIES.find(c => c.id === acr.category)?.bpsRange}
          </div>
        </div>
      ),
    },
    {
      key: 'grade',
      header: isUrdu ? 'گریڈ' : 'Grade',
      render: (acr) => {
        const gradeInfo = ACR_GRADES.find(g => g.grade === acr.grading.overall_grade);
        return (
          <div className="text-center">
            <div className={`text-2xl font-bold ${gradeInfo?.color || ''}`}>
              {acr.grading.overall_grade}
            </div>
            <div className="text-xs text-on-surface-variant">{acr.grading.numerical_score}%</div>
          </div>
        );
      },
      className: 'text-center w-20',
    },
    {
      key: 'status',
      header: isUrdu ? 'حالت' : 'Status',
      render: (acr) => (
        <Badge variant={ACR_STATUS_COLORS[acr.status] as any} label={acr.status} />
      ),
    },
    {
      key: 'actions',
      header: isUrdu ? 'کارروائی' : 'Actions',
      render: (acr) => (
        <div className="flex gap-1">
          {acr.status === 'Draft' && (
            <Button
              variant="text"
              label="Submit"
              icon="send"
              onClick={() => handleStatusChange(acr.id, 'Initiated')}
              className="h-7 text-[10px] px-2"
            />
          )}
          {acr.status === 'Initiated' && (
            <Button
              variant="text"
              label="Sign"
              onClick={() => handleStatusChange(acr.id, 'Countersigned')}
              className="h-7 text-[10px] px-2"
            />
          )}
          {acr.status === 'Countersigned' && (
            <Button
              variant="text"
              label="File"
              onClick={() => handleStatusChange(acr.id, 'Filed')}
              className="h-7 text-[10px] px-2"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-on-surface">
          {isUrdu ? 'سالانہ خفیہ رپورٹ' : 'Annual Confidential Reports'}
        </h3>
        <Button 
          variant="filled" 
          label={isUrdu ? 'نیا ACR' : 'New ACR'} 
          icon="add" 
          onClick={() => { setEditingACR(null); setShowForm(true); }} 
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Total" value={statistics.total.toString()} icon="description" color="text-primary" />
        <StatCard label="Draft" value={statistics.draft.toString()} icon="edit_note" color="text-on-surface-variant" />
        <StatCard label="Pending" value={statistics.initiated.toString()} icon="pending" color="text-warning" />
        <StatCard label="Filed" value={statistics.filed.toString()} icon="folder" color="text-success" />
        <StatCard label="Adverse" value={statistics.adverse.toString()} icon="warning" color="text-error" />
        <StatCard label="Grade A" value={statistics.byGrade.A.toString()} icon="star" color="text-success" />
      </div>

      <Card variant="outlined" className="bg-surface p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            label="Search"
            icon="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <SelectField label="Year" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </SelectField>
          <SelectField label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Initiated">Initiated</option>
            <option value="Countersigned">Countersigned</option>
            <option value="Filed">Filed</option>
          </SelectField>
        </div>
      </Card>

      <div className="grid grid-cols-5 gap-2">
        {ACR_GRADES.map(g => (
          <div key={g.grade} className="text-center p-3 bg-surface-variant/20 rounded-lg">
            <div className={`text-2xl font-bold ${g.color}`}>{statistics.byGrade[g.grade]}</div>
            <div className="text-xs">Grade {g.grade}</div>
          </div>
        ))}
      </div>

      <DataTable
        data={filteredACRs}
        columns={columns}
        emptyState={{
          icon: 'description',
          title: 'No ACRs found',
          description: 'Add a new ACR to get started',
        }}
      />

      {showForm && (
        <ACRForm
          onClose={() => { setShowForm(false); setEditingACR(null); }}
          onSave={() => { setShowForm(false); setEditingACR(null); }}
          editingACR={editingACR || undefined}
        />
      )}

      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
        <AppIcon name="info" className="text-primary mt-1" />
        <div>
          <h5 className="font-bold text-primary text-sm">ACR Guidelines</h5>
          <ul className="text-xs text-on-surface-variant list-disc list-inside space-y-1 mt-1">
            <li>BPS 1-4: Simple evaluation form</li>
            <li>BPS 5-15: Standard clerical staff form</li>
            <li>BPS 16-19: Detailed officer form</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
