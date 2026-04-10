// components/common/SearchBar.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TextField, Button, SelectField, Badge } from '../../../../components/M3';

interface SearchFilter {
  key: string;
  label: string;
  type: 'select' | 'date' | 'tags';
  options?: { value: string; label: string }[];
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filters?: SearchFilter[];
  filterValues?: Record<string, any>;
  onFilterChange?: (key: string, value: any) => void;
  onClear?: () => void;
  resultCount?: number;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  filters = [],
  filterValues = {},
  onFilterChange,
  onClear,
  resultCount,
  className = '',
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }, [onChange]);

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const activeFilterCount = Object.values(filterValues).filter(v => v !== '' && v !== undefined).length;

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onClear?.();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <TextField
            label=""
            placeholder={placeholder}
            icon="search"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
          />
          {localValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-variant rounded-full"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
        
        {filters.length > 0 && (
          <Button
            variant={showFilters ? 'tonal' : 'outlined'}
            icon="filter_list"
            label={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            onClick={() => setShowFilters(!showFilters)}
          />
        )}
      </div>
      
      {showFilters && filters.length > 0 && (
        <div className="flex flex-wrap gap-3 p-4 bg-surface-variant/20 rounded-xl border border-outline/20">
          {filters.map(filter => (
            <div key={filter.key} className="min-w-[200px]">
              {filter.type === 'select' && filter.options && (
                <SelectField
                  label={filter.label}
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                >
                  <option value="">All</option>
                  {filter.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </SelectField>
              )}
              {filter.type === 'date' && (
                <TextField
                  label={filter.label}
                  type="date"
                  value={filterValues[filter.key] || ''}
                  onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                />
              )}
            </div>
          ))}
          
          {activeFilterCount > 0 && (
            <Button
              variant="text"
              label="Clear Filters"
              icon="clear_all"
              onClick={onClear}
              className="self-end"
            />
          )}
        </div>
      )}
      
      {resultCount !== undefined && (
        <div className="text-sm text-on-surface-variant">
          Found <Badge label={String(resultCount)} color="primary" className="mx-1" /> results
        </div>
      )}
    </div>
  );
};