import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo } from '../../utils';

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
    style={{ top, left, width, zIndex: 10, ...style }} 
    className={`absolute font-bold text-black uppercase ${className}`}
  >
    {children}
  </div>
);

export const BenevolentFundOfficialForm2: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees } = employee;
  const { signatureTitle } = getCoverLetterInfo(employee);

  return (
    <div className="bg-white text-black font-sans text-sm leading-normal">
      <div className="print-page relative mx-auto bg-white block" style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}>
         <img 
            src="/templates/bf-p2.png" 
            alt="BF Page 2" 
            className="absolute inset-0 w-full h-full block object-fill" 
            style={{ zIndex: 0 }}
         />

         {/* Checklist Ticks */}
         <Overlay top="218mm" left="6mm" className="text-xl">✓</Overlay>
         <Overlay top="227mm" left="6mm" className="text-xl">✓</Overlay>
         
         <Overlay top="218mm" left="82mm" className="text-xl">✓</Overlay>
         <Overlay top="227mm" left="82mm" className="text-xl">✓</Overlay>

         <Overlay top="218mm" left="145mm" className="text-xl">✓</Overlay>
         <Overlay top="227mm" left="145mm" className="text-xl">✓</Overlay>
      </div>
    </div>
  );
};
