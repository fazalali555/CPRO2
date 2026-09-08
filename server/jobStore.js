import { v4 as uuidv4 } from 'uuid';
import { config } from './config.js';

/**
 * In-memory async job store.
 *
 * The store is bounded on two axes so a client that submits many `async: true`
 * requests cannot exhaust process memory:
 *   - at most `maxJobs` entries (oldest evicted first), and
 *   - entries older than `jobTtlMs` are dropped on the next sweep.
 *
 * This is deliberately process-local: it is correct for a single instance, and
 * swapping in Redis/Postgres only requires re-implementing the four functions
 * below.
 */

/** @type {Map<string, {id: string, status: string, createdAt: string, updatedAt?: string, payload?: unknown, result?: unknown, error?: unknown}>} */
const jobs = new Map();

/** Insertion order == creation order for a Map, so the first key is the oldest. */
const evictOldest = () => {
  const oldestKey = jobs.keys().next().value;
  if (oldestKey !== undefined) jobs.delete(oldestKey);
};

/**
 * Drop entries older than the configured TTL and enforce the size cap.
 * Exported so it can be driven deterministically from tests and, if desired,
 * from a periodic timer in a long-running process.
 *
 * @param {number} [now] epoch millis, injectable for tests
 * @returns {number} how many entries were removed
 */
export const sweepJobs = (now = Date.now()) => {
  const ttl = config.jobs.ttlMs;
  let removed = 0;
  for (const [id, job] of jobs) {
    const created = Date.parse(job.createdAt);
    if (Number.isFinite(created) && now - created > ttl) {
      jobs.delete(id);
      removed += 1;
    }
  }
  while (jobs.size > config.jobs.maxJobs) {
    evictOldest();
    removed += 1;
  }
  return removed;
};

/**
 * Queue a new job.
 * @param {unknown} payload
 * @returns {string} job id
 */
export const createJob = (payload) => {
  const id = uuidv4();
  jobs.set(id, { id, status: 'queued', payload, createdAt: new Date().toISOString() });
  sweepJobs();
  return id;
};

/**
 * Patch an existing job.
 * @param {string} id
 * @param {Record<string, unknown>} patch
 * @returns {object|null} the updated job, or null when the id is unknown
 */
export const updateJob = (id, patch) => {
  const existing = jobs.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  return updated;
};

/**
 * Look up a job.
 * @param {string} id
 * @returns {object|undefined}
 */
export const getJob = (id) => jobs.get(id);

/** @returns {number} current entry count */
export const jobCount = () => jobs.size;

/** Test/maintenance helper — clears all state. */
export const clearJobs = () => jobs.clear();
