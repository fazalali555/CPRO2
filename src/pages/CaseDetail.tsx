
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CaseRecord, EmployeeRecord, CaseStatus, CaseDocument, CaseChecklistItem, PdfTemplate } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, Badge, Checkbox, TextField } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { useToast } from '../contexts/ToastContext';
import { 
  getFileFromIDB, 
  saveFileToIDB,
  generateFilledPdf,
  getRetirementType, 
  getOfficialRetirementChecklist, 
  getOfficialGPFChecklist, 
  getFamilyPensionChecklist,
  getRBDCChecklist,
  getBenevolentFundChecklist,
  getEEFChecklist,
  getLPRChecklist,
  getFinancialAssistanceChecklist,
  getGPFEligibilityWarnings,
  formatCurrency,
  isClassIV,
  isBpsGreaterThan4,
  isDeceasedStatus
} from '../utils';
import clsx from 'clsx';
// Existing Forms
import { RetirementChecklist } from '../forms/retirement/RetirementChecklist';
import { RetirementCoverLetter } from '../forms/retirement/RetirementCoverLetter';
import { RetirementEmployeeApplication } from '../forms/retirement/RetirementEmployeeApplication';
import { RetirementClearanceCertificate } from '../forms/retirement/RetirementClearanceCertificate';
import { RetirementNoDemandCertificate } from '../forms/retirement/RetirementNoDemandCertificate';
import { RetirementNonInvolvementCertificate } from '../forms/retirement/RetirementNonInvolvementCertificate';
import { RetirementLeaveNotAvailingCertificate } from '../forms/retirement/RetirementLeaveNotAvailingCertificate';
import { RetirementQualifyingServiceCertificate } from '../forms/retirement/RetirementQualifyingServiceCertificate';
import { RetirementServiceCertificate } from '../forms/retirement/RetirementServiceCertificate';
import { RetirementLegalHeirsList } from '../forms/retirement/RetirementLegalHeirsList';
import { LeaveAccountProforma } from '../forms/retirement/LeaveAccountProforma';
import { GPFChecklist } from '../forms/gpf/GPFChecklist';
import { GPFAdvanceApplication } from '../forms/gpf/GPFAdvanceApplication';
import { GPFSanctionOrderClassIV } from '../forms/gpf/GPFSanctionOrderClassIV';
import { GPFApplicationForSanction } from '../forms/gpf/GPFApplicationForSanction';
import { PAYF05TemporaryLoan } from '../forms/gpf/PAYF05TemporaryLoan';
import { PAYF06PermanentLoan } from '../forms/gpf/PAYF06PermanentLoan';
import { GPFClaimVerificationProforma } from '../forms/gpf/GPFClaimVerificationProforma';
import { DocumentThumbnail } from '../components/DocumentThumbnail';
import { FamilyPensionTitlePage } from '../forms/family-pension/FamilyPensionTitlePage';
import { FamilyPensionApplication } from '../forms/family-pension/FamilyPensionApplication';
import { Affidavit1 } from '../forms/family-pension/Affidavit1';
import { Affidavit2 } from '../forms/family-pension/Affidavit2';
import { Affidavit3 } from '../forms/family-pension/Affidavit3';
import { RegularTitlePage } from '../forms/regular-pension/RegularTitlePage';
import { RegularCoverLetter } from '../forms/regular-pension/RegularCoverLetter';
import { FamilyMembersList } from '../forms/family-pension/FamilyMembersList';
import { SuccessionCertificate } from '../forms/family-pension/SuccessionCertificate';
import { BankAccountLetter } from '../forms/family-pension/BankAccountLetter';

// New Checklists
import { FamilyPensionChecklist } from '../forms/checklists/FamilyPensionChecklist';
import { RBDCChecklist } from '../forms/checklists/RBDCChecklist';
import { BenevolentFundChecklist } from '../forms/checklists/BenevolentFundChecklist';
import { EEFChecklist } from '../forms/checklists/EEFChecklist';
import { LPRChecklist } from '../forms/checklists/LPRChecklist';
import { FinancialAssistanceChecklist } from '../forms/checklists/FinancialAssistanceChecklist';

// New Official Applications
import { RBDCOfficialForm } from '../forms/official/RBDCOfficialForm';
import { EEFOfficialForm } from '../forms/official/EEFOfficialForm';
import { BenevolentFundOfficialForm } from '../forms/official/BenevolentFundOfficialForm';

// Cover Letters
import { LPRApplication } from '../forms/cover-letters/LPRApplication';
import { LPRPayForm } from '../forms/lpr/LPRPayForm';
import { FinancialAssistanceApplication } from '../forms/cover-letters/FinancialAssistanceApplication';
import { RBDCApplication } from '../forms/cover-letters/RBDCApplication';
import { BenevolentFundApplication } from '../forms/cover-letters/BenevolentFundApplication';
import { EEFApplication } from '../forms/cover-letters/EEFApplication';

// Certificates
import { NonDrawalCertificate } from '../forms/certificates/NonDrawalCertificate';

// Payroll Forms
import { Form1 } from '../forms/payroll/Form1';
import { PayrollAmendmentSingleForm } from '../forms/payroll/PayrollAmendmentSingleForm';
import { PayrollAmendmentMultiForm } from '../forms/payroll/PayrollAmendmentMultiForm';
import { QRCode } from '../components/QRCode';
import { securityService, auditService } from '../services/SecurityService';

import { useEmployeeContext } from '../contexts/EmployeeContext';

