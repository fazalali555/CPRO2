
import React from 'react';
import { EmployeeRecord } from '../../types';
import { format, parseISO } from 'date-fns';
import { getBeneficiaryDetails } from '../../utils';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try { return format(parseISO(dateStr), 'dd/MM/yyyy'); } catch { return dateStr; }
};

export const DescriptiveRoll: React.FC<Props> = ({ employee }) => {
  const ben = getBeneficiaryDetails(employee);

  return (
    <div className="bg-white text-black font-sans print-page fit-page mx-auto" 
      style={{ width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      <h1 className="text-center text-lg font-bold uppercase underline mb-4 leading-tight">Descriptive Roll</h1>

      <div className="space-y-3 text-base">
        <div className="flex items-end">
          <span className="w-64 font-bold">Name of Applicant:</span>
          <div className="flex-grow border-b border-black font-bold uppercase px-2">{ben.name}</div>
        </div>

        <div className="flex items-end">
          <span className="w-64 font-bold">Father/Husband Name:</span>
          <div className="flex-grow border-b border-black font-bold uppercase px-2">{employee.employees.name}</div>
        </div>

        <div className="flex items-end">
          <span className="w-64 font-bold">CNIC No:</span>
          <div className="flex-grow border-b border-black font-mono font-bold px-2">{ben.cnic}</div>
        </div>

        <div className="flex items-end">
          <span className="w-64 font-bold">Date of Birth:</span>
          <div className="flex-grow border-b border-black font-bold px-2">{formatDate(ben.dob)}</div>
        </div>

        <div className="flex items-end">
          <span className="w-64 font-bold">Visible Mark of Identification:</span>
          <div className="flex-grow border-b border-black px-2">{ben.id_mark || 'Nil'}</div>
        </div>

        <div className="flex items-end">
          <span className="w-64 font-bold">Contact No:</span>
          <div className="flex-grow border-b border-black px-2">{ben.contact}</div>
        </div>

        <div className="flex items-start mt-2">
          <span className="w-64 font-bold shrink-0">Permanent Address:</span>
          <div className="flex-grow border-b border-black px-2 h-14 leading-relaxed uppercase">
             {employee.employees.address}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="font-bold uppercase text-center mb-2 leading-tight">Specimen Signature / Thumb Impression</h2>
        <table className="w-full border border-black h-40">
          <thead>
            <tr>
              <th className="border border-black w-1/5">Thumb</th>
              <th className="border border-black w-1/5">Index Finger</th>
              <th className="border border-black w-1/5">Middle Finger</th>
              <th className="border border-black w-1/5">Ring Finger</th>
              <th className="border border-black w-1/5">Little Finger</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black"></td>
              <td className="border border-black"></td>
              <td className="border border-black"></td>
              <td className="border border-black"></td>
              <td className="border border-black"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-6">
         <div className="w-28 h-36 border border-black flex items-center justify-center text-gray-400">
            Paste Photo 1
         </div>
         <div className="w-28 h-36 border border-black flex items-center justify-center text-gray-400">
            Paste Photo 2
         </div>
         <div className="w-28 h-36 border border-black flex items-center justify-center text-gray-400">
            Paste Photo 3
         </div>
      </div>

      <div className="mt-auto text-right pt-6" style={{ pageBreakInside: 'avoid' }}>
         <div className="inline-block text-center">
            <div className="h-[12mm]"></div>
            <div className="w-64 border-t border-black mb-1"></div>
            <div className="font-bold">Attested By Class-I Officer</div>
            <div className="text-xs">(Seal & Signature)</div>
         </div>
      </div>

    </div>
  );
};
