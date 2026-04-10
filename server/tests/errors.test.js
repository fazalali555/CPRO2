import { describe, it, expect } from 'vitest';
import { toErrorResponse } from '../errors.js';

describe('toErrorResponse', () => {
  it('handles quota exceeded', () => {
    const res = toErrorResponse({ message: 'Quota exceeded' });
    expect(res.status).toBe(429);
    expect(res.code).toBe('QUOTA_EXCEEDED');
  });

  it('handles content policy', () => {
    const res = toErrorResponse({ message: 'safety policy violation' });
    expect(res.status).toBe(400);
    expect(res.code).toBe('CONTENT_BLOCKED');
  });

  it('handles network error', () => {
    const res = toErrorResponse({ message: 'network error while fetch' });
    expect(res.status).toBe(502);
    expect(res.code).toBe('NETWORK_ERROR');
  });

  it('handles default', () => {
    const res = toErrorResponse({ message: 'unknown' });
    expect(res.status).toBe(500);
    expect(res.code).toBe('SERVER_ERROR');
  });
});
