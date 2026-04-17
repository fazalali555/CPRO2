import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import {
  calculateServiceDuration,
  formatCurrency,
  getBeneficiaryDetails,
  getDepartmentInfo,
} from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const FinancialAssistanceApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history, financials, family_members } = employee;

  const deptInfo = getDepartmentInfo(
    employees.school_full_name || '',
    employees.office_name || '',
    employees.tehsil || '',
    employees.district || '',
    employees.designation_full || employees.designation || ''
  );

  const beneficiary = getBeneficiaryDetails(employee);

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

  const basicPay = Math.round(
    Number(financials.basic_pay ?? (financials as any).last_basic_pay ?? 0)
  );

  const claimAmount =
    Number(
      caseRecord.extras?.claim_amount ||
      caseRecord.extras?.amount_claim ||
      caseRecord.extras?.amount_requested ||
      1200000
    ) || 1200000;

  const claimText = `${formatCurrency(claimAmount).replace('PKR', 'Rs.').trim()} Only`;

  const cnicDigits = (employees.cnic_no || '')
    .replace(/\D/g, '')
    .padEnd(13, ' ')
    .slice(0, 13)
    .split('');

  const dependents = (family_members || []).filter(
    (fm) => (fm.relative_name || '').trim().length > 0
  );

  const address =
    employees.address ||
    `District ${employees.district || ''}${employees.tehsil ? `, Tehsil ${employees.tehsil}` : ''}`;

  const officeHeadTitle = deptInfo.signatureTitleShort || 'Head of Office';
  const authorityLines = (deptInfo.authorityTitle || 'Head of Department').split('\n');

  const applicantName = beneficiary.name || '________________';
  const applicantRelation = beneficiary.relation || '________________';

  return (
    <div className="bg-white text-black font-serif">
      <div
        className="print-page fit-page mx-auto bg-white"
        style={{
          width: '210mm',
          height: '297mm',
          padding: '8mm 9mm 7mm 14mm',
          boxSizing: 'border-box',
          overflow: 'hidden',
          fontFamily: 'Times New Roman, serif',
        }}
      >
        {/* Heading */}
        <h1
          className="text-center font-bold underline leading-tight"
          style={{ fontSize: '7.1mm', marginBottom: '2.5mm' }}
        >
          APPLICATION FORM FOR GRANT OF FINANCIAL ASSISTANCE
          <br />
          TO THE GOVERNMENT SERVANT WHO DIED DURING SERVICE
        </h1>

        {/* Main particulars */}
        <table
          className="w-full border border-black border-collapse"
          style={{ fontSize: '4.05mm', lineHeight: '1.25' }}
        >
          <tbody>
            {[
              ['1', 'Name of Government Servant', employees.name || ''],
              ['2', 'Father’s Name', employees.father_name || ''],
              ['3', 'Designation', employees.designation_full || employees.designation || ''],
              ['4', 'Pay Scale', employees.bps ? `BPS-${employees.bps}` : ''],
              ['5', 'Pay at the time of death', basicPay ? basicPay.toLocaleString('en-PK') : ''],
              ['6', 'Post held at the time of death', employees.school_full_name || employees.office_name || ''],
            ].map(([no, label, value]) => (
              <tr key={no}>
                <td className="border border-black text-center" style={{ width: '7mm', padding: '1mm' }}>
                  {no}
                </td>
                <td className="border border-black px-[2mm]" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                  {label}
                </td>
                <td className="border border-black px-[2mm]" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                  {value}
                </td>
              </tr>
            ))}

            <tr>
              <td className="border border-black text-center" style={{ padding: '1mm' }}>
                7
              </td>
              <td className="border border-black px-[2mm]" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                CNIC No. of the Government Servant
              </td>
              <td className="border border-black px-[2mm]" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                <div className="flex gap-[0.8mm]">
                  {cnicDigits.map((d, i) => (
                    <span
                      key={i}
                      className="inline-flex border border-black items-center justify-center"
                      style={{
                        width: '5.3mm',
                        height: '5.8mm',
                        fontSize: '3.9mm',
                      }}
                    >
                      {d.trim()}
                    </span>
                  ))}
                </div>
              </td>
            </tr>

            {[
              ['8', 'Date of Birth', dob],
              ['9', 'Date of First Appointment', doa],
              ['10', 'Date of Death', deathDate],
              ['11', 'Length of Service', serviceText],
              ['12', 'Amount of claim admissible under the rules', claimText],
              ['13', 'Present Address', address],
              ['14', 'Permanent Address', address],
            ].map(([no, label, value]) => (
              <tr key={no}>
                <td className="border border-black text-center" style={{ padding: '1mm' }}>
                  {no}
                </td>
                <td className="border border-black px-[2mm]" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                  {label}
                </td>
                <td className="border border-black px-[2mm]" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Dependents heading */}
        <div
          className="text-center border border-black border-t-0 font-bold"
          style={{ fontSize: '4.7mm', padding: '1mm 0' }}
        >
          Details of Dependents / Legal Heirs
        </div>

        {/* Dependents table */}
        <table
          className="w-full border border-black border-collapse border-t-0"
          style={{ fontSize: '4.0mm', lineHeight: '1.2' }}
        >
          <thead>
            <tr>
              <th className="border border-black" style={{ width: '8mm', padding: '1mm' }}>S#</th>
              <th className="border border-black text-left px-[2mm]" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>Name</th>
              <th className="border border-black" style={{ width: '24mm', padding: '1mm' }}>Age / D.O.B</th>
              <th className="border border-black" style={{ width: '30mm', padding: '1mm' }}>Marital Status</th>
              <th className="border border-black" style={{ width: '32mm', padding: '1mm' }}>Relationship</th>
            </tr>
          </thead>
          <tbody>
            {dependents.length > 0 ? (
              dependents.slice(0, 5).map((fm, idx) => {
                const ageText = fm?.dob ? formatDate(fm.dob) : String(fm?.age || '');
                return (
                  <tr key={idx}>
                    <td className="border border-black text-center" style={{ padding: '1mm' }}>
                      {idx + 1}
                    </td>
                    <td className="border border-black px-[2mm]" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                      {fm?.relative_name || ''}
                    </td>
                    <td className="border border-black text-center" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                      {ageText}
                    </td>
                    <td className="border border-black text-center" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                      {fm?.marital_status || ''}
                    </td>
                    <td className="border border-black text-center" style={{ paddingTop: '1mm', paddingBottom: '1mm' }}>
                      {fm?.relation || ''}
                    </td>
                  </tr>
                );
              })
            ) : (
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={idx}>
                  <td className="border border-black text-center" style={{ padding: '1mm' }}>
                    {idx + 1}
                  </td>
                  <td className="border border-black" style={{ paddingTop: '1mm', paddingBottom: '1mm' }} />
                  <td className="border border-black" style={{ paddingTop: '1mm', paddingBottom: '1mm' }} />
                  <td className="border border-black" style={{ paddingTop: '1mm', paddingBottom: '1mm' }} />
                  <td className="border border-black" style={{ paddingTop: '1mm', paddingBottom: '1mm' }} />
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Declaration */}
        <p style={{ marginTop: '6mm', fontSize: '4.4mm', lineHeight: '1.45', textAlign: 'justify' }}>
          I hereby solemnly affirm that the particulars furnished above are correct
          to the best of my knowledge and belief and that nothing material has been concealed.
        </p>

        {/* Applicant signature */}
        <div className="flex justify-end" style={{ marginTop: '6mm' }}>
          <div style={{ width: '62mm', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid black' }} />
            <div style={{ fontSize: '4.5mm', marginTop: '1mm', lineHeight: '1.3' }}>
              Name and Signature / Thumb Impression of Applicant
            </div>
            <div style={{ fontSize: '4.3mm', lineHeight: '1.3' }}>
              ({applicantName})
            </div>
            <div style={{ fontSize: '4.2mm', lineHeight: '1.3' }}>
              Relation: {applicantRelation}
            </div>
          </div>
        </div>

        {/* Certification */}
        <p style={{ marginTop: '4mm', fontSize: '4.4mm', lineHeight: '1.45', textAlign: 'justify' }}>
          It is certified that the particulars furnished above have been verified
          from the record available in this office and are found correct.
        </p>

        {/* Bottom certification blocks */}
        <div className="flex justify-between" style={{ marginTop: '13mm' }}>
          {/* Left block */}
          <div style={{ width: '58mm', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid black' }} />
            <div
              style={{
                fontSize: '4.4mm',
                marginTop: '1mm',
                lineHeight: '1.35',
                fontWeight: 700,
                textTransform: 'uppercase',
                whiteSpace: 'pre-line',
              }}
            >
              {officeHeadTitle}
            </div>
            <div style={{ fontSize: '4.2mm', lineHeight: '1.3' }}>
              With Office Seal
            </div>
          </div>

          {/* Right block */}
          <div style={{ width: '70mm', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid black' }} />
            <div
              style={{
                fontSize: '4.3mm',
                marginTop: '1mm',
                lineHeight: '1.35',
                fontWeight: 700,
                whiteSpace: 'pre-line',
              }}
            >
              {authorityLines[0] || 'Head of Department'}
            </div>
            {authorityLines[1] && (
              <div
                style={{
                  fontSize: '4.2mm',
                  lineHeight: '1.3',
                  fontWeight: 700,
                }}
              >
                {authorityLines[1]}
              </div>
            )}
            <div style={{ fontSize: '4.2mm', lineHeight: '1.3' }}>
              With Office Seal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};