
import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, Badge, EmptyState, TextField } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { CourtCaseRecord, AuditParaRecord, ParaStatus, ParaCategory } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate, getAuditYear } from '../utils/dateUtils';
import { NotingDraftingTemplate } from '../components/NotingDraftingTemplate';

export const LegalAudit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'court' | 'audit'>('court');
  const [showDraft, setShowDraft] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const { t, isUrdu } = useLanguage();

  const handleGenerateDraft = (data: any) => {
    setDraftData(data);
    setShowDraft(true);
  };

  if (showDraft && draftData) {
    return (
      <div className="bg-surface-container py-10">
        <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center px-4">
          <Button 
            variant="tonal" 
            label="Back to Monitoring" 
            icon="arrow_back" 
            onClick={() => setShowDraft(false)} 
          />
          <Button 
            variant="filled" 
            label="Print Comments" 
            icon="print" 
            onClick={() => window.print()} 
          />
        </div>
        <NotingDraftingTemplate {...draftData} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <PageHeader 
        title={t.legalAudit.title} 
        subtitle={t.legalAudit.subtitle}
      />

      <div className={`flex bg-surface-container-low p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar border border-outline-variant/30 ${isUrdu ? 'flex-row-reverse' : ''}`}>
        {[
          { id: 'court', label: t.legalAudit.courtCases, icon: 'gavel' },
          { id: 'audit', label: t.legalAudit.auditParas, icon: 'fact_check' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-variant/50'
            } ${isUrdu ? 'flex-row-reverse' : ''}`}
          >
            <AppIcon name={tab.icon} size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'court' && <CourtCasesTab onGenerateDraft={handleGenerateDraft} />}
        {activeTab === 'audit' && <AuditParasTab onGenerateDraft={handleGenerateDraft} />}
      </div>
    </div>
  );
};

const CourtCasesTab = ({ onGenerateDraft }: { onGenerateDraft: (data: any) => void }) => {
  const { t, isUrdu } = useLanguage();
  const [cases, setCases] = useState<CourtCaseRecord[]>([
    {
      id: '1',
      title: isUrdu ? 'زاہد خان بنام حکومت خیبر پختونخوا' : 'Zahid Khan vs Govt of KP',
      wp_number: 'WP No. 1234-P/2024',
      court_name: isUrdu ? 'پشاور ہائی کورٹ، پشاور' : 'Peshawar High Court, Peshawar',
      petitioner: isUrdu ? 'زاہد خان، ایس ایس ٹی' : 'Zahid Khan, SST',
      respondents: isUrdu 
        ? ['حکومت خیبر پختونخوا بذریعہ سیکرٹری ای اینڈ ایس ای', 'ڈائریکٹر ای اینڈ ایس ای', 'ڈی ای او (ایم) پشاور']
        : ['Govt of KP through Secretary E&SE', 'Director E&SE', 'DEO (M) Peshawar'],
      subject: isUrdu ? 'سبجیکٹ سپیشلسٹ کے عہدے پر ترقی' : 'Promotion to Subject Specialist',
      status: 'Stay Order',
      next_hearing: '2025-03-15',
      comments_deadline: '2025-02-10',
      school_name: 'GHS No. 1 Peshawar', // Added school name
      history: []
    }
  ]);

  const handleFileComments = (c: CourtCaseRecord) => {
    const data = {
      office: { 
        title: isUrdu ? 'ڈسٹرکٹ ایجوکیشن آفیسر (میل)' : 'District Education Officer (Male)', 
        department: isUrdu ? 'ایلیمینٹری اینڈ سیکنڈری ایجوکیشن' : 'Elementary & Secondary Education', 
        city: isUrdu ? 'پشاور' : 'Peshawar',
        schoolName: c.school_name // Pass school name for gender/authority parsing
      },
      fileNo: `DEO/Psh/Legal/${c.wp_number.split(' ')[2]}/2025`,
      subject: isUrdu 
        ? `${c.wp_number} بعنوان "${c.title}" میں مدعا علیہ نمبر 3 کی جانب سے پیرا وائز کمنٹس`
        : `PARA-WISE COMMENTS ON BEHALF OF RESPONDENT NO. 3 IN ${c.wp_number} TITLED "${c.title}"`,
      recipient: { 
        title: isUrdu ? 'ایڈووکیٹ جنرل' : 'The Advocate General', 
        address: isUrdu ? 'خیبر پختونخوا، پشاور' : 'Khyber Pakhtunkhwa, Peshawar' 
      },
      content: isUrdu 
        ? `مجھے ہدایت ہوئی ہے کہ میں مذکورہ بالا موضوع کا حوالہ دوں اور اس کے ساتھ معزز ${c.court_name} میں پیش کرنے کے لیے ڈسٹرکٹ ایجوکیشن آفیسر (ایم) پشاور کے دستخط شدہ پیرا وائز کمنٹس کی تین کاپیاں لف کروں۔\n\nیہ کمنٹس درخواست گزار کے دستیاب سروس ریکارڈ کی بنیاد پر تیار کیے گئے ہیں۔ درخواست ہے کہ انہیں اگلی سماعت یعنی ${formatDate(c.next_hearing)} سے پہلے معزز عدالت میں جمع کرایا جائے تاکہ کسی بھی منفی حکم سے بچا جا سکے۔`
        : `I am directed to refer to the subject cited above and to enclose herewith Para-wise comments in triplicate duly signed by the District Education Officer (M) Peshawar for onward submission to the Honorable ${c.court_name}.\n\nThe comments have been prepared based on the available service record of the petitioner. It is requested that the same may be filed in the Honorable Court before the next date of hearing i.e. ${formatDate(c.next_hearing)} to avoid any adverse order.`,
      signatory: { 
        name: isUrdu ? 'محمد عارف' : 'Muhammad Arif', 
        designation: isUrdu ? 'ڈسٹرکٹ ایجوکیشن آفیسر (ایم)' : 'District Education Officer (M)' 
      },
      copyTo: isUrdu ? [
        'ڈائریکٹر، ای اینڈ ایس ای کے پی پشاور۔',
        'ڈسٹرکٹ اٹارنی، پشاور۔',
        'لیگل سیل، ڈی ای او (ایم) پشاور۔'
      ] : [
        'The Director, E&SE KP Peshawar.',
        'The District Attorney, Peshawar.',
        'Legal Cell, DEO (M) Peshawar.'
      ],
      enclosures: isUrdu ? ['پیرا وائز کمنٹس (تین کاپیاں)', 'سروس ریکارڈ کی نقول'] : ['Para-wise Comments (Triplicate)', 'Copies of Service Record']
    };
    onGenerateDraft(data);
  };

  const getStatusBadge = (status: CourtCaseRecord['status']) => {
    switch (status) {
      case 'Decided': return <Badge variant="success" label={status} />;
      case 'Stay Order': return <Badge variant="error" label={status} />;
      default: return <Badge variant="primary" label={status} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {t.legalAudit.litigationMonitoring}
        </h3>
        <Button variant="filled" label={t.legalAudit.addCase} icon="add" />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ${isUrdu ? 'dir-rtl' : ''}`}>
         <StatCard label={t.legalAudit.totalCases} value={cases.length.toString()} icon="balance" color="text-primary" />
         <StatCard label={t.legalAudit.stayOrders} value={cases.filter(c => c.status === 'Stay Order').length.toString()} icon="block" color="text-error" />
         <StatCard label={t.legalAudit.upcomingHearings} value={cases.filter(c => new Date(c.next_hearing) > new Date()).length.toString()} icon="event" color="text-secondary" />
         <StatCard label={t.legalAudit.decided} value={cases.filter(c => c.status === 'Decided').length.toString()} icon="done_all" color="text-success" />
      </div>

      {cases.length === 0 ? (
        <EmptyState 
          icon="gavel" 
          title={t.legalAudit.noActiveCases} 
          description={t.legalAudit.litigationDesc}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cases.map(c => (
            <Card key={c.id} variant="outlined" className="p-4 hover:shadow-md transition-shadow">
              <div className={`flex justify-between items-start mb-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                <div>
                  <div className={`flex items-center gap-2 mb-1 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-bold text-primary">{c.wp_number}</span>
                    <span className="text-outline-variant">•</span>
                    {getStatusBadge(c.status)}
                  </div>
                  <h4 className={`font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>{c.title}</h4>
                  <div className={`flex items-center gap-2 text-xs text-on-surface-variant mt-1 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                    <AppIcon name="account_balance" size={14} />
                    {c.court_name}
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-4 mt-4 py-3 border-y border-outline-variant/30 ${isUrdu ? 'dir-rtl' : ''}`}>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">{t.legalAudit.nextHearing}</div>
                  <div className="text-sm font-medium">{formatDate(c.next_hearing)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">{t.legalAudit.commentsDeadline}</div>
                  <div className={`text-sm font-medium ${c.comments_deadline && new Date(c.comments_deadline) < new Date() ? 'text-error' : ''}`}>
                    {c.comments_deadline ? formatDate(c.comments_deadline) : 'Not Set'}
                  </div>
                </div>
              </div>

              <div className={`flex gap-2 mt-4 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                <Button variant="tonal" label={t.legalAudit.history} icon="history" size="small" />
                <Button 
                  variant="outlined" 
                  label={t.legalAudit.fileComments} 
                  icon="upload_file" 
                  size="small" 
                  onClick={() => handleFileComments(c)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const AuditParasTab = ({ onGenerateDraft }: { onGenerateDraft: (data: any) => void }) => {
  const { t, isUrdu } = useLanguage();
  const [paras, setParas] = useState<AuditParaRecord[]>([
    {
      id: '1',
      audit_year: '2023-24',
      para_no: '5.2',
      category: 'Financial Irregularity',
      description: isUrdu 
        ? 'تقرری کے احکامات کی تصدیق کے بغیر عملے کو تنخواہوں کی بے قاعدہ ادائیگی۔'
        : 'Irregular payment of salaries to staff without verified appointment orders.',
      amount_involved: 1250000,
      status: 'Pending',
      deadline: '2025-03-01',
      school_name: 'GGPS Hayatabad Peshawar', // Added school name (Girls)
      replies: [],
      history: []
    }
  ]);

  const handleGenerateComments = (p: AuditParaRecord) => {
    const data = {
      office: { 
        title: isUrdu ? 'ڈسٹرکٹ ایجوکیشن آفیسر (میل)' : 'District Education Officer (Male)', 
        department: isUrdu ? 'ایلیمینٹری اینڈ سیکنڈری ایجوکیشن' : 'Elementary & Secondary Education', 
        city: isUrdu ? 'پشاور' : 'Peshawar',
        schoolName: p.school_name // Pass school name for gender/authority parsing
      },
      fileNo: `DEO/Psh/Audit/${p.audit_year}/Para-${p.para_no}`,
      subject: isUrdu 
        ? `آڈٹ پیرا نمبر ${p.para_no} برائے سال ${p.audit_year} کا جواب`
        : `REPLY TO AUDIT PARA NO. ${p.para_no} FOR THE YEAR ${p.audit_year}`,
      recipient: { 
        title: isUrdu ? 'ڈائریکٹر آڈٹ' : 'The Director Audit', 
        address: isUrdu ? 'خیبر پختونخوا، پشاور' : 'Khyber Pakhtunkhwa, Peshawar' 
      },
      content: isUrdu 
        ? `آڈٹ پیرا نمبر ${p.para_no} (سال ${p.audit_year}) کے حوالے سے دفتر کا جواب حسب ذیل ہے:\n\nمشاہدہ: ${p.description}\n\nجواب: متعلقہ تقرری کے احکامات اب مجاز اتھارٹی سے تصدیق کر لیے گئے ہیں۔ تصدیق شدہ دستاویزات کی کاپیاں لف ہذا ہیں۔ چونکہ بے قاعدگی دور کر دی گئی ہے، لہذا درخواست ہے کہ مذکورہ آڈٹ پیرا کو ختم (Drop) کیا جائے۔`
        : `With reference to Audit Para No. ${p.para_no} (Year ${p.audit_year}), the reply of this office is as under:\n\nObservation: ${p.description}\n\nReply: The concerned appointment orders have now been verified from the competent authority. Copies of verified documents are attached herewith. Since the irregularity has been rectified, it is requested that the subject audit para may kindly be dropped.`,
      signatory: { 
        name: isUrdu ? 'محمد عارف' : 'Muhammad Arif', 
        designation: isUrdu ? 'ڈسٹرکٹ ایجوکیشن آفیسر (ایم)' : 'District Education Officer (M)' 
      },
      copyTo: isUrdu ? [
        'ڈائریکٹر، ای اینڈ ایس ای کے پی پشاور۔',
        'ڈسٹرکٹ اکاؤنٹس آفیسر، پشاور۔',
        'اندرونی آڈٹ سیل، ای اینڈ ایس ای ڈیپارٹمنٹ۔'
      ] : [
        'The Director, E&SE KP Peshawar.',
        'The District Accounts Officer, Peshawar.',
        'Internal Audit Cell, E&SE Department.'
      ],
      enclosures: isUrdu ? ['تصدیق شدہ تقرری کے احکامات'] : ['Verified Appointment Orders']
    };
    onGenerateDraft(data);
  };

  const getStatusBadge = (status: ParaStatus) => {
    switch (status) {
      case 'Settled': return <Badge variant="success" label={status} />;
      case 'DAC Level': return <Badge variant="warning" label={status} />;
      default: return <Badge variant="error" label={status} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {t.legalAudit.auditCompliance}
        </h3>
        <Button variant="filled" label={t.legalAudit.addPara} icon="assignment" />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${isUrdu ? 'dir-rtl' : ''}`}>
         <StatCard label={t.legalAudit.pendingParas} value={paras.filter(p => p.status !== 'Settled').length.toString()} icon="error_outline" color="text-error" />
         <StatCard label={t.legalAudit.submittedReplies} value={paras.filter(p => p.replies.length > 0).length.toString()} icon="forward_to_inbox" color="text-primary" />
         <StatCard label={t.legalAudit.settled} value={paras.filter(p => p.status === 'Settled').length.toString()} icon="verified" color="text-success" />
      </div>

      {paras.length === 0 ? (
        <EmptyState 
          icon="fact_check" 
          title={t.legalAudit.noAuditParas} 
          description={t.legalAudit.auditDesc}
        />
      ) : (
        <div className="space-y-4">
          {paras.map(para => (
            <Card key={para.id} variant="outlined" className="p-4 hover:shadow-md transition-shadow">
              <div className={`flex justify-between items-start mb-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                <div>
                  <div className={`flex items-center gap-2 mb-1 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-bold text-primary">{para.audit_year}</span>
                    <span className="text-outline-variant">•</span>
                    <span className="font-bold">{t.legalAudit.paraNo} {para.para_no}</span>
                    {getStatusBadge(para.status)}
                  </div>
                  <p className={`text-sm text-on-surface-variant ${isUrdu ? 'text-right' : ''}`}>{para.description}</p>
                </div>
                <div className={`text-right ${isUrdu ? 'text-left' : ''}`}>
                  <div className="text-lg font-bold text-on-surface">Rs. {para.amount_involved.toLocaleString()}</div>
                  {para.deadline && (
                    <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${
                      new Date(para.deadline) < new Date() ? 'text-error' : 'text-primary'
                    } ${isUrdu ? 'flex-row-reverse' : ''}`}>
                      <AppIcon name="alarm" size={14} />
                      {t.legalAudit.deadline}: {formatDate(para.deadline)}
                    </div>
                  )}
                </div>
              </div>
              <div className={`flex gap-2 mt-4 pt-4 border-t border-outline-variant/30 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                <Button variant="tonal" label={t.legalAudit.viewHistory} icon="history" size="small" />
                <Button variant="outlined" label={t.legalAudit.addReply} icon="reply" size="small" />
                <Button 
                  variant="outlined" 
                  label={t.legalAudit.generateComments} 
                  icon="description" 
                  size="small" 
                  onClick={() => handleGenerateComments(para)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string, icon: string, color: string }) => {
  const { isUrdu } = useLanguage();
  
  return (
    <Card variant="outlined" className={`p-4 bg-surface flex items-center gap-4 ${isUrdu ? 'flex-row-reverse' : ''}`}>
      <div className={`p-2 rounded-lg bg-surface-variant/30 ${color}`}>
        <AppIcon name={icon} size={24} />
      </div>
      <div className={isUrdu ? 'text-right' : ''}>
        <div className="text-xl font-bold text-on-surface">{value}</div>
        <div className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">{label}</div>
      </div>
    </Card>
  );
};
