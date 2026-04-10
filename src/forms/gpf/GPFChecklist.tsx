
import React from 'react';
import { EmployeeRecord, CaseRecord, CaseChecklistItem } from '../../types';
import { calculateServiceDuration, getOfficialGPFChecklist } from '../../utils';
import { Letterhead } from '../../components/Letterhead';
import { format } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const GPFChecklist: React.FC<Props> = ({ employee, caseRecord }) => {
  const service = calculateServiceDuration(
    employee.service_history.date_of_appointment,
    employee.service_history.date_of_retirement,
    employee.service_history.lwp_days
  );
  
  const checklistItems = getOfficialGPFChecklist(caseRecord.case_type, employee);
  
  // Format dates
  const dob = employee.employees.dob ? format(new Date(employee.employees.dob), 'dd-MM-yyyy') : '';
  const doa = employee.service_history.date_of_appointment ? format(new Date(employee.service_history.date_of_appointment), 'dd-MM-yyyy') : '';

  return (
    <div 
      className="bg-white text-black font-sans relative print-page mx-auto"
      style={{
        width: '210mm',
        height: '297mm',
        padding: '12mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontSize: '11pt'
      }}
    >
      {/* Header */}
      <Letterhead employeeRecord={employee} />
      
      <div className="w-full border-b-4 border-double border-black mb-4"></div>
      
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black inline-block pb-1">
          Checklist Documents Required for GPF Advance
        </h1>
        <div className="text-sm font-bold mt-1 uppercase text-gray-600">
           ({caseRecord.case_type.replace('gpf_', '').replace('_', ' ')})
        </div>
      </div>

      {/* Personal Info Grid */}
      <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm font-medium">
        <InfoRow label="Name of Employee" value={employee.employees.name} />
        <InfoRow label="Father Name" value={employee.employees.father_name} />
        <InfoRow label="Designation (BPS)" value={`${employee.employees.designation} (BPS-${employee.employees.bps})`} />
        <InfoRow label="Date of 1st Appointment" value={doa} />
        <InfoRow label="Total Service" value={service.text} />
        <InfoRow label="GPF Account No" value={employee.employees.gpf_account_no} />
      </div>

      {/* Checklist Table */}
      <div className="w-full border-2 border-black mb-8 flex-grow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-center text-xs font-bold bg-gray-100 print:bg-transparent">
              <th className="border border-black p-2 w-[8%]">S/No</th>
              <th className="border border-black p-2 w-[42%] text-left">Required Documents</th>
              <th className="border border-black p-2 w-[12%] leading-tight">Checked<br/>by<br/>Principal</th>
              <th className="border border-black p-2 w-[10%] leading-tight">Yes<br/>or<br/>No</th>
              <th className="border border-black p-2 w-[12%] leading-tight">Checked<br/>by<br/>Dealing</th>
              <th className="border border-black p-2 w-[10%] leading-tight">Yes<br/>or<br/>No</th>
              <th className="border border-black p-2 w-[6%] leading-tight">Page<br/>No</th>
            </tr>
          </thead>
          <tbody>
            {checklistItems.map((item, index) => (
              <tr key={item.id} style={{ height: '10mm' }}>
                <td className="border border-black text-center align-middle font-medium">
                  {index + 1}
                </td>
                <td className="border border-black px-3 align-middle text-sm leading-tight">
                  {item.label}
                </td>
                {/* Empty Check Columns */}
                <td className="border border-black"></td>
                <td className="border border-black text-center align-middle font-bold text-lg">✓</td>
                <td className="border border-black"></td>
                <td className="border border-black text-center align-middle font-bold text-lg">✓</td>
                <td className="border border-black"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div className="flex justify-between items-end mt-auto px-4 pb-8">
        <div className="text-center w-48">
          <div className="font-bold text-sm mb-1">Dealing Assistant</div>
          <div className="w-full border-t border-black"></div>
        </div>
        
        <div className="text-center w-64">
           <div className="font-bold text-sm mb-1">D.D.O Sign and Stamp</div>
           <div className="w-full border-t border-black"></div>
        </div>
      </div>
      
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex items-end">
    <span className="w-40 font-bold text-xs uppercase">{label}:</span>
    <div className="flex-1 border-b border-black text-center pb-0.5 font-bold uppercase text-xs truncate">
      {value || '________________'}
    </div>
  </div>
);
