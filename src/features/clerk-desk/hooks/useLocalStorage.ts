// hooks/useLocalStorage.ts - Enhanced Local Storage Hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { StorageService } from '../services/StorageService';
import { STORAGE_KEYS } from '../constants';

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

interface UseLocalStorageOptions<T> {
  debounceMs?: number;
  onError?: (error: Error) => void;
  validate?: (value: T) => boolean;
}

export function useLocalStorage<T>(
  key: StorageKey,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, { isLoading: boolean; error: Error | null }] {
  const { debounceMs = 500, onError, validate } = options;
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    return StorageService.load(key, initialValue);
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with storage on mount and when key changes
  useEffect(() => {
    const value = StorageService.load(key, initialValue);
    setStoredValue(value);
  }, [key]);

  // Save to storage with debouncing
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        // Validate before saving
        if (validate && !validate(storedValue)) {
          throw new Error('Validation failed');
        }
        
        StorageService.save(key, storedValue);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to save');
        setError(error);
        onError?.(error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [storedValue, key, debounceMs, validate, onError]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  return [storedValue, setValue, { isLoading, error }];
}

/**
 * Hook for managing a collection in localStorage
 */
export function useLocalStorageCollection<T extends { id: string }>(
  key: StorageKey,
  options: UseLocalStorageOptions<T[]> = {}
) {
  const [items, setItems, meta] = useLocalStorage<T[]>(key, [], options);

  const addItem = useCallback((item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    } as T;
    
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, [setItems]);

  const updateItem = useCallback((id: string, updates: Partial<T>) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    ));
  }, [setItems]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, [setItems]);

  const getItem = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const clearAll = useCallback(() => {
    setItems([]);
  }, [setItems]);

  return {
    items,
    setItems,
    addItem,
    updateItem,
    removeItem,
    getItem,
    clearAll,
    count: items.length,
    ...meta,
  };
}