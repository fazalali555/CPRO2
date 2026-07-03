import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';
import { isClassIV, isBpsGreaterThan4, isDeceasedStatus } from '../../utils';

// Checklists
import { RetirementChecklist } from '../../forms/retirement/RetirementChecklist';
import { PensionChecklist } from '../../forms/checklists/PensionChecklist';
import { FamilyPensionChecklist } from '../../forms/checklists/FamilyPensionChecklist';
import { GPFChecklist } from '../../forms/gpf/GPFChecklist';
import { RBDCChecklist } from '../../forms/checklists/RBDCChecklist';
import { BenevolentFundChecklist } from '../../forms/checklists/BenevolentFundChecklist';
import { EEFChecklist } from '../../forms/checklists/EEFChecklist';
import { LPRChecklist } from '../../forms/checklists/LPRChecklist';
import { FinancialAssistanceChecklist } from '../../forms/checklists/FinancialAssistanceChecklist';

// Retirement Forms
import { RetirementCoverLetter } from '../../forms/retirement/RetirementCoverLetter';
import { RetirementEmployeeApplication } from '../../forms/retirement/RetirementEmployeeApplication';
import { RetirementClearanceCertificate } from '../../forms/retirement/RetirementClearanceCertificate';
import { RetirementNoDemandCertificate } from '../../forms/retirement/RetirementNoDemandCertificate';
import { RetirementNonInvolvementCertificate } from '../../forms/retirement/RetirementNonInvolvementCertificate';
import { RetirementLeaveNotAvailingCertificate } from '../../forms/retirement/RetirementLeaveNotAvailingCertificate';
import { RetirementQualifyingServiceCertificate } from '../../forms/retirement/RetirementQualifyingServiceCertificate';
import { RetirementServiceCertificate } from '../../forms/retirement/RetirementServiceCertificate';
import { RetirementLegalHeirsList } from '../../forms/retirement/RetirementLegalHeirsList';
import { LeaveAccountProforma } from '../../forms/retirement/LeaveAccountProforma';

// GPF Forms
import { GPFApplicationForSanction } from '../../forms/gpf/GPFApplicationForSanction';
import { GPFSanctionOrderClassIV } from '../../forms/gpf/GPFSanctionOrderClassIV';
import { GPFAdvanceApplication } from '../../forms/gpf/GPFAdvanceApplication';
import { PAYF05TemporaryLoan } from '../../forms/gpf/PAYF05TemporaryLoan';
import { PAYF06PermanentLoan } from '../../forms/gpf/PAYF06PermanentLoan';
import { GPFClaimVerificationProforma } from '../../forms/gpf/GPFClaimVerificationProforma';
import { GPFFinalPaymentForm10 } from '../../forms/gpf/GPFFinalPaymentForm10';

// Family Pension Forms
import { FamilyPensionTitlePage } from '../../forms/family-pension/FamilyPensionTitlePage';
import { FamilyPensionCoverLetter } from '../../forms/family-pension/FamilyPensionCoverLetter';
import { FamilyPensionApplication } from '../../forms/family-pension/FamilyPensionApplication';
import { FamilyMembersList } from '../../forms/family-pension/FamilyMembersList';
import { FamilyPensionInServiceDeathData } from '../../forms/family-pension/FamilyPensionInServiceDeathData';
import { FamilyPensionSanctionAuthority } from '../../forms/family-pension/FamilyPensionSanctionAuthority';
import { PostRetirementApplication } from '../../forms/family-pension/PostRetirementApplication';
import { PostRetirementSignatures } from '../../forms/family-pension/PostRetirementSignatures';
import { FamilyPensionSanctionOrder } from '../../forms/family-pension/FamilyPensionSanctionOrder';
import { DescriptiveRoll } from '../../forms/family-pension/DescriptiveRoll';
import { FamilyNoDemandCertificate } from '../../forms/family-pension/FamilyNoDemandCertificate';
import { FamilyUndertakingRecovery } from '../../forms/family-pension/FamilyUndertakingRecovery';
import { FamilyNonInvolvement } from '../../forms/family-pension/FamilyNonInvolvement';
import { FamilyClearance } from '../../forms/family-pension/FamilyClearance';
import { NonMarriageCertificate } from '../../forms/family-pension/NonMarriageCertificate';
import { LifeCertificate } from '../../forms/family-pension/LifeCertificate';
import { DCSOptionForm } from '../../forms/family-pension/DCSOptionForm';
import { SuccessionCertificate } from '../../forms/family-pension/SuccessionCertificate';
import { BankAccountLetter } from '../../forms/family-pension/BankAccountLetter';
import { Affidavit1 } from '../../forms/family-pension/Affidavit1';
import { Affidavit2 } from '../../forms/family-pension/Affidavit2';
import { Affidavit3 } from '../../forms/family-pension/Affidavit3';

