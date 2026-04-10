import { describe, it, expect, vi } from 'vitest';

describe('config', () => {
  it('uses fallback safety settings on invalid json', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('GEMINI_SAFETY_SETTINGS', 'bad');
    const { config } = await import('../config.js');
    expect(Array.isArray(config.geminiSafetySettings)).toBe(true);
    expect(config.geminiSafetySettings.length).toBe(4);
  });

  it('parses valid safety settings', async () => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('GEMINI_SAFETY_SETTINGS', '[{"category":"X","threshold":"BLOCK_LOW"}]');
    const { config } = await import('../config.js');
    expect(config.geminiSafetySettings.length).toBe(1);
    expect(config.geminiSafetySettings[0].category).toBe('X');
  });
});
