
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { LeaveAccountProforma } from '../../forms/retirement/LeaveAccountProforma';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const LeaveAccountProformaPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  const [ready, setReady] = useState(false);
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `Leave Account - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  // Wait for the image onload to setReady(true)
  useAutoPrint(ready, 500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  return (
    <PrintLayout orientation="landscape">
      {!ready && (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50 no-print">
          <div className="text-xl font-bold animate-pulse">Preparing Document...</div>
        </div>
      )}
      
      <div className="flex justify-center bg-white">
         <LeaveAccountProforma 
            employeeRecord={employee} 
            caseRecord={caseRecord} 
            onReady={() => setReady(true)} 
         />
      </div>
    </PrintLayout>
  );
};
