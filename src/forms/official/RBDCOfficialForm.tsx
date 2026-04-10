import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { RBDCOfficialForm1 } from './RBDCOfficialForm1';
import { RBDCOfficialForm2 } from './RBDCOfficialForm2';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const RBDCOfficialForm: React.FC<Props> = ({ employee, caseRecord }) => {
  return (
    <div className="bg-white text-black font-sans text-sm leading-normal">
      <RBDCOfficialForm1 employee={employee} caseRecord={caseRecord} />
      <RBDCOfficialForm2 employee={employee} caseRecord={caseRecord} />
    </div>
  );
};
