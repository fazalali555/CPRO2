
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { NonDrawalCertificate } from '../../forms/certificates/NonDrawalCertificate';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
  type: 'Benevolent Fund' | 'Employees Education Foundation' | 'General' | 'Contribution';
}

export const NonDrawalPrint: React.FC<Props> = ({ employees, cases, type }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `${type} Certificate - ${employee.employees.name}`;
    }
  }, [caseRecord, employee, type]);

  useAutoPrint(!!caseRecord && !!employee);

  if (!caseRecord || !employee) return null;

  return (
    <PrintLayout>
      <div className="flex justify-center py-4 print:p-0">
        <NonDrawalCertificate employee={employee} type={type} />
      </div>
    </PrintLayout>
  );
};
