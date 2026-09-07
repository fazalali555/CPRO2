import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { format, parseISO } from 'date-fns';
import { isDeceasedStatus } from '../../utils';

interface Props {
  employeeRecord: EmployeeRecord;
  caseRecord: CaseRecord;
}

// Helper for underlined input fields
const InputField = ({ 
  value, 
  width = "flex-grow", 
  center = true, 
  className = "" 
}: { 
  value?: string | number, 
  width?: string, 
  center?: boolean, 
  className?: string 
}) => (
  <div className={`border-b border-black inline-block ${width} ${center ? 'text-center' : 'text-left'} px-2 font-bold ${className} mx-1 whitespace-nowrap align-bottom text-[12px]`}>
    {value || ''}
  </div>
);

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
};

export const GPFFinalPaymentForm10: React.FC<Props> = ({ employeeRecord, caseRecord }) => {
  const { employees, financials, service_history } = employeeRecord;
  const { extras } = caseRecord;

  // Derived Data
  const personalNo = employees.personal_no || '';
  const gpfNo = extras?.gpf_account_no || financials?.gpf_account_no || employees.gpf_account_no || '';
  const name = employees.name;
  const fatherName = employees.father_name;
  const dob = formatDate(employees.dob);
  const doa = formatDate(service_history.date_of_appointment);
  const dor = formatDate(service_history.date_of_retirement);
  const isDeceased = isDeceasedStatus(employees.status) || !!service_history.date_of_death;
  const dod = formatDate(service_history.date_of_death);
  
  const designation = employees.designation;
  const office = employees.school_full_name;
  const cnic = employees.cnic_no;
  
  const memoNo = extras?.memo_no || '';
  const dateToUse = extras?.memo_date ? new Date(extras.memo_date) : new Date();
  const fullDateStr = format(dateToUse, 'dd/MM/yyyy');
  
  const officeOrderNo = extras?.office_order_no || service_history.retirement_order_no || '';
  const officeOrderDateStr = extras?.retirement_order_date || service_history.retirement_order_date;
  const officeOrderDate = officeOrderDateStr ? formatDate(officeOrderDateStr) : '';

  const district = employees.district || 'Battagram';

  // Treasury & Advance details from extras if present
  const lastAdvanceDetails = extras?.last_advance_details || extras?.advances_in_12_months || 'NIL';
  const lastDeductionAmount = extras?.last_deduction_amount || '';
  const lastDeductionMonth = extras?.last_deduction_month || '';
  const lastDeductionPoNo = extras?.last_deduction_bill_no || extras?.po_no || '';
  const lastDeductionDate = extras?.last_deduction_bill_date ? formatDate(extras.last_deduction_bill_date) : '';

  return (
    <div className="bg-white w-[210mm] h-[297mm] px-[14mm] py-[12mm] shadow-none box-border relative text-[12.5px] font-serif text-black leading-normal print-page mx-auto overflow-hidden flex flex-col justify-between">
      
      <div className="flex-grow flex flex-col justify-between">
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-start mb-5">
          {/* Center Title */}
          <div className="flex-grow text-center pl-20">
            <h1 className="text-xl font-bold mb-1 tracking-wider">P. No. {personalNo}</h1>
            <h2 className="text-lg font-bold">GP Fund No: {gpfNo}</h2>
          </div>

          {/* Right Side Date/No */}
          <div className="flex flex-col items-end w-56 text-sm font-bold gap-2">
            <div className="flex items-end w-full">
              <span className="w-16 text-right mr-2">NO:</span>
              <div className="border-b border-black flex-grow text-center h-5">{memoNo}</div>
            </div>
            <div className="flex items-end w-full">
              <span className="w-16 text-right mr-2">DATED:</span>
              <div className="border-b border-black flex-grow text-center h-5">{fullDateStr}</div>
            </div>
          </div>
        </div>

        {/* ================= BODY ================= */}
        
        {/* Recipient */}
        <div className="mb-4">
          <p className="font-bold">To,</p>
          <div className="pl-10 mt-1 space-y-0.5">
            <p className="font-bold">The District Accounts Officer,</p>
            <p className="font-bold">{district}.</p>
          </div>
        </div>

        {/* Subject */}
        <div className="flex justify-between items-end mb-4 font-bold">
          <div className="flex text-[13px]">
            <span className="mr-3">Subject: -</span>
            <span className="underline decoration-1 underline-offset-2">Final Payment of G.P. Fund</span>
          </div>
          <span className="underline decoration-1 underline-offset-2 text-[13px]">Form (10)</span>
        </div>

        {/* Memo / Main Paragraph */}
        <div className="mb-5 text-justify">
          <p className="mb-1.5 font-bold">Memo: -</p>
          
          <div className="leading-[2.1]">
            <span className="ml-10">Mr. Miss. Mrs</span>
            <InputField value={name} width="w-48" />
            <span>Son/Daughter of</span>
            <InputField value={fatherName} width="w-48" />
            <span>{isDeceased ? 'has expired / died on' : 'has retired / Discharged / Resigned on'}</span>
            <InputField value={isDeceased ? (dod || dor) : dor} width="w-32" />
            <span>vide office order No</span>
            <InputField value={officeOrderNo} width="w-32" />
            <span>Dated</span>
            <InputField value={officeOrderDate} width="w-32" />
          </div>
          
          <div className="mt-3 leading-[2.1]">
            <span className="ml-10">You are requested to please arrange payment of the balance of GP Fund standing at the credit of his account No</span>
            <InputField value={gpfNo} width="w-48" />
          </div>
        </div>

        {/* Particulars Section */}
        <div className="mb-5">
          <h3 className="font-bold underline mb-3 text-[13px]">PARTICULARS OF SUBSCRIBER ARE AS UNDER:-</h3>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-3.5">
            {/* Row 1 */}
            <div className="flex items-end">
              <span className="w-8 shrink-0 font-bold">(A)</span>
              <span className="w-36 shrink-0">Date of Birth</span>
              <InputField value={dob} center={false} />
            </div>
            <div className="flex items-end">
              <span className="w-8 shrink-0 font-bold">(B)</span>
              <span className="w-32 shrink-0">Date of 1st Apptt:</span>
              <InputField value={doa} center={false} />
            </div>

            {/* Row 2 */}
            <div className="flex items-end">
              <span className="w-8 shrink-0 font-bold">(C)</span>
              <span className="w-36 shrink-0">{isDeceased ? 'Date of Death' : 'Date of Retirement'}</span>
              <InputField value={isDeceased ? (dod || dor) : dor} center={false} />
            </div>
            <div className="flex items-end">
              <span className="w-8 shrink-0 font-bold">(D)</span>
              <span className="w-32 shrink-0">Designation:</span>
              <InputField value={designation} center={false} />
            </div>

            {/* Row 3 */}
            <div className="flex items-end">
              <span className="w-8 shrink-0 font-bold">(E)</span>
              <span className="w-36 shrink-0">Present Office</span>
              <InputField value={office} center={false} />
            </div>
            <div className="flex items-end">
              <span className="w-8 shrink-0 font-bold">(F)</span>
              <span className="w-32 shrink-0">CNIC No:</span>
              <InputField value={cnic} center={false} />
            </div>
          </div>
        </div>

        {/* Enclosed Documents Section */}
        <div className="mb-4">
          <h3 className="font-bold underline uppercase mb-1.5 text-[12.5px]">FOLLOWING INFORMATION/DOCUMENTS ARE ALSO ENCLOSED</h3>
          <div className="leading-relaxed text-justify">
            A certificate from the applicant / DDO stating whether any advance from the fund was granted to the subscriber during the previous twelve months; if so, particulars of the advance:
            <span className="font-bold border-b border-black px-2 ml-2">{lastAdvanceDetails}</span>
          </div>
        </div>

        {/* Treasury Section */}
        <div className="mb-4">
          <h3 className="font-bold underline uppercase mb-2 text-[12.5px]">FOLLOWING INFORMATION MAY BE SUPPLIED IN CASE OF PAYMENT AT A TREASURY.</h3>
          <div className="space-y-2">
            <div className="flex items-end flex-wrap">
              <span className="mr-2 font-bold">I)</span>
              <span>Amount and month of last fund deduction vide P.O / Bill NO</span>
              <InputField value={lastDeductionPoNo} width="w-28" />
              <span>Amt / Month</span>
              <InputField value={lastDeductionAmount ? `${lastDeductionAmount} (${lastDeductionMonth})` : ''} width="w-36" />
              <span>Dated</span>
              <InputField value={lastDeductionDate} width="w-28" />
            </div>
            <div className="flex items-end">
              <span className="mr-2 font-bold">II)</span>
              <span>Name of treasury where payment is desired</span>
              <InputField value={`DAO ${district.toUpperCase()}`} />
            </div>
          </div>
        </div>

        {/* Death Case Section */}
        <div className="mb-4">
          <h3 className="font-bold underline uppercase mb-1.5 text-[12.5px]">FOLLOWING INFORMATION / DOCUMENTS MAY BE SUPPLIED IN CASE OF DEATH ONLY.</h3>
          <ol className="list-decimal pl-6 space-y-1 text-justify leading-snug text-[11.5px]">
            <li>An attested copy of death certificate or gazette notification.</li>
            <li>If no nomination was made by the subscriber, a list of his family members as detailed in GPF rules who are entitled to participate in the fund money under the rules, together with their application in original and a copy of CNIC duly attested are enclosed for final payment of balance.</li>
          </ol>
        </div>

        {/* Minor Heirs Section */}
        <div className="mb-4">
          <h3 className="font-bold underline uppercase mb-1.5 text-[12.5px]">IN CASE OF MINOR LEGAL HEIRS IN TERMS OF G.P.F RULES.</h3>
          <ol className="list-decimal pl-6 leading-snug text-[11.5px]">
            <li>An application from legally appointed guardian.</li>
          </ol>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div className="flex relative pt-3 border-t border-black mt-2">
        {/* Left Column */}
        <div className="w-[45%] pr-4">
          <h3 className="font-bold underline uppercase mb-2 text-[11.5px]">FOR D.A.O OFFICE USE ONLY.</h3>
          <p className="leading-relaxed text-[11px]">
            The particulars from (A) to (F)<br/>
            as recorded above have been checked<br/>
            and verified to process this case.
          </p>
        </div>

        {/* Vertical Separator Line */}
        <div className="w-[1px] bg-black absolute left-[45%] top-0 bottom-0"></div>

        {/* Right Column (Signatures) */}
        <div className="w-[55%] pl-8 flex flex-col justify-between h-28">
          <div className="text-center">
            <div className="border-t border-black w-52 mx-auto mb-1"></div>
            <span className="font-bold block text-[11.5px]">Signature of Applicant</span>
          </div>

          <div className="text-center">
            <div className="border-t border-black w-52 mx-auto mb-1"></div>
            <span className="font-bold block text-[11.5px]">Signature of DDO</span>
          </div>
        </div>
      </div>
    </div>
  );
};