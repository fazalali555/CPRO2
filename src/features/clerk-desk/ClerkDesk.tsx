// ClerkDesk.tsx - Main Container Component

import React, { useState, useCallback, Suspense, lazy } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card, Button, Badge } from '../../components/M3';
import { useToast } from '../../contexts/ToastContext';
import { securityService } from '../../services/SecurityService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useClerkDeskShortcuts } from './hooks/useKeyboardShortcuts';
import { TAB_CONFIG } from './constants';
import { TabId } from './types';

// Lazy load tab components for better performance
const LetterComposer = lazy(() => import('./components/letters/LetterComposer'));
const DocumentFiling = lazy(() => import('./components/filing/DocumentFiling'));
const CorrespondenceTracker = lazy(() => import('./components/correspondence/CorrespondenceTracker'));
const AppointmentScheduler = lazy(() => import('./components/appointments/AppointmentScheduler'));
const RecordsManager = lazy(() => import('./components/records/RecordsManager'));
const ReportsDashboard = lazy(() => import('./components/reports/ReportsDashboard'));
const ContactDirectory = lazy(() => import('./components/contacts/ContactDirectory'));
const TaskManager = lazy(() => import('./components/tasks/TaskManager'));

// Loading fallback
const TabLoading = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-on-surface-variant">Loading...</span>
    </div>
  </div>
);

export const ClerkDesk: React.FC = () => {
  const { showToast } = useToast();
  const allowed = securityService.hasRole(['clerk', 'admin']);
  const { isOnline } = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<TabId>('letters');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcuts
  useClerkDeskShortcuts({
    onSwitchTab: (index) => {
      const tab = TAB_CONFIG[index];
      if (tab) setActiveTab(tab.id);
    },
    onSearch: () => {
      // Focus search in current tab
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      searchInput?.focus();
    },
  });

  // Tab renderer
  const renderTabContent = useCallback(() => {
    const components: Record<TabId, React.ReactNode> = {
      letters: <LetterComposer />,
      filing: <DocumentFiling />,
      correspondence: <CorrespondenceTracker />,
      appointments: <AppointmentScheduler />,
      records: <RecordsManager />,
      reports: <ReportsDashboard />,
      contacts: <ContactDirectory />,
      tasks: <TaskManager />,
    };

    return (
      <Suspense fallback={<TabLoading />}>
        {components[activeTab]}
      </Suspense>
    );
  }, [activeTab]);

  // Access denied
  if (!allowed) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <Card variant="elevated" className="bg-surface p-8">
          <span className="material-symbols-outlined text-6xl text-error mb-4">lock</span>
          <h2 className="text-xl font-bold text-on-surface mb-2">Access Restricted</h2>
          <p className="text-on-surface-variant">
            Clerk Desk is available to clerk-level roles only.
            Please contact your administrator for access.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader 
          title="Clerk Desk" 
          subtitle="Complete administrative workspace for education office operations" 
        />
        
        <div className="flex items-center gap-3">
          {/* Online status */}
          <Badge
            label={isOnline ? 'Online' : 'Offline'}
            color={isOnline ? 'success' : 'error'}
          />
          
          {/* Keyboard shortcuts help */}
          <Button
            variant="text"
            icon="keyboard"
            aria-label="Keyboard shortcuts"
            onClick={() => setShowShortcuts(!showShortcuts)}
          />
        </div>
      </div>

      {/* Keyboard shortcuts help panel */}
      {showShortcuts && (
        <Card variant="outlined" className="bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-on-surface">Keyboard Shortcuts</h3>
            <Button
              variant="text"
              icon="close"
              onClick={() => setShowShortcuts(false)}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">Ctrl+S</kbd>
              <span className="text-on-surface-variant">Save Draft</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">Ctrl+Shift+S</kbd>
              <span className="text-on-surface-variant">Finalize</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">Ctrl+N</kbd>
              <span className="text-on-surface-variant">New Letter</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">Ctrl+P</kbd>
              <span className="text-on-surface-variant">Print</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">Ctrl+F</kbd>
              <span className="text-on-surface-variant">Search</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">Ctrl+1-8</kbd>
              <span className="text-on-surface-variant">Switch Tab</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">Ctrl+Z</kbd>
              <span className="text-on-surface-variant">Undo</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-surface-variant rounded text-xs">Esc</kbd>
              <span className="text-on-surface-variant">Cancel</span>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {TAB_CONFIG.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              flex items-center gap-2 relative
              ${activeTab === tab.id
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 transform scale-105'
                : 'bg-surface text-on-surface hover:bg-surface-variant hover:text-on-surface-variant border border-outline/20 hover:border-outline/40'
              }
            `}
            title={`Ctrl+${index + 1}`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <Badge
                label={String(tab.badge)}
                color={tab.badgeColor as any || 'error'}
                className="text-xs absolute -top-1 -right-1"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 bg-warning text-on-warning px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined">cloud_off</span>
          <span>Offline Mode - AI features unavailable</span>
        </div>
      )}
    </div>
  );
};

export default ClerkDesk;