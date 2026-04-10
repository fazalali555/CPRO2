
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo, splitToChars, formatCurrency, calculateServiceDuration } from '../../utils';
import { CombInput, RadioOption } from '../../components/PrintInputs';
import { format, parseISO } from 'date-fns';

interface Props {
  employeeRecord: EmployeeRecord;
  caseRecord: CaseRecord;
}


export const PAYF05TemporaryLoan: React.FC<Props> = ({ employeeRecord, caseRecord }) => {
  const { employees, service_history, financials, extras: empExtras } = employeeRecord;
  const extras = caseRecord.extras || {};

  // --- Dynamic Data ---
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
  const scale = bps;
  
  // Service Period
  const service = calculateServiceDuration(
    service_history.date_of_appointment,
    appDateStr
  );

  const gpfAccountNo = employees.gpf_account_no || '0';
  const loanCode = '6103'; // Fixed for GPF Advance
  
  // Amounts
  const amount = Number(extras.amount_requested) || 0;
  // If not manually in case extras, check if we have a standing instruction in financials
  const rateRecovery = Number(extras.monthly_recovery) || financials.gpf_loan_instal || 0;
  
  // Outstanding Balance (From employee record or case)
  const outstandingBalance = Number(extras.current_balance) > 0 ? 
                             Number(extras.current_balance) : 
                             (empExtras?.gpf_adv_balance || 0);

  return (
    <div className="bg-white text-black font-sans text-xs leading-tight relative print-page mx-auto"
      style={{ width: '210mm', minHeight: '297mm', padding: '10mm 15mm', boxSizing: 'border-box' }}>
      
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col items-end mb-4">
          <h2 className="font-bold text-[10px] mb-2">FORM: PAYF05</h2>
          
          <div className="flex items-end w-48 mb-1">
            <span className="mr-1 text-[10px]">Date</span>
            <sup className="text-[7px] mr-1">1</sup>
            <div className="border-b border-black flex-grow h-3 text-center font-bold">{dateFormatted}</div>
          </div>
          
          <div className="flex items-end w-48">
            <span className="mr-1 text-[10px]">Page No.</span>
            <sup className="text-[7px] mr-1">2</sup>
            <div className="border-b border-black flex-grow h-3"></div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="font-bold text-sm uppercase tracking-wide mb-4">
            TEMPORARY LOANS / ADVANCES FORM (NEW & AMENDMENT)
          </h1>
          
          <div className="flex justify-start items-end mb-2 pl-12">
             <span className="uppercase text-[10px] font-bold mr-2 w-28 text-left shrink-0">OFFICE OF THE <sup className="font-normal">3</sup></span>
             <div className="border-b border-black flex-grow text-center font-bold text-[11px] pb-0.5 truncate uppercase">
               {officeName}
             </div>
          </div>

          <div className="flex justify-start items-end pl-12 w-3/5">
             <span className="uppercase text-[10px] font-bold mr-2 w-28 text-left shrink-0">FOR THE MONTH OF <sup className="font-normal">4</sup></span>
             <div className="border-b border-black flex-grow pb-0.5 text-center font-bold uppercase">{monthOf}</div>
          </div>
        </div>


        {/* ================= GENERAL INFORMATION BOX ================= */}
        <h3 className="font-bold text-[10px] uppercase mb-1">GENERAL INFORMATION</h3>
        <div className="border border-black p-2 mb-4">
          
          {/* Row 1: DDO Code */}
          <div className="flex items-end mb-3">
            <div className="w-24 text-[10px] leading-tight shrink-0">
              DDO Code <sup className="text-[7px]">5</sup><br/>
              (Cost Center)
            </div>
            <CombInput values={splitToChars(ddoCode, 6)} count={6} />
            
            <div className="ml-2 flex-grow flex items-end min-w-0">
              <span className="text-[10px] mr-1 mb-6 shrink-0">Description <sup className="text-[7px]">6</sup></span>
              <div className="border-b border-black flex-grow mb-1 text-center font-bold text-sm pb-1 truncate uppercase">
                {officeName}
              </div>
            </div>
          </div>

          {/* Row 2: Personnel Number */}
          <div className="flex items-end mb-3">
            <div className="w-24 text-[10px] leading-tight shrink-0">
              Personnel<br/>
              Number <sup className="text-[7px]">7</sup>
            </div>
            <CombInput values={splitToChars(personalNo, 8, { padLeft: '0' })} count={8} />
            
            <div className="ml-2 flex-grow flex items-end min-w-0">
              <span className="text-[10px] mr-1 mb-6 shrink-0">Employees Name <sup className="text-[7px]">8</sup></span>
              <div className="border-b border-black flex-grow mb-1 text-center font-bold text-sm pb-1 truncate">
                {name}
              </div>
            </div>

            <div className="ml-2 flex items-end shrink-0">
               <span className="text-[10px] mr-1 mb-2">Grade <sup className="text-[7px]">9</sup></span>
               <CombInput values={splitToChars(bps, 2, { padLeft: '0' })} count={2} />
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
              <CombInput values={[]} count={6} />
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
            <CombInput values={splitToChars(scale, 2, { padLeft: '0' })} count={2} />
            <sup className="text-[7px] self-end mb-2 ml-1">14</sup>
            
            <div className="w-32 border-b border-black mx-2 mb-1 text-center font-bold text-[10px] pb-1 truncate uppercase">
              {designation}
            </div>

            <div className="text-[10px] leading-tight mb-2 ml-2 shrink-0">
              Period of<br/>
              Service <sup className="text-[7px]">15</sup>
            </div>
            
            <div className="flex items-center ml-4 font-bold text-xs mb-2 shrink-0 border-b border-black pb-0.5">
               <span className="mx-2">{service.years}</span> Y
               <span className="mx-4">{service.months}</span> M
               <span className="mx-4">{service.days}</span> D
            </div>

            <div className="ml-4 flex-grow flex items-end min-w-0">
              <div className="text-[10px] leading-tight mr-1 mb-1 w-20 shrink-0">
                Old GP Fund<br/>
                Account No. <sup className="text-[7px]">16</sup>
              </div>
              <div className="border-b border-black flex-grow mb-1 text-center font-bold pb-1 truncate">
                {gpfAccountNo}
              </div>
            </div>
          </div>

        </div>


        {/* ================= TEMPORARY LOAN DETAILS BOX ================= */}
        <h3 className="font-bold text-[10px] uppercase mb-1">TEMPORARY LOAN DETAILS</h3>
        <div className="border border-black p-2 min-h-[400px]">
          
          {/* Loan Header */}
          <div className="flex items-end mb-4">
             <div className="text-[10px] leading-tight mr-2 mb-2 shrink-0">
                Loan <sup className="text-[7px]">17</sup><br/>
                Code
             </div>
             <CombInput values={splitToChars(loanCode, 4)} count={4} />
             
             <div className="ml-2 flex-grow flex items-end min-w-0">
                <span className="text-[10px] mr-1 mb-3 shrink-0">Description <sup className="text-[7px]">18</sup></span>
                <div className="border-b border-black flex-grow mb-1 pl-4 font-bold text-sm">
                   GPF Advance
                </div>
             </div>

             <div className="ml-4 w-64 flex flex-col items-start shrink-0">
                <div className="text-[10px] mb-1">Approval Date of Loan <sup className="text-[7px]">19</sup></div>
                <div className="flex items-end w-full">
                   <div className="border-b border-black w-10"></div>
                   <span className="mx-1">/</span>
                   <div className="border-b border-black w-10"></div>
                   <span className="mx-1">/</span>
                   <div className="border-b border-black w-12"></div>
                </div>
                <div className="flex w-full text-[8px] text-gray-600 justify-start pl-2 gap-8 mt-0.5">
                   <span>DD</span>
                   <span>MM</span>
                   <span>YYYY</span>
                </div>
             </div>
          </div>

          {/* Loan Conditions (Radio Buttons) */}
          <div className="flex items-start mb-8">
             <div className="text-[10px] leading-tight w-24 shrink-0">
               Loan <sup className="text-[7px]">20</sup><br/>
               Condition
             </div>
             
             <div className="flex flex-col gap-1 mr-12 shrink-0">
               <RadioOption label="With Interest" superscript="" />
               <RadioOption label="Without Interest" superscript="" checked={true} />
             </div>

             <div className="flex items-end mr-12 shrink-0">
               <div className="text-[10px] leading-tight">
                 Loan<br/>
                 Interest <sup className="text-[7px]">21</sup>
               </div>
               <div className="border-b border-black w-16 mx-2 mb-1"></div>
               <span className="text-[10px] mb-1">%</span>
             </div>

             <div className="text-[10px] leading-tight w-24 shrink-0">
               Refundable <sup className="text-[7px]">22</sup><br/>
               Percentage of GP<br/>
               Fund Balance
             </div>
             
             <div className="flex flex-col gap-1 ml-2 shrink-0">
               <RadioOption label="80%" superscript="" checked={true} />
               <RadioOption label="100%" superscript="" />
               <RadioOption label="Other % ______" superscript="" />
             </div>
          </div>

          {/* Principal Section */}
          <div className="ml-10 mb-8">
            <h4 className="font-bold text-[11px] mb-2">Principal</h4>
            
            <div className="flex mb-4">
              {/* Left Column */}
              <div className="w-1/2 pr-4">
                 <div className="flex items-end mb-4">
                   <span className="text-[10px] w-24 shrink-0">Amount of Loan <sup className="text-[7px]">23</sup></span>
                   <div className="border-b border-black flex-grow text-right font-bold pr-2 pb-1 text-sm">
                      {amount > 0 ? formatCurrency(amount).replace('PKR', '').trim() : ''}
                   </div>
                 </div>
              </div>

              {/* Middle Column */}
              <div className="w-1/2 flex gap-4">
                 <div className="flex-grow">
                    <div className="flex items-end mb-1">
                      <span className="text-[10px] mr-2 whitespace-nowrap shrink-0">Date of <sup className="text-[7px]">24</sup><br/>First Deduction</span>
                      <div className="border-b border-black flex-grow flex items-end justify-between px-2">
                         <span>/</span>
                         <span>/</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[8px] pl-16 pr-2">
                        <span>DD</span><span>MM</span><span>YYYY</span>
                    </div>
                 </div>

                 <div className="flex-grow">
                   <div className="flex items-end">
                      <span className="text-[10px] w-20 leading-tight shrink-0">Rate of <sup className="text-[7px]">25</sup><br/>Recovery</span>
                      <div className="border-b border-black flex-grow text-center font-bold pb-1 text-sm">
                         {rateRecovery > 0 ? formatCurrency(rateRecovery).replace('PKR', '').trim() : ''}
                      </div>
                   </div>
                 </div>
              </div>
            </div>

             {/* Row 2 of Principal */}
             <div className="flex mb-4">
               <div className="w-1/2 pr-4"></div> {/* Spacer */}
               <div className="w-1/2 flex gap-4">
                 <div className="flex-grow">
                    <div className="flex items-end mb-1">
                      <span className="text-[10px] mr-2 whitespace-nowrap shrink-0">Date of <sup className="text-[7px]">26</sup><br/>Last Deduction</span>
                      <div className="border-b border-black flex-grow flex items-end justify-between px-2">
                         <span>/</span>
                         <span>/</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[8px] pl-16 pr-2">
                        <span>DD</span><span>MM</span><span>YYYY</span>
                    </div>
                 </div>

                 <div className="flex-grow">
                   <div className="flex items-end">
                      <span className="text-[10px] w-20 leading-tight shrink-0">Rate of <sup className="text-[7px]">27</sup><br/>Recovery</span>
                      <div className="border-b border-black flex-grow text-center font-bold pb-1"></div>
                   </div>
                 </div>
              </div>
             </div>

            {/* Row 3 of Principal */}
            <div className="flex">
               <div className="w-1/2 pr-4 flex items-end">
                   <div className="text-[10px] w-32 shrink-0">Outstanding <sup className="text-[7px]">28</sup><br/>Balance of Loan</div>
                   <div className="border-b border-black flex-grow text-right font-bold pr-2">
                      {outstandingBalance > 0 ? formatCurrency(outstandingBalance).replace('PKR', '').trim() : ''}
                   </div>
               </div>
            </div>
          </div>


          {/* Interest Section */}
          <div className="mb-2">
            <h4 className="font-bold text-[11px] mb-2 ml-10">Interest</h4>
            
            <div className="flex items-end mb-4">
                <div className="text-[10px] leading-tight mr-2 mb-2 shrink-0">
                  Loan <sup className="text-[7px]">29</sup><br/>
                  Code
                </div>
                <CombInput values={[]} count={4} />
                
                <div className="ml-2 w-64 flex items-end">
                  <span className="text-[10px] mr-1 mb-3 shrink-0">Description <sup className="text-[7px]">30</sup></span>
                  <div className="border-b border-black flex-grow mb-1"></div>
                </div>
            </div>

            <div className="ml-10">
              <div className="flex mb-4">
                {/* Left Column */}
                <div className="w-1/2 pr-4">
                  <div className="flex items-end mb-4">
                    <span className="text-[10px] w-24 shrink-0">Amount <sup className="text-[7px]">31</sup><br/>of Interest</span>
                    <div className="border-b border-black flex-grow text-right font-bold pr-2 pb-1"></div>
                  </div>
                </div>

                {/* Middle Column */}
                <div className="w-1/2 flex gap-4">
                  <div className="flex-grow">
                      <div className="flex items-end mb-1">
                        <span className="text-[10px] mr-2 whitespace-nowrap shrink-0">Date of <sup className="text-[7px]">32</sup><br/>First Deduction</span>
                        <div className="border-b border-black flex-grow flex items-end justify-between px-2">
                          <span>/</span>
                          <span>/</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-[8px] pl-16 pr-2">
                          <span>DD</span><span>MM</span><span>YYYY</span>
                      </div>
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-end">
                        <span className="text-[10px] w-20 leading-tight shrink-0">Rate of <sup className="text-[7px]">33</sup><br/>Recovery</span>
                        <div className="border-b border-black flex-grow text-center font-bold pb-1"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2 of Interest */}
              <div className="flex mb-4">
                <div className="w-1/2 pr-4"></div> {/* Spacer */}
                <div className="w-1/2 flex gap-4">
                  <div className="flex-grow">
                      <div className="flex items-end mb-1">
                        <span className="text-[10px] mr-2 whitespace-nowrap shrink-0">Date of <sup className="text-[7px]">34</sup><br/>Last Deduction</span>
                        <div className="border-b border-black flex-grow flex items-end justify-between px-2">
                          <span>/</span>
                          <span>/</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-[8px] pl-16 pr-2">
                          <span>DD</span><span>MM</span><span>YYYY</span>
                      </div>
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-end">
                        <span className="text-[10px] w-20 leading-tight shrink-0">Rate of <sup className="text-[7px]">35</sup><br/>Recovery</span>
                        <div className="border-b border-black flex-grow text-center font-bold pb-1"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3 of Interest */}
              <div className="flex">
                <div className="w-1/2 pr-4 flex items-end">
                    <div className="text-[10px] w-32 shrink-0">Outstanding <sup className="text-[7px]">36</sup><br/>Balance of Interest</div>
                    <div className="border-b border-black flex-grow"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= FOOTER SIGNATURES ================= */}
        <div className="mt-8 flex justify-end">
             <div className="w-40">
                <div className="text-[10px] mb-8">Employee Specimen Signature <sup className="text-[7px]">40</sup></div>
                <div className="border-b border-black mb-1"></div>
                <div className="border-b border-black"></div>
             </div>
        </div>

        <div className="mt-4 flex justify-between items-end text-[10px]">
           <div className="text-center w-40">
             <div className="border-t border-black pt-1">Prepared by <sup className="text-[7px]">37</sup></div>
           </div>
           
           <div className="text-center w-40">
             <div className="border-t border-black pt-1">Audited/Checked by <sup className="text-[7px]">38</sup></div>
           </div>

           <div className="text-center w-40">
             <div className="border-t border-black pt-1">Entered/Verified by <sup className="text-[7px]">39</sup></div>
           </div>
           
           {/* Spacer to align with previous column */}
           <div className="w-40"></div> 
        </div>

    </div>
  );
};
