import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, TextField, SelectField } from '../../components/M3';
import { useToast } from '../../contexts/ToastContext';
import { auditService } from '../../services/SecurityService';
import { KPK_DISTRICTS } from '../../utils';
import { TravelAllowanceBill, TABillHeader, TABillRow, TABillSummary, AttendanceCertificates } from './tabill';
import { RevisedTourProgramEditor, RevisedTourProgram, RTPRow } from './rtp';
import * as XLSX from 'xlsx';
import {
  Document as DocxDocument,
  Packer as DocxPacker,
  Paragraph as DocxParagraph,
  TextRun as DocxTextRun,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType as DocxWidthType,
  BorderStyle as DocxBorderStyle,
  AlignmentType as DocxAlignmentType,
  PageBreak as DocxPageBreak,
  PageOrientation as DocxPageOrientation,
  SectionType as DocxSectionType
} from 'docx';

type TaBillFormState = {
  employeeName: string;
  designation: string;
  bps: string;
  personalNo: string;
  station: string;
  ddoCode: string;
  basicPay: number;
  iban: string;
  depDate: string;
  arrDate: string;
  from: string;
  to: string;
  mode: 'Car' | 'Motorcycle' | 'Public Transport' | 'Govt';
  useAutoDistance: boolean;
  distanceKm: number;
  nights: number;
  purpose: string;
  rates: {
    da: { low: number; mid: number; high: number };
    mileage: { Car: number; Motorcycle: number; 'Public Transport': number; Govt: number };
    overnight: number;
    maxDaDays: number;
  };
};

type SavedTaBill = {
  id: string;
  billNo: string;
  createdAt: string;
  form: TaBillFormState;
  rtpRows: RTPRow[];
  header: TABillHeader;
  rows: TABillRow[];
  summary: TABillSummary;
};

const TA_BILL_STORAGE_KEY = 'clerk_pro_budgeting_ta_bills';

const loadLocal = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const saveLocal = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error: any) {
    console.error(`saveLocal failed for ${key}:`, error);
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      try {
        console.warn('Storage quota exceeded, clearing localStorage fallbacks for employees and cases...');
        localStorage.removeItem('clerk_pro_rpms_employees');
        localStorage.removeItem('clerk_pro_rpms_cases');
        // Retry
        localStorage.setItem(key, JSON.stringify(value));
        console.log('Retry save succeeded after clearing fallbacks.');
      } catch (retryError) {
        console.error('Retry save failed:', retryError);
      }
    }
  }
};

