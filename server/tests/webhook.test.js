import { describe, it, expect } from 'vitest';
import { isSafeWebhookUrl } from '../webhook.js';

describe('isSafeWebhookUrl', () => {
  it('accepts a plain public https URL', () => {
    const result = isSafeWebhookUrl('https://example.com/webhook');
    expect(result.ok).toBe(true);
    expect(result.url).toBe('https://example.com/webhook');
  });

  it('rejects non-https schemes', () => {
    for (const url of ['http://example.com/hook', 'file:///etc/passwd', 'ftp://example.com']) {
      expect(isSafeWebhookUrl(url)).toMatchObject({ ok: false, reason: 'DISALLOWED_PROTOCOL' });
    }
  });

  it('rejects the cloud metadata endpoint', () => {
    expect(isSafeWebhookUrl('https://169.254.169.254/latest/meta-data/')).toMatchObject({
      ok: false,
      reason: 'BLOCKED_ADDRESS',
    });
  });

  it('rejects loopback and private address ranges', () => {
    const blocked = [
      'https://127.0.0.1/hook',
      'https://127.5.6.7/hook',
      'https://10.1.2.3/hook',
      'https://172.16.0.1/hook',
      'https://172.31.255.255/hook',
      'https://192.168.1.1/hook',
      'https://0.0.0.0/hook',
    ];
    for (const url of blocked) {
      expect(isSafeWebhookUrl(url)).toMatchObject({ ok: false, reason: 'BLOCKED_ADDRESS' });
    }
  });

  it('allows public address ranges', () => {
    for (const url of ['https://8.8.8.8/hook', 'https://172.32.0.1/hook', 'https://11.0.0.1/hook']) {
      expect(isSafeWebhookUrl(url)).toMatchObject({ ok: true });
    }
  });

  it('rejects loopback hostnames', () => {
    expect(isSafeWebhookUrl('https://localhost/hook')).toMatchObject({
      ok: false,
      reason: 'LOOPBACK_HOST',
    });
    expect(isSafeWebhookUrl('https://app.localhost/hook')).toMatchObject({
      ok: false,
      reason: 'LOOPBACK_HOST',
    });
  });

  it('rejects credentials embedded in the URL', () => {
    expect(isSafeWebhookUrl('https://user:pass@example.com/hook')).toMatchObject({
      ok: false,
      reason: 'CREDENTIALS_IN_URL',
    });
  });

  it('rejects blocked IPv6 literals', () => {
    for (const url of ['https://[::1]/hook', 'https://[::]/hook', 'https://[fe80::1]/hook']) {
      expect(isSafeWebhookUrl(url)).toMatchObject({ ok: false, reason: 'BLOCKED_ADDRESS' });
    }
  });

  it('rejects IPv4-mapped loopback IPv6 (both spellings)', () => {
    // `new URL()` normalises the dotted form to ::ffff:7f00:1, so cover both.
    for (const url of ['https://[::ffff:127.0.0.1]/hook', 'https://[::ffff:7f00:1]/hook']) {
      expect(isSafeWebhookUrl(url)).toMatchObject({
        ok: false,
        reason: 'BLOCKED_ADDRESS',
      });
    }
  });

  it('rejects IPv4-mapped private IPv6', () => {
    expect(isSafeWebhookUrl('https://[::ffff:10.0.0.5]/hook')).toMatchObject({
      ok: false,
      reason: 'BLOCKED_ADDRESS',
    });
  });

  it('allows IPv4-mapped public IPv6', () => {
    expect(isSafeWebhookUrl('https://[::ffff:8.8.8.8]/hook')).toMatchObject({ ok: true });
  });

  it('rejects malformed and empty input', () => {
    expect(isSafeWebhookUrl('not a url')).toMatchObject({ ok: false, reason: 'MALFORMED_URL' });
    expect(isSafeWebhookUrl('')).toMatchObject({ ok: false, reason: 'MISSING_URL' });
    expect(isSafeWebhookUrl(undefined)).toMatchObject({ ok: false, reason: 'MISSING_URL' });
    expect(isSafeWebhookUrl(null)).toMatchObject({ ok: false, reason: 'MISSING_URL' });
  });
});
