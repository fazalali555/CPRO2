import { ACRCategory, ACRGrade } from '../types/acr';

export const ACR_CATEGORIES: { id: ACRCategory; label: string; labelUrdu: string; bpsRange: string }[] = [
  { id: 'BPS_01_04', label: 'Class-IV Staff', labelUrdu: 'چہارم درجہ', bpsRange: 'BPS 1-4' },
  { id: 'BPS_05_15', label: 'Clerical Staff', labelUrdu: 'کلریکل عملہ', bpsRange: 'BPS 5-15' },
  { id: 'BPS_16_19', label: 'Officers', labelUrdu: 'افسران', bpsRange: 'BPS 16-19' },
  { id: 'BPS_20_22', label: 'Senior Officers', labelUrdu: 'سینئر افسران', bpsRange: 'BPS 20-22' },
];

export const ACR_GRADES: { grade: ACRGrade; label: string; labelUrdu: string; minScore: number; maxScore: number; color: string }[] = [
  { grade: 'A', label: 'Outstanding', labelUrdu: 'بہترین', minScore: 90, maxScore: 100, color: 'text-success' },
  { grade: 'B', label: 'Very Good', labelUrdu: 'بہت اچھا', minScore: 75, maxScore: 89, color: 'text-primary' },
  { grade: 'C', label: 'Good', labelUrdu: 'اچھا', minScore: 60, maxScore: 74, color: 'text-blue-500' },
  { grade: 'D', label: 'Average', labelUrdu: 'اوسط', minScore: 50, maxScore: 59, color: 'text-warning' },
  { grade: 'E', label: 'Below Average', labelUrdu: 'کم', minScore: 0, maxScore: 49, color: 'text-error' },
];

export const RATING_LABELS = {
  10: 'Outstanding',
  9: 'Excellent',
  8: 'Very Good',
  7: 'Good',
  6: 'Above Average',
  5: 'Average',
  4: 'Below Average',
  3: 'Fair',
  2: 'Poor',
  1: 'Very Poor',
};

export const BPS_01_04_QUALITIES = [
  { key: 'attendance', label: 'Attendance', labelUrdu: 'حاضری' },
  { key: 'punctuality', label: 'Punctuality', labelUrdu: 'وقت کی پابندی' },
  { key: 'behavior', label: 'Behavior', labelUrdu: 'برتاؤ' },
  { key: 'honesty', label: 'Honesty', labelUrdu: 'ایمانداری' },
  { key: 'work_quality', label: 'Work Quality', labelUrdu: 'کام کا معیار' },
  { key: 'obedience', label: 'Obedience', labelUrdu: 'اطاعت' },
  { key: 'overall_performance', label: 'Overall Performance', labelUrdu: 'مجموعی کارکردگی' },
];

export const BPS_05_15_QUALITIES = {
  work_performance: [
    { key: 'quality_of_work', label: 'Quality of Work', labelUrdu: 'کام کا معیار' },
    { key: 'quantity_of_work', label: 'Quantity of Work', labelUrdu: 'کام کی مقدار' },
    { key: 'knowledge_of_work', label: 'Knowledge of Work', labelUrdu: 'کام کا علم' },
    { key: 'reliability', label: 'Reliability', labelUrdu: 'قابل اعتماد' },
    { key: 'analytical_ability', label: 'Analytical Ability', labelUrdu: 'تجزیاتی صلاحیت' },
  ],
  personal_qualities: [
    { key: 'punctuality', label: 'Punctuality', labelUrdu: 'وقت کی پابندی' },
    { key: 'integrity', label: 'Integrity', labelUrdu: 'دیانتداری' },
    { key: 'behavior_with_colleagues', label: 'Behavior with Colleagues', labelUrdu: 'ساتھیوں سے برتاؤ' },
    { key: 'behavior_with_public', label: 'Behavior with Public', labelUrdu: 'عوام سے برتاؤ' },
    { key: 'discipline', label: 'Discipline', labelUrdu: 'نظم و ضبط' },
  ],
  potential: [
    { key: 'ability_to_work_under_pressure', label: 'Work Under Pressure', labelUrdu: 'دباؤ میں کام' },
    { key: 'initiative', label: 'Initiative', labelUrdu: 'پہل قدمی' },
    { key: 'ability_to_take_decisions', label: 'Decision Making', labelUrdu: 'فیصلہ سازی' },
    { key: 'communication_skills', label: 'Communication Skills', labelUrdu: 'گفتگو' },
  ],
};

export const ACR_STATUS_COLORS = {
  'Draft': 'default',
  'Initiated': 'warning',
  'Countersigned': 'primary',
  'Filed': 'success',
  'Adverse': 'error',
} as const;

export const STORAGE_KEY_ACR = 'clerk_pro_acr_records';
