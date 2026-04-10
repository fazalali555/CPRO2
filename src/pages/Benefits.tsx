
import React, { useState } from 'react';
import { EmployeeRecord } from '../types';
import { calculateRetirementDate, formatCurrency } from '../utils';
import { RBDC_RATES, BENEVOLENT_RATES, EEF_RATES } from '../constants';
import { HeartHandshake, GraduationCap, Clock } from 'lucide-react';

import { useEmployeeContext } from '../contexts/EmployeeContext';

const Benefits: React.FC = () => {
  const { employees } = useEmployeeContext();
  const [activeTab, setActiveTab] = useState<'LPR' | 'RBDC' | 'E.E.F'>('LPR');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Employee Benefits</h2>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          {['LPR', 'RBDC', 'E.E.F'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
        {activeTab === 'LPR' && <LPRTab />}
        {activeTab === 'RBDC' && <RBDCTab />}
        {activeTab === 'E.E.F' && <EEFTab />}
      </div>
    </div>
  );
};

const LPRTab = () => {
  const [pay, setPay] = useState(0);
  
  // Standard LPR max: 180 full + 185 half = 365
  const fullAmount = pay * 6; // 180 days approx 6 months
  const halfAmount = (pay / 2) * 6.16; // 185 days approx 6.16 months

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Clock /></div>
        <h3 className="text-xl font-bold">LPR Calculator</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Last Basic Pay</label>
          <input 
            type="number" 
            className="w-full border p-3 rounded-lg text-lg" 
            value={pay || ''} 
            onChange={e => setPay(Number(e.target.value))}
            placeholder="e.g. 50000"
          />
          <p className="text-sm text-slate-500 mt-2">Max 365 days (180 Full + 185 Half)</p>
        </div>

        <div className="bg-slate-50 p-6 rounded-lg space-y-3">
          <div className="flex justify-between">
             <span>180 Days Full Pay:</span>
             <span className="font-bold">{formatCurrency(fullAmount)}</span>
          </div>
          <div className="flex justify-between">
             <span>185 Days Half Pay:</span>
             <span className="font-bold">{formatCurrency(halfAmount)}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between text-lg text-emerald-700 font-bold">
             <span>Total Encashment:</span>
             <span>{formatCurrency(fullAmount + halfAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RBDCTab = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-red-100 text-red-700 rounded-lg"><HeartHandshake /></div>
      <h3 className="text-xl font-bold">Death Compensation (RBDC)</h3>
    </div>

    <div className="overflow-hidden border rounded-xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="p-4 font-semibold text-slate-700">BPS Grade</th>
            <th className="p-4 font-semibold text-slate-700">Compensation</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {RBDC_RATES.map((rate, i) => (
            <tr key={i} className="hover:bg-slate-50">
              <td className="p-4">BPS {rate.min}-{rate.max}</td>
              <td className="p-4 font-mono font-bold text-emerald-700">{formatCurrency(rate.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
       {Object.entries(BENEVOLENT_RATES).map(([key, val]) => (
         <div key={key} className="p-4 border rounded-lg flex justify-between items-center">
            <span className="capitalize font-medium text-slate-600">{key} Grant</span>
            <span className="font-bold">{formatCurrency(val)}</span>
         </div>
       ))}
    </div>
  </div>
);

const EEFTab = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-orange-100 text-orange-700 rounded-lg"><GraduationCap /></div>
      <h3 className="text-xl font-bold">E.E.F (Employee Education Foundation)</h3>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(EEF_RATES).map(([level, amount]) => (
        <div key={level} className="p-5 border rounded-xl hover:shadow-md transition-shadow">
          <h4 className="text-slate-500 text-sm uppercase font-bold mb-1">{level}</h4>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(amount)}</p>
          <p className="text-xs text-slate-400 mt-1">Per Annum</p>
        </div>
      ))}
    </div>
  </div>
);

export default Benefits;
