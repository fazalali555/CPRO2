
import React from 'react';
import { EmployeeRecord } from '../../types';
import { format, parseISO } from 'date-fns';
import { getHeadOfInstitutionTitle } from '../../utils';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try { return format(parseISO(dateStr), 'dd-MM-yyyy'); } catch { return dateStr; }
};

export const PensionApplication: React.FC<Props> = ({ employee }) => {
  const { employees, service_history } = employee;
  const dor = formatDate(service_history.date_of_retirement);
  const doa = formatDate(service_history.date_of_appointment);
  
  // Dynamic Head Title for Right Signature
  const headTitle = getHeadOfInstitutionTitle(employee);
  const isSDEO = headTitle.includes('SDEO') || headTitle.includes('Sub Divisional Education Officer');
  const signatureTitle = isSDEO
    ? headTitle 
    : `${headTitle}\n${employees.school_full_name}`;

  return (
    <div className="bg-white text-black font-serif text-[11pt] leading-snug relative print-page mx-auto flex flex-col"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        minHeight: '297mm',
        maxHeight: '297mm',
        padding: '8mm 15mm', 
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
      
      {/* Header */}
      <div className="text-center font-bold mb-6 shrink-0">
        <div className="text-lg border-2 border-black rounded-full w-9 h-9 flex items-center justify-center mx-auto mb-2 font-bold">2</div>
        <div className="text-lg uppercase underline underline-offset-4">APPLICATION FOR PENSION / COMMUTATION</div>
        <div className="text-[9pt] font-normal mt-1 italic">(To be filled and signed by the retiring Government Servant)</div>
      </div>

      {/* Recipient */}
      <div className="mb-6 font-bold text-[11pt] shrink-0">
        To,<br/>
        <div className="pl-12 mt-1">
           The District Accounts Officer,<br/>
           District {employees.district}.
        </div>
      </div>

      <div className="mb-2 font-bold shrink-0">Sir/Madam,</div>

      {/* Main Body Content */}
      <div className="text-justify leading-[2.8] text-[12pt] font-serif">
         It is submitted that I, <span className="font-bold uppercase border-b border-black px-2">{employees.name}</span> Son of /Daughter of / Wife of <span className="font-bold uppercase border-b border-black px-2">{employees.father_name}</span> Designation /Post Held <span className="font-bold uppercase border-b border-black px-2">{employees.designation}</span> BPS <span className="font-bold border-b border-black px-2">{employees.bps}</span> Nature of Appointment <span className="font-bold uppercase border-b border-black px-2">{employees.employment_category || 'Regular'}</span> w.e.f <span className="font-bold border-b border-black px-2">{doa}</span> CNIC No <span className="font-bold border-b border-black px-2 tracking-wider">{employees.cnic_no}</span> (Copy enclosed), Nationality <span className="font-bold uppercase border-b border-black px-2">{employees.nationality}</span> Personnel No <span className="font-bold border-b border-black px-2">{employees.personal_no}</span> Cell No <span className="font-bold border-b border-black px-2">{employees.mobile_no}</span> Email <span className="border-b border-black px-2 min-w-[100px] inline-block"></span> Postal Address <span className="font-bold uppercase border-b border-black px-2 leading-normal">{employees.address}</span>.
         <br/>
         That I have retired / have been permitted to retire from Government Service. I am due to retire /has been retired compulsory on <span className="font-bold border-b border-black px-2">{dor}</span>.
         <br/>
         My pension commutation /gratuity may be transferred /credited by the Accounts Office in the Bank <span className="font-bold uppercase border-b border-black px-2">{employees.bank_name}</span> Branch <span className="font-bold uppercase border-b border-black px-2">{employees.branch_name}</span> city <span className="font-bold uppercase border-b border-black px-2">{employees.district}</span> Account No <span className="font-bold font-mono border-b border-black px-2 tracking-wider">{employees.bank_ac_no}</span>.
         <br/>
         (DCS Form (where applicable) and list of my family members is enclosed).
      </div>

      {/* Spacer */}
      <div className="flex-grow"></div>

      {/* Signatures Section */}
      <div className="flex justify-between items-end pb-8 pt-4 shrink-0">
         
         {/* LEFT: APPLICANT */}
         <div className="text-center w-60">
            <div className="h-16 mb-2"></div>
            <div className="border-t border-black w-full mb-1 pt-1"></div>
            <div className="font-bold text-[10pt] uppercase">Signature of Applicant</div>
            <div className="text-[11pt] uppercase mt-1 font-bold">{employees.name}</div>
         </div>

         {/* RIGHT: HEAD OF INSTITUTION */}
         <div className="text-center w-60">
            <div className="h-16 mb-2"></div>
            <div className="border-t border-black w-full mb-1 pt-1"></div>
            <div className="font-bold text-[10pt] uppercase whitespace-pre-line leading-tight">
               {signatureTitle}
            </div>
         </div>

      </div>

      {/* Page Number */}
      <div className="text-center text-[9pt] text-gray-600 mt-2 shrink-0">Page 2</div>

    </div>
  );
};
