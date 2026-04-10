// services/StorageService.ts - Unified Storage Service

import { STORAGE_KEYS } from '../constants';

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

class StorageServiceClass {
  private cache: Map<string, any> = new Map();
  private saveQueue: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_MS = 500;

  /**
   * Load data from localStorage with caching
   */
  load<T>(key: StorageKey, fallback: T): T {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        this.cache.set(key, fallback);
        return fallback;
      }

      const parsed = JSON.parse(raw);
      const value = parsed ?? fallback;
      this.cache.set(key, value);
      return value;
    } catch (error) {
      console.error(`StorageService: Failed to load ${key}`, error);
      this.cache.set(key, fallback);
      return fallback;
    }
  }

  /**
   * Save data to localStorage with debouncing
   */
  save<T>(key: StorageKey, value: T, immediate = false): void {
    // Update cache immediately
    this.cache.set(key, value);

    // Clear existing timeout
    const existingTimeout = this.saveQueue.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (immediate) {
      this.persistToStorage(key, value);
      return;
    }

    // Debounce the actual storage write
    const timeout = setTimeout(() => {
      this.persistToStorage(key, value);
      this.saveQueue.delete(key);
    }, this.DEBOUNCE_MS);

    this.saveQueue.set(key, timeout);
  }

  /**
   * Actually persist to localStorage
   */
  private persistToStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`StorageService: Failed to save ${key}`, error);
      
      // Handle quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
    }
  }

  /**
   * Handle storage quota exceeded
   */
  private handleQuotaExceeded(): void {
    console.warn('StorageService: Storage quota exceeded, clearing old data...');
    // Could implement cleanup logic here
  }

  /**
   * Remove data from storage
   */
  remove(key: StorageKey): void {
    this.cache.delete(key);
    localStorage.removeItem(key);
  }

  /**
   * Clear all clerk desk data
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.cache.delete(key);
      localStorage.removeItem(key);
    });
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): { used: number; total: number; percentage: number } {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }
    
    // Approximate 5MB limit
    const total = 5 * 1024 * 1024;
    return {
      used,
      total,
      percentage: Math.round((used / total) * 100),
    };
  }

  /**
   * Export all data for backup
   */
  exportAll(): Record<string, any> {
    const data: Record<string, any> = {};
    Object.values(STORAGE_KEYS).forEach(key => {
      data[key] = this.load(key, null);
    });
    return data;
  }

  /**
   * Import data from backup
   */
  importAll(data: Record<string, any>): void {
    Object.entries(data).forEach(([key, value]) => {
      if (Object.values(STORAGE_KEYS).includes(key as StorageKey)) {
        this.save(key as StorageKey, value, true);
      }
    });
  }

  /**
   * Force flush all pending saves
   */
  flush(): void {
    this.saveQueue.forEach((timeout, key) => {
      clearTimeout(timeout);
      const value = this.cache.get(key);
      if (value !== undefined) {
        this.persistToStorage(key, value);
      }
    });
    this.saveQueue.clear();
  }
}

export const StorageService = new StorageServiceClass();

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    StorageService.flush();
  });
}