import { AGE_FACTORS } from '../constants';

export interface PensionParams {
  basicPay: number;
  personalPay: number;
  qualifyingServiceYears: number;
  commutationPortionPercent?: number;
  ageAtRetirement?: number;
  bps?: number; // BPS grade — affects medical allowance rate
}

export interface PensionResult {
  pensionablePay: number;
  qualifyingServiceYears: number;
  commutationPortion: number;
  grossPension: number;
  commutationAmount: number;
  netPension: number;
  ageAtRetirement: number;
  ageFactor: number;
  commutationLumpSum: number;
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
  medicalAllowanceRate: number; // expose the rate used (0.20 or 0.25)
}

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

/**
 * Resolve Age Factor for Commutation Calculation
 *
 * Government Rule:
 * - Use age next birthday for commutation factor
 * - The 6-month rounding rule should be applied BEFORE calling this function
 *   (i.e., if 59 years 6+ months, pass 60 as age)
 * - Age is hard-capped at 60 years (age next birthday = 61)
 *   so anyone aged 61+ still gets the factor for age 61 (i.e. age 60 next birthday)
 *
 * @param age - The age at retirement (should already have 6-month rule applied)
 * @returns Object with capped age and corresponding factor
 */
export const resolveAgeFactor = (age?: number): { age: number; factor: number } => {
  const inputAge = age ?? 60;
  const roundedAge = Math.floor(inputAge);
  const ageNextBirthday = roundedAge + 1;

  const factorAges = Object.keys(AGE_FACTORS).map(Number);
  const minAge = Math.min(...factorAges); // 20
  const maxAge = Math.max(...factorAges); // 60 — now correctly the table max

  // Cap at table max (60) — anyone older than 59 gets the factor for age 60
  const cappedAge = clamp(ageNextBirthday, minAge, maxAge);
  const factor = AGE_FACTORS[cappedAge] ?? AGE_FACTORS[maxAge];

  return { age: cappedAge, factor };
};

export const calculatePension = (params: PensionParams): PensionResult => {
  if (
    params.basicPay == null ||
    params.personalPay == null ||
    params.qualifyingServiceYears == null
  ) {
    throw new Error('Missing required parameters');
  }
  if (params.basicPay < 0 || params.personalPay < 0) {
    throw new Error('Pay values cannot be negative');
  }
  if (params.qualifyingServiceYears < 0) {
    throw new Error('Qualifying service cannot be negative');
  }

  const commPct = params.commutationPortionPercent ?? 35;
  if (!isFinite(commPct) || commPct < 0 || commPct > 100) {
    throw new Error('Invalid commutation portion percentage');
  }

  const pensionablePay = (params.basicPay || 0) + (params.personalPay || 0);
  const qService = clamp(Math.floor(params.qualifyingServiceYears), 0, 30);
  const grossPension = (pensionablePay * qService * 7) / 300;
  const commutationPortion = commPct / 100;
  const commutationAmount = grossPension * commutationPortion;
  const netPension = grossPension * (1 - commutationPortion);

  // Age is capped at 60 inside resolveAgeFactor
  const { age: resolvedAge, factor: ageFactor } = resolveAgeFactor(params.ageAtRetirement);
  const commutationLumpSum = commutationAmount * 12 * ageFactor;

  const round2 = (num: number) => Math.round(num * 100) / 100;

  // ── Adhoc Reliefs (Compounding) ─────────────────────────────────────────
  // 2022: 15% of Net Pension
  const adhocRelief2022 = round2(netPension * 0.15);
  const runningAfter2022 = round2(netPension + adhocRelief2022);

  // 2023: 17.5% of Running Pension (after 2022)
  const adhocRelief2023 = round2(runningAfter2022 * 0.175);
  const runningAfter2023 = round2(runningAfter2022 + adhocRelief2023);

  // 2024: 15% of Running Pension (after 2023)
  const adhocRelief2024 = round2(runningAfter2023 * 0.15);
  const runningAfter2024 = round2(runningAfter2023 + adhocRelief2024);

  // 2025: 7% of Running Pension (after 2024)
  const adhocRelief2025 = round2(runningAfter2024 * 0.07);
  const runningAfter2025 = round2(runningAfter2024 + adhocRelief2025);

  // ── Medical Allowance ────────────────────────────────────────────────────
  // BPS 17 and above → 20% of Net Pension (2010 order for gazetted officers)
  // BPS 16 and below → 25% of Net Pension (2010 order for non-gazetted)
  const bps = params.bps ?? 0;
  const medicalAllowanceRate = bps >= 17 ? 0.20 : 0.25;
  const medicalAllowance2010 = round2(netPension * medicalAllowanceRate);

  // 25% increase on Medical Allowance (2022 notification)
  const medicalAllowance2022 = round2(medicalAllowance2010 * 0.25);

  const totalMedicalAllowance = medicalAllowance2010 + medicalAllowance2022;

  // ── Monthly Payable Pension ───────────────────────────────────────────────
  const monthlyPayablePension = runningAfter2025 + totalMedicalAllowance;

  return {
    pensionablePay,
    qualifyingServiceYears: qService,
    commutationPortion,
    grossPension,
    commutationAmount,
    netPension,
    ageAtRetirement: resolvedAge,
    ageFactor,
    commutationLumpSum,
    adhocRelief2022,
    runningAfter2022,
    adhocRelief2023,
    runningAfter2023,
    adhocRelief2024,
    runningAfter2024,
    adhocRelief2025,
    runningAfter2025,
    medicalAllowance2010,
    medicalAllowance2022,
    monthlyPayablePension,
    medicalAllowanceRate,
  };
};

