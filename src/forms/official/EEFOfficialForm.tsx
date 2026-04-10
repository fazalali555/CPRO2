
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

// Absolute Overlay Helper - Added position: absolute to inline style for robust printing
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

export const EEFOfficialForm: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history } = employee;
  const ben = employee.extras?.beneficiary || {};

  // Form Data
  const name = employees.name;
  const fatherName = employees.father_name;
  const cnic = employees.cnic_no;
  const designation = employees.designation;
  const bps = String(employees.bps);
  const personalNo = employees.personal_no;
  const dob = formatDate(employees.dob);
  const doa = formatDate(service_history.date_of_appointment);
  const dor = formatDate(service_history.date_of_retirement);
  const nature = caseRecord.extras?.nature_of_retirement || employees.status;
  const place = employees.school_full_name;
  const orderNo = service_history.retirement_order_no || '';
  const orderDate = formatDate(service_history.retirement_order_date);
  const mobile = employees.mobile_no;
  const address = employees.address;

  // Legal Heir (if death)
  const heirName = ben.name || 'N/A';
  const heirRel = ben.relation || 'N/A';
  const heirCnic = ben.cnic || 'N/A';

  // Bank
  const bankTitle = employees.bank_name ? employees.name : '';
  const bankAc = employees.bank_ac_no;
  const branchName = employees.branch_name;
  const branchCode = employees.branch_code;

  return (
    <div className="bg-white text-black font-sans text-sm leading-normal">
      <div className="print-page relative mx-auto bg-white block" style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}>
         
         <img 
            src="/templates/eef-form.png" 
            alt="EEF Form" 
            className="absolute inset-0 w-full h-full block object-fill" 
            style={{ zIndex: 0 }}
         />

         {/* 1. Name */}
         <Overlay top="43mm" left="65mm" width="80mm" className="text-sm">{name}</Overlay>

         {/* 2. Father Name */}
         <Overlay top="42mm" left="160mm" width="40mm" className="text-sm">{fatherName}</Overlay>

         {/* 3. CNIC */}
         <Overlay top="52mm" left="65mm" width="60mm" className="text-sm font-mono tracking-wide">{cnic}</Overlay>

         {/* 4. Desig */}
         <Overlay top="51mm" left="136mm" width="35mm" className="text-xs truncate">{designation}</Overlay>

         {/* 5. BPS */}
         <Overlay top="50mm" left="180mm" width="10mm" className="text-sm">{bps}</Overlay>

         {/* 6. Directorate */}
         <Overlay top="60mm" left="65mm" width="60mm" className="text-sm">E&SE (Education)</Overlay>

         {/* 7. Personnel No */}
         <Overlay top="60mm" left="160mm" width="40mm" className="text-sm">{personalNo}</Overlay>

         {/* 8. DOB */}
         <Overlay top="69mm" left="68mm" width="60mm" className="text-sm">{dob}</Overlay>

         {/* 9. DOA */}
         <Overlay top="68mm" left="160mm" width="40mm" className="text-sm">{doa}</Overlay>

         {/* 10. DOR */}
         <Overlay top="76mm" left="68mm" width="60mm" className="text-sm">{dor}</Overlay>

         {/* 11. Nature */}
         <Overlay top="76mm" left="154mm" width="40mm" className="text-sm">{nature}</Overlay>

         {/* 12. Place of Posting */}
         <Overlay top="85mm" left="120mm" width="90mm" className="text-xs leading-tight">{place}</Overlay>

         {/* 13. Order No */}
         <Overlay top="94mm" left="90mm" width="60mm" className="text-xs truncate">{orderNo}</Overlay>
         <Overlay top="94mm" left="155mm" width="40mm" className="text-xs">{orderDate}</Overlay>

         {/* 14. Heir Name */}
         <Overlay top="101mm" left="85mm" width="60mm" className="text-sm">{heirName}</Overlay>
         {/* 15. Relation */}
         <Overlay top="100mm" left="165mm" width="30mm" className="text-sm">{heirRel}</Overlay>

         {/* 16. Heir CNIC */}
         <Overlay top="110mm" left="75mm" width="60mm" className="text-sm font-mono">{heirCnic}</Overlay>

         {/* 17. Contact */}
         <Overlay top="118mm" left="90mm" width="50mm" className="text-sm">{mobile}</Overlay>
         {/* Mobile (repeated in form usually) */}
         <Overlay top="118mm" left="155mm" width="40mm" className="text-sm">{mobile}</Overlay>

         {/* 18. Address */}
         <Overlay top="127mm" left="50mm" width="150mm" className="text-xs"> {address}</Overlay>

         {/* Signatures */}
         <Overlay top="192mm" left="20mm" width="60mm" className="text-center text-xs">{name}</Overlay>

         {/* Bank Details (Bottom Table) */}
         {/* Title */}
         <Overlay top="246mm" left="80mm" width="60mm" className="text-xs">{bankTitle}</Overlay>
         {/* Account No */}
         <Overlay top="252.5mm" left="80mm" width="60mm" className="text-sm font-mono tracking-widest">{bankAc}</Overlay>
         {/* Branch Name */}
         <Overlay top="260mm" left="80mm" width="60mm" className="text-xs">{branchName}</Overlay>
         {/* Branch Code */}
         <Overlay top="266mm" left="80mm" width="60mm" className="text-sm font-mono">{branchCode}</Overlay>

      </div>
    </div>
  );
};
