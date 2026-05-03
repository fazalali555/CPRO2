import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PrintLayout } from '../../../../components/PrintLayout';
import { useAutoPrint } from '../../../../utils/print';
import { useLetterComposer } from '../../hooks/useLetterComposer';
import { OfficialLogo } from '../../../../components/OfficialLogo';
import { QRCode } from '../../../../components/QRCode';
import { APP_NAME, APP_AUTHOR, DEVELOPER } from '../../../../config/branding';

export const LetterPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { letters, getDepartmentInfo } = useLetterComposer();

  const letter = useMemo(() => {
    const fromState = letters.find(l => l.id === id);
    if (fromState) return fromState;
    
    // Fallback: Read directly from storage
    try {
      const allStr = localStorage.getItem('clerk_pro_clerk_letters');
      if (allStr) {
        const all: any[] = JSON.parse(allStr);
        return all.find(l => l.id === id);
      }
    } catch (e) {
      console.error("Print fallback failed", e);
    }
    return null;
  }, [letters, id]);
  
  const officeProfile = useMemo(() => {
    const saved = localStorage.getItem('clerk_pro_clerk_office_profiles');
    if (saved) {
      try { 
        const data = JSON.parse(saved);
        return Array.isArray(data) ? (data[0] || {}) : data;
      } catch { return {}; }
    }
    return {};
  }, []);

  const isOfficeOrder = (letter?.subject || '').toUpperCase().includes('OFFICE ORDER');

  const deptInfo = useMemo(() => 
    getDepartmentInfo(letter?.institutionName?.split('\n')[0] || 'Office'), 
    [letter?.institutionName, getDepartmentInfo]
  );

  // Use saved values if present, else fallback to computed
  const lhLine1 = useMemo(() => {
    return letter?.letterheadLines || deptInfo.letterhead.line1;
  }, [letter?.letterheadLines, deptInfo.letterhead.line1]);

  const lhLine2 = useMemo(() => {
    return letter?.fromOffice || deptInfo.letterhead.line2 || officeProfile.district_line || '';
  }, [letter?.fromOffice, deptInfo.letterhead.line2, officeProfile.district_line]);

  const lhLine3 = deptInfo.letterhead.line3 || officeProfile.govt_line || 'Govt. of Khyber Pakhtunkhwa.';
  
  const parsedDate = letter?.letterDate ? new Date(letter.letterDate) : null;
  const year = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getFullYear() : new Date().getFullYear();
  
  const recipientLines = useMemo(() => {
    const to = letter?.to || '';
    return (typeof to === 'string' ? to : '').split('\n').map((l: string) => l.trim()).filter(Boolean);
  }, [letter?.to]);

  const subjectText = (letter?.subject || 'Subject').toUpperCase();
  
  const toUpper = (letter?.to || '').toString().toUpperCase();
  const salText = /\(F\)|\(FEMALE\)|\(GIRLS\)/.test(toUpper) ? 'Madam' : 'Sir';
  
  const isHigherOffice = useMemo(() => {
    const org = deptInfo.organizationType;
    return org === 'directorate' || org === 'education_office' || org === 'police_office' || org === 'finance_office';
  }, [deptInfo]);

  const openingStatement = useMemo(() => {
    if (isHigherOffice) {
      return "I am directed to refer to the subject noted above and to state that";
    } else {
      return "I have the honor to refer to the subject cited above and to state that";
    }
  }, [isHigherOffice]);

  // Safe forwarding items
  const fwdItems = useMemo(() => {
    const fwd = letter?.forwardedTo;
    if (Array.isArray(fwd)) return fwd.map(l => l.trim()).filter(Boolean);
    if (typeof fwd === 'string') return fwd.split('\n').map(l => l.trim()).filter(Boolean);
    return [];
  }, [letter?.forwardedTo]);

  const enclosureItems = useMemo(() => {
    const enc = letter?.enclosures;
    if (typeof enc === 'string') return enc.split('\n').map(l => l.trim()).filter(Boolean);
    return [];
  }, [letter?.enclosures]);

  // Component to render refined body with numbering
  const RefinedBody = ({ html }: { html: string }) => {
    if (!html) return null;

    // If it contains a table, render as-is but maybe inject opening statement to first para
    const hasTable = html.includes('<table') || html.includes('</table>') || html.includes('| --- |') || html.includes('---');
    
    if (hasTable) {
       return (
         <div className="space-y-4" dangerouslySetInnerHTML={{ __html: html.replace(/<p>/i, `<p style="text-indent: 4em;">${openingStatement} `) }} />
       );
    }

    // Extract paragraphs more robustly by splitting on both <p> and <br>
    const rawParagraphs = html
      .split(/<\/p>|<br\s*\/?>/i)
      .map(p => {
        const tmp = document.createElement('div');
        tmp.innerHTML = p;
        return tmp.textContent?.trim() || '';
      })
      .filter(p => p.length > 1); // Only keep content-rich lines
    
    if (rawParagraphs.length === 0) return <div className="text-justify indent-[4em] leading-[1.6]">{openingStatement} ...</div>;

    return (
      <div className="space-y-5">
        {/* Paragraph 1: Unnumbered with Opening Statement */}
        <div className="text-justify indent-[4em] leading-[1.6]">
          {rawParagraphs[0].toLowerCase().includes(openingStatement.toLowerCase().substring(0, 30)) 
            ? '' 
            : openingStatement + ' '} 
          {rawParagraphs[0]}
        </div>

        {/* Paragraph 2+: Auto-numbering */}
        {rawParagraphs.slice(1).map((text, i) => {
          const displayIndex = i + 2;
          const startsWithAnyNumber = /^\d+[\.\)]/.test(text);
          return (
            <div key={i} className="flex gap-4 leading-[1.6]">
              <span className="w-[1.5em] shrink-0 font-bold">
                {startsWithAnyNumber ? '' : `${displayIndex}.`}
              </span>
              <div className="flex-1 text-justify">
                {text}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const sigName = letter?.signatureName || '';
  const sigTitle = (deptInfo as any).signatureTitle || '';
  const qrValue = `${APP_NAME} | Dev: ${APP_AUTHOR} | ${DEVELOPER.contact}`;

  useEffect(() => {
    if (letter) {
      document.title = `Letter - ${letter.subject}`;
    }
  }, [letter]);

  useAutoPrint(!!letter);

  if (!letter) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Letter not found.</div>;
  }

  return (
    <PrintLayout>
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body {
            background: none;
            -webkit-print-color-adjust: exact;
          }
        }
        /* Official Styles */
        .official-page {
          width: 210mm;
          min-height: 297mm;
          padding: 12mm 20mm 12mm 15mm; /* Reduced padding to fit more content on one page */
          margin: 0 auto;
          background: white;
          color: black;
          font-family: 'Times New Roman', Times, serif;
          font-size: 11.5pt; /* Slightly reduced font size */
          line-height: 1.4; /* Slightly tighter line height */
        }
        .header-title {
          font-size: 15pt;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          line-height: 1.1;
          white-space: pre-line;
        }
        .header-dept {
          font-size: 10.5pt;
          font-weight: 700;
          margin-top: 3px;
        }
        .header-govt {
          font-size: 10pt;
          font-weight: 600;
          margin-top: 2px;
        }
        .double-divider {
          border-top: 4px double black;
          margin: 8px 0 15px 0;
        }
        .ref-date-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 15px;
          font-size: 11pt;
        }
        .to-block {
          margin-bottom: 15px;
          display: flex;
        }
        .to-label {
          width: 45px;
          font-weight: bold;
        }
        .to-content {
          flex: 1;
          font-weight: bold;
          line-height: 1.5;
        }
        .subject-row {
          margin-bottom: 15px;
          display: flex;
          text-align: justify;
        }
        .subject-label {
          font-weight: bold;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .subject-text {
          font-weight: bold;
          text-transform: uppercase;
          text-decoration: underline;
          text-underline-offset: 4px;
          line-height: 1.4;
        }
        .salutation {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .body-container {
          margin-bottom: 15px;
          text-align: justify;
        }
        .signature-section {
          display: flex;
          justify-content: flex-end;
          padding-top: 30px;
          page-break-inside: avoid;
        }
        .signature-box {
          width: 260px;
          text-align: center;
        }
        .signature-line {
          border-top: 1px solid black;
          width: 220px;
          margin: 0 auto 10px auto;
        }
        .signature-title {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11pt;
          line-height: 1.5;
          white-space: pre-line;
        }
        .forwarding-section {
          margin-top: 35px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 10.5pt;
          page-break-inside: avoid;
        }
        .forwarding-label {
          font-weight: bold;
          margin-bottom: 12px;
        }
        .forwarding-item {
          margin-left: 25px;
          margin-bottom: 5px;
        }
      `}</style>
      
      <div className="bg-gray-200 min-h-screen py-10 print:py-0 print:bg-white">
        <div className="official-page shadow-2xl print:shadow-none relative">
          
          {/* Letterhead Header */}
          <div className="flex justify-between items-start w-full">
            <div className="w-[80px] flex-shrink-0 pt-1">
              <OfficialLogo className="w-[70px] h-[70px]" departmentType={deptInfo.departmentType} />
            </div>
            <div className="text-center flex-grow px-4 pt-1">
              <h1 className="header-title">{lhLine1}</h1>
              {lhLine2 && <h2 className="header-dept">{lhLine2}</h2>}
              {lhLine3 && <h3 className="header-govt">{lhLine3}</h3>}
            </div>
            <div className="w-[105px] text-right pt-2">
              {officeProfile.tel && <div className="text-[9.5pt]"><strong>Tel:</strong> {officeProfile.tel}</div>}
              <div className="mt-3 flex justify-end">
                <QRCode value={letter?.reference || 'draft'} size={55} />
              </div>
            </div>
          </div>

          <div className="double-divider"></div>

          {/* Reference & Date */}
          <div className="ref-date-row">
            <div>No. <span className="inline-block border-b border-black min-w-[80px] text-center px-2">{letter.reference || ''}</span> /</div>
            <div>Dated: {parsedDate && !isNaN(parsedDate.getTime()) 
              ? `${parsedDate.getDate().toString().padStart(2, '0')} / ${(parsedDate.getMonth() + 1).toString().padStart(2, '0')} / ${year}`
              : `___ / ___ / ${year}`
            }</div>
          </div>

          {/* To (Recipient) - Hidden for Office Orders */}
          {!isOfficeOrder && (
            <div className="to-block">
              <div className="to-label">To</div>
              <div className="to-content">
                {recipientLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="subject-row" style={isOfficeOrder ? { justifyContent: 'center' } : {}}>
            <span className={isOfficeOrder ? 'hidden' : 'subject-label'}>Subject:</span>
            <span className="subject-text" style={isOfficeOrder ? { textAlign: 'center', fontSize: '13pt' } : {}}>{subjectText}</span>
          </div>

          {/* Salutation - Hidden for Office Orders */}
          {!isOfficeOrder && <div className="salutation">Respected {salText},</div>}

          {/* Letter Body */}
          <div className="body-container">
            <RefinedBody html={letter.body} />
          </div>

          {/* Enclosures & Signature Block */}
          <div className="flex justify-between items-end pt-8" style={{ pageBreakInside: 'avoid' }}>
            <div className="flex-1 pr-4">
              {enclosureItems.length > 0 && (
                <div className="text-[10.5pt]">
                  <div className="font-bold underline mb-1">Enclosures:</div>
                  {enclosureItems.map((item, i) => (
                    <div key={i} className="font-semibold">{item}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="signature-box flex-shrink-0">
              <div className="h-[20mm]"></div>
              <div className="signature-line"></div>
              <div className="signature-title">
                {sigName && `${sigName}\n`}{sigTitle}
              </div>
            </div>
          </div>

          {/* Copy Forwarded To (Endorsement) */}
          {fwdItems.length > 0 && (
            <div className="forwarding-section">
              <div className="forwarding-label">Copy Forwarded To:</div>
              {fwdItems.map((item, i) => (
                <div key={i} className="forwarding-item">{i + 1}. {item}</div>
              ))}
            </div>
          )}

        </div>
      </div>
    </PrintLayout>
  );
};
