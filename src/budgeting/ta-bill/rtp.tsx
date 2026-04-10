// rtp.tsx - Revised Tour Program Component (COMPLETE FIXED VERSION)
import React, { useRef, useEffect, useCallback, useState } from 'react';

export interface RTPRow {
  date: string;
  from: string;
  to: string;
  distKm: number;
  remarks: string;
  nights?: number;
  daDays?: number;
  rateType?: 'auto' | 'ordinary' | 'special';
  sameDayReturn?: boolean;
}

export interface RevisedTourProgramProps {
  titleOffice?: string;
  titleCaption?: string;
  officerName?: string;
  monthLabel?: string;
  station?: string;
  employeeName?: string;
  rows: RTPRow[];
}

interface RTPDisplayRow {
  type: 'journey' | 'hotel' | 'return';
  date: string;
  from: string;
  to: string;
  distKm: number;
  remarks: string;
  nights?: number;
}

// Helper function to format date as dd/mm/yyyy
const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Helper to add days to a date string
const addDaysToDate = (dateStr: string, days: number): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const expandRTPForDisplay = (rows: RTPRow[]): RTPDisplayRow[] => {
  const result: RTPDisplayRow[] = [];
  
  for (const r of rows) {
    if (r.sameDayReturn) {
      result.push({
        type: 'return',
        date: r.date,
        from: r.from,
        to: r.to,
        distKm: r.distKm,
        remarks: r.remarks || 'Return to Headquarters',
        nights: 0
      });
    } else {
      result.push({
        type: 'journey',
        date: r.date,
        from: r.from,
        to: r.to,
        distKm: r.distKm,
        remarks: r.remarks,
        nights: 0
      });
      
      const nights = Number(r.nights) || 0;
      if (nights > 0) {
        result.push({
          type: 'hotel',
          date: '',
          from: '',
          to: r.to,
          distKm: 0,
          remarks: 'Hotel / Night Charges',
          nights: nights
        });
      }
    }
  }
  
  return result;
};

const ROW_LIMIT = 18;

