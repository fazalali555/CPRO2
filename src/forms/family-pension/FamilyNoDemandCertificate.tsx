import React from 'react';
import { EmployeeRecord } from '../../types';
import { getCoverLetterInfo, getBeneficiaryDetails, detectGenderFromSchoolName } from '../../utils';
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

export const FamilyNoDemandCertificate: React.FC<Props> = ({ employee }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);
  const ben = getBeneficiaryDetails(employee);
  const designation = employee.employees.designation;
  const school = employee.employees.school_full_name;
  const name = employee.employees.name;
  const deathDate = formatDate(employee.service_history.date_of_death || employee.service_history.date_of_retirement);
  
  const gender = detectGenderFromSchoolName(school);
  const title = gender === 'F' ? 'Mst.' : 'Mr.';

  return (
    <div 
      className="bg-white text-black font-sans leading-normal relative print-page mx-auto"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '12mm', 
        fontSize: '12pt',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div className="flex flex-col h-full">
        
        {/* --- Header Section --- */}
        <Letterhead employeeRecord={employee} />

        {/* Double Line Separator */}
        <div className="w-full border-t-4 border-black border-double mb-16"></div>

        {/* Title */}
        <div className="flex justify-center mb-16">
          <h1 className="text-xl font-bold uppercase border-b-2 border-black inline-block leading-tight pb-1">
            NO DEMAND CERTIFICATE
          </h1>
        </div>

        {/* Body Content */}
        <div className="text-[17px] leading-9 text-justify space-y-8 px-4">
          <p>
            Certified that nothing is outstanding against {title} 
            <span className="font-bold uppercase"> {name}</span> 
            <span className="font-bold uppercase"> {designation} {school}</span> 
            who died on <span className="font-bold">{deathDate}</span> 
            either on account of any Government Money or property and that if anything is found later on, 
            the same will be the responsibility of the undersigned.
          </p>
        </div>

        <div className="flex justify-center mb-12 mt-12">
          <h1 className="text-xl font-bold uppercase border-b-2 border-black inline-block leading-tight pb-1">
            OPTION FOR COMMUTATION
          </h1>
        </div>
        <div className="text-[17px] leading-9 text-justify px-4">
           I do hereby opt to commute my 25% Pension as admissible under the rules.
        </div>

        {/* Footer / Signature Block */}
        <div className="mt-auto flex justify-between items-end pb-24 px-8">
          <div className="font-bold uppercase mb-12 text-lg">C/Signed By DDO</div>
          
          <div className="text-center w-96">
             {/* Plenty of space for real signature */}
             <div className="h-24 border-b-2 border-black mb-4"></div>
             
             <div className="font-bold text-xl uppercase mb-2">
               {ben.name}
             </div>
             
             <div className="text-lg font-medium mb-2">
               Widow of {name} {designation}
             </div>
             
             <div className="text-lg font-medium uppercase">
               {school}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
