
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
        padding: '8mm 12mm', 
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
      
      {/* Header */}
      <div className="text-center font-bold mb-4 shrink-0">
        <div className="text-lg border-2 border-black rounded-full w-9 h-9 flex items-center justify-center mx-auto mb-1.5 font-bold">2</div>
        <div className="text-lg uppercase underline underline-offset-4">APPLICATION FOR PENSION / COMMUTATION</div>
        <div className="text-[9pt] font-normal mt-0.5 italic">(To be filled and signed by the retiring Government Servant)</div>
      </div>

      {/* Recipient */}
      <div className="mb-4 font-bold text-[11pt] shrink-0">
        To,<br/>
        <div className="pl-12 mt-0.5">
           The District Accounts Officer,<br/>
           District {employees.district}.
        </div>
      </div>

      <div className="mb-1 font-bold shrink-0">Sir/Madam,</div>

      {/* Main Body Content */}
      <div className="text-justify leading-[2.2] text-[11.5pt] font-serif">
         It is submitted that I, <span className="font-bold uppercase border-b border-black px-2">{employees.name}</span> {employees.gender === 'F' ? 'D/O or W/O' : 'S/O'} <span className="font-bold uppercase border-b border-black px-2">{employees.father_name}</span> Designation /Post Held <span className="font-bold uppercase border-b border-black px-2">{employees.designation}</span> BPS <span className="font-bold border-b border-black px-2">{employees.bps}</span> Nature of Appointment <span className="font-bold uppercase border-b border-black px-2">{employees.employment_category || 'Regular'}</span> w.e.f <span className="font-bold border-b border-black px-2">{doa}</span> CNIC No <span className="font-bold border-b border-black px-2 tracking-wider">{employees.cnic_no}</span> (Copy enclosed), Nationality <span className="font-bold uppercase border-b border-black px-2">{employees.nationality}</span> Personnel No <span className="font-bold border-b border-black px-2">{employees.personal_no}</span> Cell No <span className="font-bold border-b border-black px-2">{employees.mobile_no}</span> Postal Address <span className="font-bold uppercase border-b border-black px-2 leading-normal">{employees.address}</span>.
         <br/>
         That I have retired / have been permitted to retire from Government Service. I am due to retire / has been retired compulsory on <span className="font-bold border-b border-black px-2">{dor}</span>.
         <br/>
         I hereby opt for the <span className="font-bold underline">Direct Credit System (DCS)</span> for the transfer of my pension. My pension commutation / gratuity may be transferred / credited by the Accounts Office in the Bank <span className="font-bold uppercase border-b border-black px-2">{employees.bank_name}</span> Branch <span className="font-bold uppercase border-b border-black px-2">{employees.branch_name}</span> city <span className="font-bold uppercase border-b border-black px-2">{employees.district}</span> Account No <span className="font-bold font-mono border-b border-black px-2 tracking-wider">{employees.bank_ac_no}</span>.
         <br/>
         <div className="mt-2">
            <h3 className="font-bold underline mb-1">UNDERTAKINGS:</h3>
            <ol className="list-decimal list-outside ml-6 space-y-0.5 text-[10.5pt] leading-snug">
               <li>I do hereby undertake that the pension sanctioning authority may, within one year from the issue of Pension Payment Order (PPO), recover any of its dues from the pension granted to me.</li>
               <li>I hereby declare that I shall not take part in any elections or engage myself in political activities of any kind within two years from the date of my retirement.</li>
               <li>I hereby opt for commutation @ 35% (subject to a maximum of 35%) of my gross pension.</li>
               <li>I do hereby declare that I have neither applied for nor received any pension/commutation/gratuity in respect of any portion of the service included in this application.</li>
               <li>I hereby undertake to refund if the amount of pension granted to me afterwards found to be in excess of that to which I am entitled.</li>
            </ol>
         </div>
      </div>

      {/* Spacer */}
      <div className="flex-grow"></div>

      {/* Signatures Section */}
      <div className="flex justify-between items-end pb-8 pt-4 shrink-0 px-4">
         
         {/* LEFT: APPLICANT */}
         <div className="text-center w-64">
            <div className="h-20 mb-2 border-b-2 border-dotted border-gray-400"></div>
            <div className="font-bold text-[10pt] uppercase pt-1">Signature of Applicant</div>
            <div className="text-[11pt] uppercase mt-0.5 font-bold">{employees.name}</div>
         </div>

         {/* RIGHT: HEAD OF INSTITUTION */}
         <div className="text-center w-64">
            <div className="h-20 mb-2 border-b-2 border-dotted border-gray-400"></div>
            <div className="font-bold text-[10pt] uppercase pt-1 whitespace-pre-line leading-tight">
               {signatureTitle}
            </div>
         </div>

      </div>

      {/* Page Number */}
      <div className="text-center text-[9pt] text-gray-600 mt-2 shrink-0">Page 2</div>

    </div>
  );
};
