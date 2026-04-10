
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { formatDate, formatOfficialDate } from '../../utils/dateUtils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

// --- CONFIGURATION ---
const SPACING = {
  PERSONAL_NO: '8.5mm',
  NAME: '8mm',
  CNIC: '7.7mm',
  FATHER: '8mm',
  DESIGNATION: '8mm',
  BPS: '8mm',
  DEPT: '8mm',
  DATE: '7.5mm',
  DATE_GAP: '7mm' // Space between DD and MM, and MM and YYYY
};

// Position Container
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

// Character Spacing Helper
const BoxedText = ({ text, width, className = "" }: { text: string, width: string, className?: string }) => (
  <div className={`flex ${className}`}>
    {text.split('').map((char, i) => (
      <div key={i} style={{ width: width, textAlign: 'center', display: 'inline-block', lineHeight: '1' }}>
        {char}
      </div>
    ))}
  </div>
);

// Helper for Date Component
const DateBoxes = ({ dateStr, className }: { dateStr: string, className?: string }) => (
  <div className="flex">
      <BoxedText text={dateStr.slice(0, 2)} width={SPACING.DATE} className={className} />
      <div style={{ width: SPACING.DATE_GAP }}></div>
      <BoxedText text={dateStr.slice(2, 4)} width={SPACING.DATE} className={className} />
      <div style={{ width: SPACING.DATE_GAP }}></div>
      <BoxedText text={dateStr.slice(4, 8)} width={SPACING.DATE} className={className} />
  </div>
);

