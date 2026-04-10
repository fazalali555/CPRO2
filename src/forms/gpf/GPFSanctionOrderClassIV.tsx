
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { Letterhead } from '../../components/Letterhead';
import { getCoverLetterInfo, formatCurrency, detectGenderFromSchoolName } from '../../utils';

interface Props {
  employeeRecord: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const GPFSanctionOrderClassIV: React.FC<Props> = ({ employeeRecord, caseRecord }) => {
  const { employees } = employeeRecord;
  const { extras } = caseRecord;
  
  const isRefundable = caseRecord.case_type === 'gpf_refundable';
  const typeLabel = isRefundable ? 'Refundable' : 'Non-Refundable';
  const ruleType = isRefundable ? '16(A)' : '16(a)';
  
  // Dynamic Fields
  const orderNo = extras?.sanction_order_no || '________/________';
  const dateYear = extras?.sanction_order_date ? new Date(extras.sanction_order_date).getFullYear() : new Date().getFullYear();
  
  // Signatory Logic
  const { signatureTitle } = getCoverLetterInfo(employeeRecord);
  const isSDEO = signatureTitle.toLowerCase().includes('sub divisional');
  
  // Copy Info Logic
  const district = employees.district || 'Battagram';
  const gender = detectGenderFromSchoolName(employees.school_full_name);
  const deoTitle = `District Education Officer (${gender === 'F' ? 'Female' : 'Male'})`;
  const schoolName = employees.school_full_name || employees.office_name;

  // Financials
  const amount = Number(extras?.amount_requested) || 0;
  const installments = isRefundable ? (Number(extras?.installments) || 24) : 'Non Refundable';
  const monthlyInst = isRefundable && installments !== 'Non Refundable' 
    ? Math.ceil(amount / Number(installments)) 
    : 0;

  return (
    <div 
      className="bg-white text-black font-serif text-[11pt] leading-[1.4] relative print-page mx-auto"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '15mm 15mm', 
        boxSizing: 'border-box' 
      }}
    >
      
      {/* --- Header Section --- */}
      <Letterhead employeeRecord={employeeRecord} />

      {/* Double Line Separator */}
      <div className="border-b-4 border-double border-black mb-6"></div>

      {/* --- Document Title --- */}
      <div className="mb-6 text-center">
        <h2 className="text-lg font-bold uppercase underline underline-offset-2 inline-block">
          SANCTION OF GPF ADVANCE
        </h2>
      </div>

      {/* --- Body Text --- */}
      <div className="text-justify mb-6 leading-relaxed text-sm">
        <p>
          Under rule 12 (3) revised G.P. Fund rules 2008 issued vide Finance Department Govt: of KPK 
          Peshawar letter no. SOSR II/FD/2-2-2007/ Vol: V dated 13.01.2009, Sanction is hereby accorded of 
          the grant of GPF Advance ({typeLabel}) under the rule {ruleType} in favor of the 
          following Officer/Officials as per detail given below.
        </p>
      </div>

      {/* --- Table --- */}
      <div className="mb-12">
        <table className="w-full border-collapse border border-black text-center text-xs">
          <thead>
            <tr className="bg-white">
              <th className="border border-black p-2 w-8 align-top">S#</th>
              <th className="border border-black p-2 w-[30%] align-top">
                Name of Official with Designation and office/school
              </th>
              <th className="border border-black p-2 w-[15%] align-top">
                GPF Account /Personal No
              </th>
              <th className="border border-black p-2 w-[12%] align-top">
                Amount of GPF Advance
              </th>
              <th className="border border-black p-2 w-[12%] align-top">
                Outstanding amount
              </th>
              <th className="border border-black p-2 w-[15%] align-top">
                Number of installments
              </th>
              <th className="border border-black p-2 w-[15%] align-top">
                Installment Per month
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 h-16 align-middle">1</td>
              <td className="border border-black p-2 align-middle text-left leading-tight">
                <div className="font-bold uppercase">{employees.name}</div>
                <div className="uppercase">{employees.designation}</div>
                <div className="text-[10px]">{schoolName}</div>
              </td>
              <td className="border border-black p-2 align-middle font-mono">
                <div>{employees.gpf_account_no}</div>
                <div className="text-[10px] text-gray-600">{employees.personal_no}</div>
              </td>
              <td className="border border-black p-2 align-middle font-bold">{formatCurrency(amount)}</td>
              <td className="border border-black p-2 align-middle">{extras?.outstanding_amount || '-'}</td>
              <td className="border border-black p-2 align-middle">{installments}</td>
              <td className="border border-black p-2 align-middle">
                {monthlyInst > 0 ? formatCurrency(monthlyInst) : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- Signature Section --- */}
      <div className="flex justify-end mb-12">
        <div className="text-center w-64">
          <div className="border-t border-black mb-2 w-full"></div>
          <h4 className="font-bold text-sm uppercase whitespace-pre-line">
            {signatureTitle}
          </h4>
        </div>
      </div>

      {/* --- Reference No & Date --- */}
      <div className="flex justify-between items-end mb-6 text-sm">
        <div className="flex items-end">
          <span className="font-bold mr-2">No.</span>
          <div className="w-40 border-b border-black text-center">{orderNo}</div>
        </div>
        <div className="flex items-end">
          <span className="font-bold mr-2">Dated:</span>
          <div className="w-12 border-b border-black text-center"></div>
          <span className="mx-1">/</span>
          <div className="w-12 border-b border-black text-center"></div>
          <span className="ml-1">/{dateYear}</span>
        </div>
      </div>

      {/* --- Copy For Information --- */}
      <div className="text-sm">
        <p className="font-bold italic mb-2">Copy for the information:-</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>District Account Officer {district}</li>
          {/* Only send to DEO if not signed by DEO (SDEO always sends to DEO, High School Principals usually do too) */}
          <li>{deoTitle}, {district}</li>
          
          {/* Only send to Headteacher if the issuer is NOT the Headteacher (i.e. SDEO issuing for Primary School) */}
          {isSDEO && <li>Headteacher Concerned</li>}
          
          <li>Official Concerned</li>
          <li>Office file</li>
        </ol>
      </div>

    </div>
  );
};
