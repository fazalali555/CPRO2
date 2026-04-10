import React from 'react';
import { format, parseISO } from 'date-fns';
import { EmployeeRecord } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { splitToChars, detectGenderFromSchoolName } from '../../utils';

interface Props {
  employeeRecord: EmployeeRecord | null;
}

const SPACING = 5.65; // Consistent width for grid boxes in mm

// Sub-components for Form1
const BoxGrid: React.FC<{ values: string[], count: number, width?: string, height?: string }> = ({ values, count, width, height }) => (
  <div className="flex" style={{ gap: '0mm' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center justify-center border-black font-bold text-[11px]" 
        style={{ 
          width: width || `${SPACING}mm`, 
          height: height || '5mm', 
          borderLeft: i > 0 ? '0' : '0px' 
        }}>
        {values[i] || ''}
      </div>
    ))}
  </div>
);

const DateBox: React.FC<{ label: string, date: string }> = ({ label, date }) => {
  const parts = date.split('/'); // Expected format dd/MM/yyyy
  return (
    <div className="flex flex-col">
      {label && <span className="text-[7px] uppercase font-bold mb-0.5">{label}</span>}
      <div className="flex" style={{ gap: '2.5mm' }}>
        <div className="flex"><BoxGrid values={splitToChars(parts[0] || '', 2)} count={2} /></div>
        <div className="flex"><BoxGrid values={splitToChars(parts[1] || '', 2)} count={2} /></div>
        <div className="flex"><BoxGrid values={splitToChars(parts[2] || '', 4)} count={4} /></div>
      </div>
    </div>
  );
};

