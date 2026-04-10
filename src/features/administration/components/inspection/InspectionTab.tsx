import React, { useState, useRef } from 'react';
import { Button, Badge, TextField, Checkbox, Card } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useInspections } from '../../hooks/useInspections';
import { SchoolInspection, ChecklistItem } from '../../types';
import { StatCard } from '../shared/StatCard';
import { saveFileToIDB } from '../../../../utils';

interface InspectionTabProps {
  onGenerateReport?: (data: any) => void;
}

export const InspectionTab: React.FC<InspectionTabProps> = ({ onGenerateReport }) => {
  const { isUrdu } = useLanguage();
  const { inspections, addInspection, statistics } = useInspections();
  
  const [showForm, setShowForm] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'classrooms', label: isUrdu ? 'کلاس رومز' : 'Classrooms', ok: true },
    { id: 'toilets', label: isUrdu ? 'واش رومز' : 'Toilets', ok: true },
    { id: 'water', label: isUrdu ? 'پینے کا پانی' : 'Drinking Water', ok: true },
    { id: 'attendance', label: isUrdu ? 'اسٹاف حاضری' : 'Staff Attendance', ok: true },
    { id: 'student', label: isUrdu ? 'طلبہ حاضری' : 'Student Register', ok: true },
    { id: 'furniture', label: isUrdu ? 'فرنیچر' : 'Furniture', ok: true },
    { id: 'boundary', label: isUrdu ? 'باؤنڈری وال' : 'Boundary Wall', ok: true },
    { id: 'lab', label: isUrdu ? 'لیب/لائبریری' : 'Lab/Library', ok: true },
  ]);
  
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    const newIds: string[] = [];
    for (const file of files) {
      const fileId = `insp_${Date.now()}_${file.name}`;
      const buffer = await file.arrayBuffer();
      await saveFileToIDB(fileId, new Uint8Array(buffer));
      newIds.push(fileId);
    }
    setPhotoIds([...photoIds, ...newIds]);
    e.target.value = '';
  };

  const handleCreate = () => {
    if (!schoolName.trim() || !inspectionDate) return;
    
    const deficiencies = checklist.filter(c => !c.ok).map(c => c.label);
    
    addInspection({
      schoolName,
      officerName,
      inspectionDate,
      checklist,
      deficiencies,
      photos: photoIds,
      status: deficiencies.length > 0 ? 'Deficient' : 'Compliant'
    });

    setSchoolName('');
    setOfficerName('');
    setInspectionDate('');
    setPhotoIds([]);
    setShowForm(false);
  };

  const handleReport = (r: SchoolInspection) => {
    if (onGenerateReport) {
      const content = r.deficiencies.length > 0
        ? `Deficiencies:\n${r.deficiencies.map((d: string) => `- ${d}`).join('\n')}`
        : 'All observations were found satisfactory.';
      const data = {
        office: {
          title: 'District Education Officer (Male)',
          department: 'Elementary & Secondary Education',
          city: 'Peshawar',
          schoolName: r.schoolName
        },
        fileNo: `DEO/Inspection/${r.id}`,
        subject: 'INSPECTION REPORT',
        recipient: {
          title: 'Head of Institution',
          address: r.schoolName
        },
        content,
        signatory: {
          name: 'Muhammad Arif',
          designation: 'District Education Officer (M)'
        }
      };
      onGenerateReport(data);
    }
  };

  const columns: Column<SchoolInspection>[] = [
    {
      key: 'school',
      header: isUrdu ? 'اسکول' : 'School',
      render: (insp) => (
        <div>
          <div className="font-medium">{insp.schoolName}</div>
          <div className="text-xs text-on-surface-variant">{insp.inspectionDate}</div>
        </div>
      ),
    },
    {
      key: 'officer',
      header: isUrdu ? 'افسر' : 'Officer',
      render: (insp) => <span className="text-sm">{insp.officerName || '-'}</span>,
    },
    {
      key: 'deficiencies',
      header: isUrdu ? 'نقائص' : 'Deficiencies',
      render: (insp) => (
        <span className={`font-bold ${insp.deficiencies.length > 0 ? 'text-error' : 'text-success'}`}>
          {insp.deficiencies.length}
        </span>
      ),
      className: 'text-center',
    },
    {
      key: 'status',
      header: isUrdu ? 'حالت' : 'Status',
      render: (insp) => (
        <Badge 
          variant={insp.status === 'Deficient' ? 'error' : 'success'}
          label={insp.status}
        />
      ),
    },
    {
      key: 'actions',
      header: isUrdu ? 'کارروائی' : 'Actions',
      render: (insp) => (
        <Button 
          variant="text" 
          label={isUrdu ? 'رپورٹ' : 'Report'} 
          icon="description" 
          onClick={() => handleReport(insp)}
          className="h-7 text-xs"
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {isUrdu ? 'اسکول انسپیکشن' : 'School Inspection'}
        </h3>
        <Button 
          variant="filled" 
          label={isUrdu ? 'نیا انسپیکشن' : 'New Inspection'} 
          icon="add" 
          onClick={() => setShowForm(!showForm)} 
        />
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        <StatCard label="Total Inspections" value={statistics.total.toString()} icon="checklist" color="text-primary" />
        <StatCard label="This Month" value={statistics.thisMonth.toString()} icon="today" color="text-blue-500" />
        <StatCard label="Compliant" value={statistics.compliant.toString()} icon="check_circle" color="text-success" />
        <StatCard label="Deficient" value={statistics.deficient.toString()} icon="warning" color="text-error" />
      </div>

      {showForm && (
        <Card variant="outlined" className="bg-surface p-4">
          <h4 className="font-bold mb-4">New Inspection Record</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <TextField label="School Name" icon="school" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
            <TextField label="Inspection Date" type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} />
            <TextField label="Officer Name" icon="person" value={officerName} onChange={e => setOfficerName(e.target.value)} />
            <div className="flex items-end">
              <input type="file" multiple accept="image/*" className="hidden" ref={photoInputRef} onChange={handlePhotoChange} />
              <Button variant="outlined" label="Upload Photos" icon="photo_camera" className="w-full" onClick={() => photoInputRef.current?.click()} />
            </div>
          </div>
          
          <div className="mb-4">
            <h5 className="font-bold mb-2">Checklist</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {checklist.map(item => (
                <Checkbox
                  key={item.id}
                  label={item.label}
                  checked={item.ok}
                  onChange={e => setChecklist(checklist.map(c => c.id === item.id ? { ...c, ok: e.target.checked } : c))}
                />
              ))}
            </div>
            <div className="text-xs text-on-surface-variant mt-2">
              Photos: {photoIds.length}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outlined" label="Cancel" onClick={() => setShowForm(false)} />
            <Button variant="filled" label="Save" icon="save" onClick={handleCreate} />
          </div>
        </Card>
      )}

      <DataTable
        data={inspections}
        columns={columns}
        emptyState={{
          icon: 'checklist',
          title: 'No inspections',
          description: 'School inspection records will appear here',
        }}
      />
    </div>
  );
};
