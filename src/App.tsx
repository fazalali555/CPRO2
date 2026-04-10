
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout';

// Contexts & Types
import { ToastProvider } from './contexts/ToastContext';
import { EmployeeProvider } from './contexts/EmployeeContext';
import { APP_NAME } from './config/branding';

// Components
import { SplashGate } from './components/SplashGate';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppIcon } from './components/AppIcon';

// Services
import { BackupService } from './services/BackupService';

// Print Wrappers
import { 
  PrintWrapper, 
  UniversalChecklistPrintWrapper, 
  UniversalCoverPrintWrapper,
  LeaveAccountProformaPrintWrapper,
  RetirementPacketPrintWrapper,
  GPFAdvanceApplicationPrintWrapper,
  GPFSanctionOrderClassIVPrintWrapper,
  GPFApplicationForSanctionPrintWrapper,
  PAYF05PrintWrapper,
  PAYF06PrintWrapper,
  PayrollSourceFormsPrintWrapper,
  GPFClaimVerificationPrintWrapper,
  GPFFinalPaymentPrintWrapper,
  GPFPacketPrintWrapper,
  FamilyPensionPacketPrintWrapper,
  FamilyPensionAffidavitPrintWrapper,
  FamilyPensionMiscPrintWrapper,
  RegularPensionPacketPrintWrapper,
  NonDrawalPrintWrapper,
  LPRPayFormPrintWrapper,
  OfficialApplicationsPrintWrapper
} from './components/PrintWrappers';

// Lazy Loaded Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employees = lazy(() => import('./pages/Employees').then(m => ({ default: m.Employees })));
const PensionCalculator = lazy(() => import('./pages/PensionCalculator').then(m => ({ default: m.PensionCalculator })));
const Benefits = lazy(() => import('./pages/Benefits'));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Cases = lazy(() => import('./pages/Cases').then(m => ({ default: m.Cases })));
const NewCase = lazy(() => import('./pages/NewCase').then(m => ({ default: m.NewCase })));
const CaseDetail = lazy(() => import('./pages/CaseDetail').then(m => ({ default: m.CaseDetail })));
const Calendar = lazy(() => import('./pages/Calendar').then(m => ({ default: m.Calendar })));
const SecureSharing = lazy(() => import('./pages/SecureSharing').then(m => ({ default: m.SecureSharing })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Budgeting = lazy(() => import('./pages/Budgeting').then(m => ({ default: m.Budgeting })));
const LegalAudit = lazy(() => import('./pages/LegalAudit').then(m => ({ default: m.LegalAudit })));
const Administration = lazy(() => import('./pages/Administration').then(m => ({ default: m.Administration })));
const VerifyDocument = lazy(() => import('./pages/VerifyDocument').then(m => ({ default: m.VerifyDocument })));
const Help = lazy(() => import('./pages/Help').then(m => ({ default: m.Help })));
const ClerkDesk = lazy(() => import('./pages/ClerkDesk').then(m => ({ default: m.ClerkDesk })));
const SettingsImportExport = lazy(() => import('./pages/SettingsImportExport').then(m => ({ default: m.SettingsImportExport })));
const SettingsPayrollDb = lazy(() => import('./pages/SettingsPayrollDb').then(m => ({ default: m.SettingsPayrollDb })));
const SettingsRemoveDuplicates = lazy(() => import('./pages/SettingsRemoveDuplicates').then(m => ({ default: m.SettingsRemoveDuplicates })));
const PayrollPdfImport = lazy(() => import('./pages/PayrollPdfImport').then(m => ({ default: m.PayrollPdfImport })));
const SettingsResetData = lazy(() => import('./pages/SettingsResetData').then(m => ({ default: m.SettingsResetData })));

// Loading State Component
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-on-surface-variant text-sm font-medium animate-pulse">Loading experience...</p>
  </div>
);

// Wrapper for normal page transitions
const PageWrapper = ({ children }: React.PropsWithChildren<{}>) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className="h-full"
  >
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </motion.div>
);

