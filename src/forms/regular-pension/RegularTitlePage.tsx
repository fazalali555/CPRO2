
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

export const RegularTitlePage: React.FC<Props> = ({ employee }) => {
  const { employees, service_history } = employee;
  const isDeceased = employees.status === 'Deceased';
  const retirementLabel = isDeceased ? 'DATE OF DEATH' : 'DATE OF RETIREMENT';

  return (
    <div className="bg-white text-black font-serif print-page mx-auto relative p-0" 
      style={{ width: '210mm', height: '297mm', boxSizing: 'border-box' }}>
      
      {/* Container with minimal margins for maximum page usage */}
      <div className="w-full h-full p-[8mm] pl-[12mm] flex flex-col">
        
        {/* Decorative Border Container */}
        <div className="w-full h-full border-4 border-double border-black p-4 flex flex-col justify-between relative shadow-[0_0_0_2px_white,0_0_0_4px_black]">
          
          {/* Table Content - Filling the page with integrated Header */}
          <div className="flex-grow flex items-center px-2">
            <table className="w-full border-collapse border-[3px] border-black">
              <tbody>
                {/* Integrated PENSION PAPERS Header Row */}
                <tr>
                  <td colSpan={2} className="border-b-[3px] border-black p-8 bg-black">
                    <div className="text-center">
                      <h1 className="text-6xl font-black text-white tracking-[0.2em] uppercase leading-tight scale-y-110">
                        Pension Papers
                      </h1>
                    </div>
                  </td>
                </tr>

                <tr className="border-b-2 border-black">
                  <td className="border-r-2 border-black p-5 w-1/3 font-bold uppercase text-xl bg-gray-100">Name of Official</td>
                  <td className="p-5 text-3xl font-black uppercase text-center">{employees.name}</td>
                </tr>
                <tr className="border-b-2 border-black">
                  <td className="border-r-2 border-black p-5 font-bold uppercase text-xl bg-gray-100">S/O, D/O, W/O</td>
                  <td className="p-5 text-2xl font-bold uppercase text-center">{employees.father_name}</td>
                </tr>
                <tr className="border-b-2 border-black">
                  <td className="border-r-2 border-black p-5 font-bold uppercase text-xl bg-gray-100">CNIC Number</td>
                  <td className="p-5 text-2xl font-bold uppercase text-center font-mono tracking-wider">{employees.cnic_no}</td>
                </tr>
                <tr className="border-b-2 border-black">
                  <td className="border-r-2 border-black p-5 font-bold uppercase text-xl bg-gray-100">Designation (BPS)</td>
                  <td className="p-5 text-2xl font-bold uppercase text-center">{employees.designation} (BPS-{employees.bps})</td>
                </tr>
                <tr className="border-b-2 border-black">
                  <td className="border-r-2 border-black p-5 font-bold uppercase text-xl bg-gray-100">Department</td>
                  <td className="p-5 text-2xl font-bold uppercase text-center">EDUCATION</td>
                </tr>
                <tr className="border-b-2 border-black">
                  <td className="border-r-2 border-black p-5 font-bold uppercase text-xl bg-gray-100">Office / School</td>
                  <td className="p-5 text-xl font-bold uppercase text-center leading-tight px-8">{employees.school_full_name}</td>
                </tr>
                <tr className="border-b-2 border-black">
                  <td className="border-r-2 border-black p-5 font-bold uppercase text-xl bg-gray-100">Personal Number</td>
                  <td className="p-5 text-2xl font-bold uppercase text-center tracking-widest font-mono">{employees.personal_no}</td>
                </tr>
                <tr>
                  <td className="border-r-2 border-black p-5 font-bold uppercase text-xl bg-gray-100">{retirementLabel}</td>
                  <td className="p-5 text-2xl font-bold uppercase text-center">{formatDate(service_history.date_of_retirement)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Box */}
          <div className="border-t-[3px] border-b-[3px] border-black py-8 text-center mx-2 mb-2 bg-gray-50">
             <p className="text-2xl font-black uppercase tracking-[0.2em] mb-2">PREPARED BY: FAZAL ALI JC ALLAI</p>
             <p className="text-3xl font-black tracking-widest font-mono">0343-2900419</p>
          </div>

        </div>
      </div>
    </div>
  );
};
