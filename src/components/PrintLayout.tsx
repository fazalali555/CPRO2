
import React from 'react';
import { AppIcon } from './AppIcon';
import { QRCode } from './QRCode';

interface PrintLayoutProps {
  children: React.ReactNode;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'Legal';
  caseId?: string;
  documentId?: string;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ 
  children, 
  orientation = 'portrait', 
  pageSize = 'A4',
  caseId,
  documentId
}) => {
  const handlePrint = () => {
    // Timeout ensures UI updates (like ripples) finish before print dialog freezes the thread
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const verificationUrl = caseId 
    ? `${window.location.origin}/#/verify/${caseId}${documentId ? `?doc=${documentId}` : ''}`
    : '';

  const css = `
    @page { 
      size: ${pageSize} ${orientation}; 
      margin: 0mm; 
    }
    @media print {
      html, body {
        margin: 0;
        padding: 0;
        background: white;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .print-page {
        width: ${orientation === 'landscape' ? '297mm' : (pageSize === 'Legal' ? '216mm' : '210mm')} !important;
        height: auto !important; /* Allow height to adjust */
        min-height: ${orientation === 'landscape' ? '210mm' : (pageSize === 'Legal' ? '356mm' : '297mm')} !important;
        overflow: visible !important; /* Allow content to flow */
        page-break-inside: avoid !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        position: relative !important;
        display: block !important;
        background-color: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        transform: scale(1) !important;
        transform-origin: top left !important;
      }
      
      /* Ensure single page fit if needed */
      .fit-page {
        height: ${orientation === 'landscape' ? '210mm' : (pageSize === 'Legal' ? '356mm' : '297mm')} !important;
        overflow: hidden !important;
      }
      .print-page:not(:last-child) {
        page-break-after: always !important;
      }
      .print-page:last-child {
        page-break-after: auto !important;
      }
      .print-break {
        page-break-after: always !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .print-break:last-child {
        page-break-after: auto !important;
      }
      /* Ensure images fill the page and colors are preserved */
      img {
        max-width: none !important;
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
      /* Fix for QR code positioning in different browsers */
      .verification-qr {
        position: absolute !important;
        top: 10mm !important;
        right: 10mm !important;
        z-index: 100 !important;
        display: none !important;
      }
      /* Affidavit Legal Page Fit - keep header space and anchor bottom */
      .affidavit-legal {
        line-height: 1.4 !important;
      }
      .affidavit-legal .aff-content {
        min-height: ${pageSize === 'Legal' ? 'calc(356mm - 120mm)' : 'auto'} !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .affidavit-legal .aff-title {
        margin-bottom: 6mm !important;
      }
      .affidavit-legal .aff-footer-grid {
        row-gap: 10mm !important;
        column-gap: 8mm !important;
        margin-top: 12mm !important;
      }
      .affidavit-legal .aff-bottom {
        margin-top: auto !important;
      }
    }
  `;

  return (
    <div className="bg-white text-black w-full min-h-screen relative">
       {/* Inject Styles */}
       <style dangerouslySetInnerHTML={{__html: css}} />

       {/* Manual Print Button - Visible on Screen, Hidden in Print */}
       <div className="no-print fixed top-0 left-0 right-0 z-[100] bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
             <AppIcon name="print" className="text-white" />
             <span className="font-bold">Print Preview ({pageSize} - {orientation})</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handlePrint}
              className="bg-white text-slate-900 px-6 py-2 font-bold text-sm hover:bg-slate-200 transition-colors shadow-sm active:scale-95 flex items-center gap-2"
            >
               <AppIcon name="print" size={18} /> Print Document
             </button>
             <button 
               type="button"
               onClick={() => window.close()}
               className="text-white/70 hover:text-white p-2 hover:bg-white/10 transition-colors"
               title="Close"
             >
               <AppIcon name="close" />
             </button>
          </div>
       </div>
       
       {/* Spacer for fixed header */}
       <div className="h-20 no-print"></div>
       
      <div className="block pb-20 print:pb-0">
          {children}
       </div>

       {/* Verification QR - Moved inside a hidden div that only shows in print if needed, 
           but actually it's better to let each page handle its own if needed, 
           or keep it absolute to the first page. */}
       {verificationUrl && (
         <div className="hidden print:block verification-qr opacity-80">
           <div className="flex flex-col items-center gap-1">
             <QRCode value={verificationUrl} size={60} />
             <span className="text-[6px] font-sans uppercase tracking-tighter text-gray-500">
               Verify @ {window.location.hostname}
             </span>
           </div>
         </div>
       )}
    </div>
  );
};
