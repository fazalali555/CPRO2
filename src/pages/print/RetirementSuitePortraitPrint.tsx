import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EmployeeRecord, CaseRecord } from '../../types';
import { PrintLayout } from '../../components/PrintLayout';
import { useAutoPrint } from '../../utils/print';

// 1. Retirement Components
import { RetirementChecklist } from '../../forms/retirement/RetirementChecklist';
import { RetirementCoverLetter } from '../../forms/retirement/RetirementCoverLetter';
import { RetirementEmployeeApplication } from '../../forms/retirement/RetirementEmployeeApplication';
import { RetirementClearanceCertificate } from '../../forms/retirement/RetirementClearanceCertificate';
import { RetirementNoDemandCertificate } from '../../forms/retirement/RetirementNoDemandCertificate';
import { RetirementNonInvolvementCertificate } from '../../forms/retirement/RetirementNonInvolvementCertificate';
import { RetirementLeaveNotAvailingCertificate } from '../../forms/retirement/RetirementLeaveNotAvailingCertificate';
import { RetirementQualifyingServiceCertificate } from '../../forms/retirement/RetirementQualifyingServiceCertificate';
import { RetirementServiceCertificate } from '../../forms/retirement/RetirementServiceCertificate';
import { RetirementLegalHeirsList } from '../../forms/retirement/RetirementLegalHeirsList';

// 2. Regular Pension Components
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

// 3. Family Pension Components
import { FamilyPensionTitlePage } from '../../forms/family-pension/FamilyPensionTitlePage';
import { FamilyPensionCoverLetter } from '../../forms/family-pension/FamilyPensionCoverLetter';
import { FamilyPensionApplication } from '../../forms/family-pension/FamilyPensionApplication';
import { FamilyMembersList } from '../../forms/family-pension/FamilyMembersList';
import { FamilyPensionChecklist } from '../../forms/checklists/FamilyPensionChecklist';
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

// 4. GPF Components
import { GPFChecklist } from '../../forms/gpf/GPFChecklist';
import { GPFAdvanceApplication } from '../../forms/gpf/GPFAdvanceApplication';
import { GPFApplicationForSanction } from '../../forms/gpf/GPFApplicationForSanction';
import { GPFSanctionOrderClassIV } from '../../forms/gpf/GPFSanctionOrderClassIV';
import { PAYF05TemporaryLoan } from '../../forms/gpf/PAYF05TemporaryLoan';

// 5. Other Components
import { LPRChecklist } from '../../forms/checklists/LPRChecklist';
import { LPRApplication } from '../../forms/cover-letters/LPRApplication';
import { LPRPayForm } from '../../forms/lpr/LPRPayForm';
import { BenevolentFundChecklist } from '../../forms/checklists/BenevolentFundChecklist';
import { BenevolentFundApplication } from '../../forms/cover-letters/BenevolentFundApplication';
import { BenevolentFundOfficialForm } from '../../forms/official/BenevolentFundOfficialForm';
import { EEFChecklist } from '../../forms/checklists/EEFChecklist';
import { EEFApplication } from '../../forms/cover-letters/EEFApplication';
import { EEFOfficialForm } from '../../forms/official/EEFOfficialForm';
import { RBDCChecklist } from '../../forms/checklists/RBDCChecklist';
import { RBDCApplication } from '../../forms/cover-letters/RBDCApplication';
import { RBDCOfficialForm } from '../../forms/official/RBDCOfficialForm';
import { FinancialAssistanceChecklist } from '../../forms/checklists/FinancialAssistanceChecklist';
import { FinancialAssistanceApplication } from '../../forms/cover-letters/FinancialAssistanceApplication';
import { NonDrawalCertificate } from '../../forms/certificates/NonDrawalCertificate';

import { isDeceasedStatus, isBpsGreaterThan4, isClassIV } from '../../utils';

interface Props {
  employees: EmployeeRecord[];
  cases: CaseRecord[];
}

