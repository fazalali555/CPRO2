
import React from 'react';
import { EmployeeRecord } from '../../types';
import { Letterhead } from '../../components/Letterhead';
import { getCoverLetterInfo } from '../../utils';
import { format, parseISO } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
  type: string;
}

const formatDate = (dateStr?: string) => dateStr ? format(parseISO(dateStr), 'dd-MM-yyyy') : '__________';

export const NonDrawalCertificate: React.FC<Props> = ({ employee, type }) => {
  const { employees, service_history, financials } = employee;
  const { signatureTitle } = getCoverLetterInfo(employee);
  const dor = formatDate(service_history.date_of_retirement);
  
  const fundLabel = type === 'Employees Education Foundation' ? 'Employees Education Fund' : type;
  const fundName = fundLabel;

  return (
    <div className="bg-white text-black font-sans leading-relaxed relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '12mm', boxSizing: 'border-box' }}>
      
      <Letterhead employeeRecord={employee} />
      <div className="w-full border-t-4 border-black border-double mb-16"></div>

      {type === 'Contribution' ? (
        <>
          <div className="text-center mb-16">
            <h1 className="text-xl font-bold uppercase underline underline-offset-4">CONTRIBUTION CERTIFICATE</h1>
          </div>
          <div className="text-[18px] leading-[2.5] text-justify px-4 font-serif">
            <p>
              This is to certify that <span className="font-bold uppercase">Mr./Ms. {employees.name}</span> was a government servant in the Education Department, serving as <span className="font-bold uppercase">{employees.designation}</span> at <span className="font-bold uppercase">{employees.school_full_name}</span>, District {employees.district}.
            </p>
            <p className="mt-8">
              It is further certified that he/she was a regular contributor to the Benevolent Fund (BF) with a monthly contribution of <span className="font-bold">Rs. {financials.bf > 0 ? financials.bf : '_______'}/-</span> from the date of his/her appointment to the date of his/her retirement.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-16">
            <h1 className="text-xl font-bold uppercase underline underline-offset-4">NON-DRAWAL CERTIFICATE</h1>
          </div>
          <div className="text-[18px] leading-[2.5] text-justify px-4 font-serif">
            <p>
              Certified that <span className="font-bold uppercase">Mr./Ms. {employees.name}</span>, <span className="font-bold uppercase">{employees.designation} (BPS-{employees.bps})</span>, formerly posted at <span className="font-bold uppercase">{employees.school_full_name}</span>, has retired from Government Service on superannuation/premature basis w.e.f. <span className="font-bold">{dor}</span> (Please verify this year).
            </p>
            <p className="mt-8">
              It is further certified that the official has not drawn any Leave Preparatory to Retirement (LPR) or encashment in lieu of LPR for the period up to his retirement, nor has any such payment been released to him from this office to date.
            </p>
            <p className="mt-8">
              Nothing is outstanding against him in this regard.
            </p>
          </div>
        </>
      )}

      <div className="mt-auto flex justify-end pb-32 px-4">
        <div className="text-center w-72">
          <div className="h-10"></div>
          <div className="border-t border-black mb-4 w-full"></div>
          <p className="font-bold text-sm uppercase whitespace-pre-line">
            {signatureTitle}
          </p>
        </div>
      </div>
    </div>
  );
};
