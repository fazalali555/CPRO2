
import React from 'react';
import { EmployeeRecord } from '../../types';

interface Props {
  employee: EmployeeRecord;
}

export const PostRetirementSignatures: React.FC<Props> = ({ employee }) => {
  const ben = employee.extras?.beneficiary || {};

  return (
    <div className="bg-white text-black font-serif text-[12pt] leading-tight relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      <div className="mb-8">
         <h3 className="font-bold mb-3">5. The following duly attested are attached:</h3>
         <ul className="list-disc pl-5 space-y-3 text-[12pt]">
            <li>Three specimen signatures of the undersigned.</li>
            <li>Three sets of thumb and finger impression of the undersigned.</li>
            <li>Three photographs of the undersigned.</li>
            <li>Three sets of lists of particulars of my deceased husband.</li>
            <li>Three sets of descriptive rolls.</li>
            <li>Non marriage / nonseparation / single widow certificate.</li>
            <li>Three copies of the CNIC of the undersigned.</li>
            <li>In case of widow daughter, Nikahnama and death certificate of her husband.</li>
            <li>In case of divorced daughter, Nikahnama and divorced certificate.</li>
            <li>Option for Direct Credit System (DCS) and Indemnity Bond on stamp paper.</li>
         </ul>
      </div>

      <div className="mt-32 flex justify-end">
         <div className="text-center w-72">
            <div className="font-bold mb-12 text-left pl-4">Your faithfully,</div>
            
            <div className="border-t-2 border-black mb-2 pt-2 font-bold uppercase text-lg">
               Signature
            </div>
            <div className="font-bold uppercase text-lg">{ben.name}</div>
            <div className="text-sm">widow of {employee.employees.name} {employee.employees.designation}</div>
            <div className="text-sm">{employee.employees.school_full_name}</div>
         </div>
      </div>

      <div className="mt-32 mb-8">
         <div className="font-bold uppercase text-lg">C/Signed By DDO</div>
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-sans">Page 5</div>
    </div>
  );
};
