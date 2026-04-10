
import React from 'react';
import { EmployeeRecord } from '../../types';

interface Props {
  employee: EmployeeRecord;
}

export const Affidavit2: React.FC<Props> = ({ employee }) => {
  const ben = employee.extras?.beneficiary || {};
  const emp = employee.employees;
  const bankName = emp.bank_name || 'National Bank Of Pakistan';
  const branchName = emp.branch_name || '';
  const branchCode = emp.branch_code || '';
  const accountNo = ben.account_no || emp.bank_ac_no || '';

  return (
    <div className="bg-white text-black font-serif print-page mx-auto relative leading-loose affidavit-legal" 
      style={{ 
        width: '216mm',  // Legal Width
        height: '356mm', // Legal Height
        padding: '0 25mm',
        boxSizing: 'border-box' 
      }}>
      
      {/* Reserved Top Space (blank in print, hint only on screen) */}
      <div style={{ height: '120mm', width: '100%' }}>
        <div className="flex items-end justify-center text-gray-300 border-b border-dashed border-gray-300 mb-8 no-print">
           <span className="mb-4">[ Space Reserved for Stamp Paper Header ~120mm ]</span>
        </div>
      </div>

      <div className="aff-content">
        <h1 className="text-center text-2xl font-bold uppercase underline mb-10 tracking-widest aff-title">INDEMNITY BOND</h1>

        <div className="mb-6 text-lg leading-normal">
          <div>To,</div>
          <div>The Manager,</div>
          <div className="uppercase underline decoration-dotted">{bankName}</div>
          {branchName && <div className="uppercase underline decoration-dotted">Branch: {branchName}</div>}
          {branchCode && <div className="uppercase underline decoration-dotted">Branch Code: {branchCode}</div>}
        </div>

        <div className="text-lg text-justify space-y-6">
          <p>
            In compliance with the State Bank of Pakistan / Government instructions for payment of pension through your Bank branch, 
            I, <span className="font-bold uppercase underline decoration-dotted">{ben.name}</span> {ben.relation || 'Widow'} of Late <span className="font-bold uppercase underline decoration-dotted">{employee.employees.name}</span>, 
            holder of CNIC No <span className="font-bold font-mono underline decoration-dotted">{ben.cnic}</span>, resident of <span className="uppercase underline decoration-dotted">{employee.employees.address}</span>, 
            agree to indemnify you and keep you indemnified about liabilities with all sums of money whatsoever including the mark-up of my Pension Account.
          </p>
          <p>
            I further undertake that my legal heirs, successors, and executors shall be liable to refund the excess amount, if any, credited to my Pension Account 
            either in full or in installments equal to such excess amount.
          </p>
          <p>
            This bond is executed today on <span className="font-bold underline decoration-dotted">{new Date().toLocaleDateString('en-GB')}</span>.
          </p>
        </div>

        {/* Footer Grid */}
        <div className="mt-20 grid grid-cols-2 gap-y-16 gap-x-8 aff-footer-grid">
           {/* Executant */}
           <div className="col-span-2 text-right mb-4">
              <div className="inline-block text-center w-72">
                 <div className="border-b border-black font-bold uppercase pb-1 mb-2 text-lg">{ben.name}</div>
                 <div className="font-bold">Signature of Pensioner / Widow</div>
                  <div className="text-sm mt-1">Account No: {accountNo}</div>
              </div>
           </div>

           {/* Witness 1 */}
           <div>
              <div className="font-bold mb-4 underline">Witness-1</div>
              <div className="border-b border-black mb-2 w-full"></div>
              <div className="text-sm space-y-1">
                 <div>Name: ______________________</div>
                 <div>CNIC: ______________________</div>
                 <div>Sig: _______________________</div>
              </div>
           </div>

           {/* Witness 2 */}
           <div>
              <div className="font-bold mb-4 underline">Witness-2</div>
              <div className="border-b border-black mb-2 w-full"></div>
              <div className="text-sm space-y-1">
                 <div>Name: ______________________</div>
                 <div>CNIC: ______________________</div>
                 <div>Sig: _______________________</div>
              </div>
           </div>
        </div>

        <div className="mt-20 text-center text-lg font-bold border-t-2 border-black pt-4 w-1/2 mx-auto aff-bottom">
           ATTESTED BY BANK MANAGER
        </div>
      </div>
    </div>
  );
};
