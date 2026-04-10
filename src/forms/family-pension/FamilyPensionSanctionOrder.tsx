
import React from 'react';
import { EmployeeRecord } from '../../types';
import { formatCurrency, calculateServiceDuration } from '../../utils';
import { calculateFamilyPension } from '../../lib/pension';

import { differenceInYears, parseISO } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
}

export const FamilyPensionSanctionOrder: React.FC<Props> = ({ employee }) => {
  const ben = employee.extras?.beneficiary || {};
  
  // Calculate Service & Pension
  const endDate = employee.service_history.date_of_death || employee.service_history.date_of_retirement;
  const service = calculateServiceDuration(
    employee.service_history.date_of_appointment,
    endDate,
    employee.service_history.lwp_days
  );
  
  let qService = service.years;
  if (service.months >= 6) qService += 1;
  qService = Math.min(qService, 30);

  // Age at retirement (default 60 if missing)
  let ageAtRetirement = 60;
  if (employee.employees.dob && employee.service_history.date_of_retirement) {
     ageAtRetirement = differenceInYears(parseISO(employee.service_history.date_of_retirement), parseISO(employee.employees.dob));
  }

  const famPension = calculateFamilyPension(
    employee.employees.status,
    employee.financials.last_basic_pay,
    employee.financials.p_pay,
    qService,
    ageAtRetirement,
    employee.extras?.commutation_portion ?? 35
  );

  const netPension = famPension?.netPension || 0;
  const familyPension = famPension?.netFamilyPension || 0;

  return (
    <div className="bg-white text-black font-serif text-[10.5pt] leading-[1.6] relative print-page fit-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* Header Moved from Page 5 */}
      <div className="text-center mb-3">
         <h1 className="text-xl font-bold uppercase underline mb-1 leading-tight">
            FAMILY PENSION SANCTION
         </h1>
         <div className="text-xs font-normal leading-tight">
            (to be issued by the Pension Sanctioning authority in the event of death after retirement)
         </div>
      </div>

      <div className="mb-3 font-bold text-justify">
         <span className="mr-2 underline">Subject:</span>
         <span className="underline uppercase">SANCTION OF FAMILY PENSION IN CASE OF DEATH AFTER RETIREMENT</span>
      </div>

      <div className="mb-3 text-justify">
         1. It is mentioned that Mr/Mst: <span className="font-bold uppercase border-b border-black px-1">{employee.employees.name}</span> S/O, D/O, W/O <span className="font-bold uppercase border-b border-black px-1">{employee.employees.father_name}</span> working as <span className="font-bold uppercase border-b border-black px-1">{employee.employees.designation} {employee.employees.bps}</span> posted in <span className="font-bold uppercase border-b border-black px-1">{employee.employees.school_full_name}</span> in Education department, retired on <span className="font-bold border-b border-black px-1">{employee.service_history.date_of_retirement}</span> and has expired on <span className="font-bold border-b border-black px-1">{employee.service_history.date_of_retirement}</span>.
      </div>

      <div className="mb-3 text-justify">
         2. Family pension @ 75% of net pension, the deceased has been drawing immediately before his/her death is sanctioned of in favour of the following family member (s)
      </div>

      <div className="mb-3">
         <table className="w-full border border-black text-center text-[10pt]">
            <thead>
               <tr className="bg-gray-100 print:bg-transparent font-bold leading-tight">
                  <th className="border border-black p-1 w-12">S.No</th>
                  <th className="border border-black p-1">Name</th>
                  <th className="border border-black p-1 w-16">Age</th>
                  <th className="border border-black p-1">Relationship with the deceased pensioner</th>
                  <th className="border border-black p-1">Marital status</th>
                  <th className="border border-black p-1 w-20">Share of family pension</th>
                  <th className="border border-black p-1 w-20">Any disability</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td className="border border-black p-1">1</td>
                  <td className="border border-black p-1 uppercase font-bold">{ben.name}</td>
                  <td className="border border-black p-1">{ben.dob}</td>
                  <td className="border border-black p-1 uppercase">{ben.relation}</td>
                  <td className="border border-black p-1 uppercase">{ben.status}</td>
                  <td className="border border-black p-1">100%</td>
                  <td className="border border-black p-1">N/A</td>
               </tr>
            </tbody>
         </table>
      </div>

      <div className="mb-3 ml-4">
         <div className="font-bold underline mb-2">3. Family pension calculation:</div>
         <div className="flex justify-between w-[380px] border-b border-black mb-1 pb-1">
            <span>Net pension of the deceased</span>
            <span>{formatCurrency(netPension)}</span>
         </div>
         <div className="flex justify-between w-[380px] border-b border-black mb-1 pb-1">
            <span>Family pension @ 100% of gross pension</span>
            <span>{formatCurrency(familyPension)}</span>
         </div>
      </div>

      <div className="mb-2 font-bold">Other benefits</div>
      <div className="mb-3 ml-4 space-y-1.5">
         <div className="flex w-[380px]">
            <span className="w-8">i)</span>
            <div className="border-b border-black flex-grow"></div>
            <span className="mx-2">Rs.</span>
            <div className="border-b border-black w-24"></div>
         </div>
         <div className="flex w-[380px]">
            <span className="w-8">ii)</span>
            <div className="border-b border-black flex-grow"></div>
            <span className="mx-2">Rs.</span>
            <div className="border-b border-black w-24"></div>
         </div>
      </div>

      <div className="mb-2">it is certified that:</div>
      <div className="mb-3 text-sm space-y-1 pl-4">
         <p>4. No inquiry is pending against the deceased civil servant</p>
         <p>5. No demand / recovery is outstanding against the deceased.</p>
         <p>6. Advances drawn by the deceased (if any) have been fully repaid or waived off.</p>
      </div>

      <div className="mb-3 text-justify text-sm">
         7. As per record, it is verified that Mr/Mst <span className="font-bold uppercase underline">{ben.name}</span> CNIC <span className="font-bold underline">{ben.cnic}</span> is bonafide family member entitled to family pension of Mr/Mst <span className="font-bold uppercase underline">{employee.employees.name}</span> (late) and his/her gratuity and family pension may be transferred/credited in <span className="font-bold uppercase underline">{ben.bank_name}</span> Branch <span className="font-bold uppercase underline">{ben.branch_name}</span> Account Number(s) <span className="font-bold font-mono underline">{ben.account_no}</span> as opted.
      </div>

      <div className="mb-2 text-sm">
         8. Administrative and financial sanction for grant of family pension/gratuity is hereby accorded.
      </div>
      <div className="mb-3 text-sm underline font-bold">The following documents are attached.</div>

      <div className="mt-auto flex justify-between items-end" style={{ pageBreakInside: 'avoid' }}>
         <div className="mb-2 w-64">
            <div className="border-b border-black pb-1 mb-1"></div>
            Dated: __________________
         </div>
         <div className="text-center font-bold w-72">
            <div className="h-[14mm]"></div>
            SIGNATURE WITH STAMP OF<br/>
            PENSION AUTHORIY/ HEAD<br/>
            OF DEPARTMENT
         </div>
      </div>
    </div>
  );
};
