import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';
import { RBDCOfficialForm } from '../../forms/official/RBDCOfficialForm';
import { BenevolentFundOfficialForm } from '../../forms/official/BenevolentFundOfficialForm';
import { EEFOfficialForm } from '../../forms/official/EEFOfficialForm';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
  kind: 'rbdc' | 'bf' | 'eef';
}

export const OfficialApplicationsPrint: React.FC<Props> = ({ employees, cases, kind }) => {
  const { caseId } = useParams();
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  const config = kind === 'rbdc'
    ? { title: 'RBDC Official Application', Component: RBDCOfficialForm }
    : kind === 'bf'
      ? { title: 'Benevolent Fund Official Application', Component: BenevolentFundOfficialForm }
      : { title: 'EEF Official Application', Component: EEFOfficialForm };

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `${config.title} - ${employee.employees.name}`;
    }
  }, [caseRecord, employee, config.title]);

  useAutoPrint(!!caseRecord && !!employee);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  const Component = config.Component;
  return (
    <PrintLayout pageSize="A4" orientation="portrait">
      <div className="block py-4 print:p-0">
        <Component employee={employee} caseRecord={caseRecord} />
      </div>
    </PrintLayout>
  );
};
