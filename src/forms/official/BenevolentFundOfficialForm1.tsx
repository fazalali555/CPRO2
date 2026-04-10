import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { formatOfficialDate } from '../../utils/dateUtils';

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

export const BenevolentFundOfficialForm1: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history } = employee;

  const personalNo = employees.personal_no || '';
  
  // CNIC: Remove non-digits, split into 5, 7, 1
  const cnicRaw = (employees.cnic_no || '').replace(/\D/g, '');
  const cnic1 = cnicRaw.slice(0, 5);
  const cnic2 = cnicRaw.slice(5, 12);
  const cnic3 = cnicRaw.slice(12, 13);

  const name = employees.name;
  const designation = employees.designation;
  const bps = String(employees.bps);
  const office = employees.school_full_name;
  
  // Dates: Format to ddMMyyyy for box-style date inputs
  const cleanDate = (d?: string) => formatOfficialDate(d);
  const dobRaw = cleanDate(employees.dob);
  const entRaw = cleanDate(service_history.date_of_appointment);
  const retRaw = cleanDate(service_history.date_of_retirement);
  
  const contact = employees.mobile_no;
  const address = employees.address;

  const accountNo = employees.bank_ac_no || '';
  const bankName = employees.bank_name || '';
  const branchCode = employees.branch_code || '';
  const branchAddr = employees.branch_name || employees.bank_branch || ''; 

  return (
    <div className="bg-white text-black font-sans text-sm leading-normal">
      <div className="print-page relative mx-auto bg-white block" style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}>
         <img 
            src="/templates/bf-p1.png" 
            alt="BF Page 1" 
            className="absolute inset-0 w-full h-full block object-fill" 
            style={{ zIndex: 0 }}
         />

         {/* 1. Personal Number */}
         <Overlay top="32mm" left="95mm" width="100mm" className="text-sm tracking-widest">{personalNo}</Overlay>

         {/* 2. Name */}
         <Overlay top="45mm" left="95mm" width="100mm" className="text-sm">{name}</Overlay>

         {/* 3. Designation */}
         <Overlay top="58mm" left="95mm" width="100mm" className="text-sm">{designation}</Overlay>

         {/* 4. Pay Scale */}
         <Overlay top="71mm" left="95mm" width="100mm" className="text-sm">{bps}</Overlay>

         {/* 5. Office Department */}
         <Overlay top="85mm" left="95mm" width="100mm" className="text-xs leading-tight">{office}</Overlay>

         {/* 6. CNIC (Manually Sliced) */}
         <Overlay top="98mm" left="97mm" className="text-[13px] tracking-[4.5mm]">{cnic1}</Overlay>
         <Overlay top="98mm" left="135mm" className="text-[13px] tracking-[4.3mm]">{cnic2}</Overlay>
         <Overlay top="98mm" left="186mm" className="text-[13px] tracking-[5mm]">{cnic3}</Overlay>

         {/* 7. DOB (DD MM YYYY) */}
         <Overlay top="111mm" left="100mm" className="text-sm tracking-[7mm]">{dobRaw.slice(0,2)}</Overlay>
         <Overlay top="111mm" left="128mm" className="text-sm tracking-[7mm]">{dobRaw.slice(2,4)}</Overlay>
         <Overlay top="111mm" left="156mm" className="text-sm tracking-[7mm]">{dobRaw.slice(4,8)}</Overlay>

         {/* 8. Entry Date */}
         <Overlay top="125mm" left="100mm" className="text-sm tracking-[7mm]">{entRaw.slice(0,2)}</Overlay>
         <Overlay top="125mm" left="128mm" className="text-sm tracking-[7mm]">{entRaw.slice(2,4)}</Overlay>
         <Overlay top="125mm" left="156mm" className="text-sm tracking-[7mm]">{entRaw.slice(4,8)}</Overlay>

         {/* 9. Retirement Date */}
         <Overlay top="137mm" left="100mm" className="text-sm tracking-[7mm]">{retRaw.slice(0,2)}</Overlay>
         <Overlay top="137mm" left="128mm" className="text-sm tracking-[7mm]">{retRaw.slice(2,4)}</Overlay>
         <Overlay top="137mm" left="156mm" className="text-sm tracking-[7mm]">{retRaw.slice(4,8)}</Overlay>

         {/* 10. Contact Number */}
         <Overlay top="148mm" left="95mm" width="100mm" className="text-sm">{contact}</Overlay>

         {/* 11. Address */}
         <Overlay top="158mm" left="95mm" width="100mm" className="text-xs leading-tight">{address}</Overlay>

         {/* --- BANK DETAILS --- */}

         {/* 12. Account No */}
         <Overlay top="186mm" left="95mm" width="100mm" className="text-sm tracking-widest font-mono">{accountNo}</Overlay>

         {/* 13. Bank Name */}
         <Overlay top="197mm" left="95mm" width="100mm" className="text-sm">{bankName}</Overlay>

         {/* 14. Branch Code */}
         <Overlay top="210mm" left="95mm" width="100mm" className="text-sm font-mono">{branchCode}</Overlay>

         {/* 15. Branch Address */}
         <Overlay top="222mm" left="95mm" width="100mm" className="text-sm">{branchAddr}</Overlay>

         {/* Name & Sig Bottom */}
         <Overlay top="265mm" left="15mm" width="60mm" className="text-center text-xs">{name}</Overlay>
      </div>
    </div>
  );
};
