
import React from 'react';
import { EmployeeRecord } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try { return format(parseISO(dateStr), 'dd/MM/yyyy'); } catch { return dateStr; }
};

const FieldRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex items-end mb-8 text-lg">
    <div className="font-bold w-64 shrink-0 uppercase tracking-wide">{label}</div>
    <div className="flex-grow border-b-2 border-black text-center font-bold text-xl pb-1 uppercase relative top-[2px]">
      {value || ''}
    </div>
  </div>
);

export const RegularTitlePage: React.FC<Props> = ({ employee }) => {
  const { employees, service_history } = employee;
  const isDeceased = employees.status === 'Deceased';
  const retirementLabel = isDeceased ? 'DATE OF DEATH' : 'DATE OF RETIREMENT';

  return (
    <div className="bg-white text-black font-serif print-page mx-auto relative p-0" 
      style={{ width: '210mm', height: '297mm', boxSizing: 'border-box' }}>
      
      {/* Container with margins for binding */}
      <div className="w-full h-full p-[15mm] pl-[25mm] flex flex-col">
        
        {/* Decorative Border Container */}
        <div className="w-full h-full border-4 border-double border-black p-8 flex flex-col justify-between relative shadow-[0_0_0_2px_white,0_0_0_4px_black]">
          
          {/* Top Section */}
          <div className="text-center mt-8">
            <h1 className="text-5xl font-bold text-black tracking-widest uppercase leading-tight scale-y-110">
              Pension<br/>Papers
            </h1>
            <div className="mt-4 w-32 h-1 bg-black mx-auto"></div>
          </div>

          {/* Fields Content */}
          <div className="flex flex-col justify-center px-4">
            
            <div className="flex items-end mb-8 text-lg">
              <div className="font-bold w-24 shrink-0 uppercase tracking-wide">Mr./Ms.</div>
              <div className="flex-grow border-b-2 border-black text-center font-bold text-2xl pb-1 uppercase relative top-[2px]">
                {employees.name}
              </div>
            </div>

            <FieldRow label="S/O, D/O, W/O" value={employees.father_name} />
            <FieldRow label="CNIC NO" value={employees.cnic_no} />
            <FieldRow label="DESIGNATION" value={employees.designation} />
            <FieldRow label="DEPARTMENT" value="EDUCATION" />
            <FieldRow label="OFFICE / SCHOOL" value={employees.school_full_name} />
            <FieldRow label="PERSONAL NO" value={employees.personal_no} />
            <FieldRow label={retirementLabel} value={formatDate(service_history.date_of_retirement)} />

          </div>

          {/* Footer Box */}
          <div className="border-t-2 border-b-2 border-black py-4 text-center mx-8 mb-4">
             <p className="text-sm font-bold uppercase tracking-widest text-gray-600 mb-1">PREPARED BY: FAZAL ALI JC </p>
             <p className="text-xl font-bold uppercase">{employees.district || 'BATTAGRAM'}</p>
          </div>

        </div>
      </div>
    </div>
  );
};
