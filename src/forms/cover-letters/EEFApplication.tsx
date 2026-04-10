
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { CoverLetterLayout } from '../../components/CoverLetterLayout';
import { formatDate } from '../../utils/dateUtils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const EEFApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history } = employee;
  const orderNo = service_history.retirement_order_no || '__________';
  const orderDate = formatDate(service_history.retirement_order_date) || '__________';
  const retirementDate = formatDate(service_history.date_of_retirement) || '__________';

  return (
    <CoverLetterLayout 
      employee={employee} 
      caseRecord={caseRecord}
      subject="APPLICATION FOR THE GRANT OF EMPLOYEES EDUCATION FOUNDATION (E.E.F) BENEFIT"
    >
      <p>
        I have the honor to submit herewith the claim dossier for the grant from the Education Employees Foundation (E.E.F) in favor of <span className="font-bold uppercase">Mr./Ms. {employees.name}</span>, <span className="font-bold uppercase">{employees.designation} (BPS-{employees.bps})</span>, <span className="font-bold uppercase">{employees.school_full_name}</span>.
      </p>
      <p className="mt-4">
        The official retired on <span className="font-bold">{retirementDate}</span> vide Order No: <span className="font-bold">{orderNo}</span> Dated: <span className="font-bold">{orderDate}</span>.
      </p>
      <p className="mt-4">
        It is requested to kindly countersign and forward the case to the Managing Director, EEF, for the release of the admissible grant.
      </p>
    </CoverLetterLayout>
  );
};