export const CaseDetail: React.FC = () => {
  const { cases, employees, updateCase: onUpdateCase, updateEmployee: onUpdateEmployee } = useEmployeeContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'notes'>('overview');
  const [noteText, setNoteText] = useState('');
  const [docName, setDocName] = useState('');
  const [showProgress, setShowProgress] = useState(false);
  const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);
  const versionInputRef = useRef<HTMLInputElement>(null);
  
  // Track expanded document ID for accordion view
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  
  // Templates state
  const [availableTemplates, setAvailableTemplates] = useState<PdfTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(null);
  const [manualFieldValues, setManualFieldValues] = useState<Record<string, string>>({});
  
  // Scroll ref for expanded view
  const expandedViewRef = useRef<HTMLDivElement>(null);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const caseRec = cases.find(c => c.id === id);
  const employee = caseRec ? employees.find(e => e.id === caseRec.employee_id) : null;

  const isRetirement = caseRec?.case_type === 'retirement';
  const isGPF = caseRec?.case_type?.startsWith('gpf');
  const isPension = caseRec?.case_type === 'pension';
  const isPayroll = caseRec?.case_type === 'payroll';
  const isDeceased = isDeceasedStatus(employee?.employees?.status);
  const isDeceasedPension = isPension && isDeceased;
  const isRegularPension = isPension && !isDeceased;

  // --- Auto-scroll to top-left when expanded ---
  useEffect(() => {
    if (expandedDocId && expandedViewRef.current) {
      expandedViewRef.current.scrollLeft = 0;
      expandedViewRef.current.scrollTop = 0;
    }
  }, [expandedDocId]);

  // Load templates
  useEffect(() => {
    const saved = localStorage.getItem('clerk_pro_rpms_templates');
    if (saved && caseRec) {
      const allTemplates: PdfTemplate[] = JSON.parse(saved);
      // Filter templates by case type
      setAvailableTemplates(allTemplates.filter(t => t.case_type === caseRec.case_type || t.case_type === 'other'));
    }
  }, [caseRec?.case_type]);

  const handleGenerateFromTemplate = async (template: PdfTemplate, fieldValues?: Record<string, string>) => {
    if (!caseRec || !employee) return;
    
    try {
      // If template has manual fields and fieldValues not provided, show modal
      const manualFields = Object.entries(template.fieldMappings || {})
        .filter(([_, mapping]) => mapping === 'manual')
        .map(([pdfField]) => pdfField);

      if (manualFields.length > 0 && !fieldValues) {
        setSelectedTemplate(template);
        const initialValues: Record<string, string> = {};
        manualFields.forEach(f => {
          initialValues[f] = (caseRec.extras?.[`field_${f}`] as string) || '';
        });
        setManualFieldValues(initialValues);
        setShowTemplateModal(true);
        return;
      }

      const data = await getFileFromIDB(template.fileId);
      if (!data) throw new Error('Template file not found');
      
      showToast(`Generating ${template.name}...`, 'info');
      
      // Update case with manual fields if provided
      let updatedCase = { ...caseRec };
      if (fieldValues) {
        const newExtras = { ...caseRec.extras };
        Object.entries(fieldValues).forEach(([field, value]) => {
          newExtras[`field_${field}`] = value;
        });
        updatedCase.extras = newExtras;
      }
      
      // The generateFilledPdf utility handles the mapping logic
      const pdfBytes = await generateFilledPdf(data as any, employee, updatedCase);
      
      const fileId = `doc_${Date.now()}`;
      await saveFileToIDB(fileId, pdfBytes);
      
      const newDoc: CaseDocument = {
        id: Date.now().toString(),
        name: template.name,
        kind: 'generated',
        mimeType: 'application/pdf',
        size: pdfBytes.length,
        createdAt: new Date().toISOString(),
        status: 'draft',
        version: 1,
        fileId: fileId
      };
      
      onUpdateCase({
        ...updatedCase,
        documents: [...updatedCase.documents, newDoc],
        updatedAt: new Date().toISOString()
      });
      
      showToast(`${template.name} generated successfully`, 'success');
      setShowTemplateModal(false);
      setSelectedTemplate(null);
    } catch (e) {
      console.error(e);
      showToast('Generation failed: ' + (e as Error).message, 'error');
    }
  };

  // --- VERSION CONTROL LOGIC ---
  const createNewVersion = async (doc: CaseDocument, file: Blob | Uint8Array) => {
    if (!caseRec) return;
    
    const versionId = `doc_${Date.now()}_v${doc.version + 1}`;
    await saveFileToIDB(versionId, file instanceof Blob ? new Uint8Array(await file.arrayBuffer()) : file);

    const updatedDoc: CaseDocument = {
      ...doc,
      id: Date.now().toString(),
      version: doc.version + 1,
      previousVersionId: doc.fileId,
      fileId: versionId,
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    onUpdateCase({
      ...caseRec,
      documents: caseRec.documents.map(d => d.id === doc.id ? updatedDoc : d),
      updatedAt: new Date().toISOString()
    });
    
    showToast(`Created version ${updatedDoc.version} for ${doc.name}`, 'success');
  };

  const finalizeDocument = (docId: string) => {
    if (!caseRec) return;
    onUpdateCase({
      ...caseRec,
      documents: caseRec.documents.map(d => d.id === docId ? { ...d, status: 'final' } : d),
      updatedAt: new Date().toISOString()
    });
    showToast('Document marked as final', 'success');
  };

  // --- DIGITAL SIGNATURE LOGIC ---
  const signDocument = (docId: string) => {
    if (!caseRec) return;
    const user = securityService.getCurrentUser();
    if (!user) return;

    // Simulate digital signature (in production this would use a private key)
    const signatureData = `SIGNED_BY_${user.name}_AT_${new Date().toISOString()}_ROLE_${user.role}`;
    
    onUpdateCase({
      ...caseRec,
      documents: caseRec.documents.map(d => d.id === docId ? {
        ...d,
        status: 'signed',
        signature: {
          signedBy: user.name,
          signedAt: new Date().toISOString(),
          data: btoa(signatureData)
        }
      } : d),
      updatedAt: new Date().toISOString()
    });
    
    auditService.log('SIGN_DOCUMENT', `Signed document ${docId} in case ${caseRec.id}`, caseRec.id);
    showToast('Document signed successfully', 'success');
  };

  // --- Checklist Sync Logic (Universal) ---
  useEffect(() => {
    if (!caseRec || !employee) return;

    let officialList: CaseChecklistItem[] = [];

    switch (caseRec.case_type) {
      case 'retirement':
        officialList = getOfficialRetirementChecklist(employee, caseRec);
        break;
      case 'pension':
        // If deceased, use Family Pension, otherwise fallback to Retirement (as regular pension checklist is same as retirement typically)
        if (isDeceasedStatus(employee.employees?.status)) {
           officialList = getFamilyPensionChecklist();
        } else {
           // Regular pension usually uses the retirement checklist in this domain
           officialList = getOfficialRetirementChecklist(employee, caseRec);
        }
        break;
      case 'gpf_refundable':
      case 'gpf_non_refundable':
      case 'gpf_final':
        officialList = getOfficialGPFChecklist(caseRec.case_type, employee);
        break;
      case 'rbdc':
        officialList = getRBDCChecklist();
        break;
      case 'benevolent_fund':
        officialList = getBenevolentFundChecklist(employee.employees?.status === 'Deceased');
        break;
      case 'eef':
        officialList = getEEFChecklist();
        break;
      case 'lpr':
        officialList = getLPRChecklist();
        break;
      case 'financial_assistance':
        officialList = getFinancialAssistanceChecklist();
        break;
      default:
        // Keep existing if no official list
        break;
    }

    if (officialList.length > 0) {
      let changed = false;
      if (officialList.length !== caseRec.checklist.length) {
        changed = true;
      } else {
        for(let i=0; i<officialList.length; i++) {
          if (officialList[i].id !== caseRec.checklist[i].id) {
            changed = true;
            break;
          }
        }
      }

      if (changed) {
        const mergedChecklist = officialList.map(officialItem => {
          const byId = caseRec.checklist.find(c => c.id === officialItem.id);
          if (byId) return { ...officialItem, done: byId.done };
          const byLabel = caseRec.checklist.find(c => c.label.trim().toLowerCase() === officialItem.label.trim().toLowerCase());
          if (byLabel) return { ...officialItem, done: byLabel.done };
          return officialItem;
        });
        setTimeout(() => {
           onUpdateCase({ ...caseRec, checklist: mergedChecklist });
        }, 0);
      }
    }
  }, [
    caseRec?.id, 
    caseRec?.case_type,
    caseRec?.checklist.length, 
    caseRec?.extras?.nature_of_retirement, 
    employee?.employees?.status,
    employee?.employees?.bps
  ]);

  // --- Migration Logic: Leave Taken ---
  useEffect(() => {
    if (caseRec && employee && onUpdateEmployee) {
       const caseVal = Number(caseRec.extras?.leave_taken_days);
       if (caseVal > 0 && !employee.service_history.leave_taken_days) {
          const updatedEmp = {
            ...employee,
            service_history: {
              ...employee.service_history,
              leave_taken_days: caseVal
            }
          };
          setTimeout(() => {
             onUpdateEmployee(updatedEmp);
          }, 0);
       }
    }
  }, [caseRec?.id, employee?.id]); 

  if (!caseRec || !employee) return <div className="p-8 text-center">Case not found</div>;

  const updateStatus = (s: CaseStatus) => {
    onUpdateCase({ ...caseRec, status: s, updatedAt: new Date().toISOString() });
    showToast(`Status updated to ${s.replace('_', ' ')}`, 'success');
  };

  const toggleCheck = (itemId: string) => {
    const updatedChecklist = caseRec.checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i);
    onUpdateCase({ ...caseRec, checklist: updatedChecklist, updatedAt: new Date().toISOString() });
  };
  
  const resetChecklist = () => {
    if (confirm('Reset all checklist items to "Not Done"?')) {
      const updatedChecklist = caseRec.checklist.map(i => ({ ...i, done: false }));
      onUpdateCase({ ...caseRec, checklist: updatedChecklist, updatedAt: new Date().toISOString() });
      showToast('Checklist reset', 'info');
    }
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    const newNote = { id: Date.now().toString(), at: new Date().toISOString(), text: noteText };
    onUpdateCase({ ...caseRec, notes: [...(caseRec.notes || []), newNote] });
    setNoteText('');
  };

  const handleUploadClick = () => {
    if (!docName.trim()) {
      showToast('Please enter a document name first', 'error');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleScanClick = () => {
    if (!docName.trim()) {
      setDocName(`Scanned Document ${new Date().toLocaleDateString()}`);
    }
    scanInputRef.current?.click();
  };

  // --- Version Control Handlers ---
  const handleUpdateVersionClick = (docId: string) => {
    setUpdatingDocId(docId);
    versionInputRef.current?.click();
  };

  const handleVersionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !updatingDocId) return;

    const doc = caseRec?.documents.find(d => d.id === updatingDocId);
    if (doc) {
      await createNewVersion(doc, file);
    }

    setUpdatingDocId(null);
    if (versionInputRef.current) versionInputRef.current.value = '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileId = `doc_${Date.now()}`;
      const buffer = await file.arrayBuffer();
      await saveFileToIDB(fileId, new Uint8Array(buffer));

      const newDoc: CaseDocument = { 
         id: Date.now().toString(), 
         name: docName, 
         kind: 'uploaded', 
         createdAt: new Date().toISOString(),
         fileName: file.name,
         mimeType: file.type,
         size: file.size,
         fileId: fileId,
         version: 1,
         status: 'draft'
      };
      
      onUpdateCase({ ...caseRec, documents: [...caseRec.documents, newDoc] });
      setDocName('');
      showToast('Document uploaded successfully', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to save document', 'error');
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleScanChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = docName.trim() || `Scanned Document ${new Date().toLocaleDateString()}`;

    try {
      const fileId = `doc_${Date.now()}`;
      const buffer = await file.arrayBuffer();
      await saveFileToIDB(fileId, new Uint8Array(buffer));

      const newDoc: CaseDocument = { 
         id: Date.now().toString(), 
         name, 
         kind: 'uploaded', 
         createdAt: new Date().toISOString(),
         fileName: file.name,
         mimeType: file.type,
         size: file.size,
         fileId: fileId,
         version: 1,
         status: 'draft'
      };
      
      onUpdateCase({ ...caseRec, documents: [...caseRec.documents, newDoc] });
      setDocName('');
      showToast('Scan saved successfully', 'success');
    } catch (error) {
      console.error(error);
      showToast('Failed to save scan', 'error');
    }
    
    if (scanInputRef.current) scanInputRef.current.value = '';
  };

  const updateExtra = (key: string, val: any) => {
    onUpdateCase({
      ...caseRec,
      extras: { ...caseRec.extras, [key]: val },
      updatedAt: new Date().toISOString()
    });
  };

  const handleRetirementTypeChange = (val: string) => {
    updateExtra('nature_of_retirement', val);
  };

  // --- Payroll Entry Management ---
  const [selectedEmpForPayroll, setSelectedEmpForPayroll] = useState('');
  
  const addPayrollEntry = () => {
    if (!selectedEmpForPayroll) return;
    const emp = employees.find(e => e.id === selectedEmpForPayroll);
    if (!emp) return;
    
    // Calculate gross salary from financials
    const gross = (emp.financials.last_basic_pay || 0) + 
                  (emp.financials.hra || 0) + 
                  (emp.financials.ca || 0) + 
                  (emp.financials.ma || 0) + 
                  (emp.financials.uaa || 0) +
                  (emp.financials.adhoc_2024_25 || 0);
    
    const newEntry = {
      employee_id: emp.id,
      personnel_no: emp.employees.personal_no,
      name: emp.employees.name,
      cnic: emp.employees.cnic_no,
      absent_days: 0,
      gross_salary: gross,
      deduction_amount: 0,
      reason: 'Deductions',
      remarks: ''
    };
    
    const currentEntries = caseRec.extras?.payroll_entries || [];
    if (currentEntries.find((e: any) => e.employee_id === emp.id)) {
      showToast('Employee already added', 'warning');
      return;
    }
    
    onUpdateCase({
      ...caseRec,
      extras: { 
        ...caseRec.extras, 
        payroll_entries: [...currentEntries, newEntry] 
      },
      updatedAt: new Date().toISOString()
    });
    setSelectedEmpForPayroll('');
    showToast('Employee added to payroll list', 'success');
  };

  const removePayrollEntry = (empId: string) => {
    const currentEntries = caseRec.extras?.payroll_entries || [];
    updateExtra('payroll_entries', currentEntries.filter((e: any) => e.employee_id !== empId));
  };

  const updatePayrollEntry = (empId: string, field: string, value: any) => {
    const currentEntries = caseRec.extras?.payroll_entries || [];
    const updated = currentEntries.map((e: any) => {
      if (e.employee_id === empId) {
        const newE = { ...e, [field]: value };
        if (field === 'absent_days' || field === 'gross_salary') {
          newE.deduction_amount = Math.round((Number(newE.gross_salary) / 30) * Number(newE.absent_days));
        }
        return newE;
      }
      return e;
    });
    updateExtra('payroll_entries', updated);
  };

  // --- Source II (Amendment) Management ---
  const addAmendmentRow = () => {
    const current = caseRec.extras?.amendments || [];
    const newRow = { infoType: '', fieldId: '', newContent: '', wageType: '', amount: 0 };
    updateExtra('amendments', [...current, newRow]);
  };

  const removeAmendmentRow = (idx: number) => {
    const current = caseRec.extras?.amendments || [];
    updateExtra('amendments', current.filter((_: any, i: number) => i !== idx));
  };

  const updateAmendmentRow = (idx: number, field: string, value: any) => {
    const current = [...(caseRec.extras?.amendments || [])];
    current[idx] = { ...current[idx], [field]: value };
    updateExtra('amendments', current);
  };
  
  const handlePrintDocument = (docId: string, route: string) => {
    const updatedExtras = { ...caseRec.extras };
    if (!updatedExtras.documents_status) updatedExtras.documents_status = {};
    const now = new Date().toISOString();
    const existing = updatedExtras.documents_status[docId] || {};
    updatedExtras.documents_status[docId] = {
      ...existing,
      generatedAt: existing.generatedAt || now,
      printedAt: now,
      printedBy: 'User'
    };
    onUpdateCase({ ...caseRec, extras: updatedExtras, updatedAt: now });
    window.open(`#/print/${route}/${caseRec.id}`, '_blank');
  };
  
  const handlePreviewDocument = (docId: string) => {
    setExpandedDocId(docId);
    const updatedExtras = { ...caseRec.extras };
    if (!updatedExtras.documents_status) updatedExtras.documents_status = {};
    if (!updatedExtras.documents_status[docId]?.generatedAt) {
       const now = new Date().toISOString();
       updatedExtras.documents_status[docId] = { ...updatedExtras.documents_status[docId], generatedAt: now };
       onUpdateCase({ ...caseRec, extras: updatedExtras, updatedAt: now });
    }
  };

  const checklistProgress = Math.round((caseRec.checklist.filter(i => i.done).length / Math.max(1, caseRec.checklist.length)) * 100);
  const currentRetirementType = getRetirementType(employee, caseRec);

  // Grouping for Display (Retirement Checklist)
  const renderChecklist = () => {
    if (!isRetirement) {
      return (
        <div className="space-y-2 border-t border-outline-variant/30 pt-3">
          {caseRec.checklist.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-surface-variant/50 rounded transition-colors group">
                <div className="pt-1">
                   <Checkbox label="" checked={item.done} onChange={() => toggleCheck(item.id)} />
                </div>
                <div className={clsx("flex-1 text-sm pt-0.5", item.done && "text-on-surface-variant line-through opacity-70")}>
                  {item.label} {item.required && <span className="text-error ml-1">*</span>}
                </div>
            </div>
          ))}
        </div>
      );
    }

    const groups = [
      { title: 'Base Documents (1-14)', range: [1, 14] },
      { title: 'Medical Grounds', range: [15, 15] },
      { title: 'Deceased / Death Case', range: [16, 22] },
      { title: 'BPS-16 & Above', range: [23, 26] },
    ];

    return (
      <div className="space-y-4 border-t border-outline-variant/30 pt-3">
        {groups.map(g => {
          const items = caseRec.checklist.filter(c => {
            const idNum = parseInt(c.id, 10);
            return !isNaN(idNum) && idNum >= g.range[0] && idNum <= g.range[1];
          });
          if (items.length === 0) return null;
          return (
            <div key={g.title}>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 px-2">{g.title}</h4>
              <div className="space-y-1">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-surface-variant/50 rounded transition-colors group">
                      <span className="text-[10px] font-mono font-bold text-on-surface-variant w-5 pt-1.5">{item.id}.</span>
                      <Checkbox label="" checked={item.done} onChange={() => toggleCheck(item.id)} className="mt-1" />
                      <div className={clsx("flex-1 text-sm leading-tight pt-0.5", item.done && "text-on-surface-variant line-through opacity-70")}>
                        {item.label}
                      </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- GPF Warning/Advisory System ---
  const gpfWarnings = isGPF ? getGPFEligibilityWarnings(caseRec, employee) : [];

  // --- Payroll Validation ---
  const getPayrollWarnings = () => {
    if (!isPayroll) return [];
    const warnings = [];
    
    // Universal checks
    if (!employee.employees.personal_no) warnings.push({ type: 'error', message: 'Personnel Number is missing' });
    if (!employee.employees.cnic_no) warnings.push({ type: 'error', message: 'CNIC Number is missing' });
    if (!employee.employees.ddo_code) warnings.push({ type: 'error', message: 'DDO Code is missing' });
    
    // Source I (Master File) specific checks
    if (!employee.employees.father_name) warnings.push({ type: 'warning', message: 'Source I: Father Name is missing' });
    if (!employee.employees.dob) warnings.push({ type: 'warning', message: 'Source I: Date of Birth is missing' });
    if (!employee.employees.bank_name || !employee.employees.bank_ac_no) warnings.push({ type: 'error', message: 'Source I: Bank details (Name/Account) are missing' });
    if (!employee.service_history.date_of_entry) warnings.push({ type: 'warning', message: 'Source I: Date of Entry is missing' });
    if (!employee.service_history.date_of_appointment) warnings.push({ type: 'warning', message: 'Source I: Date of Appointment is missing' });
    
    // Source II (Amendments) specific checks
    const amendments = caseRec.extras?.amendments || [];
    if (amendments.length > 0) {
      amendments.forEach((row: any, idx: number) => {
        if (!row.infoType) warnings.push({ type: 'warning', message: `Source II: Info Type missing on row ${idx + 1}` });
        if (!row.fieldId) warnings.push({ type: 'warning', message: `Source II: Field ID missing on row ${idx + 1}` });
        if (!row.newContent) warnings.push({ type: 'warning', message: `Source II: New Content missing on row ${idx + 1}` });
      });
    }

    // Source III (Multi-Employee) specific checks
    const entries = caseRec.extras?.payroll_entries || [];
    if (entries.length === 0) {
      warnings.push({ type: 'warning', message: 'Source III: No employees added for Multi-Employee Deduction' });
    } else {
      entries.forEach((e: any, idx: number) => {
        if (!e.absent_days || e.absent_days <= 0) warnings.push({ type: 'warning', message: `Source III: Absent days missing for ${e.name}` });
        if (!e.gross_salary || e.gross_salary <= 0) warnings.push({ type: 'error', message: `Source III: Gross salary missing for ${e.name}` });
      });
    }
    
    return warnings;
  };
  const payrollWarnings = getPayrollWarnings();

  // --- Document Definitions ---
  let documentsList: { id: string; title: string; route: string; Component: React.ReactNode; orientation?: 'landscape' | 'portrait' }[] = [];

  if (isRetirement) {
    documentsList = [
      { id: 'checklist', title: '1. Retirement Checklist', route: 'retirement-checklist', Component: <RetirementChecklist employee={employee} caseRecord={caseRec} /> },
      { id: 'cover', title: '2. Cover Letter', route: 'retirement-cover-letter', Component: <RetirementCoverLetter employee={employee} caseRecord={caseRec} /> },
      { id: 'application', title: '3. Employee Application', route: 'retirement-packet', Component: <RetirementEmployeeApplication employee={employee} caseRecord={caseRec} /> },
      { id: 'clearance', title: '4. Clearance Certificate', route: 'retirement-packet', Component: <RetirementClearanceCertificate employee={employee} caseRecord={caseRec} /> },
      { id: 'nodemand', title: '5. No Demand Certificate', route: 'retirement-packet', Component: <RetirementNoDemandCertificate employee={employee} caseRecord={caseRec} /> },
      { id: 'noninvolvement', title: '6. Non-Involvement Certificate', route: 'retirement-packet', Component: <RetirementNonInvolvementCertificate employee={employee} caseRecord={caseRec} /> },
      { id: 'leavenotavail', title: '7. Leave Not Availing', route: 'retirement-packet', Component: <RetirementLeaveNotAvailingCertificate employee={employee} caseRecord={caseRec} /> },
      { id: 'qualifying', title: '8. Qualifying Service Cert', route: 'retirement-packet', Component: <RetirementQualifyingServiceCertificate employee={employee} caseRecord={caseRec} /> },
      { id: 'servicecert', title: '9. Service Certificate', route: 'retirement-packet', Component: <RetirementServiceCertificate employee={employee} caseRecord={caseRec} /> },
      { id: 'heirs', title: '10. List of Legal Heirs', route: 'retirement-packet', Component: <RetirementLegalHeirsList employee={employee} caseRecord={caseRec} /> },
      { id: 'leaveaccount', title: '11. Leave Account (Landscape)', route: 'leave-account', orientation: 'landscape', Component: <LeaveAccountProforma employeeRecord={employee} caseRecord={caseRec} /> },
    ];
  } else if (isGPF) {
     const isAdvance = caseRec.case_type === 'gpf_refundable' || caseRec.case_type === 'gpf_non_refundable';
     
     // 1. Checklist
     documentsList.push(
       { id: 'gpf_checklist', title: 'GPF Checklist', route: 'gpf-checklist', Component: <GPFChecklist employee={employee} caseRecord={caseRec} /> }
     );
     
     // 2. Application for Sanction (BPS > 4) - For Refundable/Non-Ref only
     if (isBpsGreaterThan4(employee.employees.bps) && isAdvance) {
        documentsList.push({
           id: 'gpf_app_sanction',
           title: 'Application for Sanction',
           route: 'gpf-application-for-sanction',
           Component: <GPFApplicationForSanction employeeRecord={employee} caseRecord={caseRec} />
        });
     }
     
     // 3. Sanction Order (Class-IV Only) - For Refundable/Non-Ref only
     if (isClassIV(employee.employees.bps) && isAdvance) {
        documentsList.push({
           id: 'gpf_sanction_order',
           title: 'Sanction Order (Class IV)',
           route: 'gpf-sanction-order',
           Component: <GPFSanctionOrderClassIV employeeRecord={employee} caseRecord={caseRec} />
        });
     }

     if (caseRec.case_type === 'gpf_refundable' || caseRec.case_type === 'gpf_non_refundable') {
        documentsList.push({ 
          id: 'gpf_app', 
          title: 'GPF Advance Application', 
          route: 'gpf-application', 
          Component: <GPFAdvanceApplication employeeRecord={employee} caseRecord={caseRec} /> 
        });
     }
     
     // PAYF05 Form (Refundable Only)
     if (caseRec.case_type === 'gpf_refundable') {
        documentsList.push({
           id: 'gpf_payf05',
           title: 'PAYF05 Form (Temp Loan)',
           route: 'gpf-payf05',
           Component: <PAYF05TemporaryLoan employeeRecord={employee} caseRecord={caseRec} />
        });
     }

     // PAYF06 Form (Non-Refundable Only)
     if (caseRec.case_type === 'gpf_non_refundable') {
        documentsList.push({
           id: 'gpf_payf06',
           title: 'PAYF06 Form (Perm Loan)',
           route: 'gpf-payf06',
           orientation: 'landscape',
           Component: <PAYF06PermanentLoan employeeRecord={employee} caseRecord={caseRec} />
        });
     }

     // GCVP (Both Refundable & Non-Refundable)
     if (isAdvance) {
        documentsList.push({
           id: 'gpf_gcvp',
           title: 'GCVP (Verification Proforma)',
           route: 'gpf-gcvp',
           orientation: 'landscape',
           Component: <GPFClaimVerificationProforma employeeRecord={employee} caseRecord={caseRec} />
        });
     }
     
     if (caseRec.case_type === 'gpf_final') {
        documentsList.push({ id: 'form10', title: 'Form-10 (Final Payment)', route: 'gpf-final-payment', Component: <div className="p-8 text-center border-2 border-dashed">Form-10 Coming Soon</div> });
        
        documentsList.push({
           id: 'gpf_payf06',
           title: 'PAYF06 Form (Perm Loan)',
           route: 'gpf-payf06',
           orientation: 'landscape',
           Component: <PAYF06PermanentLoan employeeRecord={employee} caseRecord={caseRec} />
        });

        documentsList.push({
           id: 'gpf_gcvp',
           title: 'GCVP (Verification Proforma)',
           route: 'gpf-gcvp',
           orientation: 'landscape',
           Component: <GPFClaimVerificationProforma employeeRecord={employee} caseRecord={caseRec} />
        });
     }
  } else if (isDeceasedPension) {
     // --- FAMILY PENSION DOCUMENTS ---
     documentsList = [
       // Added Checklist here
       { id: 'fp_checklist', title: 'Checklist (Family Pension)', route: 'checklist-family-pension', Component: <FamilyPensionChecklist employee={employee} caseRecord={caseRec} /> },
       
       { id: 'title', title: '1. Title Page', route: 'family-pension-packet', Component: <FamilyPensionTitlePage employee={employee} /> },
       { id: 'app', title: '2. Application (Form 3)', route: 'family-pension-packet', Component: <FamilyPensionApplication employee={employee} caseRecord={caseRec} /> },
       { id: 'family_list', title: '3. Surviving Family Members List', route: 'family-pension-packet', Component: <FamilyMembersList employee={employee} /> },
       
       // --- SEPARATE DOCUMENTS ---
       { id: 'succession_cert', title: 'Succession Certificate', route: 'family-pension-succession', Component: <SuccessionCertificate employee={employee} /> },
       { id: 'bank_letter', title: 'Bank Account Letter', route: 'family-pension-bank-letter', Component: <BankAccountLetter employee={employee} /> },

       // --- AFFIDAVITS AS SEPARATE DOCUMENTS FOR LEGAL SIZE PRINTING ---
       { id: 'affidavit1', title: 'Affidavit 1 (Non-Marriage) [Legal]', route: 'family-pension-affidavit-1', Component: <Affidavit1 employee={employee} /> },
       { id: 'affidavit2', title: 'Affidavit 2 (Indemnity) [Legal]', route: 'family-pension-affidavit-2', Component: <Affidavit2 employee={employee} /> },
       
       { id: 'packet_print', title: 'Full Packet (A4 Only)', route: 'family-pension-packet', Component: <div className="p-8 text-center font-bold text-lg text-gray-500">Includes all standard forms except Affidavits (Legal Size).</div> }
     ];
  } else if (isRegularPension) {
     // --- REGULAR PENSION DOCUMENTS ---
     documentsList = [
        // Added Checklist here
        { id: 'rp_checklist', title: 'Checklist (Pension)', route: 'retirement-checklist', Component: <RetirementChecklist employee={employee} caseRecord={caseRec} /> },
        
        { id: 'title', title: 'Title Page', route: 'regular-pension-packet', Component: <RegularTitlePage employee={employee} /> },
        { id: 'cover', title: 'Forwarding Letter', route: 'regular-pension-packet', Component: <RegularCoverLetter employee={employee} caseRecord={caseRec} /> },
        { id: 'packet', title: 'Complete Packet (A4)', route: 'regular-pension-packet', Component: <div className="p-8 text-center font-bold text-lg text-gray-500">Full 13-page set</div> },
        // Add specific indemnity bond reuse if needed individually
        { id: 'affidavit2', title: 'Indemnity Bond [Legal]', route: 'family-pension-affidavit-2', Component: <Affidavit2 employee={employee} /> },
        { id: 'affidavit3', title: 'Affidavit: Non-Availment (LPR/EEF/BF/RB&DC) [Legal]', route: 'family-pension-affidavit-3', Component: <Affidavit3 employee={employee} /> }
     ];
  } else if (caseRec.case_type === 'rbdc') {
     documentsList.push(
       { id: 'checklist', title: 'Checklist (RB&DC)', route: 'checklist-rbdc', Component: <RBDCChecklist employee={employee} caseRecord={caseRec} /> },
       { id: 'cover', title: 'Application / Cover Letter', route: 'cover-rbdc', Component: <RBDCApplication employee={employee} caseRecord={caseRec} /> },
       { id: 'leaveaccount', title: 'Leave Account Proforma', route: 'leave-account', orientation: 'landscape', Component: <LeaveAccountProforma employeeRecord={employee} caseRecord={caseRec} /> },
       { id: 'application_official', title: 'Official Application Form', route: 'rbdc-application', Component: <RBDCOfficialForm employee={employee} caseRecord={caseRec} /> }
     );
  } else if (caseRec.case_type === 'benevolent_fund') {
     documentsList.push(
       { id: 'checklist', title: 'Checklist (Benevolent Fund)', route: 'checklist-bf', Component: <BenevolentFundChecklist employee={employee} caseRecord={caseRec} /> },
       { id: 'cover', title: 'Application / Cover Letter', route: 'cover-bf', Component: <BenevolentFundApplication employee={employee} caseRecord={caseRec} /> },
       { id: 'cert', title: 'Non-Drawal Certificate', route: 'cert-nondrawal-bf', Component: <NonDrawalCertificate employee={employee} type="Benevolent Fund" /> },
       { id: 'application_official', title: 'Official Application Form', route: 'bf-application', Component: <BenevolentFundOfficialForm employee={employee} caseRecord={caseRec} /> }
     );
  } else if (caseRec.case_type === 'eef') {
     documentsList.push(
       { id: 'checklist', title: 'Checklist (E.E.F)', route: 'checklist-eef', Component: <EEFChecklist employee={employee} caseRecord={caseRec} /> },
       { id: 'cover', title: 'Application / Cover Letter', route: 'cover-eef', Component: <EEFApplication employee={employee} caseRecord={caseRec} /> },
       { id: 'cert', title: 'Non-Drawal Certificate', route: 'cert-nondrawal-eef', Component: <NonDrawalCertificate employee={employee} type="Employees Education Foundation" /> },
       { id: 'application_official', title: 'Official Application Form', route: 'eef-application', Component: <EEFOfficialForm employee={employee} caseRecord={caseRec} /> }
     );
  } else if (caseRec.case_type === 'lpr') {
     documentsList.push(
       { id: 'checklist', title: 'Checklist (LPR)', route: 'checklist-lpr', Component: <LPRChecklist employee={employee} caseRecord={caseRec} /> },
       { id: 'cover', title: 'Cover Letter (LPR)', route: 'cover-lpr', Component: <LPRApplication employee={employee} caseRecord={caseRec} /> },
      { id: 'cert', title: 'Non-Drawal Certificate', route: 'cert-nondrawal-lpr', Component: <NonDrawalCertificate employee={employee} type="LPR" /> },
       { id: 'pay_form', title: 'Pay Form (LPR)', route: 'lpr-pay-form', Component: <LPRPayForm employee={employee} caseRecord={caseRec} /> }
     );
  } else if (caseRec.case_type === 'financial_assistance') {
    documentsList.push(
      { id: 'checklist', title: 'Checklist (Financial Assistance)', route: 'checklist-financial-assistance', Component: <FinancialAssistanceChecklist employee={employee} caseRecord={caseRec} /> },
      { id: 'cert', title: 'Non-Drawal Certificate', route: 'cert-nondrawal-financial-assistance', Component: <NonDrawalCertificate employee={employee} type="Financial Assistance" /> },
      { id: 'application', title: 'Application Form', route: 'financial-assistance-application', Component: <FinancialAssistanceApplication employee={employee} caseRecord={caseRec} /> }
    );
  } else if (isPayroll) {
    documentsList = [
      { id: 'payroll_source1', title: 'Form1 - Employee Master File', route: 'payroll-source-forms/source1', Component: <Form1 employeeRecord={employee} /> },
      { id: 'payroll_source2', title: 'Source II - Payroll Amendment (Single)', route: 'payroll-source-forms/source2', Component: <PayrollAmendmentSingleForm employeeRecord={employee} amendments={caseRec.extras?.amendments || []} /> },
      { id: 'payroll_source3', title: 'Source III - Payroll Amendment (Multi)', route: 'payroll-source-forms/source3', Component: <PayrollAmendmentMultiForm officeName={employee?.employees.office_name} ddoCode={employee?.employees.ddo_code} entries={caseRec.extras?.payroll_entries || []} /> }
    ];
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-6">
        <button onClick={() => navigate('/cases')} className="text-sm text-primary hover:underline mb-2 flex items-center gap-1">
          <AppIcon name="arrow_back" size={16} /> Back to Cases
        </button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-normal text-on-surface">{caseRec.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-on-surface-variant text-sm">
              <span className="font-bold flex items-center gap-1"><AppIcon name="person" size={16} /> {employee.employees.name}</span>
              <span>•</span>
              <span>{employee.employees.designation}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Badge label={caseRec.status.replace('_', ' ')} color={caseRec.status === 'completed' ? 'success' : 'primary'} />
             <div className="relative group">
                <Button variant="outlined" label="Change Status" className="h-8 text-xs px-3" />
                <div className="absolute right-0 top-full mt-2 w-40 bg-surface border border-outline-variant rounded-xl shadow-elevation-2 hidden group-hover:block z-10 overflow-hidden">
                  {['draft', 'in_progress', 'submitted', 'returned', 'completed'].map(s => (
                    <button key={s} onClick={() => updateStatus(s as any)} className="w-full text-left px-4 py-2 hover:bg-surface-variant text-sm capitalize">
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-outline-variant mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'documents', label: 'Documents' },
          { id: 'notes', label: 'Notes' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)}
            className={clsx("px-6 py-3 text-sm font-bold border-b-2 transition-colors capitalize whitespace-nowrap", activeTab === t.id ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
         {/* --- OVERVIEW TAB --- */}
         {activeTab === 'overview' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4">
              <div className="space-y-6">
                <Card variant="outlined">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-sm uppercase tracking-wide text-on-surface-variant">Case Details</h3>
                      <div className="flex flex-col items-center">
                        <QRCode value={`${window.location.origin}/#/verify/${caseRec.id}`} size={64} className="border-none p-0" />
                        <span className="text-[8px] font-mono mt-1 opacity-50 uppercase tracking-tighter">Scan to Verify</span>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span>Created</span> <span className="font-mono">{new Date(caseRec.createdAt).toLocaleDateString()}</span></div>
                      <div className="flex justify-between"><span>Type</span> <span className="capitalize">{caseRec.case_type.replace(/_/g, ' ').replace('gpf', 'GPF')}</span></div>
                      <div className="flex justify-between"><span>Employee BPS</span> <span>{employee.employees.bps}</span></div>
                      
                      {/* Retirement Specific Logic */}
                      {isRetirement && (
                        <div className="pt-4 border-t border-dashed border-outline-variant mt-2 space-y-4">
                           <div>
                             <label className="block text-xs font-bold text-primary uppercase mb-1">Nature of Retirement Override</label>
                             <div className="relative">
                               <select 
                                 className="w-full bg-surface-variant/30 border border-outline-variant rounded p-2 text-sm appearance-none outline-none"
                                 value={caseRec.extras?.nature_of_retirement || ''}
                                 onChange={(e) => handleRetirementTypeChange(e.target.value)}
                               >
                                  <option value="">Auto-Detect ({currentRetirementType})</option>
                                  <option value="superannuation">Superannuation</option>
                                  <option value="premature">Premature</option>
                                  <option value="medical">Medical</option>
                                  <option value="death">Death / Deceased</option>
                               </select>
                               <AppIcon name="arrow_drop_down" size={18} className="absolute right-2 top-2 pointer-events-none text-on-surface-variant" />
                             </div>
                           </div>
                        </div>
                      )}
                    </div>
                </Card>
                
                {/* GPF Input Card */}
                {isGPF && (
                  <Card variant="elevated" className="bg-surface">
                     <h3 className="font-bold text-sm uppercase tracking-wide text-on-surface-variant mb-4">GPF Case Details</h3>
                     <div className="space-y-4">
                        <TextField 
                           label="GPF Account No" 
                           value={caseRec.extras?.gpf_account_no || employee.employees.gpf_account_no || ''} 
                           onChange={e => updateExtra('gpf_account_no', e.target.value)} 
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <TextField label="Current Balance" type="number" value={caseRec.extras?.current_balance} onChange={e => updateExtra('current_balance', Number(e.target.value))} />
                           <TextField label="Amount Requested" type="number" value={caseRec.extras?.amount_requested} onChange={e => updateExtra('amount_requested', Number(e.target.value))} />
                        </div>
                        
                        <TextField label="Purpose of Advance" value={caseRec.extras?.purpose} onChange={e => updateExtra('purpose', e.target.value)} placeholder="e.g. House Repair, Marriage" />
                        
                        <div className="grid grid-cols-2 gap-4">
                           <TextField label="Basic Pay Override" type="number" value={caseRec.extras?.basic_pay} onChange={e => updateExtra('basic_pay', Number(e.target.value))} placeholder={String(employee.financials.last_basic_pay)} />
                           <TextField label="Net Pay" type="number" value={caseRec.extras?.net_pay} onChange={e => updateExtra('net_pay', Number(e.target.value))} />
                        </div>

                        {caseRec.case_type === 'gpf_refundable' && (
                           <div className="grid grid-cols-2 gap-4">
                              <TextField label="Installments (12-36)" type="number" value={caseRec.extras?.installments} onChange={e => updateExtra('installments', Number(e.target.value))} />
                              <TextField label="Monthly Deduction" value={caseRec.extras?.amount_requested ? Math.ceil(Number(caseRec.extras.amount_requested) / (Number(caseRec.extras.installments) || 24)) : 0} disabled />
                           </div>
                        )}
                        
                        {caseRec.case_type === 'gpf_non_refundable' && (
                          <div className="space-y-4">
                             <TextField label="Last Non-Ref Date" type="date" value={caseRec.extras?.previous_non_refundable_date} onChange={e => updateExtra('previous_non_refundable_date', e.target.value)} />
                             <div className="grid grid-cols-3 gap-2">
                                <label className="flex items-center gap-2 border border-outline-variant p-2 rounded cursor-pointer hover:bg-surface-variant/50">
                                   <input type="radio" name="gpf_perc" checked={caseRec.extras?.percentage === '80'} onChange={() => updateExtra('percentage', '80')} /> 80%
                                </label>
                                <label className="flex items-center gap-2 border border-outline-variant p-2 rounded cursor-pointer hover:bg-surface-variant/50">
                                   <input type="radio" name="gpf_perc" checked={caseRec.extras?.percentage === '100'} onChange={() => updateExtra('percentage', '100')} /> 100%
                                </label>
                                <label className="flex items-center gap-2 border border-outline-variant p-2 rounded cursor-pointer hover:bg-surface-variant/50">
                                   <input type="radio" name="gpf_perc" checked={caseRec.extras?.percentage === 'other'} onChange={() => updateExtra('percentage', 'other')} /> Other
                                </label>
                             </div>
                          </div>
                        )}
                        
                        <div className="pt-2">
                           <Checkbox label="Zakat Exempt?" checked={!!caseRec.extras?.zakat_exempt} onChange={e => updateExtra('zakat_exempt', e.target.checked ? 'true' : '')} />
                        </div>
                     </div>
                  </Card>
                )}

                {/* Payroll Amendment Card (Source II) */}
                {isPayroll && (
                  <Card variant="elevated" className="bg-surface">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm uppercase tracking-wide text-on-surface-variant">Payroll Amendment Details (Source II)</h3>
                      <Button variant="text" label="Add Row" icon="add" onClick={addAmendmentRow} className="h-8 text-xs" />
                    </div>
                    <div className="space-y-4">
                      {(caseRec.extras?.amendments || []).map((row: any, idx: number) => (
                        <div key={idx} className="p-3 border border-outline-variant rounded-lg bg-surface-container-lowest relative group">
                          <button 
                            onClick={() => removeAmendmentRow(idx)}
                            className="absolute top-2 right-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <AppIcon name="close" size={16} />
                          </button>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <TextField 
                              label="Info Type" 
                              value={row.infoType} 
                              onChange={e => updateAmendmentRow(idx, 'infoType', e.target.value)} 
                              placeholder="e.g. 0001"
                            />
                            <TextField 
                              label="Field ID" 
                              value={row.fieldId} 
                              onChange={e => updateAmendmentRow(idx, 'fieldId', e.target.value)} 
                              placeholder="e.g. ENAME"
                            />
                          </div>
                          <TextField 
                            label="New Content" 
                            value={row.newContent} 
                            onChange={e => updateAmendmentRow(idx, 'newContent', e.target.value)} 
                            className="mb-3"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <TextField 
                              label="Wage Type" 
                              value={row.wageType} 
                              onChange={e => updateAmendmentRow(idx, 'wageType', e.target.value)} 
                              placeholder="e.g. 1000"
                            />
                            <TextField 
                              label="Amount" 
                              type="number" 
                              value={row.amount} 
                              onChange={e => updateAmendmentRow(idx, 'amount', Number(e.target.value))} 
                            />
                          </div>
                          <TextField 
                            label="Remarks" 
                            value={row.remarks} 
                            onChange={e => updateAmendmentRow(idx, 'remarks', e.target.value)} 
                            className="mt-3"
                            placeholder="Optional remarks"
                          />
                        </div>
                      ))}
                      {(caseRec.extras?.amendments || []).length === 0 && (
                        <div className="text-center py-6 text-on-surface-variant text-sm border-2 border-dashed border-outline-variant rounded-xl">
                          No amendment rows added yet.
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Payroll Multi-Entry Card */}
                {isPayroll && (
                  <Card variant="elevated" className="bg-surface">
                    <h3 className="font-bold text-sm uppercase tracking-wide text-on-surface-variant mb-4">Payroll Amendment Details (Source III)</h3>
                    <div className="space-y-6">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <select 
                            className="w-full bg-surface-variant/30 border border-outline-variant rounded p-2 text-sm appearance-none outline-none"
                            value={selectedEmpForPayroll}
                            onChange={(e) => setSelectedEmpForPayroll(e.target.value)}
                          >
                            <option value="">Select Employee to Add...</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.employees.name} ({emp.employees.personal_no})</option>
                            ))}
                          </select>
                          <AppIcon name="arrow_drop_down" size={18} className="absolute right-2 top-2 pointer-events-none text-on-surface-variant" />
                        </div>
                        <Button variant="filled" label="Add" icon="add" onClick={addPayrollEntry} className="h-10" />
                      </div>

                      <div className="space-y-4">
                        {(caseRec.extras?.payroll_entries || []).map((entry: any) => (
                          <div key={entry.employee_id} className="p-3 border border-outline-variant rounded-lg bg-surface-container-lowest relative">
                            <button 
                              onClick={() => removePayrollEntry(entry.employee_id)}
                              className="absolute top-2 right-2 text-on-surface-variant hover:text-error"
                            >
                              <AppIcon name="close" size={16} />
                            </button>
                            
                            <div className="font-bold text-sm mb-2">{entry.name} <span className="text-xs font-normal opacity-70">({entry.personnel_no})</span></div>
                            
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <TextField 
                                label="Absent Days" 
                                type="number" 
                                value={entry.absent_days} 
                                onChange={e => updatePayrollEntry(entry.employee_id, 'absent_days', Number(e.target.value))} 
                              />
                              <TextField 
                                label="Gross Salary" 
                                type="number" 
                                value={entry.gross_salary} 
                                onChange={e => updatePayrollEntry(entry.employee_id, 'gross_salary', Number(e.target.value))} 
                              />
                            </div>
                            
                            <div className="flex justify-between items-center bg-primary-container/20 p-2 rounded text-xs font-bold text-primary">
                              <span>Deduction: {formatCurrency(entry.deduction_amount)}</span>
                              <span className="opacity-70 font-normal">({formatCurrency(entry.gross_salary)} / 30 × {entry.absent_days})</span>
                            </div>

                            <div className="mt-3">
                              <TextField 
                                label="Remarks" 
                                value={entry.remarks} 
                                onChange={e => updatePayrollEntry(entry.employee_id, 'remarks', e.target.value)} 
                                placeholder="Optional remarks"
                              />
                            </div>
                          </div>
                        ))}

                        {(caseRec.extras?.payroll_entries || []).length === 0 && (
                          <div className="text-center py-8 text-on-surface-variant text-sm border-2 border-dashed border-outline-variant rounded-xl">
                            No employees added for multi-deduction yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* GPF Eligibility Advisory - Moved Under Case Details */}
                {isGPF && (
                   <Card variant="outlined" className="border-l-4 border-l-primary">
                     <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                       <AppIcon name="verified" className="text-primary" /> Eligibility Advisory
                     </h3>
                     <div className="space-y-2">
                       {gpfWarnings.length === 0 ? (
                         <p className="text-sm text-on-surface-variant">Enter balance and amount to check eligibility.</p>
                       ) : (
                         gpfWarnings.map((w, i) => (
                            <div key={i} className={clsx("p-2 rounded text-sm flex items-start gap-2", 
                               w.type === 'error' ? "bg-error-container text-on-error-container" : 
                               w.type === 'warning' ? "bg-secondary-container text-on-secondary-container" : 
                               "bg-green-100 text-green-800"
                            )}>
                               <AppIcon name={w.type === 'error' ? 'error' : w.type === 'warning' ? 'warning' : 'check_circle'} size={16} className="mt-0.5" />
                               {w.message}
                            </div>
                         ))
                       )}
                     </div>
                   </Card>
                 )}

                {/* Payroll Validation Advisory */}
                {isPayroll && payrollWarnings.length > 0 && (
                   <Card variant="outlined" className="border-l-4 border-l-primary">
                     <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                       <AppIcon name="fact_check" className="text-primary" /> Payroll Form Validation
                     </h3>
                     <div className="space-y-2">
                       {payrollWarnings.map((w, i) => (
                          <div key={i} className={clsx("p-2 rounded text-sm flex items-start gap-2", 
                             w.type === 'error' ? "bg-error-container text-on-error-container" : 
                             "bg-secondary-container text-on-secondary-container"
                          )}>
                             <AppIcon name={w.type === 'error' ? 'error' : 'warning'} size={16} className="mt-0.5" />
                             {w.message}
                          </div>
                       ))}
                     </div>
                   </Card>
                 )}

                {/* Tracking Checklist */}
                <Card variant="filled" className="bg-surface-container-high">
                    <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowProgress(!showProgress)}>
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-wide text-on-surface-variant">External Documents Checklist</h3>
                        <div className="text-xs text-on-surface-variant mt-1">{checklistProgress}% Completed</div>
                      </div>
                      <div className="flex items-center gap-2">
                         {showProgress && (
                           <Button variant="text" label="Reset" onClick={(e) => { e.stopPropagation(); resetChecklist(); }} className="h-6 text-xs px-2 text-error" />
                         )}
                         <AppIcon name={showProgress ? "expand_less" : "expand_more"} />
                      </div>
                    </div>
                    {showProgress && renderChecklist()}
                </Card>
              </div>

              {/* Quick Actions / Recent Activity Placeholder */}
              <div className="space-y-6">
                 {isRetirement && (
                   <Card variant="elevated" className="bg-primary-container/20 border border-primary/20">
                      <h3 className="font-bold text-lg text-primary mb-2">Ready to Print?</h3>
                      <p className="text-sm text-on-surface-variant mb-4">You have access to the full retirement packet including Checklist, Cover Letter, Application, Clearance, and more.</p>
                      <Button variant="filled" label="Go to Documents" icon="description" onClick={() => setActiveTab('documents')} />
                   </Card>
                 )}
                 {isGPF && (
                   <Card variant="elevated" className="bg-primary-container/20 border border-primary/20">
                      <h3 className="font-bold text-lg text-primary mb-2">Ready to Print?</h3>
                      <p className="text-sm text-on-surface-variant mb-4">Print the full GPF application packet including Checklist, Forms, and Verification Proforma.</p>
                      <Button variant="filled" label="Go to Documents" icon="description" onClick={() => setActiveTab('documents')} />
                   </Card>
                 )}
                 {isDeceasedPension && (
                   <Card variant="elevated" className="bg-red-50 border border-red-200">
                      <h3 className="font-bold text-lg text-red-800 mb-2">Deceased Case Detected</h3>
                      <p className="text-sm text-red-600 mb-4">Family Pension forms (Form 3, Affidavits, Indemnity Bond) are available for print.</p>
                      <Button variant="filled" label="Go to Documents" icon="description" onClick={() => setActiveTab('documents')} className="bg-red-700 text-white" />
                   </Card>
                 )}
                 {isRegularPension && (
                   <Card variant="elevated" className="bg-blue-50 border border-blue-200">
                      <h3 className="font-bold text-lg text-blue-800 mb-2">Regular Pension Case</h3>
                      <p className="text-sm text-blue-600 mb-4">Pension Application, Sanction Orders, and Certificates are ready.</p>
                      <Button variant="filled" label="Go to Documents" icon="description" onClick={() => setActiveTab('documents')} className="bg-blue-700 text-white" />
                   </Card>
                 )}
                 {isPayroll && (
                   <Card variant="elevated" className="bg-green-50 border border-green-200">
                      <h3 className="font-bold text-lg text-green-800 mb-2">Payroll Amendment Case</h3>
                      <p className="text-sm text-green-600 mb-4">Source I, II, and III forms are available for generating and printing.</p>
                      <Button variant="filled" label="Go to Documents" icon="description" onClick={() => setActiveTab('documents')} className="bg-green-700 text-white" />
                   </Card>
                 )}
                 
                 {/* Fallback for other case types */}
                 {!isRetirement && !isGPF && !isDeceasedPension && !isRegularPension && (
                    <Card variant="elevated" className="bg-secondary-container text-on-secondary-container">
                       <h3 className="font-bold text-lg mb-2">Next Steps</h3>
                       <p className="text-sm mb-4">Review the checklist and print the application form to proceed.</p>
                       <Button variant="filled" label="View Documents" icon="description" onClick={() => setActiveTab('documents')} className="bg-on-secondary-container text-secondary-container" />
                    </Card>
                 )}
              </div>
           </div>
         )}

         {/* --- DOCUMENTS TAB --- */}
         {activeTab === 'documents' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
              
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                 <div>
                   <h3 className="font-bold text-lg">Case Documents</h3>
                   <p className="text-sm text-on-surface-variant">Manage and print required forms</p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {/* UNIVERSAL PRINT PACKET BUTTONS */}
                    {isRetirement && (
                      <Button 
                          variant="filled" 
                          label="Print Documents" 
                          icon="print" 
                          className="bg-slate-800 text-white"
                          onClick={() => handlePrintDocument('packet', 'retirement-packet')} 
                      />
                    )}
                    {isGPF && (
                      <Button 
                          variant="filled" 
                          label="Print Documents" 
                          icon="print" 
                          className="bg-slate-800 text-white"
                          onClick={() => handlePrintDocument('packet', 'gpf-packet')} 
                      />
                    )}
                    {isDeceasedPension && (
                      <Button 
                          variant="filled" 
                          label="Print Family Packet" 
                          icon="print" 
                          className="bg-red-800 text-white"
                          onClick={() => handlePrintDocument('packet', 'family-pension-packet')} 
                      />
                    )}
                    {isRegularPension && (
                      <Button 
                          variant="filled" 
                          label="Print Packet" 
                          icon="print" 
                          className="bg-blue-800 text-white"
                          onClick={() => handlePrintDocument('packet', 'regular-pension-packet')} 
                      />
                    )}
                    {caseRec.case_type === 'rbdc' && (
                       <Button variant="filled" label="Print RBDC Form" icon="print" className="bg-slate-800 text-white" onClick={() => handlePrintDocument('application_official', 'rbdc-application')} />
                    )}
                    {caseRec.case_type === 'benevolent_fund' && (
                       <Button variant="filled" label="Print BF Form" icon="print" className="bg-slate-800 text-white" onClick={() => handlePrintDocument('application_official', 'bf-application')} />
                    )}
                    {caseRec.case_type === 'eef' && (
                       <Button variant="filled" label="Print EEF Form" icon="print" className="bg-slate-800 text-white" onClick={() => handlePrintDocument('application_official', 'eef-application')} />
                    )}
                    {caseRec.case_type === 'lpr' && (
                      <Button variant="filled" label="Print LPR Cover" icon="print" className="bg-slate-800 text-white" onClick={() => handlePrintDocument('cover', 'cover-lpr')} />
                    )}
                    {caseRec.case_type === 'financial_assistance' && (
                       <Button variant="filled" label="Print FA Form" icon="print" className="bg-slate-800 text-white" onClick={() => handlePrintDocument('application', 'financial-assistance-application')} />
                    )}
                 </div>
              </div>

              {/* Forms Grid - Universal */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {documentsList.map((doc) => (
                   <React.Fragment key={doc.id}>
                      {/* Expanded View */}
                      {expandedDocId === doc.id && (
                        <div className="col-span-full bg-surface-container-low border border-outline-variant rounded-xl p-4 shadow-elevation-3 mb-4 animate-in fade-in zoom-in-95">
                           <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
                              <h3 className="font-bold text-lg">{doc.title}</h3>
                              <div className="flex gap-2">
                                 <Button variant="filled" label="Print" icon="print" onClick={() => handlePrintDocument(doc.id, doc.route)} className="h-8 text-xs" />
                                 <Button variant="outlined" label="Close" icon="close" onClick={() => setExpandedDocId(null)} className="h-8 text-xs" />
                              </div>
                           </div>
                           
                           {/* Expanded Container */}
                           <div 
                             ref={expandedViewRef}
                             className="overflow-auto max-h-[80vh] bg-white p-4 border rounded shadow-inner flex"
                           >
                              <div className={clsx("flex-shrink-0 origin-top-left", doc.orientation === 'landscape' ? "w-[297mm]" : "w-[210mm] mx-auto")}>
                                 {doc.Component}
                              </div>
                           </div>
                        </div>
                      )}
                      
                      {/* Thumbnail Card */}
                      {expandedDocId !== doc.id && (
                        <DocumentThumbnail
                          title={doc.title}
                          orientation={doc.orientation as any}
                          onPreview={() => handlePreviewDocument(doc.id)}
                          onPrint={() => handlePrintDocument(doc.id, doc.route)}
                          isExpanded={expandedDocId === doc.id}
                        >
                          {doc.Component}
                        </DocumentThumbnail>
                      )}
                   </React.Fragment>
                 ))}
              </div>

              {/* Automated Templates Section */}
              {availableTemplates.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-dashed border-outline-variant">
                   <div className="flex justify-between items-center">
                     <div>
                       <h3 className="font-bold text-on-surface">Automated Form Generation</h3>
                       <p className="text-xs text-on-surface-variant">One-click generation from government templates</p>
                     </div>
                     <Badge label={`${availableTemplates.length} Templates Available`} color="primary" />
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {availableTemplates.map(tpl => {
                       const manualFields = Object.keys(tpl.fieldMappings || {}).filter(k => tpl.fieldMappings[k] === 'manual');
                       
                       return (
                         <Card key={tpl.id} variant="outlined" className="p-4 bg-surface hover:border-primary transition-colors group">
                           <div className="flex items-start gap-3 mb-3">
                             <div className="p-2 bg-error-container/10 text-error rounded-lg">
                               <AppIcon name="picture_as_pdf" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h4 className="font-bold text-sm truncate">{tpl.name}</h4>
                               <p className="text-[10px] text-on-surface-variant uppercase font-bold">{tpl.document_type.replace(/_/g, ' ')}</p>
                             </div>
                           </div>
                           
                           {manualFields.length > 0 && (
                             <div className="mb-4 space-y-2">
                               <p className="text-[10px] font-bold text-primary uppercase">Manual Inputs Required:</p>
                               {manualFields.map(field => (
                                 <TextField 
                                   key={field}
                                   label={field}
                                   dense
                                   value={(caseRec.extras?.[`field_${field}`] as string) || ''}
                                   onChange={e => updateExtra(`field_${field}`, e.target.value)}
                                 />
                               ))}
                             </div>
                           )}

                           <Button 
                             variant="tonal" 
                             label="Generate Document" 
                             icon="auto_fix_high" 
                             fullWidth 
                             className="h-9 text-xs"
                             onClick={() => handleGenerateFromTemplate(tpl)}
                           />
                         </Card>
                       );
                     })}
                   </div>
                </div>
              )}

              {/* Uploaded Documents Section */}
              <div className="space-y-4 pt-6 border-t border-dashed border-outline-variant">
                 <div className="flex justify-between items-center">
                   <h3 className="font-bold text-on-surface">Attachments & DMS</h3>
                   <div className="flex gap-2 text-xs">
                     <Badge label="Versioning Active" color="success" />
                     <Badge label="Digital Signature Ready" color="primary" />
                   </div>
                 </div>
                 
                 {caseRec.documents.length === 0 && <div className="text-center py-6 text-on-surface-variant/60 italic">No additional documents uploaded.</div>}
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {caseRec.documents.map(d => (
                     <div key={d.id} className="flex flex-col p-4 border border-outline-variant/40 rounded-xl hover:bg-surface-container-low transition-colors group">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={clsx("p-2 rounded-lg", d.kind === 'generated' ? "bg-tertiary-container text-on-tertiary-container" : "bg-secondary-container text-on-secondary-container")}>
                            <AppIcon name={d.mimeType?.includes('pdf') ? "picture_as_pdf" : "description"} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="font-bold text-sm truncate flex items-center gap-2">
                               {d.name}
                               <span className="px-1.5 py-0.5 bg-outline-variant/30 rounded text-[10px] font-mono">v{d.version || 1}</span>
                             </div>
                             <div className="text-xs text-on-surface-variant flex gap-2 items-center">
                               {new Date(d.createdAt).toLocaleDateString()}
                               {d.size && <span>• {(d.size / 1024).toFixed(1)} KB</span>}
                               <Badge 
                                 label={d.status || 'draft'} 
                                 color={d.status === 'signed' ? 'success' : d.status === 'final' ? 'primary' : 'neutral'} 
                                 className="scale-75 origin-left"
                               />
                             </div>
                          </div>
                          {d.fileId && (
                             <div className="flex gap-1">
                               <Button variant="text" icon="download" onClick={() => window.open(`#/print/${d.fileId}`, '_blank')} className="h-8 w-8 px-0" />
                             </div>
                          )}
                        </div>

                        {/* Actions Row */}
                        <div className="flex flex-wrap gap-2 mt-auto pt-3 border-t border-outline-variant/20">
                          {d.status === 'draft' && (
                            <>
                              <Button 
                                variant="tonal" 
                                label="Update Version" 
                                icon="upload_file" 
                                onClick={() => handleUpdateVersionClick(d.id)} 
                                className="h-7 text-[10px] px-2" 
                              />
                              <Button 
                                variant="outlined" 
                                label="Finalize" 
                                icon="check_circle" 
                                onClick={() => finalizeDocument(d.id)} 
                                className="h-7 text-[10px] px-2" 
                              />
                            </>
                          )}
                          {d.status === 'final' && (
                            <Button 
                              variant="filled" 
                              label="Sign Digitally" 
                              icon="draw" 
                              onClick={() => signDocument(d.id)} 
                              className="h-7 text-[10px] px-2 bg-primary text-on-primary" 
                            />
                          )}
                          {d.status === 'signed' && d.signature && (
                            <div className="flex items-center gap-1 text-[10px] text-success font-bold">
                              <AppIcon name="verified" size={14} />
                              Signed by {d.signature.signedBy}
                            </div>
                          )}
                        </div>

                        {/* Version History (Mini) */}
                        {d.previousVersionId && (
                          <div className="mt-2 text-[10px] text-on-surface-variant italic">
                            Previous version: {d.previousVersionId.split('_').pop()}
                          </div>
                        )}
                     </div>
                   ))}
                 </div>

                 <div className="flex gap-2 items-end mt-2">
                    <TextField label="Document Name" value={docName} onChange={e => setDocName(e.target.value)} className="flex-1" placeholder="e.g. Scanned Application" />
                    <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf,image/*" onChange={handleFileChange} />
                    <input type="file" ref={versionInputRef} className="hidden" accept="application/pdf,image/*" onChange={handleVersionChange} />
                    <input type="file" ref={scanInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleScanChange} />
                    <Button variant="outlined" label="Scan" onClick={handleScanClick} className="h-14" />
                    <Button variant="tonal" label="Upload" onClick={handleUploadClick} className="h-14" />
                 </div>
              </div>
           </div>
         )}

         {/* --- NOTES TAB --- */}
         {activeTab === 'notes' && (
           <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {(!caseRec.notes || caseRec.notes.length === 0) && <div className="text-center py-12 text-on-surface-variant">No notes added.</div>}
                {caseRec.notes?.map(n => (
                  <div key={n.id} className="p-4 bg-surface-variant/30 rounded-xl border border-outline-variant/30">
                     <div className="text-xs text-on-surface-variant mb-1 font-mono">{new Date(n.at).toLocaleString()}</div>
                     <div className="text-sm whitespace-pre-wrap">{n.text}</div>
                  </div>
                ))}
             </div>
             <div className="flex gap-2 items-end pt-4 border-t border-outline-variant/20">
                <TextField label="Add Note" value={noteText} onChange={e => setNoteText(e.target.value)} className="flex-1" />
                <Button variant="tonal" icon="send" onClick={addNote} className="h-14 w-14 px-0" />
             </div>
           </div>
         )}
      </div>

      {/* Template Manual Fields Modal */}
      {showTemplateModal && selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card variant="elevated" className="w-full max-w-md bg-surface p-6 shadow-elevation-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Additional Information</h3>
              <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
                <AppIcon name="close" />
              </button>
            </div>
            
            <p className="text-sm text-on-surface-variant mb-6">
              The template <strong>{selectedTemplate.name}</strong> requires some manual information that is not available in the system.
            </p>

            <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(manualFieldValues).map(field => (
                  <div key={field} className="space-y-1">
                    <TextField
                      label={field.replace(/_/g, ' ')}
                      value={manualFieldValues[field]}
                      onChange={e => {
                        setManualFieldValues(prev => ({ ...prev, [field]: e.target.value }));
                      }}
                      placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                      className={clsx(!manualFieldValues[field]?.trim() && "border-error")}
                    />
                    {!manualFieldValues[field]?.trim() && (
                      <p className="text-[10px] text-error px-1 font-medium">This field is required</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="text" label="Cancel" onClick={() => setShowTemplateModal(false)} />
                <Button 
                  variant="filled" 
                  label="Generate PDF" 
                  icon="auto_fix_high" 
                  disabled={Object.values(manualFieldValues).some((v: string) => !v?.trim())}
                  onClick={() => handleGenerateFromTemplate(selectedTemplate, manualFieldValues)} 
                />
              </div>
          </Card>
        </div>
      )}
    </div>
  );
};
