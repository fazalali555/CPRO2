// components/tasks/TaskManager.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Card, Button, Badge, TextField, SelectField, TextArea, Checkbox } from '../../../../components/M3';
import { useLocalStorageCollection } from '../../hooks/useLocalStorage';
import { useToast } from '../../../../contexts/ToastContext';
import { useConfirmDialog } from '../common/ConfirmDialog';
import { SearchBar } from '../common/SearchBar';
import { EmptyState } from '../common/EmptyState';
import { StatsGrid } from '../common/StatCard';
import { STORAGE_KEYS, PRIORITY_OPTIONS } from '../../constants';
import { Task, Priority, Subtask } from '../../types';
import { formatDate, formatPriority } from '../../utils/formatters';
import { validateTask } from '../../utils/validators';
import { auditService } from '../../../../services/SecurityService';

const TASK_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'letter', label: 'Letters' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'filing', label: 'Filing' },
  { value: 'meeting', label: 'Meetings' },
  { value: 'other', label: 'Other' },
];

export const TaskManager: React.FC = () => {
  const { showToast } = useToast();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();

  const {
    items: tasks,
    addItem,
    updateItem,
    removeItem,
    getItem,
  } = useLocalStorageCollection<Task>(STORAGE_KEYS.TASKS);

  // Form state
  const [formData, setFormData] = useState({
    text: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'normal' as Priority,
    category: 'general',
    assignedTo: '',
  });
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  // Statistics
  const stats = useMemo(() => {
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => 
      t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;
    const dueToday = tasks.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const today = new Date().toISOString().slice(0, 10);
      return t.dueDate === today;
    }).length;
    const highPriority = tasks.filter(t => 
      (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'completed'
    ).length;

    return { pending, inProgress, completed, overdue, dueToday, highPriority, total: tasks.length };
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search
      const matchesSearch = !searchQuery ||
        task.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;

      // Priority
      const matchesPriority = !filterPriority || task.priority === filterPriority;

      // Category
      const matchesCategory = !filterCategory || task.category === filterCategory;

      // Show completed toggle
      const matchesCompleted = showCompleted || task.status !== 'completed';

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesCompleted;
    }).sort((a, b) => {
      // Sort: incomplete first, then by priority, then by due date
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;

      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, searchQuery, filterStatus, filterPriority, filterCategory, showCompleted]);

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
      text: '',
      description: '',
      dueDate: '',
      dueTime: '',
      priority: 'normal',
      category: 'general',
      assignedTo: '',
    });
    setSubtasks([]);
    setNewSubtask('');
    setEditingId(null);
    setValidationErrors({});
  }, []);

  const loadForEdit = useCallback((id: string) => {
    const task = getItem(id);
    if (task) {
      setFormData({
        text: task.text,
        description: task.description || '',
        dueDate: task.dueDate || '',
        dueTime: task.dueTime || '',
        priority: task.priority,
        category: task.category || 'general',
        assignedTo: task.assignedTo || '',
      });
      setSubtasks(task.subtasks || []);
      setEditingId(id);
    }
  }, [getItem]);

  const handleAddSubtask = useCallback(() => {
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: Date.now().toString(), text: newSubtask.trim(), isCompleted: false },
    ]);
    setNewSubtask('');
  }, [newSubtask]);

  const handleRemoveSubtask = useCallback((subtaskId: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
  }, []);

  const handleToggleSubtask = useCallback((subtaskId: string) => {
    setSubtasks(prev => prev.map(s =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    ));
  }, []);

  const handleSubmit = useCallback(() => {
    const validation = validateTask(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showToast('Please fix the validation errors', 'error');
      return;
    }

    const data = {
      text: formData.text.trim(),
      description: formData.description.trim() || undefined,
      dueDate: formData.dueDate || undefined,
      dueTime: formData.dueTime || undefined,
      priority: formData.priority,
      category: formData.category,
      assignedTo: formData.assignedTo.trim() || undefined,
      status: 'pending' as const,
      subtasks,
    };

    if (editingId) {
      const existing = getItem(editingId);
      updateItem(editingId, { ...data, status: existing?.status || 'pending' });
      auditService.log('TASK_UPDATED', `Updated task: ${data.text}`, editingId);
      showToast('Task updated', 'success');
    } else {
      const newTask = addItem(data);
      auditService.log('TASK_ADDED', `Added task: ${data.text}`, newTask.id);
      showToast('Task added', 'success');
    }

    resetForm();
  }, [formData, subtasks, editingId, addItem, updateItem, getItem, resetForm, showToast]);

  const handleToggleComplete = useCallback((taskId: string) => {
    const task = getItem(taskId);
    if (task) {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      updateItem(taskId, { status: newStatus });
      showToast(newStatus === 'completed' ? 'Task completed!' : 'Task reopened', 'success');
    }
  }, [getItem, updateItem, showToast]);

  const handleSetInProgress = useCallback((taskId: string) => {
    updateItem(taskId, { status: 'in_progress' });
    showToast('Task marked as in progress', 'success');
  }, [updateItem, showToast]);

  const handleDelete = useCallback(async (taskId: string) => {
    const task = getItem(taskId);
    const confirmed = await confirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task?.text}"?`,
      variant: 'danger',
    });

    if (confirmed) {
      removeItem(taskId);
      auditService.log('TASK_DELETED', `Deleted task: ${task?.text}`, taskId);
      showToast('Task deleted', 'success');
    }
  }, [confirm, getItem, removeItem, showToast]);

  const handleClearCompleted = useCallback(async () => {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    if (completedCount === 0) return;

    const confirmed = await confirm({
      title: 'Clear Completed Tasks',
      message: `Are you sure you want to delete ${completedCount} completed task(s)?`,
      variant: 'warning',
    });

    if (confirmed) {
      tasks.filter(t => t.status === 'completed').forEach(t => removeItem(t.id));
      showToast(`${completedCount} completed tasks cleared`, 'success');
    }
  }, [confirm, tasks, removeItem, showToast]);

  // Render task card
  const renderTaskCard = (task: Task) => {
    const isOverdue = task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date();
    const isDueToday = task.dueDate === new Date().toISOString().slice(0, 10);
    const priorityInfo = formatPriority(task.priority);
    const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    return (
      <div
        key={task.id}
        className={`
          p-4 rounded-xl border transition-all duration-200
          ${task.status === 'completed' ? 'opacity-60' : ''}
          ${isOverdue ? 'border-error/50 bg-error/5' : 'border-outline/20'}
          hover:border-outline/40 hover:bg-surface-variant/10
        `}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            label=""
            checked={task.status === 'completed'}
            onChange={() => handleToggleComplete(task.id)}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-medium text-on-surface ${task.status === 'completed' ? 'line-through' : ''}`}>
                {task.text}
              </span>
              {task.priority !== 'normal' && (
                <span className={`material-symbols-outlined text-sm text-${priorityInfo.color}`}>
                  {priorityInfo.icon}
                </span>
              )}
              {isOverdue && <Badge label="Overdue" color="error" className="text-xs" />}
              {isDueToday && !isOverdue && <Badge label="Today" color="warning" className="text-xs" />}
              {task.status === 'in_progress' && <Badge label="In Progress" color="info" className="text-xs" />}
            </div>

            {task.description && (
              <p className="text-sm text-on-surface-variant mb-2 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-2 text-xs text-on-surface-variant">
              {task.category && (
                <Badge label={task.category} color="neutral" className="text-xs" />
              )}
              {task.dueDate && (
                <span className={isOverdue ? 'text-error' : ''}>
                  <span className="material-symbols-outlined text-xs align-middle">schedule</span>
                  {' '}{formatDate(task.dueDate)}
                  {task.dueTime && ` at ${task.dueTime}`}
                </span>
              )}
              {task.assignedTo && (
                <span>
                  <span className="material-symbols-outlined text-xs align-middle">person</span>
                  {' '}{task.assignedTo}
                </span>
              )}
            </div>

            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Subtasks</span>
                  <span>{completedSubtasks}/{totalSubtasks}</span>
                </div>
                <div className="w-full bg-surface-variant rounded-full h-1.5">
                  <div
                    className="bg-primary rounded-full h-1.5 transition-all duration-300"
                    style={{ width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%` }}
                  />
                </div>
                <div className="space-y-1 mt-2">
                  {task.subtasks?.slice(0, 3).map(subtask => (
                    <div key={subtask.id} className="flex items-center gap-2 text-xs">
                      <span className={`material-symbols-outlined text-xs ${subtask.isCompleted ? 'text-success' : 'text-on-surface-variant'}`}>
                        {subtask.isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span className={subtask.isCompleted ? 'line-through text-on-surface-variant' : ''}>
                        {subtask.text}
                      </span>
                    </div>
                  ))}
                  {totalSubtasks > 3 && (
                    <span className="text-xs text-on-surface-variant">
                      +{totalSubtasks - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {task.status !== 'completed' && task.status !== 'in_progress' && (
              <Button
                variant="text"
                icon="play_arrow"
                aria-label="Start task"
                onClick={() => handleSetInProgress(task.id)}
              />
            )}
            <Button
              variant="text"
              icon="edit"
              aria-label="Edit task"
              onClick={() => loadForEdit(task.id)}
            />
            <Button
              variant="text"
              icon="delete"
              aria-label="Delete task"
              onClick={() => handleDelete(task.id)}
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
          { label: 'Pending', value: stats.pending, icon: 'pending', color: 'warning' },
          { label: 'In Progress', value: stats.inProgress, icon: 'hourglass_top', color: 'info' },
          { label: 'Completed', value: stats.completed, icon: 'check_circle', color: 'success' },
          { label: 'Overdue', value: stats.overdue, icon: 'warning', color: 'error' },
          { label: 'Due Today', value: stats.dueToday, icon: 'today', color: 'primary' },
          { label: 'High Priority', value: stats.highPriority, icon: 'priority_high', color: 'error' },
        ]}
        columns={3}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              {editingId ? 'edit' : 'add_task'}
            </span>
            <h2 className="text-lg font-bold text-on-surface">
              {editingId ? 'Edit Task' : 'Add Task'}
            </h2>
          </div>

          <TextField
            label="Task"
            icon="task"
            value={formData.text}
            onChange={e => setField('text', e.target.value)}
            error={validationErrors.text}
            required
          />

          <TextArea
            label="Description (optional)"
            icon="notes"
            value={formData.description}
            onChange={e => setField('description', e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Due Date"
              type="date"
              icon="event"
              value={formData.dueDate}
              onChange={e => setField('dueDate', e.target.value)}
              error={validationErrors.dueDate}
            />
            <TextField
              label="Time"
              type="time"
              icon="schedule"
              value={formData.dueTime}
              onChange={e => setField('dueTime', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Priority"
              value={formData.priority}
              onChange={e => setField('priority', e.target.value)}
            >
              {PRIORITY_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </SelectField>

            <SelectField
              label="Category"
              value={formData.category}
              onChange={e => setField('category', e.target.value)}
            >
              {TASK_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </SelectField>
          </div>

          <TextField
            label="Assigned To"
            icon="person"
            value={formData.assignedTo}
            onChange={e => setField('assignedTo', e.target.value)}
            placeholder="Optional"
          />

          {/* Subtasks */}
          <div className="space-y-3 p-4 bg-surface-variant/20 rounded-xl border border-outline/20">
            <div className="text-sm font-medium text-on-surface">Subtasks</div>

            <div className="flex gap-2">
              <TextField
                label=""
                placeholder="Add subtask..."
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                className="flex-1"
              />
              <Button
                variant="tonal"
                icon="add"
                aria-label="Add subtask"
                onClick={handleAddSubtask}
              />
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-2">
                {subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 bg-surface rounded-lg">
                    <Checkbox
                      label=""
                      checked={subtask.isCompleted}
                      onChange={() => handleToggleSubtask(subtask.id)}
                    />
                    <span className={`flex-1 text-sm ${subtask.isCompleted ? 'line-through text-on-surface-variant' : ''}`}>
                      {subtask.text}
                    </span>
                    <Button
                      variant="text"
                      icon="close"
                      aria-label="Remove subtask"
                      onClick={() => handleRemoveSubtask(subtask.id)}
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
              label={editingId ? 'Update Task' : 'Add Task'}
              icon={editingId ? 'save' : 'add'}
              onClick={handleSubmit}
              className="flex-1"
            />
          </div>
        </Card>

        {/* Task List */}
        <Card variant="elevated" className="bg-surface space-y-4 p-6 shadow-lg xl:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">checklist</span>
              <h2 className="text-lg font-bold text-on-surface">Task List</h2>
              <Badge
                label={`${stats.completed}/${stats.total} done`}
                color="success"
              />
            </div>

            {stats.completed > 0 && (
              <Button
                variant="text"
                label="Clear Completed"
                icon="delete_sweep"
                onClick={handleClearCompleted}
              />
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks..."
              className="flex-1 min-w-[200px]"
            />

            <SelectField
              label="Status"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="min-w-[120px]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
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

            <SelectField
              label="Category"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="min-w-[120px]"
            >
              <option value="">All</option>
              {TASK_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </SelectField>

            <Checkbox
              label="Show Completed"
              checked={showCompleted}
              onChange={e => setShowCompleted(e.target.checked)}
            />
          </div>

          {/* Task List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon="task_alt"
                title="No tasks found"
                description={searchQuery || filterStatus !== 'all' ? 'Try adjusting your filters' : 'Add your first task to get started'}
              />
            ) : (
              filteredTasks.map(task => renderTaskCard(task))
            )}
          </div>

          {/* Progress */}
          {stats.total > 0 && (
            <div className="pt-4 border-t border-outline/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-on-surface-variant">Overall Progress</span>
                <span className="font-medium text-on-surface">
                  {Math.round((stats.completed / stats.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-surface-variant rounded-full h-2">
                <div
                  className="bg-success rounded-full h-2 transition-all duration-500"
                  style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TaskManager;