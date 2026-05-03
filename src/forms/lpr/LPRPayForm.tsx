import React, { useMemo } from 'react';
import { EmployeeRecord, CaseRecord } from '../../types';
import { formatDate, formatPayrollMonth } from '../../utils/dateUtils';
import { splitToChars, getDepartmentInfo } from '../../utils';

interface Props {
  employee: EmployeeRecord;
  caseRecord: CaseRecord;
}

const CharBox = ({ char }: { char?: string }) => (
  <div className="w-8 h-8 border border-black flex items-center justify-center font-bold text-lg bg-white shrink-0">
    {char || ''}
  </div>
);

const formatAmount = (amount: number) => `${Math.round(amount).toLocaleString('en-PK')}/-`;

export const LPRPayForm: React.FC<Props> = ({ employee, caseRecord }) => {
  const emp = employee.employees;
  const service = employee.service_history;
  const financials = employee.financials;

  const deptInfo = useMemo(() => getDepartmentInfo(
    emp.school_full_name || '',
    emp.office_name || '',
    emp.tehsil || '',
    emp.district || '',
    emp.designation_full || emp.designation || ''
  ), [emp]);

  const monthLabel = caseRecord.extras?.lpr_month || formatPayrollMonth(new Date());
  const [monthPart, yearPart] = monthLabel.split('/').map(s => s.trim());

  const ddoChars = splitToChars(emp.ddo_code || '', 6);
  const personalChars = splitToChars(emp.personal_no || '', 8);
  const bpsChars = splitToChars(String(emp.bps ?? ''), 2);
  const designationLine = [emp.designation, emp.school_full_name].filter(Boolean).join(', ');
  const dob = formatDate(emp.dob) || '__________';
  const doa = formatDate(service.date_of_appointment) || '__________';
  const dor = formatDate(service.date_of_retirement) || '__________';
  const basicPay = financials.basic_pay || 0;
  const lprDays = service.lpr_days ?? 365;
  const lprAmount = caseRecord.extras?.lpr_amount ?? Math.round(((basicPay || 0) / 30) * lprDays);
  const orderNo = service.retirement_order_no || '__________';
  const orderDate = formatDate(service.retirement_order_date) || '__________';

  const rows = [
    { label: 'Father Name', value: emp.father_name || '__________' },
    { label: 'Date of Birth', value: dob },
    { label: 'Date of Appointment', value: doa },
    { label: 'Date of Retirement', value: dor },
    { label: 'Basic Pay', value: formatAmount(basicPay) }
  ];

  const remarksText = caseRecord.extras?.remarks || 
    `LPR/Encashment Sanction order issued by ${deptInfo.authorityTitle.replace(/\n/g, ' ')} vide No ${orderNo} Dated ${orderDate}`;

  return (
    <div className="w-full h-full bg-white flex justify-center font-sans antialiased text-black print:p-0">
      <div className="w-[1000px] h-[200mm] bg-white p-6 relative text-sm flex flex-col print:shadow-none print:p-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 flex items-center justify-center border-2 border-green-800 rounded-full overflow-hidden">
                <div className="text-[8px] text-center font-bold leading-tight text-green-900 p-1">
                  GOV OF KPK <br /> PAYROLL
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold leading-tight">PAYROLL SYSTEM</h1>
              <h2 className="text-xl font-bold leading-tight uppercase">AMENDMENT FORM</h2>
              <h3 className="text-xl font-bold leading-tight uppercase">SINGLE EMPLOYEE ENTRY</h3>
            </div>
          </div>

          <div className="text-xs font-medium text-right space-y-1">
            <p className="mb-2 text-[10px]">GS &PD.KP 559---F.S---3000 Pads of 100 L---1G,12.200--(25)</p>
            <div className="flex justify-end items-center gap-2">
              <span className="font-bold">Form: Pay 02</span>
            </div>
            <div className="flex justify-end items-center gap-2">
              <span>Date</span>
              <div className="w-32 border-b border-black"></div>
            </div>
            <div className="flex justify-end items-center gap-2">
               <span>DDO Code:</span>
               <span className="font-bold">{emp.ddo_code}</span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-black mb-3"></div>

        <div className="space-y-2 mb-3">
          <div className="flex items-end gap-2">
            <span className="font-bold uppercase">FOR THE MONTH OF</span>
            <div className="border-b-2 border-black w-32 font-bold px-2">{monthPart || ''}</div>
            <span className="font-bold">{yearPart || new Date().getFullYear()}</span>
          </div>

          <div className="flex items-start">
            <div className="w-40 pt-1">
              <div className="font-bold uppercase text-xs">DDO CODE</div>
              <div className="text-[10px]">(Cost Center)</div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex">
                {ddoChars.map((c, i) => <CharBox key={i} char={c} />)}
              </div>
              <span className="text-sm font-bold uppercase">{emp.office_name}</span>
            </div>
          </div>

          <div className="border-b border-black w-full my-1"></div>

          <div className="flex items-center">
            <div className="w-40 font-bold uppercase text-xs">Personal Number</div>
            <div className="flex items-center w-full">
              <div className="flex mr-4">
                {personalChars.map((c, i) => <CharBox key={i} char={c} />)}
              </div>

              <div className="flex-grow flex items-center gap-2">
                <span className="font-bold text-lg whitespace-nowrap uppercase">{emp.name || ''}</span>
                <div className="flex-col w-full ml-4">
                  <div className="flex justify-between items-end">
                    <span className="whitespace-nowrap mr-2 text-xs">Employee Name</span>
                    <div className="flex flex-col items-start w-full">
                      <div className="flex justify-between w-full text-[10px]">
                        <span>National ID Card</span>
                      </div>
                      <div className="flex w-full items-end gap-1">
                        <span className="text-xs">No.</span>
                        <div className="border-b border-black w-full font-bold">{emp.cnic_no || ''}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-black w-full my-1"></div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-40 font-bold uppercase text-xs">Grade (Pay Scale Group)</div>
              <div className="flex">
                {bpsChars.map((c, i) => <CharBox key={i} char={c} />)}
              </div>
              <div className="font-bold text-lg ml-4 uppercase">{designationLine}</div>
            </div>

            <div className="flex items-center gap-2 mr-8">
              <div className="text-center text-[10px] leading-tight mr-1 font-bold">
                Salary<br />Status
              </div>
              <div className="w-8 h-8 border border-black"></div>
              <span className="ml-2 text-xs font-bold">Start</span>
              <div className="w-8 h-8 border border-black flex items-center justify-center font-bold text-xl">X</div>
              <span className="text-xs font-bold uppercase">Stop</span>
            </div>
          </div>
        </div>

        <div className="border-2 border-black flex flex-col">
          <div className="flex border-b border-black text-center font-bold text-xs uppercase bg-gray-50">
            <div className="w-[30%] border-r border-black py-1">GENERAL DATA CHANGE</div>
            <div className="w-[70%] py-1">CHANGE IN PAYMENTS/DEDUCTIONS (LPR/Encashment)</div>
          </div>

          <div className="flex border-b border-black text-center text-[10px] font-black items-stretch h-10 uppercase bg-gray-50">
            <div className="w-10 border-r border-black flex items-center justify-center flex-col leading-none p-1">info Typ</div>
            <div className="w-10 border-r border-black flex items-center justify-center flex-col leading-none p-1">Fiel d ID</div>
            <div className="w-[200px] border-r border-black flex items-center justify-center">Field Name</div>
            <div className="flex-grow border-r border-black flex items-center justify-center">New Contents (Data)</div>
            <div className="w-16 border-r border-black flex items-center justify-center flex-col leading-tight">Effective Date</div>
            <div className="w-[28%] flex items-center justify-center">Remarks / Sanction Details</div>
          </div>

          <div className="flex items-stretch">
            <div className="flex-grow flex flex-col">
              {rows.map((row, idx) => (
                <div key={idx} className="flex border-b border-black h-8 text-sm items-center">
                  <div className="w-10 border-r border-black h-full shrink-0"></div>
                  <div className="w-10 border-r border-black h-full shrink-0"></div>
                  <div className="w-[200px] border-r border-black h-full px-2 flex items-center font-bold">
                    {row.label}
                  </div>
                  <div className="flex-grow border-r border-black h-full flex items-center justify-center font-bold">
                    {row.value}
                  </div>
                  <div className="w-16 border-r border-black h-full shrink-0"></div>
                </div>
              ))}

              <div className="flex border-b border-black h-9 text-sm items-center bg-gray-50">
                <div className="w-10 border-r border-black h-full shrink-0"></div>
                <div className="w-10 border-r border-black h-full shrink-0"></div>
                <div className="w-[200px] border-r border-black h-full px-2 flex items-center font-extrabold text-lg">
                  LPR Days
                </div>
                <div className="flex-grow border-r border-black h-full flex items-center justify-center font-extrabold text-lg">
                  {lprDays}
                </div>
                <div className="w-16 border-r border-black h-full shrink-0"></div>
              </div>

              <div className="flex h-10 text-sm items-center">
                <div className="w-10 border-r border-black h-full shrink-0"></div>
                <div className="w-10 border-r border-black h-full shrink-0"></div>
                <div className="w-[200px] border-r border-black h-full px-2 flex items-center font-extrabold text-xl">
                  LPR Amount &nbsp;=
                </div>
                <div className="flex-grow border-r border-black h-full flex items-center justify-center font-extrabold text-xl">
                  {formatAmount(Number(lprAmount))}
                </div>
                <div className="w-16 border-r border-black h-full shrink-0"></div>
              </div>
            </div>

            <div className="w-[28%] p-3 font-bold text-xs leading-relaxed flex items-center justify-center text-center">
              {remarksText}
            </div>
          </div>
        </div>

        <div className="mt-auto pt-8 flex justify-between items-end text-xs px-4 pb-2">
          <div className="text-center">
            <div className="w-48 border-t-2 border-dotted border-black mb-1"></div>
            <p className="font-bold">Prepared By</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t-2 border-dotted border-black mb-1"></div>
            <p className="font-bold">Audited/Checked By</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t-2 border-dotted border-black mb-1"></div>
            <p className="font-bold uppercase">{deptInfo.signatureTitleShort || 'DDO'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
