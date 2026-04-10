
import React from 'react';
import { EmployeeRecord } from '../../types';

interface Props {
  employee: EmployeeRecord;
}

export const RegularDCSOption: React.FC<Props> = ({ employee }) => {
  const { employees } = employee;

  const Tr = ({ label, value, value2, bold2 }: any) => (
    <tr className="border-b border-black text-[11px] h-8">
      <td className="border-r border-black p-1 text-center font-bold w-10 align-middle">{label}</td>
      <td className="border-r border-black p-1 pl-2 w-1/3 font-semibold uppercase align-middle">{value}</td>
      <td className={`p-1 pl-2 uppercase align-middle ${bold2 ? 'font-bold' : ''}`}>{value2}</td>
    </tr>
  );

  return (
    <div className="bg-white text-black font-sans text-sm relative print-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '15mm 15mm 15mm 25mm', boxSizing: 'border-box' }}>
      
      <div className="text-center font-bold mb-4">
        <div className="text-xl border-2 border-black rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">11</div>
        <div className="text-lg font-bold uppercase underline">OPTION FORM FOR DIRECT CREDIT SYSTEM (DCS)</div>
        <div className="text-xs font-normal">(Pensioner Information - To be filled by Pensioner)</div>
      </div>

      <div className="border-2 border-black mb-6">
        <table className="w-full border-collapse">
          <tbody>
            <Tr label="1" value="Personnel No:" value2={employees.personal_no} />
            <Tr label="2" value="Name of Pensioner:" value2={employees.name} bold2 />
            <Tr label="3" value="Father / Husband Name:" value2={employees.father_name} />
            <Tr label="4" value="CNIC No:" value2={employees.cnic_no} bold2 />
            <Tr label="5" value="Designation & Grade:" value2={`${employees.designation} (BPS-${employees.bps})`} />
            <Tr label="6" value="Department:" value2="Elementary & Secondary Education" />
            <Tr label="7" value="Residential Address:" value2={employees.address} />
            <Tr label="8" value="Contact No:" value2={employees.mobile_no} />
            <Tr label="9" value="Bank Name:" value2={employees.bank_name} bold2 />
            <Tr label="10" value="Branch Name & Code:" value2={`${employees.branch_name} (${employees.branch_code})`} />
            <Tr label="11" value="Bank Account No:" value2={employees.bank_ac_no} bold2 />
          </tbody>
        </table>
      </div>

      <div className="border border-black p-3 bg-gray-50 print:bg-transparent mb-4 text-justify text-xs leading-relaxed">
         <span className="font-bold">DECLARATION:</span> I hereby opt to draw pension through Direct Credit System (DCS) and have submitted the Indemnity Bond. I accept that my legal heirs shall be liable to refund any excess amount credited to my account.
      </div>

      <div className="flex justify-between items-end border-2 border-black p-4 mb-4 h-32">
         <div className="text-center">
            <div className="w-32 h-16 border border-dashed border-black mb-1 flex items-center justify-center text-xs text-gray-400">Thumb Impression</div>
         </div>
         <div className="text-center w-64">
            <div className="border-t border-black mb-1"></div>
            <div className="font-bold text-xs uppercase">Signature of Pensioner</div>
            <div className="text-xs mt-1">Date: __________________</div>
         </div>
      </div>

      <div className="border-2 border-black p-0 mb-4">
         <div className="bg-black text-white text-center font-bold text-xs py-1 print:bg-gray-800 print:text-white">BANK VERIFICATION</div>
         <div className="p-4 grid grid-cols-2 gap-4 text-xs">
            <div>
               <div className="font-bold mb-1">Account Title:</div>
               <div className="border-b border-black uppercase">{employees.name}</div>
            </div>
            <div>
               <div className="font-bold mb-1">Account No:</div>
               <div className="border-b border-black font-mono">{employees.bank_ac_no}</div>
            </div>
            <div className="col-span-2 pt-8 flex justify-end">
               <div className="text-center w-48">
                  <div className="border-t border-black mb-1"></div>
                  <div className="font-bold">Bank Manager Stamp & Signature</div>
               </div>
            </div>
         </div>
      </div>

      <div className="mt-auto text-center border-t border-black pt-2">
         <div className="font-bold text-xs uppercase">For Use in Accountant General / District Accounts Office</div>
      </div>

    </div>
  );
};
