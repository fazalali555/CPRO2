import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { LetterData } from '../types/letter';
import RichEditor from './RichEditor';

interface LetterFormProps {
  data: LetterData;
  onChange: (data: LetterData) => void;
  onAIDetected?: (text: string) => void;
}

const LetterForm: React.FC<LetterFormProps> = ({ data, onChange, onAIDetected }) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const set = (field: keyof LetterData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const addForwarding = () => {
    set('forwardings', [...data.forwardings, '']);
  };

  const updateForwarding = (idx: number, val: string) => {
    const updated = [...data.forwardings];
    updated[idx] = val;
    set('forwardings', updated);
  };

  const removeForwarding = (idx: number) => {
    set('forwardings', data.forwardings.filter((_, i) => i !== idx));
  };

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide';

  return (
    <div className="space-y-5">
      {/* Top row: No & Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Reference No.</label>
          <input
            type="text"
            placeholder="e.g. ORG/HR/2025/001"
            value={data.no}
            onChange={e => set('no', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={data.date}
            onChange={e => set('date', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Sender */}
      <div>
        <label className={labelClass}>From (Sender)</label>
        <textarea
          placeholder="Organization name, address, department..."
          value={data.sender}
          onChange={e => set('sender', e.target.value)}
          rows={2}
          className={inputClass + ' resize-none'}
        />
      </div>

      {/* Receiver */}
      <div>
        <label className={labelClass}>To (Receiver)</label>
        <textarea
          placeholder="Recipient name, title, organization, address..."
          value={data.receiver}
          onChange={e => set('receiver', e.target.value)}
          rows={3}
          className={inputClass + ' resize-none'}
        />
      </div>

      {/* Subject */}
      <div>
        <label className={labelClass}>Subject</label>
        <input
          type="text"
          placeholder="Brief subject of the letter"
          value={data.subject}
          onChange={e => set('subject', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Body */}
      <div>
        <label className={labelClass}>Letter Body</label>
        <RichEditor
          value={data.body}
          onChange={val => set('body', val)}
          placeholder="Compose the main body of your letter here... (or paste an AI letter to auto-detect all fields)"
          minHeight="280px"
          onAITextDetected={onAIDetected}
        />
      </div>

      {/* Signature */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Signatory Name</label>
          <input
            type="text"
            placeholder="e.g. John A. Doe"
            value={data.signatoryName}
            onChange={e => set('signatoryName', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Signature Title / Designation</label>
          <input
            type="text"
            placeholder="e.g. Director General"
            value={data.signatureTitle}
            onChange={e => set('signatureTitle', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Forwardings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass + ' mb-0'}>Forwardings / Distribution</label>
          <button
            type="button"
            onClick={addForwarding}
            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-md transition"
          >
            <Plus size={13} /> Add
          </button>
        </div>
        {data.forwardings.length === 0 && (
          <p className="text-xs text-gray-400 italic">No forwardings added. Click "Add" to add recipients.</p>
        )}
        <div className="space-y-2">
          {data.forwardings.map((fw, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-5 text-right">{idx + 1}.</span>
              <input
                type="text"
                placeholder={`Forwarding recipient ${idx + 1}`}
                value={fw}
                onChange={e => updateForwarding(idx, e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeForwarding(idx)}
                className="text-red-400 hover:text-red-600 transition flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced / Letterhead */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
          onClick={() => setAdvancedOpen(v => !v)}
        >
          <span>Advanced Options</span>
          {advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {advancedOpen && (
          <div className="p-4 space-y-4 border-t border-gray-200">
            <div>
              <label className={labelClass}>Organisation / Letterhead Name</label>
              <input
                type="text"
                placeholder="e.g. MINISTRY OF FINANCE — REPUBLIC OF XYZ"
                value={data.letterhead || ''}
                onChange={e => set('letterhead', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CC (Carbon Copy)</label>
              <textarea
                placeholder="CC recipients..."
                value={data.cc || ''}
                onChange={e => set('cc', e.target.value)}
                rows={2}
                className={inputClass + ' resize-none'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LetterForm;
