import React from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { getRetirementType, getSalutationFromSchoolName, getDEORecipientTitle } from '../../utils';
import { parseISO, format } from 'date-fns';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '_______';
  try {
    return format(parseISO(dateStr), 'MMMM dd, yyyy');
  } catch {
    return dateStr;
  }
};

export const RetirementEmployeeApplication: React.FC<Props> = ({ employee, caseRecord }) => {
  const type = getRetirementType(employee, caseRecord);
  const salutation = getSalutationFromSchoolName(employee.employees.school_full_name);
  const dor = formatDate(employee.service_history.date_of_retirement);
  const doa = formatDate(employee.service_history.date_of_appointment);
  
  const recipientLine = getDEORecipientTitle(employee);
  const districtName = employee.employees.district || "Battagram";

  const getSubject = () => {
    switch (type) {
      case 'medical': return 'Subject: Application for Retirement on Medical Grounds';
      case 'premature': return 'Subject: Application for Premature Retirement';
      default: return 'Subject: Application for Retirement on Superannuation & Grant of L.P.R';
    }
  };

  const getBody = () => {
    if (type === 'medical') {
      return (
        <div className="text-justify text-lg space-y-6 mb-12">
          <p>
            Most respectfully, it is submitted that the undersigned has been performing duties 
            as <strong>{employee.employees.designation}</strong> at <strong>{employee.employees.school_full_name}</strong> since <strong>{doa}</strong>.
          </p>
          <p>
            Due to medical reasons and as medically advised {caseRecord.extras?.medical_ref ? `(Ref: ${caseRecord.extras.medical_ref})` : ''}, 
            I am unable to continue my service any further.
          </p>
          <p>
            Therefore, it is humbly requested that my retirement be sanctioned on medical grounds with effect from 
            <strong> {dor}</strong>, and approval for pension and other admissible benefits be granted accordingly.
          </p>
          <p>I shall be extremely grateful to you for this act of kindness.</p>
        </div>
      );
    }

    if (type === 'premature') {
      return (
        <div className="text-justify text-lg space-y-6 mb-12">
          <p>
            Most respectfully, it is submitted that the undersigned has been performing duties 
            as <strong>{employee.employees.designation}</strong> at <strong>{employee.employees.school_full_name}</strong> since <strong>{doa}</strong>.
          </p>
          <p>
            Due to unavoidable personal circumstances, I am unable to continue my service any further.
          </p>
          <p>
            Therefore, I humbly request that you kindly sanction my premature retirement effective from 
            <strong> {dor}</strong>, and approve the release of my pension benefits as per rules.
          </p>
          <p>I shall be extremely grateful to you for this act of kindness.</p>
        </div>
      );
    }

    // Default: Superannuation
    return (
      <div className="text-justify text-lg space-y-6 mb-12">
        <p>
          Most respectfully, it is submitted that the undersigned has been performing duties 
          as <strong>{employee.employees.designation}</strong> since <strong>{doa}</strong>.
        </p>
        <p>
          It is stated that I will attain the age of superannuation (60 years) on <strong>{dor}</strong>.
        </p>
        <p>
          Therefore, it is humbly requested that my retirement be sanctioned with effect from 
          <strong> {dor}</strong>, and approval for Pension, L.P.R (Leave Preparatory to Retirement), 
          and other admissible benefits be granted accordingly.
        </p>
        <p>I shall be extremely grateful to you for this act of kindness.</p>
      </div>
    );
  };

  return (
    <div 
      className="bg-white text-black font-serif leading-relaxed relative print-page mx-auto"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        padding: '25mm', 
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div className="flex flex-col h-full">
        
        {/* Recipient Section */}
        <div className="mb-10">
          <p className="font-bold text-lg">To,</p>
          <div className="pl-4 mt-1">
            <p className="font-bold text-lg">{recipientLine.replace(/, District.*$/, '')},</p>
            <p className="text-lg">District {districtName}.</p>
          </div>
        </div>

        {/* Subject Line */}
        <div className="mb-10 text-center px-8">
          <span className="font-bold text-lg border-b-2 border-black uppercase tracking-wide inline-block leading-normal">
            {getSubject()}
          </span>
        </div>

        {/* Salutation */}
        <div className="mb-4">
          <p className="text-lg font-bold">Respected {salutation},</p>
        </div>

        {/* Dynamic Body */}
        {getBody()}

        {/* Closing & Signature Block */}
        <div className="mt-auto flex flex-col items-end">
          <div className="w-2/3 text-left pl-12">
            <p className="font-bold text-lg mb-8">Sincerely,</p>
            
            {/* Signature Line */}
            <div className="mb-4">
              <span className="font-bold">Signature: </span>
              <span className="inline-block w-48 border-b-2 border-black"></span>
            </div>

            {/* Applicant Details */}
            <div className="space-y-1 text-lg">
              <p>
                <span className="font-bold">Name:</span> {employee.employees.name}
              </p>
              <p>
                <span className="font-bold">Designation:</span> {employee.employees.designation}
              </p>
              <p>
                <span className="font-bold">School:</span> {employee.employees.school_full_name}
              </p>
              <p>
                <span className="font-bold">CNIC No:</span> {employee.employees.cnic_no}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
