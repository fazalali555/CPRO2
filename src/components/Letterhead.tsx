
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
    const saved = localStorage.getItem('kpk_rpms_office_profile');
    if (saved) {
      setOffice(JSON.parse(saved));
    }
  }, []);

  const { headerTitle, departmentLine, govtLine } = getCoverLetterInfo(employeeRecord);
  
  // Flatten multi-line titles (e.g. Principal \n School) into one line
  const singleLineTitle = headerTitle.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  const qrValue = `${window.location.origin}${window.location.hash || window.location.pathname}`;

  return (
    <div className="flex justify-between items-start mb-1 w-full">
      {/* Logo - Aligned start */}
      <div className="w-16 flex-shrink-0 pt-1 flex justify-start">
        <OfficialLogo className="w-16 h-16" />
      </div>

      {/* Center Title - One Line */}
      <div className="flex-grow text-center px-1 pt-2">
        <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-wide leading-tight text-black whitespace-normal">
          {singleLineTitle}
        </h1>
        {/* Department Line */}
        <h2 className="text-sm font-bold font-serif mt-1 leading-tight whitespace-nowrap">{departmentLine || office.district_line}</h2>
        <h3 className="text-sm font-bold font-serif mt-1">
          {govtLine || office.govt_line}
        </h3>
      </div>

      {/* Right Contact Info - Aligned right */}
      <div className="text-[10px] w-auto min-w-[150px] pt-2 font-serif leading-snug text-right">
        <p><span className="font-bold">Tel:</span> {office.tel}</p>
        <div className="flex justify-end mt-2">
          <QRCode value={qrValue} size={60} />
        </div>
      </div>
    </div>
  );
};
