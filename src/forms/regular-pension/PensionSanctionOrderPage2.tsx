
import React from 'react';
import { EmployeeRecord } from '../../types';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../utils';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try { return format(parseISO(dateStr), 'dd-MM-yyyy'); } catch { return dateStr; }
};

export const PensionSanctionOrderPage2: React.FC<Props> = ({ employee }) => {
  const { employees, service_history, extras, financials } = employee;
  const dor = formatDate(service_history.date_of_retirement);

  // Calculate Recoveries
  const recoveries = [];
  if (extras?.hba_balance > 0) recoveries.push(`HBA`);
  if (extras?.gpf_adv_balance > 0) recoveries.push(`GPF Advance`);
  if (financials?.recovery > 0) recoveries.push(`Govt Dues`);

  const totalRecoveryAmount = (extras?.hba_balance || 0) + 
                              (extras?.gpf_adv_balance || 0) + 
                              (extras?.recovery_overpayment_pay || 0) + 
                              (extras?.recovery_overpayment_allow || 0) + 
                              (extras?.recovery_income_tax || 0) +
                              (financials?.recovery || 0);

  const recoveryText = totalRecoveryAmount > 0 
    ? `on account of ${recoveries.join(' / ')} is outstanding which may be recovered from the pension/gratuity.` 
    : `on account of HBA/MCA/etc is outstanding.`;

  return (
    <div className="bg-white text-black font-serif text-[11pt] leading-normal relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm 15mm 15mm 25mm', boxSizing: 'border-box' }}>
      
      <div className="text-center font-bold mb-4">
        <div className="text-xl border-2 border-black rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">5</div>
      </div>

      <div className="text-justify leading-loose mb-6">
         <p className="mb-4">
            (ii) An amount of <span className="font-bold border-b border-black px-2 min-w-[100px] inline-block text-center">Rs. {totalRecoveryAmount > 0 ? formatCurrency(totalRecoveryAmount).replace('PKR', '').trim() : 'NIL'}</span> {recoveryText}
         </p>
         <p className="mb-4">5) Anticipatory pension up to <span className="font-bold border-b border-black px-2">80%</span> of full pension is sanctioned as admissible to him/her (if applicable).</p>
         <p>6) Certified that no deficiency/disciplinary/criminal case is pending against the aforementioned retired government servant. Therefore, final pension payment and commutation amounting to 35% is hereby sanctioned.</p>
      </div>

      <div className="text-justify leading-loose mb-6 p-4 border border-black bg-gray-50 print:bg-transparent">
         Undersigned is satisfied that the service of retiring employee has been satisfactory. Administrative and financial sanction for grant of pension/commutation @35% is hereby accorded in favor of <span className="font-bold uppercase">{employees.name}</span>. Payment may be made through <span className="font-bold uppercase">{employees.bank_name}</span>, <span className="font-bold uppercase">{employees.branch_name}</span>, Account No <span className="font-bold font-mono">{employees.bank_ac_no}</span>.
      </div>

      <div className="text-justify leading-loose mb-6">
         8) The undersigned is satisfied that the services of Mr./Mrs./Ms. <span className="font-bold uppercase">{employees.name}</span> has been satisfactory.
         <div className="ml-8 mt-2 space-y-2 text-sm">
            <div className="flex gap-2"><span>i)</span> <span>Reduction in pension: <span className="font-bold">NIL</span></span></div>
            <div className="flex gap-2"><span>ii)</span> <span>Reduction in gratuity: <span className="font-bold">NIL</span></span></div>
         </div>
      </div>

      <div className="mb-6">
         9) The payment of pension shall commence w.e.f <span className="font-bold border-b border-black px-2">{dor}</span>.
      </div>

      <div className="mb-8 border-t border-black pt-4">
         <div className="font-bold underline mb-2">Documents Attached:</div>
         <div className="grid grid-cols-2 gap-2 text-xs">
            <span>1. Pension application.</span>
            <span>7. Three attested photographs.</span>
            <span>2. Notification of retirement.</span>
            <span>8. List of family members.</span>
            <span>3. Last Pay Certificate (LPC).</span>
            <span>9. Specimen signatures/Thumb impression.</span>
            <span>4. Non-Involvement Certificate.</span>
            <span>10. Option for commutation.</span>
            <span>5. Original Service Book.</span>
            <span>11. Bank account details (DCS).</span>
            <span>6. No Demand Certificate.</span>
            <span>12. CNIC Copy.</span>
         </div>
      </div>

      {/* Signature Blocks - Restored Left Side as requested */}
      <div className="mt-auto flex justify-between items-end pb-8">
         
         {/* Left Side Signature */}
         <div className="text-center w-64">
            <div className="h-16"></div>
            <div className="border-t border-black pt-2 font-bold text-sm">
               SUPERINTENDENT / ASSISTANT
            </div>
         </div>

         {/* Right Side Signature */}
         <div className="text-center w-64">
            <div className="h-16"></div>
            <div className="border-t border-black pt-2 font-bold text-sm">
               SIGNATURE WITH STAMP<br/>
               PENSION SANCTIONING AUTHORITY
            </div>
         </div>
      </div>
      
    </div>
  );
};
