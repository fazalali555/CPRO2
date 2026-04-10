
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { calculateServiceDuration } from '../../utils';
import { OfficialLogo } from '../../components/OfficialLogo';

interface RetirementChecklistProps {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

export const RetirementChecklist: React.FC<RetirementChecklistProps> = ({ employee, caseRecord }) => {
  // Calculations
  const service = calculateServiceDuration(
    employee.service_history.date_of_appointment,
    employee.service_history.date_of_retirement,
    employee.service_history.lwp_days
  );

  const natureOfRetirement = (caseRecord.extras?.nature_of_retirement as string) || employee?.employees?.status || '';
  
  // Explicit LPR Binding
  const lprDays = employee.service_history.lpr_days ?? 0;
  const leaveEncashment = `${lprDays} Days`;

  return (
    <div 
      className="bg-white text-black font-sans leading-tight relative print-page fit-page mx-auto"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '9mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '10.5pt',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div className="flex flex-col h-full">
        
        {/* Header Section */}
        <div className="flex items-start gap-3 mb-1.5">
          {/* Logo */}
          <div className="w-[15mm] flex-shrink-0 flex flex-col items-center">
            <OfficialLogo className="w-full h-auto" />
          </div>

          {/* Title */}
          <div className="flex-grow text-center pt-1.5">
            <h1 className="font-bold uppercase" style={{ fontSize: '12pt', lineHeight: 1.15 }}>
              Checklist Documents Required for Retirement Sanction (Pre-Mature/ Superannuation/ Medical/ Death)
            </h1>
          </div>
        </div>

        {/* Separator Line */}
        <div className="w-full border-b-2 border-black mb-1"></div>
        <div className="w-full border-b border-black mb-3"></div>

        {/* Employee Details Form */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4" style={{ fontSize: '9.5pt' }}>
          {/* Left Column */}
          <div className="space-y-2">
            <InfoRow label="Name of Employee" value={employee.employees.name} />
            <InfoRow label="Designation (BPS)" value={`${employee.employees.designation} (BPS-${employee.employees.bps})`} />
            <InfoRow label="Date of Retirement" value={formatDate(employee.service_history.date_of_retirement)} />
            <InfoRow label="Total Service" value={service.text} />
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            <InfoRow label="Father Name" value={employee.employees.father_name} />
            <InfoRow label="Date of 1st Appointment" value={formatDate(employee.service_history.date_of_appointment)} />
            <InfoRow label="Nature of Retirement" value={natureOfRetirement} />
            <InfoRow label="Leave Encashment Dues" value={leaveEncashment} />
          </div>
        </div>

        {/* Main Table */}
        <div className="w-full border border-black flex-grow">
          <table className="w-full border-collapse" style={{ fontSize: '8.6pt' }}>
            <thead>
              <tr style={{ height: '8mm' }}>
                <th className="border border-black p-1 w-[12mm] text-center" rowSpan={2}>S/NO</th>
                <th className="border border-black p-1 text-center" rowSpan={2}>Required documents</th>
                <th className="border border-black p-0.5 w-[18mm] text-center leading-tight">Checked By Principal</th>
                <th className="border border-black p-0.5 w-[10mm] text-center leading-tight">Yes/No</th>
                <th className="border border-black p-0.5 w-[18mm] text-center leading-tight">Checked by Dealing</th>
                <th className="border border-black p-0.5 w-[10mm] text-center leading-tight">Yes/No</th>
                <th className="border border-black p-0.5 w-[12mm] text-center leading-tight">Page No</th>
              </tr>
              <tr>
                {/* Placeholder cells for rowspan layout */}
              </tr>
            </thead>
            <tbody>
              {/* Section 1 */}
              <SectionHeader text="IN CASE OF NORMAL RETIREMENT SUPERANNUATION/PREMEDICAL S. NO 1 to 14" />
              
              <TableRow no="1" text="Personal Number / Personnel No" y2 />
              <TableRow no="2" text="Application for Retirement" y2 />
              <TableRow no="3" text="CNIC Copy (Attested)" y2 />
              <TableRow no="4" text="First Appointment Order" y2 />
              <TableRow no="5" text="Promotion Order (if any)" y2 />
              <TableRow no="6" text="SSC Certificate (Date of Birth Proof)" y2 />
              <TableRow no="7" text="Last Pay Certificate (LPC) / Pay Slip" y2 />
              <TableRow no="8" text="No Demand Certificate" y2 />
              <TableRow no="9" text="Non-Involvement Certificate" y2 />
              <TableRow no="10" text="Leave Non-Availing Certificate (Last 12 months)" y2 />
              <TableRow no="11" text="NOC from Bank" y2 />
              <TableRow no="12" text="Clearance Certificate from School" y2 />
              <TableRow no="13" text="Affidavit Qualifying Service" y2 />
              <TableRow no="14" text="Original Service Book" y2 />
              <TableRow no="15" text="Medical Board Documents (In case of Medical Retirement)" />

              {/* Section 2 */}
              <SectionHeader text="IN CASE OF DEATH (S# 1 TO 14 & 16 to 22)" />

              <TableRow no="16" text="Legal Heir Certificate (in case of death)" />
              <TableRow no="17" text="Undertaking by the widow for qualifying service" />
              <TableRow no="18" text="Non-marriage certificate on judicial stamp paper" />
              <TableRow no="19" text="Single widow certificate on judicial stamp paper" />
              <TableRow no="20" text="Non-separation Certificate on judicial stamp paper" />
              <TableRow no="21" text="Death Certificate" />
              <TableRow no="22" text="Family Registration Certificate (FRC)" />

              {/* Section 3 */}
              <SectionHeader text="BPS – 16 AND ABOVE (S. NO 1 – 14 & 23 – 26)" />

              <TableRow no="23" text="NOC from C&W, PESCO, PTCL, SNGPL (16 and above)" />
              <TableRow no="24" text="Leave Admissibility Certificate from DAO" />
              <TableRow no="25" text="Charge Report" />
              <TableRow no="26" text="History of Service by DAO" />

            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-auto px-4 font-bold text-sm" style={{ pageBreakInside: 'avoid', paddingTop: '14mm' }}>
          <div className="text-center pr-4">
            <div className="h-[14mm]"></div>
            <div className="w-[50mm] border-b border-black mb-1.5"></div>
            Dealing Assistant
          </div>
          <div className="text-center pl-4">
            <div className="h-[14mm]"></div>
            <div className="w-[70mm] border-b border-black mb-1.5"></div>
            {employee.employees.office_name || 'Education Office'}
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Helper Components ---

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-end">
    <span className="whitespace-nowrap mr-2 font-medium">{label}:</span>
    <div className="flex-grow border-b border-black text-left pl-2 pb-0.5 font-bold uppercase truncate" style={{ minHeight: '1.2em' }}>
      {value}
    </div>
  </div>
);

const TableRow: React.FC<{ no: string; text: string; y2?: boolean }> = ({ no, text, y2 }) => (
  <tr style={{ height: '5.8mm' }}>
    <td className="border border-black p-0.5 text-center font-medium">{no}</td>
    <td className="border border-black px-2 py-0.5">{text}</td>
    <td className="border border-black p-0.5"></td>
    <td className="border border-black p-0.5 text-center"></td>
    <td className="border border-black p-0.5"></td>
    <td className="border border-black p-0.5 text-center font-bold">{y2 ? 'Y' : ''}</td>
    <td className="border border-black p-0.5"></td>
  </tr>
);

const SectionHeader: React.FC<{ text: string }> = ({ text }) => (
  <tr>
    <td className="border border-black p-0 bg-gray-100 print:bg-transparent"></td>
    <td className="border border-black px-2 py-0.5 font-bold uppercase" style={{ fontSize: '8pt' }} colSpan={6}>
      {text}
    </td>
  </tr>
);
