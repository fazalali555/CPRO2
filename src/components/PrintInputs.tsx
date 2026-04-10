import React from 'react';

interface CombInputProps {
  values: string[];
  count: number;
  className?: string;
  boxClassName?: string;
}

export const CombInput: React.FC<CombInputProps> = ({ values, count, className = '', boxClassName = '' }) => {
  const boxes = [];
  for (let i = 0; i < count; i++) {
    boxes.push(
      <div
        key={i}
        className={`w-6 h-7 border border-black flex items-center justify-center font-bold text-sm ${boxClassName} ${i > 0 ? 'border-l-0' : ''}`}
      >
        {values[i] || ''}
      </div>
    );
  }
  return <div className={`flex ${className}`}>{boxes}</div>;
};

interface RadioOptionProps {
  label: string;
  checked?: boolean;
  superscript?: string;
  showLine?: boolean;
  lineWidthClassName?: string;
  suffix?: string;
  className?: string;
  labelClassName?: string;
}

export const RadioOption: React.FC<RadioOptionProps> = ({
  label,
  checked = false,
  superscript,
  showLine = false,
  lineWidthClassName = 'w-8',
  suffix = '%',
  className = '',
  labelClassName = 'text-[10px] font-medium leading-none relative whitespace-nowrap'
}) => (
  <div className={`flex items-center ${className}`}>
    <div className="w-3 h-3 rounded-full border border-black flex items-center justify-center mr-1 shrink-0">
      {checked && <div className="w-1.5 h-1.5 bg-black rounded-full"></div>}
    </div>
    <span className={labelClassName}>
      {label}
      {superscript && <sup className="text-[7px] ml-[1px]">{superscript}</sup>}
    </span>
    {showLine && <div className={`border-b border-black ${lineWidthClassName} ml-1`}></div>}
    {showLine && suffix && <span className="text-[11px] ml-1">{suffix}</span>}
  </div>
);
