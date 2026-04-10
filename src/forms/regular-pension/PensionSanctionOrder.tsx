
import React from 'react';
import { EmployeeRecord } from '../../types';
import { formatCurrency, calculateServiceYears, calculateServiceDuration, getCoverLetterInfo } from '../../utils';
import { format, parseISO, differenceInYears } from 'date-fns';
import { calculatePension } from '../../lib/pension';

interface Props {
  employee: EmployeeRecord;
  signatureTitle?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try { return format(parseISO(dateStr), 'dd-MM-yyyy'); } catch { return '_______'; }
};

export const PensionSanctionOrder: React.FC<Props> = ({ employee, signatureTitle }) => {
  const { employees, service_history, financials } = employee;
  const dor = formatDate(service_history.date_of_retirement);
  const doa = formatDate(service_history.date_of_appointment);
  
  // Calculate signature title if not passed
  const { signatureTitle: autoSignature } = getCoverLetterInfo(employee);
  const finalSignature = signatureTitle || autoSignature;

  const basicPay = financials.basic_pay || 0;
  const personalPay = financials.p_pay || 0;
  const totalReckonable = basicPay + personalPay;

  // Qualifying Service (round up if months >= 6), capped at 30 – consistent with Employees page
  const svc = calculateServiceDuration(
    service_history.date_of_appointment,
    service_history.date_of_retirement,
    service_history.lwp_days
  );
  let qService = Math.max(svc.years, 0);
  if (svc.months >= 6) qService += 1;
  qService = Math.min(qService, 30);

  // Age at retirement (fallback to 60 if insufficient data)
  let ageAtRetirement = 60;
  try {
    if (employees.dob && service_history.date_of_retirement) {
      const dob = parseISO(employees.dob);
      const dorDate = parseISO(service_history.date_of_retirement);
      if (!isNaN(dob.getTime()) && !isNaN(dorDate.getTime())) {
        ageAtRetirement = differenceInYears(dorDate, dob);
      }
    }
  } catch {}

  // Single source of truth for pension calculations
  const calc = calculatePension({
    basicPay,
    personalPay,
    qualifyingServiceYears: qService,
    commutationPortionPercent: (employee.extras?.commutation_portion as number | undefined) ?? 35,
    ageAtRetirement
  });

  // LPR Calculation
  const lprDays = service_history.lpr_days ?? 365; 
  const lprAmount = Math.round((basicPay / 30) * lprDays);

  const service = svc;

  // Order Details
  const orderNo = service_history.retirement_order_no || '_______';
  const orderDate = formatDate(service_history.retirement_order_date);
  const appDate = formatDate(new Date().toISOString());

  // Safe strings
  const name = employees.name || '_______';
  const fatherName = employees.father_name || '_______';
  const designation = employees.designation || '_______';
  const school = employees.school_full_name || '_______';
  const bps = employees.bps ? String(employees.bps) : '__';
  const pNo = employees.personal_no || '_______';
  const empCat = employees.employment_category || 'Regular';

  return (
    <div className="bg-white text-black font-serif text-[10.5pt] leading-[1.5] relative print-page fit-page mx-auto flex flex-col"
      style={{ width: '210mm', height: '297mm', padding: '12mm 12mm 12mm 20mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* Header */}
      <div className="text-center font-bold mb-3">
        <div className="text-lg border-2 border-black rounded-full w-9 h-9 flex items-center justify-center mx-auto mb-1.5">4</div>
        <div className="text-base leading-tight uppercase underline underline-offset-4 mb-1">
          PENSION SANCTION ORDER
        </div>
        <div className="text-[10px] font-bold uppercase leading-tight">
          TO BE USED IN CASE OF SUPERANNUATION/RETIRING/INVALID/<br/>
          COMPENSATION/COMPULSORY RETIREMENT.
        </div>
        <div className="text-[9.5px] font-normal mt-1 italic leading-tight">
          (To be issued by the Pension Sanctioning Authority)
        </div>
      </div>

      {/* Subject */}
      <div className="mb-3">
         <span className="font-bold mr-2">Subject:</span>
         <span className="font-bold uppercase underline">SANCTION OF PENSION OF MR./MS. {name}</span>
      </div>

      {/* Main Paragraph */}
      <div className="text-justify leading-[1.7] mb-3 text-[10.5pt]">
         On attaining the age of superannuation/having applied for retiring/invalid/compensatory pension vide application dated <span className="font-bold border-b border-black px-2">{appDate}</span> Or has been retired compulsorily vide Notification/Order No. <span className="font-bold border-b border-black px-2">{orderNo}</span> Dated <span className="font-bold border-b border-black px-2">{orderDate}</span> issued by <span className="font-bold border-b border-black px-2">Competent Authority</span>.
         <br/>
         Mr./Miss/Ms: <span className="font-bold uppercase border-b border-black px-2">{name}</span> S/O, W/O, D/O <span className="font-bold uppercase border-b border-black px-2">{fatherName}</span> Designation <span className="font-bold uppercase border-b border-black px-2">{designation}</span> drawing pay / emoluments Rs. <span className="font-bold border-b border-black px-2">{formatCurrency(totalReckonable)}</span> PM (reckonable towards pension), in BPS <span className="font-bold border-b border-black px-2">{bps}</span> on <span className="font-bold border-b border-black px-2">{dor}</span> (please indicate nature of appointment i.e. <span className="font-bold border-b border-black px-2">{empCat}</span> basis, w.e.f. <span className="font-bold border-b border-black px-2">{doa}</span>.
         <br/>
         Personnel No <span className="font-bold border-b border-black px-2">{pNo}</span> presently posted as <span className="font-bold uppercase border-b border-black px-2">{school}</span> has retired /has been permitted to retire/is due to be retired/has been retired compulsorily from the Government service (tick where applicable) on <span className="font-bold border-b border-black px-2">{dor}</span> date after availing LPR for <span className="font-bold border-b border-black px-2">{lprDays}</span> days/Leave encashment in lieu of LPR Rs. <span className="font-bold border-b border-black px-2">{formatCurrency(lprAmount)}</span>.
      </div>

      {/* Pension Calculation */}
      <div className="mb-3">
         <div className="font-bold underline mb-1.5 uppercase">Pension Calculation</div>
         <div className="ml-3 grid grid-cols-1 gap-y-1 w-3/4">
            <div className="flex justify-between border-b border-dotted border-black">
               <span>Gross Pension</span>
               <span className="font-bold">{formatCurrency(calc.grossPension)}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-black">
               <span>Commutation Amount</span>
               <span className="font-bold">{formatCurrency(calc.commutationLumpSum)}</span>
            </div>
            <div className="flex justify-between border-b border-dotted border-black">
               <span>Monthly Payable Pension</span>
               <span className="font-bold">{formatCurrency(calc.monthlyPayablePension)}</span>
            </div>
         </div>
      </div>

      {/* Other Benefits */}
      <div className="mb-3">
         <div className="font-bold underline mb-1.5 uppercase">Other Benefits:</div>
         <div className="ml-3 space-y-1">
            <div className="flex gap-3">
               <span className="w-4">1.</span>
               <span>Benevolent Fund (B.F)</span>
               <span className="border-b border-black flex-grow text-center font-bold">As admissible</span>
            </div>
            <div className="flex gap-3">
               <span className="w-4">2.</span>
               <span>Employee Education Fund (E.E.F)</span>
               <span className="border-b border-black flex-grow text-center font-bold">As admissible</span>
            </div>
            <div className="flex gap-3">
               <span className="w-4">3.</span>
               <span>Retirement Benefit and Death Compensation (RBDC)</span>
               <span className="border-b border-black flex-grow text-center font-bold">As admissible</span>
            </div>
         </div>
      </div>

      {/* Numbered Points */}
      <div className="space-y-3 text-justify leading-[1.6]">
         <div className="flex gap-1.5">
            <span className="font-bold">1).</span>
            <p>
               His/her date of birth is <span className="font-bold border-b border-black px-2">{formatDate(employees.dob)}</span>. Date of 1st entry into government service is <span className="font-bold border-b border-black px-2">{doa}</span> and Extra Ordinary Leave availed <span className="font-bold border-b border-black px-2">{service_history.lwp_days}</span> days. The total length of qualifying service for pension is <span className="font-bold border-b border-black px-2">{service.years}</span> Years <span className="font-bold border-b border-black px-2">{service.months}</span> Months <span className="font-bold border-b border-black px-2">{service.days}</span> days.
            </p>
         </div>

         <div className="flex gap-1.5">
            <span className="font-bold">2).</span>
            <p>Certified that no inquiry is pending against him/her.</p>
         </div>

         <div className="flex gap-1.5">
            <span className="font-bold">3).</span>
            <p>Certified that no recovery is outstanding against him.</p>
         </div>

         <div className="flex gap-1.5">
            <span className="font-bold">4).</span>
            <div>
               <p>Certified that:</p>
               <p>(i) Advances drawn (if any) stand fully repaid, along with interest.</p>
            </div>
         </div>
      </div>

      {/* Spacer */}
      <div className="flex-grow"></div>

      {/* Signature Section */}
      <div className="mt-6 flex justify-end" style={{ pageBreakInside: 'avoid' }}>
        <div className="text-center w-64">
          <div className="border-t border-black w-full pt-2">
            <p className="font-bold text-sm uppercase whitespace-pre-line">{finalSignature}</p>
          </div>
          <p className="text-xs mt-1 text-gray-600">Date: {formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      
    </div>
  );
};
