
import React from 'react';
import { EmployeeRecord } from '../../types';

interface Props {
  employee: EmployeeRecord;
}

export const NonMarriageCertificate: React.FC<Props> = ({ employee }) => {
  const ben = employee.extras?.beneficiary || {};

  return (
    <div className="bg-white text-black font-sans relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
      
      {/* Top Half */}
      <div className="mb-24">
         <div className="text-center mb-8">
            <h1 className="text-xl font-bold uppercase underline">NON MARRIAGE CERTIFICATE</h1>
         </div>
         <div className="text-lg leading-relaxed text-justify mb-8 font-serif">
            I Mst. <span className="font-bold uppercase">{ben.name}</span> widow of Mr. <span className="font-bold uppercase">{employee.employees.name}</span> 
            resident of <span className="font-bold uppercase">{employee.employees.address}</span> do hereby declare that I have not remarried as yet also have no intention in future.
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

      <div className="border-b-2 border-black w-full mb-24"></div>

      {/* Bottom Half */}
      <div>
         <div className="text-center mb-8">
            <h1 className="text-xl font-bold uppercase underline">SINGLE WIDOW CERTIFICATE</h1>
         </div>
         <div className="text-lg leading-relaxed text-justify mb-8 font-serif">
            I Mst. <span className="font-bold uppercase">{ben.name}</span> widow of Mr. <span className="font-bold uppercase">{employee.employees.name}</span> 
            resident of <span className="font-bold uppercase">{employee.employees.address}</span> do hereby declare that I am single widow of my husband late <span className="font-bold uppercase">{employee.employees.name}</span>.
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
