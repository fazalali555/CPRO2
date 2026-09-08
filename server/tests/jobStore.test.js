import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createJob, updateJob, getJob, sweepJobs, jobCount, clearJobs } from '../jobStore.js';

describe('jobStore', () => {
  beforeEach(() => {
    clearJobs();
  });

  it('creates and updates jobs', () => {
    const id = createJob({ test: true });
    const job = getJob(id);
    expect(job.status).toBe('queued');
    const updated = updateJob(id, { status: 'completed' });
    expect(updated.status).toBe('completed');
  });

  it('returns null for missing job update', () => {
    expect(updateJob('missing', { status: 'failed' })).toBeNull();
  });

  it('returns undefined for a missing job lookup', () => {
    expect(getJob('missing')).toBeUndefined();
  });
});

describe('jobStore bounds', () => {
  it('evicts entries past the TTL', () => {
    clearJobs();
    const id = createJob({ a: 1 });
    expect(jobCount()).toBe(1);

    const oneHourPlus = Date.now() + 60 * 60 * 1000 + 1000;
    const removed = sweepJobs(oneHourPlus);

    expect(removed).toBe(1);
    expect(jobCount()).toBe(0);
    expect(getJob(id)).toBeUndefined();
  });

  it('keeps entries inside the TTL', () => {
    clearJobs();
    createJob({ a: 1 });
    expect(sweepJobs(Date.now() + 1000)).toBe(0);
    expect(jobCount()).toBe(1);
  });

  it('enforces the size cap, evicting oldest first', async () => {
    vi.resetModules();
    vi.stubEnv('JOB_STORE_MAX_JOBS', '3');
    const bounded = await import('../jobStore.js?bounded=1');
    bounded.clearJobs();

    const ids = [bounded.createJob({ i: 0 }), bounded.createJob({ i: 1 }), bounded.createJob({ i: 2 }), bounded.createJob({ i: 3 })];

    expect(bounded.jobCount()).toBe(3);
    expect(bounded.getJob(ids[0])).toBeUndefined();
    expect(bounded.getJob(ids[3])).toBeDefined();
    vi.unstubAllEnvs();
  });
});
