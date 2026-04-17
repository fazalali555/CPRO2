import React, { createContext, useContext } from 'react';
import { EmployeeRecord, CaseRecord } from '../types';
import { Letterhead } from './Letterhead';
import { getCoverLetterInfo } from '../utils';
import { getDepartmentInfo } from '../utils/departmentDetector';
import { format, parseISO } from 'date-fns';

// ============================================================================
// HONORIFIC CONTEXT
// ============================================================================

interface HonorificContextType {
  honorific: string; // Mr. | Mst.
  gender: 'Male' | 'Female';
}

const HonorificContext = createContext<HonorificContextType>({
  honorific: 'Mr.',
  gender: 'Male',
});

export const useHonorific = () => useContext(HonorificContext);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
  subject: string;
  children: React.ReactNode;
}

export const CoverLetterLayout: React.FC<Props> = ({
  employee,
  caseRecord,
  subject,
  children,
}) => {
  const deptInfo = getDepartmentInfo(
    employee.employees.school_full_name ?? '',
    employee.employees.office_name ?? '',
    employee.employees.tehsil ?? '',
    employee.employees.district ?? '',
    employee.employees.designation_full ?? employee.employees.designation ?? ''
  );

  const {
    signatureTitle,
    recipientTitle,
    salutation,
    gender,
  } = getCoverLetterInfo(employee);

  const recipientText = recipientTitle || deptInfo.authorityTitle;
  const recipientLines = recipientText.split('\n');

  const honorific = gender === 'Female' ? 'Mst.' : 'Mr.';

  const refNo = caseRecord.extras?.ref_no ?? '';
  let year = new Date().getFullYear().toString();
  if (caseRecord.extras?.letter_date) {
    try {
      year = format(parseISO(caseRecord.extras.letter_date), 'yyyy');
    } catch {}
  }

  return (
    <div
      className="bg-white text-black mx-auto print-page"
      style={{
        width: '210mm',
        height: '287mm', // reduced a little to avoid 2nd/blank page in print
        padding: '12mm 18mm 12mm 20mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'Times New Roman, serif',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <Letterhead employeeRecord={employee} />
        <div className="w-full border-t-4 border-black border-double mt-1 mb-5" />

        {/* Ref No & Date */}
        <div
          className="flex justify-between items-end mb-5 font-bold"
          style={{ fontSize: '10.5pt' }}
        >
          <div className="flex items-end gap-1">
            <span>No.</span>
            <span
              className="border-b border-black text-center"
              style={{ minWidth: '145px', display: 'inline-block' }}
            >
              {refNo}
            </span>
            <span>/</span>
          </div>

          <div className="flex items-end gap-1">
            <span>Dated:</span>
            <span
              className="border-b border-black"
              style={{ minWidth: '38px', display: 'inline-block' }}
            />
            <span>/</span>
            <span
              className="border-b border-black"
              style={{ minWidth: '38px', display: 'inline-block' }}
            />
            <span>/{year}</span>
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-5" style={{ fontSize: '11pt' }}>
          <div className="font-bold mb-1">To</div>
          <div className="pl-10 font-bold leading-snug">
            {recipientLines.map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < recipientLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="flex mb-5" style={{ fontSize: '11pt' }}>
          <span className="font-bold mr-3 flex-shrink-0">Subject:</span>
          <span
            className="font-bold uppercase"
            style={{
              textDecoration: 'underline',
              textDecorationThickness: '1px',
              textUnderlineOffset: '3px',
              lineHeight: '1.4',
            }}
          >
            {subject}
          </span>
        </div>

        {/* Salutation */}
        <div className="font-bold mb-3" style={{ fontSize: '11pt' }}>
          Respected {salutation},
        </div>

        {/* Body */}
        <HonorificContext.Provider value={{ honorific, gender }}>
          <div
            style={{
              textAlign: 'justify',
              fontSize: '10.5pt',
              lineHeight: '1.6',
            }}
          >
            {children}
          </div>
        </HonorificContext.Provider>

        {/* Closing */}
        <p
          style={{
            fontSize: '10.5pt',
            marginTop: '8px',
            marginBottom: '0',
            textAlign: 'justify',
          }}
        >
          It is requested that necessary action may kindly be taken.
        </p>

        {/* Signature Block - Fixed on same page */}
        <div
          className="mt-auto flex justify-end"
          style={{
            paddingTop: '14px',
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
          }}
        >
          <div
            style={{
              width: '235px',
              textAlign: 'center',
              fontSize: '10.5pt',
            }}
          >

            {/* controlled signature gap */}
            <div style={{ height: '18mm' }} />

            <div
              style={{
                borderTop: '1px solid black',
                width: '210px',
                margin: '0 auto 4px auto',
              }}
            />

            <p
              className="font-bold uppercase whitespace-pre-line"
              style={{
                fontSize: '10pt',
                lineHeight: '1.35',
                margin: 0,
              }}
            >
              {signatureTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};