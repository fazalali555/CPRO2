
import React, { useState, useEffect } from 'react';
import { EmployeeRecord, CaseRecord, OfficeProfile } from '../../types';
import { parseSchoolInfo, getCoverLetterInfo, getDEORecipientTitle } from '../../utils';
import { Letterhead } from '../../components/Letterhead';

interface RetirementCoverLetterProps {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const RetirementCoverLetter: React.FC<RetirementCoverLetterProps> = ({ employee, caseRecord }) => {
  const schoolName = employee.employees.school_full_name;
  const tehsil = employee.employees.tehsil || '';
  const info = parseSchoolInfo(schoolName, tehsil);
  const salutation = info.salutation;
  const refNo = caseRecord.extras?.ref_no || '';
  const dateStr = caseRecord.extras?.letter_date || new Date().getFullYear();
  
  // Dynamic Signature Info
  const { signatureTitle } = getCoverLetterInfo(employee);
  
  // Recipient Auto-Switch
  const recipientLine = getDEORecipientTitle(employee);
  const recipientCity = employee.employees.district || "Battagram";

  return (
    <div 
      className="bg-white text-black font-sans leading-relaxed relative print-page mx-auto"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '12mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '11pt',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div className="flex flex-col h-full">
        
        {/* --- Header Section --- */}
        <Letterhead employeeRecord={employee} />

        {/* Double Line Separator */}
        <div className="w-full border-t-4 border-black border-double mb-8"></div>

        {/* Reference and Date */}
        <div className="flex justify-between items-end mb-8 font-medium">
          <div className="flex items-end">
            <span>No.</span>
            <div className="w-40 border-b border-black mx-2 text-center font-bold">{refNo}</div>
            <span>/</span>
          </div>
          <div className="flex items-end">
            <span>Dated:</span>
            <div className="w-16 border-b border-black mx-2 text-center">{/* Day */}</div>
            <span>/</span>
            <div className="w-16 border-b border-black mx-2 text-center">{/* Month */}</div>
            <span>/{dateStr}</span>
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-6 font-bold">
          <div className="mb-1">To:</div>
          <div className="pl-24">
            <div>{recipientLine}</div>
          </div>
        </div>

        {/* Subject */}
        <div className="flex mb-6">
          <span className="font-bold w-24 flex-shrink-0">Subject:</span>
          <span className="font-bold uppercase underline decoration-1 underline-offset-4">
            APPLICATION FOR RETIREMENT SANCTION
          </span>
        </div>

        {/* Salutation */}
        <div className="mb-6">
          <p>Respected {salutation},</p>
        </div>

        {/* Body Text */}
        <div className="mb-2 text-justify leading-relaxed">
          <p>
            Please find enclosed the retirement case of Mr./Ms. <span className="font-bold uppercase">{employee.employees.name}</span>, 
            <span className="font-bold uppercase"> {employee.employees.designation} (BPS - {employee.employees.bps}), {employee.employees.school_full_name}</span>, 
            which has been duly completed and forwarded for sanction.
          </p>
        </div>

        {/* Enclosed List */}
        <div className="mb-4">
          <p className="mb-1">Enclosed</p>
          <div className="pl-4 space-y-0.5">
            <ListItem num="1." text="Service Book." />
            <ListItem num="2." text="Application." />
            <ListItem num="3." text="C.N.I.C." />
            <ListItem num="4." text="Non-Involvement certificate." />
            <ListItem num="5." text="S.S.C Certificate." />
            <ListItem num="6." text="Bank Clearance." />
            <ListItem num="7." text="1st Appointment order." />
            <ListItem num="8." text="Promotion order copy." />
            <ListItem num="9." text="List of Family Members." />
            <ListItem num="10." text="Salay Slip." /> 
            <ListItem num="11." text="No Demand Certificate." />
            <ListItem num="12." text="School Clearance Certificate." />
            <ListItem num="13." text="Service Certificate." />
          </div>
        </div>

        {/* Footer Signature */}
        <div className="mt-auto flex justify-end pt-12">
          <div className="text-center w-64">
            <div className="h-10 border-b border-gray-300 w-full mb-2"></div>
            <p className="font-bold text-sm leading-tight uppercase whitespace-pre-line">
              {signatureTitle}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

const ListItem: React.FC<{ num: string; text: string }> = ({ num, text }) => (
  <div className="flex">
    <div className="w-10 flex-shrink-0 text-right pr-4">{num}</div>
    <div>{text}</div>
  </div>
);
