import React, { InputHTMLAttributes, useState, useEffect, useRef } from 'react';
import { AppIcon } from './AppIcon';
import clsx from 'clsx';

// --- BUTTONS ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'fab';
  icon?: string;
  label?: string;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'filled', icon, label, className = '', children, ...props }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  const variants = {
    filled: "bg-primary text-on-primary hover:bg-opacity-90 shadow-elevation-1 hover:shadow-elevation-2 h-10 px-6",
    tonal: "bg-secondary-container text-on-secondary-container hover:bg-opacity-80 h-10 px-6",
    outlined: "border border-outline text-primary hover:bg-primary/10 h-10 px-6",
    text: "text-primary hover:bg-primary/10 h-10 px-4",
    fab: "bg-primary-container text-on-primary-container shadow-elevation-3 hover:shadow-elevation-4 h-14 w-14 rounded-2xl",
  };

  return (
    <button 
      className={clsx(baseStyle, variants[variant], className)} 
      aria-label={label || (typeof children === 'string' ? children : undefined)}
      {...props}
    >
      {icon && <AppIcon name={icon} size={variant === 'fab' ? 24 : 18} />}
      {label && <span>{label}</span>}
      {children}
    </button>
  );
};

// --- FAB (Route Specific Wrapper) ---
export const FAB: React.FC<ButtonProps & { show?: boolean }> = ({ show = true, className, ...props }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-24 right-4 z-40 lg:hidden">
      <Button variant="fab" className={className} {...props} />
    </div>
  );
};

// --- CARDS ---
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { variant?: 'elevated' | 'filled' | 'outlined' }> = ({ variant = 'elevated', className = '', children, ...props }) => {
  const variants = {
    elevated: "bg-surface-container-low shadow-elevation-1 hover:shadow-elevation-2",
    filled: "bg-surface-variant",
    outlined: "bg-surface border border-outline-variant",
  };
  return (
    <div className={clsx("rounded-xl p-4 transition-shadow", variants[variant], className)} {...props}>
      {children}
    </div>
  );
};

// --- INPUTS ---
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  error?: string;
}

