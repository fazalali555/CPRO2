
/**
 * Department Detection System
 * 
 * A comprehensive, extensible system for detecting department types,
 * signature titles, and letterhead information from institution names.
 * 
 * @module departmentDetector
 * @version 2.2.0 - Fixed letterhead with district & dynamic department
 * @author KPK RPMS Team
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type OrganizationType = 
  | 'primary_school'
  | 'middle_school'
  | 'high_school'
  | 'higher_secondary_school'
  | 'college'
  | 'university'
  | 'education_office'
  | 'health_facility'
  | 'hospital'
  | 'revenue_office'
  | 'police_station'
  | 'police_office'
  | 'agriculture_office'
  | 'irrigation_office'
  | 'public_works_office'
  | 'forest_office'
  | 'finance_office'
  | 'social_welfare_office'
  | 'local_government_office'
  | 'village_council'
  | 'neighborhood_council'
  | 'tehsil_municipal'
  | 'general_office'
  | 'directorate'
  | 'other';

export type DepartmentType =
  | 'education'
  | 'health'
  | 'revenue'
  | 'police'
  | 'agriculture'
  | 'irrigation'
  | 'public_works'
  | 'forest'
  | 'finance'
  | 'social_welfare'
  | 'home'
  | 'local_government'
  | 'unknown';

export interface LetterheadInfo {
  /** Line 1: Office title (e.g., "OFFICE OF THE HEADMASTER GHS ALLAI BATTAGRAM") */
  line1: string;
  /** Line 2: Department name (e.g., "Department of Elementary & Secondary Education") */
  line2: string;
  /** Line 3: Government line */
  line3: string;
  /** Combined letterhead for display */
  full: string;
}

export interface DepartmentInfo {
  /** The header title for letterhead (e.g., "OFFICE OF THE HEADMASTER") */
  headerTitle: string;
  
  /** The signature title with institution name */
  signatureTitle: string;
  
  /** Short signature title without institution name */
  signatureTitleShort: string;
  
  /** Full department name */
  department: string;
  
  /** Short department name for letterhead */
  departmentShort: string;
  
  /** Department type identifier */
  departmentType: DepartmentType;
  
  /** Organization type identifier */
  organizationType: OrganizationType;
  
  /** Whether this is a female/girls institution */
  isGirlsInstitution: boolean;
  
  /** Gender indicator for addressing */
  gender: 'Male' | 'Female';
  
  /** Appropriate salutation */
  salutation: 'Sir' | 'Madam';
  
  /** The authority/reporting officer title */
  authorityTitle: string;
  
  /** Original institution name (cleaned) */
  institutionName: string;
  
  /** District name */
  district: string;
  
  /** Complete letterhead information */
  letterhead: LetterheadInfo;
}

export interface KeywordConfig {
  keywords: string[];
  designation: string;
  designationFemale?: string;
  department: string;
  departmentShort: string;
  departmentType: DepartmentType;
  organizationType: OrganizationType;
  priority: number;
  /** If true, designation needs district suffix */
  addDistrictSuffix?: boolean;
  /** If true, designation needs tehsil suffix */
  addTehsilSuffix?: boolean;
  /** If true, include institution name in header */
  includeInstitutionInHeader?: boolean;
}

// ============================================================================
// CONFIGURATION - EASILY EXTENSIBLE
// ============================================================================

/**
 * Master configuration for all institution types.
 * Add new departments by adding entries to this array.
 * Lower priority number = checked first
 */
