
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo } from '../../utils';
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

export const RetirementServiceCertificate: React.FC<Props> = ({ employee, caseRecord }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);
  const district = employee.employees.district || "Battagram";
  const tehsil = employee.employees.tehsil || "Allai";
  
  const name = employee.employees.name;
  const designation = employee.employees.designation;
  const bps = employee.employees.bps;
  const school = employee.employees.school_full_name;
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
        <div className="text-center mb-16 px-4">
          <h2 className="text-3xl font-bold uppercase underline underline-offset-4 tracking-wider">
            SERVICE CERTIFICATE
          </h2>
        </div>

        {/* Body Text */}
        <div className="px-4 text-[20px] leading-[2.5rem] text-justify font-serif">
          <p>
            It is certified that <span className="font-bold">Mr./Ms. {name}</span> ({designation}) <span className="font-bold">BPS-{bps}</span>, 
            <span className="font-bold"> {school}</span> {tehsil}, District {district} is serving in 
            the Department of Elementary and Secondary Education, Khyber Pakhtunkhwa since <span className="font-bold underline">{doa}</span> to date without any break.
          </p>
        </div>

        {/* Footer Signature */}
        <div className="mt-auto flex justify-end pb-24 pr-4" style={{ marginTop: '140px' }}>
          <div className="text-center w-72">
            <div className="h-px bg-black w-full mb-2"></div>
            <p className="font-bold text-sm leading-tight uppercase whitespace-pre-line">
              {signatureTitle}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
