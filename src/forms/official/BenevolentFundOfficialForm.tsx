import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { BenevolentFundOfficialForm1 } from './BenevolentFundOfficialForm1';
import { BenevolentFundOfficialForm2 } from './BenevolentFundOfficialForm2';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const BenevolentFundOfficialForm: React.FC<Props> = ({ employee, caseRecord }) => {
  return (
    <div className="bg-white text-black font-sans text-sm leading-normal">
      <BenevolentFundOfficialForm1 employee={employee} caseRecord={caseRecord} />
      <BenevolentFundOfficialForm2 employee={employee} caseRecord={caseRecord} />
    </div>
  );
};
