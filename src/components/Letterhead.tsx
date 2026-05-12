import React, { useState, useEffect } from 'react';
import { EmployeeRecord, OfficeProfile } from '../types';
import { getCoverLetterInfo } from '../utils';
import { OfficialLogo } from './OfficialLogo';
import { QRCode } from './QRCode';

interface LetterheadProps {
  employeeRecord: EmployeeRecord;
}

const DEFAULT_OFFICE_PROFILE: OfficeProfile = {
  office_title: "OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER (M) ALLAI",
  district_line: "Department of Elementary & Secondary Education, Battagram",
  govt_line: "Govt. of Khyber Pakhtunkhwa.",
  tel: "0343-2900419",
  web: "www.kpese.gov.pk",
  email: "sdeomallai@gmail.com",
  recipient_title: "The District Education Officer (M)",
  recipient_city: "Battagram",
  signatory_title: "Sub Divisional Education Officer (M) Allai"
};

export const Letterhead: React.FC<LetterheadProps> = ({ employeeRecord }) => {
  const [office, setOffice] = useState<OfficeProfile>(DEFAULT_OFFICE_PROFILE);

  useEffect(() => {
    const saved = localStorage.getItem('clerk_pro_rpms_office_profile');
    if (saved) {
      try {
        setOffice(JSON.parse(saved));
      } catch {
        // fallback to default if parsing fails
      }
    }
  }, []);

  // getCoverLetterInfo returns:
  // { headerTitle, signatureTitle, letterhead, department, departmentShort }
  // letterhead = { line1, line2, line3, full }
  const coverInfo = getCoverLetterInfo(employeeRecord);

  const {
    headerTitle,
    letterhead,
    department,
    departmentType,
  } = coverInfo;

  // letterhead.line1 = office/institution name
  // letterhead.line2 = department line (e.g. "Dept of Elementary & Secondary Education")
  // letterhead.line3 = govt line (e.g. "Govt. of Khyber Pakhtunkhwa")
  const departmentLine = letterhead.line2 || department || office.district_line;
  const govtLine       = letterhead.line3 || office.govt_line;

  // Preserve newlines if they exist (e.g., from Local Government full headers)
  const mainTitle = (letterhead.line1 || headerTitle).trim();
  const isMultiLine = mainTitle.includes('\n');

  const qrData = {
    name: employeeRecord.employees.name,
    designation: employeeRecord.employees.designation,
    school: employeeRecord.employees.school_full_name,
    dor: employeeRecord.service_history.date_of_retirement,
    ref: coverInfo.letterhead.full.split('\n')[0],
  };

  const whatsappText = `*CASE REPORT - RPMS*\n\n` +
    `*Employee:* ${qrData.name}\n` +
    `*Designation:* ${qrData.designation}\n` +
    `*School:* ${qrData.school}\n` +
    `*Retirement Date:* ${qrData.dor || 'N/A'}\n\n` +
    `*Office:* ${qrData.ref}\n` +
    `*App:* Clerk Pro RPMS\n` +
    `*Developer:* Fazal Ali (+923432900419)`;

  const qrValue = `https://wa.me/923432900419?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="flex justify-between items-start mb-1 w-full">

      {/* Logo — aligned start */}
      <div className="w-16 flex-shrink-0 pt-1 flex justify-start">
        <OfficialLogo className="w-16 h-16" departmentType={departmentType} />
      </div>

      {/* Centre title block */}
      <div className="flex-grow text-center px-1 pt-2">
        <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-wide leading-tight text-black whitespace-pre-line">
          {mainTitle}
        </h1>

        {!isMultiLine && (
          <>
            <h2 className="text-[11px] font-bold font-serif mt-1 leading-tight">
              {departmentLine}
            </h2>

            <h3 className="text-[11px] font-bold font-serif mt-1">
              {govtLine}
            </h3>
          </>
        )}
      </div>

      {/* Right contact + QR */}
      <div className="text-[10px] w-16 flex-shrink-0 pt-1 font-serif leading-snug text-right">
        <div className="flex justify-end">
          <QRCode value={qrValue} size={64} />
        </div>
        <p className="mt-1 whitespace-nowrap">
          <span className="font-bold">Tel:</span> {office.tel}
        </p>
      </div>

    </div>
  );
};