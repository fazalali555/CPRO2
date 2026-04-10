
import React from 'react';
import { EmployeeRecord } from '../../types';
import { getCoverLetterInfo } from '../../utils';
import { format, parseISO } from 'date-fns';
import { Letterhead } from '../../components/Letterhead';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try {
    return format(parseISO(dateStr), 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
};

export const FamilyNonInvolvement: React.FC<Props> = ({ employee }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);
  
  return (
    <div className="bg-white text-black font-sans relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '12mm', boxSizing: 'border-box' }}>
      
      {/* Header */}
      <Letterhead employeeRecord={employee} />
      
      <div className="w-full border-t-4 border-black border-double mb-16"></div>

      <div className="text-center mb-16">
         <h1 className="text-xl font-bold uppercase underline">NON INVOLVEMENT CERTIFICATE</h1>
      </div>

      <div className="text-xl leading-loose text-justify mb-8 font-serif px-4">
         <p>
            Certified that Mr. <span className="font-bold uppercase">{employee.employees.name}</span> 
            <span className="font-bold uppercase"> {employee.employees.designation} {employee.employees.school_full_name}</span> 
            has been serving in Education Department since <span className="font-bold">{formatDate(employee.service_history.date_of_appointment)}</span> 
            to <span className="font-bold">{formatDate(employee.service_history.date_of_retirement)}</span> without any break.
         </p>
         <p className="mt-8">
            Certified that he is neither involved in any departmental/judicial/anti-corruption and police cases and there is nothing adverse against him as per record of this office.
         </p>
      </div>

      <div className="mt-auto flex justify-end pb-24 px-4">
         <div className="text-center w-72">
            <div className="border-t border-black mb-2 w-full"></div>
            <p className="font-bold text-sm uppercase whitespace-pre-line">
              {signatureTitle}
            </p>
         </div>
      </div>
    </div>
  );
};
