
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo } from '../../utils';

interface Props {
  employeeRecord: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const GPFClaimVerificationProforma: React.FC<Props> = ({ employeeRecord, caseRecord }) => {
  const { employees } = employeeRecord;
  
  // Data Binding
  const ddoCode = employees.ddo_code || caseRecord.extras?.ddo_code || '________';
  const { headerTitle } = getCoverLetterInfo(employeeRecord);
  // Simplify description (remove 'OFFICE OF THE')
  const description = headerTitle.replace(/OFFICE OF THE\s+/i, '').replace(/\n/g, ' ').trim();
  
  const personalNo = employees.personal_no || '________';
  const name = employees.name.toUpperCase();
  const gpfAccount = employees.gpf_account_no || '________';
  
  // New Bank Logic: Use explicit fields, fall back to legacy 'bank_branch' if missing
  const bankName = employees.bank_name || employees.bank_branch?.split(' ')?.[0] || '________'; 
  const branchName = employees.branch_name || employees.bank_branch || '________';
  const branchCode = employees.branch_code || ''; 
  const bankAccount = employees.bank_ac_no || '________';

  return (
    <div className="bg-white flex justify-center items-center font-sans text-black print-page mx-auto"
      style={{ 
        width: '297mm', // Landscape A4
        height: '210mm',
        padding: '10mm', 
        boxSizing: 'border-box',
        overflow: 'hidden' // Strict single page
      }}
    >
      {/* Main Container - Bordered */}
      <div className="w-full h-full border-[3px] border-black p-4 box-border relative flex flex-col justify-between">
        
        {/* Header */}
        <div className="text-center border-b border-black pb-2 mb-4">
          <h1 className="text-2xl font-normal text-black uppercase tracking-wide">
            General Provident Fund Claim Verification Proforma (GCVP)
          </h1>
        </div>

        {/* Content Area - Compacted Gaps */}
        <div className="flex-grow flex flex-col gap-5 text-[16px] px-4">
          
          {/* Row 1: Cost Centre & Description */}
          <div className="flex w-full">
            <div className="flex w-[40%] items-end">
              <span className="whitespace-nowrap mr-4 w-32 shrink-0">Cost Centre</span>
              <div className="flex-grow border-b border-black text-center font-bold pb-1 uppercase">
                {ddoCode}
              </div>
            </div>
            <div className="flex w-[60%] items-end pl-8">
              <span className="whitespace-nowrap mr-4 w-24 shrink-0">Description</span>
              <div className="flex-grow border-b border-black text-center font-bold pb-1 uppercase truncate">
                {description}
              </div>
            </div>
          </div>

          {/* Row 2: Personal Number & Name */}
          <div className="flex w-full">
            <div className="flex w-[40%] items-end">
              <span className="whitespace-nowrap mr-4 w-32 shrink-0">Personal Number</span>
              <div className="flex-grow border-b border-black text-center font-bold pb-1">
                {personalNo}
              </div>
            </div>
            <div className="flex w-[60%] items-end pl-8">
              <span className="whitespace-nowrap mr-4 w-24 shrink-0">Name</span>
              <div className="flex-grow border-b border-black text-center font-bold pb-1 uppercase">
                {name}
              </div>
            </div>
          </div>

          {/* Row 3: GPF Account No */}
          <div className="flex w-full items-end">
            <span className="whitespace-nowrap mr-4 w-32 shrink-0">GPF Account No</span>
            <div className="flex-grow border-b border-black text-center font-bold pb-1 uppercase">
              {gpfAccount}
            </div>
          </div>

          {/* Row 4: Bank Code & Bank Name */}
          <div className="flex w-full">
            <div className="flex w-[40%] items-end">
              <span className="whitespace-nowrap mr-4 w-32 shrink-0">Bank Code</span>
              <div className="flex-grow border-b border-black text-center font-bold pb-1 min-h-[30px]">
                {/* Bank Code usually not in employee record, left blank unless we add it explicitly later */}
              </div>
            </div>
            <div className="flex w-[60%] items-end pl-8">
              <span className="whitespace-nowrap mr-4 w-24 shrink-0">Bank Name</span>
              <div className="flex-grow border-b border-black text-center font-bold pb-1 uppercase">
                {bankName}
              </div>
            </div>
          </div>

          {/* Row 5: Branch Code & Branch Name */}
          <div className="flex w-full">
            <div className="flex w-[40%] items-end">
              <span className="whitespace-nowrap mr-4 w-32 shrink-0">Branch Code</span>
              <div className="flex-grow border-b border-black text-center font-bold pb-1 min-h-[30px]">
                 {branchCode}
              </div>
            </div>
            <div className="flex w-[60%] items-end pl-8">
              <span className="whitespace-nowrap mr-4 w-24 shrink-0">Branch Name</span>
              <div className="flex-grow border-b border-black text-center font-bold pb-1 uppercase">
                {branchName}
              </div>
            </div>
          </div>

          {/* Row 6: Bank Account No */}
          <div className="flex w-full items-end">
            <span className="whitespace-nowrap mr-4 w-32 shrink-0">Bank Account No</span>
            <div className="flex-grow border-b border-black text-center font-bold pb-1">
              {bankAccount}
            </div>
          </div>

          {/* Row 7: Serial Number & Verification */}
          <div className="flex w-full items-end mt-2">
            <span className="whitespace-nowrap mr-4">Serial Number of Fund Payment Control Register</span>
            <div className="flex-grow border-b border-black text-right font-bold pb-1 pr-12 text-sm uppercase">
              Verified By Junior Auditor
            </div>
          </div>

        </div>

        {/* Footer Signatures */}
        <div className="flex justify-between items-end mt-8 px-8 pb-4 font-bold text-lg">
          <div className="text-center">
             <div className="w-64 border-t border-black mb-2"></div>
             Signature of Subscriber
          </div>
          <div className="text-center">
             <div className="w-64 border-t border-black mb-2"></div>
             Signature of DDO
          </div>
        </div>

      </div>
    </div>
  );
};
