
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo } from '../../utils';
import { formatDate } from '../../utils/dateUtils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

const Overlay = ({ 
  top, 
  left, 
  width, 
  children, 
  className = "",
  style = {}
}: { 
  top: string; 
  left: string; 
  width?: string; 
  children?: React.ReactNode; 
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div 
    style={{ position: 'absolute', top, left, width, zIndex: 10, ...style }} 
    className={`absolute font-bold text-black uppercase ${className}`}
  >
    {children}
  </div>
);

export const RBDCOfficialForm2: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees } = employee;
  const { signatureTitle } = getCoverLetterInfo(employee);
  const ben = employee.extras?.beneficiary || {};

  const isDeceased = employees.status === 'Deceased';
  const beneficiaryName = isDeceased ? (ben.name || '') : employees.name;

  const bankName = isDeceased ? (ben.bank_name || 'NBP') : (employees.bank_name || 'NBP');
  const branchCode = isDeceased ? (ben.branch_code || '') : (employees.branch_code || '');
  const accountTitle = beneficiaryName;
  const accountNo = isDeceased ? (ben.account_no || '') : (employees.bank_ac_no || '');
  const accountType = isDeceased ? 'PLS' : employees.account_type;

  return (
    <div className="bg-white text-black font-sans text-sm leading-normal">
      <div className="print-page relative mx-auto bg-white block" style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}>
         <img 
            src="/templates/rbdc-p2.png" 
            alt="RBDC Page 2" 
            className="absolute inset-0 w-full h-full block object-fill" 
            style={{ zIndex: 0 }}
         />

         {/* 8. Bank Detail */}
         <Overlay top="42mm" left="78mm" width="55mm" className="text-sm text-center">{bankName}</Overlay>
         <Overlay top="42mm" left="165mm" width="30mm" className="text-sm text-center">{branchCode}</Overlay>
         
         <Overlay top="49mm" left="78mm" width="115mm" className="text-sm text-center">{accountTitle}</Overlay>
         
         <Overlay top="55mm" left="105mm" width="88mm" className="text-sm text-center">{accountType}</Overlay>
         
         <Overlay top="62mm" left="78mm" width="115mm" className="text-sm text-center tracking-widest font-mono">{accountNo}</Overlay>

         {/* Certifications (Name inserted) */}
         <Overlay top="108mm" left="130mm" width="60mm" className="text-center text-xs underline decoration-dotted">{employees.name}</Overlay>

         {/* Date and Signature Blocks */}
         <Overlay top="170mm" left="45mm" width="40mm" className="text-sm">{formatDate(new Date().toISOString())}</Overlay>

      </div>
    </div>
  );
};
