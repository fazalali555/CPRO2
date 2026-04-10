
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo, calculateServiceDuration } from '../../utils';
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

export const RetirementQualifyingServiceCertificate: React.FC<Props> = ({ employee, caseRecord }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);
  const district = employee.employees.district || "Battagram";
  const tehsil = employee.employees.tehsil || "Allai";
  
  const name = employee.employees.name;
  const designation = employee.employees.designation;
  const bps = employee.employees.bps;
  const school = employee.employees.school_full_name;
  const dor = formatDate(employee.service_history.date_of_retirement);
  
  const service = calculateServiceDuration(
    employee.service_history.date_of_appointment,
    employee.service_history.date_of_retirement,
    employee.service_history.lwp_days
  );

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
            QUALIFYING SERVICE CERTIFICATE
          </h2>
        </div>

        {/* Body Text */}
        <div className="px-8 text-[20px] leading-relaxed text-center font-sans space-y-8">
          <p className="text-justify indent-12">
            Certified that Mr./Ms. <span className="font-bold uppercase">{name}</span> <span className="font-bold uppercase">{designation}</span> (BPS -
            <span className="font-bold"> {bps})</span> <span className="font-bold uppercase">{school}</span>, {tehsil}, {district} will retire from
            service on <span className="font-bold">{dor}</span>.
          </p>

          <p className="pt-2">
            Following his/her qualifying service details.
          </p>

          <div className="font-bold pt-4 text-[22px]">
            <span className="inline-block border-b-2 border-black px-4 min-w-[60px] text-center">{service.years}</span> Years, <span className="inline-block border-b-2 border-black px-4 min-w-[60px] text-center">{service.months}</span> Months and <span className="inline-block border-b-2 border-black px-4 min-w-[60px] text-center">{service.days}</span> Days
          </div>
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
