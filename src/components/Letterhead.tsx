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
  } = coverInfo;

  // letterhead.line1 = office/institution name
  // letterhead.line2 = department line (e.g. "Dept of Elementary & Secondary Education")
  // letterhead.line3 = govt line (e.g. "Govt. of Khyber Pakhtunkhwa")
  const departmentLine = letterhead.line2 || department || office.district_line;
  const govtLine       = letterhead.line3 || office.govt_line;

  // Flatten multi-line titles into one line
  const singleLineTitle = (letterhead.line1 || headerTitle)
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const qrValue = `${window.location.origin}${
    window.location.hash || window.location.pathname
  }`;

  return (
    <div className="flex justify-between items-start mb-1 w-full">

      {/* Logo — aligned start */}
      <div className="w-16 flex-shrink-0 pt-1 flex justify-start">
        <OfficialLogo className="w-16 h-16" />
      </div>

      {/* Centre title block */}
      <div className="flex-grow text-center px-1 pt-2">
        <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-wide leading-tight text-black whitespace-normal">
          {singleLineTitle}
        </h1>

        <h2 className="text-sm font-bold font-serif mt-1 leading-tight">
          {departmentLine}
        </h2>

        <h3 className="text-sm font-bold font-serif mt-1">
          {govtLine}
        </h3>
      </div>

      {/* Right contact + QR */}
      <div className="text-[10px] w-auto min-w-[150px] pt-2 font-serif leading-snug text-right">
        <p>
          <span className="font-bold">Tel:</span> {office.tel}
        </p>
        <div className="flex justify-end mt-2">
          <QRCode value={qrValue} size={60} />
        </div>
      </div>

    </div>
  );
};