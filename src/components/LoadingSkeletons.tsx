/**
 * ENHANCED Loading Skeletons - Production Ready
 * 
 * Features:
 * 1. ✅ Employee list skeleton
 * 2. ✅ Case list skeleton
 * 3. ✅ Form skeleton
 * 4. ✅ Card skeleton
 * 5. ✅ Smooth animations
 * 6. ✅ Mobile-optimized
 */

import React from 'react';
import clsx from 'clsx';

// ============================================================================
// SKELETON LOADER COMPONENT
// ============================================================================

interface SkeletonProps {
  className?: string;
  count?: number;
  circle?: boolean;
  height?: string;
  width?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  count = 1,
  circle = false,
  height = 'h-4',
  width = 'w-full',
}) => {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, i) => (
        <div
          key={i}
          className={clsx(
            'bg-gradient-to-r from-surface-variant/20 via-surface-variant/40 to-surface-variant/20',
            'animate-pulse rounded',
            circle && 'rounded-full',
            height,
            width,
            className,
            i < count - 1 && 'mb-2'
          )}
        />
      ))}
    </>
  );
};

// ============================================================================
// EMPLOYEE LIST SKELETON
// ============================================================================

export const EmployeeListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-outline-variant/20"
        >
          {/* Avatar */}
          <Skeleton circle width="w-10" height="h-10" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton height="h-4" width="w-48" />
            <Skeleton height="h-3" width="w-32" />
          </div>

          {/* Status Badge */}
          <Skeleton height="h-6" width="w-20" />

          {/* Actions */}
          <div className="flex gap-2">
            <Skeleton circle width="w-8" height="h-8" />
            <Skeleton circle width="w-8" height="h-8" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// CASE LIST SKELETON
// ============================================================================

export const CaseListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-surface rounded-lg border border-outline-variant/20"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Title and Info */}
            <div className="flex-1 space-y-2">
              <Skeleton height="h-5" width="w-64" />
              <Skeleton height="h-4" width="w-48" />
              <Skeleton height="h-3" width="w-40" />
            </div>

            {/* Status and Priority */}
            <div className="flex gap-2">
              <Skeleton height="h-6" width="w-16" />
              <Skeleton height="h-6" width="w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// EMPLOYEE FORM SKELETON
// ============================================================================

export const EmployeeFormSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height="h-8" width="w-64" />
        <Skeleton height="h-4" width="w-96" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height="h-10" width="w-24" />
        ))}
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton height="h-4" width="w-32" />
            <Skeleton height="h-10" width="w-full" />
          </div>
        ))}
      </div>

      {/* Large Text Area */}
      <div className="space-y-2">
        <Skeleton height="h-4" width="w-32" />
        <Skeleton height="h-24" width="w-full" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Skeleton height="h-10" width="w-32" />
        <Skeleton height="h-10" width="w-32" />
      </div>
    </div>
  );
};

// ============================================================================
// EMPLOYEE CARD SKELETON
// ============================================================================

export const EmployeeCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-surface rounded-xl border border-outline-variant/20 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton height="h-6" width="w-48" />
          <Skeleton height="h-4" width="w-32" />
        </div>
        <Skeleton circle width="w-12" height="h-12" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton height="h-3" width="w-16" />
            <Skeleton height="h-5" width="w-full" />
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="space-y-2">
        <Skeleton height="h-4" width="w-full" />
        <Skeleton height="h-4" width="w-5/6" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Skeleton height="h-8" width="w-20" />
        <Skeleton height="h-8" width="w-20" />
      </div>
    </div>
  );
};

// ============================================================================
// DATA TABLE SKELETON
// ============================================================================

export const DataTableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6,
}) => {
  return (
    <div className="border border-outline-variant/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-surface-variant/20 p-4 flex gap-4 border-b border-outline-variant/20">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="h-4" width={`w-${20 + i * 5}`} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4 border-b border-outline-variant/20">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} height="h-4" width={`w-${20 + j * 5}`} />
          ))}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MOBILE CARD SKELETON
// ============================================================================

export const MobileCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-surface rounded-lg border border-outline-variant/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Skeleton circle width="w-12" height="h-12" />
            <div className="flex-1 space-y-1">
              <Skeleton height="h-4" width="w-40" />
              <Skeleton height="h-3" width="w-32" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton height="h-3" width="w-full" />
            <Skeleton height="h-3" width="w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// FILTER SKELETON
// ============================================================================

export const FilterSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <Skeleton height="h-10" width="w-full" />

      {/* Filter Buttons */}
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height="h-8" width="w-24" />
        ))}
      </div>

      {/* Dropdown Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="h-10" width="w-full" />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// STATISTICS CARD SKELETON
// ============================================================================

export const StatCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-surface rounded-lg border border-outline-variant/20 space-y-2"
        >
          <Skeleton height="h-4" width="w-24" />
          <Skeleton height="h-8" width="w-32" />
          <Skeleton height="h-3" width="w-28" />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// DETAIL PAGE SKELETON
// ============================================================================

export const DetailPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton height="h-8" width="w-64" />
          <Skeleton height="h-4" width="w-96" />
        </div>
        <Skeleton circle width="w-12" height="h-12" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant/20">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="h-10" width="w-24" />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton height="h-4" width="w-32" />
              <Skeleton height="h-6" width="w-full" />
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-surface rounded-lg space-y-2">
              <Skeleton height="h-4" width="w-24" />
              <Skeleton height="h-6" width="w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