export const INSTITUTION_CONFIG: KeywordConfig[] = [
  // -------------------------------------------------------------------------
  // LOCAL GOVERNMENT DEPARTMENT (Priority: 10-20) - HIGH PRIORITY
  // -------------------------------------------------------------------------
  {
    keywords: ['DIRECTOR LOCAL GOVERNMENT', 'DIRECTOR LG', 'DIRECTORATE LOCAL GOVERNMENT'],
    designation: 'Director Local Government',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'directorate',
    priority: 10,
  },
  {
    keywords: ['DEPUTY DIRECTOR LOCAL GOVERNMENT', 'DD LOCAL GOVERNMENT', 'DD LG'],
    designation: 'Deputy Director Local Government',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'local_government_office',
    priority: 11,
    addDistrictSuffix: true,
  },
  {
    keywords: ['ASSISTANT DIRECTOR LOCAL GOVERNMENT', 'AD LOCAL GOVERNMENT', 'A.D LOCAL GOVERNMENT', 'AD LG', 'A.D LG', 'ADLG', 'A.D. LOCAL GOVERNMENT'],
    designation: 'Assistant Director Local Government',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'local_government_office',
    priority: 12,
    addDistrictSuffix: true,
  },
  {
    keywords: ['TEHSIL MUNICIPAL OFFICER', 'TMO'],
    designation: 'Tehsil Municipal Officer',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'tehsil_municipal',
    priority: 13,
    addTehsilSuffix: true,
  },
  {
    keywords: ['TEHSIL MUNICIPAL ADMINISTRATION', 'TMA'],
    designation: 'Tehsil Municipal Officer',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'tehsil_municipal',
    priority: 14,
    addTehsilSuffix: true,
  },
  {
    keywords: ['VILLAGE SECRETARY', 'SECRETARY VILLAGE COUNCIL', 'VC SECRETARY', 'V/S'],
    designation: 'Assistant Director Local Government',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'village_council',
    priority: 15,
    addDistrictSuffix: true,
  },
  {
    keywords: ['VILLAGE COUNCIL', 'VC '],
    designation: 'Assistant Director Local Government',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'village_council',
    priority: 16,
    addDistrictSuffix: true,
  },
  {
    keywords: ['NEIGHBORHOOD COUNCIL', 'NC ', 'MOHALLA COUNCIL'],
    designation: 'Assistant Director Local Government',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'neighborhood_council',
    priority: 17,
    addDistrictSuffix: true,
  },
  {
    keywords: ['MUNICIPAL CORPORATION', 'CITY CORPORATION'],
    designation: 'Administrator Municipal Corporation',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'local_government_office',
    priority: 18,
  },
  {
    keywords: ['MUNICIPAL COMMITTEE', 'MC '],
    designation: 'Administrator Municipal Committee',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'local_government_office',
    priority: 19,
  },
  {
    keywords: ['LOCAL GOVERNMENT', 'LG&RDD', 'LGERDD', 'LG ', 'LOCAL GOVT'],
    designation: 'Assistant Director Local Government',
    department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
    departmentShort: 'Local Government, Elections & Rural Development Department',
    departmentType: 'local_government',
    organizationType: 'local_government_office',
    priority: 20,
    addDistrictSuffix: true,
  },

  // -------------------------------------------------------------------------
  // EDUCATION DEPARTMENT - Schools (Priority: 100-199)
  // -------------------------------------------------------------------------
  {
    keywords: ['GHSS', 'GGHSS', 'HIGHER SECONDARY SCHOOL', 'HSS'],
    designation: 'Principal',
    designationFemale: 'Principal',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'higher_secondary_school',
    priority: 100,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['GHS', 'GGHS', 'HIGH SCHOOL'],
    designation: 'Headmaster',
    designationFemale: 'Headmistress',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'high_school',
    priority: 101,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['GMS', 'GGMS', 'MIDDLE SCHOOL'],
    designation: 'Headmaster',
    designationFemale: 'Headmistress',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'middle_school',
    priority: 102,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['GPS', 'GGPS', 'GMPS', 'GGMPS', 'GGMKS', 'GMKS', 'GGCMS', 'GCMS', 'PRIMARY SCHOOL'],
    designation: 'Sub Divisional Education Officer',
    designationFemale: 'Sub Divisional Education Officer',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'primary_school',
    priority: 103,
  },
  
  // -------------------------------------------------------------------------
  // EDUCATION DEPARTMENT - Offices (Priority: 90-99)
  // -------------------------------------------------------------------------
  {
    keywords: ['DIRECTOR GENERAL', 'DG EDUCATION', 'DIRECTORATE GENERAL'],
    designation: 'Director General',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'directorate',
    priority: 90,
  },
  {
    keywords: ['DEPUTY DIRECTOR EDUCATION', 'DD EDUCATION', 'DDE'],
    designation: 'Deputy Director Education',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'education_office',
    priority: 91,
    addDistrictSuffix: true,
  },
  {
    keywords: ['DISTRICT EDUCATION OFFICER', 'DEO '],
    designation: 'District Education Officer',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'education_office',
    priority: 92,
    addDistrictSuffix: true,
  },
  {
    keywords: ['SUB DIVISIONAL EDUCATION OFFICER', 'SDEO'],
    designation: 'Sub Divisional Education Officer',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'education_office',
    priority: 93,
    addTehsilSuffix: true,
  },
  
  // -------------------------------------------------------------------------
  // HEALTH DEPARTMENT (Priority: 80-89)
  // -------------------------------------------------------------------------
  {
    keywords: ['TEACHING HOSPITAL', 'MEDICAL COLLEGE', 'MTI'],
    designation: 'Hospital Director',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'hospital',
    priority: 80,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['DISTRICT HEADQUARTER HOSPITAL', 'DHQ HOSPITAL', 'DHQ'],
    designation: 'Medical Superintendent',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'hospital',
    priority: 81,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['TEHSIL HEADQUARTER HOSPITAL', 'THQ HOSPITAL', 'THQ'],
    designation: 'Medical Officer In-charge',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'health_facility',
    priority: 82,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['RURAL HEALTH CENTER', 'RHC'],
    designation: 'Medical Officer',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'health_facility',
    priority: 83,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['BASIC HEALTH UNIT', 'BHU'],
    designation: 'Medical Officer',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'health_facility',
    priority: 84,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['CIVIL DISPENSARY', 'DISPENSARY'],
    designation: 'Dispenser',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'health_facility',
    priority: 85,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['DISTRICT HEALTH OFFICER', 'DHO'],
    designation: 'District Health Officer',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'health_facility',
    priority: 86,
    addDistrictSuffix: true,
  },
  {
    keywords: ['HOSPITAL', 'MEDICAL', 'HEALTH', 'CLINIC'],
    designation: 'Medical Officer',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'health_facility',
    priority: 89,
    includeInstitutionInHeader: true,
  },
  
  // -------------------------------------------------------------------------
  // REVENUE DEPARTMENT (Priority: 70-79)
  // -------------------------------------------------------------------------
  {
    keywords: ['DEPUTY COMMISSIONER', 'DC OFFICE'],
    designation: 'Deputy Commissioner',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 70,
    addDistrictSuffix: true,
  },
  {
    keywords: ['ASSISTANT COMMISSIONER', 'AC OFFICE', 'AC REVENUE'],
    designation: 'Assistant Commissioner',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 71,
    addTehsilSuffix: true,
  },
  {
    keywords: ['TEHSILDAR', 'TEHSIL OFFICE'],
    designation: 'Tehsildar',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 72,
    addTehsilSuffix: true,
  },
  {
    keywords: ['NAIB TEHSILDAR'],
    designation: 'Naib Tehsildar',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 73,
    addTehsilSuffix: true,
  },
  {
    keywords: ['REVENUE', 'PATWARI', 'QANUNGO'],
    designation: 'Revenue Officer',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 79,
  },
  
  // -------------------------------------------------------------------------
  // POLICE DEPARTMENT (Priority: 60-69)
  // -------------------------------------------------------------------------
  {
    keywords: ['REGIONAL POLICE OFFICER', 'RPO'],
    designation: 'Regional Police Officer',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 60,
  },
  {
    keywords: ['DISTRICT POLICE OFFICER', 'DPO'],
    designation: 'District Police Officer',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 61,
    addDistrictSuffix: true,
  },
  {
    keywords: ['SUPERINTENDENT OF POLICE', 'SP OFFICE', 'SSP', 'ASP'],
    designation: 'Superintendent of Police',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 62,
  },
  {
    keywords: ['DEPUTY SUPERINTENDENT', 'DSP'],
    designation: 'Deputy Superintendent of Police',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 63,
  },
  {
    keywords: ['STATION HOUSE OFFICER', 'SHO', 'POLICE STATION', 'THANA'],
    designation: 'Station House Officer',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_station',
    priority: 64,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['POLICE'],
    designation: 'Police Officer',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 69,
  },
  
  // -------------------------------------------------------------------------
  // AGRICULTURE DEPARTMENT (Priority: 50-59)
  // -------------------------------------------------------------------------
  {
    keywords: ['DIRECTOR AGRICULTURE', 'DIRECTORATE OF AGRICULTURE'],
    designation: 'Director Agriculture',
    department: 'AGRICULTURE DEPARTMENT',
    departmentShort: 'Agriculture Department',
    departmentType: 'agriculture',
    organizationType: 'directorate',
    priority: 50,
  },
  {
    keywords: ['DISTRICT AGRICULTURE OFFICER', 'DAO AGRICULTURE'],
    designation: 'District Agriculture Officer',
    department: 'AGRICULTURE DEPARTMENT',
    departmentShort: 'Agriculture Department',
    departmentType: 'agriculture',
    organizationType: 'agriculture_office',
    priority: 51,
    addDistrictSuffix: true,
  },
  {
    keywords: ['AGRICULTURE EXTENSION', 'AEO', 'AGRICULTURE OFFICER'],
    designation: 'Agriculture Officer',
    department: 'AGRICULTURE DEPARTMENT',
    departmentShort: 'Agriculture Department',
    departmentType: 'agriculture',
    organizationType: 'agriculture_office',
    priority: 52,
  },
  {
    keywords: ['VETERINARY', 'LIVESTOCK', 'ANIMAL HUSBANDRY'],
    designation: 'Veterinary Officer',
    department: 'LIVESTOCK & DAIRY DEVELOPMENT DEPARTMENT',
    departmentShort: 'Livestock & Dairy Development Department',
    departmentType: 'agriculture',
    organizationType: 'agriculture_office',
    priority: 53,
  },
  {
    keywords: ['AGRICULTURE', 'FARM'],
    designation: 'Agriculture Officer',
    department: 'AGRICULTURE DEPARTMENT',
    departmentShort: 'Agriculture Department',
    departmentType: 'agriculture',
    organizationType: 'agriculture_office',
    priority: 59,
  },
  
  // -------------------------------------------------------------------------
  // PUBLIC WORKS / C&W DEPARTMENT (Priority: 40-49)
  // -------------------------------------------------------------------------
  {
    keywords: ['CHIEF ENGINEER', 'CE C&W', 'CE PWD'],
    designation: 'Chief Engineer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'directorate',
    priority: 40,
  },
  {
    keywords: ['SUPERINTENDING ENGINEER', 'SE C&W', 'SE PWD'],
    designation: 'Superintending Engineer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'public_works_office',
    priority: 41,
  },
  {
    keywords: ['EXECUTIVE ENGINEER', 'XEN', 'EE C&W', 'EE PWD'],
    designation: 'Executive Engineer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'public_works_office',
    priority: 42,
    addDistrictSuffix: true,
  },
  {
    keywords: ['SUB DIVISIONAL OFFICER', 'SDO C&W', 'SDO PWD'],
    designation: 'Sub Divisional Officer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'public_works_office',
    priority: 43,
  },
  {
    keywords: ['PWD', 'PUBLIC WORKS', 'C&W', 'COMMUNICATION & WORKS', 'BUILDINGS'],
    designation: 'Engineer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'public_works_office',
    priority: 49,
  },
  
  // -------------------------------------------------------------------------
  // IRRIGATION DEPARTMENT (Priority: 35-39)
  // -------------------------------------------------------------------------
  {
    keywords: ['CHIEF ENGINEER IRRIGATION'],
    designation: 'Chief Engineer',
    department: 'IRRIGATION DEPARTMENT',
    departmentShort: 'Irrigation Department',
    departmentType: 'irrigation',
    organizationType: 'directorate',
    priority: 35,
  },
  {
    keywords: ['EXECUTIVE ENGINEER IRRIGATION', 'XEN IRRIGATION'],
    designation: 'Executive Engineer',
    department: 'IRRIGATION DEPARTMENT',
    departmentShort: 'Irrigation Department',
    departmentType: 'irrigation',
    organizationType: 'irrigation_office',
    priority: 36,
  },
  {
    keywords: ['IRRIGATION', 'CANAL', 'WATER MANAGEMENT', 'FLOOD'],
    designation: 'Irrigation Officer',
    department: 'IRRIGATION DEPARTMENT',
    departmentShort: 'Irrigation Department',
    departmentType: 'irrigation',
    organizationType: 'irrigation_office',
    priority: 39,
  },
  
  // -------------------------------------------------------------------------
  // FOREST DEPARTMENT (Priority: 30-34)
  // -------------------------------------------------------------------------
  {
    keywords: ['CHIEF CONSERVATOR', 'CCF'],
    designation: 'Chief Conservator of Forests',
    department: 'FOREST DEPARTMENT',
    departmentShort: 'Forest Department',
    departmentType: 'forest',
    organizationType: 'directorate',
    priority: 30,
  },
  {
    keywords: ['CONSERVATOR OF FOREST', 'CF'],
    designation: 'Conservator of Forests',
    department: 'FOREST DEPARTMENT',
    departmentShort: 'Forest Department',
    departmentType: 'forest',
    organizationType: 'forest_office',
    priority: 31,
  },
  {
    keywords: ['DIVISIONAL FOREST OFFICER', 'DFO'],
    designation: 'Divisional Forest Officer',
    department: 'FOREST DEPARTMENT',
    departmentShort: 'Forest Department',
    departmentType: 'forest',
    organizationType: 'forest_office',
    priority: 32,
  },
  {
    keywords: ['FOREST', 'WILDLIFE', 'RANGE OFFICER'],
    designation: 'Forest Officer',
    department: 'FOREST DEPARTMENT',
    departmentShort: 'Forest Department',
    departmentType: 'forest',
    organizationType: 'forest_office',
    priority: 34,
  },
  
  // -------------------------------------------------------------------------
  // FINANCE DEPARTMENT (Priority: 25-29)
  // -------------------------------------------------------------------------
  {
    keywords: ['ACCOUNTANT GENERAL', 'AG OFFICE'],
    designation: 'Accountant General',
    department: 'FINANCE DEPARTMENT',
    departmentShort: 'Finance Department',
    departmentType: 'finance',
    organizationType: 'directorate',
    priority: 25,
  },
  {
    keywords: ['DISTRICT ACCOUNTS OFFICER', 'DAO'],
    designation: 'District Accounts Officer',
    department: 'FINANCE DEPARTMENT',
    departmentShort: 'Finance Department',
    departmentType: 'finance',
    organizationType: 'finance_office',
    priority: 26,
    addDistrictSuffix: true,
  },
  {
    keywords: ['TREASURY OFFICER', 'DTO', 'DISTRICT TREASURY'],
    designation: 'District Treasury Officer',
    department: 'FINANCE DEPARTMENT',
    departmentShort: 'Finance Department',
    departmentType: 'finance',
    organizationType: 'finance_office',
    priority: 27,
    addDistrictSuffix: true,
  },
  {
    keywords: ['TREASURY', 'ACCOUNTS', 'FINANCE'],
    designation: 'Accounts Officer',
    department: 'FINANCE DEPARTMENT',
    departmentShort: 'Finance Department',
    departmentType: 'finance',
    organizationType: 'finance_office',
    priority: 29,
  },
  
  // -------------------------------------------------------------------------
  // SOCIAL WELFARE DEPARTMENT (Priority: 21-24)
  // -------------------------------------------------------------------------
  {
    keywords: ['DIRECTOR SOCIAL WELFARE'],
    designation: 'Director Social Welfare',
    department: 'SOCIAL WELFARE DEPARTMENT',
    departmentShort: 'Social Welfare Department',
    departmentType: 'social_welfare',
    organizationType: 'directorate',
    priority: 21,
  },
  {
    keywords: ['DISTRICT SOCIAL WELFARE', 'DSW'],
    designation: 'District Social Welfare Officer',
    department: 'SOCIAL WELFARE DEPARTMENT',
    departmentShort: 'Social Welfare Department',
    departmentType: 'social_welfare',
    organizationType: 'social_welfare_office',
    priority: 22,
    addDistrictSuffix: true,
  },
  {
    keywords: ['SOCIAL WELFARE', 'ZAKAT', 'BAITUL MAL', 'SPECIAL EDUCATION'],
    designation: 'Social Welfare Officer',
    department: 'SOCIAL WELFARE DEPARTMENT',
    departmentShort: 'Social Welfare Department',
    departmentType: 'social_welfare',
    organizationType: 'social_welfare_office',
    priority: 24,
  },
];

