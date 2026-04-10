import React, { useEffect, useMemo, useState } from 'react';
import { EmployeeRecord } from '../../types';
import { normalizeDesignation, normalizeBpsForBudget } from './bm2';

export const buildSignatureFromOffice = (
  officeName: string,
  employees: EmployeeRecord[]
) => {
  const representative = employees[0];
  const ministryNameSource = officeName || representative?.employees.school_full_name || '';
  const ministryNameCore = ministryNameSource.replace(/^BM\d+\s*-\s*/i, '').trim();
  const ministryUpper = ministryNameCore.toUpperCase();

  const schoolKeywords = [
    'SCHOOL', 'GHS', 'GGHS', 'GMS', 'GGMS', 'GPS', 'GGPS', 'GHSS', 'GGHSS',
    'HIGH SCHOOL', 'MIDDLE SCHOOL', 'PRIMARY SCHOOL',
  ];

  const hasSchoolWord = schoolKeywords.some(kw => ministryUpper.includes(kw));
  const isPrimary = ministryUpper.includes('PRIMARY SCHOOL') || ministryUpper.includes('PRIMARY SCHOOLS');

  let signatureTitle = '';
  let signatureBody = '';

  if (!hasSchoolWord) {
    if (ministryUpper.includes('SUB DIVISIONAL EDUCATION OFFICER') || ministryUpper.includes('SDEO')) {
      signatureTitle = 'Sub Divisional Education Officer';
      let suffix = ministryNameCore;
      const fullPhrase = 'SUB DIVISIONAL EDUCATION OFFICER';
      const fullIdx = ministryUpper.indexOf(fullPhrase);
      if (fullIdx >= 0) {
        suffix = ministryNameCore.slice(fullPhrase.length).trim();
      } else {
        const sdeoIdx = ministryUpper.indexOf('SDEO');
        if (sdeoIdx >= 0) suffix = ministryNameCore.slice(sdeoIdx + 'SDEO'.length).trim();
      }
      signatureBody = suffix;
    } else {
      signatureTitle = ministryNameCore;
      signatureBody = '';
    }
  } else if (isPrimary) {
    signatureTitle = 'Sub Divisional Education Officer';
    const parenIdx = ministryNameCore.indexOf('(');
    signatureBody = parenIdx >= 0 ? ministryNameCore.slice(parenIdx).trim() : ministryNameCore;
  } else {
    const isGirls = ministryUpper.includes('GIRLS') || ministryUpper.includes('FEMALE') ||
      ministryUpper.includes('GGHS') || ministryUpper.includes('(F)');
    const isHigherSecondary = ministryUpper.includes('GHSS') || ministryUpper.includes('GGHSS') ||
      ministryUpper.includes('HIGHER SECONDARY');

    signatureTitle = isHigherSecondary ? 'Principal' : (isGirls ? 'Headmistress' : 'Headmaster');

    let bodySource = ministryNameCore;
    const bodyUpper = bodySource.toUpperCase();
    const titlePrefixes = ['HEADMISTRESS', 'HEADMASTER', 'PRINCIPAL'];
    for (const prefix of titlePrefixes) {
      if (bodyUpper.startsWith(prefix + ' ')) {
        bodySource = bodySource.slice(prefix.length).trim();
        break;
      }
    }

    const parts = bodySource.split(/\s+/);
    if (parts.length >= 3) {
      const location = parts.slice(-2).join(' ');
      const name = parts.slice(0, -2).join(' ');
      signatureBody = `${name}\n${location}`;
    } else {
      signatureBody = bodySource;
    }
  }

  return { signatureTitle, signatureBody };
};

type SanctionedPostsReportProps = {
  officeName: string;
  ddoCode: string;
  fiscalYearLabel: string;
  employees: EmployeeRecord[];
};

type PostGroup = {
  designation: string;
  bps: number;
  count: number;
  isGazetted: boolean;
};

