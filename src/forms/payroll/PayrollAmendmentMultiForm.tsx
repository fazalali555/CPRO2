import React from 'react';
import { format } from 'date-fns';
import { splitToChars, formatCurrency } from '../../utils';

interface MultiEntry {
  employee_id: string;
  personnel_no: string;
  name: string;
  cnic: string;
  absent_days: number;
  gross_salary: number;
  deduction_amount: number;
  reason: string;
  remarks: string;
}

interface Props {
  officeName?: string;
  ddoCode?: string;
  month?: string;
  entries: MultiEntry[];
}

export const PayrollAmendmentMultiForm: React.FC<Props> = ({ 
  officeName = "", 
  ddoCode = "", 
  month = format(new Date(), 'MMMM / yyyy'),
  entries = [] 
}) => {
  // Fill empty rows to make 14 rows total as per the template
  const rows = [...entries];
  while (rows.length < 14) {
    rows.push({
      employee_id: '',
      personnel_no: '',
      name: '',
      cnic: '',
      absent_days: 0,
      gross_salary: 0,
      deduction_amount: 0,
      reason: '',
      remarks: ''
    });
  }

  // Current year parts for "200__" field
  const currentYear = new Date().getFullYear().toString();
  const yearPrefix = currentYear.substring(0, 3); // "202"
  const yearSuffix = currentYear.substring(3);    // "4" (for 2024)

  return (
    <div className="bg-white text-black font-sans text-[10px] leading-tight relative print:shadow-none print:m-0 print:p-0"
         style={{ width: '297mm', minHeight: '210mm', boxSizing: 'border-box', padding: '10mm' }}>
      
      {/* TOP RIGHT INFO */}
      <div className="absolute top-4 right-10 text-[10px] font-bold w-48">
        <div className="flex justify-end mb-2">
          <span>FORM: PAY03</span>
        </div>
        <div className="flex justify-between items-end mb-1">
          <span>Date<sup className="text-[7px]">1</sup></span>
          <div className="border-b border-black w-24 text-center">{format(new Date(), 'dd-MM-yyyy')}</div>
        </div>
        <div className="flex justify-between items-end">
          <span>Page No.<sup className="text-[7px]">2</sup></span>
          <div className="border-b border-black w-24 text-center">1</div>
        </div>
      </div>

      {/* HEADER SECTION */}
      <div className="flex mb-4 mt-2">
        {/* Logo Section */}
        <div className="w-20 h-20 mr-4 flex-shrink-0">
          <img 
            src="/assets/KP_logo.png" 
            alt="KP Govt Logo" 
            className="w-full h-full object-contain"
          />
        </div>

        {/* Title and Office Info */}
        <div className="flex-grow pt-1">
          <h1 className="text-base font-bold leading-tight">
            PAYROLL SYSTEM<br />
            AMENDMENT FORM<br />
            <span className="text-xs font-normal">MULTIPLE EMPLOYEE ENTRY</span>
          </h1>

          <div className="mt-3 flex items-end">
            <span className="font-bold text-[10px] mr-2 whitespace-nowrap uppercase">OFFICE OF THE <sup className="text-[7px]">3</sup></span>
            <div className="border-b border-black flex-grow h-4 font-bold uppercase px-2">{officeName}</div>
          </div>

          <div className="mt-1 flex items-end w-full">
            <span className="font-bold text-[10px] mr-2 whitespace-nowrap uppercase">FOR THE MONTH OF <sup className="text-[7px]">4</sup></span>
            <div className="border-b border-black w-32 mr-2 font-bold text-center">{month.split('/')[0].trim()}</div>
            <span className="font-bold text-[10px] mr-2">/</span>
            <span className="font-bold text-[10px] mr-1">{yearPrefix}</span>
            <div className="border-b border-black w-10 font-bold text-center">{yearSuffix}</div>
          </div>
        </div>
      </div>

      {/* DDO CODE SECTION */}
      <div className="flex items-end mb-4 ml-24">
        <div className="mr-3 text-[10px]">
          <span className="font-bold block">DDO Code <sup className="text-[7px]">5</sup></span>
          <span className="text-[8px]">(Cost Center)</span>
        </div>
        
        {/* 6 Boxes for DDO Code (standard for current system) */}
        <div className="flex border-y border-l border-black h-7 bg-transparent">
          {splitToChars(ddoCode, 6, false).map((char, i) => (
            <div key={i} className="w-7 border-r border-black flex items-center justify-center font-bold text-xs">{char}</div>
          ))}
        </div>

        <div className="flex-grow flex items-end ml-4">
          <span className="text-[10px] mr-2 mb-1">Description <sup className="text-[7px]">6</sup></span>
          <div className="border-b border-black flex-grow h-7 font-bold uppercase px-2">{officeName}</div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="w-full border-t border-l border-black text-[9px] leading-tight overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            {/* Header Row 1: Main Sections */}
            <tr>
              <th colSpan={10} className="border-b border-r border-black p-1 text-center font-bold bg-gray-50">EMPLOYEE DETAILS</th>
              <th colSpan={3} className="border-b border-r border-black p-1 text-center font-bold bg-gray-50">GENERAL DATA CHANGE<sup className="text-[6px]">11</sup></th>
              <th colSpan={7} className="border-b border-black p-1 text-center font-bold bg-gray-50">CHANGE IN PAYMENTS / DEDUCTIONS <sup className="text-[6px]">14</sup></th>
            </tr>
            
            {/* Header Row 2: Field Names */}
            <tr className="h-8 align-bottom">
              {/* Personnel Number (Spans 8 columns for digits) */}
              <th colSpan={8} className="border-b border-r border-black p-0.5 text-center font-normal w-[100px]">
                Personnel Number <sup className="text-[6px]">7</sup>
              </th>
              
              <th className="border-b border-r border-black p-0.5 text-center font-normal w-[160px]">
                Employee Name <sup className="text-[6px]">8</sup>
              </th>
              
              <th className="border-b border-r border-black p-0.5 text-center font-normal w-[80px]">
                NIC Number <sup className="text-[6px]">9</sup>
              </th>

              {/* General Data Change Columns */}
              <th className="border-b border-r border-black p-0.5 text-center font-normal w-[35px]">
                Info<sup className="text-[6px]">10</sup><br/>Type
              </th>
              <th className="border-b border-r border-black p-0.5 text-center font-normal w-[35px]">
                Field<br/>ID <sup className="text-[6px]">12</sup>
              </th>
              <th className="border-b border-r border-black p-0.5 text-center font-normal w-[120px]">
                New Contents <sup className="text-[6px]">13</sup>
              </th>

              {/* Payment Change Columns */}
              <th className="border-b border-r border-black p-0.5 text-center font-normal w-[35px]">
                Wage<br/>Type<sup className="text-[6px]">15</sup>
              </th>
              
              {/* Amount (Merged) */}
              <th colSpan={2} className="border-b border-r border-black p-0 text-center font-bold w-[100px]">
                Amount
                <div className="flex justify-between font-normal mt-0.5 border-t border-black">
                  <span className="w-3/4 border-r border-dotted border-black text-[7px] py-0.5">Rupees <sup className="text-[6px]">16</sup></span>
                  <span className="w-1/4 text-[7px] py-0.5">Ps</span>
                </div>
              </th>

              <th className="border-b border-r border-black p-0.5 text-center font-normal w-[25px]">
                Adj<br/><sup className="text-[6px]">17</sup>
              </th>
              <th className="border-b border-r border-black p-0.5 text-center font-normal w-[25px]">
                Stop<br/>Sal.<sup className="text-[6px]">18</sup>
              </th>
              <th className="border-b border-r border-black p-0.5 text-center font-normal w-[55px]">
                Effective<br/>Date <sup className="text-[6px]">19</sup>
              </th>
              <th className="border-b border-black p-0.5 text-center font-normal">
                Remarks <sup className="text-[6px]">20</sup>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry, i) => {
              const personnelChars = splitToChars(entry.personnel_no, 8);
              const amount = entry.deduction_amount || 0;
              const rupees = Math.floor(amount);
              const paisa = Math.round((amount - rupees) * 100);
              
              return (
                <tr key={i} className="h-6">
                  {/* Personnel Number - 8 Digits */}
                  {personnelChars.map((char, charIdx) => (
                    <td key={charIdx} className="border-b border-r border-black text-center font-bold text-[8px] w-[12.5px]">{char}</td>
                  ))}

                  {/* Name */}
                  <td className="border-b border-r border-black px-1 uppercase font-bold text-[8px] truncate max-w-[160px]">{entry.name}</td>
                  {/* NIC */}
                  <td className="border-b border-r border-black text-center text-[8px] tracking-tighter">{entry.cnic}</td>
                  
                  {/* Info Type */}
                  <td className="border-b border-r border-black text-center"></td>
                  {/* Field ID */}
                  <td className="border-b border-r border-black text-center"></td>
                  {/* New Contents */}
                  <td className="border-b border-r border-black px-1 text-[8px]">{entry.reason}</td>
                  
                  {/* Wage Type */}
                  <td className="border-b border-r border-black text-center"></td>
                  
                  {/* Amount (Rupees) */}
                  <td className="border-b border-r border-dotted border-black text-right px-1 font-bold">{amount > 0 ? rupees : ''}</td>
                  {/* Amount (Paisa) */}
                  <td className="border-b border-r border-black text-center text-[7px]">{amount > 0 ? paisa.toString().padStart(2, '0') : ''}</td>
                  
                  {/* Adj */}
                  <td className="border-b border-r border-black text-center"></td>
                  {/* Stop Sal */}
                  <td className="border-b border-r border-black text-center"></td>
                  {/* Eff Date */}
                  <td className="border-b border-r border-black text-center text-[7px]">{entry.personnel_no ? format(new Date(), 'dd/MM/yy') : ''}</td>
                  {/* Remarks */}
                  <td className="border-b border-black px-1 italic text-[7px] truncate max-w-[100px]">{entry.remarks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER SIGNATURES */}
      <div className="flex justify-between text-[10px] items-end mt-12 px-4">
        <div className="w-56 text-center">
          <div className="border-t border-black pt-1 font-bold">
            Prepared By <sup className="text-[7px]">21</sup>
          </div>
          <div className="text-[8px]">(DDO Signature & Stamp)</div>
        </div>
        
        <div className="w-56 text-center">
          <div className="border-t border-black pt-1 font-bold">
            Audited/Checked By <sup className="text-[7px]">22</sup>
          </div>
          <div className="text-[8px]">(DAO Signature & Stamp)</div>
        </div>

        <div className="w-56 text-center">
          <div className="border-t border-black pt-1 font-bold">
             Entered / Verified By <sup className="text-[7px]">23</sup>
          </div>
          <div className="text-[8px]">(Data Entry Operator)</div>
        </div>
      </div>

      {/* CSS For Print Media to remove browser defaults */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        td {
          border-color: black !important;
        }
        th {
          border-color: black !important;
        }
      `}</style>
    </div>
  );
};
