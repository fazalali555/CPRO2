
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { detectGenderFromSchoolName, formatCurrency, calculatePayroll } from '../../utils';
import { format, parseISO } from 'date-fns';

interface Props {
  employeeRecord: EmployeeRecord;
  caseRecord: CaseRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
};

export const GPFAdvanceApplication: React.FC<Props> = ({ employeeRecord, caseRecord }) => {
  const { employees, service_history, financials } = employeeRecord;
  const extras = caseRecord.extras || {};

  const isRefundable = caseRecord.case_type === 'gpf_refundable';
  const typeLabel = isRefundable ? '(Refundable)' : '(Non-Refundable)';
  
  const gender = detectGenderFromSchoolName(employees.school_full_name);
  const district = employees.district || 'Battagram';
  const deoTitle = `DEO (${gender === 'F' ? 'Female' : 'Male'})`;

  // 12 Months Logic (For Non-Refundable)
  let elapsed12Months = "—";
  if (!isRefundable) {
    if (extras.previous_non_refundable_date) {
        try {
          const prevDate = parseISO(extras.previous_non_refundable_date);
          const now = new Date();
          const diffTime = now.getTime() - prevDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          elapsed12Months = diffDays >= 365 ? "Yes" : "No";
        } catch (e) {
          elapsed12Months = "—";
        }
    } else {
        elapsed12Months = "Yes"; // Default assumption if no previous date recorded
    }
  } else {
    elapsed12Months = "N/A";
  }

  // Priority: Case Extra > Employee Financial > 0
  const basicPay = Number(extras.basic_pay) || financials.last_basic_pay || 0;
  
  // Calculate Net Pay dynamically if not overridden in extras
  let netPay = Number(extras.net_pay);
  if (!netPay) {
     const payroll = calculatePayroll(financials);
     netPay = payroll.netPay;
  }
  
  return (
    <div className="bg-white text-black font-serif text-[12pt] leading-snug relative print-page mx-auto"
      style={{ width: '210mm', minHeight: '297mm', padding: '20mm 15mm', boxSizing: 'border-box' }}>
      
      {/* --- Header --- */}
      <h1 className="text-center font-bold text-lg uppercase mb-6 tracking-wide underline underline-offset-4 decoration-1">
        APPLICATION FOR THE GRANT OF GENERAL PROVIDENT FUND {typeLabel} ADVANCE
      </h1>

      <div className="mb-2 font-bold">Sir,</div>
      
      <p className="indent-12 mb-6 text-justify">
        I beg to apply for the sanction of the grant of an advance from the General Provident Fund as stated below:
      </p>

      {/* --- Form Items --- */}
      <div className="space-y-1">
        
        {/* 1. Name */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">1.</span>
            <span>Name of Applicant (In Block Letters)</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
            <span className="absolute bottom-1 left-2 font-bold uppercase">{employees.name}</span>
          </div>
        </div>

        {/* 2. Designation */}
        <div className="flex items-end mb-1">
          <span className="w-8 shrink-0">2.</span>
          <span>Designation</span>
          <div className="w-48 border-b border-black mx-2 relative top-[3px]">
             <span className="absolute bottom-1 left-2 font-bold uppercase">{employees.designation}</span>
          </div>
          <span className="mx-1">at</span>
          <div className="flex-grow border-b border-black relative top-[3px]">
             <span className="absolute bottom-1 left-2 font-bold uppercase">{employees.school_full_name}</span>
          </div>
        </div>

        {/* 3. Attached to */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">3.</span>
            <span>Attached to</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
             <span className="absolute bottom-1 left-2 font-bold uppercase">{employees.office_name || employees.school_full_name}</span>
          </div>
        </div>

        {/* 4. Basic Pay */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">4.</span>
            <span>Basic Pay</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
            <span className="absolute bottom-1 left-2 font-bold">{formatCurrency(basicPay)}</span>
          </div>
        </div>

        {/* 5. Net Pay */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">5.</span>
            <span>Net Pay</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
            <span className="absolute bottom-1 left-2 font-bold">{netPay ? formatCurrency(netPay) : ''}</span>
          </div>
        </div>

        {/* 6. GPF Account No */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">6.</span>
            <span>GPF Account No.</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
            <span className="absolute bottom-1 left-2 font-bold">{employees.gpf_account_no}</span>
          </div>
        </div>

        {/* 7. Amount Required */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">7.</span>
            <span>Amount of advance required:</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
            <span className="absolute bottom-1 left-2 font-bold">{formatCurrency(Number(extras.amount_requested) || 0)}</span>
          </div>
        </div>

        {/* 8. Installments */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">8.</span>
            <span>No. of installments for payment:</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
            <span className="absolute bottom-1 left-2 font-bold">
              {isRefundable ? (extras.installments || '24') : 'N/A (Non-Refundable)'}
            </span>
          </div>
        </div>

        {/* 9. Purpose */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">9.</span>
            <span>Purpose of advance GPF</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
            <span className="absolute bottom-1 left-2 font-bold">{extras.purpose}</span>
          </div>
        </div>

        {/* 10. Rule */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">10.</span>
            <span>Rule under which application is made</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
            <span className="absolute bottom-1 left-0 font-bold">{extras.rule_reference || '16 (A)'}</span>
          </div>
        </div>

        {/* 11. 12 Months Elapsed */}
        <div className="flex mb-1 relative items-end">
          <div className="w-[45%] shrink-0 leading-tight pb-1">
            <div className="flex">
              <span className="w-8 shrink-0">11.</span>
              <div>
                Whether 12 months have elapsed since<br />
                the complete re-payment of last advance
              </div>
            </div>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
             <span className="absolute bottom-1 left-0 font-bold">{elapsed12Months}</span>
          </div>
        </div>

        {/* 12. Total amount at credit */}
        <div className="flex items-end mb-1">
          <div className="flex w-[45%] shrink-0">
            <span className="w-8 shrink-0">12.</span>
            <span>Total amount at credit of applicant in GPF</span>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
            <span className="absolute bottom-1 left-2 font-bold">{formatCurrency(Number(extras.current_balance) || 0)}</span>
          </div>
        </div>

        {/* 13. Pecuniary Circumstances */}
         <div className="flex mb-3 relative items-end">
          <div className="w-[45%] shrink-0 leading-tight pb-1">
            <div className="flex">
              <span className="w-8 shrink-0">13.</span>
              <div>
                Whether the pecuniary circumstances of the<br />
                applicant are such that indulgence is<br />
                absolutely necessary.
              </div>
            </div>
          </div>
          <div className="flex-grow border-b border-black relative top-[3px]">
             <span className="absolute bottom-1 left-0 font-bold">Yes</span>
          </div>
        </div>

        {/* --- Personal Details --- */}
        <div className="space-y-1 mt-4">
          <div className="flex items-end mb-1">
            <div className="w-[45%] shrink-0">Father’s Name</div>
            <div className="flex-grow border-b border-black relative top-[3px]">
              <span className="absolute bottom-1 left-2 font-bold uppercase">{employees.father_name}</span>
            </div>
          </div>

          <div className="flex items-end mb-1">
            <div className="w-[45%] shrink-0">Personal No.</div>
            <div className="flex-grow border-b border-black relative top-[3px]">
              <span className="absolute bottom-1 left-2 font-bold">{employees.personal_no}</span>
            </div>
          </div>

          <div className="flex items-end mb-1">
            <div className="w-[45%] shrink-0">Date of Birth</div>
            <div className="flex-grow border-b border-black relative top-[3px]">
              <span className="absolute bottom-1 left-2 font-bold">{formatDate(employees.dob)}</span>
            </div>
          </div>

          <div className="flex items-end mb-1">
            <div className="w-[45%] shrink-0">Date of First Appointment</div>
            <div className="flex-grow border-b border-black relative top-[3px]">
              <span className="absolute bottom-1 left-2 font-bold">{formatDate(service_history.date_of_appointment)}</span>
            </div>
          </div>

          <div className="flex items-end mb-1">
            <div className="w-[45%] shrink-0">Date of Retirement</div>
            <div className="flex-grow border-b border-black relative top-[3px]">
              <span className="absolute bottom-1 left-2 font-bold">{formatDate(service_history.date_of_retirement)}</span>
            </div>
          </div>

          <div className="flex items-end mb-4">
            <div className="w-[45%] shrink-0">CNIC</div>
            <div className="flex-grow border-b border-black relative top-[3px]">
              <span className="absolute bottom-1 left-2 font-bold tracking-widest">{employees.cnic_no}</span>
            </div>
          </div>
        </div>

        {/* --- Signature --- */}
        <div className="mb-10 mt-6">
           <div className="font-bold uppercase underline inline-block tracking-wide">SIGNATURE OF APPLICANT</div>
        </div>

        {/* --- Witnesses --- */}
        <div className="flex justify-between items-end mb-8 text-sm">
           <div className="flex items-end w-[30%]">
             <span className="mr-2 text-lg">1.</span>
             <div className="border-b border-black flex-grow"></div>
           </div>
           <div className="flex items-end w-[30%]">
             <span className="mr-2 text-lg">2.</span>
             <div className="border-b border-black flex-grow"></div>
           </div>
           <div className="flex items-end w-[30%]">
             <span className="mr-2 text-lg">3.</span>
             <div className="border-b border-black flex-grow"></div>
           </div>
        </div>

        {/* --- Footer / Endorsement --- */}
        <div className="mt-8 border-t-2 border-black pt-4">
          <div className="flex justify-between mb-4">
            <div className="flex items-end">
              <span>Endst. No:</span>
              <div className="w-32 border-b border-black mx-2"></div>
            </div>
            <div className="flex items-end">
              <span>Date:</span>
              <div className="w-32 border-b border-black mx-2"></div>
            </div>
          </div>
          
          <p className="text-justify mb-16 leading-relaxed">
            Forwarded in original to the {deoTitle} Elementary and Secondary Education, {district} for grant of sanction please.
          </p>

          <div className="flex justify-end">
            <div className="text-center w-64">
               <div className="w-full border-t border-black mb-1"></div>
               <div className="font-bold uppercase">Signature & Stamp</div>
               <div className="text-xs uppercase">Head of Institution</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