// Main App Routes (Wrapped in Splash + Layout)
const MainAppRoutes = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (d: boolean) => void }) => {
  const location = useLocation();
  
  return (
    <SplashGate>
      <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
            <Route path="/employees" element={<PageWrapper><Employees /></PageWrapper>} />
            <Route path="/cases" element={<PageWrapper><Cases /></PageWrapper>} />
            <Route path="/cases/new" element={<PageWrapper><NewCase /></PageWrapper>} />
            <Route path="/cases/:id" element={<PageWrapper><CaseDetail /></PageWrapper>} />
            <Route path="/calendar" element={<PageWrapper><Calendar /></PageWrapper>} />
            <Route path="/sharing" element={<PageWrapper><SecureSharing /></PageWrapper>} />
            
            <Route path="/pension" element={<PageWrapper><PensionCalculator /></PageWrapper>} />
            <Route path="/benefits" element={<PageWrapper><Benefits /></PageWrapper>} />
            
            <Route path="/budgeting" element={<PageWrapper><Budgeting /></PageWrapper>} />
            <Route path="/legal-audit" element={<PageWrapper><LegalAudit /></PageWrapper>} />
            <Route path="/admin" element={<PageWrapper><Administration /></PageWrapper>} />
            <Route path="/clerk-desk" element={<PageWrapper><ClerkDesk /></PageWrapper>} />
            <Route path="/help" element={<PageWrapper><Help /></PageWrapper>} />
            
            <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
            
            {/* Settings Routes */}
            <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
            <Route path="/settings/import-export" element={<PageWrapper><SettingsImportExport /></PageWrapper>} />
            <Route path="/settings/payroll-db" element={<PageWrapper><SettingsPayrollDb /></PageWrapper>} />
            <Route path="/settings/payroll-pdf-import" element={<PageWrapper><PayrollPdfImport /></PageWrapper>} />
            <Route path="/settings/duplicates" element={<PageWrapper><SettingsRemoveDuplicates /></PageWrapper>} />
            <Route path="/settings/reset" element={<PageWrapper><SettingsResetData /></PageWrapper>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </SplashGate>
  );
};

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('kpk_theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('kpk_theme', darkMode ? 'dark' : 'light');
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  useEffect(() => {
    const enabled = localStorage.getItem('kpk_auto_backup_enabled') === 'true';
    if (!enabled) return;
    const last = localStorage.getItem('kpk_auto_backup_at');
    const lastTime = last ? new Date(last).getTime() : 0;
    if (!last || Date.now() - lastTime > 24 * 60 * 60 * 1000) {
      BackupService.createAutoSnapshot();
    }
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <EmployeeProvider>
          <HashRouter>
            <Routes>
               {/* PRINT ROUTES */}
             <Route path="/print/:fileId" element={<PrintWrapper />} />
             <Route path="/print/retirement-checklist/:caseId" element={<UniversalChecklistPrintWrapper type="retirement" />} />
             <Route path="/print/retirement-cover-letter/:caseId" element={<UniversalCoverPrintWrapper type="retirement" />} />
             <Route path="/print/leave-account/:caseId" element={<LeaveAccountProformaPrintWrapper />} />
             <Route path="/print/retirement-packet/:caseId" element={<RetirementPacketPrintWrapper />} />
             <Route path="/print/gpf-checklist/:caseId" element={<UniversalChecklistPrintWrapper type="gpf" />} />
             <Route path="/print/gpf-application/:caseId" element={<GPFAdvanceApplicationPrintWrapper />} />
             <Route path="/print/gpf-sanction-order/:caseId" element={<GPFSanctionOrderClassIVPrintWrapper />} />
             <Route path="/print/gpf-application-for-sanction/:caseId" element={<GPFApplicationForSanctionPrintWrapper />} />
             <Route path="/print/gpf-payf05/:caseId" element={<PAYF05PrintWrapper />} />
             <Route path="/print/gpf-payf06/:caseId" element={<PAYF06PrintWrapper />} />
             <Route path="/print/payroll-source-forms/:formType/:caseId" element={<PayrollSourceFormsPrintWrapper />} />
             <Route path="/print/gpf-gcvp/:caseId" element={<GPFClaimVerificationPrintWrapper />} />
             <Route path="/print/gpf-final-payment/:caseId" element={<GPFFinalPaymentPrintWrapper />} />
             <Route path="/print/gpf-packet/:caseId" element={<GPFPacketPrintWrapper />} />
             
             <Route path="/print/family-pension-packet/:caseId" element={<FamilyPensionPacketPrintWrapper />} />
             <Route path="/print/family-pension-affidavit-1/:caseId" element={<FamilyPensionAffidavitPrintWrapper />} />
             <Route path="/print/family-pension-affidavit-2/:caseId" element={<FamilyPensionAffidavitPrintWrapper />} />
             <Route path="/print/family-pension-affidavit-3/:caseId" element={<FamilyPensionAffidavitPrintWrapper />} />
             <Route path="/print/family-pension-succession/:caseId" element={<FamilyPensionMiscPrintWrapper />} />
             <Route path="/print/family-pension-bank-letter/:caseId" element={<FamilyPensionMiscPrintWrapper />} />
             <Route path="/print/regular-pension-packet/:caseId" element={<RegularPensionPacketPrintWrapper />} />

             <Route path="/print/checklist-family-pension/:caseId" element={<UniversalChecklistPrintWrapper type="family-pension" />} />
             <Route path="/print/checklist-rbdc/:caseId" element={<UniversalChecklistPrintWrapper type="rbdc" />} />
             <Route path="/print/checklist-bf/:caseId" element={<UniversalChecklistPrintWrapper type="bf" />} />
             <Route path="/print/checklist-eef/:caseId" element={<UniversalChecklistPrintWrapper type="eef" />} />
             <Route path="/print/checklist-lpr/:caseId" element={<UniversalChecklistPrintWrapper type="lpr" />} />
             <Route path="/print/checklist-financial-assistance/:caseId" element={<UniversalChecklistPrintWrapper type="financial-assistance" />} />

             <Route path="/print/cover-rbdc/:caseId" element={<UniversalCoverPrintWrapper type="rbdc" />} />
             <Route path="/print/cover-bf/:caseId" element={<UniversalCoverPrintWrapper type="bf" />} />
             <Route path="/print/cover-eef/:caseId" element={<UniversalCoverPrintWrapper type="eef" />} />
             <Route path="/print/cover-lpr/:caseId" element={<UniversalCoverPrintWrapper type="lpr" />} />
             <Route path="/print/cover-financial-assistance/:caseId" element={<UniversalCoverPrintWrapper type="financial-assistance" />} />
             <Route path="/print/rbdc-application/:caseId" element={<OfficialApplicationsPrintWrapper kind="rbdc" />} />
             <Route path="/print/bf-application/:caseId" element={<OfficialApplicationsPrintWrapper kind="bf" />} />
             <Route path="/print/eef-application/:caseId" element={<OfficialApplicationsPrintWrapper kind="eef" />} />
             <Route path="/print/financial-assistance-application/:caseId" element={<UniversalCoverPrintWrapper type="financial-assistance" />} />
            <Route path="/print/lpr-pay-form/:caseId" element={<LPRPayFormPrintWrapper />} />

             <Route path="/print/cert-nondrawal-bf/:caseId" element={<NonDrawalPrintWrapper type="Benevolent Fund" />} />
             <Route path="/print/cert-nondrawal-eef/:caseId" element={<NonDrawalPrintWrapper type="Employees Education Foundation" />} />
            <Route path="/print/cert-nondrawal-lpr/:caseId" element={<NonDrawalPrintWrapper type="LPR" />} />
            <Route path="/print/cert-nondrawal-financial-assistance/:caseId" element={<NonDrawalPrintWrapper type="Financial Assistance" />} />

             <Route path="/verify/:caseId" element={<VerifyDocument />} />

             {/* MAIN APP ROUTES */}
             <Route path="/*" element={<MainAppRoutes darkMode={darkMode} setDarkMode={setDarkMode} />} />
          </Routes>
        </HashRouter>
      </EmployeeProvider>
    </ToastProvider>
  </ErrorBoundary>
);
};

export default App;
