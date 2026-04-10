
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { calculateServiceDuration } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const FinancialAssistanceApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history, financials, family_members } = employee;

  const deathSource = service_history.date_of_death || service_history.date_of_retirement;
  const deathDate = formatDate(deathSource) || '__________';
  const dob = formatDate(employees.dob) || '__________';
  const doa = formatDate(service_history.date_of_appointment) || '__________';
  const service = calculateServiceDuration(
    service_history.date_of_appointment,
    deathSource,
    service_history.lwp_days || 0
  );
  const serviceText = `${service.years} Years ${service.months} Months ${service.days} Days`;
  const basicPay = Math.round(Number(financials.basic_pay ?? financials.last_basic_pay ?? 0));
  const claimText = 'Rs. 1,200,000/- Twelve Lac Only';
  const cnicDigits = (employees.cnic_no || '').replace(/\D/g, '').padEnd(13, ' ').slice(0, 13).split('');
  const dependents = (family_members || []).filter(fm => (fm.relative_name || '').trim().length > 0);
  const address = employees.address || `Village ${employees.tehsil || ''}, District ${employees.district || ''}`.trim();

  return (
    <div className="bg-white text-black font-sans">
      <div className="print-page fit-page mx-auto bg-white block px-[8mm] py-[7mm]" style={{ width: '210mm', height: '297mm', overflow: 'hidden' }}>
        <h1 className="text-center text-[8mm] font-bold underline leading-tight">
          APPLICATION FORM FOR THE GRANT OF FINANCIAL ASSISTANCE TO THE GOVERNMENT SERVANTS DIED DURING SERVICE
        </h1>

        <table className="w-full border border-black border-collapse mt-[3mm] text-[4.3mm] leading-tight">
          <tbody>
            {[
              ['1', 'Name of Govt. Servant', employees.name || ''],
              ['2', 'Father’s Name', employees.father_name || ''],
              ['3', 'Designation', employees.designation || ''],
              ['4', 'Pay Scale', employees.bps ? `BPS - ${employees.bps}` : ''],
              ['5', 'Pay at the time of death', basicPay ? basicPay.toLocaleString('en-PK') : ''],
              ['6', 'Post held at the time of death', employees.school_full_name || employees.office_name || ''],
            ].map(([no, label, value]) => (
              <tr key={no}>
                <td className="border border-black w-[6mm] text-center">{no}</td>
                <td className="border border-black px-[2mm]">{label}</td>
                <td className="border border-black px-[2mm]">{value}</td>
              </tr>
            ))}
            <tr>
              <td className="border border-black text-center">7</td>
              <td className="border border-black px-[2mm]">CNIC No. of the Govt. Servant</td>
              <td className="border border-black px-[2mm]">
                <div className="flex gap-[1mm]">
                  {cnicDigits.map((d, i) => (
                    <span key={i} className="inline-flex border border-black w-[5.7mm] h-[6.2mm] items-center justify-center text-[4.2mm]">
                      {d.trim()}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
            {[
              ['8', 'Date of Birth', dob],
              ['9', 'Date of 1st Appointment', doa],
              ['10', 'Date of Death', deathDate],
              ['11', 'Length of Service', serviceText],
              ['12', 'Amount of claim admissible under the rule', claimText],
              ['13', 'Present Address', address],
              ['14', 'Permanent Address', address],
            ].map(([no, label, value]) => (
              <tr key={no}>
                <td className="border border-black text-center">{no}</td>
                <td className="border border-black px-[2mm]">{label}</td>
                <td className="border border-black px-[2mm]">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-center border border-black border-t-0 font-bold text-[5.2mm] py-[1mm]">
          Details of dependent(s)/ Legal Heirs with their name and age
        </div>

        <table className="w-full border border-black border-collapse border-t-0 text-[4.3mm] leading-tight">
          <thead>
            <tr>
              <th className="border border-black w-[8mm]">S#</th>
              <th className="border border-black text-left px-[2mm]">Name</th>
              <th className="border border-black w-[24mm]">Age</th>
              <th className="border border-black w-[30mm]">Marital Status</th>
              <th className="border border-black w-[32mm]">Relationship</th>
            </tr>
          </thead>
          <tbody>
            {dependents.length > 0 ? dependents.map((fm, idx) => {
              const ageText = fm?.dob ? formatDate(fm.dob) : String(fm?.age || '');
              return (
                <tr key={idx}>
                  <td className="border border-black text-center">{idx + 1}</td>
                  <td className="border border-black px-[2mm]">{fm?.relative_name || ''}</td>
                  <td className="border border-black text-center">{ageText}</td>
                  <td className="border border-black text-center">{fm?.marital_status || ''}</td>
                  <td className="border border-black text-center">{fm?.relation || ''}</td>
                </tr>
              );
            }) : (
              <tr>
                <td className="border border-black text-center">1</td>
                <td className="border border-black px-[2mm]"></td>
                <td className="border border-black text-center"></td>
                <td className="border border-black text-center"></td>
                <td className="border border-black text-center"></td>
              </tr>
            )}
          </tbody>
        </table>

        <p className="mt-[10mm] text-[4.8mm]">
          I do hereby solemnly affirm and verify that the content of the above application is true to the best of my knowledge and nothing has been concealed.
        </p>

        <div className="flex justify-end mt-[8mm]">
          <div className="w-[55mm] text-center">
            <div className="border-t border-black"></div>
            <div className="text-[4.7mm] mt-[1mm]">Name and signature of applicant</div>
          </div>
        </div>

        <p className="mt-[5mm] text-[4.8mm]">
          I certfy and attest the details furnished above on the record available in this office
        </p>

        <div className="mt-[18mm] flex justify-between">
          <div className="w-[46mm] text-center">
            <div className="border-t border-black"></div>
            <div className="text-[5mm] mt-[1mm] leading-tight">Name of head</div>
            <div className="text-[5mm] leading-tight">Office/department</div>
            <div className="text-[5mm] leading-tight">With office seal</div>
          </div>
          <div className="w-[58mm] text-center">
            <div className="border-t border-black"></div>
            <div className="text-[5mm] mt-[1mm] leading-tight">Name of head</div>
            <div className="text-[5mm] leading-tight">Department/Administration</div>
            <div className="text-[5mm] leading-tight">With office seal</div>
          </div>
        </div>
      </div>
    </div>
  );
};
