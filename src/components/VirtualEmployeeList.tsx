/**
 * ENHANCED Virtual Scrolling Implementation
 */

import React from 'react';
import { List } from 'react-window';
import { EmployeeRecord } from '../types';
import { AppIcon } from '../components/AppIcon';

interface VirtualEmployeeListProps {
  employees: EmployeeRecord[];
  onRowClick?: (emp: EmployeeRecord) => void;
  onDelete?: (emp: EmployeeRecord) => void;
  isLoading?: boolean;
  itemHeight?: number;
  maxHeight?: number;
}

export const VirtualEmployeeList: React.FC<VirtualEmployeeListProps> = ({
  employees,
  onRowClick,
  onDelete,
  isLoading = false,
  itemHeight = 60,
  maxHeight = 600,
}) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  if (employees.length < 100) {
    return (
      <div className="space-y-2">
        {employees.map(emp => (
          <EmployeeRowItem
            key={emp.id}
            employee={emp}
            isSelected={selectedId === emp.id}
            onSelect={() => setSelectedId(emp.id)}
            onClick={() => onRowClick?.(emp)}
            onDelete={() => onDelete?.(emp)}
          />
        ))}
      </div>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const emp = employees[index];
    if (!emp) return null;
    
    return (
      <div style={style} className="border-b border-outline-variant/20">
        <EmployeeRowItem
          employee={emp}
          isSelected={selectedId === emp.id}
          onSelect={() => setSelectedId(emp.id)}
          onClick={() => onRowClick?.(emp)}
          onDelete={() => onDelete?.(emp)}
        />
      </div>
    );
  };

  return (
    <div className="border border-outline-variant/20 rounded-xl overflow-hidden">
      {/* rowProps carries nothing, so type it as an exactly-empty object. */}
      <List<Record<string, never>>
        rowCount={employees.length}
        rowHeight={itemHeight}
        rowComponent={Row}
        rowProps={{}}
        style={{ height: maxHeight, width: "100%" }}
      />
    </div>
  );
};

interface EmployeeRowItemProps {
  employee: EmployeeRecord;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onDelete: () => void;
}

const EmployeeRowItem: React.FC<EmployeeRowItemProps> = ({
  employee,
  isSelected,
  onSelect,
  onClick,
  onDelete,
}) => {
  const statusColors: Record<string, string> = {
    Active: 'bg-success/10 text-success',
    Retired: 'bg-error/10 text-error',
    'On Leave': 'bg-warning/10 text-warning',
    Resigned: 'bg-error/10 text-error',
  };

  // Safe access to nested properties
  const empData = (employee as any).employees || employee;
  const status = empData.status || 'Active';
  const name = empData.name || 'Unknown';
  const designation = empData.designation || '';
  const bps = empData.bps || '';
  const cnic = empData.cnic_no || '';

  const statusColor = statusColors[status] || 'bg-muted/10 text-muted-foreground';

  return (
    <div
      className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-surface-variant/30 transition-colors ${
        isSelected ? 'bg-primary/10' : ''
      }`}
      onClick={onClick}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="w-4 h-4 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-primary">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{name}</div>
        <div className="text-xs text-on-surface-variant truncate">
          {designation} • BPS {bps}
        </div>
      </div>

      <div className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${statusColor}`}>
        {status}
      </div>

      <div className="hidden md:block text-xs text-on-surface-variant font-mono">
        {cnic}
      </div>

      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onClick()}
          className="p-1.5 hover:bg-primary/10 rounded transition-colors"
        >
          <AppIcon name="edit" size={16} className="text-primary" />
        </button>
        <button
          onClick={() => onDelete()}
          className="p-1.5 hover:bg-error/10 rounded transition-colors"
        >
          <AppIcon name="delete" size={16} className="text-error" />
        </button>
      </div>
    </div>
  );
};
