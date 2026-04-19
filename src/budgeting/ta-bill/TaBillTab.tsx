import React, { useMemo, useState } from 'react';
import { Card, Button, Badge, TextField, SelectField } from '../../components/M3';
import { useToast } from '../../contexts/ToastContext';
import { auditService } from '../../services/SecurityService';
import { KPK_DISTRICTS } from '../../utils';
import { TravelAllowanceBill, TABillHeader, TABillRow, TABillSummary } from './tabill';
import { RevisedTourProgramEditor, RevisedTourProgram, RTPRow } from './rtp';

type TaBillFormState = {
  employeeName: string;
  designation: string;
  bps: string;
  personalNo: string;
  station: string;
  ddoCode: string;
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

const TA_BILL_STORAGE_KEY = 'budgeting/ta-bill/bills';

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
  localStorage.setItem(key, JSON.stringify(value));
};

export const TaBillTab: React.FC = () => {
  const { showToast } = useToast();
  const [taStep, setTaStep] = useState(1);
  const [taEmployeeName, setTaEmployeeName] = useState('');
  const [taDesignation, setTaDesignation] = useState('');
  const [taBps, setTaBps] = useState('16');
  const [taPersonalNo, setTaPersonalNo] = useState('');
  const [taIban, setTaIban] = useState('');
  const [taStation, setTaStation] = useState('');
  const [taDdoCode, setTaDdoCode] = useState('');
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
      pageCss: '@page { size: A4 landscape; margin: 0; }'
    });
  };
  const handlePrintRtp = () => {
    const el = document.getElementById('rtp-preview');
    if (!el) return;
    openPrintPreview({
      title: 'Revised Tour Plan Preview',
      html: el.innerHTML,
      pageCss: '@page { size: A4 portrait; margin: 0; }',
      bodyCss: 'font-family: Arimo, Arial, sans-serif; color:#000;'
    });
  };
  const loadSampleTa = () => {
    setTaEmployeeName('Muhammad Ali');
    setTaDesignation('Senior Clerk');
    setTaBps('16');
    setTaPersonalNo('1234567');
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
  const [savedTaBills, setSavedTaBills] = useState<SavedTaBill[]>(() => loadLocal<SavedTaBill[]>(TA_BILL_STORAGE_KEY, []));
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const selectedSaved = useMemo(
    () => savedTaBills.find(bill => bill.id === selectedSavedId) || null,
    [savedTaBills, selectedSavedId]
  );

  const billHeader: TABillHeader = useMemo(() => ({
    employeeName: taEmployeeName || '',
    iban: taIban || '',
    designation: taDesignation || '',
    gradeLabel: taBps ? `BPS-${taBps}` : '',
    employeeCode: taPersonalNo || '',
    basicPay: 0,
    station: taStation || '',
    ddoCode: taDdoCode || ''
  }), [taEmployeeName, taIban, taDesignation, taBps, taPersonalNo, taStation, taDdoCode]);

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
    const entry: SavedTaBill = {
      id: Date.now().toString(),
      billNo,
      createdAt: new Date().toISOString(),
      form: {
        employeeName: taEmployeeName,
        designation: taDesignation,
        bps: taBps,
        personalNo: taPersonalNo,
        station: taStation,
        ddoCode: taDdoCode,
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
    const list = [entry, ...savedTaBills];
    setSavedTaBills(list);
    saveLocal(TA_BILL_STORAGE_KEY, list);
    setTaBillNo(billNo);
    showToast('TA Bill saved', 'success');
  };

  const handleLoadSavedTaBill = (entry: SavedTaBill) => {
    setTaEmployeeName(entry.form.employeeName);
    setTaDesignation(entry.form.designation);
    setTaBps(entry.form.bps);
    setTaPersonalNo(entry.form.personalNo);
    setTaStation(entry.form.station);
    setTaDdoCode(entry.form.ddoCode);
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
        pageCss: '@page { size: A4 landscape; margin: 0; }'
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
        pageCss: '@page { size: A4 portrait; margin: 0; }',
        bodyCss: 'font-family: Arimo, Arial, sans-serif; color:#000;'
      });
    }, 50);
  };

  const handleShareTaBill = () => {
    const payload = {
      billNo: taBillNo || '',
      header: billHeader,
      rows: billRows,
      summary: billSummary
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ta-bill-${taBillNo || 'draft'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('TA Bill JSON exported', 'success');
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
        <div className="border border-outline-variant/40 rounded-lg overflow-hidden">
          <div id="rtp-preview">
            <RevisedTourProgram
              station={taStation}
              titleOffice="OFFICE OF THE HEAD MISTRESS GGHS RABAT"
              titleCaption="Revised Tour Program"
              officerName={taEmployeeName}
              employeeName={taEmployeeName}
              monthLabel={(taDepDate && new Date(taDepDate).toLocaleString('en-GB', { month: 'long', year: 'numeric' })) || ''}
              rows={rtpRows}
            />
          </div>
        </div>
      </Card>
      <Card variant="outlined" className="bg-surface space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">TA Bill Preview</div>
          <div className="flex gap-2">
            <Button variant="tonal" label="Print Bill" icon="print" onClick={handleExportTaPdf} />
            <Button variant="outlined" label="Save" icon="save" onClick={handleSaveTaBill} />
            <Button variant="outlined" label="Share" icon="share" onClick={handleShareTaBill} />
          </div>
        </div>
        <div id="ta-bill-print-only" className="bg-white border border-outline-variant/40">
          <TravelAllowanceBill header={billHeader} rows={billRows} summary={billSummary} />
        </div>
      </Card>
      <Card variant="outlined" className="bg-surface xl:col-span-3 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">Saved TA Bills</div>
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
                  <Button variant="outlined" label="Print Bill" icon="print" onClick={() => handlePrintSavedTaBill(entry)} />
                  <Button variant="outlined" label="Print RTP" icon="print" onClick={() => handlePrintSavedRtp(entry)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <div className="hidden">
        <div id="ta-bill-saved-print-only">
          {selectedSaved && (
            <TravelAllowanceBill header={selectedSaved.header} rows={selectedSaved.rows} summary={selectedSaved.summary} />
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
              monthLabel={(selectedSaved.form.depDate && new Date(selectedSaved.form.depDate).toLocaleString('en-GB', { month: 'long', year: 'numeric' })) || ''}
              rows={selectedSaved.rtpRows}
            />
          )}
        </div>
      </div>
    </div>
  );
};
