
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { CoverLetterLayout } from '../../components/CoverLetterLayout';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const LPRApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  const { employees, service_history, financials } = employee;
  const orderNo = service_history.retirement_order_no || '__________';
  const orderDate = formatDate(service_history.retirement_order_date) || '__________';
  const retirementDate = formatDate(service_history.date_of_retirement) || '__________';
  
  // Estimate LPR Amount if not provided
  const basicPay = financials.basic_pay || 0;
  const lprDays = service_history.lpr_days ?? 365;
  // Fallback LPR calculation based on Employees Pension & Leave section
  const lprAmount = caseRecord.extras?.lpr_amount ?? Math.round(((basicPay || 0) / 30) * lprDays);

  return (
    <CoverLetterLayout 
      employee={employee} 
      caseRecord={caseRecord}
      subject="APPLICATION FOR THE GRANT OF LEAVE ENCASHMENT (L.P.R)"
    >
      <p>
        I have the honor to enclose herewith the complete case regarding the grant of Encashment of Leave in lieu of L.P.R. amounting to <span className="font-bold">{formatCurrency(Number(lprAmount))}</span> in respect of <span className="font-bold uppercase">Mr./Ms. {employees.name}</span>, <span className="font-bold uppercase">{employees.designation} (BPS-{employees.bps})</span>, <span className="font-bold uppercase">{employees.school_full_name}</span>.
      </p>
      <p className="mt-4">
        The official retired from service on <span className="font-bold">{retirementDate}</span> vide Notification No: <span className="font-bold">{orderNo}</span> Dated: <span className="font-bold">{orderDate}</span>.
      </p>
      <p className="mt-4">
        It is requested that the case be countersigned and forwarded to the District Accounts Office for authorization and release of payment.
      </p>
    </CoverLetterLayout>
  );
};
