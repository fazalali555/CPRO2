// components/contacts/ContactDirectory.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Badge, TextField, SelectField, TextArea, Checkbox } from '../../../../components/M3';
import { useLocalStorageCollection } from '../../hooks/useLocalStorage';
import { useToast } from '../../../../contexts/ToastContext';
import { useConfirmDialog } from '../common/ConfirmDialog';
import { SearchBar } from '../common/SearchBar';
import { EmptyState } from '../common/EmptyState';
import { StatsGrid } from '../common/StatCard';
import { ExportService } from '../../services/ExportService';
import { STORAGE_KEYS } from '../../constants';
import { Contact, ContactType } from '../../types';
import { formatDate } from '../../utils/formatters';
import { validateContact, isValidEmail, isValidPhone } from '../../utils/validators';
import { auditService } from '../../../../services/SecurityService';

const CONTACT_GROUPS = [
  { value: 'education', label: 'Education Department' },
  { value: 'school', label: 'Schools' },
  { value: 'government', label: 'Government Offices' },
  { value: 'vendor', label: 'Vendors & Suppliers' },
  { value: 'media', label: 'Media' },
  { value: 'other', label: 'Other' },
];

const DESIGNATIONS = [
  'Headmaster',
  'Headmistress',
  'Principal',
  'Teacher',
  'Clerk',
  'Education Officer',
  'District Education Officer',
  'Deputy Director',
  'Director',
  'Secretary',
  'Assistant',
  'Driver',
  'Peon',
  'Other',
];

