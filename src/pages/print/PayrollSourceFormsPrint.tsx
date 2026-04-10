import React from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { Form1 } from '../../forms/payroll/Form1';
import { PayrollAmendmentSingleForm } from '../../forms/payroll/PayrollAmendmentSingleForm';
import { PayrollAmendmentMultiForm } from '../../forms/payroll/PayrollAmendmentMultiForm';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const PayrollSourceFormsPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId, formType } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : employees[0];

  const amendments = caseRecord?.extras?.amendments || [];
  const payrollEntries = caseRecord?.extras?.payroll_entries || [];

  return (
    <PrintLayout orientation={formType === 'source3' ? 'landscape' : 'portrait'} caseId={caseId} documentId={formType}>
      <div className="flex flex-col gap-8 py-8 print:p-0">
        {formType === 'source1' && <Form1 employeeRecord={employee} />}
        {formType === 'source2' && <PayrollAmendmentSingleForm employeeRecord={employee} amendments={amendments} />}
        {formType === 'source3' && (
          <PayrollAmendmentMultiForm 
            officeName={employee?.employees.office_name || "DISTRICT EDUCATION OFFICE"} 
            ddoCode={employee?.employees.ddo_code || "PE4567"}
            entries={payrollEntries}
          />
        )}
        
        {/* If no formType specified, show all for verification */}
        {!formType && (
          <>
            <Form1 employeeRecord={employee} />
            <div className="page-break" />
            <PayrollAmendmentSingleForm employeeRecord={employee} amendments={amendments} />
            <div className="page-break" />
            <PayrollAmendmentMultiForm 
              officeName={employee?.employees.office_name || "DISTRICT EDUCATION OFFICE"} 
              ddoCode={employee?.employees.ddo_code || "PE4567"}
              entries={payrollEntries}
            />
          </>
        )}
      </div>
    </PrintLayout>
  );
};
