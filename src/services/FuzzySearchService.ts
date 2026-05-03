// @ts-nocheck  
/**
 * ENHANCED Fuzzy Search Implementation
 * 
 * Features:
 * 1. ✅ Fuzzy matching for typos and partial matches
 * 2. ✅ Weighted search across multiple fields
 * 3. ✅ Performance optimized with memoization
 * 4. ✅ Mobile-friendly
 * 
 * Installation:
 * npm install fuse.js
 * 
 * Usage:
 * const searchService = new FuzzySearchService(employees);
 * const results = searchService.search('fazal ali', ['name', 'cnic']);
 */

import Fuse from 'fuse.js';
import { EmployeeRecord, CaseRecord } from '../types';

// ============================================================================
// EMPLOYEE FUZZY SEARCH SERVICE
// ============================================================================

export class EmployeeFuzzySearchService {
  private fuse: Fuse<EmployeeRecord>;
  private data: EmployeeRecord[];

  constructor(employees: EmployeeRecord[]) {
    this.data = employees;
    
    // Configure Fuse.js for employee search
    // Threshold 0.3 = allows ~30% character differences (good for typos)
    this.fuse = new Fuse(employees, {
      keys: [
        // Primary fields (higher weight)
        { name: 'employees.name', weight: 0.4 },
        { name: 'employees.cnic_no', weight: 0.3 },
        { name: 'employees.personal_no', weight: 0.3 },
        
        // Secondary fields (medium weight)
        { name: 'employees.designation', weight: 0.2 },
        { name: 'employees.school_full_name', weight: 0.2 },
        { name: 'employees.office_name', weight: 0.2 },
        
        // Tertiary fields (lower weight)
        { name: 'employees.father_name', weight: 0.1 },
        { name: 'employees.district', weight: 0.1 },
        { name: 'employees.tehsil', weight: 0.1 },
      ],
      threshold: 0.3,  // Allow ~30% character differences
      minMatchCharLength: 2,  // Match at least 2 characters
      includeScore: true,  // Include match score for ranking
      ignoreLocation: true,  // Don't prioritize matches at start
    });
  }

  /**
   * Search employees with fuzzy matching
   * @param query Search term (can have typos)
   * @returns Sorted array of matching employees
   */
  search(query: string): EmployeeRecord[] {
    if (!query || query.trim().length < 2) {
      return this.data;
    }

    const results = this.fuse.search(query);
    return results.map(result => result.item);
  }

  /**
   * Advanced search with multiple criteria
   */
  advancedSearch(
    query: string,
    filters?: {
      status?: string;
      district?: string;
      designation?: string;
      bps?: number;
    }
  ): EmployeeRecord[] {
    let results = this.search(query);

    // Apply additional filters
    if (filters?.status) {
      results = results.filter(e => e.employees.status === filters.status);
    }
    if (filters?.district) {
      results = results.filter(e => e.employees.district === filters.district);
    }
    if (filters?.designation) {
      results = results.filter(e => 
        e.employees.designation.toLowerCase().includes(filters.designation!.toLowerCase())
      );
    }
    if (filters?.bps) {
      results = results.filter(e => e.employees.bps === filters.bps);
    }

    return results;
  }

  /**
   * Get search suggestions for autocomplete
   */
  getSuggestions(query: string, limit: number = 5): string[] {
    const results = this.search(query);
    const suggestions = new Set<string>();

    results.slice(0, limit).forEach(emp => {
      suggestions.add(emp.employees.name);
      suggestions.add(emp.employees.cnic_no);
      suggestions.add(emp.employees.personal_no);
    });

    return Array.from(suggestions).slice(0, limit);
  }
}

// ============================================================================
// CASE FUZZY SEARCH SERVICE
// ============================================================================

export class CaseFuzzySearchService {
  private fuse: Fuse<CaseRecord>;
  private data: CaseRecord[];

  constructor(cases: CaseRecord[]) {
    this.data = cases;
    
    this.fuse = new Fuse(cases, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'description', weight: 0.3 },
        { name: 'employee_id', weight: 0.2 },
      ],
      threshold: 0.3,
      minMatchCharLength: 2,
      includeScore: true,
    });
  }

  search(query: string): CaseRecord[] {
    if (!query || query.trim().length < 2) {
      return this.data;
    }

    const results = this.fuse.search(query);
    return results.map(result => result.item);
  }

  advancedSearch(
    query: string,
    filters?: {
      status?: string;
      caseType?: string;
      priority?: string;
    }
  ): CaseRecord[] {
    let results = this.search(query);

    if (filters?.status) {
      results = results.filter(c => c.status === filters.status);
    }
    if (filters?.caseType) {
      results = results.filter(c => c.case_type === filters.caseType);
    }
    if (filters?.priority) {
      results = results.filter(c => c.priority === filters.priority);
    }

    return results;
  }
}

// ============================================================================
// REACT HOOK: useFuzzySearch
// ============================================================================

import { useMemo } from 'react';

export function useFuzzySearch<T extends EmployeeRecord | CaseRecord>(
  data: T[],
  query: string,
  type: 'employee' | 'case' = 'employee'
): T[] {
  return useMemo(() => {
    if (type === 'employee') {
      const service = new EmployeeFuzzySearchService(data as EmployeeRecord[]);
      return service.search(query) as T[];
    } else {
      const service = new CaseFuzzySearchService(data as CaseRecord[]);
      return service.search(query) as T[];
    }
  }, [data, query, type]);
}
