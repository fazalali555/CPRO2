import React from 'react';
import { EmployeeRecord } from '../../types';
import { getBeneficiaryDetails } from '../../utils';
import { format, parseISO } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_________________';
  try { return format(parseISO(dateStr), 'dd/MM/yyyy'); } catch { return '_________________'; }
};

export const LifeCertificate: React.FC<Props> = ({ employee }) => {
  const ben = getBeneficiaryDetails(employee);
  const deathDate = employee.service_history.date_of_death || employee.service_history.date_of_retirement;

  return (
    <div className="bg-white text-black font-sans relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
      
      {/* Life Certificate */}
      <div className="mb-20">
         <div className="text-center mb-8">
            <h1 className="text-xl font-bold uppercase underline">LIFE CERTIFICATE</h1>
         </div>
         <div className="text-lg leading-relaxed text-justify mb-12 font-serif">
            It is to certify that Mr/Mst. <span className="font-bold uppercase">{ben.name}</span> widow of Mr. <span className="font-bold uppercase">{employee.employees.name}</span> 
            who died on <span className="font-bold">{formatDate(deathDate)}</span>, certified that Mr/Mst: <span className="font-bold uppercase">{ben.name}</span> 
            whose specimen signature/thumb impression and address are appended below is alive till date.
         </div>
         <div className="flex justify-between items-end mt-12 px-8">
            <div className="font-bold uppercase mb-12 text-lg">C/Signed By DDO</div>
            <div className="text-center w-96">
               <div className="h-24 border-b-2 border-black mb-4"></div>
               <div className="font-bold text-xl uppercase mb-2">{ben.name}</div>
               <div className="text-lg font-medium mb-2">Widow of {employee.employees.name} {employee.employees.designation}</div>
               <div className="text-lg font-medium uppercase">{employee.employees.school_full_name}</div>
            </div>
         </div>
      </div>

      <div className="border-b-2 border-black w-full mb-20"></div>

      {/* Non Separation */}
      <div>
         <div className="text-center mb-8">
            <h1 className="text-xl font-bold uppercase underline">NON SEPARATION CERTIFICATE</h1>
         </div>
         <div className="text-lg leading-relaxed text-justify mb-12 font-serif">
            I Mst. <span className="font-bold uppercase">{ben.name}</span> widow of Mr. <span className="font-bold uppercase">{employee.employees.name}</span> 
            resident of <span className="font-bold uppercase">{employee.employees.address}</span> do hereby declare that I was not separated from my husband during his life time.
         </div>
         <div className="flex justify-between items-end mt-12 px-8">
            <div className="font-bold uppercase mb-12 text-lg">C/Signed By DDO</div>
            <div className="text-center w-96">
               <div className="h-24 border-b-2 border-black mb-4"></div>
               <div className="font-bold text-xl uppercase mb-2">{ben.name}</div>
               <div className="text-lg font-medium mb-2">Widow of {employee.employees.name} {employee.employees.designation}</div>
               <div className="text-lg font-medium uppercase">{employee.employees.school_full_name}</div>
            </div>
         </div>
      </div>

    </div>
  );
};
