import { describe, it, expect, beforeEach, vi } from 'vitest';
import { securityService, auditService } from '../SecurityService';

describe('SecurityService', () => {
  beforeEach(() => {
    localStorage.clear();
    // Re-initialize service or clear internal state if possible
    // Since it's a singleton, we'll just mock localStorage
  });

  it('provides a default user if none exists', () => {
    const user = securityService.getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.role).toBe('admin');
  });

  it('handles login and logout', () => {
    const newUser = { id: 'u2', name: 'Test User', role: 'clerk' as const, office: 'Test Office' };
    securityService.login(newUser);
    expect(securityService.getCurrentUser()).toEqual(newUser);
    expect(securityService.hasRole(['clerk'])).toBe(true);
    expect(securityService.hasRole(['admin'])).toBe(false);

    securityService.logout();
    expect(securityService.getCurrentUser()).toBeNull();
  });
});

describe('AuditService', () => {
  it('logs actions correctly', () => {
    auditService.log('test_action', 'test_details', 'res_1');
    const logs = auditService.getAllLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe('test_action');
    expect(logs[0].resourceId).toBe('res_1');
  });

  it('filters logs by resource', () => {
    auditService.log('act1', 'det1', 'res_A');
    auditService.log('act2', 'det2', 'res_B');
    const logsA = auditService.getLogsByResource('res_A');
    expect(logsA.length).toBe(1);
    expect(logsA[0].details).toBe('det1');
  });
});
