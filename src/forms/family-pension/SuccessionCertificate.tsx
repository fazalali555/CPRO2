import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { formatDate, getCoverLetterInfo } from '../../utils';
import { calculatePension } from '../../lib/pension';
import { calculateServiceDuration } from '../../utils';
import { Letterhead } from '../../components/Letterhead';

interface Props {
  employee: EmployeeRecord;
  caseRecord?: CaseRecord;
}

export const SuccessionCertificate: React.FC<Props> = ({ employee }) => {
  const heirs = employee.family_members || [];
  const deathDate = employee.service_history.date_of_death || employee.service_history.date_of_retirement;
  const ben = employee.extras?.beneficiary || {};
  const { signatureTitle } = getCoverLetterInfo(employee);

  // Pension Calculations
  const service = calculateServiceDuration(
    employee.service_history.date_of_appointment,
    employee.service_history.date_of_retirement || new Date().toISOString(),
    employee.service_history.lwp_days
  );

  let qService = service.years;
  if (service.months >= 6) qService += 1;

  const pensionCalc = calculatePension({
    basicPay: employee.financials.last_basic_pay,
    personalPay: employee.financials.personal_pay || 0,
    qualifyingServiceYears: qService,
    ageAtRetirement: 60 // Default age, adjustment might be needed based on actual age logic
  });

  return (
    <div className="bg-white text-black font-sans relative print-page mx-auto flex flex-col"
      style={{ width: '210mm', height: '297mm', padding: '8mm', boxSizing: 'border-box' }}>
      
      <Letterhead employeeRecord={employee} />

      <div className="flex justify-between items-end mb-6 font-bold text-base">
         <div className="flex items-end gap-2">
            <span>No.</span>
            <div className="border-b border-black w-48"></div>
         </div>
         <div className="flex items-end gap-2">
            <span>Dated:</span>
            <div className="border-b border-black w-12 text-center"></div>
            <span>/</span>
            <div className="border-b border-black w-12 text-center"></div>
            <span>/{new Date().getFullYear()}</span>
         </div>
      </div>

      <div className="mb-6">
         <div className="font-bold text-lg mb-1">To:</div>
         <div className="pl-16 font-bold text-base leading-snug">
            The Assistant Director,<br/>
            National Database and Registration Authority (NADRA),<br/>
            District {employee.employees.district}
         </div>
      </div>

      <div className="flex mb-6 text-base">
        <span className="font-bold w-24 flex-shrink-0">Subject:</span>
        <span className="font-bold underline decoration-1 underline-offset-4 uppercase">
           ISSUANCE OF SUCCESSION CERTIFICATE IN RESPECT OF LATE MR. {employee.employees.name}
        </span>
      </div>

      <div className="mb-4 font-bold text-base">Respected Sir,</div>

      <div className="text-justify leading-relaxed text-[11pt] space-y-4 mb-4">
        <p>
          It is respectfully submitted that <span className="font-bold">Mr. {employee.employees.name} S/O {employee.employees.father_name}</span>, 
          CNIC No. {employee.employees.cnic_no}, was serving as <span className="font-bold">{employee.employees.designation} {employee.employees.school_full_name}</span>, 
          under the administrative control of this office.
        </p>
        <p>
          The said official was <span className="font-bold">born on {formatDate(employee.employees.dob)}</span>, 
          appointed on <span className="font-bold">{formatDate(employee.service_history.date_of_appointment)}</span>, 
          and retired from government service on <span className="font-bold">{formatDate(employee.service_history.date_of_retirement)}</span>. 
          he has passed away (death certificate enclosed).
        </p>
        <p>
           At the time of his retirement and demise, the following benefits were associated with his name:
        </p>
        
        <ul className="list-disc pl-12 font-bold space-y-1">
           <li>Last Drawn Pay/Emoluments: Rs. {pensionCalc.grossPension ? Math.round(employee.financials.last_basic_pay).toLocaleString() : '-'}</li>
           <li>Gross Pension: Rs. {pensionCalc.grossPension ? Math.round(pensionCalc.grossPension).toLocaleString() : '-'}</li>
           <li>Net Pension: Rs. {pensionCalc.netPension ? Math.round(pensionCalc.netPension).toLocaleString() : '-'}</li>
           <li>Commutation Amount: Rs. {pensionCalc.commutationLumpSum ? Math.round(pensionCalc.commutationLumpSum).toLocaleString() : '-'}</li>
           <li>Benevolent Fund, Group Insurance, and other benefits: As per admissibility</li>
        </ul>

        <p>
           In order to process the <span className="font-bold">family pension (death after retirement)</span>, 
           the legal heirs of the deceased are required to furnish a <span className="font-bold">Succession Certificate</span> issued by your esteemed office.
        </p>

        <p>
           It is therefore requested that the application for <span className="font-bold">Succession Certificate</span> submitted by the 
           legal heirs of the deceased may kindly be processed on priority basis,
        </p>

        <p>
           This letter is issued upon the request of the legal heirs for the purpose of obtaining a <span className="font-bold">Succession Certificate required of family pension</span>.
        </p>
      </div>

      {/* Footer Signature */}
      <div className="mt-auto flex justify-end">
        <div className="text-center w-64">
           <div className="border-t border-black pt-2 font-bold text-sm whitespace-pre-wrap">
              {signatureTitle}
           </div>
        </div>
      </div>

      <div className="mt-4 text-xs italic">
         <div className="font-bold mb-1">Copy for the information: -</div>
         <ol className="list-decimal pl-5 space-y-0.5">
            <li>Legal Heirs of Late {employee.employees.name} (Through bearer)</li>
            <li>Office File</li>
         </ol>
      </div>

    </div>
  );
};
