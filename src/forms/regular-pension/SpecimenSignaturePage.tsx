
import React from 'react';
import { EmployeeRecord } from '../../types';

interface Props {
  employee: EmployeeRecord;
}

export const SpecimenSignaturePage: React.FC<Props> = ({ employee }) => {
  return (
    <div className="bg-white text-black font-serif text-[11pt] leading-normal relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm 15mm 15mm 25mm', boxSizing: 'border-box' }}>
      
      <div className="text-center font-bold mb-8">
        <div className="text-xl border-2 border-black rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">6</div>
      </div>

      {/* --- UNDERTAKING SECTION --- */}
      <div className="mb-12">
         <div className="text-center font-bold text-lg uppercase underline mb-4">
            UNDERTAKING FOR REFUND
         </div>
         <div className="text-justify leading-loose px-2 mb-8">
            Should the amount of pension or Gratuity granted to me be found afterwards to be in excess of that to which I am entitled under rules, I hereby undertake to refund such excess.
         </div>
         <div className="flex justify-end pr-8">
            <div className="text-center w-64">
               <div className="border-b border-black mb-1"></div>
               <div className="font-bold text-xs uppercase">Signature of Applicant</div>
            </div>
         </div>
      </div>

      <div className="w-full border-t-4 border-double border-black mb-10"></div>

      {/* --- SPECIMEN SIGNATURE SECTION --- */}
      <div className="mb-12">
         <div className="text-center font-bold text-lg uppercase underline mb-6">
            SPECIMEN SIGNATURES
         </div>
         <div className="text-center mb-6">
            Name: <span className="font-bold uppercase text-lg border-b border-black px-4">{employee.employees.name}</span>
         </div>

         <div className="grid grid-cols-2 gap-12 px-4">
            <div className="space-y-10 pt-4">
               <div className="flex items-end">
                  <span className="w-8 font-bold">1.</span>
                  <div className="border-b border-black flex-grow"></div>
               </div>
               <div className="flex items-end">
                  <span className="w-8 font-bold">2.</span>
                  <div className="border-b border-black flex-grow"></div>
               </div>
               <div className="flex items-end">
                  <span className="w-8 font-bold">3.</span>
                  <div className="border-b border-black flex-grow"></div>
               </div>
            </div>
            
            <div className="flex flex-col justify-end items-center">
               <div className="w-48 h-24 border-2 border-black flex items-center justify-center text-gray-300 mb-2">
                  Stamp
               </div>
               <div className="font-bold text-xs uppercase text-center border-t border-black w-full pt-1">
                  Attested by Head of Office
               </div>
            </div>
         </div>
      </div>

      <div className="w-full border-t-4 border-double border-black mb-10"></div>

      {/* --- THUMB IMPRESSION SECTION --- */}
      <div>
         <div className="text-center font-bold text-lg uppercase underline mb-6">
            THUMB & FINGER IMPRESSIONS
         </div>

         <div className="border-2 border-black">
            <div className="flex border-b border-black font-bold text-center text-xs bg-gray-100 print:bg-transparent">
               <div className="w-1/5 border-r border-black p-2">Thumb</div>
               <div className="w-1/5 border-r border-black p-2">Index</div>
               <div className="w-1/5 border-r border-black p-2">Middle</div>
               <div className="w-1/5 border-r border-black p-2">Ring</div>
               <div className="w-1/5 p-2">Little</div>
            </div>
            <div className="flex h-28">
               <div className="w-1/5 border-r border-black"></div>
               <div className="w-1/5 border-r border-black"></div>
               <div className="w-1/5 border-r border-black"></div>
               <div className="w-1/5 border-r border-black"></div>
               <div className="w-1/5"></div>
            </div>
         </div>
         <div className="text-right mt-1 text-xs font-bold uppercase">(Left Hand for Men / Right Hand for Women)</div>
      </div>

      {/* --- FOOTER --- */}
      <div className="mt-auto pt-8">
         <div className="flex justify-between items-end">
            <div className="text-center w-64">
               <div className="border-t border-black mb-1 pt-1"></div>
               <div className="font-bold text-xs uppercase">Signature of Applicant</div>
            </div>
            <div className="text-center w-64">
               <div className="border-t border-black mb-1 pt-1"></div>
               <div className="font-bold text-xs uppercase">Attested By</div>
            </div>
         </div>
      </div>

    </div>
  );
};
