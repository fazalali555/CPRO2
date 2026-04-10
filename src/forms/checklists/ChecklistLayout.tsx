import React from 'react';
import { EmployeeRecord, CaseRecord, CaseChecklistItem } from '../../types';
import { calculateServiceDuration, getRetirementType } from '../../utils';
import { OfficialLogo } from '../../components/OfficialLogo';
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
  <div className="flex items-end">
    <span className="whitespace-nowrap mr-2 font-medium">{label}:</span>
    <div 
      className="flex-grow border-b border-black text-left pl-2 pb-0.5 font-bold uppercase truncate" 
      style={{ minHeight: '1.2em' }}
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
  // Page: 297mm, Padding: 20mm (10mm*2), Header: ~25mm, Info: ~35mm, Footer: 45mm, Margins: ~15mm
  // Remaining for table: ~157mm
  const tableAreaHeight = 157; // mm
  const headerRowHeight = 12; // mm
  const availableForRows = tableAreaHeight - headerRowHeight;
  const rowHeight = items.length > 0 ? `${availableForRows / items.length}mm` : '10mm';

  return (
    <div 
      className="bg-white text-black font-sans leading-tight relative print-page mx-auto"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '10mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11pt',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex flex-col h-full">
        
        {/* ========== HEADER SECTION ========== */}
        <div className="flex items-start gap-4 mb-2" style={{ minHeight: '18mm' }}>
          <div className="w-[15mm] flex-shrink-0 flex flex-col items-center">
            <OfficialLogo className="w-full h-auto" />
          </div>
          <div className="flex-grow text-center pt-2">
            <h1 className="font-bold uppercase" style={{ fontSize: '13pt', lineHeight: 1.3 }}>
              {title}
            </h1>
          </div>
        </div>

        <div className="w-full border-b-2 border-black mb-1"></div>
        <div className="w-full border-b border-black mb-3"></div>

        {/* ========== EMPLOYEE DETAILS SECTION ========== */}
        <div 
          className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4" 
          style={{ fontSize: '10pt' }}
        >
          <div className="space-y-2">
            <InfoRow label="Name of Employee" value={employee.employees.name} />
            <InfoRow label="Designation (BPS)" value={`${employee.employees.designation} (BPS-${employee.employees.bps})`} />
            <InfoRow label="Date of Retirement" value={formatDate(employee.service_history.date_of_retirement)} />
            <InfoRow label="Total Service" value={service.text} />
          </div>
          <div className="space-y-2">
            <InfoRow label="Father Name" value={employee.employees.father_name} />
            <InfoRow label="Date of 1st Appointment" value={formatDate(employee.service_history.date_of_appointment)} />
            <InfoRow label="Nature of Retirement" value={natureOfRetirement} />
            <InfoRow label="Leave Encashment Dues" value={lprDays > 0 ? `${lprDays} Days` : 'N/A'} />
          </div>
        </div>

        {/* ========== MAIN TABLE SECTION ========== */}
        <div 
          className="w-full border border-black"
          style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: `${tableAreaHeight}mm`,
          }}
        >
          <table 
            className="w-full border-collapse" 
            style={{ 
              fontSize: '9pt',
              height: '100%',
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
            minHeight: '45mm',
            paddingTop: '15mm',
            marginTop: 'auto',
            fontSize: '10pt',
          }}
        >
          {/* Left Signature */}
          <div className="text-center" style={{ width: '35%' }}>
            <div 
              className="border-t border-black mb-1" 
              style={{ 
                width: '100%',
                marginTop: '20mm', // Space for actual signature
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
                marginTop: '20mm', // Space for actual signature
              }}
            ></div>
            <div>{employee.employees.office_name || 'Sub Divisional Education Officer'}</div>
          </div>
        </div>

      </div>
    </div>
  );
};