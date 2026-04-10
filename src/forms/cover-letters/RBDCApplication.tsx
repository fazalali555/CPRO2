
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { CoverLetterLayout } from '../../components/CoverLetterLayout';
import { formatDate } from '../../utils/dateUtils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const RBDCApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history } = employee;
  const orderNo = service_history.retirement_order_no || '__________';
  const orderDate = formatDate(service_history.retirement_order_date) || '__________';
  const retirementDate = formatDate(service_history.date_of_retirement) || '__________';

  return (
    <CoverLetterLayout 
      employee={employee} 
      caseRecord={caseRecord}
      subject="APPLICATION FOR THE GRANT OF RETIREMENT BENEFIT AND DEATH COMPENSATION (RBDC)"
    >
      <p>
        I have the honor to submit herewith the complete case file regarding the grant of Retirement Benefit and Death Compensation (RBDC) in favor of <span className="font-bold uppercase">Mr./Ms. {employees.name}</span>, <span className="font-bold uppercase">{employees.designation} (BPS-{employees.bps})</span>, <span className="font-bold uppercase">{employees.school_full_name}</span>.
      </p>
      <p className="mt-4">
        The official retired from government service on <span className="font-bold">{retirementDate}</span> vide DEO Battagram Endorsement No: <span className="font-bold">{orderNo}</span> Dated: <span className="font-bold">{orderDate}</span>.
      </p>
      <p className="mt-4">
        It is requested that the case may kindly be countersigned and forwarded to the relevant authorities for the sanction and release of payment at your earliest convenience.
      </p>
    </CoverLetterLayout>
  );
};
