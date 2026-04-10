import React from 'react';
import { EmployeeRecord } from '../../types';
import { format, parseISO } from 'date-fns';
import { getBeneficiaryDetails } from '../../utils';

interface Props {
  employee: EmployeeRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_________________';
  try { return format(parseISO(dateStr), 'dd/MM/yyyy'); } catch { return '_________________'; }
};

export const FamilyMembersList: React.FC<Props> = ({ employee }) => {
  const { employees, family_members, service_history } = employee;
  const ben = getBeneficiaryDetails(employee);
  
  // Try to find widow in family members if not in beneficiary
  const widowName = (ben.relation?.toLowerCase().includes('widow') || ben.relation?.toLowerCase() === 'wife')
    ? ben.name 
    : family_members.find(m => m.relation.toLowerCase().includes('wife') || m.relation.toLowerCase().includes('widow'))?.relative_name || '';

  const deathDate = formatDate(service_history.date_of_death || service_history.date_of_retirement); // Use Date of Death if present

  // Ensure we have at least 8 rows for the table
  const rows = [...family_members];
  while (rows.length < 8) {
    rows.push({ id: `empty_${rows.length}`, relative_name: '', relation: '', age: 0, cnic: '' } as any);
  }

  return (
    <div className="bg-white text-black font-serif text-[11pt] leading-snug relative print-page fit-page mx-auto"
      style={{ width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold uppercase underline underline-offset-4 mb-1">
          LIST OF SURVIVING FAMILY MEMBERS OF
        </h1>
        <div className="text-lg font-bold uppercase border-b-2 border-black inline-block min-w-[260px]">
           MR/LATE. {employees.name}
        </div>
      </div>

      {/* Table */}
      <div className="mb-4">
        <table className="w-full border-collapse border border-black text-center text-[10pt]">
          <thead>
            <tr className="bg-gray-100 print:bg-transparent font-bold leading-tight">
              <th className="border border-black p-1 w-12">S.NO</th>
              <th className="border border-black p-1">NAME</th>
              <th className="border border-black p-1 w-32">DATE OF BIRTH/AGE</th>
              <th className="border border-black p-1 w-48">RELATION SHIP WITH PENSIONER</th>
              <th className="border border-black p-1 w-32">MARRIED UN-MARRIED</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((member, index) => (
              <tr key={member.id} className="h-7">
                <td className="border border-black p-1">{member.relative_name ? index + 1 : ''}</td>
                <td className="border border-black p-1 uppercase font-bold text-left pl-3">{member.relative_name}</td>
                <td className="border border-black p-1">{member.age || member.dob || ''}</td>
                <td className="border border-black p-1 uppercase">{member.relation}</td>
                <td className="border border-black p-1">{member.marital_status || (member.relation?.toLowerCase() === 'wife' || member.relation?.toLowerCase() === 'widow' ? 'Widow' : '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Certifications */}
      <div className="space-y-4 text-justify leading-[1.6]">
        
        {/* 1. Widow Certification */}
        <div className="flex items-start gap-3">
          <span className="font-bold">1.</span>
          <p>
            This is to certify that the widow mentioned at Serial No. <span className="border-b border-black font-bold px-2 inline-block w-16 text-center">{widowName ? '1' : '___'}</span> above 
            was neither judicially separated from her husband in his life nor she has ceased 
            under the customary law of the community to which she belongs to be entitled to 
            maintenance. She has not re-married.
          </p>
        </div>

        {/* 2. Guardian Certification */}
        <div className="flex items-start gap-3">
          <span className="font-bold">2.</span>
          <div>
            <p className="mb-1.5">
              Serial No. <span className="border-b border-black inline-block w-24"></span> are real and not adopted.
            </p>
            <p>
              Mst: <span className="border-b border-black font-bold uppercase px-2 inline-block w-64">{widowName}</span> is recommended to be the 
              guardian of minor children at Serial No. <span className="border-b border-black inline-block w-32"></span> for the purpose of 
              receiving their share of Pension/Gratuity/Commutation.
            </p>
          </div>
        </div>

        {/* 3. Death Certification */}
        <div className="flex items-start gap-3">
          <span className="font-bold">3.</span>
          <p>
            Certified that Late <span className="border-b border-black font-bold uppercase px-2">{employees.name}</span> expired on <span className="border-b border-black font-bold px-2">{deathDate}</span>.
          </p>
        </div>

        {/* 4. Single Widow Certification */}
        <div className="flex items-start gap-3">
          <span className="font-bold">4.</span>
          <p>
            Certified that Mst: <span className="border-b border-black font-bold uppercase px-2">{widowName}</span> as mentioned above is the only 
            widow of the deceased pensioners.
          </p>
        </div>

      </div>

      {/* Footer Signature */}
      <div className="mt-auto pt-10 flex flex-col items-end" style={{ pageBreakInside: 'avoid' }}>
        <div className="text-center font-bold">
           <div className="mb-8">Attested</div>
           <div className="border-t border-black w-64 pt-2">
              HEAD OF OFFICE/HEAD OF DEPARTMENT
           </div>
        </div>
      </div>

    </div>
  );
};