export const SanctionedPostsReport: React.FC<SanctionedPostsReportProps> = ({
  officeName, ddoCode, fiscalYearLabel, employees,
}) => {

  const filtered = useMemo(
    () => employees.filter(e => {
      const empDdo = (e.employees.ddo_code || '').trim().toUpperCase();
      const targetDdo = (ddoCode || '').trim().toUpperCase();
      const status = (e.employees.status || '').toLowerCase();
      if (!targetDdo) return status === 'active';
      return empDdo === targetDdo && status === 'active';
    }),
    [employees, ddoCode]
  );

  const groups = useMemo<PostGroup[]>(() => {
    const map = new Map<string, PostGroup>();
    filtered.forEach(e => {
      const bpsRaw = Number(e.employees.bps) || 0;
      const rawDesignation = e.employees.designation_full || e.employees.designation || '';
      const designation = normalizeDesignation(rawDesignation, bpsRaw);
      const bps = normalizeBpsForBudget(designation, bpsRaw);
      const key = `${designation}|${bps}`;
      const existing = map.get(key);
      const isGazetted = bps >= 16;
      if (existing) existing.count += 1;
      else map.set(key, { designation, bps, count: 1, isGazetted });
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.isGazetted !== b.isGazetted) return a.isGazetted ? -1 : 1;
      if (b.bps !== a.bps) return b.bps - a.bps;
      return a.designation.localeCompare(b.designation);
    });
  }, [filtered]);

  const [overrides, setOverrides] = useState<Record<string, { cfy: number; next: number }>>(() => {
    try {
      const key = `budgeting/posts/overrides/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
      const raw = localStorage.getItem(key);
      const obj = raw ? JSON.parse(raw) : null;
      if (obj && typeof obj === 'object') return obj;
    } catch {}
    return {};
  });
  const [overridesLoadedForDdo, setOverridesLoadedForDdo] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDesig, setNewDesig] = useState('');
  const [newBps, setNewBps] = useState('');
  const [newCfy, setNewCfy] = useState('');
  const [newNext, setNewNext] = useState('');

  const baseCountByKey = useMemo(() => {
    const map = new Map<string, number>();
    groups.forEach(g => map.set(`${g.designation}|${g.bps}`, g.count));
    return map;
  }, [groups]);

  const overridesNormalized = useMemo(() => {
    const result: Record<string, { cfy: number; next: number }> = {};
    Object.entries(overrides).forEach(([rawKey, value]) => {
      const parts = String(rawKey).split('|');
      const rawDesignation = parts[0] || '';
      const bpsRaw = Number(parts[1]) || 0;
      const normalizedDesignation = normalizeDesignation(rawDesignation, bpsRaw);
      const bps = normalizeBpsForBudget(normalizedDesignation, bpsRaw);
      if (!bps) return;
      const normalizedKey = `${normalizedDesignation}|${bps}`;
      const cfy = Number((value as any)?.cfy) || 0;
      const next = Number((value as any)?.next) || 0;
      const existing = result[normalizedKey];
      if (existing) { existing.cfy += cfy; existing.next += next; }
      else result[normalizedKey] = { cfy, next };
    });
    return result;
  }, [overrides]);

  const rowsWithCounts = useMemo(() => {
    const union = new Set<string>();
    groups.forEach(g => union.add(`${g.designation}|${g.bps}`));
    Object.keys(overridesNormalized).forEach(k => union.add(k));
    const rows = Array.from(union).map(key => {
      const parts = key.split('|');
      const designation = parts[0] || '';
      const bps = Number(parts[1] || '0');
      const isGazetted = bps >= 16;
      const base = baseCountByKey.get(key) ?? 0;
      const override = overridesNormalized[key];
      const cfy = override?.cfy ?? base;
      const next = override?.next ?? base;
      const isManual = base === 0;
      return { designation, bps, count: base, isGazetted, isManual, key, cfy, next };
    });
    return rows
      .filter(r => r.bps > 0 && !(r.isManual && r.cfy === 0 && r.next === 0))
      .sort((a, b) => {
      if (a.isGazetted !== b.isGazetted) return a.isGazetted ? -1 : 1;
      if (b.bps !== a.bps) return b.bps - a.bps;
      return a.designation.localeCompare(b.designation);
      });
  }, [groups, baseCountByKey, overridesNormalized]);

  useEffect(() => {
    try {
      const ddo = (ddoCode || '').trim().toUpperCase() || 'DEFAULT';
      if ((overridesLoadedForDdo || '') !== ddo) return;
      const key = `budgeting/posts/sanctioned/${ddo}`;
      const payload: Record<string, number> = {};
      rowsWithCounts.forEach(g => { payload[g.key] = g.next; });
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      localStorage.setItem(key, JSON.stringify({ ...(existing && typeof existing === 'object' ? existing : {}), ...payload }));
    } catch {}
  }, [rowsWithCounts, ddoCode, overridesLoadedForDdo]);

  useEffect(() => {
    try {
      localStorage.setItem(`budgeting/posts/overrides/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`, JSON.stringify(overrides));
    } catch {}
  }, [overrides, ddoCode]);

  useEffect(() => {
    try {
      const ddoKey = `budgeting/posts/overrides/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
      const dRaw = localStorage.getItem(ddoKey);
      const dObj = dRaw ? JSON.parse(dRaw) : null;
      if (dObj && typeof dObj === 'object') {
        setOverrides(dObj);
        setOverridesLoadedForDdo((ddoCode || '').trim().toUpperCase() || 'DEFAULT');
      } else {
        setOverrides({});
        setOverridesLoadedForDdo((ddoCode || '').trim().toUpperCase() || 'DEFAULT');
      }
    } catch {}
  }, [ddoCode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`budgeting/posts/ui`);
      if (raw) {
        const ui = JSON.parse(raw);
        if (ui && typeof ui === 'object') {
          setIsEditing(Boolean(ui.isEditing));
          setIsAdding(Boolean(ui.isAdding));
          if (typeof ui.newDesig === 'string') setNewDesig(ui.newDesig);
          if (typeof ui.newBps === 'string') setNewBps(ui.newBps);
          if (typeof ui.newCfy === 'string') setNewCfy(ui.newCfy);
          if (typeof ui.newNext === 'string') setNewNext(ui.newNext);
        }
      }
    } catch {}
  }, [ddoCode]);

  useEffect(() => {
    try {
      localStorage.setItem(`budgeting/posts/ui`, JSON.stringify({ isEditing, isAdding, newDesig, newBps, newCfy, newNext }));
    } catch {}
  }, [isEditing, isAdding, newDesig, newBps, newCfy, newNext]);

  const gazettedGroups = rowsWithCounts.filter(g => g.isGazetted);
  const nonGazettedGroups = rowsWithCounts.filter(g => !g.isGazetted);

  const totalSanctionCFY = rowsWithCounts.reduce((sum, g) => sum + g.cfy, 0);
  const totalSanctionNext = rowsWithCounts.reduce((sum, g) => sum + g.next, 0);
  const totalGazettedCFY = gazettedGroups.reduce((sum, g) => sum + g.cfy, 0);
  const totalGazettedNext = gazettedGroups.reduce((sum, g) => sum + g.next, 0);

  const { signatureTitle, signatureBody } = useMemo(
    () => buildSignatureFromOffice(officeName, filtered),
    [officeName, filtered]
  );

  const handleOverrideChange = (key: string, field: 'cfy' | 'next', value: string) => {
    const raw = value.trim();
    if (!raw) {
      setOverrides(prev => { const next = { ...prev }; delete next[key]; return next; });
      return;
    }
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return;
    setOverrides(prev => {
      const normalizeKey = (rawKey: string) => {
        const parts = String(rawKey).split('|');
        const rawDesignation = parts[0] || '';
        const bpsRaw = Number(parts[1]) || 0;
        return `${normalizeDesignation(rawDesignation, bpsRaw)}|${normalizeBpsForBudget(normalizeDesignation(rawDesignation, bpsRaw), bpsRaw)}`;
      };
      const nextOverrides: typeof prev = { ...prev };
      Object.keys(nextOverrides).forEach(existingKey => {
        if (normalizeKey(existingKey) === key && existingKey !== key) delete nextOverrides[existingKey];
      });
      const existing = nextOverrides[key];
      const base = baseCountByKey.get(key) ?? 0;
      return { ...nextOverrides, [key]: { cfy: field === 'cfy' ? num : existing?.cfy ?? base, next: field === 'next' ? num : existing?.next ?? base } };
    });
  };

  const yearMatch = fiscalYearLabel.match(/(\d{4})/);
  const startYear = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
  const cfyLabel = `${startYear}-${String(startYear + 1).slice(-2)}`;
  const nextYearLabel = `${startYear + 1}-${String(startYear + 2).slice(-2)}`;

  const heading = officeName || ddoCode
    ? `OFFICE OF THE ${officeName || ''} ${ddoCode || ''}`.trim()
    : 'SANCTIONED POSTS STATEMENT';

  return (
    <>
      <style>{`
        @media print {
          @page { 
            size: A4 landscape; 
            margin: 10mm; 
          }
          
          /* Force print colors */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Reset page containers - but NOT table elements */
          html, body,
          div:not(.posts-table-wrapper),
          section, article, main, aside, header, footer, nav,
          [class*="card"]:not(.posts-table-wrapper),
          [class*="Card"]:not(.posts-table-wrapper),
          [class*="panel"]:not(.posts-table-wrapper),
          [class*="Panel"]:not(.posts-table-wrapper),
          [class*="container"]:not(.posts-table-wrapper),
          [class*="Container"]:not(.posts-table-wrapper),
          [class*="wrapper"]:not(.posts-table-wrapper),
          [class*="Wrapper"]:not(.posts-table-wrapper),
          [class*="surface"]:not(.posts-table-wrapper),
          [class*="Surface"]:not(.posts-table-wrapper),
          [class*="paper"]:not(.posts-table-wrapper),
          [class*="Paper"]:not(.posts-table-wrapper),
          [class*="frame"]:not(.posts-table-wrapper),
          [class*="Frame"]:not(.posts-table-wrapper) {
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            outline: none !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .posts-root {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Table styling */
          .posts-table th,
          .posts-table td {
            border: 1px solid #000 !important;
          }
          
          /* Black header rows - IMPORTANT: must come after reset */
          .posts-table .header-black,
          .posts-table tr.header-black,
          .posts-table tr.header-black th,
          .posts-table tr.header-black td {
            background-color: #000 !important;
            background: #000 !important;
            color: #fff !important;
          }
          
          /* White rows */
          .posts-table .row-white td {
            background-color: #fff !important;
            background: #fff !important;
            color: #000 !important;
          }
        }
        
        /* Screen styles */
        .posts-root {
          font-family: Arial, sans-serif;
          font-size: 11px;
          background: white;
          color: black;
          padding: 10mm;
        }
        
        .posts-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 11px;
          background: white;
        }
        
        .posts-table th,
        .posts-table td {
          border: 1px solid black;
          padding: 4px 6px;
        }
        
        .posts-table .header-black,
        .posts-table tr.header-black,
        .posts-table tr.header-black th,
        .posts-table tr.header-black td {
          background-color: #000 !important;
          color: #fff !important;
        }
        
        .posts-table .row-white td {
          background-color: #fff;
          color: #000;
        }
        
        .row-h { height: 28px; }
      `}</style>

      <div className="posts-root">
        <div style={{ textAlign: 'center', marginBottom: 2 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '-0.5px', fontFamily: "'Oswald', 'Arial Narrow', sans-serif" }}>
            {heading}
          </h1>
        </div>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            type="button"
            style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #9ca3af', borderRadius: 4, background: '#f3f4f6', cursor: 'pointer' }}
            onClick={() => setIsEditing(e => !e)}
          >
            {isEditing ? 'Done' : 'Edit Posts'}
          </button>
          <button
            type="button"
            style={{ marginLeft: 8, padding: '4px 12px', fontSize: 12, border: '1px solid #9ca3af', borderRadius: 4, background: '#f3f4f6', cursor: 'pointer' }}
            onClick={() => setIsAdding(a => !a)}
          >
            {isAdding ? 'Cancel' : 'Add New Post'}
          </button>
        </div>

        {isAdding && (
          <div className="no-print" style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, alignItems: 'center' }}>
            <input type="text" placeholder="Designation" style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 8px', fontSize: 11 }} value={newDesig} onChange={e => setNewDesig(e.target.value)} />
            <input type="number" placeholder="BPS" style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 8px', fontSize: 11 }} value={newBps} onChange={e => setNewBps(e.target.value)} />
            <input type="number" placeholder="CFY" style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 8px', fontSize: 11 }} value={newCfy} onChange={e => setNewCfy(e.target.value)} />
            <input type="number" placeholder="Next Year" style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '4px 8px', fontSize: 11 }} value={newNext} onChange={e => setNewNext(e.target.value)} />
            <button
              type="button"
              style={{ padding: '4px 12px', fontSize: 12, border: '1px solid #2563eb', borderRadius: 4, background: '#2563eb', color: 'white', cursor: 'pointer' }}
              onClick={() => {
                const bpsNum = Number(newBps);
                const cfyNum = Number(newCfy);
                const nextNum = Number(newNext);
                if (!newDesig.trim() || !Number.isFinite(bpsNum) || bpsNum <= 0) return;
                const normalized = normalizeDesignation(newDesig.trim(), bpsNum);
                const bpsNorm = normalizeBpsForBudget(normalized, bpsNum);
                const key = `${normalized}|${bpsNorm}`;
                const cfyFinal = Number.isFinite(cfyNum) && cfyNum >= 0 ? cfyNum : 0;
                const nextFinal = Number.isFinite(nextNum) && nextNum >= 0 ? nextNum : 0;
                setOverrides(prev => ({ ...prev, [key]: { cfy: cfyFinal, next: nextFinal } }));
                try {
                  const ddoKey = `budgeting/posts/overrides/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
                  const raw = localStorage.getItem(ddoKey);
                  const obj = raw ? JSON.parse(raw) : {};
                  localStorage.setItem(ddoKey, JSON.stringify({ ...(obj && typeof obj === 'object' ? obj : {}), [key]: { cfy: cfyFinal, next: nextFinal } }));
                } catch {}
                try {
                  const sancKey = `budgeting/posts/sanctioned/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
                  const rawS = localStorage.getItem(sancKey);
                  const objS = rawS ? JSON.parse(rawS) : {};
                  localStorage.setItem(sancKey, JSON.stringify({ ...(objS && typeof objS === 'object' ? objS : {}), [key]: nextFinal }));
                } catch {}
                setNewDesig(''); setNewBps(''); setNewCfy(''); setNewNext('');
              }}
            >
              Add
            </button>
          </div>
        )}

        <div className="posts-table-wrapper">
          <table className="posts-table">
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>

            <thead>
              <tr className="header-black">
                <th style={{ textAlign: 'right', paddingRight: 16, fontWeight: 400 }}></th>
                <th style={{ textAlign: 'center', fontWeight: 400 }}></th>
                <th style={{ textAlign: 'center', fontWeight: 400 }}>CFY<br />{cfyLabel}</th>
                <th style={{ textAlign: 'center', fontWeight: 400 }}>Next year<br />{nextYearLabel}</th>
                <th className="no-print" style={{ textAlign: 'center', fontWeight: 400 }}></th>
              </tr>

              <tr className="header-black">
                <th colSpan={2} style={{ textAlign: 'right', paddingRight: 48, fontWeight: 400 }}>Total No. of Sanction Posts</th>
                <th style={{ textAlign: 'center', fontWeight: 400 }}>{totalSanctionCFY}</th>
                <th style={{ textAlign: 'center', fontWeight: 400 }}>{totalSanctionNext}</th>
                <th className="no-print" style={{ textAlign: 'center', fontWeight: 400 }}></th>
              </tr>

              <tr className="header-black">
                <th colSpan={2} style={{ textAlign: 'right', paddingRight: 48, fontWeight: 400 }}>Total Number of Gazzated Posts</th>
                <th style={{ textAlign: 'center', fontWeight: 400 }}>{totalGazettedCFY}</th>
                <th style={{ textAlign: 'center', fontWeight: 400 }}>{totalGazettedNext}</th>
                <th className="no-print" style={{ textAlign: 'center', fontWeight: 400 }}></th>
              </tr>
            </thead>

            <tbody>
              {gazettedGroups.map(g => (
                <tr key={g.key} className="row-white row-h">
                  <td style={{ textAlign: 'left', paddingLeft: 8 }}>{g.designation}</td>
                  <td style={{ textAlign: 'center' }}>{g.bps}</td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <input type="number" style={{ width: '100%', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11 }} value={g.cfy} onChange={e => handleOverrideChange(g.key, 'cfy', e.target.value)} />
                    ) : g.cfy}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <input type="number" style={{ width: '100%', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11 }} value={g.next} onChange={e => handleOverrideChange(g.key, 'next', e.target.value)} />
                    ) : g.next}
                  </td>
                  <td className="no-print" style={{ textAlign: 'center' }}>
                    {g.isManual && (
                      <button
                        type="button"
                        style={{ padding: '2px 8px', fontSize: 12, border: '1px solid #9ca3af', borderRadius: 4, background: '#f3f4f6', cursor: 'pointer' }}
                        onClick={() => {
                          setOverrides(prev => { const next = { ...prev }; delete next[g.key]; return next; });
                          try {
                            const ddoKey = `budgeting/posts/overrides/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
                            const raw = localStorage.getItem(ddoKey);
                            const obj = raw ? JSON.parse(raw) : {};
                            if (obj && typeof obj === 'object') { delete obj[g.key]; localStorage.setItem(ddoKey, JSON.stringify(obj)); }
                          } catch {}
                          try {
                            const sancKey = `budgeting/posts/sanctioned/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
                            const rawS = localStorage.getItem(sancKey);
                            const objS = rawS ? JSON.parse(rawS) : {};
                            if (objS && typeof objS === 'object') { delete objS[g.key]; localStorage.setItem(sancKey, JSON.stringify(objS)); }
                          } catch {}
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              <tr className="header-black row-h">
                <td colSpan={2} style={{ textAlign: 'center', paddingLeft: 8 }}>Total Number of Non Gazzated Posts</td>
                <td style={{ textAlign: 'center' }}>{nonGazettedGroups.reduce((sum, g) => sum + g.cfy, 0)}</td>
                <td style={{ textAlign: 'center' }}>{nonGazettedGroups.reduce((sum, g) => sum + g.next, 0)}</td>
                <td className="no-print" style={{ textAlign: 'center' }}></td>
              </tr>

              {nonGazettedGroups.map(g => (
                <tr key={g.key} className="row-white row-h">
                  <td style={{ textAlign: 'left', paddingLeft: 8 }}>{g.designation}</td>
                  <td style={{ textAlign: 'center' }}>{g.bps}</td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <input type="number" style={{ width: '100%', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11 }} value={g.cfy} onChange={e => handleOverrideChange(g.key, 'cfy', e.target.value)} />
                    ) : g.cfy}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <input type="number" style={{ width: '100%', textAlign: 'center', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11 }} value={g.next} onChange={e => handleOverrideChange(g.key, 'next', e.target.value)} />
                    ) : g.next}
                  </td>
                  <td className="no-print" style={{ textAlign: 'center' }}>
                    {g.isManual && (
                      <button
                        type="button"
                        style={{ padding: '2px 8px', fontSize: 12, border: '1px solid #9ca3af', borderRadius: 4, background: '#f3f4f6', cursor: 'pointer' }}
                        onClick={() => {
                          setOverrides(prev => { const next = { ...prev }; delete next[g.key]; return next; });
                          try {
                            const ddoKey = `budgeting/posts/overrides/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
                            const raw = localStorage.getItem(ddoKey);
                            const obj = raw ? JSON.parse(raw) : {};
                            if (obj && typeof obj === 'object') { delete obj[g.key]; localStorage.setItem(ddoKey, JSON.stringify(obj)); }
                          } catch {}
                          try {
                            const sancKey = `budgeting/posts/sanctioned/${(ddoCode || '').trim().toUpperCase() || 'DEFAULT'}`;
                            const rawS = localStorage.getItem(sancKey);
                            const objS = rawS ? JSON.parse(rawS) : {};
                            if (objS && typeof objS === 'object') { delete objS[g.key]; localStorage.setItem(sancKey, JSON.stringify(objS)); }
                          } catch {}
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 48, marginLeft: 96, textAlign: 'center', width: 160 }}>
          <div style={{ borderTop: '1px solid black', paddingTop: 4, marginBottom: 4 }}></div>
          <div style={{ fontSize: 12 }}>{signatureTitle}</div>
          <div style={{ fontSize: 12, whiteSpace: 'pre-line' }}>{signatureBody}</div>
        </div>
      </div>
    </>
  );
};