/**
 * Keywords that indicate a female/girls institution
 */
export const FEMALE_KEYWORDS = [
  'GIRLS', 'FEMALE', 'WOMEN', 'GGHS', 'GGPS', 'GGMS', 'GGHSS', 
  'GGMPS', 'GGMKS', 'GGCMS', '(F)', '(FEMALE)', '(GIRLS)',
];

/**
 * Common Local Government designations
 */
export const LOCAL_GOVT_DESIGNATIONS = [
  'VILLAGE SECRETARY', 'V/S', 'VS', 'SECRETARY VC', 'VC SECRETARY',
  'NAIB QASID', 'CHOWKIDAR', 'SWEEPER', 'MALI', 'DRIVER', 'PEON', 'WATCHMAN',
];

// ============================================================================
// CORE DETECTION FUNCTIONS
// ============================================================================

function normalizeName(name: string): string {
  return (name || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

export function isGirlsInstitution(name: string): boolean {
  const normalized = normalizeName(name);
  return FEMALE_KEYWORDS.some(keyword => normalized.includes(keyword));
}

export function isLocalGovtDesignation(designation: string): boolean {
  const normalized = normalizeName(designation);
  return LOCAL_GOVT_DESIGNATIONS.some(d => normalized.includes(d));
}

function findMatchingConfig(name: string, designation?: string): KeywordConfig | null {
  const normalized = normalizeName(name);
  const normalizedDesig = normalizeName(designation || '');
  
  const sorted = [...INSTITUTION_CONFIG].sort((a, b) => a.priority - b.priority);
  
  for (const config of sorted) {
    const hasMatch = config.keywords.some(keyword => 
      normalized.includes(keyword.toUpperCase())
    );
    if (hasMatch) {
      return config;
    }
  }
  
  // Fallback: check if designation indicates Local Government
  if (isLocalGovtDesignation(normalizedDesig)) {
    return {
      keywords: ['LOCAL GOVERNMENT'],
      designation: 'Assistant Director Local Government',
      department: 'LOCAL GOVERNMENT, ELECTIONS & RURAL DEVELOPMENT DEPARTMENT',
      departmentShort: 'Local Government, Elections & Rural Development Department',
      departmentType: 'local_government',
      organizationType: 'local_government_office',
      priority: 20,
      addDistrictSuffix: true,
    };
  }
  
  return null;
}

// ============================================================================
// MAIN API FUNCTION
// ============================================================================

/**
 * Gets complete department information including letterhead
 */
export function getDepartmentInfo(
  schoolFullName: string,
  officeName?: string,
  tehsil?: string,
  district?: string,
  designation?: string
): DepartmentInfo {
  const institutionName = (schoolFullName || officeName || '').trim();
  const normalized = normalizeName(institutionName);
  const isGirls = isGirlsInstitution(institutionName);
  const config = findMatchingConfig(institutionName, designation);
  const districtClean = (district || '').trim();
  const tehsilClean = (tehsil || '').trim();
  
  // Build the designation with suffixes
  let finalDesignation: string;
  let headerDesignation: string; // For letterhead line 1
  
  if (config) {
    finalDesignation = isGirls && config.designationFemale 
      ? config.designationFemale 
      : config.designation;
    headerDesignation = finalDesignation;
    
    // Add district suffix
    if (config.addDistrictSuffix && districtClean) {
      finalDesignation = `${finalDesignation} District ${districtClean}`;
      headerDesignation = `${headerDesignation} ${districtClean.toUpperCase()}`;
    }
    
    // Add tehsil suffix
    if (config.addTehsilSuffix && tehsilClean) {
      finalDesignation = `${finalDesignation} ${tehsilClean}`;
      headerDesignation = `${headerDesignation} ${tehsilClean.toUpperCase()}`;
    }
  } else {
    finalDesignation = 'Head of Office';
    headerDesignation = 'Head of Office';
    if (districtClean) {
      headerDesignation = `${headerDesignation} ${districtClean.toUpperCase()}`;
    }
  }
  
  // Special handling for primary schools
  if (config?.organizationType === 'primary_school' && tehsilClean) {
    const genderSuffix = isGirls ? '(Female)' : '(Male)';
    finalDesignation = `Sub Divisional Education Officer ${genderSuffix} ${tehsilClean}`;
    headerDesignation = `Sub Divisional Education Officer ${genderSuffix} ${tehsilClean.toUpperCase()}`;
  }
  
  // Build header title - Line 1 of letterhead
  let headerLine1: string;
  if (config?.includeInstitutionInHeader && institutionName) {
    // For schools/hospitals, include the institution name
    headerLine1 = `OFFICE OF THE ${headerDesignation.toUpperCase()}`;
    if (!headerLine1.includes(institutionName.toUpperCase())) {
      // Add school/hospital name if not already in the designation
      const instUpper = institutionName.toUpperCase();
      // Check if it's a school type - add the full school name
      if (config.organizationType.includes('school')) {
        headerLine1 = `OFFICE OF THE ${(isGirls && config.designationFemale ? config.designationFemale : config.designation).toUpperCase()}`;
        headerLine1 += `\n${instUpper}`;
      }
    }
  } else {
    headerLine1 = `OFFICE OF THE ${headerDesignation.toUpperCase()}`;
  }
  
  // Line 2: Department name (dynamic based on department type)
  const departmentShort = config?.departmentShort || 'Government Office';
  const headerLine2 = departmentShort;
  
  // Line 3: Government of KPK
  const headerLine3 = 'Govt. of Khyber Pakhtunkhwa';
  
  // Full letterhead
  const letterhead: LetterheadInfo = {
    line1: headerLine1,
    line2: headerLine2,
    line3: headerLine3,
    full: `${headerLine1}\n${headerLine2}\n${headerLine3}`,
  };
  
  // Header title (single line version)
  const headerTitle = headerLine1.split('\n')[0];
  
  // Build signature titles
  const signatureTitleShort = finalDesignation;
  let signatureTitle = finalDesignation;
  
// Add institution name to signature only for middle/high/higher_secondary schools
  // Primary schools (GPS) use SDEO — no school name needed in signature
  const addInstitutionToSignature =
    config?.organizationType === 'middle_school' ||
    config?.organizationType === 'high_school' ||
    config?.organizationType === 'higher_secondary_school' ||
    config?.organizationType === 'health_facility' ||
    config?.organizationType === 'hospital';

  if (addInstitutionToSignature && institutionName) {
    signatureTitle = `${finalDesignation}\n${institutionName}`;
  }
  
  // Determine authority title
  let authorityTitle = finalDesignation;
  
  if (config?.organizationType === 'primary_school') {
    const genderSuffix = isGirls ? '(Female)' : '(Male)';
    authorityTitle = tehsilClean 
      ? `Sub Divisional Education Officer ${genderSuffix} ${tehsilClean}`
      : `Sub Divisional Education Officer ${genderSuffix}`;
  } else if (config?.organizationType === 'village_council' || 
             config?.organizationType === 'neighborhood_council') {
    authorityTitle = districtClean 
      ? `Assistant Director Local Government District ${districtClean}`
      : 'Assistant Director Local Government';
  }
  
  return {
    headerTitle,
    signatureTitle,
    signatureTitleShort,
    department: config?.department || 'GOVERNMENT OF KHYBER PAKHTUNKHWA',
    departmentShort: config?.departmentShort || 'Government Office',
    departmentType: config?.departmentType || 'unknown',
    organizationType: config?.organizationType || 'other',
    isGirlsInstitution: isGirls,
    gender: isGirls ? 'Female' : 'Male',
    salutation: isGirls ? 'Madam' : 'Sir',
    authorityTitle,
    institutionName,
    district: districtClean,
    letterhead,
  };
}

/**
 * Gets just the head designation
 */
export function getHeadDesignation(name: string, district?: string): string {
  const info = getDepartmentInfo(name, undefined, undefined, district);
  return info.signatureTitleShort;
}

/**
 * Gets the department name
 */
export function getDepartmentName(name: string): string {
  const info = getDepartmentInfo(name);
  return info.department;
}

/**
 * Detects gender from school/institution name
 */
export function detectGender(name: string): 'M' | 'F' {
  return isGirlsInstitution(name) ? 'F' : 'M';
}

/**
 * Gets salutation based on institution name
 */
export function getSalutation(name: string): 'Sir' | 'Madam' {
  return isGirlsInstitution(name) ? 'Madam' : 'Sir';
}

export { INSTITUTION_CONFIG as INSTITUTION_KEYWORDS };
