// components/appointments/AppointmentScheduler.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Badge, TextField, SelectField, TextArea, Checkbox } from '../../../../components/M3';
import { useLocalStorageCollection } from '../../hooks/useLocalStorage';
import { useToast } from '../../../../contexts/ToastContext';
import { useConfirmDialog } from '../common/ConfirmDialog';
import { SearchBar } from '../common/SearchBar';
import { EmptyState } from '../common/EmptyState';
import { StatsGrid } from '../common/StatCard';
import { STORAGE_KEYS } from '../../constants';
import { Appointment, Attendee, RecurrencePattern } from '../../types';
import { formatDate } from '../../utils/formatters';
import { auditService } from '../../../../services/SecurityService';

const REMINDER_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
];

const RECURRENCE_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const APPOINTMENT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: 'primary' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
  { value: 'postponed', label: 'Postponed', color: 'warning' },
];

export const AppointmentScheduler: React.FC = () => {
  const { showToast } = useToast();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();

  const {
    items: appointments,
    addItem,
    updateItem,
    removeItem,
    getItem,
  } = useLocalStorageCollection<Appointment>(STORAGE_KEYS.APPOINTMENTS);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    reminderMinutes: 30,
    notes: '',
  });
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [newAttendee, setNewAttendee] = useState({ name: '', email: '', phone: '', isRequired: true });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrencePattern>({
    type: 'weekly',
    interval: 1,
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'agenda'>('list');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const thisWeekEnd = new Date();
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
    const thisWeekEndStr = thisWeekEnd.toISOString().slice(0, 10);

    return {
      total: appointments.length,
      scheduled: appointments.filter(a => a.status === 'scheduled').length,
      today: appointments.filter(a => a.date === today && a.status === 'scheduled').length,
      thisWeek: appointments.filter(a => 
        a.date >= today && a.date <= thisWeekEndStr && a.status === 'scheduled'
      ).length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
    };
  }, [appointments]);

  // Filtered and sorted appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      const matchesSearch = !searchQuery ||
        appt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appt.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appt.attendees.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = !filterStatus || appt.status === filterStatus;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      // Sort by date, then by time
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [appointments, searchQuery, filterStatus]);

  // Group appointments by date for agenda view
  const appointmentsByDate = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    filteredAppointments.forEach(appt => {
      if (!groups[appt.date]) {
        groups[appt.date] = [];
      }
      groups[appt.date].push(appt);
    });
    return groups;
  }, [filteredAppointments]);

  // Today's appointments
  const todayAppointments = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return filteredAppointments.filter(a => a.date === today && a.status === 'scheduled');
  }, [filteredAppointments]);

  // Upcoming appointments (next 7 days)
  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return filteredAppointments.filter(a => {
      const apptDate = new Date(a.date);
      return apptDate >= today && apptDate <= nextWeek && a.status === 'scheduled';
    });
  }, [filteredAppointments]);

  // Form handlers
  const setField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      reminderMinutes: 30,
      notes: '',
    });
    setAttendees([]);
    setNewAttendee({ name: '', email: '', phone: '', isRequired: true });
    setIsRecurring(false);
    setRecurrence({ type: 'weekly', interval: 1, daysOfWeek: [1, 3, 5] });
    setEditingId(null);
  }, []);

  const loadForEdit = useCallback((id: string) => {
    const appt = getItem(id);
    if (appt) {
      setFormData({
        title: appt.title,
        description: appt.description || '',
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime || '',
        location: appt.location,
        reminderMinutes: appt.reminderMinutes,
        notes: appt.notes || '',
      });
      setAttendees(appt.attendees || []);
      setIsRecurring(appt.isRecurring);
      if (appt.recurrencePattern) {
        setRecurrence(appt.recurrencePattern);
      }
      setEditingId(id);
    }
  }, [getItem]);

  const handleAddAttendee = useCallback(() => {
    if (!newAttendee.name.trim()) return;
    
    setAttendees(prev => [
      ...prev,
      {
        name: newAttendee.name.trim(),
        email: newAttendee.email.trim() || undefined,
        phone: newAttendee.phone.trim() || undefined,
        isRequired: newAttendee.isRequired,
        response: 'pending',
      },
    ]);
    setNewAttendee({ name: '', email: '', phone: '', isRequired: true });
  }, [newAttendee]);

  const handleRemoveAttendee = useCallback((index: number) => {
    setAttendees(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!formData.date) {
      showToast('Date is required', 'error');
      return;
    }

    const data = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime || undefined,
      location: formData.location.trim(),
      attendees,
      isRecurring,
      recurrencePattern: isRecurring ? recurrence : undefined,
      reminderMinutes: formData.reminderMinutes,
      status: 'scheduled' as const,
      notes: formData.notes.trim() || undefined,
    };

    if (editingId) {
      const existing = getItem(editingId);
      updateItem(editingId, { ...data, status: existing?.status || 'scheduled' });
      auditService.log('APPT_UPDATED', `Updated appointment: ${data.title}`, editingId);
      showToast('Appointment updated', 'success');
    } else {
      // If recurring, create multiple appointments
      if (isRecurring && recurrence.endDate) {
        const createdIds: string[] = [];
        let currentDate = new Date(formData.date);
        const endDate = new Date(recurrence.endDate);

        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          
          // Check if this day should have an appointment
          const shouldCreate = recurrence.type === 'daily' ||
            (recurrence.type === 'weekly' && recurrence.daysOfWeek?.includes(dayOfWeek)) ||
            (recurrence.type === 'monthly' && currentDate.getDate() === new Date(formData.date).getDate()) ||
            (recurrence.type === 'yearly' && 
              currentDate.getMonth() === new Date(formData.date).getMonth() &&
              currentDate.getDate() === new Date(formData.date).getDate());

          if (shouldCreate) {
            const newAppt = addItem({
              ...data,
              date: currentDate.toISOString().slice(0, 10),
            });
            createdIds.push(newAppt.id);
          }

          // Move to next date based on recurrence type
          if (recurrence.type === 'daily') {
            currentDate.setDate(currentDate.getDate() + recurrence.interval);
          } else if (recurrence.type === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (recurrence.type === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
          } else if (recurrence.type === 'yearly') {
            currentDate.setFullYear(currentDate.getFullYear() + recurrence.interval);
          }
        }

        auditService.log('APPT_SERIES_CREATED', `Created ${createdIds.length} recurring appointments`, createdIds[0]);
        showToast(`${createdIds.length} appointments created`, 'success');
      } else {
        const newAppt = addItem(data);
        auditService.log('APPT_ADDED', `Added appointment: ${data.title}`, newAppt.id);
        showToast('Appointment scheduled', 'success');
      }
    }

    resetForm();
  }, [formData, attendees, isRecurring, recurrence, editingId, addItem, updateItem, getItem, resetForm, showToast]);

  const handleStatusChange = useCallback((id: string, newStatus: string) => {
    updateItem(id, { status: newStatus as any });
    showToast(`Appointment marked as ${newStatus}`, 'success');
  }, [updateItem, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    const appt = getItem(id);
    const confirmed = await confirm({
      title: 'Delete Appointment',
      message: `Are you sure you want to delete "${appt?.title}"?`,
      variant: 'danger',
    });

    if (confirmed) {
      removeItem(id);
      auditService.log('APPT_DELETED', `Deleted appointment: ${appt?.title}`, id);
      showToast('Appointment deleted', 'success');
    }
  }, [confirm, getItem, removeItem, showToast]);

  const handlePostpone = useCallback(async (id: string) => {
    const appt = getItem(id);
    if (!appt) return;

    // Move to next day
    const nextDate = new Date(appt.date);
    nextDate.setDate(nextDate.getDate() + 1);

    updateItem(id, {
      date: nextDate.toISOString().slice(0, 10),
      status: 'scheduled',
    });
    showToast('Appointment postponed to next day', 'success');
  }, [getItem, updateItem, showToast]);

  // Get status info
  const getStatusInfo = (status: string) => {
    return APPOINTMENT_STATUSES.find(s => s.value === status) || APPOINTMENT_STATUSES[0];
  };

  // Format time range
  const formatTimeRange = (start: string, end?: string) => {
    if (!end) return start;
    return `${start} - ${end}`;
  };

  // Calculate duration
  const calculateDuration = (start: string, end?: string) => {
    if (!end) return null;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = endMinutes - startMinutes;
    
    if (duration < 60) return `${duration}m`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  // Render appointment card
  const renderAppointmentCard = (appt: Appointment, showDate = true) => {
    const statusInfo = getStatusInfo(appt.status);
    const isPast = new Date(appt.date) < new Date(new Date().toISOString().slice(0, 10));
    const isToday = appt.date === new Date().toISOString().slice(0, 10);
    const duration = calculateDuration(appt.startTime, appt.endTime);

    return (
      <div
        key={appt.id}
        className={`
          p-4 rounded-xl border transition-all duration-200
          ${appt.status === 'cancelled' ? 'opacity-60' : ''}
          ${isToday ? 'border-primary/50 bg-primary/5' : 'border-outline/20'}
          hover:border-outline/40 hover:bg-surface-variant/10
        `}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-semibold text-on-surface ${appt.status === 'cancelled' ? 'line-through' : ''}`}>
                {appt.title}
              </span>
              {isToday && appt.status === 'scheduled' && (
                <Badge label="Today" color="primary" className="text-xs" />
              )}
              {appt.isRecurring && (
                <span className="material-symbols-outlined text-sm text-on-surface-variant">repeat</span>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-3 text-sm text-on-surface-variant mb-2">
              {showDate && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {formatDate(appt.date)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {formatTimeRange(appt.startTime, appt.endTime)}
                {duration && <span className="text-xs text-on-surface-variant/70">({duration})</span>}
              </span>
              {appt.location && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {appt.location}
                </span>
              )}
            </div>

            {appt.description && (
              <p className="text-sm text-on-surface-variant mb-2 line-clamp-2">
                {appt.description}
              </p>
            )}

            {appt.attendees.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">group</span>
                {appt.attendees.slice(0, 3).map((att, i) => (
                  <Badge key={i} label={att.name} color="neutral" className="text-xs" />
                ))}
                {appt.attendees.length > 3 && (
                  <Badge label={`+${appt.attendees.length - 3}`} color="neutral" className="text-xs" />
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge label={statusInfo.label} color={statusInfo.color as any} />

            <div className="flex gap-1">
              {appt.status === 'scheduled' && (
                <>
                  <Button
                    variant="text"
                    icon="check"
                    aria-label="Mark completed"
                    onClick={() => handleStatusChange(appt.id, 'completed')}
                  />
                  <Button
                    variant="text"
                    icon="schedule"
                    aria-label="Postpone"
                    onClick={() => handlePostpone(appt.id)}
                  />
                </>
              )}
              <Button
                variant="text"
                icon="edit"
                aria-label="Edit"
                onClick={() => loadForEdit(appt.id)}
              />
              <Button
                variant="text"
                icon="delete"
                aria-label="Delete"
                onClick={() => handleDelete(appt.id)}
              />
            </div>
          </div>
        </div>

        {/* Quick actions for scheduled appointments */}
        {appt.status === 'scheduled' && !isPast && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-outline/20">
            <Button
              variant="text"
              label="Complete"
              icon="check_circle"
              onClick={() => handleStatusChange(appt.id, 'completed')}
              className="text-xs"
            />
            <Button
              variant="text"
              label="Cancel"
              icon="cancel"
              onClick={() => handleStatusChange(appt.id, 'cancelled')}
              className="text-xs"
            />
          </div>
        )}
      </div>
    );
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    
    const days: { date: string; isCurrentMonth: boolean; appointments: Appointment[] }[] = [];
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        isCurrentMonth: false,
        appointments: appointments.filter(a => a.date === dateStr),
      });
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        isCurrentMonth: true,
        appointments: appointments.filter(a => a.date === dateStr),
      });
    }
    
    // Next month padding
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().slice(0, 10);
      days.push({
        date: dateStr,
        isCurrentMonth: false,
        appointments: appointments.filter(a => a.date === dateStr),
      });
    }
    
    return days;
  };

  const calendarDays = useMemo(generateCalendarDays, [selectedDate, appointments]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <ConfirmDialogComponent />

      {/* Statistics */}
      <StatsGrid
        stats={[
          { label: 'Total', value: stats.total, icon: 'event', color: 'primary' },
          { label: 'Today', value: stats.today, icon: 'today', color: 'warning' },
          { label: 'This Week', value: stats.thisWeek, icon: 'date_range', color: 'info' },
          { label: 'Completed', value: stats.completed, icon: 'check_circle', color: 'success' },
        ]}
        columns={4}
      />

      {/* Today's Quick View */}
      {todayAppointments.length > 0 && (
        <Card variant="elevated" className="bg-primary/5 border border-primary/20 p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary">today</span>
            <h3 className="font-bold text-on-surface">Today's Schedule</h3>
            <Badge label={String(todayAppointments.length)} color="primary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayAppointments.slice(0, 3).map(appt => (
              <div
                key={appt.id}
                className="p-3 bg-surface rounded-lg border border-outline/20"
              >
                <div className="font-medium text-on-surface">{appt.title}</div>
                <div className="text-sm text-on-surface-variant">
                  {formatTimeRange(appt.startTime, appt.endTime)}
                  {appt.location && ` • ${appt.location}`}
                </div>
              </div>
            ))}
            {todayAppointments.length > 3 && (
              <div className="p-3 flex items-center justify-center text-primary">
                +{todayAppointments.length - 3} more
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              {editingId ? 'edit_calendar' : 'add'}
            </span>
            <h2 className="text-lg font-bold text-on-surface">
              {editingId ? 'Edit Appointment' : 'Schedule Appointment'}
            </h2>
          </div>

          <TextField
            label="Title"
            icon="event"
            value={formData.title}
            onChange={e => setField('title', e.target.value)}
            required
          />

          <TextArea
            label="Description"
            icon="notes"
            value={formData.description}
            onChange={e => setField('description', e.target.value)}
            rows={2}
          />

          <TextField
            label="Date"
            type="date"
            icon="calendar_today"
            value={formData.date}
            onChange={e => setField('date', e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Start Time"
              type="time"
              icon="schedule"
              value={formData.startTime}
              onChange={e => setField('startTime', e.target.value)}
            />
            <TextField
              label="End Time"
              type="time"
              icon="schedule"
              value={formData.endTime}
              onChange={e => setField('endTime', e.target.value)}
            />
          </div>

          <TextField
            label="Location"
            icon="location_on"
            value={formData.location}
            onChange={e => setField('location', e.target.value)}
            placeholder="e.g., Conference Room A"
          />

          <SelectField
            label="Reminder"
            value={formData.reminderMinutes}
            onChange={e => setField('reminderMinutes', Number(e.target.value))}
          >
            {REMINDER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </SelectField>

          {/* Attendees */}
          <div className="space-y-3 p-4 bg-surface-variant/20 rounded-xl border border-outline/20">
            <div className="text-sm font-medium text-on-surface">Attendees</div>

            <div className="grid grid-cols-1 gap-2">
              <TextField
                label="Name"
                placeholder="Attendee name"
                value={newAttendee.name}
                onChange={e => setNewAttendee(prev => ({ ...prev, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  label="Email"
                  type="email"
                  placeholder="Optional"
                  value={newAttendee.email}
                  onChange={e => setNewAttendee(prev => ({ ...prev, email: e.target.value }))}
                />
                <TextField
                  label="Phone"
                  placeholder="Optional"
                  value={newAttendee.phone}
                  onChange={e => setNewAttendee(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Checkbox
                  label="Required"
                  checked={newAttendee.isRequired}
                  onChange={e => setNewAttendee(prev => ({ ...prev, isRequired: e.target.checked }))}
                />
                <Button
                  variant="tonal"
                  icon="add"
                  label="Add"
                  onClick={handleAddAttendee}
                />
              </div>
            </div>

            {attendees.length > 0 && (
              <div className="space-y-2 mt-3">
                {attendees.map((att, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-surface rounded-lg">
                    <span className="material-symbols-outlined text-on-surface-variant">person</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-on-surface truncate">{att.name}</div>
                      {(att.email || att.phone) && (
                        <div className="text-xs text-on-surface-variant truncate">
                          {[att.email, att.phone].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </div>
                    {att.isRequired && (
                      <Badge label="Required" color="primary" className="text-xs" />
                    )}
                    <Button
                      variant="text"
                      icon="close"
                      aria-label="Remove"
                      onClick={() => handleRemoveAttendee(index)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div className="space-y-3 p-4 bg-surface-variant/20 rounded-xl border border-outline/20">
            <Checkbox
              label="Recurring Appointment"
              checked={isRecurring}
              onChange={e => setIsRecurring(e.target.checked)}
            />

            {isRecurring && (
              <div className="space-y-3 mt-3">
                <SelectField
                  label="Repeat"
                  value={recurrence.type}
                  onChange={e => setRecurrence(prev => ({ ...prev, type: e.target.value as any }))}
                >
                  {RECURRENCE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </SelectField>

                <TextField
                  label="Every"
                  type="number"
                  min={1}
                  max={30}
                  value={recurrence.interval}
                  onChange={e => setRecurrence(prev => ({ ...prev, interval: Number(e.target.value) }))}
                />

                {recurrence.type === 'weekly' && (
                  <div className="space-y-2">
                    <div className="text-sm text-on-surface-variant">Days</div>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const days = recurrence.daysOfWeek || [];
                            const newDays = days.includes(day.value)
                              ? days.filter(d => d !== day.value)
                              : [...days, day.value];
                            setRecurrence(prev => ({ ...prev, daysOfWeek: newDays }));
                          }}
                          className={`
                            px-3 py-1 rounded-lg text-sm font-medium transition-colors
                            ${(recurrence.daysOfWeek || []).includes(day.value)
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-variant text-on-surface-variant'
                            }
                          `}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <TextField
                  label="End Date"
                  type="date"
                  value={recurrence.endDate || ''}
                  onChange={e => setRecurrence(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            )}
          </div>

          <TextArea
            label="Notes"
            icon="notes"
            value={formData.notes}
            onChange={e => setField('notes', e.target.value)}
            rows={2}
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
              label={editingId ? 'Update' : 'Schedule'}
              icon={editingId ? 'save' : 'add'}
              onClick={handleSubmit}
              className="flex-1"
            />
          </div>
        </Card>

        {/* Calendar / List */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg xl:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <h2 className="text-lg font-bold text-on-surface">Appointments</h2>
              <Badge label={`${filteredAppointments.length}`} color="primary" />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'tonal' : 'text'}
                icon="view_list"
                aria-label="List view"
                onClick={() => setViewMode('list')}
              />
              <Button
                variant={viewMode === 'calendar' ? 'tonal' : 'text'}
                icon="calendar_month"
                aria-label="Calendar view"
                onClick={() => setViewMode('calendar')}
              />
              <Button
                variant={viewMode === 'agenda' ? 'tonal' : 'text'}
                icon="view_agenda"
                aria-label="Agenda view"
                onClick={() => setViewMode('agenda')}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search appointments..."
              className="flex-1 min-w-[200px]"
            />
            <SelectField
              label="Status"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="min-w-[120px]"
            >
              <option value="">All</option>
              {APPOINTMENT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </SelectField>
          </div>

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredAppointments.length === 0 ? (
                <EmptyState
                  icon="event"
                  title="No appointments found"
                  description="Schedule your first appointment to get started"
                />
              ) : (
                filteredAppointments.map(appt => renderAppointmentCard(appt))
              )}
            </div>
          )}

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="space-y-4">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="text"
                  icon="chevron_left"
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setMonth(date.getMonth() - 1);
                    setSelectedDate(date.toISOString().slice(0, 10));
                  }}
                />
                <h3 className="font-bold text-on-surface">
                  {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <Button
                  variant="text"
                  icon="chevron_right"
                  onClick={() => {
                    const date = new Date(selectedDate);
                    date.setMonth(date.getMonth() + 1);
                    setSelectedDate(date.toISOString().slice(0, 10));
                  }}
                />
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Header */}
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.value} className="text-center text-sm font-medium text-on-surface-variant py-2">
                    {day.label}
                  </div>
                ))}

                {/* Days */}
                {calendarDays.map((day, index) => {
                  const isToday = day.date === today;
                  const hasAppointments = day.appointments.length > 0;
                  const scheduledCount = day.appointments.filter(a => a.status === 'scheduled').length;

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedDate(day.date);
                        setField('date', day.date);
                      }}
                      className={`
                        p-2 min-h-[60px] rounded-lg text-left transition-all
                        ${day.isCurrentMonth ? 'bg-surface' : 'bg-surface-variant/30'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        ${day.date === formData.date ? 'bg-primary/10' : ''}
                        hover:bg-surface-variant/50
                      `}
                    >
                      <div className={`text-sm ${isToday ? 'font-bold text-primary' : day.isCurrentMonth ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
                        {new Date(day.date).getDate()}
                      </div>
                      {hasAppointments && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {scheduledCount > 0 && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          {day.appointments.some(a => a.status === 'completed') && (
                            <div className="w-2 h-2 rounded-full bg-success" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Date Appointments */}
              {appointmentsByDate[formData.date] && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-on-surface">
                    {formatDate(formData.date, 'long')}
                  </h4>
                  {appointmentsByDate[formData.date].map(appt => renderAppointmentCard(appt, false))}
                </div>
              )}
            </div>
          )}

          {/* Agenda View */}
          {viewMode === 'agenda' && (
            <div className="space-y-6">
              {Object.keys(appointmentsByDate).length === 0 ? (
                <EmptyState
                  icon="event"
                  title="No appointments"
                  description="No appointments match your filters"
                />
              ) : (
                Object.entries(appointmentsByDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, appts]) => (
                    <div key={date}>
                      <div className={`
                        flex items-center gap-2 mb-3 pb-2 border-b border-outline/20
                        ${date === today ? 'text-primary' : 'text-on-surface'}
                      `}>
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span className="font-medium">{formatDate(date, 'long')}</span>
                        {date === today && <Badge label="Today" color="primary" className="text-xs" />}
                        <Badge label={String(appts.length)} color="neutral" className="text-xs" />
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-outline/20">
                        {appts.map(appt => renderAppointmentCard(appt, false))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AppointmentScheduler;