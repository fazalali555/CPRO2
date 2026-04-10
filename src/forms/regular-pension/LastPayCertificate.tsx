
import React from 'react';
import { EmployeeRecord } from '../../types';
import { formatCurrency, getCoverLetterInfo } from '../../utils';
import { format, parseISO } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try { return format(parseISO(dateStr), 'dd-MM-yyyy'); } catch { return dateStr; }
};

export const LastPayCertificate: React.FC<Props> = ({ employee }) => {
  const { employees, financials, service_history } = employee;
  const f = financials;
  
  // Logic to get the dynamic Head of Department title
  const { signatureTitle } = getCoverLetterInfo(employee);

  // --- Dynamic Field Collection ---

  // 1. Allowances
  const allowancesList = [
    { label: "Basic Pay", value: f.basic_pay },
    { label: "Personal Pay", value: f.p_pay },
    { label: "House Rent Allow", value: f.hra },
    { label: "Conveyance Allow", value: f.ca },
    { label: "Medical Allow", value: f.ma },
    { label: "UAA", value: f.uaa },
    { label: "Charge Allowance", value: f.charge_allow },
    { label: "Teaching Allowance", value: f.teaching_allow },
    { label: "Special Allow", value: f.spl_allow },
    { label: "Special Allow (Fem)", value: f.spl_allow_female },
    { label: "Special Allow (Dis)", value: f.spl_allow_disable },
    { label: "Integrated Allow", value: f.integrated_allow },
    { label: "Washing Allowance", value: f.wa },
    { label: "Dress Allowance", value: f.dress_allow },
    { label: "Computer Allowance", value: f.computer_allow },
    { label: "M.Phil Allowance", value: f.mphil_allow },
    { label: "Entertainment Allow", value: f.entertainment_allow },
    { label: "Science Teaching Allow", value: f.science_teaching_allow },
    { label: "Weather Allowance", value: f.weather_allow },
    { label: "Special Allow (N.T)", value: f.spl_allow_2021 },
    
    // Adhoc Reliefs
    { label: "Adhoc Relief 2013", value: f.adhoc_2013 },
    { label: "Adhoc Relief 2015", value: Math.max(f.adhoc_2015 || 0, f.adhoc_10pct || 0) },
    { label: "Adhoc Relief 2016", value: f.adhoc_2016 },
    { label: "Adhoc Relief 2022", value: Math.max(f.adhoc_2022 || 0, f.adhoc_2022_ps17 || 0) },
    { label: "DRA 2022 (KP)", value: f.dra_2022kp },
    { label: "Adhoc Relief 2023", value: f.adhoc_2023_35 },
    { label: "Adhoc Relief 2024", value: f.adhoc_2024_25 },
    { label: "Adhoc Relief 2025", value: f.adhoc_2025_10 },
    { label: "DRA 2025", value: f.dra_2025_15 },
  ];

  // Add Dynamic/Extra Allowances
  if (f.allowances_extra) {
    Object.entries(f.allowances_extra).forEach(([key, val]) => {
       if (Number(val) > 0) {
         allowancesList.push({ label: key.replace(/_/g, ' '), value: Number(val) });
       }
    });
  }
  // Add Legacy Arrears if present
  if (f.arrears) {
    Object.entries(f.arrears).forEach(([key, val]) => {
       if (Number(val) > 0) {
         allowancesList.push({ label: key.replace(/_/g, ' '), value: Number(val) });
       }
    });
  }

  // Filter 0 values
  const activeAllowances = allowancesList.filter(item => (item.value || 0) > 0);
  const grossTotal = activeAllowances.reduce((acc, curr) => acc + (curr.value || 0), 0);

  // 2. Deductions
  const deductionsList = [
    { label: "GP Fund Sub", value: f.gpf },
    { label: "GPF Advance Rec", value: f.gpf_loan_instal },
    { label: "Benevolent Fund", value: f.bf },
    { label: "E.E.F", value: f.eef },
    { label: "R.B & Death Comp", value: f.rb_death },
    { label: "Addl. Group Ins", value: f.adl_g_insurance },
    { label: "Group Insurance", value: f.group_insurance },
    { label: "Income Tax", value: f.income_tax },
    { label: "Education (ROP)", value: f.edu_rop },
    { label: "HBA Loan Instal", value: f.hba_loan_instal },
    { label: "Recovery / Other", value: f.recovery },
  ];

  // Add Dynamic/Extra Deductions
  if (f.deductions_extra) {
    Object.entries(f.deductions_extra).forEach(([key, val]) => {
       if (Number(val) > 0) {
         deductionsList.push({ label: key.replace(/_/g, ' '), value: Number(val) });
       }
    });
  }

  // Filter 0 values
  const activeDeductions = deductionsList.filter(item => (item.value || 0) > 0);
  const totalDeduction = activeDeductions.reduce((acc, curr) => acc + (curr.value || 0), 0);

  // 3. Net
  const netTotal = grossTotal - totalDeduction;

  const Row: React.FC<{ label: string; val: number }> = ({ label, val }) => (
    <div className="flex justify-between border-b border-gray-300 py-1">
       <span className="text-[11px] font-medium capitalize truncate pr-2">{label}</span>
       <span className="font-bold font-mono text-[11px] whitespace-nowrap">{formatCurrency(val).replace('PKR', '').trim()}/-</span>
    </div>
  );

  return (
    <div className="bg-white text-black font-serif text-[11px] leading-tight relative print-page mx-auto flex flex-col"
      style={{ 
        width: '210mm', 
        height: '297mm',
        padding: '10mm 15mm', 
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
      
      {/* Header */}
      <div className="text-center font-bold text-lg uppercase underline mb-4 shrink-0">
         LAST PAY CERTIFICATE
      </div>

      {/* Introduction */}
      <div className="mb-3 text-[11px] leading-relaxed shrink-0">
         Last pay certificate of <span className="font-bold uppercase border-b border-black px-1">{employees.name}</span>
         {' '}Of the <span className="font-bold uppercase border-b border-black px-1">{employees.school_full_name}</span>
         {' '}Proceeding to <span className="font-bold uppercase border-b border-black px-1">Retirement on Superannuation</span>
         {' '}He has been paid upto <span className="font-bold border-b border-black px-1">{formatDate(service_history.date_of_retirement)}</span>
      </div>
      <div className="mb-2 text-[11px] shrink-0">
         As the following rates:-
      </div>

      {/* Main Content Box - Uses flex-grow to fill available space */}
      <div className="border border-black p-3 mb-3 flex-grow flex flex-col">
         <h3 className="font-bold underline mb-2 text-sm shrink-0">Particulars:</h3>
         <div className="flex gap-6 items-start flex-grow">
            {/* Allowances Column */}
            <div className="w-1/2 space-y-1">
               <div className="font-bold text-[11px] border-b-2 border-black mb-1 pb-1">ALLOWANCES</div>
               {activeAllowances.length > 0 ? (
                 activeAllowances.map((item, idx) => (
                   <Row key={idx} label={item.label} val={item.value || 0} />
                 ))
               ) : (
                 <div className="text-center italic text-gray-500 py-2 text-[10px]">No Allowances</div>
               )}
               <div className="flex justify-between font-bold text-[12px] border-t-2 border-black pt-1 mt-2">
                  <span>Gross Total:</span>
                  <span>{formatCurrency(grossTotal).replace('PKR', '').trim()}/-</span>
               </div>
            </div>

            {/* Deductions Column */}
            <div className="w-1/2 space-y-1">
               <div className="font-bold text-[11px] border-b-2 border-black mb-1 pb-1">DEDUCTIONS</div>
               {activeDeductions.length > 0 ? (
                 activeDeductions.map((item, idx) => (
                   <Row key={idx} label={item.label} val={item.value || 0} />
                 ))
               ) : (
                 <div className="text-center italic text-gray-500 py-2 text-[10px]">No Deductions</div>
               )}
               <div className="flex justify-between font-bold text-[12px] text-red-800 border-t-2 border-black pt-1 mt-2">
                  <span>Total Deduction:</span>
                  <span>{formatCurrency(totalDeduction).replace('PKR', '').trim()}/-</span>
               </div>
            </div>
         </div>
         
         {/* Net Pay Section */}
         <div className="mt-auto border-t-2 border-double border-black pt-2 shrink-0">
            <div className="flex justify-end font-bold text-base">
               <span className="mr-4">Net Pay:</span>
               <span className="border-b-2 border-black px-4">{formatCurrency(netTotal).replace('PKR', '').trim()}/-</span>
            </div>
         </div>
      </div>

      {/* Office Details */}
      <div className="mb-3 text-[11px] leading-relaxed shrink-0">
         He made overcharge of the office of <span className="font-bold uppercase border-b border-black px-1">{employees.school_full_name}</span>
         {' '}On the <span className="font-bold uppercase border-b border-black px-1">After</span> noon of <span className="font-bold border-b border-black px-1">{formatDate(service_history.date_of_appointment)}</span>
      </div>

      {/* Recovery Note */}
      <div className="text-justify mb-3 text-[10px] leading-relaxed shrink-0">
         Recoveries are to be made from the pay of the government servant as detailed on the reverse. He has been paid leave salary as detailed below. Deduction have been made as noted on the reverse.
      </div>

      {/* Leave Details Grid */}
      <div className="grid grid-cols-2 gap-4 text-[10px] mb-3 shrink-0">
         <div className="border-b border-black pb-1">From _____________ to ____________ at Rs. ________ a month</div>
         <div className="border-b border-black pb-1">From _____________ to _____________ at Rs. ________ a month</div>
      </div>

      {/* Entitlements */}
      <div className="mb-4 text-[11px] shrink-0">
         He is entitled to draw the following: - 
         <br/>
         He is also entitled to joining time for ________ days.
      </div>

      {/* Spacer to prevent overlap with absolute footer */}
      <div className="h-[25mm] shrink-0"></div>

      {/* Signature Section - Absolute Positioning as requested */}
      <div className="absolute bottom-[12mm] left-[10mm] right-[10mm]">
        <div className="flex justify-between items-end">
          
          {/* Left Signature - ADDED HERE */}
          <div className="text-center w-[70mm]">
            <div className="border-t border-black pt-1">
              <div className="font-bold text-[11px] uppercase">{employees.name}</div>
            </div>
          </div>

          {/* Center - Page Number */}
          <div className="text-center text-[10px]">
            Page 8
          </div>

          {/* Right Signature - Head of Department */}
          <div className="text-center w-[70mm]">
            <div className="border-t border-black pt-1">
              <div className="font-bold text-[11px] uppercase leading-tight whitespace-pre-wrap">{signatureTitle}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
