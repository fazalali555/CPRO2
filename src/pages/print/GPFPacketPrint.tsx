
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';
import { isClassIV, isBpsGreaterThan4 } from '../../utils';

// Forms
import { GPFChecklist } from '../../forms/gpf/GPFChecklist';
import { GPFAdvanceApplication } from '../../forms/gpf/GPFAdvanceApplication';
import { PAYF05TemporaryLoan } from '../../forms/gpf/PAYF05TemporaryLoan';
import { PAYF06PermanentLoan } from '../../forms/gpf/PAYF06PermanentLoan';
import { GPFClaimVerificationProforma } from '../../forms/gpf/GPFClaimVerificationProforma';
import { GPFSanctionOrderClassIV } from '../../forms/gpf/GPFSanctionOrderClassIV';
import { GPFApplicationForSanction } from '../../forms/gpf/GPFApplicationForSanction';
import { GPFFinalPaymentForm10 } from '../../forms/gpf/GPFFinalPaymentForm10';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const GPFPacketPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `GPF Packet - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  // Longer delay for packet rendering
  useAutoPrint(!!caseRecord && !!employee, 1500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  const isRefundable = caseRecord.case_type === 'gpf_refundable';
  const isNonRefundable = caseRecord.case_type === 'gpf_non_refundable';
  const isFinal = caseRecord.case_type === 'gpf_final';
  const bps = employee.employees.bps;

  return (
    <PrintLayout caseId={caseId} documentId="gpf-packet">
      {/* CSS for Mixed Orientation Printing */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          @page landscape { size: A4 landscape; margin: 0; }
          .landscape-page {
             page: landscape;
             width: 297mm !important;
             height: 210mm !important;
          }
        }
      `}</style>

      <div className="flex flex-col items-center">
        
        {/* 1. Checklist (Portrait) - Common to all */}
        <div className="print-page mb-8 print:mb-0">
          <GPFChecklist employee={employee} caseRecord={caseRecord} />
        </div>
        <div className="print-break" />

        {/* --- ADVANCE CASES --- */}
        {(isRefundable || isNonRefundable) && (
          <>
            {/* Advance Application */}
            <div className="print-page mb-8 print:mb-0">
              <GPFAdvanceApplication employeeRecord={employee} caseRecord={caseRecord} />
            </div>
            <div className="print-break" />

            {/* PAYF05 (Refundable) */}
            {isRefundable && (
              <>
                <div className="print-page mb-8 print:mb-0">
                  <PAYF05TemporaryLoan employeeRecord={employee} caseRecord={caseRecord} />
                </div>
                <div className="print-break" />
              </>
            )}

            {/* PAYF06 (Non-Refundable) - Landscape */}
            {isNonRefundable && (
              <>
                <div className="print-page landscape-page mb-8 print:mb-0" style={{ width: '297mm' }}>
                  <PAYF06PermanentLoan employeeRecord={employee} caseRecord={caseRecord} />
                </div>
                <div className="print-break" />
              </>
            )}

            {/* GCVP - Landscape */}
            <div className="print-page landscape-page mb-8 print:mb-0" style={{ width: '297mm' }}>
               <GPFClaimVerificationProforma employeeRecord={employee} caseRecord={caseRecord} />
            </div>
            <div className="print-break" />

            {/* Sanction Documents (Portrait) */}
            {isClassIV(bps) && (
               <div className="print-page mb-8 print:mb-0">
                  <GPFSanctionOrderClassIV employeeRecord={employee} caseRecord={caseRecord} />
               </div>
            )}
            
            {isBpsGreaterThan4(bps) && (
               <div className="print-page mb-8 print:mb-0">
                  <GPFApplicationForSanction employeeRecord={employee} caseRecord={caseRecord} />
               </div>
            )}
          </>
        )}

        {/* --- FINAL PAYMENT CASE --- */}
        {isFinal && (
          <>
             <div className="print-page mb-8 print:mb-0">
               <GPFFinalPaymentForm10 employeeRecord={employee} caseRecord={caseRecord} />
             </div>
          </>
        )}

      </div>
    </PrintLayout>
  );
};
