import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { formatDate, getCoverLetterInfo } from '../../utils';
import { Letterhead } from '../../components/Letterhead';

interface Props {
  employee: EmployeeRecord;
  caseRecord?: CaseRecord;
}

export const BankAccountLetter: React.FC<Props> = ({ employee }) => {
  const ben = employee.extras?.beneficiary || {};
  const today = new Date();
  const { signatureTitle } = getCoverLetterInfo(employee);
  
  return (
    <div className="bg-white text-black font-sans relative print-page mx-auto flex flex-col"
      style={{ width: '210mm', height: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
      
      <Letterhead employeeRecord={employee} />

      <div className="flex justify-between mb-8 font-bold text-lg">
        <div>No: ________________________</div>
        <div>Dated: {formatDate(today.toISOString())}</div>
      </div>

      <div className="mb-8 font-bold text-lg">
        <div className="mb-1">To,</div>
        <div className="pl-12 leading-snug">
          The Manager,<br/>
          {ben.bank_name || '________________________'},<br/>
          {ben.branch_name || '________________________'} Branch.
        </div>
      </div>

      <div className="flex mb-8 text-lg">
        <span className="font-bold w-24 flex-shrink-0">Subject:</span>
        <span className="font-bold underline decoration-1 underline-offset-4 uppercase">
          OPENING OF BANK ACCOUNT FOR PENSION PURPOSE IN R/O MST/MR. {ben.name}
        </span>
      </div>

      <div className="mb-6 font-bold text-lg">Dear Sir,</div>

      <div className="mb-6 text-justify leading-loose text-lg">
        <p>
          It is stated that Mr./Ms. <span className="font-bold uppercase">{employee.employees.name}</span>, 
          Ex-<span className="font-bold uppercase">{employee.employees.designation}</span>, 
          <span className="font-bold uppercase"> {employee.employees.school_full_name}</span> died on 
          <span className="font-bold"> {formatDate(employee.service_history.date_of_death || employee.service_history.date_of_retirement)}</span>.
        </p>
        <p className="mt-4">
          Mst./Mr. <span className="font-bold uppercase">{ben.name}</span> ({ben.relation}), 
          CNIC No. <span className="font-bold font-mono">{ben.cnic}</span> is the legal heir/beneficiary 
          entitled for Family Pension.
        </p>
        <p className="mt-4">
          You are requested to kindly open a Bank Account in the name of the above mentioned legal heir 
          for the purpose of Direct Credit System (DCS) of Pension/Gratuity.
        </p>
        <p className="mt-4">
          Your cooperation in this regard will be highly appreciated.
        </p>
      </div>

      {/* Footer Signature */}
      <div className="mt-auto flex justify-end">
        <div className="text-center w-80">
           <div className="h-24"></div>
           <div className="border-t border-black pt-2 font-bold whitespace-pre-wrap">
              {signatureTitle}
           </div>
        </div>
      </div>

    </div>
  );
};
