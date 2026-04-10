
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
  <div className="flex items-end mb-8">
    <div className="font-bold text-lg w-48 shrink-0 uppercase">{label}</div>
    <div className="flex-grow border-b-2 border-black text-center font-bold text-xl pb-1 uppercase relative top-[2px]">
      {value || ''}
    </div>
  </div>
);

export const FamilyPensionTitlePage: React.FC<Props> = ({ employee }) => {
  const { employees, service_history } = employee;
  const isDeceased = employees.status === 'Deceased';
  const dateValue = isDeceased 
    ? formatDate(service_history.date_of_death || service_history.date_of_retirement)
    : formatDate(service_history.date_of_retirement);

  return (
    <div className="bg-white text-black font-serif print-page fit-page mx-auto relative p-[9mm]" 
      style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* Heavy Border Container */}
      <div className="w-full h-full border-[5px] border-black p-6 flex flex-col justify-between relative">
        
        {/* Title */}
        <div className="text-center mt-2">
          <h1 className="text-4xl font-bold text-black tracking-wide scale-y-110">
            Pension Papers Of
          </h1>
        </div>

        {/* Fields Content */}
        <div className="flex flex-col justify-center mb-8 px-4">
          
          <div className="flex items-end mb-8">
            <div className="font-bold text-lg w-24 shrink-0 uppercase">Mr.</div>
            <div className="flex-grow border-b-2 border-black text-center font-bold text-xl pb-1 uppercase relative top-[2px]">
              {employees.name}
            </div>
          </div>

          <FieldRow label="S/O" value={employees.father_name} />
          
          <FieldRow label="CNIC NO" value={employees.cnic_no} />
          
          <FieldRow label="DESIGNATION" value={employees.designation} />
          
          <FieldRow label="PLACE OF POSTING" value={employees.school_full_name} />
          
          <FieldRow label="DEPARTMENT" value="Education" />
          
          <FieldRow label="PERSONAL NO" value={employees.personal_no} />
          
          <FieldRow label="DATE OF RETIREMENT/DEATH" value={dateValue} />

        </div>

        {/* Footer Box */}
        <div className="border-[3px] border-black p-3 text-center mb-4 mx-4">
           <h3 className="text-xl font-bold mb-2">Prepared by:</h3>
           <p className="text-lg font-bold uppercase mb-1">FAZAL ALI JUNIOR CLERK ALLAI BATTAGRAM</p>
           <p className="text-lg font-bold">CONTACT NO: 0302-5625439</p>
        </div>

      </div>
    </div>
  );
};
