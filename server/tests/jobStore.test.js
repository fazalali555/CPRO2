import { describe, it, expect } from 'vitest';
import { createJob, updateJob, getJob } from '../jobStore.js';

describe('jobStore', () => {
  it('creates and updates jobs', () => {
    const id = createJob({ test: true });
    const job = getJob(id);
    expect(job.status).toBe('queued');
    const updated = updateJob(id, { status: 'completed' });
    expect(updated.status).toBe('completed');
  });

  it('returns null for missing job update', () => {
    const updated = updateJob('missing', { status: 'failed' });
    expect(updated).toBeNull();
  });
});
