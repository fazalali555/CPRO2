import React, { useState, useMemo, useRef, useEffect } from 'react';
import { EmployeeRecord } from '../types';
import { calculateServiceDuration, formatCurrency, isDeceasedStatus } from '../utils';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';
import { calculatePension, calculateFamilyPension } from '../lib/pension';
import { AppIcon } from '../components/AppIcon';
import { Card, Button, TextField } from '../components/M3';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useEmployeeContext } from '../contexts/EmployeeContext';

interface PensionBreakdown {
  type: 'Regular' | 'Family';
  grossPension: number;
  commutationPortion: number;
  commutationAmount: number;
  netPension: number;
  adhocRelief2022: number;
  runningAfter2022: number;
  adhocRelief2023: number;
  runningAfter2023: number;
  adhocRelief2024: number;
  runningAfter2024: number;
  adhocRelief2025: number;
  runningAfter2025: number;
  medicalAllowance2010: number;
  medicalAllowance2022: number;
  monthlyPayablePension: number;
  commutationLumpSum: number;
  ageFactor: number;
  medicalAllowanceRate: number; // 0.20 or 0.25
}

export const PensionCalculator: React.FC = () => {
  const { employees } = useEmployeeContext();
  const { t, isUrdu } = useLanguage();
  const { showToast } = useToast();

  // Search & Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Form State
  const [basicPay, setBasicPay] = useState(0);
  const [personalPay, setPersonalPay] = useState(0);
  const [age, setAge] = useState(60);
  const [serviceYears, setServiceYears] = useState(0);
  const [commutationPortion, setCommutationPortion] = useState(35);
  const [pensionType, setPensionType] = useState<'Regular' | 'Family'>('Regular');
  const [bps, setBps] = useState(0);

  // Result State
  const [result, setResult] = useState<PensionBreakdown | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return employees.filter(emp =>
      emp.employees.name.toLowerCase().includes(query) ||
      emp.employees.cnic_no.includes(query) ||
      emp.employees.personal_no?.includes(query) ||
      (emp.employees.school_full_name || '').toLowerCase().includes(query)
    ).slice(0, 15);
  }, [employees, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Calculate age with government rule:
   * - If months since last birthday >= 6, round up the age
   * - Cap age at 60 years maximum for pension calculation
   */
  const calculateAgeWithGovernmentRule = (dob: string, endDate: string): number => {
    const dobDate = parseISO(dob);
    const endDateObj = parseISO(endDate);

    const years = differenceInYears(endDateObj, dobDate);

    const lastBirthday = new Date(dobDate);
    lastBirthday.setFullYear(endDateObj.getFullYear());

    if (lastBirthday > endDateObj) {
      lastBirthday.setFullYear(lastBirthday.getFullYear() - 1);
    }

    const monthsSinceLastBirthday = differenceInMonths(endDateObj, lastBirthday);

    let adjustedAge = years;
    if (monthsSinceLastBirthday >= 6) {
      adjustedAge = years + 1;
    }

    // Cap age at 60 for pension calculation
    return Math.min(adjustedAge, 60);
  };

  const handleEmployeeSelect = (emp: EmployeeRecord) => {
    setSelectedEmployee(emp);
    setSearchQuery(emp.employees.name);
    setIsDropdownOpen(false);

    // Determine pension type based on status
    const isDeceased = isDeceasedStatus(emp.employees.status);
    setPensionType(isDeceased ? 'Family' : 'Regular');

    // Populate fields
    setBasicPay(emp.financials?.basic_pay || 0);
    setPersonalPay(emp.financials?.p_pay || 0);
    setBps(emp.employees?.bps || 0);

    // Calculate Service Duration
    const isActive = emp.employees.status === 'Active';
    const calculationEndDate = isActive
      ? new Date().toISOString()
      : emp.service_history.date_of_retirement;

    const service = calculateServiceDuration(
      emp.service_history.date_of_appointment,
      calculationEndDate,
      emp.service_history.lwp_days
    );

    // Qualifying Service Rule: Years + 1 if months >= 6
    let qService = service.years;
    if (service.months >= 6) qService += 1;
    setServiceYears(Math.min(qService, 30));

    // Calculate Age with Government Rule
    let calculatedAge = 60;
    if (emp.employees.dob && calculationEndDate) {
      calculatedAge = calculateAgeWithGovernmentRule(emp.employees.dob, calculationEndDate);
    }
    setAge(calculatedAge);

    setCommutationPortion(emp.extras?.commutation_portion ?? 35);
    setResult(null);
    setShowReport(false);
  };

  const handleClearSelection = () => {
    setSelectedEmployee(null);
    setSearchQuery('');
    setBasicPay(0);
    setPersonalPay(0);
    setServiceYears(0);
    setAge(60);
    setCommutationPortion(35);
    setBps(0);
    setResult(null);
    setShowReport(false);
  };

  const calculatePensionBreakdown = (pensionAge: number): PensionBreakdown | null => {
    // Ensure age is capped at 60 for pension calculation
    const effectiveAge = Math.min(pensionAge, 60);
    const employeeBps = selectedEmployee?.employees?.bps ?? bps ?? 0;

    try {
      if (pensionType === 'Family') {
        const p = calculateFamilyPension(
          selectedEmployee?.employees.status || 'Death in Service',
          basicPay,
          personalPay,
          serviceYears,
          effectiveAge,
          commutationPortion,
          employeeBps  // ← pass bps for medical allowance rate
        );

        if (!p) {
          showToast('Unable to calculate Family Pension for this status', 'error');
          return null;
        }

        const inc2022 = p.increases.find(i => i.year === 2022)?.amount || 0;
        const inc2023 = p.increases.find(i => i.year === 2023)?.amount || 0;
        const inc2024 = p.increases.find(i => i.year === 2024)?.amount || 0;
        const inc2025 = p.increases.find(i => i.year === 2025)?.amount || 0;

        const runningAfter2022 = p.familyPensionBase + inc2022;
        const runningAfter2023 = runningAfter2022 + inc2023;
        const runningAfter2024 = runningAfter2023 + inc2024;
        const runningAfter2025 = runningAfter2024 + inc2025;

        return {
          type: 'Family',
          grossPension: p.grossPension,
          commutationPortion: p.commutedPortion,
          commutationAmount: p.surrenderedPortion || p.commutedAmount,
          netPension: p.familyPensionBase,
          monthlyPayablePension: p.netFamilyPension,
          commutationLumpSum: p.commutationLumpSum,
          adhocRelief2022: inc2022,
          runningAfter2022,
          adhocRelief2023: inc2023,
          runningAfter2023,
          adhocRelief2024: inc2024,
          runningAfter2024,
          adhocRelief2025: inc2025,
          runningAfter2025,
          medicalAllowance2010: p.medicalAllowance2010,
          medicalAllowance2022: p.medicalAllowanceIncrease,
          ageFactor: p.ageFactor,
          medicalAllowanceRate: employeeBps >= 17 ? 0.20 : 0.25,
        };
      }

      // Regular Pension
      const p = calculatePension({
        basicPay,
        personalPay,
        qualifyingServiceYears: serviceYears,
        commutationPortionPercent: commutationPortion,
        ageAtRetirement: effectiveAge,
        bps: employeeBps,  // ← pass bps for medical allowance rate
      });

      return {
        type: 'Regular',
        grossPension: p.grossPension,
        commutationPortion: p.commutationPortion * 100,
        commutationAmount: p.commutationAmount,
        netPension: p.netPension,
        adhocRelief2022: p.adhocRelief2022,
        runningAfter2022: p.runningAfter2022,
        adhocRelief2023: p.adhocRelief2023,
        runningAfter2023: p.runningAfter2023,
        adhocRelief2024: p.adhocRelief2024,
        runningAfter2024: p.runningAfter2024,
        adhocRelief2025: p.adhocRelief2025,
        runningAfter2025: p.runningAfter2025,
        medicalAllowance2010: p.medicalAllowance2010,
        medicalAllowance2022: p.medicalAllowance2022,
        monthlyPayablePension: p.monthlyPayablePension,
        commutationLumpSum: p.commutationLumpSum,
        ageFactor: p.ageFactor,
        medicalAllowanceRate: p.medicalAllowanceRate,
      };
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Calculation error', 'error');
      return null;
    }
  };

  const handleCalculate = () => {
    if (basicPay <= 0) {
      showToast('Please enter Basic Pay', 'error');
      return;
    }
    if (serviceYears < 10) {
      showToast('Minimum 10 years of qualifying service required', 'error');
      return;
    }
    if (age < 40) {
      showToast('Minimum age must be 40 years', 'error');
      return;
    }

    const pensionAge = Math.min(age, 60);
    const breakdown = calculatePensionBreakdown(pensionAge);
    if (breakdown) {
      setResult(breakdown);
      setShowReport(true);
      showToast('Pension calculated successfully!', 'success');
    }
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Derive display values
  const effectiveBps = selectedEmployee?.employees?.bps ?? bps ?? 0;
  const medicalRateLabel = effectiveBps >= 17 ? '20%' : '25%';

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <PageHeader
        title={t.pension?.title || "Pension Calculator"}
        subtitle={t.pension?.subtitle || "Calculate pension as per KPK Government Rules 2025"}
        action={
          <div className="flex gap-2">
            {showReport && (
              <Button variant="filled" onClick={() => window.print()} label="Print Report" icon="print" />
            )}
          </div>
        }
      />

      {/* Input Section - Hidden on Print */}
      <Card variant="outlined" className="p-6 md:p-8 no-print bg-surface-container-low mb-6">

        {/* Pension Type Toggle */}
        <div className="flex gap-4 mb-6 justify-center">
          <div className="inline-flex bg-surface-variant rounded-full p-1">
            <button
              onClick={() => setPensionType('Regular')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                pensionType === 'Regular'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-on-surface/5'
              }`}
            >
              Regular Pension
            </button>
            <button
              onClick={() => setPensionType('Family')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                pensionType === 'Family'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-on-surface/5'
              }`}
            >
              Family Pension
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Employee Search Box */}
          <div className="lg:col-span-2" ref={searchRef}>
            <label className="block text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">
              Search Employee
            </label>
            <div className="relative">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <AppIcon name="search" size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, CNIC, or Personnel No..."
                  className="w-full h-14 pl-12 pr-12 bg-surface-variant/50 border-2 border-outline-variant rounded-xl outline-none text-on-surface text-base focus:border-primary focus:bg-surface transition-all"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    if (!e.target.value) setSelectedEmployee(null);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                />
                {selectedEmployee && (
                  <button
                    onClick={handleClearSelection}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error transition-colors"
                  >
                    <AppIcon name="close" size={20} />
                  </button>
                )}
              </div>

              {/* Dropdown Results */}
              {isDropdownOpen && filteredEmployees.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-surface border border-outline-variant rounded-xl shadow-elevation-3 max-h-80 overflow-y-auto">
                  {filteredEmployees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => handleEmployeeSelect(emp)}
                      className={`w-full p-4 text-left hover:bg-surface-variant/50 transition-colors border-b border-outline-variant/30 last:border-b-0 ${
                        selectedEmployee?.id === emp.id ? 'bg-primary-container' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold">
                          {emp.employees.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-on-surface">{emp.employees.name}</div>
                          <div className="text-xs text-on-surface-variant flex gap-3">
                            <span>{emp.employees.designation || 'N/A'}</span>
                            <span>BPS-{emp.employees.bps || 'N/A'}</span>
                            <span className="font-mono">{emp.employees.personal_no || emp.employees.cnic_no}</span>
                          </div>
                          {emp.employees.school_full_name && (
                            <div className="text-xs text-on-surface-variant truncate">{emp.employees.school_full_name}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-on-surface-variant">Basic Pay</div>
                          <div className="font-mono font-bold text-primary">{formatCurrency(emp.financials?.basic_pay || 0)}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isDropdownOpen && searchQuery && filteredEmployees.length === 0 && (
                <div className="absolute z-50 w-full mt-2 bg-surface border border-outline-variant rounded-xl shadow-elevation-3 p-6 text-center">
                  <AppIcon name="search_off" size={32} className="text-on-surface-variant/50 mb-2" />
                  <p className="text-on-surface-variant">No employees found</p>
                  <p className="text-xs text-on-surface-variant/70">Try a different search term or enter values manually</p>
                </div>
              )}
            </div>

            {selectedEmployee && (
              <div className="mt-3 p-3 bg-primary-container/30 rounded-lg border border-primary/20 flex items-center gap-3">
                <AppIcon name="check_circle" className="text-primary" />
                <span className="text-sm">
                  <strong>{selectedEmployee.employees.name}</strong> selected — BPS-{selectedEmployee.employees.bps} — Fields auto-populated
                </span>
              </div>
            )}
          </div>

          {/* Input Fields */}
          <TextField
            label="Basic Pay (Rs.)"
            type="number"
            value={basicPay}
            onChange={e => setBasicPay(Number(e.target.value))}
            icon="payments"
          />
          <TextField
            label="Personal Pay (Rs.)"
            type="number"
            value={personalPay}
            onChange={e => setPersonalPay(Number(e.target.value))}
            icon="add_card"
          />
          <TextField
            label="Qualifying Service (Years)"
            type="number"
            value={serviceYears}
            onChange={e => setServiceYears(Number(e.target.value))}
            icon="history"
          />
          <div>
            <TextField
              label="Age at Retirement"
              type="number"
              value={age}
              onChange={e => setAge(Number(e.target.value))}
              icon="cake"
            />
            {age > 60 && (
              <p className="text-xs text-warning mt-1 flex items-center gap-1">
                <AppIcon name="info" size={14} />
                Age will be capped at 60 for pension calculation
              </p>
            )}
          </div>
          <TextField
            label="Commutation Portion (%)"
            type="number"
            value={commutationPortion}
            onChange={e => setCommutationPortion(Number(e.target.value))}
            icon="percent"
          />
          <TextField
            label="BPS Grade"
            type="number"
            value={bps}
            onChange={e => setBps(Number(e.target.value))}
            icon="grade"
          />

          <div className="flex items-end">
            <div className="p-4 bg-surface-variant/50 rounded-xl flex-1">
              <div className="text-xs text-on-surface-variant uppercase mb-1">Pensionable Pay</div>
              <div className="text-xl font-bold font-mono text-primary">{formatCurrency(basicPay + personalPay)}</div>
            </div>
          </div>

          {/* Medical Allowance Rate Preview */}
          <div className="flex items-end">
            <div className={`p-4 rounded-xl flex-1 border-2 ${effectiveBps >= 17 ? 'bg-secondary-container/30 border-secondary/30' : 'bg-surface-variant/50 border-outline-variant'}`}>
              <div className="text-xs text-on-surface-variant uppercase mb-1">Medical Allowance Rate</div>
              <div className={`text-xl font-bold font-mono ${effectiveBps >= 17 ? 'text-secondary' : 'text-primary'}`}>
                {medicalRateLabel} of Net Pension
              </div>
              <div className="text-xs text-on-surface-variant mt-1">
                {effectiveBps >= 17 ? 'BPS-17 & above (Gazetted)' : 'BPS-16 & below (Non-Gazetted)'}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="filled"
            onClick={handleCalculate}
            label="Calculate Pension"
            icon="calculate"
            className="flex-1 h-14 text-lg"
          />
          <Button
            variant="outlined"
            onClick={handleClearSelection}
            label="Reset"
            icon="refresh"
            className="h-14"
          />
        </div>
      </Card>

      {/* Report Section */}
      {result && showReport && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Report Header - For Print */}
          <div className="hidden print:block mb-2 text-center border-b border-black pb-2">
            <h1 className="text-xl font-bold uppercase">Government of Khyber Pakhtunkhwa</h1>
            <h2 className="text-base font-bold">Pension Calculation Statement</h2>
            <p className="text-xs mt-1">Generated on: {currentDate}</p>
          </div>

          <div className="print:grid print:grid-cols-2 print:gap-4 print:mb-4">

            {/* Employee Info Card */}
            {selectedEmployee && (
              <Card variant="outlined" className="p-6 bg-surface print:p-3 print:border print:border-black">
                <div className="flex items-center gap-2 mb-4 text-primary print:text-black print:mb-2">
                  <AppIcon name="person" />
                  <h3 className="font-bold uppercase text-sm tracking-wide">Employee Information</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 print:grid-cols-2 gap-4 text-sm print:gap-2 print:text-xs">
                  <div>
                    <div className="text-on-surface-variant text-xs uppercase">Name</div>
                    <div className="font-bold">{selectedEmployee.employees.name}</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant text-xs uppercase">Designation</div>
                    <div className="font-bold">{selectedEmployee.employees.designation || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant text-xs uppercase">BPS</div>
                    <div className="font-bold">BPS-{selectedEmployee.employees.bps || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant text-xs uppercase">Personnel No</div>
                    <div className="font-mono font-bold">{selectedEmployee.employees.personal_no || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-on-surface-variant text-xs uppercase">CNIC</div>
                    <div className="font-mono font-bold">{selectedEmployee.employees.cnic_no}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Calculation Parameters */}
            <Card variant="outlined" className="p-6 bg-surface-container-low print:p-3 print:border print:border-black">
              <div className="flex items-center gap-2 mb-4 text-primary print:text-black print:mb-2">
                <AppIcon name="tune" />
                <h3 className="font-bold uppercase text-sm tracking-wide">Calculation Parameters</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2">
                {[
                  { label: 'Basic Pay', value: formatCurrency(basicPay) },
                  { label: 'Personal Pay', value: formatCurrency(personalPay) },
                  { label: 'Pensionable Pay', value: formatCurrency(basicPay + personalPay) },
                  { label: 'Qualifying Service', value: `${Math.min(serviceYears, 30)} Years` },
                  { label: 'Age at Retirement', value: `${Math.min(age, 60)} Years` },
                  { label: 'BPS Grade', value: `BPS-${effectiveBps}` },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-surface-variant/30 rounded-lg print:bg-gray-50 print:p-1 print:border print:border-gray-200">
                    <div className="text-xs text-on-surface-variant uppercase print:text-[10px]">{item.label}</div>
                    <div className="font-bold font-mono print:text-xs">{item.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Pension Breakdown Table */}
          <Card variant="outlined" className="overflow-hidden bg-surface print:border print:border-black print:text-xs">
            <div className="bg-primary text-on-primary p-4 print:p-2 print:bg-gray-200 print:text-black">
              <div className="flex items-center gap-2">
                <AppIcon name="receipt_long" />
                <h3 className="font-bold uppercase tracking-wide">Pension Calculation Breakdown</h3>
              </div>
              <p className="text-xs opacity-80 mt-1 print:hidden">As per KPK Finance Department Rules 2025</p>
            </div>

            <div className="divide-y divide-outline-variant print:divide-black">

              {/* Section 1: Gross Pension */}
              <div className="p-4 bg-surface-container-highest/30 print:p-1 print:bg-transparent">
                <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2 print:mb-1 print:text-black">
                  <span className="w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center text-xs print:w-4 print:h-4 print:bg-black print:text-white">1</span>
                  Gross Pension Calculation
                </h4>
                <div className="space-y-2 ml-8 print:ml-4 print:space-y-0">
                  <div className="flex justify-between py-2 print:py-0">
                    <span className="text-on-surface-variant print:text-black">Formula: (Pensionable Pay × Service × 7) / 300</span>
                    <span className="font-mono text-xs text-on-surface-variant print:text-black">
                      ({formatCurrency(basicPay + personalPay)} × {Math.min(serviceYears, 30)} × 7) / 300
                    </span>
                  </div>
                  <div className="flex justify-between py-2 bg-surface-variant/30 px-3 rounded-lg font-bold print:bg-transparent print:p-0">
                    <span>Gross Pension</span>
                    <span className="font-mono text-lg print:text-sm">{formatCurrency(result.grossPension)}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Commutation */}
              <div className="p-4 print:p-1">
                <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2 print:mb-1 print:text-black">
                  <span className="w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center text-xs print:w-4 print:h-4 print:bg-black print:text-white">2</span>
                  {result.type === 'Family' ? 'Surrender/Commutation & Family Pension Base' : 'Commutation & Net Pension'}
                </h4>
                <div className="space-y-2 ml-8 print:ml-4 print:space-y-0">
                  <div className="flex justify-between py-2 border-b border-outline-variant/30 print:py-0 print:border-none">
                    <span className="text-on-surface-variant print:text-black">
                      {result.type === 'Family' ? 'Surrender/Commutation' : 'Commutation'} ({commutationPortion}%)
                    </span>
                    <span className="font-mono text-error print:text-black">- {formatCurrency(result.commutationAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-success/10 px-3 rounded-lg font-bold text-success print:bg-transparent print:p-0 print:text-black">
                    <span>
                      {result.type === 'Family' ? 'Family Pension Base' : `Net Pension (${100 - commutationPortion}%)`}
                    </span>
                    <span className="font-mono text-lg print:text-sm">{formatCurrency(result.netPension)}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Adhoc Reliefs */}
              <div className="p-4 bg-surface-container-highest/20 print:p-1 print:bg-transparent">
                <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2 print:mb-1 print:text-black">
                  <span className="w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center text-xs print:w-4 print:h-4 print:bg-black print:text-white">3</span>
                  Adhoc Relief Allowances
                </h4>
                <div className="ml-8 overflow-x-auto print:ml-4">
                  <table className="w-full text-sm print:text-[10px]">
                    <thead>
                      <tr className="border-b-2 border-outline-variant print:border-black">
                        <th className="text-left py-2 font-bold print:py-0">Description</th>
                        <th className="text-center py-2 font-bold print:py-0">Rate</th>
                        <th className="text-right py-2 font-bold print:py-0">Amount</th>
                        <th className="text-right py-2 font-bold print:py-0">Running Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30 print:divide-gray-300">
                      <tr>
                        <td className="py-3 print:py-0">{result.type === 'Family' ? 'Family Pension Base' : 'Base Net Pension'}</td>
                        <td className="text-center print:py-0">—</td>
                        <td className="text-right font-mono font-bold print:py-0">{formatCurrency(result.netPension)}</td>
                        <td className="text-right font-mono print:py-0">{formatCurrency(result.netPension)}</td>
                      </tr>
                      <tr className="bg-surface-variant/20 print:bg-transparent">
                        <td className="py-3 print:py-0">Adhoc Relief 2022</td>
                        <td className="text-center print:py-0">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs print:bg-transparent print:text-black print:p-0">15%</span>
                        </td>
                        <td className="text-right font-mono text-success print:text-black print:py-0">+ {formatCurrency(result.adhocRelief2022)}</td>
                        <td className="text-right font-mono print:py-0">{formatCurrency(result.runningAfter2022)}</td>
                      </tr>
                      <tr>
                        <td className="py-3 print:py-0">Adhoc Relief 2023</td>
                        <td className="text-center print:py-0">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs print:bg-transparent print:text-black print:p-0">17.5%</span>
                        </td>
                        <td className="text-right font-mono text-success print:text-black print:py-0">+ {formatCurrency(result.adhocRelief2023)}</td>
                        <td className="text-right font-mono print:py-0">{formatCurrency(result.runningAfter2023)}</td>
                      </tr>
                      <tr className="bg-surface-variant/20 print:bg-transparent">
                        <td className="py-3 print:py-0">Adhoc Relief 2024</td>
                        <td className="text-center print:py-0">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs print:bg-transparent print:text-black print:p-0">15%</span>
                        </td>
                        <td className="text-right font-mono text-success print:text-black print:py-0">+ {formatCurrency(result.adhocRelief2024)}</td>
                        <td className="text-right font-mono print:py-0">{formatCurrency(result.runningAfter2024)}</td>
                      </tr>
                      <tr>
                        <td className="py-3 print:py-0">Adhoc Relief 2025</td>
                        <td className="text-center print:py-0">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs print:bg-transparent print:text-black print:p-0">7%</span>
                        </td>
                        <td className="text-right font-mono text-success print:text-black print:py-0">+ {formatCurrency(result.adhocRelief2025)}</td>
                        <td className="text-right font-mono print:py-0">{formatCurrency(result.runningAfter2025)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Medical Allowances */}
              <div className="p-4 print:p-1">
                <h4 className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-2 print:mb-1 print:text-black">
                  <span className="w-6 h-6 bg-primary text-on-primary rounded-full flex items-center justify-center text-xs print:w-4 print:h-4 print:bg-black print:text-white">4</span>
                  Medical Allowances
                </h4>
                <div className="space-y-2 ml-8 print:ml-4 print:space-y-0">
                  {/* BPS badge */}
                  <div className="mb-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-bold ${
                      result.medicalAllowanceRate === 0.20
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-primary-container text-on-primary-container'
                    }`}>
                      <AppIcon name="info" size={12} />
                      BPS-{effectiveBps} — {result.medicalAllowanceRate === 0.20 ? 'Gazetted (BPS-17+): 20%' : 'Non-Gazetted (BPS-16 & below): 25%'} rate applied
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-outline-variant/30 print:py-0 print:border-none">
                    <span className="text-on-surface-variant print:text-black">
                      Medical Allowance 2010{' '}
                      <span className="text-xs">
                        ({result.type === 'Family'
                          ? `${result.medicalAllowanceRate === 0.20 ? '20%' : '25%'} of Family Pension Base`
                          : `${result.medicalAllowanceRate === 0.20 ? '20%' : '25%'} of Net Pension`
                        })
                      </span>
                    </span>
                    <span className="font-mono text-success print:text-black">+ {formatCurrency(result.medicalAllowance2010)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-outline-variant/30 print:py-0 print:border-none">
                    <span className="text-on-surface-variant print:text-black">
                      Medical Allowance 2022 <span className="text-xs">(25% of MA 2010)</span>
                    </span>
                    <span className="font-mono text-success print:text-black">+ {formatCurrency(result.medicalAllowance2022)}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-secondary/10 px-3 rounded-lg print:bg-transparent print:p-0">
                    <span className="font-medium">Total Medical Allowances</span>
                    <span className="font-mono font-bold">{formatCurrency(result.medicalAllowance2010 + result.medicalAllowance2022)}</span>
                  </div>
                </div>
              </div>

              {/* Section 5: Monthly Payable Pension */}
              <div className="p-6 bg-primary text-on-primary print:p-2 print:bg-gray-200 print:text-black">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:gap-1 print:flex-row">
                  <div>
                    <h4 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2 print:text-sm">
                      <AppIcon name="account_balance_wallet" size={28} className="print:hidden" />
                      {result.type === 'Family' ? 'Monthly Family Pension' : 'Monthly Payable Pension'}
                    </h4>
                  </div>
                  <div className="text-4xl font-bold font-mono print:text-xl">
                    {formatCurrency(result.monthlyPayablePension)}
                  </div>
                </div>
              </div>

              {/* Section 6: Commutation Lump Sum */}
              <div className="p-4 bg-secondary-container print:p-2 print:bg-transparent print:border-t print:border-black">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:gap-1 print:flex-row">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wide text-on-secondary-container flex items-center gap-2 print:text-black print:text-xs">
                      <AppIcon name="savings" className="print:hidden" />
                      {result.type === 'Family' ? 'Gratuity / Commutation Lump Sum' : 'Commutation Lump Sum (One-Time)'}
                    </h4>
                    <p className="text-xs text-on-secondary-container/70 mt-1 print:text-black print:text-[10px]">
                      {formatCurrency(result.commutationAmount)} × 12 × {result.ageFactor} (Age Factor for {Math.min(age, 60)} years)
                    </p>
                  </div>
                  <div className="text-3xl font-bold font-mono text-on-secondary-container print:text-black print:text-lg">
                    {formatCurrency(result.commutationLumpSum)}
                  </div>
                </div>
              </div>

            </div>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2 print:mt-2">
            <Card variant="filled" className="p-6 bg-primary-container text-center print:p-2 print:border print:border-black">
              <AppIcon name="calendar_month" size={32} className="text-primary mx-auto mb-2 print:hidden" />
              <div className="text-xs font-bold text-on-primary-container/70 uppercase print:text-black print:text-[10px]">Monthly Pension</div>
              <div className="text-2xl font-bold font-mono text-primary mt-1 print:text-black print:text-sm">{formatCurrency(result.monthlyPayablePension)}</div>
            </Card>
            <Card variant="filled" className="p-6 bg-secondary-container text-center print:p-2 print:border print:border-black">
              <AppIcon name="savings" size={32} className="text-secondary mx-auto mb-2 print:hidden" />
              <div className="text-xs font-bold text-on-secondary-container/70 uppercase print:text-black print:text-[10px]">Lump Sum</div>
              <div className="text-2xl font-bold font-mono text-secondary mt-1 print:text-black print:text-sm">{formatCurrency(result.commutationLumpSum)}</div>
            </Card>
            <Card variant="filled" className="p-6 bg-tertiary-container text-center print:p-2 print:border print:border-black">
              <AppIcon name="event_repeat" size={32} className="text-tertiary mx-auto mb-2 print:hidden" />
              <div className="text-xs font-bold text-on-tertiary-container/70 uppercase print:text-black print:text-[10px]">Annual Pension</div>
              <div className="text-2xl font-bold font-mono text-tertiary mt-1 print:text-black print:text-sm">{formatCurrency(result.monthlyPayablePension * 12)}</div>
            </Card>
          </div>

          {/* Age Rule Info Box */}
          <Card variant="outlined" className="p-4 bg-tertiary-container/30 border-tertiary/30 no-print">
            <div className="flex items-start gap-3">
              <AppIcon name="info" className="text-tertiary mt-0.5" />
              <div>
                <h4 className="font-bold text-on-tertiary-container text-sm">Age Calculation Rule Applied</h4>
                <p className="text-xs text-on-tertiary-container/80 mt-1">
                  As per KPK Government rules, if the age is 6 months or more past the last birthday, it is rounded up to the next year.
                  The maximum age for pension calculation is capped at <strong>60 years</strong>.
                </p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs">
                  <span className="bg-tertiary/20 px-2 py-1 rounded">
                    <strong>Age Factor Used:</strong> {result.ageFactor}
                  </span>
                  <span className="bg-tertiary/20 px-2 py-1 rounded">
                    <strong>Effective Age:</strong> {Math.min(age, 60)} years
                  </span>
                  <span className={`px-2 py-1 rounded ${result.medicalAllowanceRate === 0.20 ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                    <strong>Medical Allowance Rate:</strong> {result.medicalAllowanceRate === 0.20 ? '20% (BPS-17+)' : '25% (BPS-16 & below)'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Footer Note */}
          <div className="text-center text-xs text-on-surface-variant/70 p-4 border border-dashed border-outline-variant rounded-lg print:border-black print:p-1 print:text-[10px] print:mt-2">
            <p className="font-bold mb-1">Disclaimer</p>
            <p>This is a computer-generated estimate based on the information provided. Actual pension may vary based on verification of service records and applicable rules at the time of retirement. Please consult the Accountant General's office for official calculations.</p>
            <p className="mt-2 font-mono">Generated: {currentDate} | System: Clerk Pro by Fazal Ali Calculator v2.0</p>
          </div>

          {/* Print Footer */}
          <div className="hidden print:block mt-8 pt-4 border-t border-black print:mt-4 print:pt-2">
            <div className="flex justify-between text-xs">
              <div>
                <p className="font-bold">Prepared By:</p>
                <p className="mt-8 border-t border-black pt-1 print:mt-4">Signature & Date</p>
              </div>
              <div>
                <p className="font-bold">Verified By:</p>
                <p className="mt-8 border-t border-black pt-1 print:mt-4">Signature & Date</p>
              </div>
              <div>
                <p className="font-bold">Approved By:</p>
                <p className="mt-8 border-t border-black pt-1 print:mt-4">Signature & Date</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Empty State */}
      {!showReport && (
        <div className="mt-8 text-center text-on-surface-variant/50 py-16 no-print">
          <div className="w-24 h-24 mx-auto mb-4 bg-surface-variant/30 rounded-full flex items-center justify-center">
            <AppIcon name="calculate" size={48} className="opacity-50" />
          </div>
          <h3 className="text-lg font-bold mb-2">Ready to Calculate</h3>
          <p className="max-w-md mx-auto">
            Search for an employee or enter the values manually, then click "Calculate Pension" to generate a detailed breakdown report.
          </p>
        </div>
      )}
    </div>
  );
};