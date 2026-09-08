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

  it('does not mutate the input payload', () => {
    const payload = { recipient: '  A  ', length: { maxChars: ' 300 ' }, keyPoints: [' x '] };
    sanitizePayload(payload);
    expect(payload.recipient).toBe('  A  ');
    expect(payload.length.maxChars).toBe(' 300 ');
    expect(payload.keyPoints[0]).toBe(' x ');
  });

  it('returns an empty object for non-object input', () => {
    expect(sanitizePayload(null)).toEqual({});
    expect(sanitizePayload('nope')).toEqual({});
    expect(sanitizePayload(undefined)).toEqual({});
  });

  it('accepts a public https webhook', () => {
    const parsed = composeLetterSchema.safeParse({
      recipient: 'DEO', tone: 'formal', purpose: 'Submit report', keyPoints: ['One'],
      webhookUrl: 'https://example.com/hook'
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects SSRF-prone webhooks at the schema level', () => {
    const base = { recipient: 'DEO', tone: 'formal', purpose: 'Submit report', keyPoints: ['One'] };
    for (const webhookUrl of [
      'http://169.254.169.254/latest/meta-data/',
      'https://127.0.0.1/hook',
      'https://localhost/hook',
      'http://10.0.0.5/hook',
      'https://user:pass@example.com/hook'
    ]) {
      expect(composeLetterSchema.safeParse({ ...base, webhookUrl }).success).toBe(false);
    }
  });
});
