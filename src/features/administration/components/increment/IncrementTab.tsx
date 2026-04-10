import React, { useEffect, useState } from 'react';
import { Button, Badge } from '../../../../components/M3';
import { DataTable, Column } from '../../../../components/shared/DataTable';
import { AppIcon } from '../../../../components/AppIcon';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { useEmployeeContext } from '../../../../contexts/EmployeeContext';
import { calculateAnnualIncrement, isEligibleForIncrement } from '../../../../utils/RulesEngine';
import { EmployeeRecord } from '../../../../types';
import { StatCard } from '../shared/StatCard';

interface IncrementTabProps {
  onGenerateOrders?: (data: any) => void;
}

export const IncrementTab: React.FC<IncrementTabProps> = ({ onGenerateOrders }) => {
  const { t, isUrdu } = useLanguage();
  const { employees } = useEmployeeContext();
  const [eligibleCount, setEligibleCount] = useState(0);

  useEffect(() => {
    const count = employees.filter(emp => 
      isEligibleForIncrement(emp.service_history.date_of_appointment)
    ).length;
    setEligibleCount(count);
  }, [employees]);

  const handleGenerateOrders = () => {
    if (onGenerateOrders) {
      const data = {
        office: {
          title: isUrdu ? 'ڈسٹرکٹ ایجوکیشن آفیسر (میل)' : 'District Education Officer (Male)',
          department: isUrdu ? 'ایلیمینٹری اینڈ سیکنڈری ایجوکیشن' : 'Elementary & Secondary Education',
          city: isUrdu ? 'پشاور' : 'Peshawar',
          schoolName: 'DEO (M) Peshawar'
        },
        fileNo: 'DEO/Psh/Admn/Inc/2025/5678',
        subject: isUrdu 
          ? 'کے پی ریوائزڈ پے اسکیلز 2022 کے مطابق سالانہ اضافہ (انکریمنٹ) 2025 کی منظوری'
          : 'GRANT OF ANNUAL INCREMENT 2025 AS PER KP REVISED PAY SCALES 2022',
        recipient: {
          title: isUrdu ? 'ڈسٹرکٹ اکاؤنٹس آفیسر' : 'District Accounts Officer',
          address: isUrdu ? 'پشاور' : 'Peshawar'
        },
        content: isUrdu 
          ? 'اس دفتر کے درج ذیل ملازمین جنہوں نے 01.12.2025 تک 6 ماہ سے زیادہ ملازمت مکمل کر لی ہے، ان کے حق میں سالانہ انکریمنٹ برائے سال 2025 کی منظوری دی جاتی ہے۔'
          : 'The annual increment for the year 2025 is hereby granted in favor of the following employees who have completed more than 6 months of service as of 01.12.2025.',
        signatory: {
          name: isUrdu ? 'محمد عارف' : 'Muhammad Arif',
          designation: isUrdu ? 'ڈسٹرکٹ ایجوکیشن آفیسر (ایم)' : 'District Education Officer (M)'
        }
      };
      onGenerateOrders(data);
    }
  };

  const columns: Column<EmployeeRecord>[] = [
    {
      key: 'name',
      header: t.admin.designation,
      render: (emp) => (
        <div>
          <div className="font-bold">{emp.employees.name}</div>
          <div className="text-xs text-on-surface-variant">{emp.employees.designation}</div>
        </div>
      ),
    },
    {
      key: 'bps',
      header: t.admin.bps,
      render: (emp) => <span className="font-mono">BPS-{emp.employees.bps}</span>,
      className: 'text-center',
    },
    {
      key: 'current',
      header: t.admin.currentBasicPay,
      render: (emp) => {
        const currentPay = emp.financials?.last_basic_pay || emp.employees.bps * 10000;
        return <span className="font-mono">Rs. {currentPay.toLocaleString()}</span>;
      },
      className: 'text-center',
    },
    {
      key: 'increment',
      header: t.admin.annualIncrement,
      render: (emp) => {
        const eligible = isEligibleForIncrement(emp.service_history.date_of_appointment);
        const currentPay = emp.financials?.last_basic_pay || emp.employees.bps * 10000;
        const nextPay = calculateAnnualIncrement(emp.employees.bps, currentPay);
        const incrementAmount = nextPay - currentPay;
        return (
          <span className="font-mono text-success">
            {eligible ? `+ Rs. ${incrementAmount.toLocaleString()}` : '-'}
          </span>
        );
      },
      className: 'text-center',
    },
    {
      key: 'new',
      header: t.admin.newBasicPay,
      render: (emp) => {
        const eligible = isEligibleForIncrement(emp.service_history.date_of_appointment);
        const currentPay = emp.financials?.last_basic_pay || emp.employees.bps * 10000;
        const nextPay = calculateAnnualIncrement(emp.employees.bps, currentPay);
        return (
          <span className="font-mono font-bold text-success">
            Rs. {(eligible ? nextPay : currentPay).toLocaleString()}
          </span>
        );
      },
      className: 'text-center',
    },
    {
      key: 'status',
      header: t.admin.status,
      render: (emp) => {
        const eligible = isEligibleForIncrement(emp.service_history.date_of_appointment);
        return eligible ? (
          <Badge variant="success" label={t.admin.eligible} />
        ) : (
          <Badge variant="warning" label={t.admin.notEligible} />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-bold text-on-surface ${isUrdu ? 'text-right' : ''}`}>
          {t.admin.annualIncrements} (December 2025)
        </h3>
        <Button 
          variant="filled" 
          label={t.admin.generateIncrementOrders} 
          icon="description" 
          onClick={handleGenerateOrders}
        />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isUrdu ? 'dir-rtl' : ''}`}>
        <StatCard 
          label={t.admin.totalEmployees} 
          value={employees.length.toString()} 
          icon="groups" 
          color="text-primary" 
        />
        <StatCard 
          label={t.admin.eligibleForIncrement} 
          value={eligibleCount.toString()} 
          icon="trending_up" 
          color="text-success" 
        />
        <StatCard 
          label={t.admin.ineligibleJoiningAfterJune} 
          value={(employees.length - eligibleCount).toString()} 
          icon="info" 
          color="text-warning" 
        />
      </div>

      <DataTable
        data={employees}
        columns={columns}
        emptyState={{
          icon: 'trending_up',
          title: 'No employees found',
          description: 'Add employee records to process increments.',
        }}
      />

      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
        <AppIcon name="info" className="text-primary mt-1" />
        <div className={isUrdu ? 'text-right' : ''}>
          <h5 className="font-bold text-primary text-sm">KP Pay Scale Logic</h5>
          <p className="text-xs text-on-surface-variant">
            Increments are calculated based on KP Revised Pay Scales 2022 with automatic eligibility checks.
          </p>
        </div>
      </div>
    </div>
  );
};
