
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

export const RetirementNoDemandCertificate: React.FC<Props> = ({ employee, caseRecord }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);
  const designation = employee.employees.designation;
  const bps = employee.employees.bps;
  const school = employee.employees.school_full_name;
  const name = employee.employees.name;
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
            This is to certify that Mr./Ms. <span className="font-bold uppercase">{name}</span>,{' '}
            <span className="font-bold uppercase">{designation}</span> (BPS -{' '}
            <span className="font-bold">{bps}</span>),{' '}
            <span className="font-bold uppercase">{school}</span>, has been serving in the Education Department
            since <span className="font-bold">{doa}</span> to date.
          </p>
          
          <p>
            It is further certified that he/she has not claimed any financial or other
            benefits/demands with effect from <span className="font-bold">{doa}</span> up to date.
          </p>
        </div>

        {/* Footer / Signature Block */}
        <div className="flex justify-end pb-12" style={{ marginTop: '140px' }}>
          <div className="text-center w-64">
            <div className="h-px bg-gray-400 w-full mb-2"></div>
            <p className="font-bold text-sm leading-tight uppercase whitespace-pre-line">
              {signatureTitle}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
