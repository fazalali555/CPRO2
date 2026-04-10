
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// Components
import { RetirementChecklist } from '../../forms/retirement/RetirementChecklist';
import { RegularTitlePage } from '../../forms/regular-pension/RegularTitlePage';
import { RegularCoverLetter } from '../../forms/regular-pension/RegularCoverLetter';
import { PensionApplication } from '../../forms/regular-pension/PensionApplication';
import { PensionUndertaking } from '../../forms/regular-pension/PensionUndertaking';
import { PensionSanctionOrder } from '../../forms/regular-pension/PensionSanctionOrder';
import { PensionSanctionOrderPage2 } from '../../forms/regular-pension/PensionSanctionOrderPage2';
import { SpecimenSignaturePage } from '../../forms/regular-pension/SpecimenSignaturePage';
import { PensionCertificatesA } from '../../forms/regular-pension/PensionCertificatesA';
import { LastPayCertificate } from '../../forms/regular-pension/LastPayCertificate';
import { LastPayCertificateReverse } from '../../forms/regular-pension/LastPayCertificateReverse';
import { PensionCertificatesB } from '../../forms/regular-pension/PensionCertificatesB';
import { RegularDCSOption } from '../../forms/regular-pension/RegularDCSOption';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const RegularPensionPacketPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  
  const caseRecord = cases.find(c => c.id === caseId);
  const employee = caseRecord ? employees.find(e => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `Pension Papers - ${employee.employees.name}`;
    }
  }, [caseRecord, employee]);

  useAutoPrint(!!caseRecord && !!employee, 1500);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  // Strict A4
  const pageStyle: React.CSSProperties = {
    height: '297mm',
    width: '210mm',
    overflow: 'hidden',
    pageBreakAfter: 'always',
    marginBottom: '0'
  };

  return (
    <PrintLayout orientation="portrait" pageSize="A4">
      <div className="flex flex-col items-center bg-gray-100 print:bg-white print:block">
        
        {/* Page 0: Checklist */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <RetirementChecklist employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 1: Title Page */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <RegularTitlePage employee={employee} />
        </div>

        {/* Page 2: Forwarding Letter */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <RegularCoverLetter employee={employee} caseRecord={caseRecord} />
        </div>

        {/* Page 3: Application */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <PensionApplication employee={employee} />
        </div>

        {/* Page 4: Undertaking */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <PensionUndertaking employee={employee} />
        </div>

        {/* Page 5: Sanction 1 */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <PensionSanctionOrder employee={employee} />
        </div>

        {/* Page 6: Sanction 2 */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <PensionSanctionOrderPage2 employee={employee} />
        </div>

        {/* Page 7: Specimen */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <SpecimenSignaturePage employee={employee} />
        </div>

        {/* Page 8: Certificates A */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <PensionCertificatesA employee={employee} />
        </div>

        {/* Page 9: LPC Front */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <LastPayCertificate employee={employee} />
        </div>

        {/* Page 10: LPC Back */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <LastPayCertificateReverse employee={employee} />
        </div>

        {/* Page 11: Certificates B */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <PensionCertificatesB employee={employee} />
        </div>

        {/* Page 12: DCS Option */}
        <div style={pageStyle} className="print-page bg-white mb-8 print:mb-0">
          <RegularDCSOption employee={employee} />
        </div>

      </div>
    </PrintLayout>
  );
};
