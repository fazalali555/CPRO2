
import React from 'react';
import { EmployeeRecord } from '../../types';
import { format, parseISO } from 'date-fns';
import { getHeadOfInstitutionTitle } from '../../utils';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try { return format(parseISO(dateStr), 'dd-MM-yyyy'); } catch { return dateStr; }
};

export const PensionUndertaking: React.FC<Props> = ({ employee }) => {
  const { service_history, employees } = employee;
  const dor = formatDate(service_history.date_of_retirement);
  
  // Safe Accessors with Line Fallbacks (No 'N/A')
  const district = employees.district || '________________';
  const schoolName = employees.school_full_name || '________________';
  const empName = employees.name || '________________';

  // Get signature title for head of institution
  const headTitle = getHeadOfInstitutionTitle(employee) || 'Head of Institution';
  const isSDEO = headTitle.includes('SDEO') || headTitle.includes('Sub Divisional Education Officer');
  const signatureTitle = isSDEO
    ? headTitle 
    : `${headTitle}\n${schoolName}`;

  const rawCommutation = (employee as any).extras?.commutation_portion;
  let commutationPercent = typeof rawCommutation === 'number' && isFinite(rawCommutation) ? rawCommutation : 35;
  commutationPercent = Math.max(0, Math.min(35, Number(commutationPercent)));
  const commutationText = `${commutationPercent}%`;

  return (
    <div className="bg-white text-black font-serif text-[11pt] leading-relaxed relative print-page mx-auto flex flex-col"
      style={{ 
        width: '210mm', 
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        padding: '10mm 12mm 10mm 20mm', 
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
      
      {/* Header */}
      <div className="text-center font-bold mb-6 shrink-0">
        <div className="text-lg border-2 border-black rounded-full w-9 h-9 flex items-center justify-center mx-auto mb-2 font-bold">3</div>
        <div className="underline text-lg uppercase tracking-wide">UNDERTAKING</div>
      </div>

      {/* Body Points - with styled numbering */}
      <div className="space-y-3 text-justify leading-relaxed grow">
         <div className="flex gap-3">
            <span className="font-bold text-base shrink-0 w-6">1.</span>
            <p>
               I hereby declare that I am not in receipt of any other pension, military or otherwise, except PPO No. <span className="inline-block w-24 border-b border-black"></span> dated <span className="inline-block w-24 border-b border-black"></span> amount <span className="inline-block w-24 border-b border-black"></span> department Elementary & Secondary Education. I retired on <span className="font-bold border-b border-black px-2">{dor}</span>.
            </p>
         </div>

         <div className="flex gap-3">
            <span className="font-bold text-base shrink-0 w-6">2.</span>
            <p>
               I do hereby undertake that the pension sanctioning authority may, within one year from the issue of Pension Payment Order, recover any of its dues from the pension granted to me.
            </p>
         </div>

         <div className="flex gap-3">
            <span className="font-bold text-base shrink-0 w-6">3.</span>
            <p>
               I hereby declare that I shall not take part in any elections or engage myself in political activities of any kind within two years from the date of retirement.
            </p>
         </div>

         <div className="flex gap-3">
            <span className="font-bold text-base shrink-0 w-6">4.</span>
            <p>
               I do hereby declare that I have neither applied for nor received any pension/commutation/gratuity in respect of any portion of the service included in this application and in respect of which pension/gratuity/commutation is claimed herein, nor shall I submit any application hereafter without quoting a reference to this application and to the order which may be passed thereon.
            </p>
         </div>

         <div className="flex gap-3">
            <span className="font-bold text-base shrink-0 w-6">5.</span>
            <p>
               I hereby undertake to refund the amount of pension granted to me if afterwards found to be in excess of that to which I am entitled under regulations.
            </p>
         </div>

         <div className="flex gap-3">
            <span className="font-bold text-base shrink-0 w-6">6.</span>
            <p>
               I do hereby declare that I have not received any pension or commutation/gratuity in respect of any portion of the service included in this application.
            </p>
         </div>

         <div className="flex gap-3">
            <span className="font-bold text-base shrink-0 w-6">7.</span>
            <p>
               I hereby opt for commutation @ <span className="font-bold border-b border-black px-2">{commutationText}</span> (subject to a maximum of 35%) of my gross pension.
            </p>
         </div>
      </div>

      {/* Signature Section - Employee signature above line */}
      <div className="mt-6 mb-6 flex justify-between items-end shrink-0">
         <div className="mb-2">
            <strong>DATED:</strong> _________________
         </div>
         <div className="text-center w-64">
            <div className="font-bold uppercase text-[10pt] mb-1">{empName}</div>
            <div className="h-1"></div>
            <div className="border-t border-black mb--1 pt-1"></div>
            <div className="text-[9pt] uppercase font-bold leading-tight">NAME AND SIGNATURE OF<br/>RETIRING CIVIL SERVANT</div>
         </div>
      </div>

      {/* Head of Department Certificate */}
      <div className="mt-1 border-t-2 border-black pt-3 shrink-0">
         <div className="text-center uppercase font-bold mb-16 px-4 leading-relaxed text-[10pt]">
            Certificate by the head of department under sub rule (7) of rule 23 of these rules
         </div>
         
         <div className="flex justify-end mb-4">
            <div className="text-center w-64">
               <div className="h-12"></div>
               <div className="border-t border-black pt-1 mb-1"></div>
               <div className="font-bold uppercase text-[10pt] leading-tight whitespace-pre-line">{signatureTitle}</div>
            </div>
         </div>

         {/* Important Note Footer */}
         <div className="border border-black p-2 text-[9pt] font-bold bg-gray-50 print:bg-transparent text-justify leading-snug">
            <span className="uppercase underline mr-1">Note:</span> Pension to be verified by pension sanctioning authority/DDO.
            <br/>
            <span className="uppercase underline mr-1">Important:</span> Every pensioner/family pensioner is bound to provide life certificate/Non-marriage certificate to his/her bank on or before 10th March and 10th September of each year.
         </div>
      </div>

      {/* Page Number */}
      <div className="text-center text-[9pt] text-gray-600 mt-2 shrink-0">Page 3</div>

    </div>
  );
};
