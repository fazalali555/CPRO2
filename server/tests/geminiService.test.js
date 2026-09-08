import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('GEMINI_API_KEY', 'test_key');
vi.stubEnv('GEMINI_API_BASE', 'https://example.com');

const makeResponse = (status, payload, text) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => payload,
  text: async () => text || ''
});

describe('composeWithGemini', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns text and token usage', async () => {
    global.fetch = vi.fn(async () => makeResponse(200, {
      candidates: [{ content: { parts: [{ text: 'Hello' }] } }],
      usageMetadata: { totalTokenCount: 42 }
    }));
    const { composeWithGemini } = await import('../geminiService.js');
    const result = await composeWithGemini({
      recipient: 'A',
      tone: 'formal',
      purpose: 'test',
      keyPoints: ['k1'],
      length: { minWords: 50, maxWords: 150, maxChars: 800 },
      referenceNo: 'REF-1',
      language: 'English',
      senderName: 'Clerk',
      senderTitle: 'Office'
    });
    expect(result.text).toContain('Hello');
    expect(result.tokens).toBe(42);
  });

  it('retries on network error and succeeds', async () => {
    const responses = [
      makeResponse(500, {}, ''),
      makeResponse(500, {}, ''),
      makeResponse(200, { candidates: [{ content: { parts: [{ text: 'Ok' }] } }], usageMetadata: { totalTokenCount: 1 } }, '')
    ];
    global.fetch = vi.fn(async () => responses.shift());
    const { composeWithGemini } = await import('../geminiService.js');
    const result = await composeWithGemini({
      recipient: 'A',
      tone: 'formal',
      purpose: 'test',
      keyPoints: ['k1']
    });
    expect(result.text).toContain('Ok');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('throws quota error', async () => {
    global.fetch = vi.fn(async () => makeResponse(429, {}, 'quota'));
    const { composeWithGemini } = await import('../geminiService.js');
    await expect(composeWithGemini({
      recipient: 'A',
      tone: 'formal',
      purpose: 'test',
      keyPoints: ['k1']
    })).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
  });

  it('throws content policy error', async () => {
    global.fetch = vi.fn(async () => makeResponse(400, {}, 'safety'));
    const { composeWithGemini } = await import('../geminiService.js');
    await expect(composeWithGemini({
      recipient: 'A',
      tone: 'formal',
      purpose: 'test',
      keyPoints: ['k1']
    })).rejects.toMatchObject({ code: 'CONTENT_BLOCKED' });
  });

  it('sends the API key as a header and never in the URL', async () => {
    const seen = [];
    global.fetch = vi.fn(async (url, init) => {
      seen.push({ url, headers: init?.headers });
      return makeResponse(200, { candidates: [{ content: { parts: [{ text: 'Hi' }] } }] });
    });
    const { composeWithGemini } = await import('../geminiService.js');
    await composeWithGemini({ recipient: 'A', tone: 'formal', purpose: 'test', keyPoints: ['k1'] });

    expect(seen).toHaveLength(1);
    expect(seen[0].url).not.toContain('key=');
    expect(seen[0].url).not.toContain('test_key');
    expect(seen[0].headers['x-goog-api-key']).toBe('test_key');
  });

  it('bounds the request with an AbortSignal timeout', async () => {
    const seen = [];
    global.fetch = vi.fn(async (_url, init) => {
      seen.push(init?.signal);
      return makeResponse(200, { candidates: [{ content: { parts: [{ text: 'Hi' }] } }] });
    });
    const { composeWithGemini } = await import('../geminiService.js');
    await composeWithGemini({ recipient: 'A', tone: 'formal', purpose: 'test', keyPoints: ['k1'] });

    expect(seen[0]).toBeInstanceOf(AbortSignal);
  });

  it('does not retry on auth failure', async () => {
    global.fetch = vi.fn(async () => makeResponse(401, {}, 'unauthorized'));
    const { composeWithGemini } = await import('../geminiService.js');
    await expect(composeWithGemini({
      recipient: 'A', tone: 'formal', purpose: 'test', keyPoints: ['k1']
    })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
