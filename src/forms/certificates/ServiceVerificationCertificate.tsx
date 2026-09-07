import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { calculateServiceDuration } from '../../utils';

interface Props {
  employee?: EmployeeRecord;
  caseRecord?: CaseRecord;
}

export const ServiceVerificationCertificate: React.FC<Props> = ({ employee, caseRecord }) => {
  const emp = employee?.employees || ({} as any);
  const service = employee?.service_history || ({} as any);

  const doa = service.date_of_appointment || '';
  const dor = service.date_of_retirement || '';
  const lwp = service.lwp_days || 0;
  const regDate = service.date_of_regularization || doa;

  const totalDur = calculateServiceDuration(doa, dor, 0);
  const netDur = calculateServiceDuration(doa, dor, lwp);

  return (
    <div
      className="bg-white text-black font-serif text-sm leading-normal relative print-page mx-auto shadow-md border border-gray-300 print:border-none print:shadow-none"
      style={{ width: '210mm', minHeight: '297mm', padding: '15mm 15mm 15mm 20mm', boxSizing: 'border-box' }}
    >
      <div className="text-center mb-8">
        <h2 className="text-lg font-bold uppercase border-b-2 border-black pb-1 inline-block">
          GOVERNMENT OF KHYBER PAKHTUNKHWA
        </h2>
        <p className="text-base font-bold uppercase mt-1">
          {emp.office_name || emp.school_full_name || 'DEPARTMENT OF EDUCATION'}
        </p>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mt-1">
          District {emp.district || 'Battagram'}
        </p>
      </div>

      <div className="text-center my-6">
        <h3 className="text-xl font-bold uppercase underline tracking-wider">
          CERTIFICATE OF QUALIFYING SERVICE
        </h3>
        <p className="text-xs italic mt-1">(Issued under KP Civil Servants Pension Rules, 2021)</p>
      </div>

      <div className="my-8 leading-relaxed text-justify space-y-4 px-2">
        <p>
          It is certified that <span className="font-bold border-b border-black px-2">{emp.name || '________________________'}</span>, 
          holding the post of <span className="font-bold border-b border-black px-2">{emp.designation || '________________________'}</span> (BPS-<span className="font-bold">{emp.bps || '16'}</span>), 
          Personal No. <span className="font-bold border-b border-black px-2">{emp.personal_no || '___________'}</span>, 
          CNIC No. <span className="font-bold border-b border-black px-2">{emp.cnic_no || '_________________'}</span>, 
          has rendered continuous government service as per service book records as detailed below:
        </p>

        <table className="w-full border border-black text-xs my-6 border-collapse">
          <tbody>
            <tr className="border-b border-black bg-gray-50 print:bg-transparent">
              <td className="p-2.5 font-bold w-1/2 border-r border-black">1. Date of First Appointment:</td>
              <td className="p-2.5 font-mono font-bold">{doa || 'N/A'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2.5 font-bold border-r border-black">2. Date of Regularization (if applicable):</td>
              <td className="p-2.5 font-mono font-bold">{regDate || 'N/A'}</td>
            </tr>
            <tr className="border-b border-black bg-gray-50 print:bg-transparent">
              <td className="p-2.5 font-bold border-r border-black">3. Date of Retirement / Superannuation:</td>
              <td className="p-2.5 font-mono font-bold">{dor || 'N/A'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="p-2.5 font-bold border-r border-black">4. Total Gross Service Duration:</td>
              <td className="p-2.5 font-bold">{totalDur.text}</td>
            </tr>
            <tr className="border-b border-black bg-gray-50 print:bg-transparent">
              <td className="p-2.5 font-bold border-r border-black">5. Non-Qualifying Service (LWP / Interruption):</td>
              <td className="p-2.5 font-bold">{lwp} Days</td>
            </tr>
            <tr className="border-b border-black font-bold text-sm bg-gray-100 print:bg-transparent">
              <td className="p-2.5 border-r border-black">6. NET QUALIFYING SERVICE FOR PENSION:</td>
              <td className="p-2.5 font-mono text-emerald-900 dark:text-black">{netDur.text}</td>
            </tr>
          </tbody>
        </table>

        <p>
          2. It is further certified that no departmental inquiry, judicial proceedings, or audit recovery is pending against the aforementioned official as per available record.
        </p>
      </div>

      <div className="mt-20 flex justify-between items-end text-xs font-bold pt-8">
        <div className="text-center">
          <div className="h-12"></div>
          <div className="border-t border-black pt-1 px-6">Signature of Verifying Official</div>
        </div>
        <div className="text-center">
          <div className="h-12"></div>
          <div className="border-t border-black pt-1 px-6">Countersigned by Head of Office / DDO</div>
          <div className="text-[10px] font-normal text-gray-600 mt-1">(Seal & Stamp)</div>
        </div>
      </div>
    </div>
  );
};
