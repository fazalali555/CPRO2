import React, { useEffect, useState } from 'react';
import { EmployeeRecord } from '../../types';
import { splitToChars } from '../../utils';
import { CombInput } from '../../components/PrintInputs';
import { format } from 'date-fns';

export interface AmendmentRow {
  infoType: string;
  fieldId: string;
  newContent: string;
  regularPay: string;
  amount: number;
  adj: string;
  remarks: string;
}

interface Props {
  employeeRecord?: EmployeeRecord;
  amendments?: AmendmentRow[];
  onUpdate?: (rows: AmendmentRow[]) => void;
}

export const PayrollAmendmentSingleForm: React.FC<Props> = ({ 
  employeeRecord, 
  amendments = [], 
  onUpdate 
}) => {
  const employees = employeeRecord?.employees;

  // Data Extraction
  const ddoCode = employees?.ddo_code || '';
  const officeName = employees?.office_name || '';
  const personnelNo = employees?.personal_no || '';
  const name = employees?.name || '';
  const grade = employees?.bps ? String(employees.bps) : '';
  const designation = employees?.designation || '';
  const cnic = employees?.cnic_no || '';
  const status = employees?.status || 'Active';

  // State Management
  const [rows, setRows] = useState<AmendmentRow[]>([]);

  useEffect(() => {
    // Fixed number of rows to fill the page exactly like the form
    const initialRows = [...amendments];
    const targetRowCount = 16; 
    while (initialRows.length < targetRowCount) {
      initialRows.push({ infoType: '', fieldId: '', newContent: '', regularPay: '', amount: 0, adj: '', remarks: '' });
    }
    setRows(initialRows.slice(0, targetRowCount));
  }, [amendments]);

  const handleChange = (index: number, field: keyof AmendmentRow, value: any) => {
    if (!onUpdate) return;
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
    onUpdate(newRows); 
  };

  const handleAddRow = () => {
    if (!onUpdate) return;
    const newRows = [...rows, { infoType: '', fieldId: '', newContent: '', regularPay: '', amount: 0, adj: '', remarks: '' }];
    setRows(newRows);
    onUpdate(newRows);
  };

  // Date Logic
  const now = new Date();
  const month = format(now, 'MMM').toUpperCase();
  const year = format(now, 'yyyy');

  // --- Helper Components ---

  // Input wrapper that looks like plain text in print, editable input on screen
  const BareInput = ({ 
    value, 
    onChange, 
    className = "", 
    type = "text",
    align = "left",
    bold = false
  }: { 
    value: string | number; 
    onChange: (val: any) => void; 
    className?: string; 
    type?: string;
    align?: "left" | "center" | "right";
    bold?: boolean;
  }) => {
    const alignment = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
    const weight = bold ? 'font-bold' : 'font-normal';
    
    if (!onUpdate) {
      return <div className={`w-full h-full flex items-center ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'} ${weight} ${className}`}>{value}</div>;
    }
    return (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-full bg-transparent border-none outline-none p-0 focus:bg-blue-50/10 ${alignment} ${weight} ${className}`} 
      />
    );
  };

  const Sup = ({ num }: { num: string }) => (
    <sup className="text-[6.5px] ml-0.5 font-bold top-[-4px] relative">{num}</sup>
  );

  return (
    <div className="bg-white text-black font-sans text-[10px] relative mx-auto p-0"
      style={{ width: '297mm', height: '210mm', padding: '8mm 12mm' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap');
        .font-sans { font-family: 'Arimo', Arial, Helvetica, sans-serif; }
        
        @media print {
          @page { size: landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          input { font-family: inherit; }
        }
        
        /* Specific Table Borders */
        .tbl-border-b { border-bottom: 1px solid black; }
        .tbl-border-r { border-right: 1px solid black; }
        .tbl-dotted-b { border-bottom: 1px dotted #444; }
        .tbl-dotted-r { border-right: 1px dotted #444; }
        
        /* Comb Input (Box) Styling Override to match image */
        .comb-box { 
          border: 1px solid black !important; 
          width: 14px; 
          height: 18px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: bold; 
          font-size: 11px;
          line-height: 1;
          margin-right: -1px; /* Overlap borders */
        }
        .comb-container { display: flex; }
        .comb-container > div:last-child { margin-right: 0; }
      `}</style>

      {/* ================= HEADER ================= */}
      {/* (Keeping header minimal to focus on fields as per request, but included for context) */}
      <div className="flex justify-between items-start mb-4">
        {/* Logo & Title */}
        <div className="flex gap-4">
          <div className="w-[16mm] h-[16mm] pt-1">
             <img src="/assets/KP_logo.png" alt="KP Govt Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-bold text-[11px] leading-tight">PAYROLL SYSTEM</h1>
            <h1 className="font-bold text-[11px] leading-tight">AMENDMENT FORM</h1>
            <h1 className="font-bold text-[11px] leading-tight">SINGLE EMPLOYEE ENTRY</h1>
          </div>
        </div>

        {/* Top Right Info */}
        <div className="w-[65mm] text-[10px]">
           <div className="text-right font-bold mb-2">FORM: PAY02</div>
           <div className="flex items-end mb-1">
              <span className="w-10">Date <Sup num="1"/></span>
              <div className="border-b border-black flex-grow"></div>
           </div>
           <div className="flex items-end">
              <span className="w-14">Page No. <Sup num="2"/></span>
              <div className="border-b border-black flex-grow"></div>
           </div>
        </div>
      </div>

      {/* ================= DATA FIELDS ================= */}
      <div className="space-y-1 mb-3 w-full">
        
        {/* --- Row 1: Office & Month --- */}
        <div className="flex items-end w-full">
           <div className="flex items-end flex-grow mr-6">
              <span className="font-bold uppercase whitespace-nowrap mr-2 text-[9px] translate-y-[-1px]">OFFICE OF THE <Sup num="3"/></span>
              <div className="border-b border-black flex-grow font-bold px-1 text-[11px] uppercase h-5 leading-none">
                {officeName}
              </div>
           </div>

           <div className="flex items-end flex-shrink-0 w-[60mm]">
              <span className="font-bold uppercase whitespace-nowrap mr-2 text-[9px] translate-y-[-1px]">FOR THE MONTH OF <Sup num="4"/></span>
              <div className="border border-black px-1 font-bold w-[13mm] h-[6mm] flex items-center justify-center text-[10px]">{month}</div>
              <span className="mx-2 font-bold text-[12px]">/</span>
              <div className="font-bold text-[12px]">{year}</div>
           </div>
        </div>

        {/* --- Row 2: DDO & Description --- */}
        <div className="flex items-end w-full">
           <div className="w-[18mm] flex-shrink-0 leading-none">
               <span className="font-bold block text-[10px]">DDO Code <Sup num="5"/></span>
               <span className="text-[8px] block mt-[1px]">(Cost Center)</span>
           </div>
           
           <div className="mr-2 pb-[1px]">
              <CombInput values={splitToChars(ddoCode, 6, false)} count={6} />
           </div>

           <div className="flex items-end flex-grow">
              <span className="text-[9px] mr-2 mb-[2px]">Description <Sup num="6"/></span>
              <div className="border-b border-black flex-grow font-bold px-1 text-[11px] uppercase h-5 leading-none truncate">
                {officeName}
              </div>
           </div>
        </div>

        {/* --- Row 3: Personnel & Name & NIC --- */}
        <div className="flex items-end w-full">
           {/* Personnel */}
           <div className="w-[18mm] flex-shrink-0 leading-none">
               <span className="font-bold block text-[10px]">Personnel</span>
               <span className="font-bold block text-[10px] mt-[1px]">Number <Sup num="7"/></span>
           </div>
           <div className="mr-4 pb-[1px]">
              <CombInput values={splitToChars(personnelNo, 8)} count={8} />
           </div>

           {/* Name */}
           <div className="flex items-end flex-grow mr-4">
              <div className="w-[14mm] mr-0 flex-shrink-0 leading-none">
                 <span className="font-bold block text-[10px]">Employee</span>
                 <span className="font-bold block text-[10px] mt-[1px]">Name <Sup num="8"/></span>
              </div>
              <div className="border-b border-black flex-grow font-bold px-1 text-[11px] uppercase h-5 leading-none whitespace-nowrap overflow-hidden">
                {name}
              </div>
           </div>

           {/* NIC - Aligned right */}
           <div className="flex items-end w-[72mm]">
              <div className="w-[16mm] mr-1 flex-shrink-0 leading-none">
                 <span className="font-bold block text-[9px]">National ID <Sup num="9"/></span>
                 <span className="font-bold block text-[9px]">Card</span>
                 <span className="font-bold block text-[9px]">Number</span>
              </div>
              <div className="border-b border-black flex-grow font-bold px-1 text-[11px] h-5 leading-none text-center tracking-wider">
                {cnic}
              </div>
           </div>
        </div>

        {/* --- Row 4: Grade & Status --- */}
        <div className="flex items-end w-full pt-1">
           <div className="w-[18mm] flex-shrink-0 leading-none">
               <span className="font-bold block text-[10px]">Grade (Pay</span>
               <span className="font-bold block text-[10px] mt-[1px]">Scale Group)</span>
           </div>
           
           <div className="flex items-end mr-3">
              <span className="text-[9px] font-bold mr-1 mb-1">10</span>
              <CombInput values={splitToChars(grade, 2, {padLeft: '0'})} count={2} />
           </div>

           <div className="flex items-end flex-grow mr-4">
              <span className="text-[9px] font-bold mr-2 mb-1">11</span>
              <div className="border-b border-black w-48 font-bold px-1 text-[11px] uppercase h-5 leading-none">
                {designation}
              </div>
           </div>

           {/* Salary Status */}
           <div className="flex items-end w-[72mm]">
              <div className="w-[12mm] mr-1 leading-none">
                 <span className="font-bold block text-[10px]">Salary <Sup num="12"/></span>
                 <span className="font-bold block text-[10px]">Status</span>
              </div>
              <div className="flex gap-4 pb-1 pl-1">
                 <div className="flex items-center gap-1">
                    <div className="w-[14px] h-[14px] border border-black flex items-center justify-center">
                       {status === 'Active' && <span className="font-bold text-[14px] leading-none mb-1">✓</span>}
                    </div>
                    <span className="text-[10px]">Start</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <div className="w-[14px] h-[14px] border border-black flex items-center justify-center">
                       {status !== 'Active' && <span className="font-bold text-[14px] leading-none mb-1">✓</span>}
                    </div>
                    <span className="text-[10px]">Stop</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="w-full border border-black border-b-0 mt-1">
         <table className="w-full border-collapse table-fixed">
            {/* Column Widths adjusted to match image 2 exactly */}
            <colgroup>
               <col style={{ width: '13mm' }} /> {/* Info Type */}
               <col style={{ width: '13mm' }} /> {/* Field ID */}
               <col style={{ width: '85mm' }} /> {/* New Contents (Very Wide) */}
               <col style={{ width: '18mm' }} /> {/* Regular Pay */}
               <col style={{ width: '30mm' }} /> {/* Rupees */}
               <col style={{ width: '15mm' }} /> {/* Paisa */}
               <col style={{ width: '10mm' }} /> {/* Adj */}
               <col style={{ width: '15mm' }} /> {/* 21 */}
               <col style={{ width: 'auto' }} />  {/* Remarks */}
            </colgroup>
            
            <thead>
               {/* Header Row 1 */}
               <tr className="h-5">
                  <th colSpan={3} className="tbl-border-b tbl-border-r font-bold uppercase text-[9px] py-1">
                     GENERAL DATA CHANGE <Sup num="13"/>
                  </th>
                  <th colSpan={4} className="tbl-border-b tbl-border-r font-bold uppercase text-[9px] py-1">
                     CHANGE IN PAYMENTS / DEDUCTIONS <Sup num="17"/>
                  </th>
                  <th colSpan={2} className="tbl-border-b font-bold text-[9px] bg-white"></th>
               </tr>

               {/* Header Row 2 */}
               <tr className="h-9 align-bottom text-[9px] leading-tight">
                  <th className="tbl-border-b tbl-border-r font-normal pb-1 px-1 text-center">Info <Sup num="14"/><br/>Type</th>
                  <th className="tbl-border-b tbl-border-r font-normal pb-1 px-1 text-center">Field<br/>ID <Sup num="15"/></th>
                  <th className="tbl-border-b tbl-border-r font-bold pb-1 text-center">New Contents <Sup num="16"/></th>
                  
                  <th className="tbl-border-b tbl-border-r font-normal pb-1 px-1 text-center">Regular<br/>Pay <Sup num="18"/></th>
                  
                  {/* Arrears Split */}
                  <th className="tbl-border-b tbl-border-r p-0 align-bottom">
                     <div className="w-full text-center border-b border-black font-bold h-4 pt-0.5">Arrears Amount</div>
                     <div className="w-full text-center h-5 flex items-center justify-center font-normal pt-1">Rupees <Sup num="19"/></div>
                  </th>
                  <th className="tbl-border-b tbl-border-r font-normal pb-1 text-center">Paisa</th>
                  
                  <th className="tbl-border-b tbl-border-r font-normal pb-1 text-center">Adj<br/><span className="text-[7px]">20</span></th>
                  
                  <th className="tbl-border-b tbl-border-r text-center align-middle font-bold">21</th>
                  <th className="tbl-border-b text-center align-middle font-normal text-[9px]">Remarks <Sup num="22"/></th>
               </tr>
            </thead>

            <tbody>
               {rows.map((row, i) => {
                 const amount = row.amount || 0;
                 const rupees = amount > 0 ? Math.floor(amount) : '';
                 const paisa = amount > 0 ? String(Math.round((amount - Math.floor(amount)) * 100)).padStart(2, '0') : '';
                 
                 // Bottom border logic: Last row gets solid black (via container), others get dotted
                 const borderClass = i === rows.length - 1 ? 'tbl-border-b' : 'tbl-dotted-b';

                 return (
                   <tr key={i} className={`h-[6mm] text-[10px] ${borderClass}`}>
                      {/* Info Type */}
                      <td className="tbl-border-r text-center p-0">
                        <BareInput align="center" value={row.infoType} onChange={(v) => handleChange(i, 'infoType', v)} />
                      </td>
                      
                      {/* Field ID */}
                      <td className="tbl-border-r text-center p-0">
                        <BareInput align="center" value={row.fieldId} onChange={(v) => handleChange(i, 'fieldId', v)} />
                      </td>
                      
                      {/* New Contents - BOLD */}
                      <td className="tbl-border-r px-2 font-bold uppercase align-middle">
                        <BareInput bold value={row.newContent} onChange={(v) => handleChange(i, 'newContent', v)} />
                      </td>
                      
                      {/* Regular Pay */}
                      <td className="tbl-border-r text-center align-middle">
                        <BareInput align="center" value={row.regularPay} onChange={(v) => handleChange(i, 'regularPay', v)} />
                      </td>
                      
                      {/* Rupees - Bold and Right Aligned */}
                      <td className="tbl-border-r px-2 text-right font-bold align-middle">
                        {onUpdate ? (
                           <input 
                             type="number" 
                             value={row.amount || ''} 
                             onChange={(e) => handleChange(i, 'amount', Number(e.target.value))}
                             className="w-full bg-transparent text-right outline-none font-bold"
                           />
                        ) : rupees}
                      </td>

                      {/* Paisa - Centered */}
                      <td className="tbl-border-r text-center text-[9px] align-middle">
                         {paisa}
                      </td>

                      {/* Adj */}
                      <td className="tbl-border-r text-center align-middle">
                        <BareInput align="center" value={row.adj} onChange={(v) => handleChange(i, 'adj', v)} />
                      </td>
                      
                      {/* Col 21 */}
                      <td className="tbl-border-r text-center align-middle"></td>
                      
                      {/* Remarks - Merged Cell */}
                      {i === 0 && (
                        <td rowSpan={rows.length} className="px-1 italic text-[10px] align-top pt-1 border-b border-black">
                           {onUpdate ? (
                             <textarea
                               value={row.remarks || ''}
                               onChange={(e) => handleChange(0, 'remarks', e.target.value)}
                               className="w-full h-full bg-transparent outline-none resize-none"
                             />
                           ) : (
                             <div className="whitespace-pre-wrap">{row.remarks}</div>
                           )}
                        </td>
                      )}
                   </tr>
                 );
               })}
            </tbody>
         </table>
      </div>

      {/* Screen Only Button */}
      {onUpdate && (
        <div className="no-print mt-2 flex justify-center">
          <button onClick={handleAddRow} className="px-3 py-1 bg-gray-100 text-xs hover:bg-gray-200 rounded border border-gray-300">
             + Add Row
          </button>
        </div>
      )}

      {/* ================= FOOTER ================= */}
      <div className="absolute bottom-[12mm] left-[12mm] right-[12mm] flex justify-between items-end">
         <div className="w-[60mm]">
            <div className="border-t border-black pt-1 text-center font-bold text-[9px]">
               Prepared By <Sup num="23"/>
            </div>
         </div>
         <div className="w-[60mm]">
            <div className="border-t border-black pt-1 text-center font-bold text-[9px]">
               Audited/Checked By <Sup num="24"/>
            </div>
         </div>
         <div className="w-[60mm]">
            <div className="border-t border-black pt-1 text-center font-bold text-[9px]">
               Entered / Verified By <Sup num="25"/>
            </div>
         </div>
      </div>

    </div>
  );
};