export const ContactDirectory: React.FC = () => {
  const { showToast } = useToast();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();

  const {
    items: contacts,
    addItem,
    updateItem,
    removeItem,
    getItem,
  } = useLocalStorageCollection<Contact>(STORAGE_KEYS.CONTACTS);

  // Form state
  const [formData, setFormData] = useState({
    type: 'internal' as ContactType,
    name: '',
    designation: '',
    organization: '',
    department: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    notes: '',
    tags: '',
    isFavorite: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ContactType | ''>('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'organization' | 'recent'>('name');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  // Statistics
  const stats = useMemo(() => {
    const internal = contacts.filter(c => c.type === 'internal').length;
    const external = contacts.filter(c => c.type === 'external').length;
    const favorites = contacts.filter(c => c.isFavorite).length;
    const recentlyAdded = contacts.filter(c => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.createdAt) >= weekAgo;
    }).length;

    const byGroup: Record<string, number> = {};
    CONTACT_GROUPS.forEach(group => {
      byGroup[group.value] = contacts.filter(c => 
        c.tags?.includes(group.value) || 
        c.organization.toLowerCase().includes(group.label.toLowerCase())
      ).length;
    });

    return { total: contacts.length, internal, external, favorites, recentlyAdded, byGroup };
  }, [contacts]);

  // Filtered and sorted contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = !searchQuery ||
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.designation?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = !filterType || contact.type === filterType;

      const matchesGroup = !filterGroup || 
        contact.tags?.includes(filterGroup) ||
        contact.organization.toLowerCase().includes(filterGroup.toLowerCase());

      const matchesFavorites = !showFavoritesOnly || contact.isFavorite;

      return matchesSearch && matchesType && matchesGroup && matchesFavorites;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'organization':
          return a.organization.localeCompare(b.organization);
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
        default:
          // Favorites first, then alphabetical
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return a.name.localeCompare(b.name);
      }
    });
  }, [contacts, searchQuery, filterType, filterGroup, showFavoritesOnly, sortBy]);

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
      type: 'internal',
      name: '',
      designation: '',
      organization: '',
      department: '',
      phone: '',
      alternatePhone: '',
      email: '',
      address: '',
      notes: '',
      tags: '',
      isFavorite: false,
    });
    setEditingId(null);
    setValidationErrors({});
  }, []);

  const loadForEdit = useCallback((id: string) => {
    const contact = getItem(id);
    if (contact) {
      setFormData({
        type: contact.type,
        name: contact.name,
        designation: contact.designation || '',
        organization: contact.organization,
        department: contact.department || '',
        phone: contact.phone,
        alternatePhone: contact.alternatePhone || '',
        email: contact.email || '',
        address: contact.address || '',
        notes: contact.notes || '',
        tags: (contact.tags || []).join(', '),
        isFavorite: contact.isFavorite,
      });
      setEditingId(id);
    }
  }, [getItem]);

  const handleSubmit = useCallback(() => {
    const validation = validateContact({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
    });

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showToast('Please fix the validation errors', 'error');
      return;
    }

    const data = {
      type: formData.type,
      name: formData.name.trim(),
      designation: formData.designation.trim() || undefined,
      organization: formData.organization.trim(),
      department: formData.department.trim() || undefined,
      phone: formData.phone.trim(),
      alternatePhone: formData.alternatePhone.trim() || undefined,
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      isFavorite: formData.isFavorite,
    };

    if (editingId) {
      updateItem(editingId, data);
      auditService.log('CONTACT_UPDATED', `Updated contact: ${data.name}`, editingId);
      showToast('Contact updated', 'success');
    } else {
      const newContact = addItem(data);
      auditService.log('CONTACT_ADDED', `Added contact: ${data.name}`, newContact.id);
      showToast('Contact added', 'success');
    }

    resetForm();
  }, [formData, editingId, addItem, updateItem, resetForm, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    const contact = getItem(id);
    const confirmed = await confirm({
      title: 'Delete Contact',
      message: `Are you sure you want to delete "${contact?.name}"?`,
      variant: 'danger',
    });

    if (confirmed) {
      removeItem(id);
      auditService.log('CONTACT_DELETED', `Deleted contact: ${contact?.name}`, id);
      showToast('Contact deleted', 'success');
    }
  }, [confirm, getItem, removeItem, showToast]);

  const handleToggleFavorite = useCallback((id: string) => {
    const contact = getItem(id);
    if (contact) {
      updateItem(id, { isFavorite: !contact.isFavorite });
      showToast(contact.isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success');
    }
  }, [getItem, updateItem, showToast]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedContacts.size === 0) return;

    const confirmed = await confirm({
      title: 'Delete Selected Contacts',
      message: `Are you sure you want to delete ${selectedContacts.size} contact(s)?`,
      variant: 'danger',
    });

    if (confirmed) {
      selectedContacts.forEach(id => removeItem(id));
      setSelectedContacts(new Set());
      showToast(`${selectedContacts.size} contacts deleted`, 'success');
    }
  }, [confirm, selectedContacts, removeItem, showToast]);

  const handleExportContacts = useCallback(() => {
    const csv = [
      ['Name', 'Type', 'Organization', 'Department', 'Designation', 'Phone', 'Alt Phone', 'Email', 'Address', 'Notes', 'Tags'].join(','),
      ...filteredContacts.map(c => [
        `"${c.name}"`,
        c.type,
        `"${c.organization}"`,
        `"${c.department || ''}"`,
        `"${c.designation || ''}"`,
        c.phone,
        c.alternatePhone || '',
        c.email || '',
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${(c.notes || '').replace(/"/g, '""')}"`,
        `"${(c.tags || []).join(';')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    ExportService.downloadBlob(blob, `contacts-${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Contacts exported', 'success');
  }, [filteredContacts, showToast]);

  const handleCall = useCallback((phone: string) => {
    window.location.href = `tel:${phone}`;
  }, []);

  const handleEmail = useCallback((email: string) => {
    window.location.href = `mailto:${email}`;
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Render contact card
  const renderContactCard = (contact: Contact, isGridView = false) => {
    const isSelected = selectedContacts.has(contact.id);

    if (isGridView) {
      return (
        <div
          key={contact.id}
          className={`
            p-4 rounded-xl border transition-all duration-200 cursor-pointer
            ${isSelected ? 'border-primary bg-primary/5' : 'border-outline/20'}
            hover:border-outline/40 hover:bg-surface-variant/10
          `}
          onClick={() => loadForEdit(contact.id)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                ${contact.type === 'internal' ? 'bg-primary' : 'bg-success'}
              `}>
                {contact.name.charAt(0).toUpperCase()}
              </div>
              {contact.isFavorite && (
                <span className="material-symbols-outlined text-warning text-sm">star</span>
              )}
            </div>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                toggleSelection(contact.id);
              }}
            />
          </div>

          <div className="font-semibold text-on-surface truncate">{contact.name}</div>
          {contact.designation && (
            <div className="text-sm text-on-surface-variant truncate">{contact.designation}</div>
          )}
          <div className="text-sm text-on-surface-variant truncate">{contact.organization}</div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline/20">
            <Button
              variant="text"
              icon="call"
              aria-label="Call"
              onClick={(e) => {
                e.stopPropagation();
                handleCall(contact.phone);
              }}
            />
            {contact.email && (
              <Button
                variant="text"
                icon="mail"
                aria-label="Email"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEmail(contact.email!);
                }}
              />
            )}
            <Button
              variant="text"
              icon={contact.isFavorite ? 'star' : 'star_outline'}
              aria-label="Toggle favorite"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(contact.id);
              }}
            />
          </div>
        </div>
      );
    }

    // List view
    return (
      <div
        key={contact.id}
        className={`
          p-4 rounded-xl border transition-all duration-200
          ${isSelected ? 'border-primary bg-primary/5' : 'border-outline/20'}
          hover:border-outline/40 hover:bg-surface-variant/10
        `}
      >
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(contact.id)}
            className="mt-1"
          />

          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0
            ${contact.type === 'internal' ? 'bg-primary' : 'bg-success'}
          `}>
            {contact.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-on-surface">{contact.name}</span>
              {contact.isFavorite && (
                <span className="material-symbols-outlined text-warning text-sm">star</span>
              )}
              <Badge 
                label={contact.type === 'internal' ? 'Internal' : 'External'} 
                color={contact.type === 'internal' ? 'primary' : 'success'} 
                className="text-xs"
              />
            </div>

            {contact.designation && (
              <div className="text-sm text-on-surface-variant">{contact.designation}</div>
            )}
            
            <div className="text-sm text-on-surface-variant">
              {contact.organization}
              {contact.department && ` • ${contact.department}`}
            </div>

            <div className="flex items-center flex-wrap gap-4 mt-2 text-sm">
              <span className="flex items-center gap-1 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">call</span>
                <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
              </span>
              {contact.alternatePhone && (
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">phone_android</span>
                  <a href={`tel:${contact.alternatePhone}`} className="hover:text-primary">{contact.alternatePhone}</a>
                </span>
              )}
              {contact.email && (
                <span className="flex items-center gap-1 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                </span>
              )}
            </div>

            {contact.address && (
              <div className="text-sm text-on-surface-variant mt-1 flex items-start gap-1">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {contact.address}
              </div>
            )}

            {contact.tags && contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {contact.tags.map(tag => (
                  <Badge key={tag} label={tag} color="neutral" className="text-xs" />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Button
              variant="text"
              icon="call"
              aria-label="Call"
              onClick={() => handleCall(contact.phone)}
            />
            {contact.email && (
              <Button
                variant="text"
                icon="mail"
                aria-label="Email"
                onClick={() => handleEmail(contact.email!)}
              />
            )}
            <Button
              variant="text"
              icon={contact.isFavorite ? 'star' : 'star_outline'}
              aria-label="Toggle favorite"
              onClick={() => handleToggleFavorite(contact.id)}
            />
            <Button
              variant="text"
              icon="edit"
              aria-label="Edit"
              onClick={() => loadForEdit(contact.id)}
            />
            <Button
              variant="text"
              icon="delete"
              aria-label="Delete"
              onClick={() => handleDelete(contact.id)}
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
          { label: 'Total Contacts', value: stats.total, icon: 'contacts', color: 'primary' },
          { label: 'Internal', value: stats.internal, icon: 'badge', color: 'info' },
          { label: 'External', value: stats.external, icon: 'public', color: 'success' },
          { label: 'Favorites', value: stats.favorites, icon: 'star', color: 'warning' },
        ]}
        columns={4}
      />

      {/* Favorites Quick Access */}
      {stats.favorites > 0 && !showFavoritesOnly && (
        <Card variant="elevated" className="bg-warning/5 border border-warning/20 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-warning">star</span>
              <h3 className="font-bold text-on-surface">Favorites</h3>
            </div>
            <Button
              variant="text"
              label="Show All"
              onClick={() => setShowFavoritesOnly(true)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {contacts
              .filter(c => c.isFavorite)
              .slice(0, 6)
              .map(contact => (
                <div
                  key={contact.id}
                  className="flex items-center gap-2 p-2 bg-surface rounded-lg border border-outline/20 cursor-pointer hover:bg-surface-variant/50"
                  onClick={() => loadForEdit(contact.id)}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                    ${contact.type === 'internal' ? 'bg-primary' : 'bg-success'}
                  `}>
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-on-surface">{contact.name}</div>
                    <div className="text-xs text-on-surface-variant">{contact.phone}</div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              {editingId ? 'edit' : 'person_add'}
            </span>
            <h2 className="text-lg font-bold text-on-surface">
              {editingId ? 'Edit Contact' : 'Add Contact'}
            </h2>
          </div>

          <SelectField
            label="Type"
            value={formData.type}
            onChange={e => setField('type', e.target.value)}
          >
            <option value="internal">Internal</option>
            <option value="external">External</option>
          </SelectField>

          <TextField
            label="Name"
            icon="person"
            value={formData.name}
            onChange={e => setField('name', e.target.value)}
            error={validationErrors.name}
            required
          />

          <SelectField
            label="Designation"
            value={formData.designation}
            onChange={e => setField('designation', e.target.value)}
          >
            <option value="">Select designation...</option>
            {DESIGNATIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </SelectField>

          <TextField
            label="Organization"
            icon="apartment"
            value={formData.organization}
            onChange={e => setField('organization', e.target.value)}
            required
          />

          <TextField
            label="Department"
            icon="badge"
            value={formData.department}
            onChange={e => setField('department', e.target.value)}
          />

          <TextField
            label="Phone"
            icon="call"
            value={formData.phone}
            onChange={e => setField('phone', e.target.value)}
            error={validationErrors.phone}
            required
          />

          <TextField
            label="Alternate Phone"
            icon="phone_android"
            value={formData.alternatePhone}
            onChange={e => setField('alternatePhone', e.target.value)}
          />

          <TextField
            label="Email"
            icon="mail"
            type="email"
            value={formData.email}
            onChange={e => setField('email', e.target.value)}
            error={validationErrors.email}
          />

          <TextArea
            label="Address"
            icon="location_on"
            value={formData.address}
            onChange={e => setField('address', e.target.value)}
            rows={2}
          />

          <TextField
            label="Tags (comma separated)"
            icon="sell"
            value={formData.tags}
            onChange={e => setField('tags', e.target.value)}
            placeholder="e.g., vip, school, supplier"
          />

          <TextArea
            label="Notes"
            icon="notes"
            value={formData.notes}
            onChange={e => setField('notes', e.target.value)}
            rows={2}
          />

          <Checkbox
            label="Mark as Favorite"
            checked={formData.isFavorite}
            onChange={e => setField('isFavorite', e.target.checked)}
          />

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
              label={editingId ? 'Update' : 'Add Contact'}
              icon={editingId ? 'save' : 'add'}
              onClick={handleSubmit}
              className="flex-1"
            />
          </div>
        </Card>

        {/* Contacts List */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">contacts</span>
              <h2 className="text-lg font-bold text-on-surface">Contacts</h2>
              <Badge label={`${filteredContacts.length}`} color="primary" />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'tonal' : 'text'}
                icon="view_list"
                aria-label="List view"
                onClick={() => setViewMode('list')}
              />
              <Button
                variant={viewMode === 'grid' ? 'tonal' : 'text'}
                icon="grid_view"
                aria-label="Grid view"
                onClick={() => setViewMode('grid')}
              />
              <Button
                variant="outlined"
                label="Export"
                icon="download"
                onClick={handleExportContacts}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search contacts..."
              className="flex-1 min-w-[200px]"
            />

            <SelectField
              label="Type"
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="min-w-[120px]"
            >
              <option value="">All Types</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </SelectField>

            <SelectField
              label="Group"
              value={filterGroup}
              onChange={e => setFilterGroup(e.target.value)}
              className="min-w-[140px]"
            >
              <option value="">All Groups</option>
              {CONTACT_GROUPS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </SelectField>

            <SelectField
              label="Sort"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="min-w-[100px]"
            >
              <option value="name">Name</option>
              <option value="organization">Organization</option>
              <option value="recent">Recent</option>
            </SelectField>

            <Checkbox
              label="Favorites"
              checked={showFavoritesOnly}
              onChange={e => setShowFavoritesOnly(e.target.checked)}
            />
          </div>

          {/* Batch Actions */}
          {selectedContacts.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
              <span className="text-sm text-on-surface">
                {selectedContacts.size} selected
              </span>
              <Button
                variant="text"
                label="Delete"
                icon="delete"
                onClick={handleBatchDelete}
              />
              <Button
                variant="text"
                label="Clear Selection"
                onClick={() => setSelectedContacts(new Set())}
              />
            </div>
          )}

          {/* Contacts Grid/List */}
          {filteredContacts.length === 0 ? (
            <EmptyState
              icon="contacts"
              title="No contacts found"
              description={searchQuery || filterType ? 'Try adjusting your filters' : 'Add your first contact to get started'}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredContacts.map(contact => renderContactCard(contact, true))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map(contact => renderContactCard(contact, false))}
            </div>
          )}
        </Card>
      </div>

      {/* Alphabet Quick Navigation */}
      <Card variant="elevated" className="bg-surface p-4 shadow-lg">
        <div className="flex items-center justify-center gap-1 flex-wrap">
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
            const count = contacts.filter(c => c.name.toUpperCase().startsWith(letter)).length;
            return (
              <button
                key={letter}
                onClick={() => setSearchQuery(letter)}
                disabled={count === 0}
                className={`
                  w-8 h-8 rounded-lg text-sm font-medium transition-colors
                  ${count > 0 
                    ? searchQuery === letter
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-variant/50 text-on-surface hover:bg-primary/20'
                    : 'bg-surface-variant/20 text-on-surface-variant/30 cursor-not-allowed'
                  }
                `}
              >
                {letter}
              </button>
            );
          })}
          <button
            onClick={() => setSearchQuery('')}
            className="px-3 h-8 rounded-lg text-sm font-medium bg-surface-variant/50 text-on-surface hover:bg-primary/20 transition-colors ml-2"
          >
            Clear
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ContactDirectory;