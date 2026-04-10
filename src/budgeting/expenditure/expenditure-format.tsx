import React from 'react';

export interface ExpenditureRowData {
  head: string;
  budget: number | string;
  expMonth: number | string;
  prevExp: number | string;
  totalExp: number | string;
  balance: number | string;
  excess: number | string;
  isYellow?: boolean;
  isBold?: boolean;
}

export interface MonthlyExpenditureStatementProps {
  officeName: string;
  monthTitle: string;
  ddoCode: string;
  fiscalYearLabel: string;
  rows: ExpenditureRowData[];
  editable?: boolean;
  onRowChange?: (head: string, patch: Partial<ExpenditureRowData>) => void;
}

const formatNumber = (value: number | string) => {
  if (value === '' || value === null || value === undefined) return '';
  if (typeof value === 'string') {
    const num = Number(value.replace(/,/g, ''));
    if (isNaN(num)) return value;
    return num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
  }
  return value.toLocaleString('en-PK', { maximumFractionDigits: 0 });
};

export const MonthlyExpenditureStatement: React.FC<MonthlyExpenditureStatementProps> = ({
  officeName,
  monthTitle,
  ddoCode,
  fiscalYearLabel,
  rows,
  editable = false,
  onRowChange
}) => {
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap');
    
    @media print {
      @page { size: A4 portrait; margin: 4mm; }
      
      html, body {
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .print-wrapper {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: auto !important;
      }
      
      .print-page {
        box-shadow: none !important;
        margin: 0 !important;
        width: 100% !important;
        height: auto !important;
      }
      
      th, td { padding: 1px 2px; font-size: 7.6px; }
      table, tr, td, th, .no-page-break { page-break-inside: avoid; }
      
      .bg-header-gray { background-color: #BFBFBF !important; }
      .bg-highlight-yellow { background-color: #FFFF00 !important; }
    }
    
    .font-arial { font-family: 'Arimo', Arial, sans-serif; }
    
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid black; padding: 2px 4px; font-size: 10px; }
    .no-page-break { page-break-inside: avoid; }
    .page-frame { height: 287mm; display: flex; flex-direction: column; }
    .page-body { flex: 1 1 auto; }
    
    .text-red-custom { color: #D00000; }
    .bg-header-gray { background-color: #BFBFBF; }
    .bg-highlight-yellow { background-color: #FFFF00; }
  `;

  const toNumber = (value: number | string) => {
    if (value === '' || value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const num = Number(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const visibleRows = rows.filter(row => {
    const values = [row.budget, row.expMonth, row.prevExp, row.totalExp, row.balance, row.excess];
    return values.some(v => toNumber(v) !== 0);
  });

  const handleEdit = (head: string, field: 'expMonth' | 'prevExp', value: string) => {
    if (!onRowChange) return;
    const num = Number(value);
    onRowChange(head, { [field]: isNaN(num) ? 0 : num });
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8 text-black font-arial print-wrapper">
      <style>{styles}</style>

      <div 
        className="bg-white mx-auto shadow-lg page-frame print-page" 
        style={{ width: '210mm', padding: '4mm 4mm 5mm 4mm', boxSizing: 'border-box' }}
      >
        <div className="text-center mb-1">
          <h1 className="font-bold text-[14px] uppercase leading-tight">
            OFFICE OF THE {officeName || 'MINISTRY NAME'}
          </h1>
          <h2 className="font-bold text-[14px] uppercase leading-tight">
            MONTHLY EXPENDITURE STATEMENT FOR THE MONTH OF {monthTitle || 'MONTH YEAR'}
          </h2>
          <h3 className="font-bold text-[16px] uppercase mt-0.5">
            DDO CODE {ddoCode || 'CODE'}
          </h3>
        </div>

        <div className="page-body">
          <div className="w-full">
            <table>
              <colgroup>
                <col style={{ width: '35%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
              </colgroup>
              <thead>
                <tr className="bg-header-gray text-center h-[12mm]">
                  <th className="align-middle">Heads</th>
                  <th className="align-middle">
                    Budget<br />Estimate<br />{fiscalYearLabel || '2025-26'}
                  </th>
                  <th className="align-middle">Expend;<br />this month</th>
                  <th className="align-middle">Previous<br />Expenditure</th>
                  <th className="align-middle">Total<br />Expenditure</th>
                  <th className="align-middle">Balance</th>
                  <th className="align-middle">Excess</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, index) => {
                  const rowClass = `${row.isYellow ? 'bg-highlight-yellow' : ''} ${row.isBold ? 'font-bold' : ''}`;
                  
                  return (
                    <tr key={index} className={rowClass}>
                      <td className="text-left text-black">{row.head}</td>
                      <td className={`text-center ${row.isYellow || row.head === 'Total Allowances' ? 'text-red-custom' : 'text-black'}`}>
                        {row.isYellow ? (
                          <span className="text-red-custom">{formatNumber(row.budget)}</span>
                        ) : (
                          formatNumber(row.budget)
                        )}
                      </td>
                      <td className="text-center">
                        {editable ? (
                          <input
                            type="number"
                            className="w-full text-center bg-transparent outline-none"
                            value={String(toNumber(row.expMonth))}
                            onChange={e => handleEdit(row.head, 'expMonth', e.target.value)}
                          />
                        ) : (
                          row.isYellow ? (
                            <span className="text-red-custom">{formatNumber(row.expMonth)}</span>
                          ) : (
                            formatNumber(row.expMonth)
                          )
                        )}
                      </td>
                      <td className="text-center">
                        {editable ? (
                          <input
                            type="number"
                            className="w-full text-center bg-transparent outline-none"
                            value={String(toNumber(row.prevExp))}
                            onChange={e => handleEdit(row.head, 'prevExp', e.target.value)}
                          />
                        ) : (
                          row.isYellow ? (
                            <span className="text-red-custom">{formatNumber(row.prevExp)}</span>
                          ) : (
                            formatNumber(row.prevExp)
                          )
                        )}
                      </td>
                      <td className="text-center font-bold text-red-custom">
                        {formatNumber(row.totalExp)}
                      </td>
                      <td className="text-center font-bold text-red-custom">
                        {formatNumber(row.balance)}
                      </td>
                      <td className="text-center font-bold text-red-custom">
                        {formatNumber(row.excess)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-[9px] leading-snug text-justify no-page-break">
            <span className="font-bold underline">CERTIFICATE;</span>- It is certified that there are{' '}
            <span className="border-b border-black w-16 inline-block"></span> teachers/clerks/C/IV servants 
            are working in my control and{' '}
            <span className="border-b border-black w-16 inline-block"></span> posts are lying vacant. 
            No ghost employee working in my control. Detail of each employee receiving salary is annex herewith. 
            The figures shown above are correct and the payroll register provided through Gmail by the 
            District Accounts Officer Battagram have thoroughly been checked/examined and the data of all 
            the employees are correct and they are actually working in this organization.
          </div>
        </div>

        {/* Signatures - proper spacing using marginTop */}
        <div 
          className="flex justify-between items-end text-[9px] font-bold no-page-break"
          style={{ marginTop: 'auto', paddingTop: '36mm' }}
        >
          <div>
            <span>Prepared By:</span>
            <div className="border-b border-black w-32 inline-block ml-1"></div>
          </div>
          <div className="text-center">
            <span>DDO</span>
            <div className="border-b border-black w-32 inline-block ml-1"></div>
          </div>
          <div>
            <span>ACCOUNT OFFICER</span>
            <div className="border-b border-black w-32 inline-block ml-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyExpenditureStatement;