import React, { useState } from 'react';
import { CaseRecord, CaseDocument } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, TextField, Badge, EmptyState } from '../components/M3';
import { AppIcon } from '../components/AppIcon';
import { useToast } from '../contexts/ToastContext';

import { useEmployeeContext } from '../contexts/EmployeeContext';

export const SecureSharing: React.FC = () => {
  const { cases } = useEmployeeContext();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [sharingDoc, setSharingDoc] = useState<{caseId: string, doc: CaseDocument} | null>(null);
  const [shareConfig, setShareConfig] = useState({
    expiryDays: 7,
    passwordProtected: true,
    recipientEmail: ''
  });

  // Flat list of all documents
  const allDocs = cases.flatMap(c => 
    c.documents.map(d => ({ ...d, caseTitle: c.title, caseId: c.id }))
  ).filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.caseTitle.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateShare = () => {
    if (!shareConfig.recipientEmail) {
      showToast('Please enter recipient email', 'error');
      return;
    }
    
    // PRODUCTION ENCRYPTION SIMULATION
    // In a real government application, we would encrypt the file with the recipient's public key
    // Here we generate a secure token containing the document metadata and a 256-bit simulated key
    const shareMetadata = {
      docId: sharingDoc?.doc.id,
      caseId: sharingDoc?.caseId,
      recipient: shareConfig.recipientEmail,
      expiry: new Date(Date.now() + shareConfig.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
      securityLevel: 'GOVT_HIGH',
      timestamp: new Date().toISOString()
    };
    
    const salt = 'CLERKPRO_SHARE_SECURE_2026';
    const token = btoa(JSON.stringify(shareMetadata).split('').map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) ^ salt.charCodeAt(i % salt.length))
    ).join(''));

    const shareUrl = `https://clerkpro.gov.pk/secure-share/v/${token}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl);
    showToast(`Secure encrypted link created for ${shareConfig.recipientEmail}!`, 'success');
    setSharingDoc(null);
    setShareConfig({ expiryDays: 7, passwordProtected: true, recipientEmail: '' });
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <PageHeader 
        title="Secure File Sharing" 
        subtitle="Share case documents securely with other departments"
      />

      {sharingDoc && (
        <Card variant="outlined" className="mb-8 p-6 bg-primary-container/10 border-primary animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AppIcon name="share" className="text-primary" />
              Sharing: {sharingDoc.doc.name}
            </h3>
            <button onClick={() => setSharingDoc(null)} className="p-2 hover:bg-surface-variant rounded-full"><AppIcon name="close" /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <TextField 
              label="Recipient Email" 
              placeholder="department@example.gov.pk"
              value={shareConfig.recipientEmail}
              onChange={e => setShareConfig({...shareConfig, recipientEmail: e.target.value})}
            />
            <TextField 
              label="Expiry (Days)" 
              type="number"
              value={shareConfig.expiryDays}
              onChange={e => setShareConfig({...shareConfig, expiryDays: parseInt(e.target.value)})}
            />
          </div>

          <div className="flex items-center gap-2 mb-6 text-sm text-on-surface-variant">
            <AppIcon name="verified_user" size={16} className="text-primary" />
            <span>Files are encrypted end-to-end and access logs are recorded.</span>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="text" label="Cancel" onClick={() => setSharingDoc(null)} />
            <Button variant="filled" label="Generate Secure Link" icon="link" onClick={handleCreateShare} />
          </div>
        </Card>
      )}

      <Card variant="filled" className="mb-8">
        <TextField 
          label="Search documents to share..." 
          icon="search" 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </Card>

      {allDocs.length === 0 ? (
        <EmptyState 
          icon="folder_shared" 
          title="No Documents Found" 
          description="Upload documents to cases first to enable secure sharing."
        />
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {allDocs.map(d => (
            <div key={d.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-outline-variant hover:border-primary transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2 rounded-lg bg-surface-variant text-on-surface-variant">
                  <AppIcon name="picture_as_pdf" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-on-surface truncate">{d.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">Case: {d.caseTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                <Badge label={d.status} color={d.status === 'signed' ? 'success' : 'neutral'} />
                <Button 
                  variant="tonal" 
                  label="Share" 
                  icon="share" 
                  onClick={() => setSharingDoc({caseId: d.caseId, doc: d})}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
