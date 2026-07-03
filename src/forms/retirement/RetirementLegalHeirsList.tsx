
import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getCoverLetterInfo, getHeadOfInstitutionTitle } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

export const RetirementLegalHeirsList: React.FC<Props> = ({ employee, caseRecord }) => {
  const { headerTitle } = getCoverLetterInfo(employee);
  const signatoryTitle = getHeadOfInstitutionTitle(employee);
  
  const district = employee.employees.district || "Battagram";
  const tehsil = employee.employees.tehsil || "Allai";
  
  const name = employee.employees.name;
  const designation = employee.employees.designation;
  const bps = employee.employees.bps;
  const school = employee.employees.school_full_name;
  
  const heirs = employee.family_members || [];

  // Group heirs by wife (each group starts with a Wife/Widow, and includes all non-wife members until the next Wife/Widow)
  const groups: any[][] = [];
  let currentGroup: any[] = [];

  heirs.forEach((heir) => {
    const rel = heir.relation?.toLowerCase() || '';
    if (rel === 'wife' || rel === 'widow') {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [heir];
    } else {
      currentGroup.push(heir);
    }
  });
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  if (groups.length === 0) {
    groups.push(heirs);
  }

  return (
    <>
      {groups.map((groupHeirs, gIdx) => (
        <div 
          key={gIdx}
          className="bg-white text-black font-sans leading-snug relative print-page fit-page mx-auto mb-8 print:mb-0 print:break-after-page"
          style={{ 
            width: '210mm', 
            height: '297mm', 
            padding: '10mm', 
            fontSize: '11pt',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div className="flex flex-col h-full">
            {/* Title with top margin to balance the page */}
            <div className="text-center mb-3 mt-4">
              <h1 className="text-xl font-bold uppercase underline underline-offset-4 decoration-2">
                LIST OF LEGAL HEIRS {groups.length > 1 ? `(${gIdx + 1}${gIdx === 0 ? 'st' : gIdx === 1 ? 'nd' : gIdx === 2 ? 'rd' : 'th'} Family)` : ''}
              </h1>
              <div className="mt-2 text-justify text-base leading-snug px-2">
                <p>
                  In respect of <span className="font-bold uppercase">Mr./Ms. {name}</span>, 
                  Ex-<span className="font-bold uppercase">{designation}</span> (BPS-{bps}), 
                  <span className="font-bold uppercase"> {school}</span>, {tehsil} District {district}.
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="mb-4">
              <table className="w-full border-collapse border border-black text-center text-[10pt]">
                <thead>
                  <tr className="bg-gray-100 print:bg-transparent leading-tight">
                    <th className="border border-black p-1 w-12 font-bold">S.No</th>
                    <th className="border border-black p-1 text-left pl-3 font-bold">Name of Heir</th>
                    <th className="border border-black p-1 font-bold">Relationship</th>
                    <th className="border border-black p-1 w-28 font-bold">Age</th>
                    <th className="border border-black p-1 w-40 font-bold">CNIC No.</th>
                  </tr>
                </thead>
                <tbody>
                  {groupHeirs.length > 0 ? (
                    groupHeirs.map((heir, index) => (
                      <tr key={heir.id || index}>
                        <td className="border border-black p-1">{index + 1}</td>
                        <td className="border border-black p-1 text-left pl-3 font-bold uppercase">{heir.relative_name}</td>
                        <td className="border border-black p-1 uppercase">{heir.relation}</td>
                        <td className="border border-black p-1">{heir.age}</td>
                        <td className="border border-black p-1 font-mono">{heir.cnic}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                       <td colSpan={5} className="border border-black p-6 text-center italic text-gray-500">
                          No family members recorded in employee profile.
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Declaration */}
             <div className="mb-6 px-2">
              <p className="text-justify text-base leading-snug">
                I solemnly declare and affirm on oath that the family members/legal heirs listed above regarding 
                <span className="font-bold uppercase"> Mr./Ms. {name}</span> are correct. 
                I further declare that there are no other eligible legal heirs/family members other than those mentioned above.
              </p>
            </div>

            {/* Signatures (Inline row, top aligned for consistent lines) */}
            <div className="flex justify-between items-start mt-auto px-2 pb-6" style={{ pageBreakInside: 'avoid' }}>
              
              {/* Secretary */}
              <div className="flex flex-col items-center w-1/3">
                <div className="h-[14mm] w-full"></div> 
                <div className="w-full border-t border-black mb-1"></div>
                <h4 className="font-bold uppercase text-center text-xs">Secretary</h4>
                <p className="text-[10px] text-center">Village/Neighborhood Council</p>
                <p className="text-[10px] text-center">(Stamp & Signature)</p>
              </div>

              {/* Deponent */}
              <div className="flex flex-col items-center w-1/3 px-4">
                <div className="h-[14mm] w-full"></div> 
                <div className="w-full border-t border-black mb-1"></div>
                <h4 className="font-bold uppercase text-center text-xs">Deponent / Applicant</h4>
                <p className="text-[10px] text-center">(Signature / Thumb Impression)</p>
              </div>

              {/* Countersign */}
              <div className="flex flex-col items-center w-1/3">
                <div className="h-[14mm] w-full"></div>
                <div className="w-full border-t border-black mb-1"></div>
                <h4 className="font-bold uppercase text-center text-xs whitespace-pre-wrap">{signatoryTitle}</h4>
                <p className="text-[10px] text-center">(Countersignature)</p>
              </div>

            </div>
            
            {/* Footer date */}
            <div className="absolute bottom-4 left-12 text-[8px] text-gray-500 no-print">
               System Generated on: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
