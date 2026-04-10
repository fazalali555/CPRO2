
import React from 'react';
import { EmployeeRecord } from '../../types';

interface Props {
  employee: EmployeeRecord;
}

export const FamilyPensionSanctionAuthority: React.FC<Props> = ({ employee }) => {
  const ben = employee.extras?.beneficiary || {};

  return (
    <div className="bg-white text-black font-sans text-sm relative print-page fit-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      <div className="mb-4 text-justify leading-[1.6]">
        <p className="mb-4">
          (7-a) Undersigned is satisfied that the services of Mr/Mrs/Ms <span className="font-bold uppercase border-b border-black px-2">{employee.employees.name}</span> 
          has not been satisfactory and it has been decided that the full Pension / Gratuity found to be admissible under the rules should be reduced by the specific amount or percentage given below.
        </p>
        <div className="ml-8 space-y-2">
           <div className="flex justify-between">
             <span>i. Amount or percentage of reduction in pension</span>
             <span className="font-bold border-b border-black w-48 text-center">NIL</span>
           </div>
           <div className="flex justify-between">
             <span>ii. Amount or percentage of reduction in gratuity</span>
             <span className="font-bold border-b border-black w-48 text-center">NIL</span>
           </div>
           <p>iii. Sanction is hereby accorded to the grant of Pension / Gratuity as so reduced.</p>
        </div>
      </div>

      <div className="mb-4">
        (8) The payment of Pension and / or Gratuity may be commence w.e.f. <span className="font-bold border-b border-black px-4">{employee.service_history.date_of_death || employee.service_history.date_of_retirement}</span>
      </div>

      <div className="mb-4">
        <h3 className="font-bold underline mb-2">Following documents attached.</h3>
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
           <div>☐ Pension application</div>
           <div>☐ Dependent list</div>
           <div>☐ Notification of retirement</div>
           <div>☐ Specimen signature/Thumb Form</div>
           <div>☐ Last Pay Certificate /Last Pay slip</div>
           <div>☐ No demand, Declaration, Undertaking</div>
           <div>☐ Pension contribution receipts</div>
           <div>☐ Pensioner Bank Accounts Details</div>
           <div>☐ Death Certificate</div>
           <div>☐ Non-Marriage Certificate</div>
           <div>☐ Original service book</div>
           <div>☐ 3 Photos of Pensioner</div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-6" style={{ pageBreakInside: 'avoid' }}>
         <div className="font-bold">HEAD OF OFFICE/DEPARTMENT</div>
         <div className="text-center font-bold">
            <div className="h-[14mm]"></div>
            SIGNATURE WITH STAMP<br/>
            PENSION SANCTIONING AUTHORITY
         </div>
      </div>

      <div className="mb-6 text-justify">
         <p className="mb-4">
           1. The AGPR/Accounts Office is required to grant pension and endorse a copy of computerized pension payment Order (C.P.P.O) / Pension Payment Order (P.P.O) to this Department / Office.
         </p>
         <p>
           2. Mr/Mrs/Ms <span className="font-bold uppercase border-b border-black px-2">{ben.name}</span> you are hereby informed that your commutation (If opted) and first monthly pension shall be transferred / credited by Account Office in the:
         </p>
         <div className="ml-4 mt-2 font-bold grid grid-cols-1 gap-2">
            <div>Bank: <span className="uppercase underline">{ben.bank_name}</span></div>
            <div>Branch: <span className="uppercase underline">{ben.branch_name}</span></div>
            <div>Account No: <span className="font-mono underline">{ben.account_no}</span></div>
         </div>
      </div>

      <div className="mt-auto border-t-2 border-black pt-2">
         <div className="font-bold italic text-center text-xs">
            Important: Every Pensioner family pensioner is bound to provide life certificate / Non- marriage certificate to his / her bank on or before 10th March and 10th September of each year.
         </div>
      </div>
      <div className="text-center text-xs mt-2">Page 3</div>
    </div>
  );
};
