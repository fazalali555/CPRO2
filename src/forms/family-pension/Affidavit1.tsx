import React from 'react';
import { EmployeeRecord } from '../../types';
import { getBeneficiaryDetails } from '../../utils';
import { format, parseISO } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try {
    return format(parseISO(dateStr), 'dd-MM-yyyy');
  } catch {
    return dateStr;
  }
};

export const Affidavit1: React.FC<Props> = ({ employee }) => {
  const ben = getBeneficiaryDetails(employee);
  const deathDate = formatDate(employee.service_history.date_of_death || employee.service_history.date_of_retirement);

  return (
    <div className="bg-white text-black font-serif print-page mx-auto relative leading-loose" 
      style={{ 
        width: '216mm',  // Legal Width
        height: '356mm', // Legal Height
        padding: '0 25mm', // Horizontal padding
        boxSizing: 'border-box' 
      }}>
      
      {/* 
         Pakistani Stamp Paper Header Reservation
         Standard Stamp Paper header consumes about 4-5 inches at the top.
         110mm is approx 4.3 inches.
      */}
      <div style={{ height: '120mm', width: '100%' }} className="flex items-end justify-center text-gray-300 no-print border-b border-dashed border-gray-300 mb-8">
         <span className="mb-4">[ Space Reserved for Stamp Paper Header ~120mm ]</span>
      </div>

      {/* Content Start - Pushed down by the div above in flow */}
      <div>
        <h1 className="text-center text-2xl font-bold uppercase underline mb-8 tracking-widest">AFFIDAVIT / DECLARATION</h1>

        <div className="text-lg text-justify space-y-6">
          <p>
            I, Mst. <span className="font-bold uppercase underline decoration-dotted">{ben.name}</span> {ben.relation || 'Widow'} of Late Mr. 
            <span className="font-bold uppercase underline decoration-dotted"> {employee.employees.name}</span>, resident of 
            <span className="uppercase underline decoration-dotted"> {employee.employees.address}</span>, do hereby solemnly affirm and declare on oath as under:
          </p>

          <ol className="list-decimal list-outside ml-10 space-y-6 font-medium">
            <li>
              That I am the {ben.relation || 'Widow'} of the deceased government servant mentioned above who expired on 
              <span className="font-bold underline decoration-dotted ml-2"> {deathDate}</span>.
            </li>
            <li>
              That I have <strong>NOT</strong> re-married after the death of my husband till date, and I do not intend to marry in the near future.
            </li>
            <li>
              That I am not in receipt of any other pension from Government or Semi-Government department.
            </li>
            <li>
              That I was wholly dependent upon the deceased for my livelihood.
            </li>
            <li>
              That the list of family members provided is correct and there are no other legal heirs except those mentioned.
            </li>
          </ol>

          <p className="mt-8">
            Whatever stated above is true and correct to the best of my knowledge and belief and nothing has been concealed herein.
          </p>
        </div>

        <div className="mt-24 flex justify-between items-end px-4">
           <div className="text-center w-64">
              <div className="border-t-2 border-black mb-2"></div>
              <div className="font-bold text-lg">Witness 1</div>
              <div className="text-sm mt-1">CNIC: _________________</div>
           </div>

           <div className="text-center w-64">
              <div className="font-bold uppercase text-lg border-b border-black mb-2 pb-1">{ben.name}</div>
              <div className="font-bold">Deponent / Widow</div>
              <div className="text-sm mt-1">CNIC: {ben.cnic}</div>
           </div>
        </div>

        <div className="mt-24 text-center">
           <div className="font-bold uppercase underline text-xl mb-4">ATTESTED BY OATH COMMISSIONER</div>
           <div className="h-24 w-full"></div>
        </div>
      </div>
    </div>
  );
};
