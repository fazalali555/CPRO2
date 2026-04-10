import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.stubEnv('AI_AUDIT_LOG_PATH', 'logs/test_audit.log');

describe('logAudit', () => {
  it('writes audit log entry', async () => {
    const { logAudit } = await import('../auditLogger.js');
    await fs.promises.rm('logs', { recursive: true, force: true });
    await logAudit({ action: 'TEST', payload: { ok: true } });
    const logPath = path.resolve('logs/test_audit.log');
    const content = await fs.promises.readFile(logPath, 'utf8');
    expect(content).toContain('TEST');
  });

  it('appends when log directory already exists', async () => {
    const { logAudit } = await import('../auditLogger.js');
    await fs.promises.mkdir('logs', { recursive: true });
    await logAudit({ action: 'TEST_EXISTING', payload: { ok: true } });
    const logPath = path.resolve('logs/test_audit.log');
    const content = await fs.promises.readFile(logPath, 'utf8');
    expect(content).toContain('TEST_EXISTING');
  });
});
