
import { AuditEntry, User, UserRole } from '../types';

class SecurityService {
  private currentUser: User | null = null;

  constructor() {
    const savedUser = localStorage.getItem('clerk_pro_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    } else {
      // Default mock user for now
      this.currentUser = {
        id: 'u1',
        name: 'Fazal Ali',
        role: 'admin',
        office: 'Allai'
      };
      localStorage.setItem('clerk_pro_user', JSON.stringify(this.currentUser));
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  hasRole(roles: UserRole[]): boolean {
    if (!this.currentUser) return false;
    return roles.includes(this.currentUser.role);
  }

  login(user: User) {
    this.currentUser = user;
    localStorage.setItem('clerk_pro_user', JSON.stringify(user));
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('clerk_pro_user');
  }
}

export const securityService = new SecurityService();

class AuditService {
  private getAuditLog(): AuditEntry[] {
    const log = localStorage.getItem('clerk_pro_audit_log');
    return log ? JSON.parse(log) : [];
  }

  private saveAuditLog(log: AuditEntry[]) {
    localStorage.setItem('clerk_pro_audit_log', JSON.stringify(log));
  }

  log(action: string, details: string, resourceId?: string) {
    const user = securityService.getCurrentUser();
    const newEntry: AuditEntry = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user?.id || 'anonymous',
      action,
      details,
      timestamp: new Date().toISOString(),
      resourceId
    };

    const log = this.getAuditLog();
    log.unshift(newEntry);
    this.saveAuditLog(log.slice(0, 1000)); // Keep last 1000 entries
  }

  getLogsByResource(resourceId: string): AuditEntry[] {
    return this.getAuditLog().filter(e => e.resourceId === resourceId);
  }

  getAllLogs(): AuditEntry[] {
    return this.getAuditLog();
  }
}

export const auditService = new AuditService();