// Regular Pension Forms
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

// Cover Letters
import { LPRApplication } from '../../forms/cover-letters/LPRApplication';
import { LPRPayForm } from '../../forms/lpr/LPRPayForm';
import { FinancialAssistanceApplication } from '../../forms/cover-letters/FinancialAssistanceApplication';
import { RBDCApplication } from '../../forms/cover-letters/RBDCApplication';
import { BenevolentFundApplication } from '../../forms/cover-letters/BenevolentFundApplication';
import { EEFApplication } from '../../forms/cover-letters/EEFApplication';

// Official Forms
import { RBDCOfficialForm } from '../../forms/official/RBDCOfficialForm';
import { EEFOfficialForm } from '../../forms/official/EEFOfficialForm';
import { BenevolentFundOfficialForm } from '../../forms/official/BenevolentFundOfficialForm';

// Certificates
import { NonDrawalCertificate } from '../../forms/certificates/NonDrawalCertificate';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

interface PageConfig {
  element: React.ReactNode;
  orientation?: 'landscape' | 'portrait';
  size: 'a4' | 'legal';
  isAffidavit?: boolean;
}

export const BulkCasePrint: React.FC<Props> = ({ employees, cases }: Props) => {
  const { caseId, group } = useParams<{ caseId: string; group: 'a4' | 'legal' | 'affidavit' }>();
  
  const caseRecord = cases.find((c: CaseRecord) => c.id === caseId);
  const employee = caseRecord ? employees.find((e: EmployeeRecord) => e.id === caseRecord.employee_id) : null;

  useEffect(() => {
    if (caseRecord && employee) {
      document.title = `Bulk Print (${group?.toUpperCase()}) - ${employee.employees.name}`;
    }
  }, [caseRecord, employee, group]);

  useAutoPrint(!!caseRecord && !!employee, 2000);

  if (!caseRecord || !employee) {
    return <div className="p-10 text-center text-red-600 font-bold">Error: Case or Employee not found.</div>;
  }

  const isDeceased = isDeceasedStatus(employee.employees.status);
  const isRetirement = caseRecord.case_type === 'retirement';
  const isGPF = caseRecord.case_type?.startsWith('gpf_');
  const isDeceasedPension = caseRecord.case_type === 'pension' && isDeceased;
  const isRegularPension = caseRecord.case_type === 'pension' && !isDeceased;
  const bps = employee.employees.bps;

  const pages: PageConfig[] = [];

  if (isRetirement) {
    pages.push(
      { element: <RetirementChecklist employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RetirementCoverLetter employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RetirementEmployeeApplication employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RetirementClearanceCertificate employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RetirementNoDemandCertificate employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RetirementNonInvolvementCertificate employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RetirementLeaveNotAvailingCertificate employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RetirementQualifyingServiceCertificate employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RetirementServiceCertificate employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RetirementLegalHeirsList employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <LeaveAccountProforma employeeRecord={employee} caseRecord={caseRecord} />, orientation: 'landscape', size: 'a4' }
    );
  } else if (isGPF) {
    const isAdvance = caseRecord.case_type === 'gpf_refundable' || caseRecord.case_type === 'gpf_non_refundable';
    pages.push({ element: <GPFChecklist employee={employee} caseRecord={caseRecord} />, size: 'a4' });
    if (isBpsGreaterThan4(bps) && isAdvance) {
      pages.push({ element: <GPFApplicationForSanction employeeRecord={employee} caseRecord={caseRecord} />, size: 'a4' });
    }
    if (isClassIV(bps) && isAdvance) {
      pages.push({ element: <GPFSanctionOrderClassIV employeeRecord={employee} caseRecord={caseRecord} />, size: 'a4' });
    }
    if (isAdvance) {
      pages.push({ element: <GPFAdvanceApplication employeeRecord={employee} caseRecord={caseRecord} />, size: 'a4' });
    }
    if (caseRecord.case_type === 'gpf_refundable') {
      pages.push({ element: <PAYF05TemporaryLoan employeeRecord={employee} caseRecord={caseRecord} />, size: 'a4' });
    }
    if (caseRecord.case_type === 'gpf_non_refundable' || caseRecord.case_type === 'gpf_final') {
      pages.push({ element: <PAYF06PermanentLoan employeeRecord={employee} caseRecord={caseRecord} />, orientation: 'landscape', size: 'a4' });
    }
    if (isAdvance || caseRecord.case_type === 'gpf_final') {
      pages.push({ element: <GPFClaimVerificationProforma employeeRecord={employee} caseRecord={caseRecord} />, orientation: 'landscape', size: 'a4' });
    }
    if (caseRecord.case_type === 'gpf_final') {
      pages.push({ element: <GPFFinalPaymentForm10 employeeRecord={employee} caseRecord={caseRecord} />, size: 'a4' });
    }
  } else if (isDeceasedPension) {
    pages.push(
      { element: <FamilyPensionChecklist employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <FamilyPensionTitlePage employee={employee} />, size: 'a4' },
      { element: <FamilyPensionCoverLetter employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <FamilyPensionApplication employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <FamilyMembersList employee={employee} />, size: 'a4' },
      { element: <FamilyPensionInServiceDeathData employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <FamilyPensionSanctionAuthority employee={employee} />, size: 'a4' },
      { element: <PostRetirementApplication employee={employee} />, size: 'a4' },
      { element: <PostRetirementSignatures employee={employee} />, size: 'a4' },
      { element: <FamilyPensionSanctionOrder employee={employee} />, size: 'a4' },
      { element: <DescriptiveRoll employee={employee} />, size: 'a4' },
      { element: <FamilyNoDemandCertificate employee={employee} />, size: 'a4' },
      { element: <FamilyUndertakingRecovery employee={employee} />, size: 'a4' },
      { element: <FamilyNonInvolvement employee={employee} />, size: 'a4' },
      { element: <FamilyClearance employee={employee} />, size: 'a4' },
      { element: <NonMarriageCertificate employee={employee} />, size: 'a4' },
      { element: <LifeCertificate employee={employee} />, size: 'a4' },
      { element: <DCSOptionForm employee={employee} />, size: 'a4' },
      { element: <RetirementLegalHeirsList employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      
      { element: <SuccessionCertificate employee={employee} />, size: 'legal' },
      { element: <BankAccountLetter employee={employee} />, size: 'legal' },
      { element: <Affidavit1 employee={employee} />, size: 'legal', isAffidavit: true },
      { element: <Affidavit2 employee={employee} />, size: 'legal', isAffidavit: true }
    );
  } else if (isRegularPension) {
    pages.push(
      { element: <PensionChecklist employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RegularTitlePage employee={employee} />, size: 'a4' },
      { element: <RegularCoverLetter employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <PensionApplication employee={employee} />, size: 'a4' },
      { element: <PensionUndertaking employee={employee} />, size: 'a4' },
      { element: <PensionSanctionOrder employee={employee} />, size: 'a4' },
      { element: <PensionSanctionOrderPage2 employee={employee} />, size: 'a4' },
      { element: <SpecimenSignaturePage employee={employee} />, size: 'a4' },
      { element: <PensionCertificatesA employee={employee} />, size: 'a4' },
      { element: <LastPayCertificate employee={employee} />, size: 'a4' },
      { element: <LastPayCertificateReverse employee={employee} />, size: 'a4' },
      { element: <PensionCertificatesB employee={employee} />, size: 'a4' },
      { element: <RegularDCSOption employee={employee} />, size: 'a4' },
      
      { element: <Affidavit2 employee={employee} />, size: 'legal', isAffidavit: true },
      { element: <Affidavit3 employee={employee} />, size: 'legal', isAffidavit: true }
    );
  } else if (caseRecord.case_type === 'rbdc') {
    pages.push(
      { element: <RBDCChecklist employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <RBDCApplication employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <LeaveAccountProforma employeeRecord={employee} caseRecord={caseRecord} />, orientation: 'landscape', size: 'a4' },
      { element: <RBDCOfficialForm employee={employee} caseRecord={caseRecord} />, size: 'a4' }
    );
  } else if (caseRecord.case_type === 'benevolent_fund') {
    pages.push(
      { element: <BenevolentFundChecklist employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <BenevolentFundApplication employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <NonDrawalCertificate employee={employee} type="Benevolent Fund" />, size: 'a4' },
      { element: <NonDrawalCertificate employee={employee} type="Contribution" />, size: 'a4' },
      { element: <BenevolentFundOfficialForm employee={employee} caseRecord={caseRecord} />, size: 'a4' }
    );
  } else if (caseRecord.case_type === 'eef') {
    pages.push(
      { element: <EEFChecklist employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <EEFApplication employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <NonDrawalCertificate employee={employee} type="Employees Education Foundation" />, size: 'a4' },
      { element: <EEFOfficialForm employee={employee} caseRecord={caseRecord} />, size: 'a4' }
    );
  } else if (caseRecord.case_type === 'lpr') {
    pages.push(
      { element: <LPRChecklist employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <LPRApplication employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <NonDrawalCertificate employee={employee} type="LPR" />, size: 'a4' },
      { element: <LPRPayForm employee={employee} caseRecord={caseRecord} />, size: 'a4' }
    );
  } else if (caseRecord.case_type === 'financial_assistance') {
    pages.push(
      { element: <FinancialAssistanceChecklist employee={employee} caseRecord={caseRecord} />, size: 'a4' },
      { element: <NonDrawalCertificate employee={employee} type="Financial Assistance" />, size: 'a4' },
      { element: <FinancialAssistanceApplication employee={employee} caseRecord={caseRecord} />, size: 'a4' }
    );
  }

  const filteredPages = pages.filter(p => {
    if (group === 'a4') return p.size === 'a4';
    if (group === 'legal') return p.size === 'legal';
    if (group === 'affidavit') return !!p.isAffidavit;
    return false;
  });

  if (filteredPages.length === 0) {
    return <div className="p-10 text-center text-gray-500 font-bold">No documents found for this category ({group}).</div>;
  }

  const containerPageSize = group === 'a4' ? 'A4' : 'Legal';

  return (
    <PrintLayout caseId={caseId} documentId={`bulk-${group}`} pageSize={containerPageSize}>
      {group === 'a4' && (
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
      )}
      <div className="flex flex-col items-center print:block">
        {filteredPages.map((page, index) => {
          const isLandscape = page.orientation === 'landscape';
          return (
            <div 
              key={index} 
              className={`${isLandscape ? 'landscape-page' : ''} mb-8 print:mb-0`}
              style={isLandscape ? { width: '297mm' } : undefined}
            >
              {page.element}
            </div>
          );
        })}
      </div>
    </PrintLayout>
  );
};