export const RetirementSuitePortraitPrint: React.FC<Props> = ({ employees, cases }) => {
  const { caseId } = useParams();
  const currentCase = cases.find(c => c.id === caseId);
  const employee = currentCase ? employees.find(e => e.id === currentCase.employee_id) : null;
  const isDeceased = isDeceasedStatus(employee?.employees?.status);

  const relatedCases = useMemo(() => {
    if (!employee) return [];
    return cases.filter(c => c.employee_id === employee.id);
  }, [employee, cases]);

  const findCase = (type: string) => {
    if (currentCase?.case_type === 'full_pension') return currentCase;
    return relatedCases.find(c => c.case_type === type);
  };

  useEffect(() => {
    if (employee) {
      document.title = `Portrait Suite - ${employee.employees.name}`;
    }
  }, [employee]);

  useAutoPrint(!!employee, 3000);

  if (!employee || !currentCase) return <div className="p-10 text-center text-red-600 font-bold">Error: Required data not found.</div>;

  const pages: React.ReactNode[] = [];

  // --- 2. PENSION CASE (Regular or Family) ---
  const penCase = findCase('pension');
  if (penCase) {
    if (isDeceased) {
      pages.push(
        <FamilyPensionChecklist key="fp-chk" employee={employee} caseRecord={penCase} />,
        <FamilyPensionTitlePage key="fp-tp" employee={employee} />,
        <FamilyPensionCoverLetter key="fp-cov" employee={employee} caseRecord={penCase} />,
        <FamilyPensionApplication key="fp-app" employee={employee} caseRecord={penCase} />,
        <FamilyMembersList key="fp-fml" employee={employee} />,
        <FamilyPensionInServiceDeathData key="fp-isdd" employee={employee} caseRecord={penCase} />,
        <FamilyPensionSanctionAuthority key="fp-sa" employee={employee} />,
        <PostRetirementApplication key="fp-pra" employee={employee} />,
        <PostRetirementSignatures key="fp-prs" employee={employee} />,
        <FamilyPensionSanctionOrder key="fp-so" employee={employee} />,
        <DescriptiveRoll key="fp-dr" employee={employee} />,
        <FamilyNoDemandCertificate key="fp-ndc" employee={employee} />,
        <FamilyUndertakingRecovery key="fp-ur" employee={employee} />,
        <FamilyNonInvolvement key="fp-ni" employee={employee} />,
        <FamilyClearance key="fp-fcl" employee={employee} />,
        <NonMarriageCertificate key="fp-nmc" employee={employee} />,
        <LifeCertificate key="fp-lc" employee={employee} />,
        <DCSOptionForm key="fp-dcs" employee={employee} />,
        <RetirementLegalHeirsList key="fp-lhl" employee={employee} caseRecord={penCase} />
      );
    } else {
      pages.push(
        <RetirementChecklist key="rp-chk" employee={employee} caseRecord={penCase} />,
        <RegularTitlePage key="rp-tp" employee={employee} />,
        <RegularCoverLetter key="rp-cov" employee={employee} caseRecord={penCase} />,
        <PensionApplication key="rp-app" employee={employee} />,
        <PensionUndertaking key="rp-ut" employee={employee} />,
        <PensionSanctionOrder key="rp-so1" employee={employee} />,
        <PensionSanctionOrderPage2 key="rp-so2" employee={employee} />,
        <SpecimenSignaturePage key="rp-ssp" employee={employee} />,
        <PensionCertificatesA key="rp-ca" employee={employee} />,
        <LastPayCertificate key="rp-lpc1" employee={employee} />,
        <LastPayCertificateReverse key="rp-lpc2" employee={employee} />,
        <PensionCertificatesB key="rp-cb" employee={employee} />,
        <RegularDCSOption key="rp-dcs" employee={employee} />
      );
    }
  }

  // --- 3. GPF CASE ---
  const gpfCase = findCase('gpf_final') || findCase('gpf_non_refundable') || findCase('gpf_refundable');
  if (gpfCase) {
    pages.push(<GPFChecklist key="gpf-chk" employee={employee} caseRecord={gpfCase} />);
    if (isBpsGreaterThan4(employee.employees.bps)) pages.push(<GPFApplicationForSanction key="gpf-san" employeeRecord={employee} caseRecord={gpfCase} />);
    if (isClassIV(employee.employees.bps)) pages.push(<GPFSanctionOrderClassIV key="gpf-soc" employeeRecord={employee} caseRecord={gpfCase} />);
    pages.push(<GPFAdvanceApplication key="gpf-app" employeeRecord={employee} caseRecord={gpfCase} />);
    if (gpfCase.case_type === 'gpf_refundable') pages.push(<PAYF05TemporaryLoan key="gpf-f05" employeeRecord={employee} caseRecord={gpfCase} />);
  }

  // --- 4. LPR CASE ---
  const lprCase = findCase('lpr');
  if (lprCase) {
    pages.push(
      <LPRChecklist key="lpr-chk" employee={employee} caseRecord={lprCase} />,
      <LPRApplication key="lpr-cov" employee={employee} caseRecord={lprCase} />,
      <NonDrawalCertificate key="lpr-ndc" employee={employee} type="LPR" />
    );
  }

  // --- 5. BF CASE ---
  const bfCase = findCase('benevolent_fund');
  if (bfCase) {
    pages.push(
      <BenevolentFundChecklist key="bf-chk" employee={employee} caseRecord={bfCase} />,
      <BenevolentFundApplication key="bf-cov" employee={employee} caseRecord={bfCase} />,
      <NonDrawalCertificate key="bf-ndc" employee={employee} type="Benevolent Fund" />,
      <NonDrawalCertificate key="bf-cont" employee={employee} type="Contribution" />,
      <BenevolentFundOfficialForm key="bf-off" employee={employee} caseRecord={bfCase} />
    );
  }

  // --- 6. RBDC CASE ---
  const rbdcCase = findCase('rbdc');
  if (rbdcCase) {
    pages.push(
      <RBDCChecklist key="rbdc-chk" employee={employee} caseRecord={rbdcCase} />,
      <RBDCApplication key="rbdc-cov" employee={employee} caseRecord={rbdcCase} />,
      <RBDCOfficialForm key="rbdc-off" employee={employee} caseRecord={rbdcCase} />
    );
  }

  // --- 7. EEF CASE ---
  const eefCase = findCase('eef');
  if (eefCase) {
    pages.push(
      <EEFChecklist key="eef-chk" employee={employee} caseRecord={eefCase} />,
      <EEFApplication key="eef-cov" employee={employee} caseRecord={eefCase} />,
      <NonDrawalCertificate key="eef-ndc" employee={employee} type="Employees Education Foundation" />,
      <EEFOfficialForm key="eef-off" employee={employee} caseRecord={eefCase} />
    );
  }

  const faCase = findCase('financial_assistance');
  if (faCase) {
    pages.push(
      <FinancialAssistanceChecklist key="fa-chk" employee={employee} caseRecord={faCase} />,
      <NonDrawalCertificate key="fa-ndc" employee={employee} type="Financial Assistance" />,
      <FinancialAssistanceApplication key="fa-cov" employee={employee} caseRecord={faCase} />
    );
  }

  return (
    <PrintLayout caseId={caseId} documentId="suite-portrait">
      <div className="flex flex-col items-center print:block">
        {pages.map((page, index) => (
          <div key={index} className="print-page mb-8 print:mb-0 print:break-after-page last:print:break-after-auto">
            {page}
          </div>
        ))}
      </div>
    </PrintLayout>
  );
};