export const TextField: React.FC<TextFieldProps> = ({ label, icon, error, className = '', onFocus, onBlur, onChange, type, ...props }) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isNumber = type === 'number';

  // Internal state to manage string representation of numbers (allows "1." or "0.5")
  const [displayValue, setDisplayValue] = useState(props.value?.toString() ?? '');

  // SYNC: Update internal displayValue when parent prop changes
  useEffect(() => {
    const propVal = props.value;
    const propValStr = propVal?.toString() ?? '';
    
    // Safety check: is the input currently being typed in?
    const isInputActive = document.activeElement === inputRef.current;

    if (!isNumber) {
      setDisplayValue(propValStr);
      return;
    }

    // Smart Sync for Numbers:
    // 1. If not focused, always sync (external update like loading data)
    // 2. If focused, ONLY sync if the numeric value actually changed significantly.
    //    This prevents overwriting "1." with "1" while the user is typing a decimal.
    const internalNum = parseFloat(displayValue);
    const propNum = parseFloat(propValStr);
    
    // Check if they are effectively different numbers (ignoring "0" vs "" or "1." vs "1")
    const isDifferent = (isNaN(internalNum) && !isNaN(propNum)) || 
                        (!isNaN(internalNum) && isNaN(propNum)) || 
                        internalNum !== propNum;

    if (!isInputActive || isDifferent) {
       // If empty string and prop is 0, keep empty if focused? No, adhere to prop.
       setDisplayValue(propValStr === '0' && isInputActive && displayValue === '' ? '' : propValStr);
    }
  }, [props.value, isNumber]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true);
    
    // UX FIX: Auto-select content on focus, especially for numbers.
    // This allows typing to replace '0' immediately instead of appending '05'.
    e.target.select();
    
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(false);
    
    if (isNumber) {
      // Normalize on blur: "005" -> "5", "" -> "0" (if required/default logic)
      let norm = displayValue;
      if (norm === '' || norm === '.') norm = '0';
      else norm = parseFloat(norm).toString(); // Removes leading zeros
      
      setDisplayValue(norm);
      // Ensure parent gets the normalized event if needed, though usually onChange handled it
    }
    
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (isNumber) {
      // UX FIX: Strip leading zeros immediately while typing (unless it's "0." or just "0")
      // e.g., "05" -> "5", but "0.5" stays "0.5"
      if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
        val = val.replace(/^0+/, '');
      }
      setDisplayValue(val);
    } else {
      setDisplayValue(val);
    }

    // Pass event to parent
    // Note: Parent usually casts Number(e.target.value). 
    // If val is "1.", Number("1.") is 1. Parent updates prop to 1.
    // Our useEffect logic prevents that prop update from overwriting "1." back to "1".
    e.target.value = val; 
    onChange?.(e);
  };

  // Logic to determine if label floats
  const hasValue = displayValue !== '' && displayValue !== null;
  const isDateType = type === 'date' || type === 'time' || type === 'datetime-local';
  const isFloating = focused || hasValue || isDateType || props.placeholder;

  return (
    <div className={clsx("relative group", className)}>
      <div className={clsx(
        "flex items-center bg-surface-variant/30 border-b border-outline-variant rounded-t-lg transition-colors h-14",
        error ? "border-error bg-error-container/10" : "focus-within:border-primary focus-within:bg-surface-variant/50"
      )}>
        {icon && (
          <div className={clsx("pl-3 transition-colors", error ? "text-error" : (focused ? "text-primary" : "text-on-surface-variant"))}>
            <AppIcon name={icon} size={20} />
          </div>
        )}
        <div className="relative flex-1 h-full">
          <input
            {...props}
            ref={inputRef}
            type={type}
            value={displayValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            inputMode={isNumber ? "decimal" : props.inputMode} // Better mobile keyboard
            className={clsx(
              "w-full h-full px-4 bg-transparent outline-none text-on-surface",
              "pt-6 pb-2 text-base"
            )}
          />
          <label className={clsx(
            "absolute left-4 transition-all duration-200 ease-out origin-top-left pointer-events-none",
            isFloating 
              ? "top-2 scale-75" 
              : "top-4 scale-100",
            error 
              ? "text-error" 
              : (focused ? "text-primary" : "text-on-surface-variant")
          )}>
            {label}
          </label>
        </div>
      </div>
      {error && <p className="text-xs text-error mt-1 ml-3 flex items-center gap-1"><AppIcon name="error" size={12} /> {error}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, icon, error, className = '', onFocus, onBlur, onChange, ...props }) => {
  const [focused, setFocused] = useState(false);
  const hasValue = (props.value ?? '') !== '';
  const isFloating = focused || hasValue || props.placeholder;

  return (
    <div className={clsx("relative group", className)}>
      <div className={clsx(
        "flex items-start bg-surface-variant/30 border-b border-outline-variant rounded-t-lg transition-colors min-h-[6rem]",
        error ? "border-error bg-error-container/10" : "focus-within:border-primary focus-within:bg-surface-variant/50"
      )}>
        {icon && (
          <div className={clsx("pl-3 pt-4 transition-colors", error ? "text-error" : (focused ? "text-primary" : "text-on-surface-variant"))}>
            <AppIcon name={icon} size={20} />
          </div>
        )}
        <div className="relative flex-1 h-full">
          <textarea
            {...props}
            onFocus={e => { setFocused(true); onFocus?.(e); }}
            onBlur={e => { setFocused(false); onBlur?.(e); }}
            onChange={onChange}
            className={clsx(
              "w-full min-h-[6rem] px-4 bg-transparent outline-none text-on-surface resize-y",
              "pt-7 pb-3 text-base"
            )}
          />
          <label className={clsx(
            "absolute left-4 transition-all duration-200 ease-out origin-top-left pointer-events-none",
            isFloating 
              ? "top-2 scale-75" 
              : "top-5 scale-100",
            error 
              ? "text-error" 
              : (focused ? "text-primary" : "text-on-surface-variant")
          )}>
            {label}
          </label>
        </div>
      </div>
      {error && <p className="text-xs text-error mt-1 ml-3 flex items-center gap-1"><AppIcon name="error" size={12} /> {error}</p>}
    </div>
  );
};

// --- SELECT ---
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, error, className = '', children, ...props }) => {
  return (
    <div className={clsx("relative group", className)}>
      <div className={clsx(
        "flex items-center bg-surface-variant/30 border-b border-outline-variant rounded-t-lg transition-colors h-14",
        error ? "border-error bg-error-container/10" : "focus-within:border-primary focus-within:bg-surface-variant/50"
      )}>
        <div className="relative flex-1 h-full">
          <select
            {...props}
            className={clsx(
              "w-full h-full px-4 bg-transparent outline-none text-on-surface appearance-none pt-6 pb-2 text-base cursor-pointer z-10 relative"
            )}
          >
            {children}
          </select>
          <label className={clsx(
            "absolute left-4 top-2 text-xs transition-all duration-200 ease-out origin-top-left pointer-events-none z-0",
             error ? "text-error" : "text-primary"
          )}>
            {label}
          </label>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
            <AppIcon name="arrow_drop_down" />
          </div>
        </div>
      </div>
      {error && <p className="text-xs text-error mt-1 ml-3 flex items-center gap-1"><AppIcon name="error" size={12} /> {error}</p>}
    </div>
  );
};

// --- CHECKBOX ---
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...props }) => {
  return (
    <label className={clsx("flex items-center gap-3 cursor-pointer group", className)}>
      <div className="relative flex items-center justify-center w-5 h-5">
        <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-outline rounded-sm checked:bg-primary checked:border-primary transition-colors" {...props} />
        <AppIcon name="check" size={16} className="absolute text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
      </div>
      <span className="text-sm text-on-surface group-hover:text-on-surface-variant transition-colors">{label}</span>
    </label>
  );
};

// --- BADGE ---
export const Badge: React.FC<{ label: string; color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'neutral' }> = ({ label, color = 'neutral' }) => {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    tertiary: "bg-tertiary/10 text-tertiary border-tertiary/20",
    error: "bg-error/10 text-error border-error/20",
    success: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    neutral: "bg-surface-variant/30 text-on-surface-variant border-outline-variant/30",
  };
  return (
    <span className={clsx("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", colors[color])}>
      {label}
    </span>
  );
};

// --- EMPTY STATE ---
export const EmptyState: React.FC<{ icon: string; title: string; description: string; action?: React.ReactNode }> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center border border-dashed border-outline-variant rounded-[32px] bg-surface-container-low/30 backdrop-blur-sm">
    <div className="w-20 h-20 bg-surface-variant/50 rounded-[24px] flex items-center justify-center text-on-surface-variant mb-6 shadow-sm">
      <AppIcon name={icon} size={36} />
    </div>
    <h3 className="text-xl font-bold text-on-surface tracking-tight">{title}</h3>
    <p className="text-sm text-on-surface-variant mt-2 max-w-sm mx-auto mb-8 leading-relaxed">{description}</p>
    {action}
  </div>
);

// --- SKELETON ---
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx("animate-pulse bg-surface-variant/50 rounded-md", className)} />
);
