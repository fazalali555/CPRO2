
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { Letterhead } from '../../components/Letterhead';
import { getCoverLetterInfo, formatCurrency, detectGenderFromSchoolName, getDEORecipientTitle } from '../../utils';

interface Props {
  employeeRecord: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const GPFApplicationForSanction: React.FC<Props> = ({ employeeRecord, caseRecord }) => {
  const { employees } = employeeRecord;
  const { extras } = caseRecord;
  
  const isRefundable = caseRecord.case_type === 'gpf_refundable';
  const typeLabel = isRefundable ? 'Refundable' : 'Non-Refundable';
  const subject = `GPF Advance ${typeLabel}`;
  
  // Dynamic Fields
  const dispatchNo = extras?.sanction_app_no || '________________';
  const dateYear = extras?.sanction_app_date ? new Date(extras.sanction_app_date).getFullYear() : new Date().getFullYear();
  
  // Recipient Logic
  const gender = detectGenderFromSchoolName(employees.school_full_name);
  const district = employees.district || 'Battagram';
  const salutation = gender === 'F' ? 'R/Madam' : 'R/Sir';
  
  // Signature
  const { signatureTitle } = getCoverLetterInfo(employeeRecord);

  // Financials
  const amount = Number(extras?.amount_requested) || 0;
  const installments = isRefundable ? (Number(extras?.installments) || 24) : 'N/A';
  const monthlyInst = Number(extras?.monthly_recovery) || (isRefundable && installments !== 'N/A' ? Math.ceil(amount / Number(installments)) : 0);

  return (
    <div 
      className="bg-white text-black font-serif text-[11pt] leading-[1.4] relative print-page mx-auto"
      style={{ 
        width: '210mm', 
        minHeight: '297mm', 
        padding: '15mm 15mm', 
        boxSizing: 'border-box' 
      }}
    >
      
      {/* --- Header Section --- */}
      <Letterhead employeeRecord={employeeRecord} />

      {/* Separator Lines */}
      <div className="border-t-4 border-black mb-[2px] mt-2"></div>
      <div className="border-t border-black mb-8"></div>

      {/* Dispatch Number / Date Section */}
      <div className="flex flex-col items-end mb-8 text-sm font-medium">
        <div className="flex items-end mb-2">
          <span className="mr-4 uppercase font-bold">No</span>
          <div className="border-b border-black w-40 text-center font-bold">{dispatchNo}</div>
        </div>
        <div className="flex items-end">
          <span className="mr-4 uppercase font-bold">Dated:</span>
          <div className="border-b border-black w-12 text-center"></div>
          <span className="mx-1">/</span>
          <div className="border-b border-black w-12 text-center"></div>
          <span className="ml-1">/{dateYear}</span>
        </div>
      </div>

      {/* Recipient Section */}
      <div className="mb-8 text-[15px] leading-relaxed">
        <p className="mb-4 font-bold">To,</p>
        <div className="pl-12 font-bold">
          <p>The District Education Officer</p>
          <p>({gender === 'F' ? 'Female' : 'Male'}) {district}</p>
        </div>
      </div>

      {/* Subject Section */}
      <div className="mb-6 text-[15px]">
        <span className="font-bold mr-4">Subject:</span>
        <span className="font-bold underline decoration-1 underline-offset-4 uppercase">{subject}</span>
      </div>

      {/* Salutation */}
      <div className="mb-4 text-[15px]">
        <p className="font-bold">{salutation},</p>
      </div>

      {/* Main Paragraph */}
      <div className="mb-6 text-justify leading-relaxed text-[15px]">
        <p>
          The undersigned has received an application for {subject} in respect of the following Officials/Officers, completed in all respects, which is hereby submitted for favor of sanction please.
        </p>
      </div>

      {/* Table Intro */}
      <div className="mb-4 text-[15px]">
        <p>Details of Officials/Officers are as under:-</p>
      </div>

      {/* Table */}
      <div className="mb-12">
        <table className="w-full border-collapse border border-black text-center text-xs">
          <thead>
            <tr className="font-bold bg-gray-100 print:bg-transparent">
              <th className="border border-black p-2 align-top w-10">S.No</th>
              <th className="border border-black p-2 align-top">Name of Officials</th>
              <th className="border border-black p-2 align-top">Father Name</th>
              <th className="border border-black p-2 align-top">Duty Station</th>
              <th className="border border-black p-2 align-top w-24">Amount Applied For</th>
              <th className="border border-black p-2 align-top w-20">No. of Installments</th>
              <th className="border border-black p-2 align-top w-20">Rate of Installment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-3 align-middle">1</td>
              <td className="border border-black p-3 align-middle font-bold uppercase">{employees.name}</td>
              <td className="border border-black p-3 align-middle uppercase">{employees.father_name}</td>
              <td className="border border-black p-3 align-middle uppercase">{employees.school_full_name}</td>
              <td className="border border-black p-3 align-middle font-bold">{formatCurrency(amount)}</td>
              <td className="border border-black p-3 align-middle">{installments}</td>
              <td className="border border-black p-3 align-middle">{monthlyInst > 0 ? formatCurrency(monthlyInst) : '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Enclosures Section */}
      <div className="mt-8 text-sm font-medium">
        <p className="font-bold mb-2">Enclosures:-</p>
        <ol className="list-decimal pl-8 space-y-1">
          <li>Application</li>
          <li>NIC</li>
          <li>Balance Sheet (Original)</li>
          <li>Pay Slip</li>
          <li>Service Book (Photocopy)</li>
        </ol>
      </div>

      {/* Footer Signature */}
      <div className="mt-16 flex justify-end">
        <div className="text-center w-64">
          <div className="border-t border-black mb-2 w-full"></div>
          <h4 className="font-bold text-sm uppercase whitespace-pre-line">
            {signatureTitle}
          </h4>
        </div>
      </div>

    </div>
  );
};
