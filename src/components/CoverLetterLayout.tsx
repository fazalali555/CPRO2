
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../types';
import { Letterhead } from './Letterhead';
import { getCoverLetterInfo, getDEORecipientTitle } from '../utils';
import { format, parseISO } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
  subject: string;
  children: React.ReactNode;
}

export const CoverLetterLayout: React.FC<Props> = ({ employee, caseRecord, subject, children }) => {
  const { signatureTitle, recipientTitle, signatureAlign } = getCoverLetterInfo(employee);
  const recipientLine = getDEORecipientTitle(employee);
  const recipientText = recipientTitle || recipientLine;
  const recipientLines = recipientText.split('\n');
  
  const refNo = caseRecord.extras?.ref_no || '';
  // Extract year from letter_date or default to current year
  let year = new Date().getFullYear().toString();
  if (caseRecord.extras?.letter_date) {
    try {
      year = format(parseISO(caseRecord.extras.letter_date), 'yyyy');
    } catch {}
  }

  return (
    <div 
      className="bg-white text-black font-sans leading-relaxed relative print-page mx-auto"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '12mm',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div className="flex flex-col h-full">
        
        {/* Header */}
        <Letterhead employeeRecord={employee} />
        <div className="w-full border-t-4 border-black border-double mt-1 mb-8"></div>

        {/* Ref No & Date - Matching RetirementCoverLetter Style */}
        <div className="flex justify-between items-end mb-8 font-medium font-serif text-sm">
          <div className="flex items-end">
            <span>No.</span>
            <div className="w-40 border-b border-black mx-2 text-center font-bold">{refNo}</div>
            <span>/</span>
          </div>
          <div className="flex items-end">
            <span>Dated:</span>
            <div className="w-12 border-b border-black mx-2 text-center"></div>
            <span>/</span>
            <div className="w-12 border-b border-black mx-2 text-center"></div>
            <span>/{year}</span>
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-8 font-bold font-serif text-[15px]">
          <div className="mb-1">To</div>
          <div className="pl-12 leading-snug">
            {recipientLines.map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < recipientLines.length - 1 ? <br/> : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div className="flex mb-8">
          <span className="font-bold w-20 flex-shrink-0 font-serif text-[15px]">Subject:</span>
          <span className="font-bold uppercase underline decoration-1 underline-offset-4 font-serif text-[15px] leading-snug">
            {subject}
          </span>
        </div>

        {/* Salutation */}
        <div className="mb-4 font-bold font-serif text-[15px]">Respected Sir/Madam,</div>

        {/* Body Content */}
        <div className="mb-6 text-justify leading-[2] font-serif text-[15px]">
          {children}
        </div>

        {/* Closing */}
        <div className="mb-12 font-serif text-[15px]">
          <p>Thank you for your kind attention to this matter.</p>
        </div>

        {/* Signature */}
        <div className={`mt-auto pt-16 flex ${
          signatureAlign === 'left' ? 'justify-start' : signatureAlign === 'center' ? 'justify-center' : 'justify-end'
        }`}>
          <div className="text-center w-64">
            <div className="h-10"></div>
            <div className="h-px bg-black w-full mb-2"></div>
            <p className="font-bold text-sm leading-tight uppercase whitespace-pre-line font-serif">
              {signatureTitle}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
