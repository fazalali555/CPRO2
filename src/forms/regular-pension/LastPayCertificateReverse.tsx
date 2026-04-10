
import React from 'react';
import { EmployeeRecord } from '../../types';
import { formatCurrency } from '../../utils';

interface Props {
  employee?: EmployeeRecord;
}

export const LastPayCertificateReverse: React.FC<Props> = ({ employee }) => {
  const extras = employee?.extras || {};
  const financials = employee?.financials || {};

  const recoveries = [];
  if (extras.hba_balance > 0) recoveries.push({ name: 'HBA Balance', amount: extras.hba_balance });
  if (extras.gpf_adv_balance > 0) recoveries.push({ name: 'GPF Advance', amount: extras.gpf_adv_balance });
  if (financials.recovery > 0) recoveries.push({ name: 'Govt Dues', amount: financials.recovery });

  return (
    <div className="bg-white text-black font-serif text-sm leading-tight relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm 15mm 15mm 25mm', boxSizing: 'border-box' }}>
      
      <div className="text-center font-bold mb-4">
        <div className="text-xl border-2 border-black rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">9</div>
        <div className="text-xl uppercase underline">LPC REVERSE / DETAIL OF RECOVERIES</div>
      </div>

      {/* Recoveries Section */}
      <div className="mb-10 border border-black p-4 min-h-[150px]">
         <h3 className="font-bold uppercase underline mb-4">1. Outstanding Recoveries</h3>
         {recoveries.length > 0 ? (
            recoveries.map((rec, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-dotted border-gray-400 py-2">
                 <span className="font-bold uppercase">{idx+1}. {rec.name}</span>
                 <span className="font-mono font-bold text-lg">{formatCurrency(rec.amount)}</span>
              </div>
            ))
         ) : (
            <div className="text-center py-8 text-gray-500 font-bold italic">-- NIL --</div>
         )}
      </div>

      {/* Monthly Detail Table */}
      <div className="mb-8">
         <h3 className="font-bold uppercase underline mb-4">2. Detail of Last 12 Months Deduction</h3>
         <div className="border border-black">
            <div className="flex border-b border-black font-bold text-center text-xs bg-gray-100 print:bg-transparent">
               <div className="w-1/4 border-r border-black p-2">Month</div>
               <div className="w-1/4 border-r border-black p-2">Pay Drawn</div>
               <div className="w-1/4 border-r border-black p-2">Income Tax</div>
               <div className="w-1/4 p-2">GPF Ded</div>
            </div>
            
            {[...Array(12)].map((_, i) => (
               <div key={i} className="flex border-b border-black h-8 last:border-b-0">
                  <div className="w-1/4 border-r border-black p-1 text-center"></div>
                  <div className="w-1/4 border-r border-black"></div>
                  <div className="w-1/4 border-r border-black"></div>
                  <div className="w-1/4"></div>
               </div>
            ))}
         </div>
      </div>

      <div className="mt-auto flex justify-end">
         <div className="text-center w-64">
            <div className="border-t border-black mb-1 pt-1"></div>
            <div className="font-bold uppercase text-sm">DDO Signature & Stamp</div>
         </div>
      </div>

    </div>
  );
};
