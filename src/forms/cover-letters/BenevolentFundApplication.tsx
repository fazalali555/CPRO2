
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { CoverLetterLayout } from '../../components/CoverLetterLayout';
import { formatDate } from '../../utils/dateUtils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const BenevolentFundApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history } = employee;
  const orderNo = service_history.retirement_order_no || '__________';
  const orderDate = formatDate(service_history.retirement_order_date) || '__________';
  const retirementDate = formatDate(service_history.date_of_retirement) || '__________';

  return (
    <CoverLetterLayout 
      employee={employee} 
      caseRecord={caseRecord}
      subject="APPLICATION FOR THE RETIREMENT GRANT OUT OF BENEVOLENT FUND"
    >
      <p>
        Please find enclosed the complete case file regarding the grant of Benevolent Fund (Part-I & Part-II) in respect of <span className="font-bold uppercase">Mr./Ms. {employees.name}</span>, <span className="font-bold uppercase">{employees.designation} (BPS-{employees.bps})</span>, <span className="font-bold uppercase">{employees.school_full_name}</span>.
      </p>
      <p className="mt-4">
        The official stood retired from service on <span className="font-bold">{retirementDate}</span> vide Notification No: <span className="font-bold">{orderNo}</span> Dated: <span className="font-bold">{orderDate}</span>.
      </p>
      <p className="mt-4">
        You are requested to kindly countersign and forward the application to the Provincial Benevolent Fund Cell for necessary action and release of the grant.
      </p>
    </CoverLetterLayout>
  );
};
