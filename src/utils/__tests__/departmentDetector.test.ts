
import { describe, it, expect } from 'vitest';
import { getDepartmentInfo } from '../departmentDetector';

describe('departmentDetector', () => {
  it('detects E&SE department correctly', () => {
    const info = getDepartmentInfo('GHS ALLAI', 'DEO (E&SE) BATTAGRAM', 'Allai', 'Battagram');
    expect(info.departmentShort).toBe('Elementary & Secondary Education Department');
    expect(info.authorityTitle).toContain('District Education Officer');
  });

  it('detects Higher Education correctly', () => {
    const info = getDepartmentInfo('Govt Degree College', 'Higher Education Department', 'Allai', 'Battagram');
    // Current behavior might fail this if keywords are missing
    expect(info.departmentShort).toBe('Higher Education Department');
  });

  it('detects Health department correctly', () => {
    const info = getDepartmentInfo('DHQ Hospital', 'Health Department', 'Allai', 'Battagram');
    expect(info.departmentShort).toBe('Health Department');
    expect(info.authorityTitle).toContain('District Health Officer');
  });

  it('detects Police department correctly', () => {
    const info = getDepartmentInfo('Police Station City', 'Police Department', 'Allai', 'Battagram');
    expect(info.departmentShort).toBe('Police Department');
    expect(info.authorityTitle).toContain('District Police Officer');
  });

  it('uses department hint correctly', () => {
    // With "Health" hint, "Director" should match Health Department if "Health" is also in the name
    const info = getDepartmentInfo('Director Health', '', 'Peshawar', 'Peshawar', '', 'Health');
    expect(info.departmentShort).toBe('Health Department');
    expect(info.departmentType).toBe('health');
  });
});
