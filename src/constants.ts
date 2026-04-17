// Age Factors from KPK Pension Calculator 2026
// Key = Age Next Birthday
// Table ends at 60 — maximum retirement age for pension commutation
export const AGE_FACTORS: Record<number, number> = {
  20: 40.5043,
  21: 39.7341,
  22: 38.9653,
  23: 38.1974,
  24: 37.4307,
  25: 36.6651,
  26: 35.9006,
  27: 35.1372,
  28: 34.375,
  29: 33.6143,
  30: 32.8071,
  31: 32.0974,
  32: 31.3412,
  33: 30.5869,
  34: 29.8343,
  35: 28.3362, // ← FIXED (was 29.0841, which was wrong)
  36: 28.3362,
  37: 27.5908,
  38: 26.8482,
  39: 26.1009,
  40: 25.3728,
  41: 24.6406,
  42: 23.9126,
  43: 23.184,
  44: 22.4713,
  45: 21.7592,
  46: 21.0538,
  47: 20.3555,
  48: 19.6653,
  49: 18.9841,
  50: 18.3129,
  51: 17.6526,
  52: 17.005,
  53: 16.371,
  54: 15.7517,
  55: 15.1478,
  56: 14.5602,
  57: 13.9888,
  58: 13.434,
  59: 12.8953,
  60: 12.3719, // ← Maximum — table ends here
};

export const RBDC_RATES = [
  { min: 1,  max: 4,  amount: 500000  },
  { min: 5,  max: 10, amount: 750000  },
  { min: 11, max: 16, amount: 1000000 },
  { min: 17, max: 22, amount: 1500000 },
];

export const BENEVOLENT_RATES = {
  marriage:  100000,
  education:  50000,
  medical:   200000,
  death:     500000,
};

export const EEF_RATES = {
  matric:      10000,
  inter:       15000,
  bachelor:    25000,
  master:      35000,
  mbbs:       100000,
  engineering: 75000,
};

export const MEDICAL_ALLOWANCE = 1500; // Legacy constant — new calc uses percentage