export const Form1: React.FC<Props> = ({ employeeRecord }) => {
  const emp = employeeRecord?.employees;
  const service = employeeRecord?.service_history;
  const financials = employeeRecord?.financials;

  const ddoCode = emp?.ddo_code || '';
  const officeName = emp?.office_name || '';
  
  // Derive Gender and Marital Status
  const schoolName = emp?.school_full_name || '';
  const gender = emp?.gender || (detectGenderFromSchoolName(schoolName) === 'M' ? 'male' : 'female');
  
  const family = employeeRecord?.family_members || [];
  const hasSpouse = family.some(m => ['Spouse', 'Wife', 'Husband'].includes(m.relation));
  const maritalStatus = emp?.marital_status || (hasSpouse ? 'Married' : 'Single');

  const dateOfEntry = formatDate(service?.date_of_entry, 'dd/MM/yyyy');
  const dob = formatDate(emp?.dob, 'dd/MM/yyyy');
  const dateGovtService = formatDate(service?.date_of_appointment, 'dd/MM/yyyy');
  
  const nameParts = emp?.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const cnic = (emp?.cnic_no || '').replace(/-/g, '');
  const pay01Page1 = '/templates/PAY01_1.png';
  const pay01Page2 = '/templates/PAY01_2.png';

  return (
    <div className="flex flex-col gap-6 print:gap-0 bg-gray-100 min-h-screen items-center p-8 print:p-0">
      {/* PAGE 1 */}
      <div className="bg-white text-black font-sans text-[9px] relative print-page shadow-2xl print:shadow-none"
        style={{ 
          width: '210mm', 
          height: '297mm', 
          backgroundImage: `url(${pay01Page1})`, 
          backgroundSize: '100% 100%', 
          backgroundRepeat: 'no-repeat',
        }}>
        
        {/* Section 01-04: Office Identification */}
        <div className="absolute top-[48.5mm] left-[13mm] w-[184mm]">
          {/* 01: Office Name */}
          <div className="absolute top-[0mm] left-[32mm] w-[150mm] uppercase font-bold text-[10px] leading-none">
            {officeName}
          </div>
          
          {/* 02: For the month of */}
          <div className="absolute top-[7mm] left-[38mm] w-[35mm] text-center font-bold text-[11px]">
            {format(new Date(), 'MMMM').toUpperCase()}
          </div>
          <div className="absolute top-[7mm] left-[81mm] w-[10mm] text-center font-bold text-[11px]">
            {format(new Date(), 'yy')}
          </div>

          {/* 03: DDO Code */}
          <div className="absolute top-[13.8mm] left-[24.5mm]">
            <BoxGrid values={splitToChars(ddoCode, 10, false)} count={10} />
          </div>

          {/* 04: Description */}
          <div className="absolute top-[14.5mm] left-[91mm] w-[90mm] uppercase font-bold text-[9px] leading-tight">
            {officeName}
          </div>
        </div>

        {/* PERSONAL ACTIONS Section - 05 to 12 */}
        <div className="absolute top-[75.8mm] left-[13mm] w-[184mm]">
          {/* 05: Date of Action (using entry date as proxy) */}
          <div className="absolute top-[1.2mm] left-[45mm]">
             <DateBox label="" date={dateOfEntry} />
          </div>

          {/* 06: Current Govt */}
          <div className="absolute top-[2.2mm] left-[105mm] w-[30mm] text-center uppercase font-bold text-[10px]">
            KPK
          </div>

          {/* 07: Employee Group */}
          <div className="absolute top-[2.2mm] left-[155mm] w-[25mm] text-center uppercase font-bold text-[10px]">
            REGULAR
          </div>

          {/* 08: Employee Grade */}
          <div className="absolute top-[9.2mm] left-[45mm] w-[20mm] text-center font-bold text-[11px]">
            {emp?.bps || ''}
          </div>

          {/* 09: Computer Number (Personal No) */}
          <div className="absolute top-[8.2mm] left-[104.5mm]">
             <BoxGrid values={splitToChars(emp?.personal_no || '', 8)} count={8} />
          </div>

          {/* 10: NIC */}
          <div className="absolute top-[15.8mm] left-[45mm]">
             <BoxGrid values={splitToChars(cnic, 13)} count={13} />
          </div>

          {/* 11: DOB */}
          <div className="absolute top-[15.8mm] left-[105mm]">
             <DateBox label="" date={dob} />
          </div>

          {/* 12: Date of Entry into Govt Service */}
          <div className="absolute top-[23.2mm] left-[45mm]">
             <DateBox label="" date={dateGovtService} />
          </div>
        </div>

        {/* PERSONAL DATA Section - 13 to 24 */}
        <div className="absolute top-[109mm] left-[13mm] w-[184mm]">
          {/* 13: Title */}
          <div className="absolute top-[2mm] left-[25mm] w-[50mm]">
             <div className="absolute left-[0.5mm] font-bold text-[14px]">{gender === 'male' ? '✓' : ''}</div>
             <div className="absolute left-[13.5mm] font-bold text-[14px]">{gender === 'female' && maritalStatus === 'Married' ? '✓' : ''}</div>
             <div className="absolute left-[26.5mm] font-bold text-[14px]">{gender === 'female' && maritalStatus !== 'Married' ? '✓' : ''}</div>
             <div className="absolute left-[39.5mm] font-bold text-[14px]">{gender === 'female' ? '' : ''}</div>
          </div>

          {/* 14: Last Name */}
          <div className="absolute top-[9.2mm] left-[25mm]">
            <BoxGrid values={splitToChars(lastName.toUpperCase(), 25, false)} count={25} />
          </div>

          {/* 15: First Name */}
          <div className="absolute top-[16.2mm] left-[25mm]">
            <BoxGrid values={splitToChars(firstName.toUpperCase(), 25, false)} count={25} />
          </div>

          {/* 16: Father/Husband Name */}
          <div className="absolute top-[23.2mm] left-[25mm]">
            <BoxGrid values={splitToChars((emp?.father_name || '').toUpperCase(), 25, false)} count={25} />
          </div>

          {/* 17: District of Domicile */}
          <div className="absolute top-[30.8mm] left-[40mm] w-[50mm] uppercase font-bold text-[11px]">
            {emp?.domicile}
          </div>

          {/* 18: Marital Status */}
          <div className="absolute top-[30.8mm] left-[125mm] w-[30mm] uppercase font-bold text-[11px]">
            {maritalStatus || 'SINGLE'}
          </div>

          {/* 19: City of Birth */}
          <div className="absolute top-[37.8mm] left-[40mm] w-[50mm] uppercase font-bold text-[11px]">
            {emp?.birth_place || emp?.domicile}
          </div>

          {/* 20: Date of Marriage */}
          <div className="absolute top-[37.8mm] left-[125mm]">
            <DateBox label="" date="" />
          </div>

          {/* 21: Province of Domicile */}
          <div className="absolute top-[44.8mm] left-[40mm] w-[40mm] uppercase font-bold text-[11px]">
            KPK
          </div>

          {/* 22: No of dependants */}
          <div className="absolute top-[44.8mm] left-[105mm] w-[10mm] text-center font-bold text-[11px]">
            0
          </div>

          {/* 23: Nationality */}
          <div className="absolute top-[44.8mm] left-[140mm] w-[30mm] uppercase font-bold text-[11px]">
            PAKISTANI
          </div>

          {/* 24: Religion */}
          <div className="absolute top-[51.8mm] left-[40mm] w-[40mm] uppercase font-bold text-[11px]">
            ISLAM
          </div>
        </div>

        {/* ORGANIZATIONAL ASSIGNMENT Section - 25 to 33 */}
        <div className="absolute top-[169mm] left-[13mm] w-[184mm]">
          {/* 25: DDO Code (Old) */}
          <div className="absolute top-[1.8mm] left-[65mm]">
            <BoxGrid values={splitToChars(ddoCode, 10, false)} count={10} />
          </div>

          {/* 26: DDO Code (Fund) */}
          <div className="absolute top-[8.8mm] left-[65mm]">
            <BoxGrid values={splitToChars(ddoCode, 10, false)} count={10} />
          </div>

          {/* 27: District (Sub area) */}
          <div className="absolute top-[15.8mm] left-[65mm] w-[50mm] uppercase font-bold text-[11px]">
            {emp?.domicile}
          </div>

          {/* 28: Contract Govt */}
          <div className="absolute top-[22.8mm] left-[85mm] font-bold text-[14px]">
             ✓
          </div>

          {/* 29: Position */}
          <div className="absolute top-[22.8mm] left-[145mm] w-[40mm]">
             <div className="absolute left-[0mm] font-bold text-[14px]">{Number(emp?.bps) >= 16 ? '✓' : ''}</div>
             <div className="absolute left-[18mm] font-bold text-[14px]">{Number(emp?.bps) < 16 ? '✓' : ''}</div>
          </div>

          {/* 30: Designation */}
          <div className="absolute top-[30mm] left-[64.5mm]">
            <BoxGrid values={splitToChars((emp?.designation || '').toUpperCase(), 15, false)} count={15} />
          </div>

          {/* 31: Ministry */}
          <div className="absolute top-[37.8mm] left-[65mm] w-[110mm] uppercase font-bold text-[9px] leading-tight">
            ELEMENTARY & SECONDARY EDUCATION DEPARTMENT
          </div>

          {/* 32: Fund Section */}
          <div className="absolute top-[44.8mm] left-[65mm] w-[40mm] uppercase font-bold text-[11px]">
            PENSION
          </div>

          {/* 33: Payroll Section */}
          <div className="absolute top-[51.8mm] left-[65mm] w-[40mm] uppercase font-bold text-[11px]">
            MONTHLY
          </div>
        </div>
      </div>
      
      {/* PAGE 2 */}
      <div className="bg-white text-black font-sans text-[9px] relative print-page shadow-2xl print:shadow-none"
        style={{ 
          width: '210mm', 
          height: '297mm', 
          backgroundImage: `url(${pay01Page2})`, 
          backgroundSize: '100% 100%', 
          backgroundRepeat: 'no-repeat',
        }}>
        
        {/* PAY Section - 34 to 41 */}
        <div className="absolute top-[39mm] left-[13mm] w-[184mm]">
           {/* 34: Pay Scale Type */}
           <div className="absolute top-[1.2mm] left-[65mm] w-[40mm] uppercase font-bold text-[11px]">
             BPS-{emp?.bps}
           </div>
           
           {/* 35: Basic Pay */}
           <div className="absolute top-[8.2mm] left-[65mm] w-[30mm] text-right font-bold text-[12px]">
             {financials?.last_basic_pay?.toLocaleString() || 0}
           </div>
           
           {/* 36: Payment Method */}
           <div className="absolute top-[15.2mm] left-[65mm] w-[40mm] uppercase font-bold text-[11px]">
             BANK TRANSFER
           </div>
           
           {/* 37: Bank Details */}
           <div className="absolute top-[22.2mm] left-[65mm] w-[100mm] uppercase font-bold text-[10px] leading-tight">
             {emp?.bank_name} - {emp?.branch_name}
           </div>
           
           {/* 38: Bank Account No */}
           <div className="absolute top-[29.2mm] left-[64.5mm]">
             <BoxGrid values={splitToChars(emp?.bank_ac_no || '', 16)} count={16} />
           </div>
           
           {/* 39: GPF Account No */}
           <div className="absolute top-[36.2mm] left-[64.5mm]">
             <BoxGrid values={splitToChars(emp?.gpf_account_no || '', 13, false)} count={13} />
           </div>
        </div>

        {/* ALLOWANCES & DEDUCTIONS - 42 to 43 */}
        <div className="absolute top-[110mm] left-[13mm] w-[184mm] flex gap-4">
           {/* Allowances */}
           <div className="w-[90mm] h-[80mm] relative">
              <div className="absolute top-[11mm] left-[0mm] w-full flex flex-col gap-[3.85mm] text-[10px] font-bold">
                 <div className="flex justify-between px-2"><span>House Rent Allowance</span><span>{financials?.hra?.toLocaleString() || 0}</span></div>
                 <div className="flex justify-between px-2"><span>Conveyance Allowance</span><span>{financials?.ca?.toLocaleString() || 0}</span></div>
                 <div className="flex justify-between px-2"><span>Medical Allowance</span><span>{financials?.ma?.toLocaleString() || 0}</span></div>
                 <div className="flex justify-between px-2"><span>Teaching Allowance</span><span>{financials?.teaching_allow?.toLocaleString() || 0}</span></div>
                 <div className="flex justify-between px-2"><span>Adhoc Relief 2022</span><span>{financials?.adhoc_2022_ps17?.toLocaleString() || 0}</span></div>
                 <div className="flex justify-between px-2"><span>Adhoc Relief 2023</span><span>{financials?.adhoc_2023_35?.toLocaleString() || 0}</span></div>
              </div>
           </div>
           
           {/* Deductions */}
           <div className="w-[90mm] h-[80mm] relative">
              <div className="absolute top-[11mm] left-[0mm] w-full flex flex-col gap-[3.85mm] text-[10px] font-bold">
                 <div className="flex justify-between px-2"><span>GP Fund Subscription</span><span>{financials?.gpf?.toLocaleString() || 0}</span></div>
                 <div className="flex justify-between px-2"><span>Benevolent Fund</span><span>{financials?.bf?.toLocaleString() || 0}</span></div>
                 <div className="flex justify-between px-2"><span>Group Insurance</span><span>{financials?.group_insurance?.toLocaleString() || 0}</span></div>
                 <div className="flex justify-between px-2"><span>Income Tax</span><span>{financials?.income_tax?.toLocaleString() || 0}</span></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