export const RevisedTourProgram: React.FC<RevisedTourProgramProps> = ({
  titleOffice = 'OFFICE OF THE HEAD MISTRESS GGHS RABAT',
  titleCaption = 'Revised Tour Program',
  officerName = '',
  monthLabel = '',
  station = '',
  employeeName = '',
  rows
}) => {
  const displayRows = expandRTPForDisplay(rows);
  
  const pages: RTPDisplayRow[][] = [];
  for (let i = 0; i < displayRows.length; i += ROW_LIMIT) {
    pages.push(displayRows.slice(i, i + ROW_LIMIT));
  }
  if (pages.length === 0) pages.push([]);

  const resolvedTitle = station ? `OFFICE OF THE ${station.toUpperCase()}` : titleOffice;

  const printStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&family=Great+Vibes&display=swap');
    .font-arial { font-family: 'Arimo', Arial, sans-serif; }
    
    @media print {
      @page { 
        size: A4 portrait; 
        margin: 10mm; 
      }
      
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .print-wrapper {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        min-height: auto !important;
      }
      
      .print-container {
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 5mm 10mm !important;
        page-break-after: always;
        page-break-inside: avoid;
      }
      
      .print-container:last-child {
        page-break-after: avoid;
      }
    }
  `;

  return (
    <div className="bg-gray-100 min-h-screen p-8 text-black print-wrapper">
      <style>{printStyles}</style>

      {pages.map((pageRows, index) => (
        <div 
          key={index} 
          className={`print-container bg-white mx-auto relative shadow-xl font-arial ${index > 0 ? 'mt-8' : ''}`}
          style={{ width: '210mm', minHeight: '280mm', padding: '15mm 15mm', boxSizing: 'border-box' }}
        >
          {/* Header */}
          <div className="text-center mb-8 mt-4">
            <h1 className="text-[18px] font-normal uppercase tracking-wide">{resolvedTitle}</h1>
            <h2 className="text-[20px] mt-1 font-normal">{titleCaption}</h2>
          </div>

          {/* Officer Info */}
          <div className="flex items-end justify-between mb-2 text-[12px]">
            <div className="flex items-end flex-grow w-1/2">
              <span className="font-bold whitespace-nowrap mr-4 text-[13px]">Name of Officer</span>
              <div className="border-b border-black flex-grow text-center font-bold pb-1 px-2">
                {officerName || '________________'}
              </div>
            </div>
            <div className="flex items-end flex-grow w-1/2 ml-4">
              <span className="font-bold whitespace-nowrap mr-4 text-[13px]">For the Month Of</span>
              <div className="border-b border-black flex-grow text-center font-bold pb-1 px-2">
                {monthLabel || '________________'}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="w-full border-t border-l border-black">
            <table className="w-full border-collapse">
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '30%' }} />
              </colgroup>
              <thead>
                <tr className="text-[12px]">
                  <th className="border-b border-r border-black py-2 font-bold text-left px-2">Dated</th>
                  <th className="border-b border-r border-black py-2 font-bold text-center">From</th>
                  <th className="border-b border-r border-black py-2 font-bold text-center">To</th>
                  <th className="border-b border-r border-black py-2 font-bold text-center leading-tight">Distance in<br/>Km</th>
                  <th className="border-b border-r border-black py-2 font-bold text-center">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, rIdx) => (
                  <tr key={rIdx} className="text-[10px] h-[10mm]">
                    {row.type === 'hotel' ? (
                      <>
                        <td className="border-b border-r border-black px-2 text-center align-middle"></td>
                        <td colSpan={2} className="border-b border-r border-black px-1 text-center align-middle">
                          Stayed at Hotel
                        </td>
                        <td className="border-b border-r border-black px-1 text-center align-middle">
                          {row.nights} Night{(row.nights || 0) > 1 ? 's' : ''}
                        </td>
                        <td className="border-b border-r border-black px-1 text-left align-middle leading-tight">
                          {row.remarks}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border-b border-r border-black px-2 text-center align-middle">
                          {formatDateDisplay(row.date)}
                        </td>
                        <td className="border-b border-r border-black px-1 text-left align-middle">{row.from}</td>
                        <td className="border-b border-r border-black px-1 text-left align-middle">{row.to}</td>
                        <td className="border-b border-r border-black px-1 text-center align-middle">
                          {row.distKm ? `${row.distKm} K.M` : ''}
                        </td>
                        <td className="border-b border-r border-black px-1 text-left align-middle leading-tight">
                          {row.remarks}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="mt-16">
            <div className="flex justify-end mb-16">
              <div className="text-center w-[60mm]">
                <div className="h-[15mm]"></div>
                <div className="border-t border-black w-full mb-1"></div>
                <div className="text-[12px] font-bold">{employeeName || 'Authorized Signatory'}</div>
              </div>
            </div>

            <div className="flex justify-start items-end">
              <span className="text-[12px] mb-1 mr-4">Counter Signed By</span>
              <div className="flex flex-col">
                <div className="h-[12mm]"></div>
                <div className="border-b border-black w-[80mm]"></div>
              </div>
            </div>
          </div>

          {/* Page Number */}
          {pages.length > 1 && (
            <div className="absolute bottom-[10mm] right-[15mm] text-[9px] text-gray-500">
              Page {index + 1} of {pages.length}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============ RTP EDITOR (FIXED) ============

export interface RevisedTourProgramEditorProps {
  value: RTPRow[];
  onChange: (rows: RTPRow[]) => void;
  station?: string;
  onFinish?: () => void;
}

export const RevisedTourProgramEditor: React.FC<RevisedTourProgramEditorProps> = ({ 
  value, 
  onChange, 
  station,
  onFinish 
}) => {
  const rows = value;
  const lastRowRef = useRef<HTMLDivElement>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  
  // Filter out auto-generated return rows for user editing
  const userRows = rows.filter(r => !r.sameDayReturn);
  
  // Add new trip row with smart defaults
  const addRow = useCallback(() => {
    // Get the last user row to copy date from
    const lastUserRow = userRows[userRows.length - 1];
    let defaultDate = '';
    
    if (lastUserRow?.date) {
      // If last row has nights, add those nights to get next date
      const nights = Number(lastUserRow.nights) || 0;
      if (nights > 0) {
        defaultDate = addDaysToDate(lastUserRow.date, nights);
      } else {
        // Same day trip - use same date for convenience
        defaultDate = lastUserRow.date;
      }
    }
    
    const newRow: RTPRow = { 
      date: defaultDate,
      from: station || '', 
      to: '', 
      distKm: 0, 
      remarks: '', 
      nights: 0, 
      daDays: 0, 
      rateType: 'auto', 
      sameDayReturn: false 
    };
    
    onChange([...rows, newRow]);
    setExpandedIndex(userRows.length);
    setJustAdded(true);
  }, [rows, station, onChange, userRows]);
  
  const updateRow = (i: number, patch: Partial<RTPRow>) => {
    onChange(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  };
  
  const removeRow = (i: number) => {
    onChange(rows.filter((_, idx) => idx !== i));
  };

  // Auto-fill station for first row
  useEffect(() => {
    if (station && rows.length > 0) {
      const first = rows[0];
      if (!first.from) {
        updateRow(0, { from: station });
      }
    }
  }, [station]);

  // Scroll to new row and focus
  useEffect(() => {
    if (justAdded && lastRowRef.current) {
      lastRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setJustAdded(false);
      const firstInput = lastRowRef.current.querySelector('input');
      if (firstInput) setTimeout(() => firstInput.focus(), 300);
    }
  }, [justAdded, userRows.length]);

  const isRowComplete = (row: RTPRow) => row.date && row.from && row.to && row.distKm > 0;
  const allRowsComplete = userRows.length > 0 && userRows.every(isRowComplete);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const findUserRowIndex = (userIndex: number): number => {
    let count = 0;
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].sameDayReturn) {
        if (count === userIndex) return i;
        count++;
      }
    }
    return -1;
  };

  const updateUserRow = (userIndex: number, patch: Partial<RTPRow>) => {
    const actualIndex = findUserRowIndex(userIndex);
    if (actualIndex >= 0) updateRow(actualIndex, patch);
  };

  const removeUserRow = (userIndex: number) => {
    const actualIndex = findUserRowIndex(userIndex);
    if (actualIndex >= 0) {
      const row = rows[actualIndex];
      const nights = Number(row.nights) || 0;
      // Also remove associated return row if exists
      if (nights > 0 && rows[actualIndex + 1]?.sameDayReturn) {
        onChange(rows.filter((_, idx) => idx !== actualIndex && idx !== actualIndex + 1));
      } else {
        removeRow(actualIndex);
      }
    }
  };

  // Quick date increment/decrement
  const incrementDate = (userIndex: number, days: number) => {
    const actualIndex = findUserRowIndex(userIndex);
    if (actualIndex >= 0) {
      const row = rows[actualIndex];
      if (row.date) {
        const newDate = addDaysToDate(row.date, days);
        updateRow(actualIndex, { date: newDate });
      }
    }
  };

  // Generate or update return row when user clicks Done
  const handleDone = (userIndex: number) => {
    const actualIndex = findUserRowIndex(userIndex);
    if (actualIndex >= 0) {
      const row = rows[actualIndex];
      const nights = Number(row.nights) || 0;
      const isComplete = row.date && row.from && row.to && row.distKm > 0;
      
      // Check if next row is a return row for this trip
      const nextRow = rows[actualIndex + 1];
      const hasExistingReturn = nextRow?.sameDayReturn && 
        nextRow.from === row.to && 
        nextRow.to === row.from;
      
      if (isComplete && nights > 0) {
        // Need a return row
        const returnDate = addDaysToDate(row.date, nights);
        const newReturnRow: RTPRow = {
          date: returnDate || row.date,
          from: row.to,
          to: row.from,
          distKm: row.distKm,
          remarks: 'Return to Headquarters',
          nights: 0,
          daDays: 0,
          rateType: row.rateType || 'auto',
          sameDayReturn: true
        };
        
        if (hasExistingReturn) {
          // Update existing return row
          const newRows = [...rows];
          newRows[actualIndex + 1] = newReturnRow;
          onChange(newRows);
        } else {
          // Insert new return row
          const newRows = [...rows];
          newRows.splice(actualIndex + 1, 0, newReturnRow);
          onChange(newRows);
        }
      } else if (hasExistingReturn && nights === 0) {
        // Remove return row if nights is now 0
        onChange(rows.filter((_, idx) => idx !== actualIndex + 1));
      }
    }
    
    setExpandedIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center sticky top-0 bg-white z-10 py-3 border-b">
        <div>
          <div className="font-bold text-lg">Tour Program</div>
          <div className="text-xs text-gray-500">
            {userRows.length} trip{userRows.length !== 1 ? 's' : ''} • {expandRTPForDisplay(rows).length} display rows
          </div>
        </div>
        {allRowsComplete && onFinish && (
          <button 
            type="button"
            className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-medium active:scale-95 flex items-center gap-2"
            onClick={onFinish}
          >
            ✓ Finish
          </button>
        )}
      </div>

      {/* Trip List */}
      <div className="space-y-2 pb-24">
        {userRows.map((r, i) => {
          const isLast = i === userRows.length - 1;
          const isComplete = isRowComplete(r);
          const isExpanded = expandedIndex === i;
          
          return (
            <div 
              key={i} 
              ref={isLast ? lastRowRef : null}
              className={`rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                isComplete ? 'border-green-300 bg-green-50/50' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Collapsed Header */}
              <div 
                className={`flex items-center justify-between px-4 py-3 cursor-pointer ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => toggleExpand(i)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isComplete ? '✓' : i + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {isComplete ? (
                      <div className="flex flex-col">
                        <div className="font-medium text-sm truncate">{r.from} → {r.to}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                          <span>{formatDateDisplay(r.date)}</span>
                          <span>•</span>
                          <span>{r.distKm} KM</span>
                          {(r.nights || 0) > 0 && (
                            <>
                              <span>•</span>
                              <span>{r.nights} Night{(r.nights || 0) > 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">Tap to enter trip details</div>
                    )}
                  </div>
                </div>
                
                <div className={`ml-2 transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>
              
              {/* Expanded Form */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Date Field with Quick Buttons */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Date * <span className="text-[10px] text-gray-400">(dd/mm/yyyy)</span>
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="date" 
                          value={r.date} 
                          onChange={e => updateUserRow(i, { date: e.target.value })} 
                          className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:outline-none text-sm" 
                        />
                        {r.date && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); incrementDate(i, -1); }}
                              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); incrementDate(i, 1); }}
                              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95"
                            >
                              +1
                            </button>
                          </div>
                        )}
                      </div>
                      {r.date && (
                        <div className="text-[11px] text-blue-600 mt-1 font-medium">
                          📅 {formatDateDisplay(r.date)}
                        </div>
                      )}
                    </div>

                    {/* Distance */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Distance (Km) *</label>
                      <input 
                        type="number" 
                        inputMode="numeric"
                        value={r.distKm || ''} 
                        placeholder="0"
                        onChange={e => updateUserRow(i, { distKm: Number(e.target.value) || 0 })} 
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:outline-none text-sm" 
                      />
                    </div>

                    {/* From */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">From *</label>
                      <input 
                        type="text" 
                        value={r.from} 
                        placeholder="Starting location"
                        onChange={e => updateUserRow(i, { from: e.target.value })} 
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:outline-none text-sm" 
                      />
                    </div>

                    {/* To */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">To *</label>
                      <input 
                        type="text" 
                        value={r.to} 
                        placeholder="Destination"
                        onChange={e => updateUserRow(i, { to: e.target.value })} 
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:outline-none text-sm" 
                      />
                    </div>

                    {/* Nights */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Nights Stay</label>
                      <input 
                        type="number" 
                        inputMode="numeric"
                        value={r.nights || ''} 
                        placeholder="0"
                        min="0"
                        onChange={e => updateUserRow(i, { nights: Number(e.target.value) || 0 })} 
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:outline-none text-sm" 
                      />
                    </div>

                    {/* Rate Type */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Rate Type</label>
                      <select 
                        value={r.rateType || 'auto'} 
                        onChange={e => updateUserRow(i, { rateType: e.target.value as any })} 
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:outline-none bg-white text-sm"
                      >
                        <option value="auto">Auto</option>
                        <option value="ordinary">Ordinary</option>
                        <option value="special">Special</option>
                      </select>
                    </div>

                    {/* Remarks */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Remarks</label>
                      <input 
                        type="text" 
                        value={r.remarks} 
                        placeholder="Purpose of journey"
                        onChange={e => updateUserRow(i, { remarks: e.target.value })} 
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:border-blue-500 focus:outline-none text-sm" 
                      />
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    {userRows.length > 1 && (
                      <button 
                        type="button"
                        className="px-3 py-2 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 active:scale-95" 
                        onClick={() => removeUserRow(i)}
                      >
                        🗑️ Remove
                      </button>
                    )}
                    <button 
                      type="button"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium active:scale-95 ml-auto"
                      onClick={() => handleDone(i)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Empty State */}
        {userRows.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🗺️</div>
            <div className="font-medium">No trips added yet</div>
            <div className="text-sm mt-1">Tap the button below to add your first trip</div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar - ADD TRIP BUTTON */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t py-3 px-4 -mx-4 mt-4">
        <div className="flex gap-3">
          <button 
            type="button"
            className="flex-1 px-4 py-3.5 rounded-xl bg-blue-600 text-white font-medium active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
            onClick={addRow}
          >
            <span className="text-lg">+</span> Add Trip
          </button>
          
          {allRowsComplete && onFinish && (
            <button 
              type="button"
              className="flex-1 px-4 py-3.5 rounded-xl bg-green-600 text-white font-medium active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
              onClick={onFinish}
            >
              ✓ Finish Entry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevisedTourProgram;