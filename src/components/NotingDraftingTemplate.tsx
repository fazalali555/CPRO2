import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate } from '../utils/dateUtils';
import { parseSchoolInfo } from '../utils';

interface NotingDraftingTemplateProps {
  office: {
    title: string;
    department: string;
    city: string;
    schoolName?: string; // Optional school name for parsing
  };
  fileNo: string;
  subject: string;
  recipient: {
    title: string;
    address: string;
  };
  content: React.ReactNode;
  signatory: {
    name: string;
    designation: string;
  };
  enclosures?: string[];
  copyTo?: string[];
  draftingDate?: string;
  salutation?: string; // Explicit salutation override
}

export const NotingDraftingTemplate: React.FC<NotingDraftingTemplateProps> = ({
  office,
  fileNo,
  subject,
  recipient,
  content,
  signatory,
  enclosures = [],
  copyTo = [],
  draftingDate = new Date().toISOString(),
  salutation: propSalutation
}) => {
  const { t, isUrdu } = useLanguage();

  // Parse school info if available
  const schoolInfo = office.schoolName ? parseSchoolInfo(office.schoolName) : null;
  const genderSalutation = schoolInfo ? (isUrdu ? (schoolInfo.isFemale ? 'محترمہ' : 'جناب') : schoolInfo.salutation) : (isUrdu ? 'جناب' : 'Sir');
  const salutation = propSalutation || genderSalutation;

  return (
    <div className={`max-w-[210mm] mx-auto bg-white p-[25mm] min-h-[297mm] text-black font-serif text-[12pt] leading-relaxed shadow-lg print:shadow-none print:p-0 ${isUrdu ? 'dir-rtl' : 'dir-ltr'}`}>
      
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-black pb-4">
        <div className="flex justify-center mb-2">
          <img 
            src="/assets/KP_logo.png" 
            alt="KP Govt Logo" 
            className="h-20 w-auto object-contain grayscale"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <h1 className="font-bold text-xl uppercase tracking-wide">{t.templates.govtKP}</h1>
        <h2 className="font-bold text-lg uppercase">{office.department}</h2>
        <h3 className="font-bold text-md uppercase">{isUrdu ? `${office.title}، ${office.city} کا دفتر` : `OFFICE OF THE ${office.title}, ${office.city}`}</h3>
      </div>

      {/* Date & File No */}
      <div className={`flex justify-between items-end mb-8 ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <div className={isUrdu ? 'text-right' : 'text-left'}>
          <span className="font-bold">{t.templates.no}</span> {fileNo}
        </div>
        <div className={isUrdu ? 'text-left' : 'text-right'}>
          <span className="font-bold">{isUrdu ? `${office.city}، ${t.templates.dated}` : `${t.templates.dated} ${office.city}, the`}</span> {formatDate(draftingDate)}
        </div>
      </div>

      {/* Recipient */}
      <div className={`mb-8 ${isUrdu ? 'text-right' : 'text-left'}`}>
        <div className="font-bold mb-1">{t.templates.to}</div>
        <div className={isUrdu ? 'mr-12' : 'ml-12'}>
          {recipient.title},<br />
          {recipient.address}
        </div>
      </div>

      {/* Subject */}
      <div className={`mb-6 ${isUrdu ? 'text-right' : 'text-left'}`}>
        <div className={`flex items-start ${isUrdu ? 'flex-row-reverse' : ''}`}>
          <span className={`font-bold shrink-0 ${isUrdu ? 'w-20' : 'w-24'}`}>{t.templates.subject}:</span>
          <span className="font-bold underline decoration-1 underline-offset-4 uppercase leading-snug">
            {subject}
          </span>
        </div>
      </div>

      {/* Salutation */}
      <div className={`mb-4 ${isUrdu ? 'text-right' : 'text-left'}`}>
        {salutation},
      </div>

      {/* Body Content */}
      <div className={`mb-12 whitespace-pre-line ${isUrdu ? 'text-right' : 'text-justify'}`}>
        {content}
      </div>

      {/* Signature Block */}
      <div className={`flex flex-col mb-12 ${isUrdu ? 'items-start pl-8' : 'items-end pr-8'}`}>
        <div className="w-64 text-center">
          <div className="mb-12 font-bold uppercase">({signatory.name})</div>
          <div className="font-bold border-t border-black pt-1">{signatory.designation}</div>
          <div className="text-sm">{office.title}</div>
          <div className="text-sm">{office.city}</div>
        </div>
      </div>

      {/* Footer / Endst */}
      {(copyTo.length > 0 || enclosures.length > 0) && (
        <div className="mt-8 pt-4 border-t border-black">
          {enclosures.length > 0 && (
            <div className={`mb-4 ${isUrdu ? 'text-right' : 'text-left'}`}>
              <span className="font-bold underline">{t.templates.encl}</span>
              <ol className={`list-decimal mt-1 text-sm ${isUrdu ? 'pr-8' : 'pl-8'}`}>
                {enclosures.map((enc, idx) => (
                  <li key={idx}>{enc}</li>
                ))}
              </ol>
            </div>
          )}

          <div className={`mb-2 ${isUrdu ? 'text-right' : 'text-left'}`}>
            <span className="font-bold">{t.templates.endst}</span>
          </div>
          <div className={`mb-2 ${isUrdu ? 'text-right' : 'text-left'}`}>
            {t.templates.copyForwarded}
          </div>
          <ol className={`list-decimal text-sm space-y-1 ${isUrdu ? 'pr-12' : 'pl-12'}`}>
            {copyTo.map((copy, idx) => (
              <li key={idx}>{copy}</li>
            ))}
            <li>{t.templates.officeFile}</li>
          </ol>
          
          {/* Countersign for Endst */}
          <div className={`flex flex-col mt-12 ${isUrdu ? 'items-start pl-8' : 'items-end pr-8'}`}>
            <div className="w-64 text-center">
              <div className="font-bold uppercase border-t border-black pt-1">{signatory.designation}</div>
              <div className="text-sm">{office.title}</div>
              <div className="text-sm">{office.city}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
