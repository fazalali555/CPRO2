
import React from 'react';
import { EmployeeRecord } from '../../types';
import { getCoverLetterInfo } from '../../utils';
import { Letterhead } from '../../components/Letterhead';

interface Props {
  employee: EmployeeRecord;
}

export const FamilyClearance: React.FC<Props> = ({ employee }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);
  
  return (
    <div className="bg-white text-black font-sans relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
      
      <Letterhead employeeRecord={employee} />
      <div className="w-full border-t-4 border-black border-double mb-16"></div>

      <div className="text-center mb-20">
         <h1 className="text-xl font-bold uppercase underline">CLEARANCE CERTIFICATE</h1>
      </div>

      <div className="text-xl leading-loose text-justify mb-24 font-serif">
         <p>
            Certified that nothing is found in the record of this office against Mr. 
            <span className="font-bold uppercase"> {employee.employees.name}</span> 
            <span className="font-bold uppercase"> {employee.employees.designation} {employee.employees.school_full_name}</span> 
            CNIC NO <span className="font-bold">{employee.employees.cnic_no}</span>.
         </p>
      </div>

      <div className="mt-auto flex justify-end pb-24">
         <div className="text-center w-72">
            <p className="font-bold text-sm uppercase whitespace-pre-line">
              {signatureTitle}
            </p>
         </div>
      </div>
    </div>
  );
};
