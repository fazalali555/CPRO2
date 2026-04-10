import { describe, it, expect } from 'vitest';
import { composeLetterSchema, sanitizePayload } from '../validation.js';

describe('validation', () => {
  it('sanitizes control characters and trims', () => {
    const payload = { recipient: '  Test\u0007 ', tone: ' formal ', purpose: ' ok ', keyPoints: [' A '] };
    const clean = sanitizePayload(payload);
    expect(clean.recipient).toBe('Test');
    expect(clean.tone).toBe('formal');
    expect(clean.keyPoints[0]).toBe('A');
  });

  it('sanitizes nested objects', () => {
    const payload = { length: { maxChars: ' 300 ' }, recipient: 'AA', tone: 'bb', purpose: 'valid', keyPoints: ['cc'] };
    const clean = sanitizePayload(payload);
    expect(clean.length.maxChars).toBe('300');
  });

  it('accepts valid payload', () => {
    const parsed = composeLetterSchema.safeParse({
      recipient: 'DEO',
      tone: 'formal',
      purpose: 'Submit report',
      keyPoints: ['One']
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid payload', () => {
    const parsed = composeLetterSchema.safeParse({
      recipient: '',
      tone: '',
      purpose: '',
      keyPoints: []
    });
    expect(parsed.success).toBe(false);
  });
});
