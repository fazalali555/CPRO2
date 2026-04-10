
import React from 'react';
import { EmployeeRecord } from '../../types';
import { format, parseISO } from 'date-fns';
import { getCoverLetterInfo } from '../../utils';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try { return format(parseISO(dateStr), 'dd-MM-yyyy'); } catch { return dateStr; }
};

export const PensionCertificatesA: React.FC<Props> = ({ employee }) => {
  const { employees, service_history } = employee;
  const dor = formatDate(service_history.date_of_retirement);
  
  // Get signature title for head of institution
  const { signatureTitle } = getCoverLetterInfo(employee);

  const SigBlock = () => (
    <div className="flex justify-between items-end mt-6 mb-8">
       {/* LEFT: Employee Signature */}
       <div className="w-56 text-center">
          <div className="h-12"></div>
          <div className="border-t border-black mb-1 pt-1"></div>
          <div className="font-bold text-[11px] uppercase">{employees.name}</div>
          <div className="text-[10px] uppercase">({employees.designation})</div>
       </div>

       {/* RIGHT: Head Signature */}
       <div className="w-56 text-center">
          <div className="h-12"></div>
          <div className="border-t border-black mb-1 pt-1"></div>
          <div className="font-bold text-[11px] uppercase leading-tight whitespace-pre-wrap">{signatureTitle}</div>
       </div>
    </div>
  );

  return (
    <div className="bg-white text-black font-serif text-[11pt] leading-relaxed relative print-page mx-auto flex flex-col"
      style={{ 
        width: '210mm', 
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        padding: '8mm 12mm 8mm 20mm', 
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
      
      {/* Header */}
      <div className="text-center font-bold mb-6 shrink-0">
        <div className="text-lg border-2 border-black rounded-full w-9 h-9 flex items-center justify-center mx-auto mb-2 font-bold">7</div>
        <div className="text-lg uppercase underline tracking-wide">CERTIFICATES & DECLARATIONS (PART-A)</div>
      </div>

      {/* NO DEMAND CERTIFICATE */}
      <div className="mb-6 shrink-0">
         <div className="font-bold text-base uppercase underline mb-2">NO DEMAND CERTIFICATE</div>
         <div className="text-justify px-2 text-[11pt] leading-relaxed">
            Certified that nothing is outstanding against Mr./Mrs. <span className="font-bold uppercase">{employees.name}</span>, who has retired on <span className="font-bold">{dor}</span>, either on account of any government money or property. If anything is found later on, the responsibility will lie with the undersigned.
         </div>
         <SigBlock />
      </div>

      {/* OPTION FOR COMMUTATION */}
      <div className="mb-6 shrink-0">
         <div className="font-bold text-base uppercase underline mb-2">OPTION FOR COMMUTATION</div>
         <div className="text-justify px-2 text-[11pt] leading-relaxed">
            I, <span className="font-bold uppercase">{employees.name}</span> S/O <span className="font-bold uppercase">{employees.father_name}</span>, hereby opt to commute <span className="font-bold border-b border-black px-1">{employee.extras?.commutation_portion ?? 35}%</span> of my gross pension as admissible under the rules.
         </div>
         <SigBlock />
      </div>

      {/* DECLARATION 911 */}
      <div className="mb-6 shrink-0">
         <div className="font-bold text-base uppercase underline mb-2">NON-RECEIPT OF PENSION (ART. 911 CSR)</div>
         <div className="text-justify px-2 text-[11pt] leading-relaxed">
            I, <span className="font-bold uppercase">{employees.name}</span>, hereby certify that I have neither applied for, nor received any pension or gratuity in respect of any portion of my service included in this application. I shall not submit any application hereafter without quoting a reference to this application.
         </div>
         <SigBlock />
      </div>

      {/* RECOVERY UNDERTAKING */}
      <div className="mb-6 shrink-0">
         <div className="font-bold text-base uppercase underline mb-2">UNDERTAKING FOR RECOVERY</div>
         <div className="text-justify px-2 text-[11pt] leading-relaxed">
            I do hereby undertake and give my consent to the recovery of any government dues found outstanding against me on account of pay, allowances, or any other items, from my gratuity/pension.
         </div>
         <SigBlock />
      </div>

      {/* Spacer */}
      <div className="flex-grow"></div>

      {/* Page Number */}
      <div className="text-center text-[9pt] text-gray-600 mt-2 shrink-0">Page 7</div>

    </div>
  );
};
