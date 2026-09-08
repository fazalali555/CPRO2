import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

const parseSafetySettings = () => {
  const envVal = process.env.GEMINI_SAFETY_SETTINGS;
  if (!envVal) return DEFAULT_SAFETY_SETTINGS;
  try {
    const parsed = JSON.parse(envVal);
    return Array.isArray(parsed) ? parsed : DEFAULT_SAFETY_SETTINGS;
  } catch {
    return DEFAULT_SAFETY_SETTINGS;
  }
};

/**
 * Parse a comma-separated origin list into a trimmed, de-duplicated array.
 * @param {string|undefined} raw
 * @param {string[]} fallback
 * @returns {string[]}
 */
const parseOrigins = (raw, fallback) => {
  if (!raw) return fallback;
  const list = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length ? [...new Set(list)] : fallback;
};

/**
 * Read a positive integer from the environment, falling back when unset or invalid.
 * @param {string|undefined} raw
 * @param {number} fallback
 * @returns {number}
 */
const parsePositiveInt = (raw, fallback) => {
  const value = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const port = parsePositiveInt(process.env.PORT, 3000);
const nodeEnv = process.env.NODE_ENV || 'development';

export const config = {
  port,
  nodeEnv,
  isProduction: nodeEnv === 'production',

  app: {
    name: 'Clerk Pro by Fazal Ali',
    version: '0.0.1',
  },

  /**
   * Exact-match CORS allow list. Set `CORS_ORIGIN` to a comma-separated list in
   * production; the permissive localhost defaults exist for local dev only.
   */
  cors: {
    origins: parseOrigins(process.env.CORS_ORIGIN, [
      'http://localhost:3003',
      'http://localhost:5173',
    ]),
    credentials: true,
  },

  security: {
    rateLimitWindowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    rateLimitMaxRequests: parsePositiveInt(process.env.RATE_LIMIT_MAX, 100),
  },

  /** Bounds for the in-memory async job store (see jobStore.js). */
  jobs: {
    maxJobs: parsePositiveInt(process.env.JOB_STORE_MAX_JOBS, 500),
    ttlMs: parsePositiveInt(process.env.JOB_STORE_TTL_MS, 60 * 60 * 1000),
  },

  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiBaseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  geminiSafetySettings: parseSafetySettings(),
  geminiTimeoutMs: parsePositiveInt(process.env.GEMINI_TIMEOUT_MS, 30000),

  auditLogPath: process.env.AUDIT_LOG_PATH || './logs/audit.log',
};
