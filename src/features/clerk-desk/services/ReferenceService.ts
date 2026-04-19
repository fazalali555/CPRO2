// services/ReferenceService.ts - Reference Number Generator

import { StorageService } from './StorageService';

interface ReferenceCounter {
  prefix: string;
  year: string;
  lastSequence: number;
  updatedAt: string;
}

class ReferenceServiceClass {
  private readonly STORAGE_KEY = 'clerk_pro_clerk_ref_counters';

  /**
   * Get all counters
   */
  private getCounters(): Record<string, ReferenceCounter> {
    return StorageService.load(this.STORAGE_KEY, {});
  }

  /**
   * Save counters
   */
  private saveCounters(counters: Record<string, ReferenceCounter>): void {
    StorageService.save(this.STORAGE_KEY, counters, true);
  }

  /**
   * Generate next reference number
   */
  generateReference(
    prefix: string,
    format: 'standard' | 'year_month' | 'full_date' = 'standard',
    customYear?: string
  ): string {
    const counters = this.getCounters();
    const currentYear = customYear || new Date().getFullYear().toString();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Create counter key based on format
    let counterKey: string;
    switch (format) {
      case 'year_month':
        counterKey = `${prefix}_${currentYear}_${currentMonth}`;
        break;
      case 'full_date':
        counterKey = `${prefix}_${currentYear}_${currentMonth}_${new Date().getDate()}`;
        break;
      default:
        counterKey = `${prefix}_${currentYear}`;
    }

    // Get or create counter
    let counter = counters[counterKey];
    if (!counter || counter.year !== currentYear) {
      counter = {
        prefix,
        year: currentYear,
        lastSequence: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    // Increment sequence
    counter.lastSequence++;
    counter.updatedAt = new Date().toISOString();
    
    // Save
    counters[counterKey] = counter;
    this.saveCounters(counters);

    // Generate reference number
    const sequence = counter.lastSequence.toString().padStart(4, '0');
    
    switch (format) {
      case 'year_month':
        return `${prefix}/${currentYear}/${currentMonth}/${sequence}`;
      case 'full_date':
        const day = new Date().getDate().toString().padStart(2, '0');
        return `${prefix}/${currentYear}/${currentMonth}/${day}/${sequence}`;
      default:
        return `${prefix}/${currentYear}/${sequence}`;
    }
  }

  /**
   * Parse reference number
   */
  parseReference(reference: string): {
    prefix: string;
    year: string;
    month?: string;
    sequence: string;
    isValid: boolean;
  } {
    const parts = reference.split('/');
    
    if (parts.length < 3) {
      return { prefix: '', year: '', sequence: '', isValid: false };
    }

    return {
      prefix: parts[0],
      year: parts[1],
      month: parts.length >= 4 ? parts[2] : undefined,
      sequence: parts[parts.length - 1],
      isValid: true,
    };
  }

  /**
   * Get current sequence for a prefix
   */
  getCurrentSequence(prefix: string, year?: string): number {
    const counters = this.getCounters();
    const targetYear = year || new Date().getFullYear().toString();
    const counterKey = `${prefix}_${targetYear}`;
    
    return counters[counterKey]?.lastSequence || 0;
  }

  /**
   * Set sequence manually (for imports)
   */
  setSequence(prefix: string, sequence: number, year?: string): void {
    const counters = this.getCounters();
    const targetYear = year || new Date().getFullYear().toString();
    const counterKey = `${prefix}_${targetYear}`;
    
    counters[counterKey] = {
      prefix,
      year: targetYear,
      lastSequence: sequence,
      updatedAt: new Date().toISOString(),
    };
    
    this.saveCounters(counters);
  }

  /**
   * Reset sequence
   */
  resetSequence(prefix: string, year?: string): void {
    this.setSequence(prefix, 0, year);
  }

  /**
   * Get all prefixes with their current sequences
   */
  getAllSequences(): ReferenceCounter[] {
    const counters = this.getCounters();
    return Object.values(counters).sort((a, b) => a.prefix.localeCompare(b.prefix));
  }

  /**
   * Generate endorsement number
   */
  generateEndorsementNumber(baseReference: string): string {
    const parts = baseReference.split('/');
    return `${baseReference}/E-${Date.now().toString(36).toUpperCase()}`;
  }

  /**
   * Generate dispatch number
   */
  generateDispatchNumber(prefix: string = 'DISP'): string {
    return this.generateReference(prefix, 'year_month');
  }

  /**
   * Format reference for display
   */
  formatReference(reference: string, format: 'short' | 'full' = 'full'): string {
    const parsed = this.parseReference(reference);
    if (!parsed.isValid) return reference;

    if (format === 'short') {
      return `${parsed.prefix}/${parsed.sequence}`;
    }
    
    return reference;
  }
}

export const ReferenceService = new ReferenceServiceClass();
