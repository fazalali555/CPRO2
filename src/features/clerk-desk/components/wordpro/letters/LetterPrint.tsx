import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PrintLayout } from '@/components/PrintLayout';
import { useAutoPrint } from '@/utils/print';
import { useLetterComposer } from '../../../hooks/useLetterComposer';
import { OfficialLogo } from '@/components/OfficialLogo';
import { QRCode } from '@/components/QRCode';
import { APP_NAME, APP_AUTHOR, DEVELOPER } from '@/config/branding';
import { getSmartSalutation } from '@/features/clerk-desk/utils/salutation';
import { Letter } from '@/types/index';

/**
 * Helper for date formatting in official KPK letters
 */
const formatLetterDate = (dateStr?: string): string => {
  if (!dateStr) return "__ / __ / ____";
  // Handle YYYY-MM-DD
  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return `${iso[3]} / ${iso[2]} / ${iso[1]}`;
  }
  // Handle DD/MM/YYYY
  const dmy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    return `${dmy[1].padStart(2, "0")} / ${dmy[2].padStart(2, "0")} / ${dmy[3]}`;
  }
  return dateStr;
};

export const LetterPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { letters, getDepartmentInfo } = useLetterComposer();

  const printSettings = useMemo(() => {
    try {
      const saved = localStorage.getItem('clerk_pro_current_letter_print_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      paperSize: 'A4',
      marginTop: 12,
      marginBottom: 12,
      marginLeft: 15,
      marginRight: 20,
      watermark: ''
    };
  }, []);

  const letter = useMemo(() => {
    const fromState = letters.find(l => l.id === id);
    if (fromState) return fromState;
    
    // Fallback: Read directly from storage
    try {
      const allStr = localStorage.getItem('clerk_pro_clerk_letters');
      if (allStr) {
        const all: Letter[] = JSON.parse(allStr);
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
  
  const recipientLines = useMemo(() => {
    const to = letter?.to || '';
    return (typeof to === 'string' ? to : '').split('\n').map((l: string) => l.trim()).filter(Boolean);
  }, [letter?.to]);

  // Use saved salutation or compute smart salutation
  const salutationText = useMemo(() => {
    if (!letter) return '';
    return getSmartSalutation(
      letter.to || '',
      letter.institutionName || '',
      (letter as any).letterType || 'Letter'
    );
  }, [letter]);
  
  // Safe forwarding items
  const fwdItems = useMemo(() => {
    const fwd = letter?.forwardedTo as any;
    if (Array.isArray(fwd)) return fwd.map((l: string) => l.trim()).filter(Boolean);
    if (typeof fwd === 'string') return fwd.split('\n').map((l: string) => l.trim()).filter(Boolean);
    return [];
  }, [letter?.forwardedTo]);

  const enclosureItems = useMemo(() => {
    const enc = letter?.enclosures as any;
    if (typeof enc === 'string') return enc.split('\n').map((l: string) => l.trim()).filter(Boolean);
    return [];
  }, [letter?.enclosures]);

  const RefinedBody = ({ html }: { html: string }) => {
    if (!html) return null;
    return (
      <div 
        className="official-body-content text-justify leading-[1.6] ProseMirror prose" 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  };

  const sigName = letter?.signatureName || '';
  // HONOR USER CUSTOM OVERRIDE SIGNATURE TITLE
  const sigTitle = letter?.signatureTitle || (deptInfo as any).signatureTitle || '';

  useEffect(() => {
    if (letter) {
      document.title = `Letter - ${letter.subject}`;
      console.log("LetterPrint: Letter loaded, preparing to print", letter.id);
    }
  }, [letter]);

  useAutoPrint(!!letter);

  if (!letter) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Letter not found.</div>;
  }

  return (
    <PrintLayout 
      pageSize={printSettings.paperSize} 
      orientation="portrait"
      margins={{
        top: printSettings.marginTop || 12,
        bottom: printSettings.marginBottom || 12,
        left: printSettings.marginLeft || 15,
        right: printSettings.marginRight || 20
      }}
    >
      <style>{`
        @media print {
          body {
            background: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Ensure our specific wrapper is visible */
          .official-letter-print-wrapper,
          .official-letter-print-wrapper * {
            visibility: visible !important;
          }
        }

        /* Standardized Official Letter Styles */
        .official-letter-page {
          width: 100%;
          background: white;
          color: black;
          font-family: 'Times New Roman', Times, serif;
          font-size: 11.5pt;
          line-height: 1.5;
          text-align: justify;
          position: relative;
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
        
        .official-body-content > p {
          text-indent: 4em;
          margin-bottom: 1rem;
        }
        .official-body-content p:last-child {
          margin-bottom: 0;
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
          margin: 0 auto 8px auto;
        }
        .signature-title {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11pt;
          line-height: 1.4;
          white-space: pre-line;
        }
        .forwarding-section {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 10.5pt;
          page-break-inside: avoid;
        }
        .forwarding-label {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .forwarding-item {
          margin-left: 20px;
          margin-bottom: 4px;
        }

        /* --- Preserved ProseMirror / Tiptap WYSIWYG Styling --- */
        .ProseMirror ul, .prose ul {
          list-style-type: disc !important;
          padding-left: 2rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .ProseMirror ol, .prose ol {
          list-style-type: decimal !important;
          padding-left: 2rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .ProseMirror li, .prose li {
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
          display: list-item !important;
        }
        
        /* Preserved Image Styling */
        .ProseMirror img, .prose img {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
          margin: 1rem auto !important;
        }

        /* Preserved Table Styles and Presets */
        .ProseMirror table, .prose table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 1rem 0 !important;
        }
        .ProseMirror table td, .ProseMirror table th,
        .prose table td, .prose table th {
          border: 1px solid black !important;
          padding: 8px 12px !important;
          vertical-align: top !important;
          font-size: 11pt !important;
        }
      `}</style>
      
      <div className="official-letter-print-wrapper min-h-screen bg-slate-100 py-[40px] print:p-0 print:bg-white print:block flex justify-center">
        <div 
          className="print-page official-letter-page shadow-2xl print:shadow-none"
          style={{
            paddingTop: `${printSettings.marginTop || 12}mm`,
            paddingBottom: `${printSettings.marginBottom || 12}mm`,
            paddingLeft: `${printSettings.marginLeft || 15}mm`,
            paddingRight: `${printSettings.marginRight || 20}mm`,
          }}
        >
          {printSettings.watermark && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
              <div 
                className="text-gray-300/10 font-black uppercase text-center"
                style={{ 
                  transform: 'rotate(-45deg)', 
                  fontSize: '6.5rem',
                  whiteSpace: 'nowrap',
                  letterSpacing: '4px'
                }}
              >
                {printSettings.watermark}
              </div>
            </div>
          )}
          
          <div className="relative z-10">
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
              <div className="w-[105px] text-right pt-1 flex flex-col items-end">
                <div className="mb-2">
                  <QRCode value={
                    `https://wa.me/923432900419?text=${encodeURIComponent(
                      `*LETTER REPORT - Clerk Pro*\n\n` +
                      `*Subject:* ${letter?.subject || 'N/A'}\n` +
                      `*Reference:* ${letter?.reference || 'draft'}\n` +
                      `*Date:* ${letter?.letterDate || 'N/A'}\n` +
                      `*Office:* ${lhLine1}\n\n` +
                      `*App:* Clerk Pro RPMS\n` +
                      `*Developer:* Fazal Ali (+923432900419)`
                    )}`
                  } size={64} />
                </div>
                {officeProfile.tel && <div className="text-[9pt] leading-tight"><strong>Tel:</strong> {officeProfile.tel}</div>}
              </div>
            </div>

            <div className="double-divider"></div>

            {/* Reference & Date */}
            {(letter.reference || letter.letterDate) && (
              <div className="ref-date-row">
                <div>
                  {letter.reference && (
                    <>
                      <span className="font-bold">No. </span>
                      <span className="inline-block border-b border-black min-w-[80px] text-center px-2">{letter.reference}</span>
                    </>
                  )}
                </div>
                <div>
                  {letter.letterDate && (
                    <>
                      <span className="font-bold">Dated: </span>
                      {formatLetterDate(letter.letterDate)}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* To & Subject */}
            <div style={{ fontSize: '11.5pt', marginBottom: '16px' }}>
              {recipientLines.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold' }}>To</div>
                  <div style={{ paddingLeft: '90px' }}>
                    {recipientLines.map((line, i) => (
                      <div key={i} className="font-bold" style={{ lineHeight: 1.5 }}>
                        {line.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {letter.subject && (
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '90px', flexShrink: 0 }}>Subject:</div>
                  <div 
                    style={{ 
                      flexGrow: 1, 
                      paddingLeft: '8px',
                      fontWeight: 'bold', 
                      textDecoration: 'underline', 
                      textUnderlineOffset: '4px',
                      textTransform: 'uppercase',
                      lineHeight: 1.4
                    }}
                  >
                    {letter.subject}
                  </div>
                </div>
              )}
            </div>

            {/* Salutation */}
            {(() => {
               if (!salutationText || salutationText === 'MEMO') return null;
               const formattedSalText = salutationText.endsWith(',') ? salutationText.slice(0, -1) + ':' : salutationText;
               return (
                 <div className="salutation" style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '11.5pt' }}>
                   {formattedSalText}
                 </div>
               );
            })()}

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
                    {enclosureItems.map((item: string, i: number) => (
                      <div key={i} className="font-semibold">
                        {enclosureItems.length > 1 ? `${i + 1}. ${item}` : item}
                      </div>
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

            {/* Copy Forwarded To */}
            {fwdItems.length > 0 && (
              <div className="forwarding-section">
                <div className="forwarding-label">Copy Forwarded To:</div>
                {fwdItems.map((item: string, i: number) => (
                  <div key={i} className="forwarding-item">{i + 1}. {item}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PrintLayout>
  );
};
