
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

  it('reflects office name/tehsil in SDEO signature title instead of district', () => {
    const info = getDepartmentInfo('', 'OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER (MALE) ALLAI', 'Allai', 'Battagram');
    expect(info.letterhead.line1).toBe('OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER (MALE) ALLAI');
    expect(info.signatureTitle).toBe('Sub Divisional Education Officer (Male)\nAllai');
    expect(info.authorityTitle).toContain('District Education Officer');
  });

  it('extracts office location from office_name when tehsil is empty', () => {
    const info = getDepartmentInfo('', 'OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER (MALE) ALLAI', '', 'Battagram');
    expect(info.signatureTitle).toBe('Sub Divisional Education Officer (Male)\nAllai');
    expect(info.authorityTitle).toContain('District Education Officer');
  });

  it('reflects SDEO office location for primary school employees', () => {
    const info = getDepartmentInfo('GPS KANNA', 'OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER (MALE) ALLAI', 'Allai', 'Battagram');
    expect(info.signatureTitle).toBe('Sub Divisional Education Officer (Male)\nAllai');
  });
});

