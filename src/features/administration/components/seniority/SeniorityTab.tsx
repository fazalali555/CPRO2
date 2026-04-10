import React, { useState, useMemo } from 'react';
import { Button, Badge, TextField, SelectField, Card } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useSeniorityList } from '../../hooks/useSeniorityList';
import { SeniorityEntry, Institution } from '../../types/institution';
import { StatCard } from '../shared/StatCard';
import { formatDate } from '../../../../utils/dateUtils';

interface SeniorityTabProps {
  onGenerateList?: (data: any) => void;
}

export const SeniorityTab: React.FC<SeniorityTabProps> = ({ onGenerateList }) => {
  const { t, isUrdu } = useLanguage();
  const { 
    institutions, 
    getHeadOfInstitution, 
    generateSeniorityList, 
    getInstitutionStats 
  } = useSeniorityList();

  const [selectedDDO, setSelectedDDO] = useState<string>('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterBPS, setFilterBPS] = useState('');
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split('T')[0]);
  const [listType, setListType] = useState<'Provisional' | 'Final'>('Provisional');
  const [showPreview, setShowPreview] = useState(false);

  // Get selected institution
  const selectedInstitution = useMemo(() => {
    return institutions.find(i => i.ddo_code === selectedDDO);
  }, [institutions, selectedDDO]);

  // Get head of institution
  const headOfInstitution = useMemo(() => {
    if (!selectedDDO) return null;
    return getHeadOfInstitution(selectedDDO);
  }, [selectedDDO, getHeadOfInstitution]);

  // Generate seniority list
  const seniorityList = useMemo(() => {
    if (!selectedDDO) return [];
    return generateSeniorityList(
      selectedDDO,
      filterDesignation || undefined,
      filterBPS ? Number(filterBPS) : undefined,
      asOnDate
    );
  }, [selectedDDO, filterDesignation, filterBPS, asOnDate, generateSeniorityList]);

  // Get institution stats
  const stats = useMemo(() => {
    if (!selectedDDO) return null;
    return getInstitutionStats(selectedDDO);
  }, [selectedDDO, getInstitutionStats]);

  // Get unique designations for filter
  const uniqueDesignations = useMemo(() => {
    const designations = new Set<string>();
    seniorityList.forEach(entry => {
      if (entry.designation) designations.add(entry.designation);
    });
    return Array.from(designations).sort();
  }, [seniorityList]);

  // Handle generate list
  const handleGenerateList = () => {
    if (!selectedInstitution || !headOfInstitution) {
      alert(isUrdu ? 'براہ کرم ادارہ منتخب کریں' : 'Please select an institution');
      return;
    }

    const data = {
      office: {
        title: selectedInstitution.name,
        department: isUrdu ? 'ایلیمینٹری اینڈ سیکنڈری ایجوکیشن' : 'Elementary & Secondary Education',
        city: selectedInstitution.district || 'Peshawar',
        schoolName: selectedInstitution.name,
        ddoCode: selectedInstitution.ddo_code,
        address: selectedInstitution.address,
        tehsil: selectedInstitution.tehsil,
      },
      fileNo: `${selectedInstitution.ddo_code}/Seniority/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`,
      subject: isUrdu 
        ? `${listType === 'Provisional' ? 'عارضی' : 'حتمی'} سینیارٹی لسٹ برائے ${filterDesignation || 'تمام عملہ'} ${filterBPS ? `(بی پی ایس-${filterBPS})` : ''} بتاریخ ${formatDate(asOnDate)}`
        : `${listType.toUpperCase()} SENIORITY LIST OF ${filterDesignation?.toUpperCase() || 'ALL STAFF'} ${filterBPS ? `(BPS-${filterBPS})` : ''} AS ON ${formatDate(asOnDate)}`,
      recipient: {
        title: isUrdu ? 'تمام متعلقہ ملازمین' : 'All Concerned Employees',
        address: selectedInstitution.name
      },
      content: isUrdu 
        ? `${selectedInstitution.name} میں کام کرنے والے ${filterDesignation || 'عملہ'} ${filterBPS ? `بی پی ایس-${filterBPS}` : ''} کی ${listType === 'Provisional' ? 'عارضی' : 'حتمی'} سینیارٹی لسٹ جیسا کہ بتاریخ ${formatDate(asOnDate)} ہے، تمام متعلقہ افراد کی معلومات کے لیے جاری کی جاتی ہے۔

${listType === 'Provisional' ? `اگر کوئی اعتراض ہو تو اس نوٹیفکیشن کے جاری ہونے کے 15 دنوں کے اندر دستخط کنندہ کو جمع کرایا جا سکتا ہے، بصورت دیگر یہ سمجھا جائے گا کہ سینیارٹی لسٹ درست ہے اور اسے اسی کے مطابق حتمی شکل دے دی جائے گی۔` : 'یہ سینیارٹی لسٹ حتمی ہے اور تمام متعلقہ ریکارڈ میں درج کی جائے۔'}`
        : `The ${listType.toLowerCase()} seniority list of ${filterDesignation || 'staff'} ${filterBPS ? `BPS-${filterBPS}` : ''} working in ${selectedInstitution.name} as it stood on ${formatDate(asOnDate)} is hereby circulated for information of all concerned.

${listType === 'Provisional' ? `Objections, if any, may be submitted to the undersigned within 15 days of the issuance of this notification, failing which it will be presumed that the seniority list is correct and will be finalized accordingly.` : 'This seniority list is final and shall be recorded in all relevant records.'}`,
      signatory: {
        name: headOfInstitution.employees.name,
        designation: headOfInstitution.employees.designation || selectedInstitution.head_designation || 'Head of Institution',
      },
      copyTo: isUrdu ? [
        'ڈسٹرکٹ ایجوکیشن آفیسر برائے ریکارڈ۔',
        'تمام متعلقہ ملازمین۔',
        'سینیارٹی فائل۔'
      ] : [
        'The District Education Officer for record.',
        'All employees concerned.',
        'Seniority File.'
      ],
      enclosures: isUrdu 
        ? [`سینیارٹی لسٹ (${Math.ceil(seniorityList.length / 15)} صفحات)`] 
        : [`Seniority List (${Math.ceil(seniorityList.length / 15)} Pages)`],
      seniorityList: seniorityList,
      institution: selectedInstitution,
    };

    if (onGenerateList) {
      onGenerateList(data);
    }
  };

  // Handle print seniority list
  const handlePrintList = () => {
    if (!selectedInstitution || !headOfInstitution) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = formatDate(new Date().toISOString());
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Seniority List - ${selectedInstitution.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Times New Roman', serif; padding: 20px; font-size: 11pt; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
          .logo { font-size: 14pt; font-weight: bold; }
          .institution { font-size: 16pt; font-weight: bold; margin: 5px 0; }
          .title { font-size: 13pt; font-weight: bold; text-decoration: underline; margin-top: 10px; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9pt; }
          th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
          .sr { width: 30px; text-align: center; }
          .name-cell { min-width: 120px; }
          .date-cell { min-width: 70px; font-size: 8pt; }
          .bps-cell { width: 40px; text-align: center; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; }
          .signature-box { width: 200px; text-align: center; }
          .notes { margin-top: 20px; font-size: 9pt; border: 1px solid #000; padding: 10px; }
          @media print { 
            button { display: none !important; } 
            body { padding: 10px; }
            @page { margin: 1cm; size: A4 landscape; }
          }
          .print-btn { 
            position: fixed; top: 10px; right: 10px; 
            padding: 10px 30px; background: #007bff; color: white; 
            border: none; cursor: pointer; font-size: 14px; border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Print</button>
        
        <div class="header">
          <div class="logo">GOVERNMENT OF KHYBER PAKHTUNKHWA</div>
          <div>Elementary & Secondary Education Department</div>
          <div class="institution">${selectedInstitution.name}</div>
          ${selectedInstitution.address ? `<div style="font-size: 10pt;">${selectedInstitution.address}</div>` : ''}
          <div class="title">${listType.toUpperCase()} SENIORITY LIST</div>
          <div style="font-size: 10pt; margin-top: 5px;">
            ${filterDesignation ? `of ${filterDesignation}` : 'of All Staff'} 
            ${filterBPS ? `(BPS-${filterBPS})` : ''} 
            as on ${formatDate(asOnDate)}
          </div>
        </div>

        <div class="info-row">
          <span><strong>DDO Code:</strong> ${selectedInstitution.ddo_code}</span>
          <span><strong>Total Employees:</strong> ${seniorityList.length}</span>
          <span><strong>Date of Issue:</strong> ${currentDate}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th class="sr">S.No</th>
              <th class="name-cell">Name / Father's Name</th>
              <th>Designation</th>
              <th class="bps-cell">BPS</th>
              <th class="date-cell">Date of Birth</th>
              <th class="date-cell">Date of Appointment</th>
              <th class="date-cell">Date of Regularization</th>
              <th>Personal No.</th>
              <th>Qualification</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${seniorityList.map(entry => `
              <tr>
                <td class="sr">${entry.seniority_no}</td>
                <td class="name-cell">
                  <strong>${entry.name}</strong>
                  ${entry.father_name ? `<br/><small>S/O ${entry.father_name}</small>` : ''}
                </td>
                <td>${entry.designation}</td>
                <td class="bps-cell">${entry.bps}</td>
                <td class="date-cell">${entry.date_of_birth ? formatDate(entry.date_of_birth) : '-'}</td>
                <td class="date-cell">${entry.date_of_appointment ? formatDate(entry.date_of_appointment) : '-'}</td>
                <td class="date-cell">${entry.date_of_regularization ? formatDate(entry.date_of_regularization) : '-'}</td>
                <td>${entry.personal_no || '-'}</td>
                <td>${entry.qualification || '-'}</td>
                <td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${listType === 'Provisional' ? `
        <div class="notes">
          <strong>Note:</strong> This is a provisional seniority list. Objections, if any, may be submitted within 
          15 days of the issuance of this notification. After the expiry of objection period, the list will be 
          finalized and no further objection will be entertained.
        </div>
        ` : ''}

        <div class="footer">
          <div>
            <p>Prepared by: ________________</p>
            <p style="margin-top: 5px;">Date: ${currentDate}</p>
          </div>
          <div class="signature-box">
            <br/><br/><br/>
            <p>_________________________</p>
            <p><strong>${headOfInstitution.employees.name}</strong></p>
            <p>${headOfInstitution.employees.designation || 'Head of Institution'}</p>
            <p>${selectedInstitution.name}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns: Column<SeniorityEntry>[] = [
    {
      key: 'seniority_no',
      header: isUrdu ? 'نمبر' : 'S.No',
      render: (entry) => <span className="font-bold">{entry.seniority_no}</span>,
      className: 'w-12 text-center',
    },
    {
      key: 'name',
      header: isUrdu ? 'نام / والد' : 'Name / Father',
      render: (entry) => (
        <div>
          <div className="font-bold">{entry.name}</div>
          {entry.father_name && (
            <div className="text-xs text-on-surface-variant">S/O {entry.father_name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'designation',
      header: isUrdu ? 'عہدہ' : 'Designation',
      render: (entry) => (
        <div>
          <div className="text-sm">{entry.designation}</div>
          <div className="text-xs font-mono text-on-surface-variant">BPS-{entry.bps}</div>
        </div>
      ),
    },
    {
      key: 'dob',
      header: isUrdu ? 'تاریخ پیدائش' : 'DOB',
      render: (entry) => (
        <span className="text-xs">{entry.date_of_birth ? formatDate(entry.date_of_birth) : '-'}</span>
      ),
    },
    {
      key: 'appointment',
      header: isUrdu ? 'تقرری' : 'Appointment',
      render: (entry) => (
        <span className="text-xs">{entry.date_of_appointment ? formatDate(entry.date_of_appointment) : '-'}</span>
      ),
    },
    {
      key: 'regularization',
      header: isUrdu ? 'ریگولرائزیشن' : 'Regularization',
      render: (entry) => (
        <span className="text-xs">{entry.date_of_regularization ? formatDate(entry.date_of_regularization) : '-'}</span>
      ),
    },
    {
      key: 'personal_no',
      header: isUrdu ? 'ذاتی نمبر' : 'Personal No.',
      render: (entry) => <span className="font-mono text-xs">{entry.personal_no}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {isUrdu ? 'سینیارٹی لسٹ (ادارہ وار)' : 'Seniority List (Institution-wise)'}
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="outlined" 
            label={isUrdu ? 'پرنٹ لسٹ' : 'Print List'} 
            icon="print" 
            onClick={handlePrintList}
            disabled={!selectedDDO || seniorityList.length === 0}
          />
          <Button 
            variant="filled" 
            label={isUrdu ? 'خط بنائیں' : 'Generate Letter'} 
            icon="description" 
            onClick={handleGenerateList}
            disabled={!selectedDDO || seniorityList.length === 0}
          />
        </div>
      </div>

      {/* Institution Selection */}
      <Card variant="filled" className="bg-primary/5 p-4">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
          <SelectField 
            label={isUrdu ? 'ادارہ / اسکول منتخب کریں' : 'Select Institution / School'} 
            value={selectedDDO}
            onChange={e => setSelectedDDO(e.target.value)}
          >
            <option value="">{isUrdu ? '-- ادارہ منتخب کریں --' : '-- Select Institution --'}</option>
            {institutions.map(inst => (
              <option key={inst.ddo_code} value={inst.ddo_code}>
                {inst.name} ({inst.ddo_code})
              </option>
            ))}
          </SelectField>
          <SelectField 
            label={isUrdu ? 'عہدہ فلٹر' : 'Filter by Designation'} 
            value={filterDesignation}
            onChange={e => setFilterDesignation(e.target.value)}
            disabled={!selectedDDO}
          >
            <option value="">{isUrdu ? 'تمام عہدے' : 'All Designations'}</option>
            {uniqueDesignations.map(designation => (
              <option key={designation} value={designation}>{designation}</option>
            ))}
          </SelectField>
          <TextField 
            label={isUrdu ? 'بی پی ایس فلٹر' : 'Filter by BPS'} 
            type="number"
            value={filterBPS}
            onChange={e => setFilterBPS(e.target.value)}
            placeholder="e.g., 14"
            disabled={!selectedDDO}
          />
          <TextField 
            label={isUrdu ? 'تاریخ کے مطابق' : 'As on Date'} 
            type="date"
            value={asOnDate}
            onChange={e => setAsOnDate(e.target.value)}
          />
        </div>
        <div className="flex gap-4 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="listType"
              value="Provisional"
              checked={listType === 'Provisional'}
              onChange={() => setListType('Provisional')}
              className="accent-primary"
            />
            <span className="text-sm">{isUrdu ? 'عارضی' : 'Provisional'}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="listType"
              value="Final"
              checked={listType === 'Final'}
              onChange={() => setListType('Final')}
              className="accent-primary"
            />
            <span className="text-sm">{isUrdu ? 'حتمی' : 'Final'}</span>
          </label>
        </div>
      </Card>

      {/* Institution Info & Head */}
      {selectedInstitution && headOfInstitution && (
        <Card variant="outlined" className="bg-surface p-4">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isUrdu ? 'dir-rtl text-right' : ''}`}>
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-3">
                <AppIcon name="school" size={20} className="text-primary" />
                {isUrdu ? 'ادارہ کی معلومات' : 'Institution Information'}
              </h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold">{isUrdu ? 'نام:' : 'Name:'}</span> {selectedInstitution.name}</div>
                <div><span className="font-semibold">{isUrdu ? 'ڈی ڈی او کوڈ:' : 'DDO Code:'}</span> <span className="font-mono">{selectedInstitution.ddo_code}</span></div>
                <div><span className="font-semibold">{isUrdu ? 'قسم:' : 'Type:'}</span> {selectedInstitution.type}</div>
                {selectedInstitution.tehsil && <div><span className="font-semibold">{isUrdu ? 'تحصیل:' : 'Tehsil:'}</span> {selectedInstitution.tehsil}</div>}
                {selectedInstitution.district && <div><span className="font-semibold">{isUrdu ? 'ضلع:' : 'District:'}</span> {selectedInstitution.district}</div>}
              </div>
            </div>
            <div>
              <h4 className="font-bold flex items-center gap-2 mb-3">
                <AppIcon name="person" size={20} className="text-primary" />
                {isUrdu ? 'سربراہ ادارہ' : 'Head of Institution'}
              </h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-semibold">{isUrdu ? 'نام:' : 'Name:'}</span> {headOfInstitution.employees.name}</div>
                <div><span className="font-semibold">{isUrdu ? 'عہدہ:' : 'Designation:'}</span> {headOfInstitution.employees.designation}</div>
                <div><span className="font-semibold">{isUrdu ? 'ذاتی نمبر:' : 'Personal No:'}</span> {headOfInstitution.employees.personal_no}</div>
              </div>
              <Badge variant="success" label={isUrdu ? 'خط جاری کنندہ' : 'Letter Issuing Authority'} className="mt-2" />
            </div>
          </div>
        </Card>
      )}

      {/* Statistics */}
      {stats && (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
          <StatCard 
            label={isUrdu ? 'کل ملازمین' : 'Total Employees'} 
            value={stats.totalEmployees.toString()} 
            icon="groups" 
            color="text-primary" 
          />
          <StatCard 
            label={isUrdu ? 'منتخب' : 'In List'} 
            value={seniorityList.length.toString()} 
            icon="format_list_numbered" 
            color="text-success" 
          />
          <StatCard 
            label={isUrdu ? 'عہدے' : 'Designations'} 
            value={stats.uniqueDesignations.toString()} 
            icon="work" 
            color="text-blue-500" 
          />
          <StatCard 
            label={isUrdu ? 'لسٹ کی قسم' : 'List Type'} 
            value={listType} 
            icon={listType === 'Provisional' ? 'pending' : 'verified'} 
            color={listType === 'Provisional' ? 'text-warning' : 'text-success'} 
          />
        </div>
      )}

      {/* Seniority List Table */}
      {selectedDDO ? (
        <DataTable
          data={seniorityList}
          columns={columns}
          emptyState={{
            icon: 'format_list_numbered',
            title: isUrdu ? 'کوئی ملازم نہیں' : 'No employees found',
            description: isUrdu ? 'منتخب ادارے میں کوئی ملازم نہیں ملا' : 'No employees found for selected criteria',
          }}
        />
      ) : (
        <Card variant="outlined" className="bg-surface p-12 text-center">
          <AppIcon name="school" size={64} className="mx-auto mb-4 opacity-20" />
          <h4 className="font-bold text-lg mb-2">
            {isUrdu ? 'ادارہ منتخب کریں' : 'Select an Institution'}
          </h4>
          <p className="text-sm text-on-surface-variant">
            {isUrdu 
              ? 'سینیارٹی لسٹ دیکھنے کے لیے اوپر سے ادارہ منتخب کریں'
              : 'Select an institution from above to view seniority list'
            }
          </p>
        </Card>
      )}

      {/* Instructions */}
      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
        <AppIcon name="info" className="text-primary mt-1" />
        <div className={isUrdu ? 'text-right' : ''}>
          <h5 className="font-bold text-primary text-sm">
            {isUrdu ? 'سینیارٹی کے اصول' : 'Seniority Rules'}
          </h5>
          <ul className="text-xs text-on-surface-variant list-disc list-inside space-y-1 mt-1">
            <li>{isUrdu ? 'ریگولرائزیشن کی تاریخ سب سے اہم ہے' : 'Date of regularization is primary criteria'}</li>
            <li>{isUrdu ? 'اس کے بعد تقرری کی تاریخ' : 'Date of appointment is secondary'}</li>
            <li>{isUrdu ? 'عمر کے مطابق (بڑی عمر = سینئر)' : 'Age-based (older = more senior)'}</li>
            <li>{isUrdu ? 'عارضی لسٹ پر 15 دن میں اعتراض کیا جا سکتا ہے' : 'Objection period is 15 days for provisional list'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
