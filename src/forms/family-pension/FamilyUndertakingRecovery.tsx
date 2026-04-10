
import React from 'react';
import { EmployeeRecord } from '../../types';

interface Props {
  employee: EmployeeRecord;
}

export const FamilyUndertakingRecovery: React.FC<Props> = ({ employee }) => {
  return (
    <div className="bg-white text-black font-sans relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
      
      <div className="text-center mb-8">
         <h1 className="text-lg font-bold uppercase underline">UNDERTAKING</h1>
      </div>
      <div className="text-lg leading-relaxed text-justify mb-12 font-serif">
         Should the amount of Pension/Gratuity Granted to me be after awards found to be in excess of that to which I am entitle under the rule I hereby undertake to refund my such excess.
      </div>

      <div className="text-center mb-8">
         <h1 className="text-lg font-bold uppercase underline">UNDERTAKING FOR RECOVERY OF GOVERNMENT DUES</h1>
      </div>
      <div className="text-lg leading-relaxed text-justify mb-12 font-serif">
         I do hereby undertake & give my consent to the recovery of any Government dues found outstanding against me on account of Pay & allowances or any other item of payment during service, from any Gratuity, Pension etc admissible to me under the rules.
      </div>

      <div className="text-center mb-8">
         <h1 className="text-lg font-bold uppercase underline">DECLARATION UNDER ARTICLE-920 CSR</h1>
      </div>
      <div className="text-lg leading-relaxed text-justify mb-12 font-serif">
         I do hereby declare that in case the amount of Pension / Gratuity sanctioned to me is found to be in excess of that to which I am entitled to under the rules, I do hereby undertake to refund such excess, which called upon to do so.
      </div>

      <div className="mt-auto flex justify-between items-end pb-24 px-8">
         <div className="font-bold uppercase mb-12 text-lg">C/Signed By DDO</div>
         <div className="text-center w-96">
            <div className="h-24 border-b-2 border-black mb-4"></div>
            <div className="font-bold text-xl uppercase mb-2">{employee.extras?.beneficiary?.name}</div>
            <div className="text-lg font-medium mb-2">Widow of {employee.employees.name} {employee.employees.designation}</div>
            <div className="text-lg font-medium uppercase">{employee.employees.school_full_name}</div>
         </div>
      </div>
    </div>
  );
};
