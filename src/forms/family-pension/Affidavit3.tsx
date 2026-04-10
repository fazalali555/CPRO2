import React from 'react';
import { EmployeeRecord } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface Props {
  employee: EmployeeRecord;
}

export const Affidavit3: React.FC<Props> = ({ employee }) => {
  const emp = employee.employees;
  const dor = formatDate(employee.service_history.date_of_retirement) || '';

  return (
    <div
      className="bg-white text-black font-serif print-page mx-auto relative leading-loose affidavit-legal"
      style={{
        width: '216mm',  // Legal width
        height: '356mm', // Legal height
        padding: '0 25mm',
        boxSizing: 'border-box'
      }}
    >
      {/* Reserved Top Space (blank in print, hint only on screen) */}
      <div style={{ height: '120mm', width: '100%' }}>
        <div className="flex items-end justify-center text-gray-300 border-b border-dashed border-gray-300 mb-8 no-print">
          <span className="mb-4">[ Space Reserved for Stamp Paper Header ~120mm ]</span>
        </div>
      </div>

      <div className="aff-content">
        <h1 className="text-center text-2xl font-bold uppercase underline mb-8 tracking-widest aff-title">
          AFFIDAVIT (NON-AVAILMENT)
        </h1>

        <div className="text-lg text-justify space-y-6">
          <p>
            I, <span className="font-bold uppercase underline decoration-dotted">{emp.name}</span>, CNIC
            <span className="font-bold font-mono underline decoration-dotted ml-1">{emp.cnic_no}</span>, do hereby solemnly affirm and declare that:
          </p>
          <ol className="list-decimal list-outside ml-10 space-y-4 font-medium">
            <li>
              I have not been taken / availed Leave Encashment (LPR) to date.
            </li>
            <li>
              I have not been taken / availed Employees Education Foundation (EEF) assistance to date.
            </li>
            <li>
              I have not been taken / availed Benevolent Fund (BF) assistance to date.
            </li>
            <li>
              I have not been taken / availed RB&amp;DC assistance to date.
            </li>
          </ol>
          <p>
            This declaration is made in good faith and for official record purposes. Date of Retirement:
            <span className="font-bold underline decoration-dotted ml-1">{dor}</span>.
          </p>
        </div>

        {/* Footer (signature) */}
        <div className="mt-16 flex justify-end aff-footer-grid">
          <div className="inline-block text-center w-72">
            <div className="border-b border-black font-bold uppercase pb-1 mb-2 text-lg">{emp.name}</div>
            <div className="font-bold">Deponent / Employee</div>
            <div className="text-sm mt-1">CNIC: {emp.cnic_no}</div>
          </div>
        </div>

        <div className="mt-16 text-center text-lg font-bold border-t-2 border-black pt-4 w-1/2 mx-auto aff-bottom">
          ATTESTED BY OATH COMMISSIONER
        </div>
      </div>
    </div>
  );
}
