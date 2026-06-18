import { expect, it, describe } from 'vitest';
import { parseOfficialLetter } from './smartLetterParser';

describe('debug parser', () => {
  it('debug output', () => {
    const sampleLetter = `   ###
   OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER
   (MALE) ALLAI
   **Ref No:** SDEO(M)/AL/ADM/2026/____
   **Date:** April 16, 2026`;

    const result = parseOfficialLetter(sampleLetter);
    console.log(JSON.stringify(result, null, 2));
    
    // Assertions to verify Task 2 requirements
    expect(result.officeName).toContain('SUB DIVISIONAL EDUCATION OFFICER');
    expect(result.refNo).toBe('SDEO(M)/AL/ADM/2026/____');
    expect(result.dateRaw).toBe('April 16, 2026');
  });
});
