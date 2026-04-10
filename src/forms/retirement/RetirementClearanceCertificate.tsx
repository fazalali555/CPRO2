import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo } from '../../utils';
import { Letterhead } from '../../components/Letterhead';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const RetirementClearanceCertificate: React.FC<Props> = ({ employee, caseRecord }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);

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
        <div className="w-full border-t-4 border-black border-double mb-8"></div>

        {/* Subject / Title Block */}
        <div className="mb-6 leading-relaxed text-xl">
          <span className="font-bold">Clearance Certificate in R/O: </span>
          <span className="font-bold uppercase">{employee.employees.name}</span>{' '}
          <span className="font-bold uppercase">{employee.employees.designation} (BPS - {employee.employees.bps}) {employee.employees.school_full_name}</span>
        </div>

        {/* Numbered List */}
        <div className="space-y-4 pl-4 text-xl leading-snug">
          
          <div className="flex items-start gap-4">
            <span className="font-medium text-lg pt-1">1.</span>
            <p>Nothing is outstanding against the applicant.</p>
          </div>

          <div className="flex items-start gap-4">
            <span className="font-medium text-lg pt-1">2.</span>
            <p>No departmental/Judicial/Police etc inquiry/proceedings are in the pipeline</p>
          </div>

          <div className="flex items-start gap-4">
            <span className="font-medium text-lg pt-1">3.</span>
            <p>
              PTC/Conditional Grants etc Fund has been utilized properly & no amount to the effect are work is pending on the part of the applicant.
            </p>
          </div>

          <div className="flex items-start gap-4">
            <span className="font-medium text-lg pt-1">4.</span>
            <p>The applicant is eligible for retirement.</p>
          </div>

        </div>

        {/* Footer Signature - Adjustable spacing */}
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