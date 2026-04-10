// tabill.tsx - Travel Allowance Bill Component
import React, { useMemo } from 'react';

export interface TABillRow {
  date: string;
  from: string;
  to: string;
  kind: string;
  km: number;
  ratePerKm: number;
  mileageAmount: number;
  daDays: number;
  daRate: number;
  daAmount: number;
  total: number;
  isHotel?: boolean;
  remarks?: string;
}

export interface TABillSummary {
  totalDays: number;
  totalHalfDays: number;
  totalNights: number;
  totalNightsRate: number;
  totalNightsAmount: number;
  totalMileageKm: number;
  totalMileageRate: number;
  totalMileageAmount: number;
  grandTotal: number;
  totalDaAmount?: number;
  totalHotelAmount?: number;
  totalOtherAmount?: number;
  lessDeduction?: number;
  daRate?: number; // Add DA rate for proper calculation
}

export interface TABillHeader {
  employeeName: string;
  iban: string;
  designation: string;
  gradeLabel: string;
  employeeCode: string;
  basicPay: number;
  station?: string;
  ddoCode?: string;
}

export interface TravelAllowanceBillProps {
  header: TABillHeader;
  rows: TABillRow[];
  summary: TABillSummary;
}
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const TravelAllowanceBill: React.FC<TravelAllowanceBillProps> = ({ header, rows, summary }) => {
  const printStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap');
    
    @media print {
      @page { 
        size: A4 landscape; 
        margin: 5mm; 
      }
      
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .print-wrapper {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: auto !important;
      }
      
      .print-page {
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        page-break-after: always;
        page-break-inside: avoid;
      }
      
      .print-page:last-child {
        page-break-after: avoid;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
    
    .font-arial { font-family: 'Arimo', Arial, Helvetica, sans-serif; }
    .tbl-main, .tbl-main th, .tbl-main td { border: 1px solid black; border-collapse: collapse; }
  `;

  const fmt = (n: number | string | undefined) => {
    if (n === undefined || n === null) return '';
    const num = typeof n === 'string' ? Number(n.replace(/,/g, '')) || 0 : n;
    if (num === 0) return '';
    return num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
  };

  const fmtRate = (n: number | string | undefined) => {
    if (n === undefined || n === null) return '';
    const num = typeof n === 'string' ? Number(n.replace(/,/g, '')) || 0 : n;
    if (num === 0) return '';
    return num.toLocaleString('en-PK', { maximumFractionDigits: 2 });
  };

  const fmtZero = (n: number | string | undefined) => {
    if (n === undefined || n === null) return '0';
    const num = typeof n === 'string' ? Number(n.replace(/,/g, '')) || 0 : n;
    return num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
  };

  const fmtDays = (n: number | undefined) => {
    if (n === undefined || n === null || n === 0) return '';
    if (n === 0.5) return '0.5';
    return n.toString();
  };

  const pagesData = useMemo(() => {
    const ROW_LIMIT = 18;
    const result: { rows: TABillRow[]; summary: TABillSummary }[] = [];
    const safeRows = Array.isArray(rows) ? rows : [];

    const calculatePageSummary = (pageRows: TABillRow[]): TABillSummary => {
      let totalDays = 0, totalHalfDays = 0, totalNights = 0;
      let totalNightsRate = 0, totalNightsAmount = 0;
      let totalDaAmount = 0, totalHotelAmount = 0;
      let daRate = 0;

      for (const row of pageRows) {
        if (row.isHotel) {
          totalNights += row.daDays;
          totalNightsAmount += row.daAmount;
          totalNightsRate = row.daRate;
          totalHotelAmount += row.daAmount;
        } else {
          // Track DA rate from non-hotel rows
          if (row.daRate > 0) daRate = row.daRate;
          
          if (row.daDays === 0.5) {
            totalHalfDays += 1;
          } else if (row.daDays === 1) {
            totalDays += 1;
          }
          totalDaAmount += row.daAmount;
        }
      }

      const totalMileageKm = pageRows.reduce((s, r) => s + (r.km || 0), 0);
      const totalMileageAmount = pageRows.reduce((s, r) => s + (r.mileageAmount || 0), 0);
      const totalMileageRate = summary.totalMileageRate || 3.75;
      const grandTotal = pageRows.reduce((s, r) => s + (r.total || 0), 0);
      
      return { 
        totalDays, 
        totalHalfDays, 
        totalNights, 
        totalNightsRate, 
        totalNightsAmount, 
        totalMileageKm, 
        totalMileageRate, 
        totalMileageAmount, 
        grandTotal,
        totalDaAmount, 
        totalHotelAmount, 
        totalOtherAmount: 0, 
        lessDeduction: 0,
        daRate: daRate || summary.daRate || 1440
      };
    };

    if (safeRows.length === 0) {
      result.push({ rows: [], summary: calculatePageSummary([]) });
      return result;
    }

    for (let i = 0; i < safeRows.length; i += ROW_LIMIT) {
      const pageRows = safeRows.slice(i, i + ROW_LIMIT);
      result.push({ rows: pageRows, summary: calculatePageSummary(pageRows) });
    }

    return result;
  }, [rows, summary]);

  const HeaderSection = () => {
    const bpsMatch = header.gradeLabel?.match(/\d+/);
    const bps = bpsMatch ? parseInt(bpsMatch[0], 10) : 0;
    const isNonGazetted = bps < 16;
    const titleType = isNonGazetted ? 'NON GAZETTED' : 'GAZETTED';

    return (
      <div className="flex flex-col items-center mb-1 w-full">
        <div className="relative w-full text-center">
          <div className="absolute left-4 top-0 w-20 h-16">
            <img src="/assets/KP_logo.png" alt="KPK Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-bold underline text-[14px] leading-tight uppercase">
            {header.station || 'Government Office'}
          </h1>
          <h2 className="font-bold underline text-[13px] uppercase leading-tight mt-0.5">
            {titleType} TRAVELLING ALLOWANCE BILL
          </h2>
          <div className="inline-block border-2 border-black font-bold px-3 py-0.5 mt-1 text-[12px]">
            DDO CODE: {header.ddoCode || 'XXXXXX'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-200 min-h-screen p-4 font-arial text-black print-wrapper">
      <style>{printStyles}</style>

      {pagesData.map((page, pageIndex) => {
        // Calculate proper amounts for summary
        const daRate = page.summary.daRate || 1440;
        const halfDayRate = daRate / 2;
        const totalDaysAmount = page.summary.totalDays * daRate;
        const totalHalfDaysAmount = page.summary.totalHalfDays * halfDayRate;

        return (
          <React.Fragment key={pageIndex}>
            {/* Page 1 - Main Table */}
            <div 
              className={`print-page bg-white mx-auto relative shadow-xl ${pageIndex > 0 ? 'page-break mt-8' : ''}`}
              style={{ width: '297mm', minHeight: '200mm', padding: '8mm 10mm', boxSizing: 'border-box' }}
            >
              <HeaderSection />
              
              {/* Employee Info */}
              <div className="w-full border-b border-black mb-1 flex text-[9px] pb-1 pt-3">
                <div className="w-[30%]">
                  <div className="font-bold">Employee Name:</div>
                  <div className="mt-0.5 font-bold">{header.employeeName}</div>
                  <div className="font-bold underline mt-0.5">IBAN NO: {header.iban}</div>
                </div>
                <div className="w-[25%] text-center">
                  <div className="font-bold">Employee Designation / Grade</div>
                  <div className="mt-0.5 font-bold">{header.designation}</div>
                </div>
                <div className="w-[15%] text-center">
                  <div className="font-bold">Employee Code</div>
                  <div className="mt-0.5 font-bold">{header.employeeCode}</div>
                </div>
                <div className="w-[15%] text-center">
                  <div className="font-bold">Pay Scale:</div>
                  <div className="mt-0.5 font-bold">{header.gradeLabel}</div>
                </div>
                <div className="w-[15%] text-left pl-4">
                  <div className="font-bold">Employee Basic Pay</div>
                  <div className="mt-0.5 font-bold">{fmt(header.basicPay)}</div>
                </div>
              </div>
              
              <div className="text-right text-[9px] font-bold mb-0.5 pr-12">Date</div>
              
              {/* Main Table */}
              <div className="w-full mb-1">
                <table className="w-full text-[9px] text-center table-fixed tbl-main">
                  <colgroup>
                    <col style={{width: '18mm'}} />
                    <col style={{width: '40mm'}} />
                    <col style={{width: '40mm'}} />
                    <col style={{width: '18mm'}} />
                    <col style={{width: '12mm'}} />
                    <col style={{width: '12mm'}} />
                    <col style={{width: '15mm'}} />
                    <col style={{width: '12mm'}} />
                    <col style={{width: '12mm'}} />
                    <col style={{width: '15mm'}} />
                    <col style={{width: '15mm'}} />
                    <col style={{width: 'auto'}} />
                  </colgroup>
                  <thead>
                    <tr className="h-5">
                      <th colSpan={3} className="font-bold border-b border-black">Particulars of Journey and Halt</th>
                      <th rowSpan={2} className="font-bold border-b border-black">Mode of<br/>Travel</th>
                      <th colSpan={3} className="font-bold border-b border-black">Journey by Road</th>
                      <th colSpan={3} className="font-bold border-b border-black">Daily/Night Allowances</th>
                      <th rowSpan={2} className="font-bold border-b border-black">Total</th>
                      <th rowSpan={2} className="font-bold border-b border-black">Purpose /<br/>Remarks</th>
                    </tr>
                    <tr className="h-8 align-middle">
                      <th className="font-bold">Date</th>
                      <th className="font-bold">From</th>
                      <th className="font-bold">To</th>
                      <th className="font-bold">No. of<br/>KMs</th>
                      <th className="font-bold">Rates</th>
                      <th className="font-bold">Amount</th>
                      <th className="font-bold">No. of<br/>Days/<br/>Nights</th>
                      <th className="font-bold">Rates</th>
                      <th className="font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.rows.map((row, i) => (
                      <tr key={i} className="h-[5mm]">
                        {row.isHotel ? (
                          // Hotel/Night row with "Stayed at Hotel" in merged cells
                          <>
                            <td></td>
                            <td colSpan={2} className="text-center">Stayed at Hotel</td>
                            <td colSpan={2} className="text-right pr-2">Night Charges</td>
                            <td></td>
                            <td></td>
                            <td className="text-center">{row.daDays}</td>
                            <td className="text-center">{fmt(row.daRate)}</td>
                            <td className="text-center">{fmt(row.daAmount)}</td>
                            <td className="text-center">{fmt(row.total)}</td>
                            <td></td>
                          </>
                        ) : (
                          // Regular journey row
                          <>
                            <td className="text-center">{formatDate(row.date)}</td>
                            <td className="text-left px-1">{row.from}</td>
                            <td className="text-left px-1">{row.to}</td>
                            <td className="text-center">{row.kind}</td>
                            <td className="text-center">{fmt(row.km)}</td>
                            <td className="text-center">{row.km > 0 ? fmtRate(row.ratePerKm) : ''}</td>
                            <td className="text-center">{fmt(row.mileageAmount)}</td>
                            <td className="text-center">{fmtDays(row.daDays)}</td>
                            <td className="text-center">{row.daDays > 0 ? fmt(row.daRate) : ''}</td>
                            <td className="text-center">{fmt(row.daAmount)}</td>
                            <td className="text-center">{fmt(row.total)}</td>
                            <td className="text-left px-1">{row.remarks || ''}</td>
                          </>
                        )}
                      </tr>
                    ))}
                    
                    {/* Total Row */}
                    <tr className="font-bold h-6">
                      <td colSpan={4} className="text-center border-none">Total</td>
                      <td className="text-center">{fmt(page.summary.totalMileageKm)}</td>
                      <td className="text-center border-none"></td>
                      <td className="text-center">{fmt(page.summary.totalMileageAmount)}</td>
                      <td colSpan={3} className="border-none"></td>
                      <td className="text-center">{fmt(page.summary.grandTotal)}</td>
                      <td className="border-none"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Summary Table & Signature */}
              <div className="w-full flex justify-between mt-1">
                <div className="w-[60%] border border-black">
                  <table className="w-full text-[10px] tbl-main" style={{ border: 'none' }}>
                    <colgroup>
                      <col style={{width: '45%'}} />
                      <col style={{width: '15%'}} />
                      <col style={{width: '20%'}} />
                      <col style={{width: '20%'}} />
                    </colgroup>
                    <thead>
                      <tr className="h-5">
                        <th className="text-center font-bold">Descriptions</th>
                        <th className="text-center font-bold">No</th>
                        <th className="text-center font-bold">Rates</th>
                        <th className="text-center font-bold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-4">
                        <td className="font-bold px-2">Total Days</td>
                        <td className="text-center">{page.summary.totalDays || '-'}</td>
                        <td className="text-center">{page.summary.totalDays ? fmt(daRate) : '-'}</td>
                        <td className="text-center">{totalDaysAmount ? fmt(totalDaysAmount) : '-'}</td>
                      </tr>
                      <tr className="h-4">
                        <td className="font-bold px-2">Total Half Days</td>
                        <td className="text-center">{page.summary.totalHalfDays || '-'}</td>
                        <td className="text-center">{page.summary.totalHalfDays ? fmt(halfDayRate) : '-'}</td>
                        <td className="text-center">{totalHalfDaysAmount ? fmt(totalHalfDaysAmount) : '-'}</td>
                      </tr>
                      <tr className="h-4">
                        <td className="font-bold px-2">Total Nights</td>
                        <td className="text-center">{page.summary.totalNights || '-'}</td>
                        <td className="text-center">{page.summary.totalNights ? fmt(page.summary.totalNightsRate) : '-'}</td>
                        <td className="text-center">{fmt(page.summary.totalNightsAmount) || '-'}</td>
                      </tr>
                      <tr className="h-4">
                        <td className="font-bold px-2">Total Mileage</td>
                        <td className="text-center">{page.summary.totalMileageKm || '-'}</td>
                        <td className="text-center">{page.summary.totalMileageKm ? fmtRate(page.summary.totalMileageRate) : '-'}</td>
                        <td className="text-center">{fmt(page.summary.totalMileageAmount) || '-'}</td>
                      </tr>
                      <tr className="h-5 font-bold">
                        <td className="text-right px-2" colSpan={3}>Grand Total</td>
                        <td className="text-center">{fmt(page.summary.grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="w-[38%] flex items-end justify-end pb-2 pr-4">
                  <div className="text-center">
                    <div className="h-[12mm]"></div>
                    <div className="border-t border-black w-44 pt-1 text-[10px] font-bold">
                      Signature Officer / Official
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 - Certificate & Summary */}
            <div 
              className="page-break bg-white mx-auto relative shadow-lg mt-8 print-page" 
              style={{ width: '297mm', minHeight: '200mm', padding: '8mm 15mm', boxSizing: 'border-box' }}
            >
              <HeaderSection />

              <div className="w-full flex gap-10 mt-3 text-[10px]">
                
                {/* Left Column */}
                <div className="w-1/2 flex flex-col gap-3">
                  <div>
                    <div className="text-center font-bold border-b border-black mb-1">TRAVELLING ALLOWANCE BILL</div>
                    <table className="w-full">
                      <tbody>
                        <tr className="h-6">
                          <td className="w-[55%]">1. TRAVELLING ALLOWANCE (MILEAGE)</td>
                          <td className="w-[12%] text-right">Rs.</td>
                          <td className="w-[33%] border-b border-black text-right pr-2 font-bold">{fmt(page.summary.totalMileageAmount) || '—'}</td>
                        </tr>
                        <tr className="h-6">
                          <td>2. TOTAL DAILY ALLOWANCE</td>
                          <td className="text-right">Rs.</td>
                          <td className="border-b border-black text-right pr-2 font-bold">{fmt(page.summary.totalDaAmount) || '—'}</td>
                        </tr>
                        <tr className="h-6">
                          <td>3. ACTUAL EXPENSES (HOTEL CHARGES)</td>
                          <td className="text-right">Rs.</td>
                          <td className="border-b border-black text-right pr-2 font-bold">{fmt(page.summary.totalHotelAmount) || '—'}</td>
                        </tr>
                        <tr className="h-6">
                          <td>4. OTHER ALLOWANCE</td>
                          <td className="text-right">Rs.</td>
                          <td className="border-b border-black text-right pr-2 font-bold">{fmt(page.summary.totalOtherAmount) || '—'}</td>
                        </tr>
                        <tr className="h-5">
                          <td colSpan={2} className="text-right pr-8 text-[9px] font-bold">GRAND TOTAL</td>
                          <td></td>
                        </tr>
                        <tr className="h-6">
                          <td>5. LESS DEDUCTION (TA ADVANCE)</td>
                          <td className="text-right">Rs.</td>
                          <td className="border-b border-black text-right pr-2 font-bold">{fmt(page.summary.lessDeduction) || '—'}</td>
                        </tr>
                        <tr className="h-6">
                          <td className="pl-4 font-bold">NET AMOUNT PAYABLE</td>
                          <td className="text-right">Rs.</td>
                          <td className="border-b-2 border-black text-right pr-2 font-bold">{fmt(page.summary.grandTotal - (page.summary.lessDeduction || 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Controlling Officer */}
                  <div className="mt-6 text-center">
                    <div className="h-[12mm]"></div>
                    <div className="border-t border-black w-2/3 mx-auto mb-1"></div>
                    <div>Controlling Officer</div>
                  </div>

                  {/* Audit Box */}
                  <div className="mt-3">
                    <div className="text-center border border-black border-b-0 py-0.5 bg-gray-50 text-[9px]">FOR USE IN AUDIT / TREASURY OFFICE</div>
                    <div className="border border-black p-2 flex flex-col gap-1 text-[9px]">
                      <table className="w-full">
                        <tbody>
                          <tr className="h-5">
                            <td className="w-[20%]">Admitted:</td>
                            <td className="border-b border-dotted border-black"></td>
                            <td className="w-[10%] text-right">Rs.</td>
                            <td className="w-[25%] border-b border-black"></td>
                          </tr>
                          <tr className="h-5">
                            <td>Objected:</td>
                            <td className="border-b border-dotted border-black"></td>
                            <td className="text-right">Rs.</td>
                            <td className="border-b border-black"></td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="whitespace-nowrap">Reason of objection:</span>
                        <div className="border-b border-black flex-grow"></div>
                      </div>
                      <div className="border-b border-black w-full h-3"></div>
                      <div className="border-b border-black w-full h-3"></div>

                      <div className="flex justify-between mt-4 px-2">
                        <div className="text-center">
                          <div className="border-t border-black w-20 pt-1 text-[8px]">AUDITOR</div>
                        </div>
                        <div className="text-center">
                          <div className="border-t border-black w-28 pt-1 text-[8px]">ASST: ACCOUNT OFFICER</div>
                        </div>
                      </div>
                      
                      <div className="text-center mt-3 mx-auto w-44">
                        <div className="border-t border-black pt-1 text-[8px]">ASST: ACCOUNTANT GENERAL / ACCOUNTS OFFICER</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="w-1/2 flex flex-col gap-3">
                  <div>
                    <div className="text-center font-bold border-b border-black mb-1">Certificate</div>
                    <div className="flex flex-col gap-1.5 text-[9px] leading-relaxed">
                      <div className="flex gap-1">
                        <span>1.</span>
                        <span>Certified that I actually performed the journey as mentioned in this bill.</span>
                      </div>
                      <div className="flex gap-1">
                        <span>2.</span>
                        <span>Certified that I was not on Casual leave during the journey performed.</span>
                      </div>
                      <div className="flex gap-1">
                        <span>3.</span>
                        <span>Certified that I was not provided with Government vehicle.</span>
                      </div>
                      <div className="flex gap-1">
                        <span>4.</span>
                        <span>Certified that the halts for which daily allowance have been claimed were essential in Public interest.</span>
                      </div>
                      <div className="flex gap-1">
                        <span>5.</span>
                        <span>Certified that I was not provided with Government Residential facility.</span>
                      </div>
                    </div>
                  </div>

                  {/* Employee Signature - Only on right side */}
                  <div className="mt-6 text-center">
                    <div className="h-[12mm]"></div>
                    <div className="border-t border-black w-2/3 mx-auto mb-1"></div>
                    <div>Signature of the Government Servant</div>
                    <div>who travelled</div>
                  </div>

                  {/* DDO Office */}
                  <div className="mt-4">
                    <table className="w-full text-[9px] text-center border border-black">
                      <thead>
                        <tr>
                          <th colSpan={2} className="py-0.5 border-b border-black bg-gray-50">FOR DDO OFFICE</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="h-5 border-b border-black">
                          <td className="w-1/3 border-r border-black px-2">ENTITY CODE</td>
                          <td></td>
                        </tr>
                        <tr className="h-5">
                          <td className="w-1/3 border-r border-black px-2">OBJECT CODE</td>
                          <td className="text-left px-2">A-03805-TRAVELLING ALLOWANCE</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Appropriation */}
                  <div className="mt-4 text-[9px]">
                    <table className="w-full">
                      <tbody>
                        <tr className="h-5">
                          <td className="w-[50%]">APPROPRIATION FOR THE YEAR</td>
                          <td className="border-b border-black"></td>
                        </tr>
                        <tr className="h-5">
                          <td>EXPENDITURE TO DATE</td>
                          <td className="border-b border-black"></td>
                        </tr>
                        <tr className="h-5">
                          <td>BALANCE AVAILABLE:</td>
                          <td className="border-b border-black"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TravelAllowanceBill;