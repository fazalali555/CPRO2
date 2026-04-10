import React, { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/M3';
import { AppIcon } from '../../components/AppIcon';
import { NotingDraftingTemplate } from '../../components/NotingDraftingTemplate';
import { useLanguage } from '../../contexts/LanguageContext';
import { ADMIN_TABS } from './constants';
import { AdminTab } from './types';

// Import all tab components
import { SNETab } from './components/sne/SNETab';
import { SeniorityTab } from './components/seniority/SeniorityTab';
import { ACRTab } from './components/acr/ACRTab';
import { IncrementTab } from './components/increment/IncrementTab';
import { TransfersTab } from './components/transfers/TransfersTab';
import { ClaimsTab } from './components/claims/ClaimsTab';
import { LoansTab } from './components/loans/LoansTab';
import { InspectionTab } from './components/inspection/InspectionTab';
import { EMISTab } from './components/emis/EMISTab';
import { InventoryTab } from './components/inventory/InventoryTab';
import { MeetingsTab } from './components/meetings/MeetingsTab';

export const Administration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('sne');
  const [showDraft, setShowDraft] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const { t, isUrdu } = useLanguage();

  const handleGenerateDocument = (data: any) => {
    setDraftData(data);
    setShowDraft(true);
  };

  if (showDraft && draftData) {
    return (
      <div className="bg-surface-container py-10">
        <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center px-4">
          <Button 
            variant="tonal" 
            label="Back to Admin" 
            icon="arrow_back" 
            onClick={() => setShowDraft(false)} 
          />
          <Button 
            variant="filled" 
            label="Print Notification" 
            icon="print" 
            onClick={() => window.print()} 
          />
        </div>
        <NotingDraftingTemplate {...draftData} />
      </div>
    );
  }

  const getTabLabel = (labelKey: string) => {
    if (labelKey === 'admin.acr') return isUrdu ? 'ACR' : 'ACR';
    const keys = labelKey.split('.');
    let value: any = t;
    for (const key of keys) {
      value = value?.[key];
    }
    return value || labelKey;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sne':
        return <SNETab />;
      case 'seniority':
        return <SeniorityTab onGenerateList={handleGenerateDocument} />;
      case 'acr':
        return <ACRTab />;
      case 'increment':
        return <IncrementTab onGenerateOrders={handleGenerateDocument} />;
      case 'transfers':
        return <TransfersTab onGenerateOrder={handleGenerateDocument} />;
      case 'claims':
        return <ClaimsTab />;
      case 'loans':
        return <LoansTab />;
      case 'inspection':
        return <InspectionTab onGenerateReport={handleGenerateDocument} />;
      case 'emis':
        return <EMISTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'meetings':
        return <MeetingsTab />;
      default:
        return (
          <div className="text-center py-20 text-on-surface-variant">
            <AppIcon name="construction" size={48} className="mb-4 opacity-50" />
            <p>This tab is coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <PageHeader 
        title={t.admin.title} 
        subtitle={t.admin.subtitle}
      />

      <div className={`flex bg-surface-container-low p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar border border-outline-variant/30 ${isUrdu ? 'flex-row-reverse' : ''}`}>
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-variant/50'
            } ${isUrdu ? 'flex-row-reverse' : ''}`}
          >
            <AppIcon name={tab.icon} size={18} />
            {getTabLabel(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderTabContent()}
      </div>
    </div>
  );
};
