
import React from 'react';
import { EmployeeRecord } from '../../types';
import { getDEORecipientTitle } from '../../utils';

interface Props {
  employee: EmployeeRecord;
}

export const PostRetirementApplication: React.FC<Props> = ({ employee }) => {
  const ben = employee.extras?.beneficiary || {};
  const recipientLine = getDEORecipientTitle(employee);

  return (
    <div className="bg-white text-black font-serif text-[11pt] leading-[1.6] relative print-page fit-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      <div className="text-center font-bold mb-4">
        <h1 className="text-lg uppercase underline mb-1 leading-tight">APPLICATION FOR FAMILY PENSION</h1>
        <div className="text-xs leading-tight">(in case of death of pensioner after retirement)</div>
        <div className="text-[10px] font-normal leading-tight">(to be filled and signed by the applicant himself/herself)</div>
      </div>

      <div className="mb-4 font-bold">
        To,<br/>
        <div className="pl-8 mt-1">
          {recipientLine.replace(/, District.*$/, '')}<br/>
          District {employee.employees.district}
        </div>
      </div>

      <div className="mb-3 text-justify leading-[1.6]">
        <span className="font-bold">Dear Sir,</span><br/>
        <div className="indent-8 mt-1">
          It is submitted that my Husband/Wife/Father/Mother <span className="font-bold uppercase border-b border-black px-1">{employee.employees.name}</span> who has been retired as <span className="font-bold uppercase border-b border-black px-1">{employee.employees.designation}</span> (BPS-{employee.employees.bps}) from Education department, and drawing pension from <span className="font-bold uppercase border-b border-black px-1">{ben.bank_name}</span>, has expired on <span className="font-bold border-b border-black px-1">{employee.service_history.date_of_death || employee.service_history.date_of_retirement}</span>.
        </div>
      </div>

      <div className="mb-3 text-justify">
        2. I, therefore request, that the family pension admissible under the rules may kindly be sanctioned and transferred into my name.
      </div>

      <div className="mb-2">
        3. It is declared that:
        <div className="pl-4 mt-1 space-y-1">
           <p>i) Neither I nor any family member holding any pensionable post.</p>
           <p>ii) The following members of the family are pensionable posts: (N/A)</p>
           <p>iii) Neither I nor any family member is drawing any kind of pension.</p>
        </div>
      </div>

      {/* Table - Compact */}
      <div className="mb-3 px-4">
         <table className="w-full border-collapse border border-black text-center text-[10pt]">
            <thead>
               <tr className="bg-gray-100 print:bg-transparent">
                  <th className="border border-black p-1 w-10">S.No</th>
                  <th className="border border-black p-1">Name of Family member</th>
                  <th className="border border-black p-1">Relationship with deceased</th>
                  <th className="border border-black p-1">Post held with BPS Department/Office</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td className="border border-black h-6"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
               </tr>
               <tr>
                  <td className="border border-black h-6"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
                  <td className="border border-black"></td>
               </tr>
            </tbody>
         </table>
      </div>

      <div className="mb-4 space-y-1.5">
         <p>iv) I have neither received nor applied for any family pension.</p>
         <p>v) Any amount of the family pension granted to me, afterwards found to be in excess, I undertake to refund.</p>
      </div>

      {/* Footer Signatures */}
      <div className="mt-auto flex justify-end" style={{ pageBreakInside: 'avoid' }}>
         <div className="text-center w-64">
            <div className="h-[14mm]"></div>
            <div className="border-b border-black mb-1 mx-4"></div>
            <div className="font-bold uppercase text-base">{ben.name}</div>
            <div className="text-sm">Widow/Heir</div>
         </div>
      </div>
      
      <div className="text-center text-xs mt-2 font-sans">Page 4</div>
    </div>
  );
};
