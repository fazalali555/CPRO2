// components/records/RecordsManager.tsx

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Card, Button, Badge, TextField, SelectField, TextArea } from '../../../../components/M3';
import { useLocalStorageCollection } from '../../hooks/useLocalStorage';
import { useToast } from '../../../../contexts/ToastContext';
import { useConfirmDialog } from '../common/ConfirmDialog';
import { SearchBar } from '../common/SearchBar';
import { EmptyState } from '../common/EmptyState';
import { StatsGrid } from '../common/StatCard';
import { ExportService } from '../../services/ExportService';
import { STORAGE_KEYS, RECORD_TYPES } from '../../constants';
import { Record as RecordType, RecordType as RecordTypeEnum, Attachment } from '../../types';
import { formatDate, formatFileSize, generateReferenceNumber } from '../../utils/formatters';
import { saveFileToIDB, getFileFromIDB } from '../../../../utils';
import { auditService } from '../../../../services/SecurityService';

const EXPENSE_CATEGORIES = [
  { value: 'stationery', label: 'Stationery' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'refreshments', label: 'Refreshments' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

export const RecordsManager: React.FC = () => {
  const { showToast } = useToast();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();

  const {
    items: records,
    addItem,
    updateItem,
    removeItem,
    getItem,
  } = useLocalStorageCollection<RecordType>(STORAGE_KEYS.RECORDS);

  // Form state
  const [formData, setFormData] = useState({
    type: 'dispatch' as RecordTypeEnum,
    refNo: '',
    date: new Date().toISOString().slice(0, 10),
    details: '',
    amount: '',
    category: '',
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<RecordTypeEnum | ''>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'refNo' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Statistics
  const stats = useMemo(() => {
    const today = new Date();
    const thisMonth = today.toISOString().slice(0, 7);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);

    const byType: Record<string, number> = {};
    RECORD_TYPES.forEach(type => {
      byType[type.value] = records.filter(r => r.type === type.value).length;
    });

    const totalExpenses = records
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const thisMonthExpenses = records
      .filter(r => r.type === 'expense' && r.date.startsWith(thisMonth))
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    const thisMonthRecords = records.filter(r => r.date.startsWith(thisMonth)).length;

    return {
      total: records.length,
      byType,
      totalExpenses,
      thisMonthExpenses,
      thisMonthRecords,
      dispatches: byType.dispatch || 0,
      receipts: byType.receipt || 0,
    };
  }, [records]);

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = !searchQuery ||
        record.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.refNo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = !filterType || record.type === filterType;

      const matchesDateFrom = !filterDateFrom || record.date >= filterDateFrom;
      const matchesDateTo = !filterDateTo || record.date <= filterDateTo;

      return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
    }).sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'refNo':
          comparison = a.refNo.localeCompare(b.refNo);
          break;
        case 'amount':
          comparison = (a.amount || 0) - (b.amount || 0);
          break;
        case 'date':
        default:
          comparison = a.date.localeCompare(b.date);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [records, searchQuery, filterType, filterDateFrom, filterDateTo, sortBy, sortOrder]);

  // Form handlers
  const setField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      type: 'dispatch',
      refNo: '',
      date: new Date().toISOString().slice(0, 10),
      details: '',
      amount: '',
      category: '',
    });
    setAttachments([]);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const loadForEdit = useCallback((id: string) => {
    const record = getItem(id);
    if (record) {
      setFormData({
        type: record.type,
        refNo: record.refNo,
        date: record.date,
        details: record.details,
        amount: record.amount?.toString() || '',
        category: record.category || '',
      });
      setAttachments(record.attachments || []);
      setEditingId(id);
    }
  }, [getItem]);

  const generateRefNo = useCallback(() => {
    const prefix = formData.type.toUpperCase().slice(0, 3);
    const refNo = generateReferenceNumber(prefix);
    setField('refNo', refNo);
  }, [formData.type, setField]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `record_${Date.now()}_${i}_${file.name}`;
      const buffer = await file.arrayBuffer();
      await saveFileToIDB(fileId, new Uint8Array(buffer));

      newAttachments.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        fileId,
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleRemoveAttachment = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.details.trim()) {
      showToast('Details are required', 'error');
      return;
    }
    if (!formData.date) {
      showToast('Date is required', 'error');
      return;
    }

    const data = {
      type: formData.type,
      refNo: formData.refNo.trim() || generateReferenceNumber(formData.type.toUpperCase().slice(0, 3)),
      date: formData.date,
      details: formData.details.trim(),
      amount: formData.amount ? Number(formData.amount) : undefined,
      category: formData.category || undefined,
      attachments,
    };

    if (editingId) {
      updateItem(editingId, data);
      auditService.log('RECORD_UPDATED', `Updated ${data.type} record: ${data.refNo}`, editingId);
      showToast('Record updated', 'success');
    } else {
      const newRecord = addItem(data);
      auditService.log('RECORD_ADDED', `Added ${data.type} record: ${data.refNo}`, newRecord.id);
      showToast('Record added', 'success');
    }

    resetForm();
  }, [formData, attachments, editingId, addItem, updateItem, resetForm, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    const record = getItem(id);
    const confirmed = await confirm({
      title: 'Delete Record',
      message: `Are you sure you want to delete this ${record?.type} record?`,
      variant: 'danger',
    });

    if (confirmed) {
      removeItem(id);
      auditService.log('RECORD_DELETED', `Deleted ${record?.type} record: ${record?.refNo}`, id);
      showToast('Record deleted', 'success');
    }
  }, [confirm, getItem, removeItem, showToast]);

  const handleDownloadAttachment = useCallback(async (attachment: Attachment) => {
    try {
      const data = await getFileFromIDB(attachment.fileId);
      if (!data) {
        showToast('File not found', 'error');
        return;
      }

      const blob = data instanceof Blob
        ? data
        : new Blob([data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer)]);

      ExportService.downloadBlob(blob, attachment.name);
    } catch (error) {
      showToast('Failed to download file', 'error');
    }
  }, [showToast]);

  const handleExportRecords = useCallback(() => {
    const csv = [
      ['Type', 'Reference No', 'Date', 'Details', 'Amount', 'Category'].join(','),
      ...filteredRecords.map(r => [
        r.type,
        r.refNo,
        r.date,
        `"${r.details.replace(/"/g, '""')}"`,
        r.amount || '',
        r.category || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    ExportService.downloadBlob(blob, `records-${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Records exported', 'success');
  }, [filteredRecords, showToast]);

  // Get type info
  const getTypeInfo = (type: string) => {
    return RECORD_TYPES.find(t => t.value === type) || RECORD_TYPES[0];
  };

  // Render record card
  const renderRecordCard = (record: RecordType) => {
    const typeInfo = getTypeInfo(record.type);
    const hasAttachments = record.attachments && record.attachments.length > 0;

    return (
      <div
        key={record.id}
        className="p-4 rounded-xl border border-outline/20 hover:border-outline/40 hover:bg-surface-variant/10 transition-all duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-primary/10`}>
              <span className="material-symbols-outlined text-primary">{typeInfo.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge label={typeInfo.label} color="primary" className="text-xs" />
                {record.refNo && (
                  <span className="font-mono text-sm text-on-surface-variant">{record.refNo}</span>
                )}
              </div>
              <div className="font-medium text-on-surface mb-1">{record.details}</div>
              <div className="flex items-center flex-wrap gap-3 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {formatDate(record.date)}
                </span>
                {record.amount !== undefined && record.amount > 0 && (
                  <span className="flex items-center gap-1 font-medium text-success">
                    <span className="material-symbols-outlined text-sm">payments</span>
                    PKR {record.amount.toLocaleString()}
                  </span>
                )}
                {record.category && (
                  <Badge label={record.category} color="neutral" className="text-xs" />
                )}
              </div>
              {hasAttachments && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">attach_file</span>
                  <div className="flex flex-wrap gap-1">
                    {record.attachments!.map(att => (
                      <button
                        key={att.id}
                        onClick={() => handleDownloadAttachment(att)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {att.name}
                        <span className="text-on-surface-variant">({formatFileSize(att.size)})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              variant="text"
              icon="edit"
              aria-label="Edit"
              onClick={() => loadForEdit(record.id)}
            />
            <Button
              variant="text"
              icon="delete"
              aria-label="Delete"
              onClick={() => handleDelete(record.id)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ConfirmDialogComponent />

      {/* Statistics */}
      <StatsGrid
        stats={[
          { label: 'Total Records', value: stats.total, icon: 'description', color: 'primary' },
          { label: 'Dispatches', value: stats.dispatches, icon: 'send', color: 'info' },
          { label: 'Receipts', value: stats.receipts, icon: 'inbox', color: 'success' },
          { label: 'This Month', value: stats.thisMonthRecords, icon: 'calendar_today', color: 'warning' },
          { 
            label: 'Total Expenses', 
            value: `PKR ${stats.totalExpenses.toLocaleString()}`, 
            icon: 'payments', 
            color: 'error' 
          },
          { 
            label: 'This Month Expenses', 
            value: `PKR ${stats.thisMonthExpenses.toLocaleString()}`, 
            icon: 'receipt_long', 
            color: 'warning' 
          },
        ]}
        columns={3}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              {editingId ? 'edit' : 'add'}
            </span>
            <h2 className="text-lg font-bold text-on-surface">
              {editingId ? 'Edit Record' : 'Add Record'}
            </h2>
          </div>

          <SelectField
            label="Record Type"
            value={formData.type}
            onChange={e => setField('type', e.target.value)}
          >
            {RECORD_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </SelectField>

          <div className="flex gap-2">
            <TextField
              label="Reference No"
              icon="bookmark"
              value={formData.refNo}
              onChange={e => setField('refNo', e.target.value)}
              placeholder="Auto-generated if empty"
              className="flex-1"
            />
            <Button
              variant="tonal"
              icon="autorenew"
              aria-label="Generate reference"
              onClick={generateRefNo}
              className="mt-6"
            />
          </div>

          <TextField
            label="Date"
            type="date"
            icon="event"
            value={formData.date}
            onChange={e => setField('date', e.target.value)}
            required
          />

          <TextArea
            label="Details"
            icon="notes"
            value={formData.details}
            onChange={e => setField('details', e.target.value)}
            rows={3}
            required
          />

          {/* Amount - shown for expense, stock types */}
          {['expense', 'stock', 'receipt'].includes(formData.type) && (
            <TextField
              label="Amount (PKR)"
              type="number"
              icon="payments"
              value={formData.amount}
              onChange={e => setField('amount', e.target.value)}
              placeholder="0"
            />
          )}

          {/* Category - shown for expense type */}
          {formData.type === 'expense' && (
            <SelectField
              label="Category"
              value={formData.category}
              onChange={e => setField('category', e.target.value)}
            >
              <option value="">Select category...</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </SelectField>
          )}

          {/* Attachments */}
          <div className="space-y-3 p-4 bg-surface-variant/20 rounded-xl border border-outline/20">
            <div className="text-sm font-medium text-on-surface">Attachments</div>
            
            <div
              className="border-2 border-dashed border-outline/40 rounded-xl p-4 text-center cursor-pointer hover:border-outline/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="material-symbols-outlined text-2xl text-on-surface-variant mb-1">cloud_upload</span>
              <div className="text-sm text-on-surface-variant">Click to upload files</div>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 p-2 bg-surface rounded-lg">
                    <span className="material-symbols-outlined text-on-surface-variant">attach_file</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-on-surface truncate">{att.name}</div>
                      <div className="text-xs text-on-surface-variant">{formatFileSize(att.size)}</div>
                    </div>
                    <Button
                      variant="text"
                      icon="close"
                      aria-label="Remove"
                      onClick={() => handleRemoveAttachment(att.id)}
                    />
                  </div>
                ))}
              </div>
            )}
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
              label={editingId ? 'Update' : 'Add Record'}
              icon={editingId ? 'save' : 'add'}
              onClick={handleSubmit}
              className="flex-1"
            />
          </div>
        </Card>

        {/* Records List */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              <h2 className="text-lg font-bold text-on-surface">Records</h2>
              <Badge label={`${filteredRecords.length}`} color="primary" />
            </div>

            <Button
              variant="outlined"
              label="Export CSV"
              icon="download"
              onClick={handleExportRecords}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search records..."
              className="flex-1 min-w-[200px]"
            />

            <SelectField
              label="Type"
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="min-w-[120px]"
            >
              <option value="">All Types</option>
              {RECORD_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </SelectField>

            <TextField
              label="From Date"
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="min-w-[140px]"
            />

            <TextField
              label="To Date"
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="min-w-[140px]"
            />

            <SelectField
              label="Sort By"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="min-w-[100px]"
            >
              <option value="date">Date</option>
              <option value="refNo">Ref No</option>
              <option value="amount">Amount</option>
            </SelectField>

            <Button
              variant="text"
              icon={sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              aria-label="Toggle sort order"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            />
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <EmptyState
                icon="description"
                title="No records found"
                description={searchQuery || filterType ? 'Try adjusting your filters' : 'Add your first record to get started'}
              />
            ) : (
              filteredRecords.map(record => renderRecordCard(record))
            )}
          </div>
        </Card>
      </div>

      {/* Records by Type */}
      <Card variant="elevated" className="bg-surface p-6 shadow-lg">
        <h3 className="text-lg font-bold text-on-surface mb-4">Records by Type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {RECORD_TYPES.map(type => {
            const count = stats.byType[type.value] || 0;
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

            return (
              <div
                key={type.value}
                className={`
                  p-4 rounded-xl border border-outline/20 text-center cursor-pointer
                  hover:border-outline/40 hover:bg-surface-variant/10 transition-all
                  ${filterType === type.value ? 'border-primary bg-primary/5' : ''}
                `}
                onClick={() => setFilterType(filterType === type.value ? '' : type.value)}
              >
                <span className="material-symbols-outlined text-2xl text-primary mb-2">{type.icon}</span>
                <div className="font-bold text-xl text-on-surface">{count}</div>
                <div className="text-xs text-on-surface-variant">{type.label}</div>
                <div className="w-full bg-surface-variant rounded-full h-1 mt-2">
                  <div
                    className="bg-primary rounded-full h-1"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Expense Summary */}
      {stats.totalExpenses > 0 && (
        <Card variant="elevated" className="bg-surface p-6 shadow-lg">
          <h3 className="text-lg font-bold text-on-surface mb-4">Expense Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {EXPENSE_CATEGORIES.map(cat => {
              const expenses = records.filter(r => r.type === 'expense' && r.category === cat.value);
              const total = expenses.reduce((sum, r) => sum + (r.amount || 0), 0);

              return (
                <div
                  key={cat.value}
                  className="p-4 rounded-xl border border-outline/20 text-center"
                >
                  <div className="font-bold text-lg text-on-surface">PKR {total.toLocaleString()}</div>
                  <div className="text-xs text-on-surface-variant">{cat.label}</div>
                  <div className="text-xs text-on-surface-variant/70 mt-1">{expenses.length} records</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RecordsManager;