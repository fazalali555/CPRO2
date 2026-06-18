import React, { useState, useEffect } from "react";
import { useEditorInstance, useEditorSettings } from "@/contexts/EditorContext";
import { EditorContent } from "@tiptap/react";
import { PageMargins, PageOrientation, PaperSize } from "@/types/editor";
import { motion } from "framer-motion";
import { 
    Bold, 
    Italic, 
    Underline, 
    Link as LinkIcon, 
    Type,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { HorizontalRuler } from "./Ruler";
import { OfficialLogo } from "@/components/OfficialLogo";
import { QRCode } from "@/components/QRCode";
import { getSmartSalutation } from "../../../utils/salutation";

interface DocumentEditorProps {
  className?: string;
  watermark?: string;
  showPageNumbers?: boolean;
  letterData?: {
    institutionName?: string;
    officeTitle?: string;
    districtLine?: string;
    reference?: string;
    letterDate?: string;
    to?: string;
    subject?: string;
    salutation?: string;
    signatureName?: string;
    signatureTitle?: string;
    tel?: string;
    enclosures?: string;
    forwardedTo?: string;
    departmentType?: string;
    letterType?: string;
  };
  onChangeField?: (field: string, value: string) => void;
}

/**
 * Helper for date formatting in official KPK letters
 */
const formatLetterDate = (dateStr?: string): string => {
  if (!dateStr) return "__ / __ / ____";
  // Handle ISO format YYYY-MM-DD
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

/**
 * Main document editor component with A4 page layout simulation, Ruler, and Margins
 */
export function DocumentEditor({ 
  className,
  watermark: propWatermark,
  showPageNumbers: propShowPageNumbers,
  letterData,
  onChangeField
}: DocumentEditorProps) {
  const editor = useEditorInstance();
  const { settings } = useEditorSettings();
  const { zoom, margins, orientation, pageSize: paperSize, pageColor = "#ffffff", showPageNumbers: settingsShowPageNumbers = false, showGridlines = false } = settings;
  const watermark = propWatermark || settings.watermark || ""; 
  const showPageNumbers = propShowPageNumbers !== undefined ? propShowPageNumbers : settingsShowPageNumbers;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fix 2: Enable pinch zoom meta tag
  useEffect(() => {
    if (isMobile) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=0.5, maximum-scale=5.0, user-scalable=yes');
      }
      return () => {
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
      };
    }
  }, [isMobile]);

  // Touch-to-mouse event bridge for mobile table column resizing in ProseMirror
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.classList.contains('column-resize-handle') || target.closest('.column-resize-handle'))) {
        const touch = e.touches[0];
        if (!touch) return;

        e.preventDefault();

        const mouseEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: touch.clientX,
          clientY: touch.clientY,
          screenX: touch.screenX,
          screenY: touch.screenY,
        });
        target.dispatchEvent(mouseEvent);

        const handleTouchMove = (moveEvent: TouchEvent) => {
          const moveTouch = moveEvent.touches[0];
          if (!moveTouch) return;
          moveEvent.preventDefault();

          const mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: moveTouch.clientX,
            clientY: moveTouch.clientY,
            screenX: moveTouch.screenX,
            screenY: moveTouch.screenY,
          });
          target.dispatchEvent(mouseMoveEvent);
        };

        const handleTouchEnd = () => {
          window.removeEventListener('touchmove', handleTouchMove, { capture: true });
          window.removeEventListener('touchend', handleTouchEnd, { capture: true });

          const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          target.dispatchEvent(mouseUpEvent);
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
    };
  }, [isMobile]);

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="animate-pulse text-gray-400">Initializing editor...</div>
      </div>
    );
  }

  // Dimensions in mm
  const paperDimensions = {
    A4: { width: 210, height: 297 },
    Letter: { width: 215.9, height: 279.4 },
    Legal: { width: 215.9, height: 355.6 },
  };

  const currentSize = paperDimensions[paperSize as keyof typeof paperDimensions] || paperDimensions.A4;
  const width = orientation === "portrait" ? currentSize.width : currentSize.height;
  const height = orientation === "portrait" ? currentSize.height : currentSize.width;

  const isFluid = settings.viewMode === 'fluid';
  const isLetter = !!letterData;
  const renderAsA4 = !isMobile || isLetter;

  // Fix 1 & 6: Mobile scale and style
  const motionAnimate = !renderAsA4 ? { scale: 1 } : { scale: zoom / 100 };

  const pageStyle = !renderAsA4 ? {
    width: '100%',
    maxWidth: '100vw',
    minHeight: '297mm',
    transformOrigin: 'top center',
    marginBottom: '2rem',
    backgroundColor: pageColor,
    padding: '16px',
    fontSize: '10pt',
  } : {
    width: `${width}mm`,
    minHeight: `${height}mm`,
    transformOrigin: "top center",
    marginBottom: "4rem",
    backgroundColor: pageColor
  };

  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center",
        !isLetter && "bg-gray-100", // No gray background when inside Letter Composer
        (isMobile && !isLetter)
          ? "overflow-y-auto overflow-x-hidden p-2"
          : (!isLetter ? "overflow-auto p-8 custom-scrollbar" : ""),
        isFluid && "bg-white p-0",
        className
      )}
    >
      {/* Horizontal Ruler - moved outside scaled motion.div to keep scale consistent */}
      {!isFluid && settings.showRuler && (
        <div className="w-full shrink-0 z-20" style={{ maxWidth: '794px', margin: '0 auto' }}>
          <HorizontalRuler 
              width={width}
              leftMargin={margins.left}
              rightMargin={margins.right}
          />
        </div>
      )}

      {/* Page Content Wrapper */}
      <motion.div 
        layout
        initial={false}
        animate={motionAnimate}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
            "flex flex-col relative bg-white",
            !isFluid && renderAsA4 && !isLetter && "border border-gray-200/50 shadow-[0_20px_50px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.05),inset_0_0_0_1px_rgba(255,255,255,0.5)]",
            !isFluid && !renderAsA4 && "bg-white",
            isFluid && "w-full min-h-full",
            showGridlines && "show-gridlines"
        )} 
        style={!isFluid ? pageStyle : {}}
      >
        {/* Watermark Layer */}
        {watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
            <div 
              className="text-gray-200/40 font-black uppercase text-center border-4 border-gray-200/20 rounded-2xl px-12 py-6 transform -rotate-45 whitespace-nowrap"
              style={{ fontSize: `${width / 3}px`, lineHeight: 1 }}
            >
              {watermark}
            </div>
          </div>
        )}

        {/* Page Container */}
        <div 
          className={cn("flex-1 relative z-10", isFluid && "max-w-4xl mx-auto w-full px-8 py-12")}
          style={!isFluid ? { 
            paddingTop: `${margins.top}mm`,
            paddingRight: `${margins.right}mm`,
            paddingBottom: `${margins.bottom}mm`,
            paddingLeft: `${margins.left}mm`,
            fontFamily: "'Times New Roman', serif",
            color: '#000',
            fontSize: '11pt',
            lineHeight: 1.6
          } : {}}
        >
          {/* Official Letterhead (Conditional) */}
          {isLetter && !isFluid && (
            <div className="mb-8">
              <div className="flex justify-between items-start mb-2 w-full text-black" style={{ width: '100%' }}>
                <div className="w-[70px] flex-shrink-0 pt-1 flex justify-start">
                  <OfficialLogo className="w-[60px] h-[60px]" departmentType={letterData.departmentType} />
                </div>
                <div className="flex-grow text-center px-4 pt-1">
                  <textarea
                    className="inline-editable-field text-[14pt] font-black uppercase leading-tight tracking-tight text-center w-full"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      fontFamily: 'inherit',
                      fontSize: '14pt',
                      fontWeight: 900,
                      color: 'inherit',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      resize: 'none',
                      padding: 0,
                      margin: 0,
                    }}
                    rows={Math.max(1, (letterData.institutionName || "").split('\n').length)}
                    value={letterData.institutionName || ""}
                    onChange={e => onChangeField?.("institutionName", e.target.value)}
                    placeholder="ENTER OFFICE NAME..."
                  />
                  {letterData.districtLine && (
                    <h2 className="text-[9.5pt] font-bold mt-1 leading-tight">
                      {letterData.districtLine}
                    </h2>
                  )}
                  <h3 className="text-[9pt] font-semibold mt-0.5">
                    Govt. of Khyber Pakhtunkhwa.
                  </h3>
                </div>
                <div className="text-[8.5pt] w-[100px] pt-2 font-serif leading-snug text-right">
                  {letterData.tel && <p><strong>Tel:</strong> {letterData.tel}</p>}
                  <div className="flex justify-end mt-2">
                    <QRCode value={letterData.reference || 'draft'} size={64} />
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '4px double #000', margin: '8px 0 20px 0' }} />

              <div className="flex justify-between font-bold mb-5" style={{ fontSize: '11pt', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>No.</span>
                  <input
                    className="inline-editable-field font-bold border-b border-black text-center px-2"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid black',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: '11pt',
                      fontWeight: 'bold',
                      color: 'inherit',
                      textAlign: 'center',
                      padding: '0 4px',
                      margin: 0,
                      width: '180px',
                    }}
                    value={letterData.reference || ""}
                    onChange={e => onChangeField?.("reference", e.target.value)}
                    placeholder="e.g. 1024/ESE"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Dated:</span>
                  <input
                    type="date"
                    className="inline-editable-field font-bold"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: '11pt',
                      fontWeight: 'bold',
                      color: 'inherit',
                      padding: '0 4px',
                      margin: 0,
                      width: '140px',
                    }}
                    value={letterData.letterDate || ""}
                    onChange={e => onChangeField?.("letterDate", e.target.value)}
                  />
                </div>
              </div>

              {/* To & Subject Vertically Stacked (Image 2 style) */}
              <div className="mb-6" style={{ fontSize: '11.5pt', fontFamily: "'Times New Roman', serif" }}>
                {/* To Row */}
                <div style={{ display: 'flex', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '90px', fontWeight: 'bold', flexShrink: 0 }}>To:</div>
                  <div style={{ flexGrow: 1, paddingLeft: '8px' }}>
                    <textarea
                      className="inline-editable-field font-bold w-full"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'inherit',
                        fontSize: '11.5pt',
                        fontWeight: 'bold',
                        color: 'inherit',
                        resize: 'none',
                        padding: 0,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                      rows={Math.max(2, (letterData.to || "").split('\n').length)}
                      value={letterData.to || ""}
                      onChange={e => onChangeField?.("to", e.target.value)}
                      placeholder="Enter Recipient Designation..."
                    />
                  </div>
                </div>

                {/* Subject Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '90px', flexShrink: 0 }}>Subject:</div>
                  <div 
                    style={{ 
                      flexGrow: 1, 
                      paddingLeft: '8px',
                      lineHeight: 1.4
                    }}
                  >
                    <textarea
                      className="inline-editable-field font-bold w-full"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'inherit',
                        fontSize: '11.5pt',
                        fontWeight: 'bold',
                        color: 'inherit',
                        resize: 'none',
                        padding: 0,
                        margin: 0,
                        textDecoration: 'underline',
                        textUnderlineOffset: '4px',
                        textTransform: 'uppercase',
                      }}
                      rows={Math.max(1, (letterData.subject || "").split('\n').length)}
                      value={letterData.subject || ""}
                      onChange={e => onChangeField?.("subject", e.target.value)}
                      placeholder="ENTER SUBJECT..."
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const sal = getSmartSalutation(
                  letterData.to || '',
                  letterData.institutionName || '',
                  letterData.letterType || 'Letter'
                )

                if (!sal || sal === 'MEMO') return null

                // Replace trailing comma with colon to match Image 2
                const formattedSalText = sal.endsWith(',') ? sal.slice(0, -1) + ':' : sal;

                return (
                  <div className="font-bold mb-4" style={{ fontSize: '11.5pt' }}>
                    <input
                      className="inline-editable-field font-bold w-full"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'inherit',
                        fontSize: '11.5pt',
                        fontWeight: 'bold',
                        color: 'inherit',
                        padding: 0,
                        margin: 0,
                      }}
                      value={formattedSalText}
                      onChange={e => onChangeField?.("salutation", e.target.value)}
                      placeholder="Respected Sir:"
                    />
                  </div>
                )
              })()}
            </div>
          )}

          {/* Tiptap Editable Content */}
          <EditorContent 
            editor={editor} 
            className={cn(
              "prose max-w-none focus:outline-none min-h-[150mm] leading-relaxed tracking-tight",
              "prose-headings:font-bold",
              "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
              "prose-p:my-2 prose-p:leading-relaxed",
              !isFluid && "prose-p:indent-[4em]", // Apply 4em indentation in print mode
              "prose-table:border-collapse prose-table:w-full",
              "prose-td:border prose-td:border-gray-400 prose-td:p-2",
              "prose-th:border prose-th:border-gray-400 prose-th:p-2",
              "prose-th:bg-gray-100 prose-th:font-bold",
              "prose-li:my-0.5",
              "prose-blockquote:border-l-4 prose-blockquote:pl-4",
              "prose-blockquote:border-gray-400 prose-blockquote:italic",
              "[&_table]:border-collapse [&_table]:w-full",
              "[&_td]:border [&_td]:border-gray-400 [&_td]:p-2 [&_td]:min-w-[25px]",
              "[&_th]:border [&_th]:border-gray-400 [&_th]:p-2",
              "[&_th]:bg-gray-50 [&_th]:font-bold [&_th]:text-left",
              "[&_.selectedCell]:bg-blue-50/30",
              "[&_.tableWrapper]:overflow-x-auto",
              "[&_.resize-cursor]:cursor-col-resize",
              "[&_.column-resize-handle]:absolute [&_.column-resize-handle]:-right-0.5 [&_.column-resize-handle]:top-0 [&_.column-resize-handle]:bottom-0 [&_.column-resize-handle]:w-1 [&_.column-resize-handle]:bg-blue-400 [&_.column-resize-handle]:pointer-events-none"
            )}
          />

          {/* Signature & Enclosures (Conditional) */}
          {isLetter && !isFluid && (
            <div className="mt-12">
               <div className="flex justify-between items-end">
                  <div className="flex-1 pr-4">
                     {letterData.enclosures && (
                       <div className="text-[10.5pt]">
                         <div className="font-bold underline mb-1">Enclosures:</div>
                         <textarea
                           className="inline-editable-field font-semibold w-full"
                           style={{
                             background: 'transparent',
                             border: 'none',
                             outline: 'none',
                             width: '100%',
                             fontFamily: 'inherit',
                             fontSize: '10.5pt',
                             fontWeight: 'semibold',
                             color: 'inherit',
                             resize: 'none',
                             padding: 0,
                             margin: 0,
                           }}
                           rows={Math.max(1, (letterData.enclosures || "").split('\n').length)}
                           value={letterData.enclosures || ""}
                           onChange={e => onChangeField?.("enclosures", e.target.value)}
                           placeholder="List enclosures..."
                         />
                       </div>
                     )}
                  </div>
                  <div className="w-[240px] text-center">
                    <div className="h-16" />
                    <div className="border-t border-black w-[200px] mx-auto mb-2" />
                    <textarea
                      className="inline-editable-field font-bold uppercase w-full text-center"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'inherit',
                        fontSize: '10.5pt',
                        fontWeight: 'bold',
                        color: 'inherit',
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        resize: 'none',
                        padding: 0,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                      rows={2}
                      value={`${letterData.signatureName ? letterData.signatureName + '\n' : ''}${letterData.signatureTitle || ''}`}
                      onChange={e => {
                        const lines = e.target.value.split('\n');
                        const name = lines[0] || '';
                        const title = lines.slice(1).join('\n') || '';
                        onChangeField?.("signatureName", name);
                        onChangeField?.("signatureTitle", title);
                      }}
                      placeholder="SIGNATORY INFO..."
                    />
                  </div>
               </div>

               {letterData.forwardedTo && (
                 <div className="mt-10 pt-4 border-t border-gray-100 text-[10pt]">
                    <div className="font-bold mb-2">Copy Forwarded To:</div>
                    <textarea
                      className="inline-editable-field w-full ml-4"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        fontFamily: 'inherit',
                        fontSize: '10pt',
                        color: 'inherit',
                        resize: 'none',
                        padding: 0,
                        margin: 0,
                      }}
                      rows={Math.max(2, (letterData.forwardedTo || "").split('\n').length)}
                      value={letterData.forwardedTo || ""}
                      onChange={e => onChangeField?.("forwardedTo", e.target.value)}
                      placeholder="List endorsements..."
                    />
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Footer / Page Numbers */}
        {showPageNumbers && !isFluid && (
          <div 
            className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400 select-none pointer-events-none"
            style={{ paddingBottom: `${margins.bottom / 2}mm` }}
          >
            Page 1 of 1
          </div>
        )}
      </motion.div>
    </div>
  );
}
