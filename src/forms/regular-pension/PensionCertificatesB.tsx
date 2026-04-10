
import React from 'react';
import { EmployeeRecord } from '../../types';
import { format, parseISO } from 'date-fns';
import { calculateServiceDuration, getHeadOfInstitutionTitle } from '../../utils';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try { return format(parseISO(dateStr), 'dd-MM-yyyy'); } catch { return dateStr; }
};

export const PensionCertificatesB: React.FC<Props> = ({ employee }) => {
  const { employees, service_history } = employee;
  const dor = formatDate(service_history.date_of_retirement);
  
  // Get signature title for head of institution
  const headTitle = getHeadOfInstitutionTitle(employee);
  const isSDEO = headTitle.includes('SDEO') || headTitle.includes('Sub Divisional Education Officer');
  const signatureTitle = isSDEO
    ? headTitle 
    : `${headTitle}\n${employees.school_full_name}`;
  
  const service = calculateServiceDuration(
    service_history.date_of_appointment,
    service_history.date_of_retirement,
    service_history.lwp_days
  );

  const SigBlock = () => (
    <div className="flex justify-between items-end mt-6 mb-8">
       {/* LEFT: Employee Signature */}
       <div className="w-56 text-center">
          <div className="h-12"></div>
          <div className="border-t border-black mb-1 pt-1"></div>
          <div className="font-bold text-[11px] uppercase">{employees.name}</div>
          <div className="text-[10px] uppercase">({employees.designation})</div>
          <div className="text-[10px] uppercase">{employees.school_full_name}</div>
       </div>

       {/* RIGHT: Head Signature */}
       <div className="w-56 text-center">
          <div className="h-12"></div>
          <div className="border-t border-black mb-1 pt-1"></div>
          <div className="font-bold text-[11px] uppercase leading-tight whitespace-pre-line">{signatureTitle}</div>
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
        <div className="text-lg border-2 border-black rounded-full w-9 h-9 flex items-center justify-center mx-auto mb-2 font-bold">10</div>
        <div className="text-lg uppercase underline tracking-wide">CERTIFICATES & DECLARATIONS (PART-B)</div>
      </div>

      {/* 920 CSR */}
      <div className="mb-6 shrink-0">
         <div className="font-bold text-base uppercase underline mb-2">DECLARATION UNDER ARTICLE 920 (I) CSR</div>
         <div className="text-justify px-2 text-[11pt] leading-relaxed">
            I do hereby declare that in case the amount of pension/gratuity sanctioned to me is found to be in excess of that to which I am entitled to under the rules, I do hereby undertake to refund such excess.
         </div>
         <SigBlock />
      </div>

      {/* NON INVOLVEMENT */}
      <div className="mb-6 shrink-0">
         <div className="font-bold text-base uppercase underline mb-2">NON INVOLVEMENT CERTIFICATE</div>
         <div className="text-justify px-2 text-[11pt] leading-relaxed">
            Certified that Mr./Ms. <span className="font-bold uppercase">{employees.name}</span>, <span className="font-bold uppercase">{employees.designation}</span>, proceed to retirement w.e.f <span className="font-bold">{dor}</span>.
            <br/>
            He/She is not involved in any Criminal / Departmental / Anti-corruption or Police cases during the whole period of service.
         </div>
         <SigBlock />
      </div>

      {/* PAY STOPPAGE */}
      <div className="mb-6 shrink-0">
         <div className="font-bold text-base uppercase underline mb-2">PAY STOPPAGE CERTIFICATE</div>
         <div className="text-justify px-2 text-[11pt] leading-relaxed">
            Certified that the pay of Mr./Ms. <span className="font-bold uppercase">{employees.name}</span>, <span className="font-bold uppercase">{employees.designation}</span>, Personnel No <span className="font-bold">{employees.personal_no}</span>, has been stopped w.e.f <span className="font-bold">{dor}</span> (AN) consequence upon retirement.
         </div>
         <SigBlock />
      </div>

      {/* QUALIFYING SERVICE */}
      <div className="mb-6 shrink-0">
         <div className="font-bold text-base uppercase underline mb-2">QUALIFYING SERVICE CERTIFICATE</div>
         <div className="text-justify px-2 text-[11pt] leading-relaxed">
            Certified that Mr./Ms. <span className="font-bold uppercase">{employees.name}</span> has completed <span className="font-bold">{service.years}</span> Years <span className="font-bold">{service.months}</span> Months <span className="font-bold">{service.days}</span> Days as qualifying service for pension.
         </div>
         <SigBlock />
      </div>

      {/* Spacer */}
      <div className="flex-grow"></div>

      {/* Page Number */}
      <div className="text-center text-[9pt] text-gray-600 mt-2 shrink-0">Page 10</div>

    </div>
  );
};
