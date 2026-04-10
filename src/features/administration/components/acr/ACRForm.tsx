import React, { useState, useEffect } from 'react';
import { Button, TextField, SelectField, Card, Badge } from '../../../../components/M3';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useEmployeeContext } from '../../../../contexts/EmployeeContext';
import { useACR } from '../../hooks/useACR';
import { ACRCategory, ACRRecord } from '../../types/acr';
import { 
  ACR_CATEGORIES, 
  BPS_01_04_QUALITIES, 
  BPS_05_15_QUALITIES,
  RATING_LABELS 
} from '../../constants/acr-constants';
import { EmployeeRecord } from '../../../../types';

interface ACRFormProps {
  onClose: () => void;
  onSave: (acr: ACRRecord) => void;
  editingACR?: ACRRecord;
}

export const ACRForm: React.FC<ACRFormProps> = ({ onClose, onSave, editingACR }) => {
  const { isUrdu } = useLanguage();
  const { employees } = useEmployeeContext();
  const { getACRCategory, calculateGrade, getACRYears, addACR, updateACR } = useACR();

  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState(editingACR?.employee_id || '');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [category, setCategory] = useState<ACRCategory | ''>('');
  const [year, setYear] = useState(editingACR?.period.year || '');
  const [qualities, setQualities] = useState<Record<string, number | string>>({});
  const [reportingOfficer, setReportingOfficer] = useState({
    name: '',
    designation: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [countersigningOfficer, setCountersigningOfficer] = useState({
    name: '',
    designation: '',
    date: '',
    remarks: '',
  });
  const [integrity, setIntegrity] = useState({
    is_certified: true,
    remarks: '',
  });

  const years = getACRYears();

  useEffect(() => {
    if (employeeId) {
      const emp = employees.find(e => e.id === employeeId);
      setSelectedEmployee(emp || null);
      if (emp) {
        const cat = getACRCategory(emp.employees.bps || 0);
        setCategory(cat);
      }
    }
  }, [employeeId, employees, getACRCategory]);

  const handleQualityChange = (key: string, value: number | string) => {
    setQualities(prev => ({ ...prev, [key]: value }));
  };

  const calculateTotalScore = () => {
    const scores = Object.values(qualities).filter(v => typeof v === 'number') as number[];
    if (scores.length === 0) return 0;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10);
  };

  const handleSubmit = () => {
    if (!selectedEmployee || !year || !category) return;

    const totalScore = calculateTotalScore();
    const grade = calculateGrade(totalScore);

    const acrData: Omit<ACRRecord, 'id' | 'created_at' | 'updated_at'> = {
      employee_id: employeeId,
      employee_name: selectedEmployee.employees.name,
      period: {
        from: `01-01-${year.split('-')[0]}`,
        to: `31-12-${year.split('-')[0]}`,
        year: year,
      },
      category: category,
      personal_info: {
        name: selectedEmployee.employees.name,
        father_name: selectedEmployee.employees.father_name || '',
        date_of_birth: selectedEmployee.employees.date_of_birth || '',
        domicile: selectedEmployee.employees.domicile || '',
        home_district: selectedEmployee.employees.home_district || '',
        present_post: selectedEmployee.employees.designation || '',
        bps: selectedEmployee.employees.bps || 0,
        date_of_appointment: selectedEmployee.service_history.date_of_appointment || '',
        date_of_present_post: selectedEmployee.service_history.date_of_entry_current_post || '',
        personal_no: selectedEmployee.employees.personal_no || '',
        cnic: selectedEmployee.employees.cnic || '',
        qualification: selectedEmployee.employees.qualification || '',
        institution: selectedEmployee.employees.school_full_name || '',
        ddo_code: selectedEmployee.employees.ddo_code || '',
      },
      qualities: qualities as any,
      grading: {
        overall_grade: grade,
        numerical_score: totalScore,
        grade_remarks: `Overall performance is ${RATING_LABELS[Math.ceil(totalScore / 10) as keyof typeof RATING_LABELS] || 'Average'}`,
      },
      integrity: {
        is_certified: integrity.is_certified,
        remarks: integrity.remarks,
        certified_by: reportingOfficer.name,
        certification_date: reportingOfficer.date,
      },
      reporting_officer: reportingOfficer,
      countersigning_officer: countersigningOfficer,
      status: 'Draft',
      created_by: 'Clerk',
    };

    if (editingACR) {
      updateACR(editingACR.id, acrData);
      onSave({ ...editingACR, ...acrData } as ACRRecord);
    } else {
      const newACR = addACR(acrData);
      onSave(newACR);
    }
  };

  const renderQualitiesForm = () => {
    if (category === 'BPS_01_04') {
      return (
        <div className="space-y-4">
          <h4 className="font-bold text-primary">Performance Evaluation (BPS 1-4)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BPS_01_04_QUALITIES.map(q => (
              <SelectField
                key={q.key}
                label={isUrdu ? q.labelUrdu : q.label}
                value={qualities[q.key] as string || ''}
                onChange={e => handleQualityChange(q.key, e.target.value)}
              >
                <option value="">Select</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </SelectField>
            ))}
          </div>
        </div>
      );
    }

    if (category === 'BPS_05_15') {
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-primary mb-3">Part I - Work Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BPS_05_15_QUALITIES.work_performance.map(q => (
                <RatingField
                  key={q.key}
                  label={isUrdu ? q.labelUrdu : q.label}
                  value={qualities[q.key] as number || 5}
                  onChange={v => handleQualityChange(q.key, v)}
                />
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-3">Part II - Personal Qualities</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BPS_05_15_QUALITIES.personal_qualities.map(q => (
                <RatingField
                  key={q.key}
                  label={isUrdu ? q.labelUrdu : q.label}
                  value={qualities[q.key] as number || 5}
                  onChange={v => handleQualityChange(q.key, v)}
                />
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-primary mb-3">Part III - Potential</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BPS_05_15_QUALITIES.potential.map(q => (
                <RatingField
                  key={q.key}
                  label={isUrdu ? q.labelUrdu : q.label}
                  value={qualities[q.key] as number || 5}
                  onChange={v => handleQualityChange(q.key, v)}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return <div className="text-center py-10 text-on-surface-variant">Select employee to continue</div>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card variant="filled" className="bg-surface w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-outline-variant/30 p-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold">New ACR</h2>
            <Badge variant="primary" label={`Step ${step}/4`} />
          </div>
          <Button variant="text" icon="close" onClick={onClose} />
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-4">Step 1: Select Employee</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField label="Employee" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                  <option value="">-- Select --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.employees.name} • BPS-{e.employees.bps}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Year" value={year} onChange={e => setYear(e.target.value)}>
                  <option value="">-- Select --</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </SelectField>
              </div>
              {selectedEmployee && (
                <Card variant="outlined" className="p-4 bg-surface-variant/20">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><strong>Name:</strong> {selectedEmployee.employees.name}</div>
                    <div><strong>BPS:</strong> {selectedEmployee.employees.bps}</div>
                    <div><strong>Designation:</strong> {selectedEmployee.employees.designation}</div>
                    <div><strong>Category:</strong> {ACR_CATEGORIES.find(c => c.id === category)?.label}</div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {step === 2 && renderQualitiesForm()}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg mb-4">Step 3: Officers</h3>
              <div>
                <h4 className="font-bold mb-3">Reporting Officer</h4>
                <div className="grid grid-cols-2 gap-4">
                  <TextField label="Name" value={reportingOfficer.name} onChange={e => setReportingOfficer(prev => ({ ...prev, name: e.target.value }))} />
                  <TextField label="Designation" value={reportingOfficer.designation} onChange={e => setReportingOfficer(prev => ({ ...prev, designation: e.target.value }))} />
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-3">Countersigning Officer</h4>
                <div className="grid grid-cols-2 gap-4">
                  <TextField label="Name" value={countersigningOfficer.name} onChange={e => setCountersigningOfficer(prev => ({ ...prev, name: e.target.value }))} />
                  <TextField label="Designation" value={countersigningOfficer.designation} onChange={e => setCountersigningOfficer(prev => ({ ...prev, designation: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-4">Review</h3>
              <Card variant="outlined" className="p-4 text-center">
                <div className="text-6xl font-bold text-primary">{calculateGrade(calculateTotalScore())}</div>
                <div className="text-lg">Overall Grade</div>
                <div className="text-sm text-on-surface-variant">Score: {calculateTotalScore()}%</div>
              </Card>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-surface border-t p-4 flex justify-between">
          <Button variant="outlined" label="Back" onClick={() => step > 1 ? setStep(step - 1) : onClose()} />
          {step < 4 ? (
            <Button variant="filled" label="Next" onClick={() => setStep(step + 1)} disabled={step === 1 && (!employeeId || !year)} />
          ) : (
            <Button variant="filled" label="Submit" icon="check" onClick={handleSubmit} />
          )}
        </div>
      </Card>
    </div>
  );
};

const RatingField: React.FC<{ label: string; value: number; onChange: (v: number) => void; }> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input type="range" min="1" max="10" value={value} onChange={e => onChange(Number(e.target.value))} className="flex-1 accent-primary" />
        <span className="font-mono font-bold w-8 text-center">{value}</span>
      </div>
      <div className="text-xs text-on-surface-variant">{RATING_LABELS[value as keyof typeof RATING_LABELS]}</div>
    </div>
  );
};
