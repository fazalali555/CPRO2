
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { calculateServiceDuration, getCoverLetterInfo } from '../../utils';
import { format, parseISO } from 'date-fns';

interface Props {
  employeeRecord: EmployeeRecord;
  caseRecord: CaseRecord;
  onReady?: () => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
};

type Anchor = 'left' | 'center' | 'right';

type OverlayConfig = {
  id: string;
  x: number;      // mm from left
  y: number;      // mm from top
  anchor?: Anchor; // defaults to 'left'
  label?: string; // Small label above value
  value: string | number;
  bold?: boolean;
  fontSize?: number; // pt
  vertical?: boolean; // rotate -90deg
  color?: string;
};

export const LeaveAccountProforma: React.FC<Props> = ({ employeeRecord, caseRecord, onReady }) => {
  // --- CALCULATIONS (KP Revised Leave Rules 1981) ---
  const doa = employeeRecord.service_history.date_of_appointment;
  const dor = employeeRecord.service_history.date_of_retirement;
  const lwp = employeeRecord.service_history.lwp_days || 0;
  
  // 1. Service Breakdown
  const service = calculateServiceDuration(doa, dor, lwp);
  const formattedServiceDuration = `${service.years}-${service.months}-${service.days}`;

  // 2. 16-Day Rule for Full Calendar Months
  const extraMonth = service.days >= 16 ? 1 : 0;
  const fullCalendarMonths = (service.years * 12) + service.months + extraMonth;
  
  // 3. Department Rate
  const staffType = employeeRecord.employees.staff_type || 'teaching';
  const leaveRate = staffType === 'teaching' ? 1 : 4;
  
  // 4. Earned / Credit
  const leaveEarnedDays = fullCalendarMonths * leaveRate;
  
  // 5. Leave Taken & Balance
  // Priority: Employee Record > Case Record (Fallback)
  const leaveTakenDays = employeeRecord.service_history.leave_taken_days || Number(caseRecord.extras?.leave_taken_days) || 0;
  
  const lprCap = employeeRecord.service_history.lpr_days || 365;
  
  // Balance calculation
  const balance = Math.max(0, leaveEarnedDays - leaveTakenDays);
  
  // Effective LPR (Encashment amount) is min(balance, 365)
  const effectiveLPR = Math.min(balance, lprCap);

  // Header helpers
  const { headerTitle } = getCoverLetterInfo(employeeRecord);
  const departmentServed = employeeRecord.employees.school_full_name || headerTitle;

  // --- PERMANENT CALIBRATED OVERLAYS ---
  const OVERLAYS: OverlayConfig[] = [
    { id: 'header_name', value: employeeRecord.employees.name || '', x: 105, y: 24, anchor: 'center', bold: true, fontSize: 12 },
    { id: 'header_doa', value: formatDate(doa), x: 240, y: 24, anchor: 'right', bold: true, fontSize: 12 },
    { id: 'header_dor', value: formatDate(dor), x: 105, y: 34, anchor: 'center', bold: true, fontSize: 12 },

    { id: 'row_office', label: 'Dept', value: departmentServed || '', x: 20, y: 135, anchor: 'center', vertical: true, fontSize: 8, bold: true },

    { id: 'row_doa', label: 'DoA', value: formatDate(doa), x: 34, y: 122, anchor: 'center', bold: true, fontSize: 8 },
    { id: 'row_dor', label: 'DoR', value: formatDate(dor), x: 52, y: 122, anchor: 'center', bold: true, fontSize: 8 },
    { id: 'row_service', label: 'Service', value: formattedServiceDuration, x: 69, y: 122, anchor: 'center', bold: true, fontSize: 8 },

    // Col 6/7: Leave Earned / Credit
    { id: 'row_earned', label: 'Credit', value: leaveEarnedDays, x: 81, y: 122, anchor: 'center', bold: true, fontSize: 11 },

    // Col 10: Leave Taken
    { id: 'row_taken', label: 'Taken', value: leaveTakenDays > 0 ? leaveTakenDays : '-', x: 236, y: 122, anchor: 'center', bold: true, fontSize: 8 },

    // Col 17: LPR (Encashable)
    { id: 'row_lpr', label: 'LPR', value: effectiveLPR, x: 158, y: 122, anchor: 'center', bold: true, fontSize: 11 },
    
    // Col 21: Final Balance
    { id: 'row_balance', label: 'Balance', value: balance, x: 246, y: 122, anchor: 'center', bold: true, fontSize: 11 },
    
    // Col 22 (Remarks / Second LPR entry if needed)
    { id: 'row_lpr_2', label: 'LPR', value: effectiveLPR, x: 255, y: 122, anchor: 'center', bold: true, fontSize: 11 },
  ];

  return (
    <div 
      className="relative bg-white text-black overflow-hidden select-none print-container"
      style={{
        width: '297mm',
        height: '210mm',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        position: 'relative'
      }}
    >
      {/* 
         CRITICAL FIX: Override global print reset for transforms.
         This ensures centered and rotated text appears correctly in print.
      */}
      <style>{`
        @media print {
          .print-overlay {
            transform: var(--print-transform) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Background Template - Z Index 0 */}
      <img 
        src="/templates/leave-account-proforma.png" 
        alt="Leave Account Template" 
        className="absolute inset-0 w-full h-full block print:block"
        style={{ objectFit: 'fill', zIndex: 0 }} 
        onLoad={onReady}
        onError={(e) => { e.currentTarget.style.display = 'none'; onReady?.(); }}
      />
      
      {/* --- OVERLAYS - Z Index 50 --- */}
      {OVERLAYS.map((o) => {
        // Determine Transform based on Anchor
        let transform = 'translate(0, 0)';
        if (o.anchor === 'center') transform = 'translate(-50%, 0)';
        if (o.anchor === 'right') transform = 'translate(-100%, 0)';
        
        if (o.vertical) {
           transform = 'translate(-50%, -50%) rotate(-90deg)';
        }

        return (
          <div
            key={o.id}
            style={{
              position: 'absolute',
              left: `${o.x}mm`,
              top: `${o.y}mm`,
              transform: transform,
              whiteSpace: 'nowrap',
              zIndex: 50, // Force higher z-index for print
              pointerEvents: 'none',
              lineHeight: 1,
              // @ts-ignore - CSS Custom Property for print override
              '--print-transform': transform,
            }}
            className="print-overlay"
          >
            {/* Label (Above - Screen Only) */}
            {o.label && !o.vertical && (
              <div 
                className="text-[8px] text-gray-600 font-medium text-center uppercase tracking-tighter leading-none mb-0.5 print:hidden"
                style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)' }}
              >
                {o.label}
              </div>
            )}

            {/* Value */}
            <div 
              style={{ 
                fontSize: o.fontSize ? `${o.fontSize}pt` : '10pt', 
                fontWeight: o.bold ? 'bold' : 'normal',
                color: 'black', 
              }}
            >
              {o.value}
            </div>
          </div>
        );
      })}

      {/* Footer Meta Data (Hidden in Print) */}
      <div className="absolute bottom-1 right-2 text-[7pt] text-gray-400 font-mono text-right leading-tight print:hidden z-30">
        Type: {staffType} | Rate: {leaveRate} | Months: {fullCalendarMonths}
      </div>
    </div>
  );
};
