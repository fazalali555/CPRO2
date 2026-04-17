import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { CoverLetterLayout, useHonorific } from '../../components/CoverLetterLayout';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

const LPRBody: React.FC<{ employee: EmployeeRecord; caseRecord: CaseRecord }> = ({
  employee,
  caseRecord,
}) => {
  const { honorific } = useHonorific();
  const { employees, service_history, financials } = employee;

  const orderNo = service_history.retirement_order_no || '__________';
  const orderDate = formatDate(service_history.retirement_order_date) || '__________';
  const retirementDate = formatDate(service_history.date_of_retirement) || '__________';

  const employeeName = employees.name || '__________';
  const designation =
    employees.designation_full || employees.designation || '__________';
  const bps = employees.bps || '__';
  const institution = employees.school_full_name || '__________';
  const district = employees.district || '__________';
  const personalNo = employees.personal_no || '__________';
  const cnic = employees.cnic_no || '__________';

  const basicPay = Number(financials.basic_pay || 0);
  const lprDays = service_history.lpr_days ?? 365;
  const lprAmount =
    caseRecord.extras?.lpr_amount ??
    Math.round((basicPay / 30) * lprDays);

  return (
    <div style={{ fontSize: '10.5pt', lineHeight: '1.6' }}>
      <p className="mb-2" style={{ textIndent: '3.2em', textAlign: 'justify' }}>
        The case regarding grant of leave encashment in lieu of Leave
        Preparatory to Retirement (L.P.R.) amounting to{' '}
        <strong>{formatCurrency(Number(lprAmount))}</strong> in respect of{' '}
        <strong className="uppercase">{honorific} {employeeName}</strong>,{' '}
        <strong className="uppercase">{designation} (BPS-{bps})</strong>,{' '}
        <strong className="uppercase">{institution}</strong>, District{' '}
        <strong className="uppercase">{district}</strong>, having Personal
        No. <strong>{personalNo}</strong> and CNIC No. <strong>{cnic}</strong>,
        is forwarded herewith for favour of further necessary action.
      </p>

      <p className="mb-2" style={{ textIndent: '3.2em', textAlign: 'justify' }}>
        2.&nbsp;&nbsp;The above named official retired from Government service
        with effect from <strong>{retirementDate}</strong> vide Retirement
        Order / Notification No. <strong>{orderNo}</strong>, dated{' '}
        <strong>{orderDate}</strong>, issued by the competent authority.
      </p>

      <p className="mb-2" style={{ textIndent: '3.2em', textAlign: 'justify' }}>
        3.&nbsp;&nbsp;It is certified that the leave account of the official
        has been checked and verified from the available service record and
        the amount of leave encashment has been worked out in accordance
        with the rules in force.
      </p>

      <p className="mb-2" style={{ textIndent: '3.2em', textAlign: 'justify' }}>
        4.&nbsp;&nbsp;It is requested that the case may kindly be
        countersigned and forwarded to the District Accounts Office for
        authorization and release of the admissible amount.
      </p>

      <p style={{ textIndent: '3.2em', textAlign: 'justify' }}>
        5.&nbsp;&nbsp;Submitted for favour of necessary action, please.
      </p>
    </div>
  );
};

export const LPRApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  return (
    <CoverLetterLayout
      employee={employee}
      caseRecord={caseRecord}
      subject="GRANT OF LEAVE ENCASHMENT IN LIEU OF L.P.R."
    >
      <LPRBody employee={employee} caseRecord={caseRecord} />
    </CoverLetterLayout>
  );
};