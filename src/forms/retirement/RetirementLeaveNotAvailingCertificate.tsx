
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo } from '../../utils';
import { Letterhead } from '../../components/Letterhead';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const RetirementLeaveNotAvailingCertificate: React.FC<Props> = ({ employee, caseRecord }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);
  const district = employee.employees.district || "Battagram";
  const name = employee.employees.name;
  const designation = employee.employees.designation;
  const bps = employee.employees.bps;
  const school = employee.employees.school_full_name;

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

        {/* Document Title */}
        <div className="text-center mb-16 px-4">
          <h2 className="text-[22px] font-bold uppercase border-b-2 border-black inline-block pb-1">
            LEAVE NOT AVAILING CERTIFICATE LAST 12 MONTHS
          </h2>
        </div>

        {/* Body Text */}
        <div className="px-8 text-[22px] leading-relaxed text-justify">
          <p>
            Certified that Mr./Ms. <span className="font-bold uppercase">{name}</span> <span className="font-bold uppercase">{designation}</span> (BPS -
            <span className="font-bold"> {bps})</span> <span className="font-bold uppercase">{school}</span>, {district} has not availed any
            kind of leave during the last year.
          </p>
        </div>

        {/* Footer Signature */}
        <div className="mt-auto flex justify-end pb-24 pr-8" style={{ marginTop: '140px' }}>
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
