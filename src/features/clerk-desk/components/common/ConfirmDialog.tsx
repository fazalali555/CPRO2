// components/common/ConfirmDialog.tsx

import React, { useEffect, useRef } from 'react';
import { Button } from '../../../../components/M3';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'warning',
      iconBg: 'bg-error/10',
      iconColor: 'text-error',
      confirmVariant: 'filled' as const,
      confirmColor: 'bg-error text-on-error hover:bg-error/90',
    },
    warning: {
      icon: 'help',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      confirmVariant: 'filled' as const,
      confirmColor: 'bg-warning text-on-warning hover:bg-warning/90',
    },
    info: {
      icon: 'info',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      confirmVariant: 'filled' as const,
      confirmColor: '',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
        className="relative bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${styles.iconBg}`}>
            <span className={`material-symbols-outlined text-2xl ${styles.iconColor}`}>
              {styles.icon}
            </span>
          </div>
          
          <div className="flex-1">
            <h3 
              id="dialog-title" 
              className="text-lg font-semibold text-on-surface mb-2"
            >
              {title}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {message}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="text"
            label={cancelLabel}
            onClick={onCancel}
          />
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              styles.confirmColor || 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for using confirm dialog
export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    resolve: null,
  });

  const confirm = React.useCallback((options: {
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        variant: options.variant || 'danger',
        resolve,
      });
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    setState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [state.resolve]);

  const Dialog = React.useCallback(() => (
    <ConfirmDialog
      isOpen={state.isOpen}
      title={state.title}
      message={state.message}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ), [state, handleConfirm, handleCancel]);

  return { confirm, Dialog };
}