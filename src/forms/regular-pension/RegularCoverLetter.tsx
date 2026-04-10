
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { Letterhead } from '../../components/Letterhead';
import { getCoverLetterInfo, getDEORecipientTitle } from '../../utils';
import { format, parseISO } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const RegularCoverLetter: React.FC<Props> = ({ employee, caseRecord }) => {
  const { signatureTitle } = getCoverLetterInfo(employee);
  const recipientLine = getDEORecipientTitle(employee);
  
  const refNo = caseRecord.extras?.ref_no || '';
  let year = new Date().getFullYear().toString();
  if (caseRecord.extras?.letter_date) {
    try { year = format(parseISO(caseRecord.extras.letter_date), 'yyyy'); } catch {}
  }

  return (
    <div className="bg-white text-black font-serif leading-relaxed relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm 15mm 15mm 25mm', boxSizing: 'border-box' }}>
      <div className="flex flex-col h-full">
        <Letterhead employeeRecord={employee} />
        <div className="w-full border-b-[3px] border-black border-double mt-2 mb-8"></div>

        <div className="flex justify-between items-end mb-10 text-[11pt]">
          <div className="flex items-end">
            <span className="font-bold">No.</span>
            <div className="w-48 border-b border-black mx-2 text-center font-bold">{refNo}</div>
          </div>
          <div className="flex items-end">
            <span className="font-bold">Dated:</span>
            <div className="w-12 border-b border-black mx-1 text-center"></div>
            <span>/</span>
            <div className="w-12 border-b border-black mx-1 text-center"></div>
            <span>/{year}</span>
          </div>
        </div>

        <div className="mb-10 text-[12pt]">
          <div className="font-bold mb-1">To,</div>
          <div className="pl-12 font-bold leading-snug">
            {recipientLine.replace(/, District.*$/, '')},<br/>
            District {employee.employees.district}.
          </div>
        </div>

        <div className="flex mb-8 text-[12pt]">
          <span className="font-bold w-24 flex-shrink-0">Subject:</span>
          <span className="font-bold uppercase underline decoration-1 underline-offset-4 leading-snug text-justify">
            PENSION PAPERS IN FAVOR OF MR./MS. {employee.employees.name} {employee.employees.designation} ({employee.employees.school_full_name})
          </span>
        </div>

        <div className="mb-6 font-bold text-[12pt]">Respected Sir,</div>

        <div className="mb-6 text-justify leading-[2] text-[12pt]">
          <p>
            Enclosed please find herewith the Pension Papers in triplicate, along with original Service Book and other relevant documents in favor of 
            <span className="font-bold uppercase"> Mr./Ms. {employee.employees.name}</span>, 
            <span className="font-bold uppercase"> {employee.employees.designation} (BPS-{employee.employees.bps})</span>, 
            <span className="font-bold uppercase"> {employee.employees.school_full_name}</span>.
          </p>
          <p className="mt-4">
            The official has retired from government service on <span className="font-bold">{employee.service_history.date_of_retirement ? format(parseISO(employee.service_history.date_of_retirement), 'dd-MM-yyyy') : '__________'}</span>. 
            The case is submitted for verification and countersignature, and subsequent transmission to the District Accounts Office for the issuance of Pension Payment Order (PPO).
          </p>
        </div>

        <div className="mt-auto flex justify-end pt-16">
          <div className="text-center w-72">
            <div className="h-10"></div>
            <div className="h-px bg-black w-full mb-2"></div>
            <p className="font-bold text-[11pt] leading-tight uppercase whitespace-pre-line">
              {signatureTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
