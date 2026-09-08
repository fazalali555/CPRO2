import { describe, it, expect, vi } from 'vitest';

describe('config', () => {
  it('uses fallback safety settings on invalid json', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('GEMINI_SAFETY_SETTINGS', 'bad');
    const { config } = await import('../config.js?t=1');
    expect(Array.isArray(config.geminiSafetySettings)).toBe(true);
    expect(config.geminiSafetySettings.length).toBe(4);
  });

  it('parses valid safety settings', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('GEMINI_SAFETY_SETTINGS', '[{"category":"X","threshold":"BLOCK_LOW"}]');
    const { config } = await import('../config.js?t=2');
    expect(config.geminiSafetySettings.length).toBe(1);
    expect(config.geminiSafetySettings[0].category).toBe('X');
  });

  it('falls back to defaults when GEMINI_SAFETY_SETTINGS is valid JSON but not an array', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('GEMINI_SAFETY_SETTINGS', '{"category":"X"}');
    const { config } = await import('../config.js?t=3');
    expect(config.geminiSafetySettings.length).toBe(4);
  });

  it('parses a comma-separated CORS allow list, trimmed and de-duplicated', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('CORS_ORIGIN', ' https://a.example , https://b.example ,https://a.example ');
    const { config } = await import('../config.js?t=4');
    expect(config.cors.origins).toEqual(['https://a.example', 'https://b.example']);
  });

  it('falls back to localhost origins when CORS_ORIGIN is blank', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('CORS_ORIGIN', '   ');
    const { config } = await import('../config.js?t=5');
    expect(config.cors.origins).toContain('http://localhost:3003');
  });

  it('rejects non-positive or malformed numeric overrides', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('PORT', 'not-a-number');
    vi.stubEnv('JOB_STORE_MAX_JOBS', '-5');
    vi.stubEnv('RATE_LIMIT_MAX', '0');
    const { config } = await import('../config.js?t=6');
    expect(config.port).toBe(3000);
    expect(config.jobs.maxJobs).toBe(500);
    expect(config.security.rateLimitMaxRequests).toBe(100);
  });

  it('accepts valid numeric overrides and exposes isProduction', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('PORT', '4242');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JOB_STORE_TTL_MS', '1000');
    const { config } = await import('../config.js?t=7');
    expect(config.port).toBe(4242);
    expect(config.isProduction).toBe(true);
    expect(config.jobs.ttlMs).toBe(1000);
  });
});