export const calculatePensionSafe = (
  params: PensionParams
): { ok: true; value: PensionResult } | { ok: false; error: string } => {
  try {
    const value = calculatePension(params);
    return { ok: true, value };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown error' };
  }
};

export interface FamilyPensionResult {
  lastPay: number;
  grossPension: number;
  surrenderedPortion: number;
  commutedPortion: number;
  commutedAmount: number;
  netPension: number;
  netFamilyPension: number;
  increases: { year: number; percent: number; amount: number; runningTotal: number }[];
  medicalAllowance2010: number;
  medicalAllowanceIncrease: number;
  ageAtRetirement: number;
  ageFactor: number;
  commutationLumpSum: number;
  familyPensionBase: number;
}

const FAMILY_PENSION_INCREASES = [
  { year: 2010, percent: 15 },
  { year: 2011, percent: 15 },
  { year: 2012, percent: 20 },
  { year: 2013, percent: 15 },
  { year: 2014, percent: 10 },
  { year: 2015, percent: 10 },
  { year: 2016, percent: 10 },
  { year: 2017, percent: 10 },
  { year: 2018, percent: 10 },
  { year: 2019, percent: 10 },
  { year: 2021, percent: 10 }, // 2020 skipped
  { year: 2022, percent: 15 },
  { year: 2023, percent: 17.5 },
  { year: 2024, percent: 15 },
  { year: 2025, percent: 7 },
];

export const calculateFamilyPension = (
  status: string,
  lastBasicPay: number,
  personalPay: number,
  qualifyingService: number,
  ageAtRetirement: number = 60,
  commutationPercent: number = 35,
  bps: number = 0 // Add bps for medical allowance rate
): FamilyPensionResult | null => {
  const isDeathInService = status === 'Death in Service';
  const isDeathAfterRetirement = status === 'Death after Retirement';

  if (!isDeathInService && !isDeathAfterRetirement) return null;

  const lastPay = (lastBasicPay || 0) + (personalPay || 0);
  const qService = clamp(Math.floor(qualifyingService), 0, 30);
  const grossPension = (lastPay * qService * 7) / 300;

  const commutedAmount = grossPension * (commutationPercent / 100);
  const netPension = grossPension - commutedAmount;

  // Age is capped at 60 inside resolveAgeFactor
  const { age: resolvedAge, factor: ageFactor } = resolveAgeFactor(ageAtRetirement);
  const commutationLumpSum = commutedAmount * 12 * ageFactor;

  let familyPensionBase = 0;
  if (isDeathAfterRetirement) {
    familyPensionBase = netPension * 0.75;
  } else {
    familyPensionBase = grossPension * 0.50;
  }

  const applicableIncreases = FAMILY_PENSION_INCREASES.filter((inc) => inc.year >= 2022);

  const round2 = (num: number) => Math.round(num * 100) / 100;

  let runningTotal = familyPensionBase;
  const increases = applicableIncreases.map((inc) => {
    const amount = round2(runningTotal * (inc.percent / 100));
    runningTotal = round2(runningTotal + amount);
    return { year: inc.year, percent: inc.percent, amount, runningTotal };
  });

  // Medical Allowance — same BPS rule as calculatePension
  const medicalAllowanceRate = bps >= 17 ? 0.20 : 0.25;
  const maBase = round2(familyPensionBase * medicalAllowanceRate);
  const maIncrease = round2(maBase * 0.25);
  const totalMedical = maBase + maIncrease;

  const netFamilyPension = runningTotal + totalMedical;

  return {
    lastPay,
    grossPension,
    surrenderedPortion: commutedAmount,
    commutedPortion: commutationPercent,
    commutedAmount,
    netPension,
    netFamilyPension,
    increases,
    medicalAllowance2010: maBase,
    medicalAllowanceIncrease: maIncrease,
    ageAtRetirement: resolvedAge,
    ageFactor,
    commutationLumpSum,
    familyPensionBase,
  };
};