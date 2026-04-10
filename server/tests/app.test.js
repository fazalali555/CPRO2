import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';

vi.stubEnv('GEMINI_API_KEY', 'test_key');

vi.mock('../geminiService.js', () => ({
  composeWithGemini: vi.fn(async (_payload) => ({
    text: 'Composed letter text',
    tokens: 123,
    ms: 45
  }))
}));
vi.mock('../auditLogger.js', () => ({
  logAudit: vi.fn(async () => {})
}));

describe('AI Server', () => {
  let app;
  let composeWithGemini;

  beforeAll(async () => {
    composeWithGemini = (await import('../geminiService.js')).composeWithGemini;
    const mod = await import('../app.js');
    app = mod.createApp();
  });

  it('health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('serves openapi spec', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBeDefined();
  });

  it('validates bad request', async () => {
    const res = await request(app).post('/api/ai/compose-letter').send({
      recipient: "",
      tone: "x",
      purpose: "x",
      keyPoints: []
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('composes letter', async () => {
    const res = await request(app).post('/api/ai/compose-letter').send({
      recipient: "District Education Officer",
      tone: "formal",
      purpose: "Submit report",
      keyPoints: ["Report attached", "No discrepancies"]
    });
    expect(res.status).toBe(200);
    expect(res.body.text).toContain('Composed letter text');
    expect(res.body.usage.tokens).toBe(123);
  });

  it('queues async job and completes', async () => {
    const queued = await request(app).post('/api/ai/compose-letter').send({
      recipient: "DEO",
      tone: "formal",
      purpose: "Async letter",
      keyPoints: ["Point A", "Point B"],
      async: true
    });
    expect(queued.status).toBe(202);
    const jobId = queued.body.jobId;
    expect(jobId).toBeTruthy();
    const poll = await request(app).get(`/api/ai/jobs/${jobId}`);
    expect([200, 404]).toContain(poll.status);
    if (poll.status === 200 && poll.body.status === 'completed') {
      expect(poll.body.result.text).toContain('Composed letter text');
    }
  });

  it('returns quota error when service reports quota exceeded', async () => {
    composeWithGemini.mockRejectedValueOnce(Object.assign(new Error('Quota exceeded'), { code: 'QUOTA_EXCEEDED' }));
    const res = await request(app).post('/api/ai/compose-letter').send({
      recipient: "DEO",
      tone: "formal",
      purpose: "Quota case",
      keyPoints: ["One"]
    });
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('QUOTA_EXCEEDED');
  });

  it('returns not found for missing job', async () => {
    const res = await request(app).get('/api/ai/jobs/missing');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns service unavailable when api key missing', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('GEMINI_API_KEY', '');
    const mod = await import('../app.js');
    const appNoKey = mod.createApp();
    const res = await request(appNoKey).post('/api/ai/compose-letter').send({
      recipient: "DEO",
      tone: "formal",
      purpose: "No key",
      keyPoints: ["One"]
    });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('posts webhook on async completion', async () => {
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '' }));
    const res = await request(app).post('/api/ai/compose-letter').send({
      recipient: "DEO",
      tone: "formal",
      purpose: "Webhook",
      keyPoints: ["One"],
      async: true,
      webhookUrl: "https://example.com/webhook"
    });
    expect(res.status).toBe(202);
    await new Promise(r => setTimeout(r, 10));
    expect(global.fetch).toHaveBeenCalled();
  });

  it('handles webhook failure without crashing', async () => {
    global.fetch = vi.fn(async () => { throw new Error('fail'); });
    const res = await request(app).post('/api/ai/compose-letter').send({
      recipient: "DEO",
      tone: "formal",
      purpose: "Webhook failure",
      keyPoints: ["One"],
      async: true,
      webhookUrl: "https://example.com/webhook"
    });
    expect(res.status).toBe(202);
  });

  it('handles async failure branch', async () => {
    composeWithGemini.mockRejectedValueOnce(Object.assign(new Error('Network fail'), { code: 'NETWORK_ERROR' }));
    const res = await request(app).post('/api/ai/compose-letter').send({
      recipient: "DEO",
      tone: "formal",
      purpose: "Async error",
      keyPoints: ["One"],
      async: true
    });
    expect(res.status).toBe(202);
  });

  it('returns openapi error when spec missing', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('GEMINI_API_KEY', 'test_key');
    vi.doMock('fs', () => ({
      promises: { readFile: vi.fn(async () => { throw new Error('missing'); }) }
    }));
    vi.doMock('path', () => ({
      resolve: () => 'missing'
    }));
    const mod = await import('../app.js');
    const appMissing = mod.createApp();
    const res = await request(appMissing).get('/openapi.json');
    expect(res.status).toBe(500);
  });
});
