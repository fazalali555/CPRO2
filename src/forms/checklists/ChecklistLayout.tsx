import React, { useMemo } from 'react';
import { EmployeeRecord, CaseRecord, CaseChecklistItem } from '../../types';
import { calculateServiceDuration, getRetirementType, getDepartmentInfo, detectDepartment } from '../../utils';
import { OfficialLogo } from '../../components/OfficialLogo';
import { Letterhead } from '../../components/Letterhead';
import { format } from 'date-fns';

interface ChecklistLayoutProps {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
  title: string;
  items: CaseChecklistItem[];
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return format(d, 'dd-MM-yyyy');
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-end leading-none py-0.5">
    <span className="whitespace-nowrap mr-2 font-medium">{label}:</span>
    <div 
      className="flex-grow border-b border-black text-left pl-2 pb-0 font-bold uppercase truncate" 
      style={{ minHeight: '1.1em' }}
    >
      {value || '________________'}
    </div>
  </div>
);

interface TableRowProps {
  no: number;
  text: string;
  rowHeight: string;
}

const TableRow: React.FC<TableRowProps> = ({ no, text, rowHeight }) => (
  <tr style={{ height: rowHeight }}>
    <td className="border border-black p-1 text-center font-medium align-middle">{no}</td>
    <td className="border border-black px-2 py-1 align-middle">{text}</td>
    <td className="border border-black p-1 align-middle"></td>
    <td className="border border-black p-1 text-center align-middle">Yes</td>
    <td className="border border-black p-1 align-middle"></td>
    <td className="border border-black p-1 text-center align-middle">Yes</td>
    <td className="border border-black p-1 align-middle"></td>
  </tr>
);

export const ChecklistLayout: React.FC<ChecklistLayoutProps> = ({ employee, caseRecord, title, items }) => {
  const service = calculateServiceDuration(
    employee.service_history.date_of_appointment,
    employee.service_history.date_of_retirement,
    employee.service_history.lwp_days
  );

  const natureOfRetirement = (caseRecord.extras?.nature_of_retirement as string) || getRetirementType(employee, caseRecord);
  const lprDays = employee.service_history.lpr_days ?? 0;
  
  // Calculate available height for table
  const tableAreaHeight = items.length > 20 ? 175 : 157; // mm - Increase table area if many items
  const headerRowHeight = 10; // mm
  const rowHeight = items.length > 20 ? '6.5mm' : (items.length > 15 ? '8.5mm' : '10mm');

  return (
    <div 
      className="bg-white text-black font-sans relative print-page mx-auto"
      style={{
        width: '210mm',
        height: '297mm',
        padding: '5mm 10mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontSize: '10pt'
      }}
    >
      <div className="flex flex-col h-full">
        
        {/* Dynamic Letterhead Header */}
        <div className="scale-90 origin-top">
          <Letterhead employeeRecord={employee} />
        </div>
        
        <div className="w-full border-b-4 border-double border-black mb-1 mt-0"></div>
        
        <div className="text-center mb-2">
          <h1 className="text-[12pt] font-bold uppercase tracking-tight border-b-2 border-black inline-block pb-0.5 leading-none">
            {title}
          </h1>
        </div>

        {/* ========== EMPLOYEE DETAILS SECTION ========== */}
        <div 
          className="grid grid-cols-2 gap-x-6 gap-y-1 mb-2" 
          style={{ fontSize: '9pt' }}
        >
          <div className="space-y-1">
            <InfoRow label="Name of Employee" value={employee.employees.name} />
            <InfoRow label="Designation (BPS)" value={`${employee.employees.designation} (BPS-${employee.employees.bps})`} />
            <InfoRow label="Date of Retirement" value={formatDate(employee.service_history.date_of_retirement)} />
            <InfoRow label="Total Service" value={service.text} />
          </div>
          <div className="space-y-1">
            <InfoRow label="Father Name" value={employee.employees.father_name} />
            <InfoRow label="Date of 1st Appointment" value={formatDate(employee.service_history.date_of_appointment)} />
            <InfoRow label="Nature of Retirement" value={natureOfRetirement} />
            <InfoRow label="Leave Encashment Dues" value={lprDays > 0 ? `${lprDays} Days` : 'N/A'} />
          </div>
        </div>

        {/* ========== MAIN TABLE SECTION ========== */}
        <div 
          className="w-full overflow-hidden"
          style={{ 
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <table 
            className="w-full border-collapse" 
            style={{ 
              fontSize: '8.5pt',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '44%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
            </colgroup>
            <thead>
              <tr style={{ height: `${headerRowHeight}mm` }}>
                <th className="border border-black p-1 text-center align-middle font-bold" rowSpan={2}>
                  S/NO
                </th>
                <th className="border border-black p-1 text-center align-middle font-bold" rowSpan={2}>
                  Required documents
                </th>
                <th className="border border-black p-1 text-center align-middle leading-tight font-bold">
                  Checked By<br />Principal
                </th>
                <th className="border border-black p-1 text-center align-middle leading-tight font-bold">
                  Yes/<br />No
                </th>
                <th className="border border-black p-1 text-center align-middle leading-tight font-bold">
                  Checked by<br />Dealing
                </th>
                <th className="border border-black p-1 text-center align-middle leading-tight font-bold">
                  Yes/<br />No
                </th>
                <th className="border border-black p-1 text-center align-middle leading-tight font-bold">
                  Page<br />No
                </th>
              </tr>
              <tr>{/* Rowspan placeholder */}</tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <TableRow 
                  key={item.id} 
                  no={idx + 1} 
                  text={item.label} 
                  rowHeight={rowHeight}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* ========== SIGNATURE SECTION ========== */}
        <div 
          className="flex justify-between items-end px-4 font-bold"
          style={{ 
            minHeight: '25mm',
            paddingTop: '5mm',
            marginTop: 'auto',
            fontSize: '9pt',
          }}
        >
          {/* Left Signature */}
          <div className="text-center" style={{ width: '35%' }}>
            <div 
              className="border-t border-black mb-1" 
              style={{ 
                width: '100%',
                marginTop: '12mm', // Reduced space for actual signature
              }}
            ></div>
            <div>Dealing Assistant</div>
          </div>

          {/* Right Signature */}
          <div className="text-center" style={{ width: '45%' }}>
            <div 
              className="border-t border-black mb-1" 
              style={{ 
                width: '100%',
                marginTop: '12mm', // Reduced space for actual signature
              }}
            ></div>
            <div>{employee.employees.office_name || 'Sub Divisional Education Officer'}</div>
          </div>
        </div>

      </div>
    </div>
  );
};