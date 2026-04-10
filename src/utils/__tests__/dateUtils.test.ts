import { describe, it, expect } from 'vitest';
import { formatDate, parseDate, isValidDate } from '../dateUtils';

describe('date utilities', () => {
  it('formats dates correctly', () => {
    const date = '2026-04-10';
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2026-04-10');
    expect(formatDate(date, 'dd/MM/yyyy')).toBe('10/04/2026');
  });

  it('validates dates correctly', () => {
    expect(isValidDate('2026-04-10')).toBe(true);
    expect(isValidDate('invalid-date')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });

  it('parses dates correctly', () => {
    const dateStr = '2026-04-10';
    const parsed = parseDate(dateStr);
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(3); // 0-indexed
    expect(parsed?.getDate()).toBe(10);
  });
});
