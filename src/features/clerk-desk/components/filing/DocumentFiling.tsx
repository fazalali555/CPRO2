// components/filing/DocumentFiling.tsx

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Card, Button, Badge, TextField, SelectField, TextArea, Checkbox } from '../../../../components/M3';
import { useLocalStorageCollection } from '../../hooks/useLocalStorage';
import { AIService } from '../../services/AIService';
import { ExportService } from '../../services/ExportService';
import { useToast } from '../../../../contexts/ToastContext';
import { useConfirmDialog } from '../common/ConfirmDialog';
import { SearchBar } from '../common/SearchBar';
import { EmptyState } from '../common/EmptyState';
import { StatCard, StatsGrid } from '../common/StatCard';
import { STORAGE_KEYS, DOCUMENT_CATEGORIES } from '../../constants';
import { Document, DocumentCategory } from '../../types';
import { formatDate, formatFileSize, truncate } from '../../utils/formatters';
import { validateDocument, isAllowedFileType, isFileSizeValid } from '../../utils/validators';
import { saveFileToIDB, getFileFromIDB } from '../../../../utils';
import { auditService } from '../../../../services/SecurityService';

export const DocumentFiling: React.FC = () => {
  const { showToast } = useToast();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();
  
  const {
    items: documents,
    addItem,
    updateItem,
    removeItem,
    getItem,
  } = useLocalStorageCollection<Document>(STORAGE_KEYS.DOCUMENTS);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'general' as DocumentCategory,
    tags: '',
    description: '',
    expiryDate: '',
    isConfidential: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterConfidential, setFilterConfidential] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selection state
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Computed statistics
  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let confidentialCount = 0;
    let expiringCount = 0;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    documents.forEach(doc => {
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
      if (doc.isConfidential) confidentialCount++;
      if (doc.expiryDate && new Date(doc.expiryDate) <= thirtyDaysFromNow) expiringCount++;
    });

    return {
      total: documents.length,
      byCategory,
      confidential: confidentialCount,
      expiring: expiringCount,
    };
  }, [documents]);

  // Filtered and sorted documents
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (filterCategory) {
      result = result.filter(doc => doc.category === filterCategory);
    }

    // Confidential filter
    if (filterConfidential !== 'all') {
      result = result.filter(doc => 
        filterConfidential === 'yes' ? doc.isConfidential : !doc.isConfidential
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'date':
        default:
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [documents, searchQuery, filterCategory, filterConfidential, sortBy, sortOrder]);

  // Form field handler
  const setField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when field changes
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [validationErrors]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      category: 'general',
      tags: '',
      description: '',
      expiryDate: '',
      isConfidential: false,
    });
    setFile(null);
    setAiPrompt('');
    setValidationErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // File selection handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!isAllowedFileType(selectedFile.name)) {
      showToast('File type not allowed. Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT', 'error');
      e.target.value = '';
      return;
    }

    // Validate file size (10MB max)
    if (!isFileSizeValid(selectedFile.size, 10)) {
      showToast('File size exceeds 10MB limit', 'error');
      e.target.value = '';
      return;
    }

    setFile(selectedFile);

    // Auto-fill title from filename if empty
    if (!formData.title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setField('title', nameWithoutExt);
    }
  }, [formData.title, setField, showToast]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    const validation = validateDocument(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showToast('Please fix the validation errors', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let fileId = '';
      let fileName = '';
      let fileSize = 0;
      let fileType = '';

      // Save file to IndexedDB if provided
      if (file) {
        fileId = `clerk_doc_${Date.now()}_${file.name}`;
        const buffer = await file.arrayBuffer();
        await saveFileToIDB(fileId, new Uint8Array(buffer));
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
      }

      // Create document entry
      const newDoc = addItem({
        title: formData.title.trim(),
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        description: formData.description.trim(),
        fileId,
        fileName,
        fileSize,
        fileType,
        expiryDate: formData.expiryDate || undefined,
        isConfidential: formData.isConfidential,
        accessLog: [],
      });

      auditService.log('DOC_FILED', `Filed document: ${newDoc.title}`, newDoc.id);
      showToast('Document filed successfully', 'success');
      resetForm();
    } catch (error) {
      console.error('Failed to file document:', error);
      showToast('Failed to file document', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, file, addItem, resetForm, showToast]);

  // AI description generation
  const handleGenerateDescription = useCallback(async () => {
    if (!aiPrompt.trim()) {
      showToast('Please enter a prompt for AI generation', 'error');
      return;
    }

    setAiLoading(true);
    try {
      const response = await AIService.generateSummary(
        `Document: ${formData.title}\nContext: ${aiPrompt}`,
        120
      );

      if (response.error) {
        showToast(response.error, 'error');
        return;
      }

      setField('description', response.text);
      setAiPrompt('');
      showToast('Description generated', 'success');
    } catch (error) {
      showToast('Failed to generate description', 'error');
    } finally {
      setAiLoading(false);
    }
  }, [aiPrompt, formData.title, setField, showToast]);

  // Download document
  const handleDownload = useCallback(async (doc: Document) => {
    if (!doc.fileId) {
      showToast('No file attached to this document', 'error');
      return;
    }

    try {
      const data = await getFileFromIDB(doc.fileId);
      if (!data) {
        showToast('File not found in storage', 'error');
        return;
      }

      const blob = data instanceof Blob
        ? data
        : typeof data === 'string'
          ? new Blob([data])
          : new Blob([data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer)]);

      ExportService.downloadBlob(blob, doc.fileName || 'document');

      // Log access
      updateItem(doc.id, {
        accessLog: [
          ...(doc.accessLog || []),
          {
            userId: 'current_user',
            userName: 'Current User',
            action: 'download',
            timestamp: new Date().toISOString(),
          },
        ],
      });

      auditService.log('DOC_RETRIEVED', `Downloaded document: ${doc.title}`, doc.id);
    } catch (error) {
      showToast('Failed to download document', 'error');
    }
  }, [updateItem, showToast]);

  // Delete document
  const handleDelete = useCallback(async (doc: Document) => {
    const confirmed = await confirm({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${doc.title}"? This action cannot be undone.`,
      variant: 'danger',
    });

    if (confirmed) {
      removeItem(doc.id);
      auditService.log('DOC_DELETED', `Deleted document: ${doc.title}`, doc.id);
      showToast('Document deleted', 'success');
    }
  }, [confirm, removeItem, showToast]);

  // Batch delete
  const handleBatchDelete = useCallback(async () => {
    if (selectedDocs.size === 0) return;

    const confirmed = await confirm({
      title: 'Delete Selected Documents',
      message: `Are you sure you want to delete ${selectedDocs.size} document(s)?`,
      variant: 'danger',
    });

    if (confirmed) {
      selectedDocs.forEach(id => removeItem(id));
      setSelectedDocs(new Set());
      showToast(`${selectedDocs.size} documents deleted`, 'success');
    }
  }, [confirm, selectedDocs, removeItem, showToast]);

  // Toggle selection
  const toggleSelection = useCallback((docId: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map(d => d.id)));
    }
  }, [filteredDocuments, selectedDocs.size]);

  // Get category info
  const getCategoryInfo = (category: string) => {
    return DOCUMENT_CATEGORIES.find(c => c.value === category) || DOCUMENT_CATEGORIES[0];
  };

  return (
    <div className="space-y-6">
      <ConfirmDialogComponent />

      {/* Statistics */}
      <StatsGrid
        stats={[
          { label: 'Total Documents', value: stats.total, icon: 'folder', color: 'primary' },
          { label: 'Confidential', value: stats.confidential, icon: 'lock', color: 'warning' },
          { label: 'Expiring Soon', value: stats.expiring, icon: 'schedule', color: 'error' },
          { 
            label: 'This Month', 
            value: documents.filter(d => {
              const docDate = new Date(d.createdAt);
              const now = new Date();
              return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
            }).length, 
            icon: 'calendar_today', 
            color: 'success' 
          },
        ]}
        columns={4}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filing Form */}
        <Card variant="elevated" className="bg-surface space-y-6 p-6 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">upload_file</span>
            <h2 className="text-lg font-bold text-on-surface">File Document</h2>
          </div>

          <TextField
            label="Document Title"
            icon="description"
            value={formData.title}
            onChange={e => setField('title', e.target.value)}
            error={validationErrors.title}
            required
          />

          <SelectField
            label="Category"
            value={formData.category}
            onChange={e => setField('category', e.target.value)}
            error={validationErrors.category}
          >
            {DOCUMENT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </SelectField>

          <TextField
            label="Tags (comma separated)"
            icon="sell"
            value={formData.tags}
            onChange={e => setField('tags', e.target.value)}
            placeholder="e.g., important, 2024, budget"
          />

          <TextArea
            label="Description"
            icon="notes"
            value={formData.description}
            onChange={e => setField('description', e.target.value)}
            rows={4}
          />

          {/* AI Description Generator */}
          <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 text-primary text-sm">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span className="font-medium">AI Description</span>
            </div>
            <TextArea
              label="Describe the document for AI"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Enter key points about this document..."
              rows={2}
            />
            <Button
              variant="tonal"
              label={aiLoading ? 'Generating...' : 'Generate Description'}
              icon="auto_awesome"
              onClick={handleGenerateDescription}
              disabled={aiLoading}
              className="w-full"
            />
          </div>

          <TextField
            label="Expiry Date (optional)"
            type="date"
            icon="event"
            value={formData.expiryDate}
            onChange={e => setField('expiryDate', e.target.value)}
            error={validationErrors.expiryDate}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              label="Mark as Confidential"
              checked={formData.isConfidential}
              onChange={e => setField('isConfidential', e.target.checked)}
            />
            {formData.isConfidential && (
              <span className="material-symbols-outlined text-warning text-sm">lock</span>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface">Attachment</label>
            <div 
              className={`
                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                transition-colors duration-200
                ${file 
                  ? 'border-primary bg-primary/5' 
                  : 'border-outline/40 hover:border-outline/60 hover:bg-surface-variant/10'
                }
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-primary">attach_file</span>
                  <div className="text-left">
                    <div className="font-medium text-on-surface">{file.name}</div>
                    <div className="text-xs text-on-surface-variant">{formatFileSize(file.size)}</div>
                  </div>
                  <Button
                    variant="text"
                    icon="close"
                    aria-label="Remove file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  />
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">cloud_upload</span>
                  <div className="text-sm text-on-surface-variant">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-xs text-on-surface-variant/70 mt-1">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT (max 10MB)
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-outline/20">
            <Button
              variant="outlined"
              label="Reset"
              icon="refresh"
              onClick={resetForm}
            />
            <Button
              variant="filled"
              label={isSubmitting ? 'Filing...' : 'File Document'}
              icon="folder"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            />
          </div>
        </Card>

        {/* Document Library */}
        <Card variant="elevated" className="bg-surface space-y-6 p-6 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">folder_open</span>
              <h2 className="text-lg font-bold text-on-surface">Document Library</h2>
              <Badge label={`${filteredDocuments.length} of ${documents.length}`} color="primary" />
            </div>

            {selectedDocs.size > 0 && (
              <Button
                variant="outlined"
                label={`Delete (${selectedDocs.size})`}
                icon="delete"
                onClick={handleBatchDelete}
              />
            )}
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search documents..."
            />

            <div className="flex flex-wrap gap-3 items-center">
              <SelectField
                label="Category"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="min-w-[150px]"
              >
                <option value="">All Categories</option>
                {DOCUMENT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </SelectField>

              <SelectField
                label="Confidential"
                value={filterConfidential}
                onChange={e => setFilterConfidential(e.target.value as any)}
                className="min-w-[120px]"
              >
                <option value="all">All</option>
                <option value="yes">Confidential</option>
                <option value="no">Public</option>
              </SelectField>

              <SelectField
                label="Sort By"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="min-w-[120px]"
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="category">Category</option>
              </SelectField>

              <Button
                variant="text"
                icon={sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                aria-label="Toggle sort order"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              />

              {filteredDocuments.length > 0 && (
                <Button
                  variant="text"
                  label={selectedDocs.size === filteredDocuments.length ? 'Deselect All' : 'Select All'}
                  onClick={selectAll}
                />
              )}
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <EmptyState
                icon="folder_off"
                title="No documents found"
                description={searchQuery || filterCategory ? 'Try adjusting your filters' : 'Start by filing your first document'}
              />
            ) : (
              filteredDocuments.map(doc => {
                const categoryInfo = getCategoryInfo(doc.category);
                const isExpiringSoon = doc.expiryDate && new Date(doc.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                const isSelected = selectedDocs.has(doc.id);

                return (
                  <div
                    key={doc.id}
                    className={`
                      p-4 rounded-xl border transition-all duration-200
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-outline/20 hover:border-outline/40 hover:bg-surface-variant/10'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(doc.id)}
                        className="mt-1"
                      />

                      <div className={`p-2 rounded-lg bg-${categoryInfo.value === 'legal' ? 'error' : 'primary'}/10`}>
                        <span className={`material-symbols-outlined text-${categoryInfo.value === 'legal' ? 'error' : 'primary'}`}>
                          {categoryInfo.icon}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-on-surface truncate">{doc.title}</span>
                          {doc.isConfidential && (
                            <span className="material-symbols-outlined text-warning text-sm">lock</span>
                          )}
                          {isExpiringSoon && (
                            <Badge label="Expiring" color="error" className="text-xs" />
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-2 text-xs text-on-surface-variant mb-2">
                          <Badge label={categoryInfo.label} color="primary" className="text-xs" />
                          <span>{formatDate(doc.createdAt, 'relative')}</span>
                          {doc.fileName && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">attach_file</span>
                              {formatFileSize(doc.fileSize || 0)}
                            </span>
                          )}
                        </div>

                        {doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {doc.tags.map(tag => (
                              <Badge key={tag} label={tag} color="neutral" className="text-xs" />
                            ))}
                          </div>
                        )}

                        {doc.description && (
                          <p className="text-sm text-on-surface-variant line-clamp-2">
                            {doc.description}
                          </p>
                        )}

                        {doc.expiryDate && (
                          <div className={`text-xs mt-2 ${isExpiringSoon ? 'text-error' : 'text-on-surface-variant'}`}>
                            <span className="material-symbols-outlined text-xs align-middle mr-1">schedule</span>
                            Expires: {formatDate(doc.expiryDate)}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1">
                        {doc.fileId && (
                          <Button
                            variant="text"
                            icon="download"
                            aria-label="Download document"
                            onClick={() => handleDownload(doc)}
                          />
                        )}
                        <Button
                          variant="text"
                          icon="delete"
                          aria-label="Delete document"
                          onClick={() => handleDelete(doc)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card variant="elevated" className="bg-surface p-6 shadow-lg">
        <h3 className="text-lg font-bold text-on-surface mb-4">Documents by Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {DOCUMENT_CATEGORIES.map(cat => {
            const count = stats.byCategory[cat.value] || 0;
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

            return (
              <div
                key={cat.value}
                className={`
                  p-4 rounded-xl border border-outline/20 text-center cursor-pointer
                  hover:border-outline/40 hover:bg-surface-variant/10 transition-all
                  ${filterCategory === cat.value ? 'border-primary bg-primary/5' : ''}
                `}
                onClick={() => setFilterCategory(filterCategory === cat.value ? '' : cat.value)}
              >
                <span className="material-symbols-outlined text-2xl text-primary mb-2">{cat.icon}</span>
                <div className="font-bold text-xl text-on-surface">{count}</div>
                <div className="text-xs text-on-surface-variant">{cat.label}</div>
                <div className="w-full bg-surface-variant rounded-full h-1 mt-2">
                  <div
                    className="bg-primary rounded-full h-1 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default DocumentFiling;