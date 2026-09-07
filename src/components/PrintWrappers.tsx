import React from 'react';
import { useEmployeeContext } from '../contexts/EmployeeContext';
import { Print } from '../pages/Print';
import { UniversalChecklistPrint } from '../pages/print/UniversalChecklistPrint';
import { UniversalCoverPrint } from '../pages/print/UniversalCoverPrint';
import { LeaveAccountProformaPrint } from '../pages/print/LeaveAccountProformaPrint';
import { RetirementPacketPrint } from '../pages/print/RetirementPacketPrint';
import { GPFAdvanceApplicationPrint } from '../pages/print/GPFAdvanceApplicationPrint';
import { GPFSanctionOrderClassIVPrint } from '../pages/print/GPFSanctionOrderClassIVPrint';
import { GPFApplicationForSanctionPrint } from '../pages/print/GPFApplicationForSanctionPrint';
import { PAYF05Print } from '../pages/print/PAYF05Print';
import { PAYF06Print } from '../pages/print/PAYF06Print';
import { PayrollSourceFormsPrint } from '../pages/print/PayrollSourceFormsPrint';
import { GPFClaimVerificationPrint } from '../pages/print/GPFClaimVerificationPrint';
import { GPFPacketPrint } from '../pages/print/GPFPacketPrint';
import { GPFFinalPaymentPrint } from '../pages/print/GPFFinalPaymentPrint';
import { FamilyPensionPacketPrint } from '../pages/print/FamilyPensionPacketPrint';
import { FamilyPensionAffidavitPrint } from '../pages/print/FamilyPensionAffidavitPrint';
import { FamilyPensionMiscPrint } from '../pages/print/FamilyPensionMiscPrint';
import { RegularPensionPacketPrint } from '../pages/print/RegularPensionPacketPrint';
import { NonDrawalPrint } from '../pages/print/NonDrawalPrint';
import { LPRPayFormPrint } from '../pages/print/LPRPayFormPrint';
import { OfficialApplicationsPrint } from '../pages/print/OfficialApplicationsPrint';
import { RetirementSuitePortraitPrint } from '../pages/print/RetirementSuitePortraitPrint';
import { LPRPacketPrint } from '../pages/print/LPRPacketPrint';
import { BenevolentFundPacketPrint } from '../pages/print/BenevolentFundPacketPrint';
import { EEFPacketPrint } from '../pages/print/EEFPacketPrint';
import { RBDCPacketPrint } from '../pages/print/RBDCPacketPrint';
import { FinancialAssistancePacketPrint } from '../pages/print/FinancialAssistancePacketPrint';
import { RetirementSuiteLandscapePrint } from '../pages/print/RetirementSuiteLandscapePrint';
import { RetirementSuiteAffidavitsPrint } from '../pages/print/RetirementSuiteAffidavitsPrint';
import { LetterPrint } from '../features/clerk-desk/components/wordpro/letters/LetterPrint';
import { BulkCasePrint } from '../pages/print/BulkCasePrint';
import { LastPayCertificatePrint } from '../pages/print/LastPayCertificatePrint';
import { LastPayCertificateReversePrint } from '../pages/print/LastPayCertificateReversePrint';
import { LPCPacketPrint } from '../pages/print/LPCPacketPrint';
import { PensionCalculationSheetPrint } from '../pages/print/PensionCalculationSheetPrint';

export const PrintWrapper = () => <Print />;

export const LetterPrintWrapper = () => <LetterPrint />;

export const PensionCalculationSheetPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <PensionCalculationSheetPrint employees={employees} cases={cases} />;
};

export const BulkCasePrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <BulkCasePrint employees={employees} cases={cases} />;
};

export const RetirementSuitePortraitPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <RetirementSuitePortraitPrint employees={employees} cases={cases} />;
};

export const RetirementSuiteLandscapePrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <RetirementSuiteLandscapePrint employees={employees} cases={cases} />;
};

export const RetirementSuiteAffidavitsPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <RetirementSuiteAffidavitsPrint employees={employees} cases={cases} />;
};

export const UniversalChecklistPrintWrapper = ({ type }: { type: 'retirement' | 'gpf' | 'family-pension' | 'rbdc' | 'bf' | 'eef' | 'lpr' | 'financial-assistance' | 'lpc' }) => {
  const { employees, cases } = useEmployeeContext();
  return <UniversalChecklistPrint employees={employees} cases={cases} type={type} />;
};

export const UniversalCoverPrintWrapper = ({ type }: { type: 'retirement' | 'rbdc' | 'bf' | 'eef' | 'lpr' | 'financial-assistance' }) => {
  const { employees, cases } = useEmployeeContext();
  return <UniversalCoverPrint employees={employees} cases={cases} type={type} />;
};

export const LeaveAccountProformaPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <LeaveAccountProformaPrint employees={employees} cases={cases} />;
};

export const RetirementPacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <RetirementPacketPrint employees={employees} cases={cases} />;
};

export const GPFAdvanceApplicationPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <GPFAdvanceApplicationPrint employees={employees} cases={cases} />;
};

export const GPFSanctionOrderClassIVPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <GPFSanctionOrderClassIVPrint employees={employees} cases={cases} />;
};

export const GPFApplicationForSanctionPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <GPFApplicationForSanctionPrint employees={employees} cases={cases} />;
};

export const PAYF05PrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <PAYF05Print employees={employees} cases={cases} />;
};

export const PAYF06PrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <PAYF06Print employees={employees} cases={cases} />;
};

export const PayrollSourceFormsPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <PayrollSourceFormsPrint employees={employees} cases={cases} />;
};

export const GPFClaimVerificationPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <GPFClaimVerificationPrint employees={employees} cases={cases} />;
};

export const GPFFinalPaymentPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <GPFFinalPaymentPrint employees={employees} cases={cases} />;
};

export const GPFPacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <GPFPacketPrint employees={employees} cases={cases} />;
};

export const FamilyPensionPacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <FamilyPensionPacketPrint employees={employees} cases={cases} />;
};

export const FamilyPensionAffidavitPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <FamilyPensionAffidavitPrint employees={employees} cases={cases} />;
};

export const FamilyPensionMiscPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <FamilyPensionMiscPrint employees={employees} cases={cases} />;
};

export const RegularPensionPacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <RegularPensionPacketPrint employees={employees} cases={cases} />;
};

export const NonDrawalPrintWrapper = ({ type }: { type: string }) => {
  const { employees, cases } = useEmployeeContext();
  return <NonDrawalPrint employees={employees} cases={cases} type={type} />;
};

export const LPRPayFormPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <LPRPayFormPrint employees={employees} cases={cases} />;
};

export const OfficialApplicationsPrintWrapper = ({ kind }: { kind: 'rbdc' | 'bf' | 'eef' }) => {
  const { employees, cases } = useEmployeeContext();
  return <OfficialApplicationsPrint employees={employees} cases={cases} kind={kind} />;
};

export const LPRPacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <LPRPacketPrint employees={employees} cases={cases} />;
};

export const BenevolentFundPacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <BenevolentFundPacketPrint employees={employees} cases={cases} />;
};

export const EEFPacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <EEFPacketPrint employees={employees} cases={cases} />;
};

export const RBDCPacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <RBDCPacketPrint employees={employees} cases={cases} />;
};

export const FinancialAssistancePacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <FinancialAssistancePacketPrint employees={employees} cases={cases} />;
};

export const LastPayCertificatePrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <LastPayCertificatePrint employees={employees} cases={cases} />;
};

export const LastPayCertificateReversePrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <LastPayCertificateReversePrint employees={employees} cases={cases} />;
};

export const LPCPacketPrintWrapper = () => {
  const { employees, cases } = useEmployeeContext();
  return <LPCPacketPrint employees={employees} cases={cases} />;
};
