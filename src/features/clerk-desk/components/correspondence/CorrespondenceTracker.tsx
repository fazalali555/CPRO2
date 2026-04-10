// components/correspondence/CorrespondenceTracker.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Badge, TextField, SelectField, TextArea } from '../../../../components/M3';
import { useLocalStorageCollection } from '../../hooks/useLocalStorage';
import { AIService } from '../../services/AIService';
import { useToast } from '../../../../contexts/ToastContext';
import { useConfirmDialog } from '../common/ConfirmDialog';
import { SearchBar } from '../common/SearchBar';
import { EmptyState } from '../common/EmptyState';
import { StatsGrid } from '../common/StatCard';
import { STORAGE_KEYS, CORRESPONDENCE_STATUSES, PRIORITY_OPTIONS } from '../../constants';
import { Correspondence, CorrespondenceStatus, Direction, Priority } from '../../types';
import { formatDate, formatPriority } from '../../utils/formatters';
import { validateCorrespondence } from '../../utils/validators';
import { auditService } from '../../../../services/SecurityService';

export const CorrespondenceTracker: React.FC = () => {
  const { showToast } = useToast();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();

  const {
    items: correspondence,
    addItem,
    updateItem,
    removeItem,
    getItem,
  } = useLocalStorageCollection<Correspondence>(STORAGE_KEYS.CORRESPONDENCE);

  // Form state
  const [formData, setFormData] = useState({
    direction: 'incoming' as Direction,
    party: '',
    partyEmail: '',
    partyPhone: '',
    subject: '',
    refNo: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: '',
    status: 'pending' as CorrespondenceStatus,
    priority: 'normal' as Priority,
    notes: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirection, setFilterDirection] = useState<Direction | ''>('');
  const [filterStatus, setFilterStatus] = useState<CorrespondenceStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Statistics
  const stats = useMemo(() => {
    const incoming = correspondence.filter(c => c.direction === 'incoming').length;
    const outgoing = correspondence.filter(c => c.direction === 'outgoing').length;
    const pending = correspondence.filter(c => c.status === 'pending').length;
    const overdue = correspondence.filter(c => 
      c.status === 'pending' && c.dueDate && new Date(c.dueDate) < new Date()
    ).length;
    const urgent = correspondence.filter(c => c.priority === 'urgent' && c.status === 'pending').length;

    return { incoming, outgoing, pending, overdue, urgent, total: correspondence.length };
  }, [correspondence]);

  // Filtered correspondence
  const filteredCorrespondence = useMemo(() => {
    return correspondence.filter(corr => {
      const matchesSearch = !searchQuery || 
        corr.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        corr.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
        corr.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        corr.notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDirection = !filterDirection || corr.direction === filterDirection;
      const matchesStatus = !filterStatus || corr.status === filterStatus;
      const matchesPriority = !filterPriority || corr.priority === filterPriority;

      return matchesSearch && matchesDirection && matchesStatus && matchesPriority;
    }).sort((a, b) => {
      // Sort by priority first, then by date
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [correspondence, searchQuery, filterDirection, filterStatus, filterPriority]);

  // Group by status for Kanban view
  const groupedByStatus = useMemo(() => {
    const groups: Record<CorrespondenceStatus, Correspondence[]> = {
      pending: [],
      replied: [],
      escalated: [],
      closed: [],
    };

    filteredCorrespondence.forEach(corr => {
      groups[corr.status].push(corr);
    });

    return groups;
  }, [filteredCorrespondence]);

  // Form handlers
  const setField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [validationErrors]);

  const resetForm = useCallback(() => {
    setFormData({
      direction: 'incoming',
      party: '',
      partyEmail: '',
      partyPhone: '',
      subject: '',
      refNo: '',
      date: new Date().toISOString().slice(0, 10),
      dueDate: '',
      status: 'pending',
      priority: 'normal',
      notes: '',
    });
    setEditingId(null);
    setAiPrompt('');
    setValidationErrors({});
  }, []);

  const loadForEdit = useCallback((id: string) => {
    const item = getItem(id);
    if (item) {
      setFormData({
        direction: item.direction,
        party: item.party,
        partyEmail: item.partyEmail || '',
        partyPhone: item.partyPhone || '',
        subject: item.subject,
        refNo: item.refNo,
        date: item.date,
        dueDate: item.dueDate || '',
        status: item.status,
        priority: item.priority,
        notes: item.notes,
      });
      setEditingId(id);
    }
  }, [getItem]);

  const handleSubmit = useCallback(() => {
    const validation = validateCorrespondence(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showToast('Please fix the validation errors', 'error');
      return;
    }

    const data = {
      direction: formData.direction,
      party: formData.party.trim(),
      partyEmail: formData.partyEmail.trim() || undefined,
      partyPhone: formData.partyPhone.trim() || undefined,
      subject: formData.subject.trim(),
      refNo: formData.refNo.trim(),
      date: formData.date,
      dueDate: formData.dueDate || undefined,
      status: formData.status,
      priority: formData.priority,
      notes: formData.notes.trim(),
      linkedLetterId: undefined,
      reminders: [],
      history: [],
    };

    if (editingId) {
      updateItem(editingId, data);
      auditService.log('CORR_UPDATED', `Updated correspondence: ${data.subject}`, editingId);
      showToast('Correspondence updated', 'success');
    } else {
      const newItem = addItem(data);
      auditService.log('CORR_ADDED', `Added ${data.direction} correspondence: ${data.subject}`, newItem.id);
      showToast('Correspondence added', 'success');
    }

    resetForm();
  }, [formData, editingId, addItem, updateItem, resetForm, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    const item = getItem(id);
    const confirmed = await confirm({
      title: 'Delete Correspondence',
      message: `Are you sure you want to delete "${item?.subject}"?`,
      variant: 'danger',
    });

    if (confirmed) {
      removeItem(id);
      auditService.log('CORR_DELETED', `Deleted correspondence: ${item?.subject}`, id);
      showToast('Correspondence deleted', 'success');
    }
  }, [confirm, getItem, removeItem, showToast]);

  const handleStatusChange = useCallback((id: string, newStatus: CorrespondenceStatus) => {
    const item = getItem(id);
    if (item) {
      updateItem(id, {
        status: newStatus,
        history: [
          ...(item.history || []),
          {
            id: Date.now().toString(),
            action: `Status changed to ${newStatus}`,
            note: '',
            timestamp: new Date().toISOString(),
            userId: 'current_user',
          },
        ],
      });
      showToast(`Status updated to ${newStatus}`, 'success');
    }
  }, [getItem, updateItem, showToast]);

  // AI generation
  const handleGenerateNotes = useCallback(async () => {
    if (!aiPrompt.trim()) {
      showToast('Please enter a prompt', 'error');
      return;
    }

    setAiLoading(true);
    try {
      const request = AIService.buildLetterRequest({
        prompt: aiPrompt,
        recipient: formData.party,
        subject: formData.subject,
        salutation: 'Sir/Madam',
        senderName: 'Office',
        senderTitle: 'Education Office',
        maxWords: 200,
      });

      const response = await AIService.generateLetter(request);

      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      setField('notes', response.text);
      setAiPrompt('');
      showToast('Notes generated', 'success');
    } catch (error) {
      showToast('Failed to generate notes', 'error');
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, formData.party, formData.subject, setField, showToast]);

  // Get status color
  const getStatusColor = (status: CorrespondenceStatus) => {
    const statusInfo = CORRESPONDENCE_STATUSES.find(s => s.value === status);
    return statusInfo?.color || 'neutral';
  };

  // Render correspondence card
  const renderCorrespondenceCard = (corr: Correspondence, compact = false) => {
    const isOverdue = corr.status === 'pending' && corr.dueDate && new Date(corr.dueDate) < new Date();
    const priorityInfo = formatPriority(corr.priority);

    return (
      <div
        key={corr.id}
        className={`
          p-4 rounded-xl border transition-all duration-200
          ${isOverdue ? 'border-error/50 bg-error/5' : 'border-outline/20'}
          hover:border-outline/40 hover:bg-surface-variant/10
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge
                label={corr.direction === 'incoming' ? '↓ In' : '↑ Out'}
                color={corr.direction === 'incoming' ? 'info' : 'success'}
                className="text-xs"
              />
              <span className="font-semibold text-on-surface truncate">{corr.subject}</span>
              {corr.priority !== 'normal' && (
                <span className={`material-symbols-outlined text-sm text-${priorityInfo.color}`}>
                  {priorityInfo.icon}
                </span>
              )}
              {isOverdue && (
                <Badge label="Overdue" color="error" className="text-xs" />
              )}
            </div>

            <div className="text-sm text-on-surface-variant mb-2">
              <span className="font-medium">{corr.party}</span>
              {corr.refNo && <span className="ml-2">• Ref: {corr.refNo}</span>}
            </div>

            <div className="flex items-center flex-wrap gap-2 text-xs text-on-surface-variant">
              <span>{formatDate(corr.date)}</span>
              {corr.dueDate && (
                <span className={isOverdue ? 'text-error' : ''}>
                  Due: {formatDate(corr.dueDate)}
                </span>
              )}
            </div>

            {!compact && corr.notes && (
              <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">
                {corr.notes}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge label={corr.status} color={getStatusColor(corr.status) as any} />

            <div className="flex gap-1">
              <Button
                variant="text"
                icon="edit"
                aria-label="Edit"
                onClick={() => loadForEdit(corr.id)}
              />
              <Button
                variant="text"
                icon="delete"
                aria-label="Delete"
                onClick={() => handleDelete(corr.id)}
              />
            </div>
          </div>
        </div>

        {/* Quick status change buttons */}
        {corr.status === 'pending' && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-outline/20">
            <Button
              variant="text"
              label="Reply"
              icon="reply"
              onClick={() => handleStatusChange(corr.id, 'replied')}
              className="text-xs"
            />
            <Button
              variant="text"
              label="Close"
              icon="check_circle"
              onClick={() => handleStatusChange(corr.id, 'closed')}
              className="text-xs"
            />
            <Button
              variant="text"
              label="Escalate"
              icon="warning"
              onClick={() => handleStatusChange(corr.id, 'escalated')}
              className="text-xs"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ConfirmDialogComponent />

      {/* Statistics */}
      <StatsGrid
        stats={[
          { label: 'Incoming', value: stats.incoming, icon: 'inbox', color: 'info' },
          { label: 'Outgoing', value: stats.outgoing, icon: 'send', color: 'success' },
          { label: 'Pending', value: stats.pending, icon: 'pending', color: 'warning' },
          { label: 'Overdue', value: stats.overdue, icon: 'warning', color: 'error' },
          { label: 'Urgent', value: stats.urgent, icon: 'priority_high', color: 'error' },
        ]}
        columns={4}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              {editingId ? 'edit' : 'add_circle'}
            </span>
            <h2 className="text-lg font-bold text-on-surface">
              {editingId ? 'Edit Correspondence' : 'Add Correspondence'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Direction"
              value={formData.direction}
              onChange={e => setField('direction', e.target.value)}
            >
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </SelectField>

            <SelectField
              label="Priority"
              value={formData.priority}
              onChange={e => setField('priority', e.target.value)}
            >
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </SelectField>
          </div>

          <TextField
            label="Party / Contact"
            icon="person"
            value={formData.party}
            onChange={e => setField('party', e.target.value)}
            error={validationErrors.party}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Email"
              icon="mail"
              type="email"
              value={formData.partyEmail}
              onChange={e => setField('partyEmail', e.target.value)}
              error={validationErrors.partyEmail}
            />
            <TextField
              label="Phone"
              icon="call"
              value={formData.partyPhone}
              onChange={e => setField('partyPhone', e.target.value)}
              error={validationErrors.partyPhone}
            />
          </div>

          <TextField
            label="Subject"
            icon="subject"
            value={formData.subject}
            onChange={e => setField('subject', e.target.value)}
            error={validationErrors.subject}
            required
          />

          <TextField
            label="Reference No"
            icon="bookmark"
            value={formData.refNo}
            onChange={e => setField('refNo', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Date"
              type="date"
              icon="event"
              value={formData.date}
              onChange={e => setField('date', e.target.value)}
              error={validationErrors.date}
              required
            />
            <TextField
              label="Due Date"
              type="date"
              icon="schedule"
              value={formData.dueDate}
              onChange={e => setField('dueDate', e.target.value)}
            />
          </div>

          <SelectField
            label="Status"
            value={formData.status}
            onChange={e => setField('status', e.target.value)}
          >
            {CORRESPONDENCE_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </SelectField>

          <TextArea
            label="Notes / Action Taken"
            icon="notes"
            value={formData.notes}
            onChange={e => setField('notes', e.target.value)}
            rows={4}
          />

          {/* AI Assistant */}
          <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 text-primary text-sm">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span className="font-medium">AI Assistant</span>
            </div>
            <TextArea
              label="Describe what you need"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g., Draft a reply acknowledging receipt..."
              rows={2}
            />
            <Button
              variant="tonal"
              label={aiLoading ? 'Generating...' : 'Generate Notes'}
              icon="auto_awesome"
              onClick={handleGenerateNotes}
              disabled={aiLoading}
              className="w-full"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-outline/20">
            {editingId && (
              <Button
                variant="outlined"
                label="Cancel"
                icon="close"
                onClick={resetForm}
              />
            )}
            <Button
              variant="filled"
              label={editingId ? 'Update' : 'Add Entry'}
              icon={editingId ? 'save' : 'add'}
              onClick={handleSubmit}
              className="flex-1"
            />
          </div>
        </Card>

        {/* List */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">forum</span>
              <h2 className="text-lg font-bold text-on-surface">Correspondence Log</h2>
              <Badge label={`${filteredCorrespondence.length}`} color="primary" />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'tonal' : 'text'}
                icon="view_list"
                aria-label="List view"
                onClick={() => setViewMode('list')}
              />
              <Button
                variant={viewMode === 'kanban' ? 'tonal' : 'text'}
                icon="view_kanban"
                aria-label="Kanban view"
                onClick={() => setViewMode('kanban')}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search correspondence..."
              className="flex-1 min-w-[200px]"
            />

            <SelectField
              label="Direction"
              value={filterDirection}
              onChange={e => setFilterDirection(e.target.value as any)}
              className="min-w-[120px]"
            >
              <option value="">All</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </SelectField>

            <SelectField
              label="Status"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="min-w-[120px]"
            >
              <option value="">All</option>
              {CORRESPONDENCE_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </SelectField>

            <SelectField
              label="Priority"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as any)}
              className="min-w-[120px]"
            >
              <option value="">All</option>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </SelectField>
          </div>

          {/* Content */}
          {viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredCorrespondence.length === 0 ? (
                <EmptyState
                  icon="forum"
                  title="No correspondence found"
                  description="Add your first correspondence entry to get started"
                />
              ) : (
                filteredCorrespondence.map(corr => renderCorrespondenceCard(corr))
              )}
            </div>
          ) : (
            /* Kanban View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {CORRESPONDENCE_STATUSES.map(status => (
                <div key={status.value} className="space-y-3">
                  <div className={`flex items-center justify-between p-2 rounded-lg bg-${status.color}/10`}>
                    <span className={`font-medium text-${status.color}`}>{status.label}</span>
                    <Badge 
                      label={String(groupedByStatus[status.value as CorrespondenceStatus].length)} 
                      color={status.color as any}
                    />
                  </div>
                  
                  <div className="space-y-2 min-h-[200px]">
                    {groupedByStatus[status.value as CorrespondenceStatus].map(corr => 
                      renderCorrespondenceCard(corr, true)
                    )}
                    {groupedByStatus[status.value as CorrespondenceStatus].length === 0 && (
                      <div className="text-center text-xs text-on-surface-variant py-8">
                        No items
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CorrespondenceTracker;