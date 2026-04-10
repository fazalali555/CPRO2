import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { format, parseISO } from 'date-fns';
import { getDEORecipientTitle, getBeneficiaryDetails, getApplicantRelationTitle } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try { return format(parseISO(dateStr), 'dd/MM/yyyy'); } catch { return ''; }
};

export const FamilyPensionApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  const ben = getBeneficiaryDetails(employee);
  const deathDate = employee.service_history.date_of_death || employee.service_history.date_of_retirement; 
  const applicantRelationTitle = getApplicantRelationTitle(ben.relation);

  return (
    <div className="bg-white text-black font-sans print-page fit-page mx-auto" 
      style={{ width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', fontSize: '10.5pt', overflow: 'hidden' }}>
      
      <div className="text-center font-bold mb-4">
        <div className="text-sm">Form 3 (PEN)</div>
        <div className="text-lg uppercase underline leading-tight">Application for Family Pension</div>
        <div className="text-[10px] font-normal leading-tight">(To be filled and signed by applicant himself/herself)</div>
      </div>

      <div className="mb-4">
        <div className="font-bold mb-2">The District Account Officer,</div>
        <div className="font-bold">{employee.employees.district}.</div>
      </div>

      <div className="mb-4 text-justify leading-[1.6]">
        <p>Dear Sir/Madam,</p>
        <p className="indent-8 mt-2 leading-[1.6]">
          It is submitted that my {applicantRelationTitle} <span className="font-bold uppercase border-b border-black px-2 inline-block min-w-[150px] text-center">{employee.employees.name}</span> 
          (<span className="uppercase border-b border-black px-2 inline-block min-w-[100px] text-center">{employee.employees.designation}</span>) has expired on 
          <span className="font-bold border-b border-black px-2 inline-block min-w-[100px] text-center">{formatDate(deathDate)}</span> (Death Certificate attached).
        </p>
        <p className="mt-2">
          I therefore request that the family pension admissible under the rules may kindly be sanctioned to me.
        </p>
      </div>

      {/* Family Members Table (Summary) */}
      <div className="mb-4">
        <p className="font-bold mb-2">2) List of Family Members:</p>
        <table className="w-full border-collapse border border-black text-center text-[10pt]">
          <thead>
            <tr>
              <th className="border border-black p-1 leading-tight">S.No</th>
              <th className="border border-black p-1 leading-tight">Name</th>
              <th className="border border-black p-1 leading-tight">Relation</th>
              <th className="border border-black p-1 leading-tight">CNIC No</th>
              <th className="border border-black p-1 leading-tight">Age/DOB</th>
              <th className="border border-black p-1 leading-tight">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-1">1</td>
              <td className="border border-black p-1 font-bold uppercase">{ben.name}</td>
              <td className="border border-black p-1 uppercase">{ben.relation}</td>
              <td className="border border-black p-1">{ben.cnic}</td>
              <td className="border border-black p-1">{formatDate(ben.dob) || ben.age}</td>
              <td className="border border-black p-1 uppercase">{ben.status || 'Alive'}</td>
            </tr>
            {/* Empty rows for layout */}
            <tr><td className="border border-black p-1 h-6">&nbsp;</td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td></tr>
          </tbody>
        </table>
        <div className="text-center font-bold text-xs mt-1">List of Family members/legal heirs is attached separately.</div>
      </div>

      <div className="mb-4 text-justify leading-[1.6]">
        <p>
          3) It is hereby informed that my gratuity/commutation/family pension may be transferred/credited by the Accounts Office in the following Bank Account:
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3 ml-4 font-bold">
           <div className="flex items-end">Bank: <span className="uppercase border-b border-black px-2 flex-grow ml-2">{ben.bank_name}</span></div>
           <div className="flex items-end">Branch: <span className="uppercase border-b border-black px-2 flex-grow ml-2">{ben.branch_name}</span></div>
           <div className="col-span-2 flex items-end">Account No: <span className="font-mono text-lg tracking-widest border-b border-black px-2 flex-grow ml-2">{ben.account_no}</span></div>
        </div>
      </div>

      <div className="mb-3">
        <h3 className="font-bold underline mb-2">UNDERTAKINGS:</h3>
        <ol className="list-decimal list-outside ml-5 space-y-1.5 text-sm text-justify leading-[1.6]">
          <li>I do hereby undertake that government may within one year of Pension Payment Order, recover any of its due from the pension granted to me.</li>
          <li>I do hereby declare that I have neither applied for nor received any family pension or gratuity in respect of any portion of the service included in this application.</li>
          <li>I hereby undertake to refund if the amount of family pension granted to me afterwards found to be in excess of that to which I am entitled.</li>
          <li>I do hereby declare that I have not received any family pension in respect of any portion of service included in this application.</li>
        </ol>
      </div>

      <div className="mt-auto flex justify-between items-end pt-6 pb-6" style={{ pageBreakInside: 'avoid' }}>
        <div className="text-center">
           <div className="w-40 h-[14mm] border border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-400 mb-2">Thumb Impression</div>
        </div>
        <div className="text-right space-y-4">
           <div>Signature: _______________________</div>
           <div className="flex items-end justify-end">Name: <span className="font-bold uppercase border-b border-black px-2 inline-block min-w-[150px] text-center">{ben.name}</span></div>
           <div className="flex items-end justify-end">CNIC: <span className="font-bold border-b border-black px-2 inline-block min-w-[150px] text-center">{ben.cnic}</span></div>
           <div className="flex items-end justify-end">Date: <span className="font-bold border-b border-black px-2 inline-block min-w-[100px] text-center">{formatDate(new Date().toISOString())}</span></div>
        </div>
      </div>

      <div className="border-t-2 border-black pt-2 text-center font-bold">
        HEAD OF OFFICE / DEPARTMENT
      </div>
    </div>
  );
};