export const RBDCOfficialForm1: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history } = employee;
  const ben = employee.extras?.beneficiary || {};

  const personalNo = employees.personal_no || '';
  const isDeceased = employees.status === 'Deceased';
  const beneficiaryName = isDeceased ? (ben.name || '') : employees.name;
  const beneficiaryCnic = isDeceased ? (ben.cnic || '') : employees.cnic_no;
  const beneficiaryFather = isDeceased ? (ben.father_name || '') : employees.father_name;

  // Name Splitting Logic (12 chars per line)
  const nameLine1 = beneficiaryName.slice(0, 12);
  const nameLine2 = beneficiaryName.slice(12, 24);

  const designation = employees.designation;
  const bps = String(employees.bps).padStart(2, '0');
  const dept = "EDUCATION";
  const station = employees.school_full_name;
  
  // Date format: ddMMyyyy (8 chars) for boxed date inputs
  const dob = formatOfficialDate(employees.dob);
  const doa = formatOfficialDate(service_history.date_of_appointment);
  const dor = formatOfficialDate(service_history.date_of_retirement);
  
  const nature = (caseRecord.extras?.nature_of_retirement || employees.status || '').toLowerCase();
  const isSuper = nature.includes('superannuation');
  const isDismissal = nature.includes('dismissal');
  const isRemoval = nature.includes('removal');
  const isTermination = nature.includes('termination');
  const isResignation = nature.includes('resignation');

  const address = employees.address;
  const contact = employees.mobile_no;

  return (
    <div className="bg-white text-black font-sans text-sm leading-normal">
      <div className="print-page relative mx-auto bg-white block" style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}>
         <img 
            src="/templates/rbdc-p1.png" 
            alt="RBDC Page 1" 
            className="absolute inset-0 w-full h-full block object-fill" 
            style={{ zIndex: 0 }}
         />

         {/* 1. Personal No */}
         <Overlay top="36mm" left="73mm">
            <BoxedText text={personalNo} width={SPACING.PERSONAL_NO} className="font-mono text-[12px]" />
         </Overlay>

         {/* 2a. Name Line 1 */}
         <Overlay top="42.5mm" left="65mm">
            <BoxedText text={nameLine1} width={SPACING.NAME} className="font-mono text-[12px]" />
         </Overlay>
         
         {/* 2a. Name Line 2 */}
         <Overlay top="47mm" left="58mm">
            <BoxedText text={nameLine2} width={SPACING.NAME} className="font-mono text-[12px]" />
         </Overlay>

         {/* b. CNIC */}
         <Overlay top="54.4mm" left="65mm">
            <div className="flex font-mono text-[12px]">
               <BoxedText text={beneficiaryCnic.slice(0, 5)} width={SPACING.CNIC} />
               <div style={{ width: '2mm' }}></div>
               <BoxedText text={beneficiaryCnic.slice(5, 11)} width={SPACING.CNIC} />
               <div style={{ width: '2mm' }}></div>
               <BoxedText text={beneficiaryCnic.slice(11, 15)} width={SPACING.CNIC} />
            </div>
         </Overlay>

         {/* c. Father Name */}
         <Overlay top="61mm" left="65mm">
            <BoxedText text={beneficiaryFather} width={SPACING.FATHER} className="font-mono text-[12px]" />
         </Overlay>

         {/* d. Last Position (Designation) */}
         <Overlay top="68mm" left="65mm">
            <BoxedText text={designation.substring(0, 12)} width={SPACING.DESIGNATION} className="font-mono text-[12px]" />
         </Overlay>
         
         {/* BPS (Fixed Font Size) */}
         <Overlay top="72.5mm" left="97mm">
            <BoxedText text={bps} width={SPACING.BPS} className="font-mono text-[12px]" />
         </Overlay>

         {/* e. Department */}
         <Overlay top="80mm" left="65mm">
            <BoxedText text={dept} width={SPACING.DEPT} className="font-mono text-[12px]" />
         </Overlay>

         {/* f. Station (Text Only, Underlined) */}
         <Overlay top="90mm" left="93mm" width="100mm" className="text-sm truncate underline decoration-black underline-offset-4">
            {station}
         </Overlay>

         {/* 3. DOB */}
         <Overlay top="103.5mm" left="64mm">
            <DateBoxes dateStr={dob} className="font-mono text-[12px]" />
         </Overlay>

         {/* 4. DOA */}
         <Overlay top="110.5mm" left="64mm">
            <DateBoxes dateStr={doa} className="font-mono text-[12px]" />
         </Overlay>

         {/* 5. DOR (Fixed coordinates) */}
         <Overlay top="117.5mm" left="64mm">
            <DateBoxes dateStr={dor} className="font-mono text-[12px]" />
         </Overlay>

         {/* Checkboxes for Nature */}
         {isSuper && <Overlay top="126mm" left="65mm" className="text-xl">✓</Overlay>}
         {isDismissal && <Overlay top="126mm" left="123mm" className="text-xl">✓</Overlay>}
         {isRemoval && <Overlay top="126mm" left="165mm" className="text-xl">✓</Overlay>}
         {isTermination && <Overlay top="137mm" left="65mm" className="text-xl">✓</Overlay>}
         {isResignation && <Overlay top="137mm" left="123mm" className="text-xl">✓</Overlay>}

         {/* 6. Regular Contribution */}
         {/* a) Group Insurance */}
         <Overlay top="149mm" left="90mm" className="font-mono text-[12px]">{formatDate(employees.dob)}</Overlay>
         <Overlay top="149mm" left="150mm" className="font-mono text-[12px]">30-09-2016</Overlay>

         {/* b) RB & DC */}
         <Overlay top="153mm" left="90mm" className="font-mono text-[12px]">01-10-2016</Overlay>
         <Overlay top="153mm" left="150mm" className="font-mono text-[12px]">{formatDate(service_history.date_of_retirement)}</Overlay>

         {/* 7. Address */}
         <Overlay top="191mm" left="60mm" width="150mm" className="text-xs leading-tight">{address}</Overlay>
         <Overlay top="198mm" left="60mm" width="150mm" className="text-xs leading-tight">{address}</Overlay>
         <Overlay top="204mm" left="93mm" width="105mm" className="text-sm">{contact}</Overlay>

         {/* Signature Name */}
         <Overlay top="240mm" left="120mm" width="50mm" className="text-center text-xs">{beneficiaryName}</Overlay>
      </div>
    </div>
  );
};
