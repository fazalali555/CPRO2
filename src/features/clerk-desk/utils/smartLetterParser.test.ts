/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { parseOfficialLetter } from './smartLetterParser';

describe('smartLetterParser', () => {
  const sampleLetter = `   ###
   OFFICE OF THE SUB DIVISIONAL EDUCATION OFFICER
   (MALE) ALLAI
   **Ref No:** SDEO(M)/AL/ADM/2026/____
   **Date:** April 16, 2026
   **To,**
   **The District Education Officer (Male),**
   Battagram.
   **Subject: REVISION OF RETIREMENT SANCTION AND
   CLAIM FOR BALANCE LEAVE ENCASHMENT I.R.O MR.
   SHAFI UL, PSHT (BPS-15)**
   **Memo:**
   Reference is invited to your office retirement
   sanction issued vide **Endst No:
   8091-92/Estab/Pry/F.No.1 V-II dated 09/08/2024**
   and the financial release order No.
   **1969-76/Finance dated 16/12/2024**.
    2. It is submitted that **Mr. Shafi Ul**, PSHT
   (BPS-15), has already drawn **Rs. 513,813/-** for
   **225 days** of Leave Encashment. However, a
   re-audit of the official’s Service Book reveals a
   clerical error in the final leave balance. The
   correct particulars are as under:
    * **Total Service:** 37 Years, 01 Month, 07 Days
   (Appointment: 24-06-1987 to Retirement:
   31-07-2024).
    * **Total Earned Leave:** **445 days** (as per
   12 days/year rule).
    * **Total Leave Taken:** **99 days** (48 + 51
   days only).
    * **Net Entitlement:** **346 days** (445 - 99 =
   346).
    3. Due to an oversight, the official was
   sanctioned for only **225 days**, resulting in a
   deficit of **121 days**.
    4. It is, therefore, requested that the
   retirement sanction dated 09/08/2024 may kindly
   be **amended** to 346 days. It is further
   requested to move the case for the differential
   amount of **121 days** to the competent authority
   for the release of additional funds.
   The Service Book and supporting documents are
   enclosed for further necessary action, please.
   **Sub Divisional Education Officer (M)**
   Allai, Battagram`;

  it('should parse the sample letter correctly', () => {
    const result = parseOfficialLetter(sampleLetter);
    
    expect(result.officeName).toBeDefined();
    expect(result.recipient).toBeDefined();
    expect(result.subject).toBeDefined();
    expect(result.refNo).toBeDefined();
    expect(result.bodyHtml).toBeDefined();
    expect(result.signatoryTitle).toBeDefined();
    expect(result.signatoryArea).toBeDefined();
  });

  it('should parse forwarded items correctly', () => {
    const letterWithForwarding = `OFFICE OF THE SDEO
No. 123 Dated: 01/01/2026
To
DEO Battagram
Subject: TEST
Sir,
Body content.
Yours faithfully,
SDEO ALLAI
Copy forwarded to:
1. The Director Education
2. The Accountant General
3. File`;

    const result = parseOfficialLetter(letterWithForwarding);
    expect(result.copyTo).toBeDefined();
    expect(result.signatoryTitle).toBeDefined();
    expect(result.bodyHtml).toBeDefined();
  });
});
