import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { CoverLetterLayout, useHonorific } from '../../components/CoverLetterLayout';
import { formatDate } from '../../utils/dateUtils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

const EEFBody: React.FC<{ employee: EmployeeRecord }> = ({ employee }) => {
  const { honorific } = useHonorific();
  const { employees, service_history } = employee;

  const orderNo = service_history.retirement_order_no || '__________';
  const orderDate = formatDate(service_history.retirement_order_date) || '__________';
  const retirementDate = formatDate(service_history.date_of_retirement) || '__________';

  const employeeName = employees.name || '__________';
  const designation = employees.designation_full || employees.designation || '__________';
  const bps = employees.bps || '__';
  const institution = employees.school_full_name || '__________';
  const district = employees.district || '__________';
  const personalNo = employees.personal_no || '__________';
  const cnic = employees.cnic_no || '__________';

  return (
    <div style={{ fontSize: '11pt', lineHeight: '1.7' }}>
      <p className="mb-3" style={{ textIndent: '3.5em', textAlign: 'justify' }}>
        The case regarding grant of Employees Education Foundation (E.E.F)
        benefit in respect of <strong className="uppercase">{honorific} {employeeName}</strong>,{' '}
        <strong className="uppercase">{designation} (BPS-{bps})</strong>,{' '}
        <strong className="uppercase">{institution}</strong>, District{' '}
        <strong className="uppercase">{district}</strong>, having Personal
        No. <strong>{personalNo}</strong> and CNIC No. <strong>{cnic}</strong>,
        is forwarded herewith for favour of further necessary action.
      </p>

      <p className="mb-3" style={{ textIndent: '3.5em', textAlign: 'justify' }}>
        2.&nbsp;&nbsp;The above named official retired from Government service
        with effect from <strong>{retirementDate}</strong> vide Retirement
        Order / Notification No. <strong>{orderNo}</strong>, dated{' '}
        <strong>{orderDate}</strong>, issued by the competent authority.
      </p>

      <p className="mb-3" style={{ textIndent: '3.5em', textAlign: 'justify' }}>
        3.&nbsp;&nbsp;It is certified that the particulars of the official have
        been checked and found correct as per available record. The prescribed
        application form along with the relevant documents has been completed
        and verified by this office.
      </p>

      <p className="mb-3" style={{ textIndent: '3.5em', textAlign: 'justify' }}>
        4.&nbsp;&nbsp;It is requested that the case may kindly be countersigned
        and forwarded to the Managing Director, Employees Education Foundation,
        Khyber Pakhtunkhwa, for sanction and release of the admissible benefit
        under the rules.
      </p>

      <p style={{ textIndent: '3.5em', textAlign: 'justify' }}>
        5.&nbsp;&nbsp;Submitted for favour of necessary action, please.
      </p>
    </div>
  );
};

export const EEFApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  return (
    <CoverLetterLayout
      employee={employee}
      caseRecord={caseRecord}
      subject="GRANT OF EMPLOYEES EDUCATION FOUNDATION (E.E.F) BENEFIT"
    >
      <EEFBody employee={employee} />
    </CoverLetterLayout>
  );
};