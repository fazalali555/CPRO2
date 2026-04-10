
import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card, Button, Badge, TextField, SelectField } from '../components/M3';
import { AppIcon } from '../components/AppIcon';

export const Help: React.FC = () => {
  const [tickets, setTickets] = useState(() => {
    const raw = localStorage.getItem('kpk_helpdesk_tickets');
    return raw ? JSON.parse(raw) : [];
  });
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('Normal');

  useEffect(() => {
    localStorage.setItem('kpk_helpdesk_tickets', JSON.stringify(tickets));
  }, [tickets]);

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) return;
    const entry = {
      id: Date.now().toString(),
      subject,
      message,
      priority,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    setTickets([entry, ...tickets]);
    setSubject('');
    setMessage('');
    setPriority('Normal');
  };
  return (
    <div className="max-w-4xl mx-auto pb-20">
      <PageHeader 
        title="Help & Training" 
        subtitle="User guide and documentation for Clerk Pro" 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card variant="elevated" className="bg-primary-container/20 border border-primary/20 p-6 text-center">
           <div className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
             <AppIcon name="menu_book" size={24} />
           </div>
           <h3 className="font-bold text-lg mb-2">User Manual</h3>
           <p className="text-sm text-on-surface-variant mb-4">Complete guide on managing cases and employees.</p>
           <Button variant="tonal" label="Read Manual" icon="open_in_new" fullWidth />
        </Card>

        <Card variant="elevated" className="bg-secondary-container/20 border border-secondary/20 p-6 text-center">
           <div className="w-12 h-12 bg-secondary text-on-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
             <AppIcon name="videocam" size={24} />
           </div>
           <h3 className="font-bold text-lg mb-2">Video Tutorials</h3>
           <p className="text-sm text-on-surface-variant mb-4">Step-by-step videos for common operations.</p>
           <Button variant="tonal" label="Watch Videos" icon="play_circle" fullWidth />
        </Card>

        <Card variant="elevated" className="bg-tertiary-container/20 border border-tertiary/20 p-6 text-center">
           <div className="w-12 h-12 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
             <AppIcon name="support_agent" size={24} />
           </div>
           <h3 className="font-bold text-lg mb-2">Support</h3>
           <p className="text-sm text-on-surface-variant mb-4">Get help with technical issues or bugs.</p>
           <Button variant="tonal" label="Contact Support" icon="mail" fullWidth />
        </Card>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AppIcon name="tips_and_updates" className="text-primary" />
            Quick Start Guide
          </h3>
          <Card variant="outlined" className="p-6 space-y-4 bg-surface">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-surface-variant rounded-full flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h4 className="font-bold">Add Employees</h4>
                <p className="text-sm text-on-surface-variant">Go to the Employees tab and add or import employee records. This data is used to auto-fill all forms.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-surface-variant rounded-full flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h4 className="font-bold">Create a Case</h4>
                <p className="text-sm text-on-surface-variant">Click "New Case", select an employee and a case type (Retirement, GPF, etc.). The system will generate a custom checklist.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-surface-variant rounded-full flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h4 className="font-bold">Generate Documents</h4>
                <p className="text-sm text-on-surface-variant">In Case Details, go to the Documents tab. Use "Automated Form Generation" to create pixel-perfect PDF forms with one click.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-surface-variant rounded-full flex items-center justify-center font-bold shrink-0">4</div>
              <div>
                <h4 className="font-bold">Track & Secure</h4>
                <p className="text-sm text-on-surface-variant">Monitor deadlines in the Task Scheduler and ensure data security with encrypted backups in Settings.</p>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AppIcon name="support_agent" className="text-primary" />
            Helpdesk Support
          </h3>
          <Card variant="outlined" className="p-6 bg-surface space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField label="Issue Subject" icon="title" value={subject} onChange={e => setSubject(e.target.value)} />
              <SelectField label="Priority" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </SelectField>
              <TextField label="Issue Details" icon="description" value={message} onChange={e => setMessage(e.target.value)} className="md:col-span-2" />
            </div>
            <div className="flex justify-end">
              <Button variant="filled" label="Submit Ticket" icon="send" onClick={handleSubmit} />
            </div>
            {tickets.length > 0 && (
              <div className="space-y-2">
                {tickets.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="p-3 rounded-lg border border-outline-variant/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{t.subject}</div>
                      <div className="text-xs text-on-surface-variant">{new Date(t.createdAt).toLocaleString()}</div>
                    </div>
                    <Badge label={t.status} color={t.status === 'Closed' ? 'success' : 'primary'} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AppIcon name="security" className="text-primary" />
            Security & Compliance
          </h3>
          <Card variant="outlined" className="p-6 bg-surface-container-lowest">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-bold text-sm uppercase text-primary">Data Protection</h4>
                <p className="text-xs text-on-surface-variant">All data is stored locally in your browser's secure database (IndexedDB). No sensitive employee data ever leaves your computer unless you explicitly export it.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm uppercase text-primary">Audit Trails</h4>
                <p className="text-xs text-on-surface-variant">The system maintains a detailed log of all sensitive actions, including document generation, status changes, and data exports. These logs can be exported from Settings for compliance audits.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm uppercase text-primary">Encrypted Backups</h4>
                <p className="text-xs text-on-surface-variant">Backups are encrypted using 256-bit simulated encryption, ensuring that even if a backup file is lost, the data remains unreadable without the system key.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm uppercase text-primary">Digital Signatures</h4>
                <p className="text-xs text-on-surface-variant">Documents generated by the system support digital signatures for approval workflows, providing non-repudiation and integrity for government correspondence.</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="bg-primary/5 p-8 rounded-3xl text-center border-2 border-dashed border-primary/20">
          <ProjectLogo className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold font-official text-primary mb-2">Clerk Pro by Fazal Ali</h3>
          <p className="text-sm text-on-surface-variant mb-6 max-w-lg mx-auto">
            This application is designed specifically for government department clerks to streamline their daily operations while maintaining the highest standards of security and transparency.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
             <Badge label="© 2026 Fazal Ali" color="neutral" />
             <Badge label="Version 2.5.0-PRO" color="primary" />
             <Badge label="Secure Edition" color="success" />
             <Badge label="Government Compliant" color="secondary" />
          </div>
        </section>

        <section className="mt-12">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AppIcon name="help_center" className="text-primary" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <Card variant="outlined" className="p-4">
              <h4 className="font-bold text-sm mb-1">How do I create a new template?</h4>
              <p className="text-xs text-on-surface-variant">Go to the "Template Generator" tab, upload a fillable PDF, and map the fields to system data. You can then use this template in any case of that type.</p>
            </Card>
            <Card variant="outlined" className="p-4">
              <h4 className="font-bold text-sm mb-1">What are "Manual Fields" in templates?</h4>
              <p className="text-xs text-on-surface-variant">Manual fields are for information that isn't stored in the employee profile (like a specific reference number for a single form). When you generate the document, the system will prompt you to enter these values.</p>
            </Card>
            <Card variant="outlined" className="p-4">
              <h4 className="font-bold text-sm mb-1">How does digital signing work?</h4>
              <p className="text-xs text-on-surface-variant">In the Documents tab of a case, click the "Sign" button on a document. This adds a cryptographic signature marker to the document metadata, recording who signed it and when.</p>
            </Card>
            <Card variant="outlined" className="p-4">
              <h4 className="font-bold text-sm mb-1">Can I use this on multiple computers?</h4>
              <p className="text-xs text-on-surface-variant">Since data is stored locally, you should use the "Backup" feature in Settings to move your data between computers securely.</p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

const ProjectLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={className + " flex items-center justify-center bg-primary text-on-primary rounded-2xl shadow-lg rotate-3"}>
    <AppIcon name="history_edu" size={32} />
  </div>
);
