// ACR Categories based on BPS
export type ACRCategory = 'BPS_01_04' | 'BPS_05_15' | 'BPS_16_19' | 'BPS_20_22';

export interface ACRPeriod {
  from: string;
  to: string;
  year: string;
}

// Personal Information (common to all)
export interface ACRPersonalInfo {
  name: string;
  father_name: string;
  date_of_birth: string;
  domicile: string;
  home_district: string;
  present_post: string;
  bps: number;
  date_of_appointment: string;
  date_of_present_post: string;
  personal_no: string;
  cnic: string;
  qualification: string;
  institution: string;
  ddo_code: string;
}

// Performance Qualities for BPS 1-4 (Class IV)
export interface ACR_BPS_01_04_Qualities {
  attendance: 'Excellent' | 'Good' | 'Average' | 'Poor';
  punctuality: 'Excellent' | 'Good' | 'Average' | 'Poor';
  behavior: 'Excellent' | 'Good' | 'Average' | 'Poor';
  honesty: 'Excellent' | 'Good' | 'Average' | 'Poor';
  work_quality: 'Excellent' | 'Good' | 'Average' | 'Poor';
  obedience: 'Excellent' | 'Good' | 'Average' | 'Poor';
  overall_performance: 'Excellent' | 'Good' | 'Average' | 'Poor';
}

// Performance Qualities for BPS 5-15 (Clerical Staff)
export interface ACR_BPS_05_15_Qualities {
  quality_of_work: number;
  quantity_of_work: number;
  knowledge_of_work: number;
  reliability: number;
  analytical_ability: number;
  punctuality: number;
  integrity: number;
  behavior_with_colleagues: number;
  behavior_with_public: number;
  discipline: number;
  ability_to_work_under_pressure: number;
  initiative: number;
  ability_to_take_decisions: number;
  communication_skills: number;
}

// Grading System
export type ACRGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface ACRGrading {
  overall_grade: ACRGrade;
  numerical_score: number;
  grade_remarks: string;
}

// Integrity Certificate
export interface IntegrityCertificate {
  is_certified: boolean;
  remarks?: string;
  certified_by: string;
  certification_date: string;
}

// ACR Record
export interface ACRRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  period: ACRPeriod;
  category: ACRCategory;
  personal_info: ACRPersonalInfo;
  qualities: ACR_BPS_01_04_Qualities | ACR_BPS_05_15_Qualities | any;
  grading: ACRGrading;
  integrity: IntegrityCertificate;
  reporting_officer: {
    name: string;
    designation: string;
    date: string;
  };
  countersigning_officer: {
    name: string;
    designation: string;
    date: string;
    remarks?: string;
  };
  status: 'Draft' | 'Initiated' | 'Countersigned' | 'Filed' | 'Adverse';
  adverse_remarks?: string;
  employee_reply?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
