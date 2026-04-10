
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getFileFromIDB } from '../utils';
import { AppIcon } from '../components/AppIcon';

export const Print: React.FC = () => {
  const { fileId } = useParams();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const loadFile = async () => {
      if (!fileId) return;
      try {
        const data = await getFileFromIDB(fileId);
        if (data) {
          const blob = new Blob([data as Uint8Array], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        } else {
          setError("File not found");
        }
      } catch (e) {
        console.error(e);
        setError("Error loading file");
      }
    };
    loadFile();
  }, [fileId]);

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } catch (e) {
        console.warn("Iframe print failed, falling back to window print", e);
        window.print();
      }
    } else {
      window.print();
    }
  };

  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!blobUrl) return <div className="p-8 text-center">Loading document...</div>;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
       <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 shadow-md no-print">
          <span className="font-bold flex items-center gap-2"><AppIcon name="print" /> Print Preview</span>
          <div className="text-xs opacity-70 hidden sm:block">
             Use browser print dialog (Ctrl+P). Ensure "Fit to Page" is disabled for 100% scale.
          </div>
          <div className="flex items-center gap-3">
            <button 
               type="button"
               onClick={handlePrint}
               className="bg-white text-slate-900 px-4 py-1.5 rounded font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
               <AppIcon name="print" size={18} /> Print Document
            </button>
            <button type="button" onClick={() => window.close()} className="hover:bg-white/10 p-2 rounded-full"><AppIcon name="close" /></button>
          </div>
       </div>
       <iframe 
         ref={iframeRef}
         src={blobUrl} 
         className="flex-1 w-full h-full border-none" 
         title="Print Preview"
       />
    </div>
  );
};
