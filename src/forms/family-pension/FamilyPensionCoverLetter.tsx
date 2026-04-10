import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getSalutationFromSchoolName, getCoverLetterInfo, getDEORecipientTitle, getBeneficiaryDetails } from '../../utils';
import { Letterhead } from '../../components/Letterhead';
import { format, parseISO } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const FamilyPensionCoverLetter: React.FC<Props> = ({ employee, caseRecord }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);
  const recipientLine = getDEORecipientTitle(employee);
  const ben = getBeneficiaryDetails(employee);
  const benName = ben.name || '________________';
  const designation = employee.employees.designation;
  const school = employee.employees.school_full_name;
  
  const refNo = caseRecord.extras?.ref_no || '';
  // Extract year
  let year = new Date().getFullYear().toString();
  if (caseRecord.extras?.letter_date) {
    try {
      year = format(parseISO(caseRecord.extras.letter_date), 'yyyy');
    } catch {}
  }

  return (
    <div className="bg-white text-black font-sans leading-relaxed relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '12mm', boxSizing: 'border-box' }}>
      <div className="flex flex-col h-full">
        <Letterhead employeeRecord={employee} />
        <div className="w-full border-t-4 border-black border-double mt-1 mb-8"></div>

        <div className="flex justify-between items-end mb-8 font-medium">
          <div className="flex items-end">
            <span>No.</span>
            <div className="w-40 border-b border-black mx-2 text-center font-bold">{refNo}</div>
            <span>/</span>
          </div>
          <div className="flex items-end">
            <span>Dated:</span>
            <div className="w-12 border-b border-black mx-2 text-center"></div>
            <span>/</span>
            <div className="w-12 border-b border-black mx-2 text-center"></div>
            <span>/{year}</span>
          </div>
        </div>

        <div className="mb-8 font-bold">
          <div className="mb-1">To</div>
          <div className="pl-12 leading-snug">
            {recipientLine.replace(/, District.*$/, '')},<br/>
            District {employee.employees.district || 'Battagram'}.
          </div>
        </div>

        <div className="flex mb-8">
          <span className="font-bold w-24 flex-shrink-0">Subject:</span>
          <span className="font-bold underline decoration-1 underline-offset-4">
            Family Pension Papers In R/O {benName} Widow of {employee.employees.name} {designation}
          </span>
        </div>

        <div className="mb-6 font-bold">Respected Sir,</div>

        <div className="mb-6 text-justify leading-loose">
          <p>
            Enclosed please find here with a Pension Papers in triplicate in R/O 
            <span className="font-bold uppercase"> {benName}</span> Widow 
            <span className="font-bold uppercase"> {employee.employees.name} {designation} {school}</span> is hereby 
            submitted to your office for necessary action please.
          </p>
        </div>

        <div className="mt-auto flex justify-end pt-16">
          <div className="text-center w-64">
            <div className="h-10"></div>
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
