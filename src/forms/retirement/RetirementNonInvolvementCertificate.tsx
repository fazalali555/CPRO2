
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { detectGenderFromSchoolName } from '../../utils';
import { format, parseISO } from 'date-fns';
import { Letterhead } from '../../components/Letterhead';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try {
    return format(parseISO(dateStr), 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
};

export const RetirementNonInvolvementCertificate: React.FC<Props> = ({ employee, caseRecord }) => {
  const tehsil = employee.employees.tehsil || "Allai";
  const gender = detectGenderFromSchoolName(employee.employees.school_full_name);
  const genderSuffix = gender === 'F' ? '(F)' : '(M)';
  
  const designation = employee.employees.designation;
  const school = employee.employees.school_full_name;
  const name = employee.employees.name;
  const fatherName = employee.employees.father_name;
  const doa = formatDate(employee.service_history.date_of_appointment);

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
        <div className="w-full border-t-4 border-black border-double mb-12"></div>

        {/* Document Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold uppercase border-b-4 border-double border-black inline-block pb-1">
            NON-INVOLVEMENT CERTIFICATE
          </h2>
        </div>

        {/* Body Text */}
        <div className="px-2 text-[20px] leading-relaxed space-y-8 text-justify font-sans">
          <p>
            Certified that Mr./Ms. <span className="font-bold uppercase">{name}</span> S/D/O{' '}
            <span className="font-bold uppercase">{fatherName}</span>, Post: <span className="font-bold uppercase">{designation}</span>,{' '}
            <span className="font-bold uppercase">{school}</span>, has been serving in the Education
            Department since <span className="font-bold">{doa}</span> to date without
            any break.
          </p>

          <p>
            It is further certified that the above-mentioned <span className="font-bold uppercase">{designation}</span> is not
            involved in any Departmental, Judicial, or Anti-Corruption cases.
          </p>
        </div>

        {/* Footer Signatures */}
        <div className="flex justify-between mt-auto px-4 text-lg font-bold pb-20" style={{ marginTop: '140px' }}>
          <div className="text-center leading-tight">
            <div className="h-px bg-gray-400 w-40 mx-auto mb-2"></div>
            ASDEO {genderSuffix}<br />
            {tehsil}
          </div>
          <div className="text-center leading-tight">
            <div className="h-px bg-gray-400 w-40 mx-auto mb-2"></div>
            SDEO {genderSuffix}<br />
            {tehsil}
          </div>
        </div>

      </div>
    </div>
  );
};
