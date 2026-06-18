import React from 'react';
import { UserSearch } from 'lucide-react';
import { EmployeeRecord } from '@/types';

interface Props {
  formState: any;
  setField: (field: any, value: any) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectEmployee: (e: EmployeeRecord) => void;
  searchResults: EmployeeRecord[];
  showResults: boolean;
  setShowResults: (show: boolean) => void;
}

export const MetadataHeader: React.FC<Props> = ({ 
  formState, 
  setField, 
  searchTerm, 
  setSearchTerm, 
  selectEmployee, 
  searchResults,
  showResults,
  setShowResults
}) => {
  return (
    <div className="bg-white border-b px-4 py-4 space-y-4 shadow-sm z-10 relative">
      {/* Row 1: Search Employee (Full) */}
      <div className="w-full">
        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Search Employee</label>
        <div className="relative">
          <UserSearch className="absolute left-3 top-2.5 text-primary/70 h-5 w-5 z-10" />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-sm shadow-inner transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none border-b-2 focus:border-b-primary"
            placeholder="Search name/P.No..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }}
          />
        </div>
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white border shadow-xl rounded-lg z-[200] max-h-60 overflow-y-auto">
            {searchResults.map(emp => (
              <div key={emp.id} className="p-3 hover:bg-primary/5 cursor-pointer border-b text-sm" onClick={() => selectEmployee(emp)}>
                <div className="font-bold">{emp.employees.name}</div>
                <div className="text-xs text-gray-500">{emp.employees.designation}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Row 2: From (Full) */}
      <div className="w-full">
        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">From Office / Institution</label>
        <input 
          className="w-full px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-sm shadow-inner transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none border-b-2 border-b-gray-200 focus:border-b-primary font-semibold" 
          value={formState.institutionName} 
          onChange={e => setField('institutionName', e.target.value)} 
          placeholder="e.g. SDEO (M) ALLAI BATTAGRAM"
        />
      </div>

      {/* Row 3: To (Recipient) | Subject (Side-by-side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">To (Recipient Details)</label>
          <textarea 
            rows={2}
            className="w-full px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-sm shadow-inner transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none border-b-2 border-b-gray-200 focus:border-b-primary font-bold" 
            value={formState.to} 
            onChange={e => setField('to', e.target.value)} 
            placeholder="Enter recipient title and office..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Subject</label>
          <textarea 
            rows={2}
            className="w-full px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-sm shadow-inner transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none border-b-2 border-b-gray-200 focus:border-b-primary font-bold uppercase" 
            value={formState.subject} 
            onChange={e => setField('subject', e.target.value)} 
            placeholder="Enter letter subject..."
          />
        </div>
      </div>
      
      {/* Row 4: Ref No | Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Reference No.</label>
          <input 
            className="w-full px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-sm shadow-inner transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none border-b-2 border-b-gray-200 focus:border-b-primary font-mono" 
            value={formState.reference} 
            onChange={e => setField('reference', e.target.value)} 
            placeholder="e.g. 1024/ESE/..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Dated</label>
          <input 
            type="date" 
            className="w-full px-4 py-2 bg-gray-50/50 border border-gray-100 rounded-lg text-sm shadow-inner transition-all duration-300 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none border-b-2 border-b-gray-200 focus:border-b-primary" 
            value={formState.letterDate} 
            onChange={e => setField('letterDate', e.target.value)} 
          />
        </div>
      </div>
    </div>
  );
};