export const TaBillTab: React.FC = () => {
  const { showToast } = useToast();
  const backupInputRef = useRef<HTMLInputElement>(null);
  const singleImportInputRef = useRef<HTMLInputElement>(null);
  const [taStep, setTaStep] = useState(1);
  const [taEmployeeName, setTaEmployeeName] = useState('');
  const [taDesignation, setTaDesignation] = useState('');
  const [taBps, setTaBps] = useState('16');
  const [taPersonalNo, setTaPersonalNo] = useState('');
  const [taIban, setTaIban] = useState('');
  const [taStation, setTaStation] = useState('');
  const [taDdoCode, setTaDdoCode] = useState('');
  const [taBasicPay, setTaBasicPay] = useState<number>(0);
  const [taDepDate, setTaDepDate] = useState('');
  const [taArrDate, setTaArrDate] = useState('');
  const [taFrom, setTaFrom] = useState('');
  const [taTo, setTaTo] = useState('');
  const [taMode, setTaMode] = useState<'Car' | 'Motorcycle' | 'Public Transport' | 'Govt'>('Public Transport');
  const [taUseAutoDistance, setTaUseAutoDistance] = useState(true);
  const [taDistanceKm, setTaDistanceKm] = useState<number>(0);
  const [taNights, setTaNights] = useState<number>(0);
  const [taBillNo, setTaBillNo] = useState('');
  const [taPurpose, setTaPurpose] = useState('');
  const [taRates, setTaRates] = useState({
    da: { low: 1500, mid: 2000, high: 2500 },
    mileage: { Car: 15, Motorcycle: 5, 'Public Transport': 0, Govt: 0 },
    overnight: 2000,
    maxDaDays: 10
  });
  const kpkLocations = useMemo(() => KPK_DISTRICTS.map(d => d), []);
  const distanceMap = useMemo(() => {
    const m: Record<string, number> = {};
    const put = (a: string, b: string, v: number) => { m[`${a}|${b}`] = v; m[`${b}|${a}`] = v; };
    put('Peshawar', 'Nowshera', 45);
    put('Peshawar', 'Mardan', 64);
    put('Peshawar', 'Charsadda', 32);
    put('Peshawar', 'Kohat', 70);
    put('Peshawar', 'Abbottabad', 150);
    put('Mardan', 'Swabi', 48);
    put('Mardan', 'Charsadda', 30);
    put('Mardan', 'Swat', 140);
    put('Swat', 'Shangla', 64);
    put('Dir Lower', 'Dir Upper', 70);
    put('Abbottabad', 'Mansehra', 25);
    put('Mansehra', 'Battagram', 50);
    put('Haripur', 'Abbottabad', 35);
    put('Bannu', 'Lakki Marwat', 40);
    put('Dera Ismail Khan', 'Tank', 45);
    put('Karak', 'Kohat', 60);
    put('Hangu', 'Kohat', 35);
    return m;
  }, []);
  const getDistanceKm = (a: string, b: string) => {
    if (!a || !b) return 0;
    return distanceMap[`${a}|${b}`] || 0;
  };
  const daysBetween = (d1: string, d2: string) => {
    if (!d1 || !d2) return 0;
    const a = new Date(d1).getTime();
    const b = new Date(d2).getTime();
    if (isNaN(a) || isNaN(b)) return 0;
    const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };
  const daRateForBps = (bps: number) => {
    if (bps <= 15) return taRates.da.low;
    if (bps <= 17) return taRates.da.mid;
    return taRates.da.high;
  };
  const validTaStep1 = taEmployeeName.trim() && taDesignation.trim() && taBps && taPersonalNo.trim();
  const validTaStep2 = taDepDate && taArrDate && taFrom && taTo && taPurpose.trim();
  const nextBillNo = () => {
    const key = 'clerk_pro_ta_bill_counter';
    const year = new Date().getFullYear();
    const raw = Number(localStorage.getItem(key) || '0') || 0;
    const next = raw + 1;
    localStorage.setItem(key, String(next));
    return `TAB-${year}-${String(next).padStart(4, '0')}`;
  };
  const handleGenerateTaBill = () => {
    const no = nextBillNo();
    setTaBillNo(no);
    auditService.log('TA_BILL_GENERATED', `Generated TA Bill ${no}`, no);
  };
  const openPrintPreview = (options: { title: string; html: string; pageCss: string; bodyCss?: string }) => {
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('');
    const template = `<!doctype html>
      <html>
        <head>
          <title>${options.title}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          ${styles}
          <style>
            ${options.pageCss}
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                background-color: white !important;
              }
              .no-print { display: none !important; }
            }
            body { background-color: white !important; margin: 0; ${options.bodyCss || ''} }
            .print-toolbar {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              z-index: 9999;
              background: #0f172a;
              color: #fff;
              padding: 12px 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              font-family: sans-serif;
              font-weight: 700;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            }
            .print-actions { display: flex; align-items: center; gap: 10px; }
            .print-btn {
              padding: 8px 16px;
              background: #fff;
              color: #0f172a;
              border: none;
              border-radius: 0;
              cursor: pointer;
              font-weight: 700;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .print-btn:hover { background: #e2e8f0; }
            .close-btn {
              padding: 8px 12px;
              background: transparent;
              color: #fff;
              border: 1px solid rgba(255,255,255,0.4);
              border-radius: 0;
              cursor: pointer;
              font-weight: 700;
            }
            .close-btn:hover { background: rgba(255,255,255,0.12); }
            .print-spacer { height: 56px; }
          </style>
        </head>
        <body>
          <div class="print-toolbar no-print">
            <div>Print Preview</div>
            <div class="print-actions">
              <button class="print-btn" onclick="window.print()">Print Document</button>
              <button class="close-btn" onclick="if (window.opener) { window.close(); } else { window.history.back(); }">Close</button>
            </div>
          </div>
          <div class="print-spacer no-print"></div>
          ${options.html}
        </body>
      </html>`;
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(template);
      w.document.close();
      return;
    }
    const sameTab = window.open('', '_self');
    if (sameTab) {
      sameTab.document.open();
      sameTab.document.write(template);
      sameTab.document.close();
      return;
    }
    showToast('Unable to open print preview', 'error');
  };
  const handleExportTaPdf = () => {
    const el = document.getElementById('ta-bill-print-only');
    if (!el) return;
    openPrintPreview({
      title: 'TA Bill Preview',
      html: el.innerHTML,
      pageCss: '@page { size: A4 landscape; margin: 7mm 9mm; }'
    });
  };
  const handlePrintRtp = () => {
    const el = document.getElementById('rtp-preview');
    if (!el) return;
    openPrintPreview({
      title: 'Revised Tour Plan Preview',
      html: el.innerHTML,
      pageCss: '@page { size: A4 portrait; margin: 7mm 9mm; }',
      bodyCss: 'font-family: Arimo, Arial, sans-serif; color:#000;'
    });
  };

  const handlePrintCertificates = () => {
    const el = document.getElementById('ta-certificates-print-only');
    if (!el) return;
    openPrintPreview({
      title: 'Attendance Certificates Preview',
      html: el.innerHTML,
      pageCss: '@page { size: A4 portrait; margin: 5mm 5mm; }'
    });
  };
  const loadSampleTa = () => {
    setTaEmployeeName('Muhammad Ali');
    setTaDesignation('Senior Clerk');
    setTaBps('16');
    setTaPersonalNo('1234567');
    setTaBasicPay(45000);
    setTaIban('PK50UNIL0000001234567890');
    setTaDepDate(new Date().toISOString().slice(0,10));
    const d = new Date(); d.setDate(d.getDate()+2);
    setTaArrDate(d.toISOString().slice(0,10));
    setTaFrom('Peshawar');
    setTaTo('Mardan');
    setTaMode('Car');
    setTaUseAutoDistance(true);
    setTaNights(1);
    setTaPurpose('Official meeting regarding district education matters');
  };

  const [rtpRows, setRtpRows] = useState<RTPRow[]>([]);
  const [savedTaBills, setSavedTaBills] = useState<SavedTaBill[]>(() => {
    const list = loadLocal<SavedTaBill[]>(TA_BILL_STORAGE_KEY, []);
    if (list.length === 0) {
      return loadLocal<SavedTaBill[]>('budgeting/ta-bill/bills', []);
    }
    return list;
  });
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  // Auto-sync savedTaBills list to localStorage
  useEffect(() => {
    saveLocal(TA_BILL_STORAGE_KEY, savedTaBills);
  }, [savedTaBills]);
  const selectedSaved = useMemo(
    () => savedTaBills.find(bill => bill.id === selectedSavedId) || null,
    [savedTaBills, selectedSavedId]
  );

  // Propagate station/office name changes to all matching trips in rtpRows
  useEffect(() => {
    if (!taStation) return;
    
    // Find the station name currently used in the trips (typically the first row's starting location)
    const currentRtpStation = rtpRows[0]?.from;
    
    if (currentRtpStation && currentRtpStation !== taStation) {
      setRtpRows(prev => prev.map((r: RTPRow) => {
        let updated = false;
        const patched = { ...r };
        if (r.from === currentRtpStation) {
          patched.from = taStation;
          updated = true;
        }
        if (r.to === currentRtpStation) {
          patched.to = taStation;
          updated = true;
        }
        return updated ? patched : r;
      }));
    }
  }, [taStation, rtpRows]);

  // Helper to add days to a date string
  const addDaysToDate = (dateStr: string, days: number): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  // Helper to get month label from first date of rtp rows
  const getMonthLabelFromRows = (rows: RTPRow[]): string => {
    const firstRowWithDate = rows.find(r => r.date);
    if (!firstRowWithDate || !firstRowWithDate.date) return '';
    const d = new Date(firstRowWithDate.date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  };

  // Automatically update distance when from/to change and auto-distance is on
  useEffect(() => {
    if (taUseAutoDistance) {
      const dist = getDistanceKm(taFrom, taTo);
      setTaDistanceKm(dist);
    }
  }, [taFrom, taTo, taUseAutoDistance]);

  // Sync Step 2 inputs to rtpRows if not manually customized
  useEffect(() => {
    if (!taDepDate || !taFrom || !taTo) {
      return;
    }

    const dist = taUseAutoDistance ? getDistanceKm(taFrom, taTo) : taDistanceKm;
    const sameDay = taDepDate === taArrDate;

    // Check if rtpRows has been manually customized (i.e. length > 2, or first row differs significantly)
    const isAutoRtp = rtpRows.length === 0 || 
      (rtpRows.length <= 2 && rtpRows.every((r: RTPRow) => r.from === taFrom || r.from === taTo));

    if (isAutoRtp) {
      const outwardRow: RTPRow = {
        date: taDepDate,
        from: taFrom,
        to: taTo,
        distKm: dist,
        remarks: taPurpose || 'Official Tour',
        nights: taNights,
        daDays: sameDay ? 0.5 : 1,
        rateType: 'auto',
        sameDayReturn: false
      };

      const newRows: RTPRow[] = [outwardRow];

      if (taNights > 0) {
        const returnDate = addDaysToDate(taDepDate, taNights);
        newRows.push({
          date: returnDate || taDepDate,
          from: taTo,
          to: taFrom,
          distKm: dist,
          remarks: 'Return to Headquarters',
          nights: 0,
          daDays: 0,
          rateType: 'auto',
          sameDayReturn: true
        });
      } else if (sameDay) {
        newRows.push({
          date: taDepDate,
          from: taTo,
          to: taFrom,
          distKm: dist,
          remarks: 'Return to Headquarters',
          nights: 0,
          daDays: 0,
          rateType: 'auto',
          sameDayReturn: true
        });
      } else if (taArrDate && taArrDate !== taDepDate) {
        newRows.push({
          date: taArrDate,
          from: taTo,
          to: taFrom,
          distKm: dist,
          remarks: 'Return to Headquarters',
          nights: 0,
          daDays: 0,
          rateType: 'auto',
          sameDayReturn: true
        });
      }

      setRtpRows(newRows);
    }
  }, [taDepDate, taArrDate, taFrom, taTo, taUseAutoDistance, taDistanceKm, taNights, taPurpose]);

  const billHeader: TABillHeader = useMemo(() => ({
    employeeName: taEmployeeName || '',
    iban: taIban || '',
    designation: taDesignation || '',
    gradeLabel: taBps ? `BPS-${taBps}` : '',
    employeeCode: taPersonalNo || '',
    basicPay: taBasicPay || 0,
    station: taStation || '',
    ddoCode: taDdoCode || ''
  }), [taEmployeeName, taIban, taDesignation, taBps, taPersonalNo, taStation, taDdoCode, taBasicPay]);

  const SPECIAL_CITIES = useMemo(() => new Set([
    'Islamabad','Rawalpindi','Lahore','Karachi','Peshawar','Abbottabad','Quetta','Multan','Faisalabad',
    'Hyderabad','Sukkur','Bahawalpur','Sargodha','Sialkot','Gujranwala','D.G. Khan','Gwadar','Gilgit','Skardu',
    'Muzaffarabad','Mirpur'
  ].map(s => s.toLowerCase())), []);
  const baseRateForBps = (bps: number, isSpecial: boolean) => {
    if (bps >= 5 && bps <= 11) return isSpecial ? 880 : 624;
    if (bps >= 12 && bps <= 16) return isSpecial ? 1440 : 1120;
    if (bps >= 17 && bps <= 18) return isSpecial ? 2560 : 2000;
    if (bps >= 19 && bps <= 20) return isSpecial ? 3280 : 2480;
    return isSpecial ? 880 : 624;
  };
  const MILEAGE_RATE = 3.75;

  const billRows: TABillRow[] = useMemo(() => {
    const bps = Number(taBps) || 0;
    const rows: TABillRow[] = [];
    for (const r of rtpRows) {
      const km = Number(r.distKm) || 0;
      const mileageAmount = Math.round(km * MILEAGE_RATE);
      const city = (r.to || '').trim().toLowerCase();
      const autoSpecial = SPECIAL_CITIES.has(city);
      const forced = r.rateType || 'auto';
      const specialApplied = forced === 'special' ? true : forced === 'ordinary' ? false : autoSpecial;
      const baseDaRate = baseRateForBps(bps, specialApplied);
      const sameDay = !!r.sameDayReturn;
      const nights = Number(r.nights) || 0;
      const journeyDaDays = sameDay ? 0.5 : 1;
      const journeyDaAmount = Math.round(baseDaRate * journeyDaDays);
      const journeyTotal = mileageAmount + journeyDaAmount;
      rows.push({
        date: r.date || '',
        from: r.from || '',
        to: r.to || '',
        kind: taMode,
        km,
        ratePerKm: MILEAGE_RATE,
        mileageAmount,
        daDays: journeyDaDays,
        daRate: baseDaRate,
        daAmount: journeyDaAmount,
        total: journeyTotal,
        remarks: r.remarks || ''
      });
      if (nights > 0) {
        const hotelRate = baseDaRate * (specialApplied ? 3 : 2);
        const hotelAmount = nights * hotelRate;
        rows.push({
          date: '',
          from: '',
          to: '',
          kind: '',
          km: 0,
          ratePerKm: 0,
          mileageAmount: 0,
          daDays: nights,
          daRate: hotelRate,
          daAmount: hotelAmount,
          total: hotelAmount,
          isHotel: true,
          remarks: ''
        });
      }
    }
    return rows;
  }, [rtpRows, taBps, taMode, SPECIAL_CITIES]);

  const billSummary: TABillSummary = useMemo(() => {
    let totalDays = 0;
    let totalHalfDays = 0;
    let totalNights = 0;
    let totalNightsRate = 0;
    let totalNightsAmount = 0;
    let totalDaAmount = 0;
    let totalHotelAmount = 0;
    for (const row of billRows) {
      if (row.isHotel) {
        totalNights += row.daDays;
        totalNightsAmount += row.daAmount;
        totalNightsRate = row.daRate;
        totalHotelAmount += row.daAmount;
      } else {
        if (row.daDays === 0.5) totalHalfDays += 1;
        if (row.daDays === 1) totalDays += 1;
        totalDaAmount += row.daAmount;
      }
    }
    const totalMileageKm = billRows.reduce((s, r) => s + (r.km || 0), 0);
    const totalMileageAmount = billRows.reduce((s, r) => s + (r.mileageAmount || 0), 0);
    const totalMileageRate = MILEAGE_RATE;
    const grandTotal = billRows.reduce((s, r) => s + (r.total || 0), 0);
    return {
      totalDays, totalHalfDays, totalNights, totalNightsRate, totalNightsAmount,
      totalMileageKm, totalMileageRate, totalMileageAmount, grandTotal,
      totalDaAmount, totalHotelAmount, totalOtherAmount: 0, lessDeduction: 0
    };
  }, [billRows]);

  const handleSaveTaBill = () => {
    const billNo = taBillNo || nextBillNo();
    
    setSavedTaBills(prevBills => {
      const existingIndex = prevBills.findIndex(b => b.billNo === billNo);
      
      const entry: SavedTaBill = {
        id: existingIndex >= 0 ? prevBills[existingIndex].id : Date.now().toString(),
        billNo,
        createdAt: existingIndex >= 0 ? prevBills[existingIndex].createdAt : new Date().toISOString(),
        form: {
          employeeName: taEmployeeName,
          designation: taDesignation,
          bps: taBps,
          personalNo: taPersonalNo,
          station: taStation,
          ddoCode: taDdoCode,
          basicPay: taBasicPay,
          iban: taIban,
          depDate: taDepDate,
          arrDate: taArrDate,
          from: taFrom,
          to: taTo,
          mode: taMode,
          useAutoDistance: taUseAutoDistance,
          distanceKm: taDistanceKm,
          nights: taNights,
          purpose: taPurpose,
          rates: taRates
        },
        rtpRows,
        header: billHeader,
        rows: billRows,
        summary: billSummary
      };

      let newList: SavedTaBill[];
      if (existingIndex >= 0) {
        newList = [...prevBills];
        newList[existingIndex] = entry;
        showToast('TA Bill updated successfully', 'success');
      } else {
        newList = [entry, ...prevBills];
        showToast('TA Bill saved locally', 'success');
      }

      saveLocal(TA_BILL_STORAGE_KEY, newList);
      return newList;
    });

    if (!taBillNo) {
      setTaBillNo(billNo);
    }
  };

  const handleLoadSavedTaBill = (entry: SavedTaBill) => {
    setTaEmployeeName(entry.form.employeeName);
    setTaDesignation(entry.form.designation);
    setTaBps(entry.form.bps);
    setTaPersonalNo(entry.form.personalNo);
    setTaStation(entry.form.station);
    setTaDdoCode(entry.form.ddoCode);
    setTaBasicPay(entry.form.basicPay || 0);
    setTaIban(entry.form.iban || '');
    setTaDepDate(entry.form.depDate);
    setTaArrDate(entry.form.arrDate);
    setTaFrom(entry.form.from);
    setTaTo(entry.form.to);
    setTaMode(entry.form.mode);
    setTaUseAutoDistance(entry.form.useAutoDistance);
    setTaDistanceKm(entry.form.distanceKm);
    setTaNights(entry.form.nights);
    setTaPurpose(entry.form.purpose);
    setTaRates(entry.form.rates);
    setRtpRows(entry.rtpRows);
    setTaBillNo(entry.billNo);
    setTaStep(3);
  };

  const handlePrintSavedTaBill = (entry: SavedTaBill) => {
    setSelectedSavedId(entry.id);
    setTimeout(() => {
      const el = document.getElementById('ta-bill-saved-print-only');
      if (!el) return;
      openPrintPreview({
        title: `TA Bill ${entry.billNo}`,
        html: el.innerHTML,
        pageCss: '@page { size: A4 landscape; margin: 7mm 9mm; }'
      });
    }, 50);
  };

  const handlePrintSavedRtp = (entry: SavedTaBill) => {
    setSelectedSavedId(entry.id);
    setTimeout(() => {
      const el = document.getElementById('rtp-saved-preview');
      if (!el) return;
      openPrintPreview({
        title: `RTP ${entry.billNo}`,
        html: el.innerHTML,
        pageCss: '@page { size: A4 portrait; margin: 7mm 9mm; }',
        bodyCss: 'font-family: Arimo, Arial, sans-serif; color:#000;'
      });
    }, 50);
  };

  const handlePrintSavedCertificates = (entry: SavedTaBill) => {
    setSelectedSavedId(entry.id);
    setTimeout(() => {
      const el = document.getElementById('ta-certificates-saved-print-only');
      if (!el) return;
      openPrintPreview({
        title: `Certificates ${entry.billNo}`,
        html: el.innerHTML,
        pageCss: '@page { size: A4 portrait; margin: 5mm 5mm; }'
      });
    }, 50);
  };

  const handleExportSingleTaBillJson = (entry?: SavedTaBill) => {
    const activeEntry: SavedTaBill = entry || {
      id: Date.now().toString(),
      billNo: taBillNo || 'DRAFT',
      createdAt: new Date().toISOString(),
      form: {
        employeeName: taEmployeeName,
        designation: taDesignation,
        bps: taBps,
        personalNo: taPersonalNo,
        station: taStation,
        ddoCode: taDdoCode,
        basicPay: taBasicPay,
        iban: taIban,
        depDate: taDepDate,
        arrDate: taArrDate,
        from: taFrom,
        to: taTo,
        mode: taMode,
        useAutoDistance: taUseAutoDistance,
        distanceKm: taDistanceKm,
        nights: taNights,
        purpose: taPurpose,
        rates: taRates
      },
      rtpRows,
      header: billHeader,
      rows: billRows,
      summary: billSummary
    };

    const blob = new Blob([JSON.stringify(activeEntry, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ta-bill-${activeEntry.billNo || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('TA Bill JSON exported successfully', 'success');
  };

  const handleImportSingleTaBillJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const entry = JSON.parse(event.target?.result as string);
        if (!entry.form || !entry.header || !entry.rows) {
          throw new Error('Invalid TA Bill JSON structure');
        }
        handleLoadSavedTaBill(entry);
        showToast('TA Bill loaded from JSON successfully', 'success');
      } catch (err) {
        showToast('Error importing JSON: ' + (err as Error).message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBackupAllJson = () => {
    if (savedTaBills.length === 0) {
      showToast('No saved bills to back up', 'error');
      return;
    }
    const blob = new Blob([JSON.stringify(savedTaBills, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved_ta_bills_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('All saved bills backed up to JSON', 'success');
  };

  const handleRestoreBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) {
          throw new Error('Backup file must contain an array of bills');
        }
        imported.forEach((entry, index) => {
          if (!entry.form || !entry.header || !entry.rows) {
            throw new Error(`Invalid bill structure at index ${index}`);
          }
        });

        const combined = [...imported];
        const importedIds = new Set(imported.map(b => b.id).filter(Boolean));
        savedTaBills.forEach(b => {
          if (!importedIds.has(b.id)) {
            combined.push(b);
          }
        });

        setSavedTaBills(combined);
        saveLocal(TA_BILL_STORAGE_KEY, combined);
        showToast(`Successfully restored ${imported.length} bills from backup`, 'success');
      } catch (err) {
        showToast('Restore failed: ' + (err as Error).message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportSavedTaBillXlsx = (entry: SavedTaBill) => {
    const totalDaAmount = entry.summary.totalDaAmount || 0;
    const totalDays = entry.summary.totalDays || 0;
    const totalHalfDays = entry.summary.totalHalfDays || 0;
    const dayRate = totalDays > 0 || totalHalfDays > 0 ? (totalDaAmount / (totalDays + 0.5 * totalHalfDays)) : 0;
    
    // --- Sheet 1: TA Bill Front ---
    const frontAoa = [
      [(entry.form.station || 'GOVERNMENT OFFICE').toUpperCase() + ' - TRAVELLING ALLOWANCE BILL', '', '', '', '', '', '', '', '', '', '', ''],
      ['Bill No:', entry.billNo, '', '', 'DDO Code:', entry.form.ddoCode || 'XXXXXX', '', '', '', '', '', ''],
      [],
      ['Employee Name:', entry.form.employeeName, '', 'Designation:', entry.form.designation, '', 'Employee Code:', entry.form.personalNo],
      ['IBAN NO:', entry.form.iban || '', '', 'Pay Scale:', `BPS-${entry.form.bps}`, '', 'Basic Pay:', entry.form.basicPay || 0],
      [],
      ['Particulars of Journey and Halt', '', '', 'Mode of Travel', 'Journey by Road', '', '', 'Daily/Night Allowances', '', '', 'Total', 'Purpose / Remarks'],
      ['Date', 'From', 'To', '', 'No. of KMs', 'Rates', 'Amount', 'No. of Days/Nights', 'Rates', 'Amount', '', ''],
      // Rows
      ...entry.rows.map(row => {
        if (row.isHotel) {
          return ['', 'Stayed at Hotel', '', 'Night Charges', '', '', '', row.daDays, row.daRate, row.daAmount, row.total, ''];
        }
        const dateVal = row.date ? (() => {
          const d = new Date(row.date);
          if (isNaN(d.getTime())) return row.date;
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}-${month}-${year}`;
        })() : '';
        return [dateVal, row.from, row.to, row.kind, row.km, row.km > 0 ? row.ratePerKm : '', row.mileageAmount, row.daDays || '', row.daDays > 0 ? row.daRate : '', row.daAmount, row.total, row.remarks || ''];
      }),
      ['Total', '', '', '', entry.summary.totalMileageKm, '', entry.summary.totalMileageAmount, '', '', '', entry.summary.grandTotal, ''],
      [],
      ['Descriptions', 'No', 'Rates', 'Amount'],
      ['Total Days', entry.summary.totalDays || 0, entry.summary.totalDays ? Math.round(dayRate) : 0, entry.summary.totalDays ? Math.round(entry.summary.totalDays * dayRate) : 0],
      ['Total Half Days', entry.summary.totalHalfDays || 0, entry.summary.totalHalfDays ? Math.round(dayRate / 2) : 0, entry.summary.totalHalfDays ? Math.round(entry.summary.totalHalfDays * (dayRate / 2)) : 0],
      ['Total Nights', entry.summary.totalNights || 0, entry.summary.totalNightsRate || 0, entry.summary.totalNightsAmount || 0],
      ['Total Mileage', entry.summary.totalMileageKm || 0, entry.summary.totalMileageRate || 0, entry.summary.totalMileageAmount || 0],
      ['Grand Total', '', '', entry.summary.grandTotal]
    ];

    // --- Sheet 2: TA Bill Back ---
    const backAoa = [
      ['TRAVELLING ALLOWANCE BILL SUMMARY (BACK)', '', ''],
      [],
      ['1. TRAVELLING ALLOWANCE (MILEAGE)', 'Rs.', entry.summary.totalMileageAmount || 0],
      ['2. TOTAL DAILY ALLOWANCE', 'Rs.', entry.summary.totalDaAmount || 0],
      ['3. ACTUAL EXPENSES (HOTEL CHARGES)', 'Rs.', entry.summary.totalHotelAmount || 0],
      ['4. OTHER ALLOWANCE', 'Rs.', 0],
      ['5. LESS DEDUCTION (TA ADVANCE)', 'Rs.', 0],
      ['NET AMOUNT PAYABLE', 'Rs.', entry.summary.grandTotal],
      [],
      ['CERTIFICATES', '', ''],
      ['1. Certified that I actually performed the journey as mentioned in this bill.', '', ''],
      ['2. Certified that I was not on Casual leave during the journey performed.', '', ''],
      ['3. Certified that I was not provided with Government vehicle.', '', ''],
      ['4. Certified that the halts for which daily allowance have been claimed were essential in Public interest.', '', ''],
      ['5. Certified that I was not provided with Government Residential facility.', '', ''],
      [],
      ['Signature of the Government Servant who travelled:', '___________________________', ''],
      [],
      ['Controlling Officer:', '___________________________', '']
    ];

    // --- Sheet 3: RTP ---
    const rtpMonth = getMonthLabelFromRows(entry.rtpRows) || (entry.form.depDate && new Date(entry.form.depDate).toLocaleString('en-GB', { month: 'long', year: 'numeric' })) || '';
    const rtpAoa = [
      [`OFFICE OF THE ${(entry.form.station || 'GOVERNMENT OFFICE').toUpperCase()}`, '', '', '', ''],
      ['REVISED TOUR PROGRAM', '', '', '', ''],
      [],
      ['Name of Officer:', entry.form.employeeName, '', 'For the Month Of:', rtpMonth],
      [],
      ['Dated', 'From', 'To', 'Distance in Km', 'Remarks'],
      ...entry.rtpRows.map(r => {
        const dateVal = r.date ? (() => {
          const d = new Date(r.date);
          if (isNaN(d.getTime())) return r.date;
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}-${month}-${year}`;
        })() : '';
        return [dateVal, r.from || '', r.to || '', r.distKm ? `${r.distKm} K.M` : '', r.remarks || ''];
      }),
      [],
      ['Counter Signed By:', '___________________________', '', 'Signature:', '___________________________']
    ];

    // --- Sheet 4: Certificates ---
    const certRows = entry.rows.filter(r => !r.isHotel && r.to && r.to.toLowerCase() !== (entry.form.station || '').toLowerCase());
    const certAoa = [
      ['ATTENDANCE CERTIFICATES', '', ''],
      []
    ];

    certRows.forEach((r, idx) => {
      const dateStr = r.date ? (() => {
        const d = new Date(r.date);
        if (isNaN(d.getTime())) return r.date;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      })() : '________';

      certAoa.push(
        [`CERTIFICATE #${idx + 1}`, '', ''],
        ['ATTENDANCE CERTIFICATE', '', ''],
        [`It is certified that Mr. ${entry.form.employeeName}, ${entry.form.designation} (BPS-${entry.form.bps}), ${entry.form.station}, has attended this office ${r.to} for ${r.remarks || 'Official Duty'} on dated ${dateStr}.`, '', ''],
        [],
        ['Date: ' + dateStr, '', 'Signature & Stamp of DDO / Head of Office: ___________________________'],
        [],
        ['------------------------------------------------------------------------------------------------------------------------', '', ''],
        []
      );
    });

    const wb = XLSX.utils.book_new();
    
    const wsFront = XLSX.utils.aoa_to_sheet(frontAoa);
    const wsBack = XLSX.utils.aoa_to_sheet(backAoa);
    const wsRtp = XLSX.utils.aoa_to_sheet(rtpAoa);
    const wsCert = XLSX.utils.aoa_to_sheet(certAoa);

    wsFront['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 15 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 30 }
    ];
    wsBack['!cols'] = [
      { wch: 50 }, { wch: 15 }, { wch: 20 }
    ];
    wsRtp['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 35 }
    ];
    wsCert['!cols'] = [
      { wch: 120 }
    ];

    XLSX.utils.book_append_sheet(wb, wsFront, 'TA Bill Front');
    XLSX.utils.book_append_sheet(wb, wsBack, 'TA Bill Back');
    XLSX.utils.book_append_sheet(wb, wsRtp, 'RTP');
    XLSX.utils.book_append_sheet(wb, wsCert, 'Certificates');

    XLSX.writeFile(wb, `TA_Bill_${entry.billNo}.xlsx`);
    showToast('TA Bill exported to Excel (.xlsx) with 4 sheets', 'success');
  };

  const generateTaBillDocx = async (
    billNo: string,
    station: string,
    ddoCode: string,
    header: TABillHeader,
    rows: TABillRow[],
    summary: TABillSummary,
    rtpRows: RTPRow[]
  ) => {
    showToast("Generating professional Word document...", "info");

    const totalDaAmount = summary.totalDaAmount || 0;
    const totalDays = summary.totalDays || 0;
    const totalHalfDays = summary.totalHalfDays || 0;
    const dayRate = totalDays > 0 || totalHalfDays > 0 ? (totalDaAmount / (totalDays + 0.5 * totalHalfDays)) : 0;

    const borderThin = { style: DocxBorderStyle.SINGLE, size: 4, color: "000000" };
    const borderNone = { style: DocxBorderStyle.NONE };
    const bordersThinAll = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
    const bordersNoneAll = { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone };

    // --- SECTION 1: TA BILL FRONT & BACK (LANDSCAPE) ---
    const section1Children: any[] = [];

    // Header
    section1Children.push(
      new DocxParagraph({
        children: [
          new DocxTextRun({ text: (station || 'GOVERNMENT OFFICE').toUpperCase(), bold: true, size: 28 })
        ],
        alignment: DocxAlignmentType.CENTER
      }),
      new DocxParagraph({
        children: [
          new DocxTextRun({ text: "TRAVELLING ALLOWANCE BILL", bold: true, size: 24 })
        ],
        alignment: DocxAlignmentType.CENTER,
        spacing: { after: 120 }
      }),
      new DocxParagraph({
        children: [
          new DocxTextRun({ text: `BILL NO: ${billNo}`, bold: true, size: 20 }),
          new DocxTextRun({ text: "\t\t\t\t\t\t\t\t\tDDO CODE: " + (ddoCode || 'XXXXXX'), bold: true, size: 20 })
        ],
        spacing: { after: 240 }
      })
    );

    // Employee Info Grid
    section1Children.push(
      new DocxTable({
        width: { size: 14838, type: DocxWidthType.DXA },
        columnWidths: [7419, 7419],
        rows: [
          new DocxTableRow({
            children: [
              new DocxTableCell({
                borders: bordersNoneAll,
                width: { size: 7419, type: DocxWidthType.DXA },
                children: [
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Employee Name: ", bold: true }), new DocxTextRun({ text: header.employeeName, bold: true, size: 24 })] }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: "IBAN NO: ", bold: true }), new DocxTextRun({ text: header.iban || 'N/A', underline: {} })] })
                ]
              }),
              new DocxTableCell({
                borders: bordersNoneAll,
                width: { size: 7419, type: DocxWidthType.DXA },
                children: [
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Designation: ", bold: true }), new DocxTextRun({ text: header.designation })] }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Personal Code: ", bold: true }), new DocxTextRun({ text: header.employeeCode })] }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Pay Scale & Pay: ", bold: true }), new DocxTextRun({ text: `${header.gradeLabel} - Basic Pay: ${header.basicPay.toLocaleString('en-PK')}` })] })
                ]
              })
            ]
          })
        ]
      }),
      new DocxParagraph({ text: "", spacing: { after: 200 } })
    );

    // Main Table Headers
    const tableHeaderRow = new DocxTableRow({
      children: [
        new DocxTableCell({ borders: bordersThinAll, width: { size: 1200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Date", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 2200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "From", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 2200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "To", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 1400, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Mode", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 1000, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "KMs", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 800, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Rate", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 1200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Mileage Amt", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 800, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Days", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 800, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "DA Rate", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 1200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "DA Amt", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 1200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Total", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 1800, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Purpose", bold: true })], alignment: DocxAlignmentType.CENTER })] })
      ]
    });

    const tableRows = rows.map(row => {
      if (row.isHotel) {
        return new DocxTableRow({
          children: [
            new DocxTableCell({ borders: bordersThinAll, width: { size: 1200, type: DocxWidthType.DXA }, children: [new DocxParagraph("")] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 4400, type: DocxWidthType.DXA }, columnSpan: 2, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Stayed at Hotel", italics: true })], alignment: DocxAlignmentType.CENTER })] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 1400, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Night Charges", italics: true })], alignment: DocxAlignmentType.CENTER })] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 1000, type: DocxWidthType.DXA }, children: [new DocxParagraph("")] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 800, type: DocxWidthType.DXA }, children: [new DocxParagraph("")] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 1200, type: DocxWidthType.DXA }, children: [new DocxParagraph("")] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 800, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: String(row.daDays) })], alignment: DocxAlignmentType.CENTER })] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 800, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: String(row.daRate) })], alignment: DocxAlignmentType.CENTER })] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 1200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: String(row.daAmount) })], alignment: DocxAlignmentType.CENTER })] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 1200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: String(row.total) })], alignment: DocxAlignmentType.CENTER })] }),
            new DocxTableCell({ borders: bordersThinAll, width: { size: 1800, type: DocxWidthType.DXA }, children: [new DocxParagraph("")] })
          ]
        });
      }

      const dateVal = row.date ? (() => {
        const d = new Date(row.date);
        if (isNaN(d.getTime())) return row.date;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      })() : '';

      return new DocxTableRow({
        children: [
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: dateVal })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.from })] })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.to })] })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.kind })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.km > 0 ? String(row.km) : '' })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.km > 0 ? String(row.ratePerKm) : '' })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.mileageAmount > 0 ? String(row.mileageAmount) : '' })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.daDays > 0 ? String(row.daDays) : '' })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.daDays > 0 ? String(row.daRate) : '' })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.daAmount > 0 ? String(row.daAmount) : '' })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: String(row.total) })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: row.remarks || '' })] })] })
        ]
      });
    });

    const totalRow = new DocxTableRow({
      children: [
        new DocxTableCell({ borders: bordersThinAll, columnSpan: 4, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Total", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: String(summary.totalMileageKm), bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("")] }),
        new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: String(summary.totalMileageAmount), bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, columnSpan: 3, children: [new DocxParagraph("")] }),
        new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: String(summary.grandTotal), bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("")] })
      ]
    });

    section1Children.push(
      new DocxTable({
        width: { size: 14838, type: DocxWidthType.DXA },
        rows: [tableHeaderRow, ...tableRows, totalRow]
      }),
      new DocxParagraph({ text: "", spacing: { after: 120 } })
    );

    // Summary block (Side-by-side with Signatures)
    section1Children.push(
      new DocxTable({
        width: { size: 14838, type: DocxWidthType.DXA },
        columnWidths: [8000, 6838],
        rows: [
          new DocxTableRow({
            children: [
              new DocxTableCell({
                borders: bordersThinAll,
                children: [
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Descriptions", bold: true })] }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: `Total Days: ${summary.totalDays} @ Rate: ${Math.round(dayRate)} = ${Math.round((summary.totalDays || 0) * dayRate)}` })] }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: `Total Half Days: ${summary.totalHalfDays} @ Rate: ${Math.round(dayRate / 2)} = ${Math.round((summary.totalHalfDays || 0) * (dayRate / 2))}` })] }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: `Total Nights: ${summary.totalNights} @ Rate: ${summary.totalNightsRate} = ${summary.totalNightsAmount}` })] }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: `Total Mileage: ${summary.totalMileageKm} KM @ Rate: ${summary.totalMileageRate} = ${summary.totalMileageAmount}` })] }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: `Grand Total: ${summary.grandTotal}`, bold: true })] })
                ]
              }),
              new DocxTableCell({
                borders: bordersNoneAll,
                children: [
                  new DocxParagraph({ text: "", spacing: { before: 800 } }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Signature of Officer / Official", bold: true })], alignment: DocxAlignmentType.CENTER })
                ]
              })
            ]
          })
        ]
      })
    );

    // Page Break to Page 2 (TA Bill Back)
    section1Children.push(new DocxParagraph({ children: [new DocxPageBreak()] }));

    // Page 2 - Back Page Content
    section1Children.push(
      new DocxParagraph({
        children: [
          new DocxTextRun({ text: "TRAVELLING ALLOWANCE BILL SUMMARY (BACK)", bold: true, size: 26 })
        ],
        alignment: DocxAlignmentType.CENTER,
        spacing: { after: 180 }
      }),
      new DocxTable({
        width: { size: 14838, type: DocxWidthType.DXA },
        columnWidths: [8000, 2000, 4838],
        rows: [
          new DocxTableRow({ children: [new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("1. TRAVELLING ALLOWANCE (MILEAGE)")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("Rs.")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph(String(summary.totalMileageAmount))] })] }),
          new DocxTableRow({ children: [new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("2. TOTAL DAILY ALLOWANCE")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("Rs.")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph(String(summary.totalDaAmount))] })] }),
          new DocxTableRow({ children: [new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("3. ACTUAL EXPENSES (HOTEL CHARGES)")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("Rs.")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph(String(summary.totalHotelAmount))] })] }),
          new DocxTableRow({ children: [new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("4. OTHER ALLOWANCE")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("Rs.")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("—")] })] }),
          new DocxTableRow({ children: [new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("5. LESS DEDUCTION (TA ADVANCE)")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("Rs.")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("—")] })] }),
          new DocxTableRow({ children: [new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "NET AMOUNT PAYABLE", bold: true })] })] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph("Rs.")] }), new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: String(summary.grandTotal), bold: true })] })] })] })
        ]
      }),
      new DocxParagraph({ text: "", spacing: { after: 240 } }),
      new DocxParagraph({
        children: [
          new DocxTextRun({ text: "Certificate", bold: true, size: 22 })
        ],
        spacing: { after: 120 }
      }),
      new DocxParagraph({ children: [new DocxTextRun({ text: "1. Certified that I actually performed the journey as mentioned in this bill." })] }),
      new DocxParagraph({ children: [new DocxTextRun({ text: "2. Certified that I was not on Casual leave during the journey performed." })] }),
      new DocxParagraph({ children: [new DocxTextRun({ text: "3. Certified that I was not provided with Government vehicle." })] }),
      new DocxParagraph({ children: [new DocxTextRun({ text: "4. Certified that the halts for which daily allowance have been claimed were essential in Public interest." })] }),
      new DocxParagraph({ children: [new DocxTextRun({ text: "5. Certified that I was not provided with Government Residential facility." })] }),
      new DocxParagraph({ text: "", spacing: { after: 400 } }),
      new DocxTable({
        width: { size: 14838, type: DocxWidthType.DXA },
        columnWidths: [7419, 7419],
        rows: [
          new DocxTableRow({
            children: [
              new DocxTableCell({
                borders: bordersNoneAll,
                children: [
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Controlling Officer:", bold: true })] }),
                  new DocxParagraph({ text: "", spacing: { before: 400 } }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Signature: ___________________________" })] })
                ]
              }),
              new DocxTableCell({
                borders: bordersNoneAll,
                children: [
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Signature of Government Servant:", bold: true })] }),
                  new DocxParagraph({ text: "", spacing: { before: 400 } }),
                  new DocxParagraph({ children: [new DocxTextRun({ text: "Signature: ___________________________" })] })
                ]
              })
            ]
          })
        ]
      })
    );

    // --- SECTION 2: RTP & CERTIFICATES (PORTRAIT) ---
    const section2Children: any[] = [];

    // Revised Tour Program Header
    const rtpMonth = getMonthLabelFromRows(rtpRows) || (header.station && new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })) || '';
    
    section2Children.push(
      new DocxParagraph({
        children: [
          new DocxTextRun({ text: `OFFICE OF THE ${(station || 'GOVERNMENT OFFICE').toUpperCase()}`, bold: true, size: 28 })
        ],
        alignment: DocxAlignmentType.CENTER
      }),
      new DocxParagraph({
        children: [
          new DocxTextRun({ text: "REVISED TOUR PROGRAM", bold: true, size: 24 })
        ],
        alignment: DocxAlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new DocxParagraph({
        children: [
          new DocxTextRun({ text: "Name of Officer: ", bold: true }),
          new DocxTextRun({ text: header.employeeName, bold: true }),
          new DocxTextRun({ text: "\t\t\tFor the Month Of: ", bold: true }),
          new DocxTextRun({ text: rtpMonth, bold: true })
        ],
        spacing: { after: 240 }
      })
    );

    // RTP Table
    const rtpHeaderRow = new DocxTableRow({
      children: [
        new DocxTableCell({ borders: bordersThinAll, width: { size: 1800, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Dated", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 2200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "From", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 2200, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "To", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 1400, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Distance", bold: true })], alignment: DocxAlignmentType.CENTER })] }),
        new DocxTableCell({ borders: bordersThinAll, width: { size: 2400, type: DocxWidthType.DXA }, children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Remarks", bold: true })], alignment: DocxAlignmentType.CENTER })] })
      ]
    });

    const rtpTableRows = rtpRows.map(r => {
      const dateVal = r.date ? (() => {
        const d = new Date(r.date);
        if (isNaN(d.getTime())) return r.date;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      })() : '';

      return new DocxTableRow({
        children: [
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: dateVal })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: r.from || '' })] })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: r.to || '' })] })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: r.distKm ? `${r.distKm} K.M` : '' })], alignment: DocxAlignmentType.CENTER })] }),
          new DocxTableCell({ borders: bordersThinAll, children: [new DocxParagraph({ children: [new DocxTextRun({ text: r.remarks || '' })] })] })
        ]
      });
    });

    section2Children.push(
      new DocxTable({
        width: { size: 10000, type: DocxWidthType.DXA },
        rows: [rtpHeaderRow, ...rtpTableRows]
      }),
      new DocxParagraph({ text: "", spacing: { after: 400 } }),
      new DocxParagraph({
        children: [
          new DocxTextRun({ text: "Counter Signed By: ___________________________" }),
          new DocxTextRun({ text: "\t\tSignature: ___________________________" })
        ],
        spacing: { after: 200 }
      })
    );

    // Page Break to Page 4 (Attendance Certificates)
    section2Children.push(new DocxParagraph({ children: [new DocxPageBreak()] }));

    // Attendance Certificates (3 per page)
    const certRows = rows.filter(r => !r.isHotel && r.to && r.to.toLowerCase() !== station.toLowerCase());
    
    certRows.forEach((r, idx) => {
      const dateStr = r.date ? (() => {
        const d = new Date(r.date);
        if (isNaN(d.getTime())) return r.date;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      })() : '________';

      // Insert Page Break after every 3 certificates
      if (idx > 0 && idx % 3 === 0) {
        section2Children.push(new DocxParagraph({ children: [new DocxPageBreak()] }));
      }

      // Add a double-bordered box for the certificate
      section2Children.push(
        new DocxTable({
          width: { size: 10000, type: DocxWidthType.DXA },
          rows: [
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  borders: {
                    top: { style: DocxBorderStyle.DOUBLE, size: 18, color: "000000" },
                    bottom: { style: DocxBorderStyle.DOUBLE, size: 18, color: "000000" },
                    left: { style: DocxBorderStyle.DOUBLE, size: 18, color: "000000" },
                    right: { style: DocxBorderStyle.DOUBLE, size: 18, color: "000000" }
                  },
                  margins: { top: 180, bottom: 180, left: 240, right: 240 },
                  children: [
                    new DocxParagraph({
                      children: [
                        new DocxTextRun({ text: "ATTENDANCE CERTIFICATE", bold: true, size: 24 })
                      ],
                      alignment: DocxAlignmentType.CENTER,
                      spacing: { after: 200 }
                    }),
                    new DocxParagraph({
                      children: [
                        new DocxTextRun({ text: "It is certified that Mr. " }),
                        new DocxTextRun({ text: header.employeeName, bold: true, underline: {} }),
                        new DocxTextRun({ text: ", " }),
                        new DocxTextRun({ text: header.designation, bold: true, underline: {} }),
                        new DocxTextRun({ text: " (" }),
                        new DocxTextRun({ text: header.gradeLabel, bold: true, underline: {} }),
                        new DocxTextRun({ text: "), " }),
                        new DocxTextRun({ text: header.station, bold: true, underline: {} }),
                        new DocxTextRun({ text: ", has attended this office " }),
                        new DocxTextRun({ text: r.to, bold: true, underline: {} }),
                        new DocxTextRun({ text: " for " }),
                        new DocxTextRun({ text: r.remarks || 'Official Duty', bold: true, underline: {} }),
                        new DocxTextRun({ text: " on dated " }),
                        new DocxTextRun({ text: dateStr, bold: true, underline: {} }),
                        new DocxTextRun({ text: "." })
                      ],
                      spacing: { after: 360, line: 360 }
                    }),
                    new DocxParagraph({
                      children: [
                        new DocxTextRun({ text: `Date: ${dateStr}` }),
                        new DocxTextRun({ text: "\t\t\t\tSignature & Stamp of DDO / Head of Office" })
                      ],
                      spacing: { after: 120 }
                    })
                  ]
                })
              ]
            })
          ]
        }),
        // Add cutout scissors line
        new DocxParagraph({
          children: [
            new DocxTextRun({ text: "✂- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -" })
          ],
          spacing: { before: 180, after: 180 }
        })
      );
    });

    const doc = new DocxDocument({
      styles: {
        default: { document: { run: { font: "Arial", size: 20 } } } // 10pt default
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: 16838, // long edge for landscape
                height: 11906, // short edge for landscape
                orientation: DocxPageOrientation.LANDSCAPE
              },
              margin: { top: 720, bottom: 720, left: 720, right: 720 }
            }
          },
          children: section1Children
        },
        {
          properties: {
            type: DocxSectionType.NEXT_PAGE,
            page: {
              size: {
                width: 11906,
                height: 16838,
                orientation: DocxPageOrientation.PORTRAIT
              },
              margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 }
            }
          },
          children: section2Children
        }
      ]
    });

    const blob = await DocxPacker.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TA_Bill_Complete_${billNo}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('TA Bill and Certificates exported to Word (.docx)', 'success');
  };

  const handleExportActiveTaBillDocx = () => {
    const billNo = taBillNo || 'DRAFT';
    generateTaBillDocx(billNo, taStation, taDdoCode, billHeader, billRows, billSummary, rtpRows);
  };

  const handleExportSavedTaBillDocx = (entry: SavedTaBill) => {
    generateTaBillDocx(entry.billNo, entry.form.station, entry.form.ddoCode, entry.header, entry.rows, entry.summary, entry.rtpRows);
  };

  const handleDeleteSavedTaBill = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this saved TA Bill?')) return;
    const list = savedTaBills.filter(bill => bill.id !== id);
    setSavedTaBills(list);
    saveLocal(TA_BILL_STORAGE_KEY, list);
    showToast('Saved TA Bill deleted', 'success');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card variant="elevated" className="bg-surface xl:col-span-2 space-y-6 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-on-surface">Travel Allowance Bill</div>
          <div className="flex items-center gap-3">
            <Button variant="text" label="Sample Data" icon="auto_awesome" onClick={loadSampleTa} />
            <Badge label={`Step ${taStep} of 3`} />
          </div>
        </div>
        {taStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Employee Name" icon="person" value={taEmployeeName} onChange={e => setTaEmployeeName(e.target.value)} />
            <TextField label="Designation" icon="badge" value={taDesignation} onChange={e => setTaDesignation(e.target.value)} />
            <SelectField label="BPS" value={taBps} onChange={e => setTaBps(e.target.value)}>
              {Array.from({ length: 22 }, (_, i) => i + 1).map(n => (<option key={n} value={String(n)}>{n}</option>))}
            </SelectField>
            <TextField label="Personal No" icon="pin" value={taPersonalNo} onChange={e => setTaPersonalNo(e.target.value)} />
            <TextField label="IBAN" icon="credit_card" value={taIban} onChange={e => setTaIban(e.target.value)} />
            <TextField label="Station / Office Name" icon="location_city" value={taStation} onChange={e => setTaStation(e.target.value)} />
            <TextField label="DDO Code" icon="numbers" value={taDdoCode} onChange={e => setTaDdoCode(e.target.value)} />
            <TextField label="Basic Pay" type="number" icon="payments" value={String(taBasicPay || '')} onChange={e => setTaBasicPay(Number(e.target.value) || 0)} />
          </div>
        )}
        {taStep === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Departure Date" type="date" icon="event" value={taDepDate} onChange={e => setTaDepDate(e.target.value)} />
            <TextField label="Arrival Date" type="date" icon="event" value={taArrDate} onChange={e => setTaArrDate(e.target.value)} />
            <SelectField label="From" value={taFrom} onChange={e => setTaFrom(e.target.value)}>
              <option value="">Select</option>
              {kpkLocations.map(n => (<option key={n} value={n}>{n}</option>))}
            </SelectField>
            <SelectField label="To" value={taTo} onChange={e => setTaTo(e.target.value)}>
              <option value="">Select</option>
              {kpkLocations.map(n => (<option key={n} value={n}>{n}</option>))}
            </SelectField>
            <SelectField label="Travel Mode" value={taMode} onChange={e => setTaMode(e.target.value as any)}>
              <option value="Public Transport">Public Transport</option>
              <option value="Car">Personal Car</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Govt">Govt Vehicle</option>
            </SelectField>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Auto distance:</span>
                <span className="text-sm font-bold">{taUseAutoDistance ? 'Yes' : 'No'}</span>
                <Button variant="text" label={taUseAutoDistance ? 'Edit' : 'Auto'} onClick={() => setTaUseAutoDistance(!taUseAutoDistance)} />
              </div>
              {!taUseAutoDistance && (
                <TextField label="Manual Distance (km)" type="number" icon="map" value={String(taDistanceKm)} onChange={e => setTaDistanceKm(Number(e.target.value))} />
              )}
            </div>
            <TextField label="Nights (if any)" type="number" icon="hotel" value={String(taNights)} onChange={e => setTaNights(Number(e.target.value))} />
            <TextField label="Purpose of Journey" icon="description" value={taPurpose} onChange={e => setTaPurpose(e.target.value)} className="md:col-span-2" />
          </div>
        )}
        {taStep === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="DA Rate (BPS 1-15)" type="number" value={String(taRates.da.low)} onChange={e => setTaRates({ ...taRates, da: { ...taRates.da, low: Number(e.target.value) } })} />
            <TextField label="DA Rate (BPS 16-17)" type="number" value={String(taRates.da.mid)} onChange={e => setTaRates({ ...taRates, da: { ...taRates.da, mid: Number(e.target.value) } })} />
            <TextField label="DA Rate (BPS 18+)" type="number" value={String(taRates.da.high)} onChange={e => setTaRates({ ...taRates, da: { ...taRates.da, high: Number(e.target.value) } })} />
            <TextField label="Overnight Rate" type="number" value={String(taRates.overnight)} onChange={e => setTaRates({ ...taRates, overnight: Number(e.target.value) })} />
            <TextField label="Mileage per km (Car)" type="number" value={String(taRates.mileage.Car)} onChange={e => setTaRates({ ...taRates, mileage: { ...taRates.mileage, Car: Number(e.target.value) } })} />
            <TextField label="Mileage per km (Motorcycle)" type="number" value={String(taRates.mileage.Motorcycle)} onChange={e => setTaRates({ ...taRates, mileage: { ...taRates.mileage, Motorcycle: Number(e.target.value) } })} />
            <TextField label="Max DA Days" type="number" value={String(taRates.maxDaDays)} onChange={e => setTaRates({ ...taRates, maxDaDays: Number(e.target.value) })} />
          </div>
        )}
        <div className="flex items-center justify-between pt-2">
          <Button variant="text" label="Back" icon="arrow_back" onClick={() => setTaStep(Math.max(1, taStep - 1))} />
          <div className="flex gap-3">
            {taStep < 3 && (
              <Button
                variant="filled"
                label="Next"
                icon="arrow_forward"
                onClick={() => {
                  if (taStep === 1 && !validTaStep1) { showToast('Fill all employee fields', 'error'); return; }
                  if (taStep === 2 && !validTaStep2) { showToast('Fill journey details', 'error'); return; }
                  setTaStep(taStep + 1);
                }}
              />
            )}
            {taStep === 3 && (
              <Button variant="filled" label="Generate Bill" icon="assignment" onClick={handleGenerateTaBill} />
            )}
          </div>
        </div>
      </Card>
      <Card variant="outlined" className="bg-surface xl:col-span-2 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">RTP Data</div>
          <div className="flex gap-2">
            <Button variant="tonal" label="Print RTP" icon="print" onClick={handlePrintRtp} />
          </div>
        </div>
        <RevisedTourProgramEditor value={rtpRows} onChange={setRtpRows} station={taStation} />
      </Card>
      <Card variant="outlined" className="bg-surface space-y-4 p-6">
        <div className="text-lg font-bold text-on-surface">TA Bill Actions</div>
        <div className="flex flex-col gap-3 w-full">
          <Button variant="filled" label="Print Bill" icon="print" onClick={handleExportTaPdf} className="w-full justify-center" />
          <Button variant="tonal" label="Print Certificates" icon="workspace_premium" onClick={handlePrintCertificates} className="w-full justify-center" />
          <Button variant="outlined" label="Save to Local" icon="save" onClick={handleSaveTaBill} className="w-full justify-center" />
          <Button variant="outlined" label="Export JSON" icon="download" onClick={() => handleExportSingleTaBillJson()} className="w-full justify-center" />
          <Button variant="outlined" label="Import JSON" icon="upload" onClick={() => singleImportInputRef.current?.click()} className="w-full justify-center" />
          <input
            type="file"
            ref={singleImportInputRef}
            onChange={handleImportSingleTaBillJson}
            accept=".json"
            className="hidden"
          />
        </div>
      </Card>
      <Card variant="outlined" className="bg-surface xl:col-span-3 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">Saved TA Bills</div>
          <div className="flex gap-2">
            <Button variant="outlined" label="Backup All (JSON)" icon="backup" onClick={handleBackupAllJson} />
            <Button variant="outlined" label="Restore Backup" icon="settings_backup_restore" onClick={() => backupInputRef.current?.click()} />
            <input
              type="file"
              ref={backupInputRef}
              onChange={handleRestoreBackupJson}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
        {savedTaBills.length === 0 ? (
          <div className="text-sm text-on-surface-variant">No saved bills yet.</div>
        ) : (
          <div className="space-y-3">
            {savedTaBills.map(entry => (
              <div key={entry.id} className="border border-outline-variant/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-bold">{entry.billNo}</div>
                  <div className="text-sm text-on-surface-variant">{entry.form.employeeName || 'Employee'} · {entry.form.station || 'Station'}</div>
                  <div className="text-xs text-on-surface-variant">{new Date(entry.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="tonal" label="Load" icon="download" onClick={() => handleLoadSavedTaBill(entry)} />
                  <Button variant="outlined" label="Export (JSON)" icon="download" onClick={() => handleExportSingleTaBillJson(entry)} />
                  <Button variant="outlined" label="Export (XLSX)" icon="table_chart" onClick={() => handleExportSavedTaBillXlsx(entry)} />
                  <Button variant="outlined" label="Print Bill" icon="print" onClick={() => handlePrintSavedTaBill(entry)} />
                  <Button variant="outlined" label="Print RTP" icon="print" onClick={() => handlePrintSavedRtp(entry)} />
                  <Button variant="outlined" label="Print Certificates" icon="workspace_premium" onClick={() => handlePrintSavedCertificates(entry)} />
                  <Button variant="outlined" label="Delete" icon="delete" className="text-error border-error/50 hover:bg-error/10" onClick={() => handleDeleteSavedTaBill(entry.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="hidden">
        <div id="rtp-preview">
          <RevisedTourProgram
            station={taStation}
            titleOffice="OFFICE OF THE HEAD MISTRESS GGHS RABAT"
            titleCaption="Revised Tour Program"
            officerName={taEmployeeName}
            employeeName={taEmployeeName}
            monthLabel={getMonthLabelFromRows(rtpRows) || (taDepDate && new Date(taDepDate).toLocaleString('en-GB', { month: 'long', year: 'numeric' })) || ''}
            rows={rtpRows}
          />
        </div>
        <div id="ta-bill-print-only">
          <TravelAllowanceBill header={billHeader} rows={billRows} summary={billSummary} />
        </div>
        <div id="ta-certificates-print-only">
          <AttendanceCertificates header={billHeader} rows={billRows} />
        </div>
        <div id="ta-bill-saved-print-only">
          {selectedSaved && (
            <TravelAllowanceBill header={selectedSaved.header} rows={selectedSaved.rows} summary={selectedSaved.summary} />
          )}
        </div>
        <div id="ta-certificates-saved-print-only">
          {selectedSaved && (
            <AttendanceCertificates header={selectedSaved.header} rows={selectedSaved.rows} />
          )}
        </div>
        <div id="rtp-saved-preview">
          {selectedSaved && (
            <RevisedTourProgram
              station={selectedSaved.form.station}
              titleOffice="OFFICE OF THE HEAD MISTRESS GGHS RABAT"
              titleCaption="Revised Tour Program"
              officerName={selectedSaved.form.employeeName}
              employeeName={selectedSaved.form.employeeName}
              monthLabel={getMonthLabelFromRows(selectedSaved.rtpRows) || (selectedSaved.form.depDate && new Date(selectedSaved.form.depDate).toLocaleString('en-GB', { month: 'long', year: 'numeric' })) || ''}
              rows={selectedSaved.rtpRows}
            />
          )}
        </div>
      </div>
    </div>
  );
};
