
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo, splitToChars, calculateServiceDuration } from '../../utils';
import { CombInput, RadioOption } from '../../components/PrintInputs';
import { format, parseISO } from 'date-fns';

interface Props {
  employeeRecord: EmployeeRecord;
  caseRecord: CaseRecord;
}


// Date Segment Helper (e.g. DD / MM / YYYY with lines)
const DateSegment = ({ dateStr, label, width = "w-8" }: { dateStr?: string, label: string, width?: string }) => {
  let val = "";
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      if (label === 'DD') val = format(d, 'dd');
      if (label === 'MM') val = format(d, 'MM');
      if (label === 'YYYY') val = format(d, 'yyyy');
    }
  }
  // Add space between chars for visual style if 2 chars
  if (val.length === 2) val = val.split('').join(' ');
  if (val.length === 4) val = val.split('').join(' ');

  return (
    <div className="flex flex-col items-center mx-2">
      <div className={`border-b border-black ${width} text-center font-bold text-sm pb-1`}>{val}</div>
      <span className="text-[10px] mt-0.5">{label}</span>
    </div>
  );
};

export const PAYF06PermanentLoan: React.FC<Props> = ({ employeeRecord, caseRecord }) => {
  const { employees, service_history } = employeeRecord;
  const extras = caseRecord.extras || {};

  // --- Data Preparation ---
  const appDateStr = extras.application_date || new Date().toISOString();
  const appDate = new Date(appDateStr);
  const dateFormatted = format(appDate, 'dd/MM/yyyy');
  const monthOf = format(appDate, 'MMMM yyyy');

  const { headerTitle } = getCoverLetterInfo(employeeRecord);
  const officeName = headerTitle.replace(/^OFFICE OF THE\s+/i, '').trim();

  const ddoCode = employees.ddo_code || extras.ddo_code || '';
  const personalNo = employees.personal_no || '';
  const bps = String(employees.bps || '');
  const designation = employees.designation;
  const name = employees.name.toUpperCase();
  const cnic = employees.cnic_no || '';
  const gpfAccountNo = employees.gpf_account_no || '0';
  
  // Service Calc
  const service = calculateServiceDuration(
    service_history.date_of_appointment,
    appDateStr
  );

  // Percentages Logic (Assuming stored in extras.percentage or inferred)
  // Default to 80% if not specified, or parse from extras
  const percentage = extras.percentage || '100'; // '80', '100', 'other'

  return (
    <div className="bg-white text-black font-sans text-xs leading-tight relative print-page mx-auto"
      style={{ width: '297mm', minHeight: '210mm', padding: '10mm 15mm', boxSizing: 'border-box' }}>
      
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col items-end mb-2">
          <h2 className="font-medium text-[10px] mb-1 uppercase">FORM: PAYF06</h2>
          
          <div className="flex items-end w-48 mb-1">
            <span className="mr-1 text-[10px] uppercase">Date</span>
            <sup className="text-[7px] mr-1">1</sup>
            <div className="border-b border-black flex-grow h-3 text-center font-bold">{dateFormatted}</div>
          </div>
          
          <div className="flex items-end w-48">
            <span className="mr-1 text-[10px] uppercase">Page No</span>
            <sup className="text-[7px] mr-1">2</sup>
            <div className="border-b border-black flex-grow h-3"></div>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="font-bold text-sm uppercase tracking-wide mb-2 text-center">
            {caseRecord.case_type === 'gpf_final' ? 'GP FUND FINAL PAYMENT' : 'PERMANENT LOAN FORM (NEW & AMENDMENT)'}
          </h1>
          
          {/* Office Line */}
          <div className="flex justify-start items-end mb-2 pl-12">
             <div className="flex items-end w-32 shrink-0">
               <span className="uppercase text-[10px] font-bold mr-1">OFFICE OF THE</span>
               <sup className="text-[7px] mb-2">3</sup>
             </div>
             <div className="border-b border-black flex-grow font-bold text-[11px] pb-0.5 pl-12 truncate uppercase">
               {officeName}
             </div>
          </div>

          {/* Month Line */}
          <div className="flex justify-start items-end pl-12 w-2/5">
             <div className="flex items-end w-32 shrink-0">
               <span className="uppercase text-[10px] font-bold mr-1">FOR THE MONTH OF</span>
               <sup className="text-[7px] mb-2">4</sup>
             </div>
             <div className="border-b border-black flex-grow pb-0.5 text-center font-bold uppercase">{monthOf}</div>
          </div>
        </div>


        {/* ================= MAIN BORDERED CONTAINER ================= */}
        <div className="border border-black pb-2">
          
          {/* --- GENERAL INFORMATION HEADER --- */}
          <div className="px-2 pt-1 pb-1">
            <h3 className="font-bold text-[11px] uppercase">GENERAL INFORMATION</h3>
          </div>
          <div className="border-t border-black mb-2"></div>

          {/* --- GENERAL INFORMATION CONTENT --- */}
          <div className="px-2 mb-2">
            
            {/* Row 1: DDO Code */}
            <div className="flex items-end mb-3">
              <div className="w-24 text-[10px] leading-tight shrink-0">
                DDO Code <sup className="text-[7px]">5</sup><br/>
                (Cost Centre)
              </div>
              <CombInput values={splitToChars(ddoCode, 6)} count={6} boxClassName="bg-white" />
              
              <div className="ml-2 flex-grow flex items-end min-w-0">
                <span className="text-[10px] mr-1 mb-6 shrink-0">Description <sup className="text-[7px]">6</sup></span>
                <div className="border-b border-black flex-grow mb-1 flex justify-between px-2 font-bold text-xs pb-1 truncate uppercase">
                  <span>{officeName}</span>
                </div>
              </div>
            </div>

            {/* Row 2: Personal Number */}
            <div className="flex items-end mb-3">
              <div className="w-24 text-[10px] leading-tight shrink-0">
                Personal<br/>
                Number <sup className="text-[7px]">7</sup>
              </div>
              <CombInput values={splitToChars(personalNo, 8, { padLeft: '0' })} count={8} boxClassName="bg-white" />
              
              <div className="ml-2 flex-grow flex items-end min-w-0">
                <span className="text-[10px] mr-1 mb-6 shrink-0">Employee Name <sup className="text-[7px]">8</sup></span>
                <div className="border-b border-black flex-grow mb-1 text-center font-bold text-xs pb-1 pr-4 truncate">
                  {name}
                </div>
              </div>

              <div className="ml-2 flex items-end shrink-0">
                <div className="text-right mr-2 mb-2">
                   <sup className="text-[7px]">9</sup><br/>
                   <span className="text-[10px]">Grade</span>
                </div>
                <CombInput values={splitToChars(bps, 2, { padLeft: '0' })} count={2} boxClassName="bg-white" />
              </div>
            </div>

            {/* Row 3: NIC */}
            <div className="flex items-end mb-3">
              <div className="w-24 text-[10px] leading-tight shrink-0">
                National ID <sup className="text-[7px]">10</sup><br/>
                Card Number
              </div>
              
              <div className="w-48 font-bold text-sm tracking-widest text-center border-b border-black relative top-1 pb-0.5">
                 {cnic}
              </div>

              <div className="ml-4 flex items-end shrink-0">
                <div className="text-[10px] leading-tight mr-2">
                  Designation<br/>
                  Code <sup className="text-[7px]">11</sup>
                </div>
                <CombInput values={[]} count={6} boxClassName="bg-white" />
              </div>

              <div className="ml-2 flex-grow flex items-end min-w-0">
                <span className="text-[10px] mr-1 mb-3 shrink-0">Description <sup className="text-[7px]">12</sup></span>
                <div className="border-b border-black flex-grow mb-1 pl-2 font-bold uppercase text-xs truncate">
                   {/* Removed Designation from here as requested */}
                </div>
              </div>
            </div>

            {/* Row 4: Scale & Service */}
            <div className="flex items-end">
              <div className="w-10 text-[10px] leading-tight mb-2 shrink-0">
                Scale <sup className="text-[7px]">13</sup>
              </div>
              <CombInput values={splitToChars(bps, 2, { padLeft: '0' })} count={2} boxClassName="bg-white" />
              <sup className="text-[7px] self-end mb-2 ml-1">14</sup>
              
              <div className="w-64 border-b border-black mx-2 mb-1 text-center font-bold text-xs pb-1 truncate uppercase">
                {designation}
              </div>

              <div className="text-[10px] leading-tight mb-2 ml-2 shrink-0">
                Period of<br/>
                Service <sup className="text-[7px]">15</sup>
              </div>
              
              <div className="flex items-center ml-8 font-bold text-xs mb-2 shrink-0">
                 <span className="mx-3">{service.years}</span> Y
                 <span className="mx-6">{service.months}</span> M
                 <span className="mx-6">{service.days}</span> D
              </div>

              <div className="ml-4 flex-grow flex items-end min-w-0">
                <div className="text-[10px] leading-tight mr-1 mb-1 w-20 shrink-0">
                  Old GP Fund<br/>
                  Account No <sup className="text-[7px]">16</sup>
                </div>
                <div className="border-b border-black flex-grow mb-1 text-center font-bold pb-1 truncate">
                  {gpfAccountNo}
                </div>
              </div>
            </div>
          </div>


          {/* --- PERMANENT LOAN DETAILS HEADER --- */}
          <div className="border-t-2 border-black pt-1 pb-1 px-2 mt-2 bg-gray-50/50">
             <h3 className="font-bold text-[11px] uppercase">
               {caseRecord.case_type === 'gpf_final' ? 'GP FUND FINAL PAYMENT DETAILS' : 'PERMANENT LOAN DETAILS'}
             </h3>
          </div>
          <div className="border-t border-black mb-4"></div>

          {/* --- LOAN DETAILS CONTENT --- */}
          <div className="px-2">
            
            {/* Row 1: Date, Amount, Refunds */}
            <div className="flex items-end mb-6">
              <div className="flex flex-col w-[30%]">
                 <div className="flex items-end">
                   <div className="text-[10px] w-28 mb-1 leading-tight shrink-0">
                     {caseRecord.case_type === 'gpf_final' ? 'Date of Final Payment' : 'Date of Permanent Loan'} <sup className="text-[7px]">17</sup>
                   </div>
                   <div className="flex items-end text-[10px]">
                      <DateSegment dateStr={appDateStr} label="DD" width="w-10" />
                      <span className="mb-4">/</span>
                      <DateSegment dateStr={appDateStr} label="MM" width="w-10" />
                      <span className="mb-4">/</span>
                      <DateSegment dateStr={appDateStr} label="YYYY" width="w-12" />
                   </div>
                 </div>
              </div>

              <div className="flex flex-col w-[35%] pl-4">
                 <div className="flex items-end w-full">
                    <div className="text-[10px] mb-1 mr-2 leading-tight shrink-0">Total <sup className="text-[7px]">18</sup><br/>Amount</div>
                    <div className="border-b border-black flex-grow mb-1 font-bold text-center">
                       {extras.amount_requested}
                    </div>
                 </div>
              </div>

              <div className="flex flex-col w-[35%] pl-6">
                 <div className="flex items-start">
                    <div className="text-[10px] leading-tight w-24 pt-1 shrink-0">
                       Non-Refundable<br/>
                       Percentageof GP<br/>
                       Fund Balance <sup className="text-[7px]">19</sup>
                    </div>
                    <div className="flex flex-col ml-2">
                      <RadioOption label="80%" checked={percentage === '80'} className="mb-1" labelClassName="text-[11px] font-medium mr-1" />
                      <RadioOption label="100%" checked={percentage === '100'} className="mb-1" labelClassName="text-[11px] font-medium mr-1" />
                      <RadioOption label="Other" checked={percentage !== '80' && percentage !== '100'} showLine={true} className="mb-1" labelClassName="text-[11px] font-medium mr-1" />
                    </div>
                 </div>
              </div>
            </div>

            {/* Row 2: Birth and Appointment Dates */}
            <div className="flex items-end border-b border-black pb-6 mb-6">
               {/* Date of Birth */}
               <div className="flex items-end mr-4">
                  <span className="text-[10px] mb-2 mr-2 shrink-0">Date of Birth <sup className="text-[7px]">20</sup></span>
                  <DateSegment dateStr={employees.dob} label="DD" width="w-10"/>
                  <span className="mb-4">/</span>
                  <DateSegment dateStr={employees.dob} label="MM" width="w-10"/>
                  <span className="mb-4">/</span>
                  <DateSegment dateStr={employees.dob} label="YYYY" width="w-16"/>
               </div>

               {/* Date of Appointment */}
               <div className="flex items-end ml-auto">
                  <div className="mb-2 mr-2 leading-tight text-right shrink-0">
                     <span className="text-[10px]">Date of Appointment</span>
                     <sup className="text-[7px] ml-1">21</sup>
                  </div>
                  <div className="flex items-end">
                    <DateSegment dateStr={service_history.date_of_appointment} label="DD" width="w-10"/>
                    <span className="mb-4">/</span>
                    <DateSegment dateStr={service_history.date_of_appointment} label="MM" width="w-10"/>
                    <span className="mb-4">/</span>
                    <DateSegment dateStr={service_history.date_of_appointment} label="YYYY" width="w-16"/>
                  </div>
               </div>
            </div>

            {/* --- FOOTER SIGNATURES (Inside Border) --- */}
            <div className="flex justify-between items-end text-[10px] px-2 pt-2">
              <div className="w-1/4">
                <div className="flex items-center">
                   <span className="mr-1">Prepared by</span>
                   <sup className="text-[7px]">22</sup>
                </div>
              </div>
              
              <div className="w-1/4 text-center">
                <div className="flex items-center justify-center">
                   <span className="mr-1">Audited/Checked by</span>
                   <sup className="text-[7px]">23</sup>
                </div>
              </div>

              <div className="w-1/4 text-center">
                <div className="flex items-center justify-center">
                   <span className="mr-1">Entered Verifed by</span>
                   <sup className="text-[7px]">24</sup>
                </div>
              </div>
              
              <div className="w-1/4 flex flex-col items-end">
                  <div className="text-left w-24">
                    <span className="mr-1">Employee Specimen Signature</span>
                    <sup className="text-[7px]">25</sup>
                  </div>
              </div> 
            </div>

          </div>
        </div>

    </div>
  );
};
