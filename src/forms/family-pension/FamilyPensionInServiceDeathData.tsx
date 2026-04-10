
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { formatCurrency, calculateServiceDuration, calculateServiceYears } from '../../utils';
import { format, parseISO, differenceInYears } from 'date-fns';
import { calculateFamilyPension } from '../../lib/pension';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

const formatDate = (dateStr?: string) => dateStr ? format(parseISO(dateStr), 'dd/MM/yyyy') : '__________';

export const FamilyPensionInServiceDeathData: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history, financials } = employee;
  const ben = employee.extras?.beneficiary || {};
  
  // Real Calculations
  const basicPay = financials.last_basic_pay || 0;
  const personalPay = financials.p_pay || 0;
  const totalReckonable = basicPay + personalPay;

  // Calculate Service Years capped at 30
  const totalServiceYears = calculateServiceYears(
    service_history.date_of_appointment, 
    service_history.date_of_retirement, 
    service_history.lwp_days
  );
  const qualifyingService = Math.min(Math.max(totalServiceYears, 0), 30);

  // Age at retirement/death
  let ageAtRetirement = 60;
  const dateOfDeathOrRetirement = employee.service_history.date_of_death || employee.service_history.date_of_retirement;
  if (employee.employees.dob && dateOfDeathOrRetirement) {
     ageAtRetirement = differenceInYears(parseISO(dateOfDeathOrRetirement), parseISO(employee.employees.dob));
  }

  // Use Central Calculation Logic
  const calc = calculateFamilyPension(
    employees.status,
    basicPay,
    personalPay,
    qualifyingService,
    ageAtRetirement,
    employee.extras?.commutation_portion ?? 35
  );

  const grossPension = calc?.grossPension || 0;
  const familyPension = calc?.familyPensionBase || 0; // The base before increases
  const netFamilyPension = calc?.netFamilyPension || 0; // Final payable
  const surrendered = calc?.surrenderedPortion || 0;
  const commuted = calc?.commutedAmount || 0;
  const netPension = calc?.netPension || 0;

  const service = calculateServiceDuration(
    service_history.date_of_appointment,
    service_history.date_of_retirement,
    service_history.lwp_days
  );

  return (
    <div className="bg-white text-black font-sans text-sm relative print-page fit-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '8mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      <div className="text-center font-bold mb-3">
        <div>Form 3 (PEN)</div>
        <div className="underline text-base leading-tight">FAMILY PENSION FORM (IN-SERVICE DEATH)</div>
        <div className="text-[10px] font-normal leading-tight">[To be issued by the Appointing Authority/ Pension Sanctioning Authority in the event of In-service death]</div>
      </div>

      <div className="mb-3">
        <span className="font-bold mr-2">Subject:</span>
        <span className="underline font-bold uppercase">SANCTION OF FAMILY PENSION IN CASE OF IN-SERVICE DEATH OF A GOVERNMENT SERVANT</span>
      </div>

      <div className="mb-3 font-bold underline">In Service Death</div>

      <div className="text-justify leading-[1.6] mb-4">
        It is mentioned that Mr./Mrs./Ms. <span className="font-bold uppercase border-b border-black px-2">{employees.name}</span> 
        S/O, W/O, D/O <span className="font-bold uppercase border-b border-black px-2">{employees.father_name}</span> 
        Designation/Post held <span className="font-bold uppercase border-b border-black px-2">{employees.designation}</span> 
        drawing pay / emoluments Regular/Officiating or Acting Charge/ Current charge w.e.f 
        <span className="font-bold uppercase border-b border-black px-2">{formatDate(service_history.date_of_entry)}</span> 
        Personal No <span className="font-bold border-b border-black px-2">{employees.personal_no}</span> 
        CNIC No <span className="font-bold border-b border-black px-2">{employees.cnic_no}</span> 
        lastly posted as <span className="font-bold uppercase border-b border-black px-2">{employees.school_full_name}</span> 
        has expired on <span className="font-bold border-b border-black px-2">{formatDate(employee.service_history.date_of_death || service_history.date_of_retirement)}</span> 
        While in service.
      </div>

      <div className="mb-4">
        <div className="font-bold underline mb-2">Family Pension Calculation: (In service death)</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 ml-4">
           <div className="flex justify-between border-b border-dotted border-black pb-1">
             <span>Last Drawn Pay/Emoluments</span>
             <span className="font-mono font-bold">Rs {formatCurrency(totalReckonable)} /-</span>
           </div>
           <div className="flex justify-between border-b border-dotted border-black pb-1">
             <span>Gross Pension</span>
             <span className="font-mono font-bold">Rs {formatCurrency(grossPension)} /-</span>
           </div>
           <div className="flex justify-between border-b border-dotted border-black pb-1">
             <span>Family Pension Base</span>
             <span className="font-mono font-bold">Rs {formatCurrency(familyPension)} /-</span>
           </div>
           <div className="flex justify-between border-b border-dotted border-black pb-1">
             <span>Surrendered / Gratuity</span>
             <span className="font-mono font-bold">Rs {formatCurrency(surrendered)} /-</span>
           </div>
           <div className="flex justify-between border-b border-dotted border-black pb-1">
             <span>Commuted Portion</span>
             <span className="font-mono font-bold">Rs {formatCurrency(commuted)} /-</span>
           </div>
           <div className="flex justify-between border-b border-dotted border-black pb-1">
             <span>Net Pension</span>
             <span className="font-mono font-bold">Rs {formatCurrency(netPension)} /-</span>
           </div>
           <div className="flex justify-between border-b border-dotted border-black pb-1 mt-2">
             <span className="font-bold">Net Family Pension (Payable)</span>
             <span className="font-mono font-bold text-base">Rs {formatCurrency(netFamilyPension)} /-</span>
           </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="font-bold underline mb-2">Other Benefits:</div>
        <div className="ml-4 space-y-1.5">
           <div className="flex gap-4">
             <span>i)</span>
             <div className="border-b border-dotted border-black w-48"></div>
             <span>Rs</span>
             <div className="border-b border-dotted border-black flex-grow"></div>
           </div>
           <div className="flex gap-4">
             <span>ii)</span>
             <div className="border-b border-dotted border-black w-48"></div>
             <span>Rs</span>
             <div className="border-b border-dotted border-black flex-grow"></div>
           </div>
        </div>
      </div>

      <div className="mb-4 leading-[1.6] text-justify">
        (2) His/ her date of birth is <span className="font-bold border-b border-black px-2">{formatDate(employees.dob)}</span> 
        Date of 1st entry into government service is <span className="font-bold border-b border-black px-2">{formatDate(service_history.date_of_appointment)}</span> 
        EOL availed during service is <span className="font-bold border-b border-black px-2">{service_history.lwp_days || 0} days</span>. 
        His/her total length of qualifying service for pension comes to 
        <span className="font-bold border-b border-black px-2 mx-1">{service.years}</span> years 
        <span className="font-bold border-b border-black px-2 mx-1">{service.months}</span> months 
        <span className="font-bold border-b border-black px-2 mx-1">{service.days}</span> days.
      </div>

      <div className="space-y-1.5 mb-4">
        <p>(3) Certified that no inquiry is pending deceased employee.</p>
        <p>(4) Certified that no Demand/ Recovery is outstanding against the deceased.</p>
        <p>(5) Certified that Advances drawn by the deceased (if any) have be fully repaid or waived off.</p>
      </div>

      <div className="mb-4 leading-[1.6] text-justify">
        (6) As per record, it is verified that Mr./Mrs/Ms <span className="font-bold uppercase border-b border-black px-2">{ben.name}</span> 
        CNIC No <span className="font-bold border-b border-black px-2">{ben.cnic}</span> 
        is bonafide family member entitled to family pension of Mr./Mrs/Ms. (late) <span className="font-bold uppercase border-b border-black px-2">{employees.name}</span> 
        and his/her gratuity/ family pension may be transferred/ credited in Bank/Post Office / Treasury 
        <span className="font-bold uppercase border-b border-black px-2 mx-1">{ben.bank_name}</span> 
        Branch <span className="font-bold uppercase border-b border-black px-2 mx-1">{ben.branch_name}</span> 
        Account No <span className="font-bold font-mono border-b border-black px-2 mx-1">{ben.account_no}</span> (as opted).
      </div>

      <div className="mb-3">
        (7) Administrative and financial sanction for grant of family pension / gratuity is hereby accorded.
      </div>

      <div className="mt-auto border-t-2 border-black pt-2 flex justify-between items-end" style={{ pageBreakInside: 'avoid' }}>
         <div className="mb-2">
            DATED __________________
         </div>
         <div className="text-center font-bold">
            <div className="h-[12mm]"></div>
            HEAD OF OFFICE/DEPARTMENT
         </div>
      </div>
      <div className="text-center text-xs">Page 2</div>
    </div>
  );
};
