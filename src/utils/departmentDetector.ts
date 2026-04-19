/**
 * Department Detection System
 *
 * A comprehensive, extensible system for detecting department types,
 * signature titles, authority titles, and letterhead information from
 * institution / office names.
 *
 * @module departmentDetector
 * @version 3.4.0 - Fixed education forwarding authority chain (HM/SDEO → DEO, DEO → DDE)
 * @author KPK Team
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
  | 'technical_institute'
  | 'madrassa'
  | 'education_office'
  | 'hospital'
  | 'health_facility'
  | 'dispensary'
  | 'revenue_office'
  | 'police_station'
  | 'police_office'
  | 'prison'
  | 'agriculture_office'
  | 'livestock_office'
  | 'fisheries_office'
  | 'irrigation_office'
  | 'public_works_office'
  | 'forest_office'
  | 'wildlife_office'
  | 'mine_office'
  | 'finance_office'
  | 'treasury_office'
  | 'audit_office'
  | 'social_welfare_office'
  | 'population_welfare_office'
  | 'local_government_office'
  | 'village_council'
  | 'neighborhood_council'
  | 'tehsil_municipal'
  | 'sports_office'
  | 'tourism_office'
  | 'culture_office'
  | 'labour_office'
  | 'industry_office'
  | 'energy_office'
  | 'environment_office'
  | 'transport_office'
  | 'information_office'
  | 'planning_office'
  | 'science_technology_office'
  | 'anti_corruption_office'
  | 'civil_defence_office'
  | 'disaster_management_office'
  | 'court'
  | 'prosecution_office'
  | 'jail'
  | 'directorate'
  | 'general_office'
  | 'other';

export type DepartmentType =
  | 'education'
  | 'higher_education'
  | 'technical_education'
  | 'health'
  | 'revenue'
  | 'police'
  | 'home'
  | 'agriculture'
  | 'livestock'
  | 'fisheries'
  | 'irrigation'
  | 'public_works'
  | 'forest'
  | 'wildlife'
  | 'mines'
  | 'finance'
  | 'social_welfare'
  | 'population_welfare'
  | 'local_government'
  | 'sports'
  | 'tourism'
  | 'culture'
  | 'labour'
  | 'industries'
  | 'energy'
  | 'environment'
  | 'transport'
  | 'information'
  | 'planning'
  | 'science_technology'
  | 'anti_corruption'
  | 'civil_defence'
  | 'disaster_management'
  | 'law_justice'
  | 'prosecution'
  | 'prison'
  | 'unknown';

export interface LetterheadInfo {
  line1: string;
  line2: string;
  line3: string;
  full: string;
}

export interface DepartmentInfo {
  headerTitle: string;
  signatureTitle: string;
  signatureTitleShort: string;
  department: string;
  departmentShort: string;
  departmentType: DepartmentType;
  organizationType: OrganizationType;
  isGirlsInstitution: boolean;
  gender: 'Male' | 'Female';
  salutation: 'Sir' | 'Madam';
  authorityTitle: string;
  institutionName: string;
  district: string;
  tehsil: string;
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
  addDistrictSuffix?: boolean;
  addTehsilSuffix?: boolean;
  includeInstitutionInHeader?: boolean;
  headerPrefix?: string;
  customAuthorityTitle?: string;
  substringMatch?: boolean;
  detectGenderFromOffice?: boolean;
  includeGenderSuffix?: boolean;
}

// ============================================================================
// GENDER DETECTION KEYWORDS
// ============================================================================

/**
 * Keywords that indicate a FEMALE institution or office.
 * Checked against institution name and (for education offices) office name.
 */
export const FEMALE_KEYWORDS: string[] = [
  '(F)',
  '(FEMALE)',
  '(GIRLS)',
  ' F ',
  ' FEMALE',
  ' WOMEN',
  ' GIRLS',
  'GGHS',
  'GGPS',
  'GGMS',
  'GGHSS',
  'GGMPS',
  'GGMKS',
  'GGCMS',
  'GIRLS',
  'FEMALE',
  'WOMEN',
  'WOMAN',
  'LADIES',
  'LADY',
  'FOR GIRLS',
  'GIRLS COLLEGE',
  'WOMEN COLLEGE',
  'GIRLS HIGH SCHOOL',
  'GIRLS MIDDLE SCHOOL',
  'GIRLS PRIMARY SCHOOL',
];

/**
 * Keywords that explicitly indicate a MALE institution or office.
 */
export const MALE_KEYWORDS: string[] = [
  '(M)',
  '(MALE)',
  '(BOYS)',
  ' M ',
  ' MALE',
  ' BOYS',
  'FOR BOYS',
];

// ============================================================================
// LOCAL GOVERNMENT LOW-GRADE DESIGNATIONS
// ============================================================================

export const LOCAL_GOVT_DESIGNATIONS: string[] = [
  'VILLAGE SECRETARY',
  'V/S',
  'VS',
  'SECRETARY VC',
  'VC SECRETARY',
  'NAIB QASID',
  'CHOWKIDAR',
  'SWEEPER',
  'MALI',
  'DRIVER',
  'PEON',
  'WATCHMAN',
  'QASID',
  'BAILDAR',
  'DAFTRI',
  'FRASH',
];

// ============================================================================
// MASTER CONFIGURATION TABLE
// ============================================================================

export const INSTITUTION_CONFIG: KeywordConfig[] = [

  // ==========================================================================
  // LOCAL GOVERNMENT (10–20)
  // ==========================================================================
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
    keywords: [
      'ASSISTANT DIRECTOR LOCAL GOVERNMENT',
      'AD LOCAL GOVERNMENT',
      'A.D LOCAL GOVERNMENT',
      'AD LG',
      'A.D LG',
      'ADLG',
      'A.D. LOCAL GOVERNMENT',
    ],
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

  // ==========================================================================
  // SOCIAL WELFARE (21–24)
  // ==========================================================================
  {
    keywords: ['DIRECTOR SOCIAL WELFARE', 'DIRECTORATE SOCIAL WELFARE'],
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
    keywords: ['SPECIAL EDUCATION', 'DEAF SCHOOL', 'BLIND SCHOOL'],
    designation: 'Principal',
    department: 'SOCIAL WELFARE DEPARTMENT',
    departmentShort: 'Social Welfare Department',
    departmentType: 'social_welfare',
    organizationType: 'social_welfare_office',
    priority: 23,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['SOCIAL WELFARE', 'ZAKAT', 'BAITUL MAL', 'USHR'],
    designation: 'Social Welfare Officer',
    department: 'SOCIAL WELFARE DEPARTMENT',
    departmentShort: 'Social Welfare Department',
    departmentType: 'social_welfare',
    organizationType: 'social_welfare_office',
    priority: 24,
  },

  // ==========================================================================
  // FINANCE / ACCOUNTS / AUDIT (25–29)
  // ==========================================================================
  {
    keywords: ['ACCOUNTANT GENERAL', 'AG OFFICE', 'AG KPK', 'ACCOUNTANT GENERAL KPK'],
    designation: 'Accountant General',
    department: 'FINANCE DEPARTMENT',
    departmentShort: 'Finance Department',
    departmentType: 'finance',
    organizationType: 'audit_office',
    priority: 25,
    headerPrefix: 'OFFICE OF THE',
  },
  {
    keywords: ['AUDITOR GENERAL', 'AUDIT OFFICE', 'PROVINCIAL AUDIT'],
    designation: 'Director Audit',
    department: 'FINANCE DEPARTMENT',
    departmentShort: 'Finance Department',
    departmentType: 'finance',
    organizationType: 'audit_office',
    priority: 25,
  },
  {
    keywords: ['DISTRICT ACCOUNTS OFFICER', 'DAO '],
    designation: 'District Accounts Officer',
    department: 'FINANCE DEPARTMENT',
    departmentShort: 'Finance Department',
    departmentType: 'finance',
    organizationType: 'finance_office',
    priority: 26,
    addDistrictSuffix: true,
  },
  {
    keywords: ['TREASURY OFFICER', 'DTO', 'DISTRICT TREASURY', 'TREASURY OFFICE'],
    designation: 'District Treasury Officer',
    department: 'FINANCE DEPARTMENT',
    departmentShort: 'Finance Department',
    departmentType: 'finance',
    organizationType: 'treasury_office',
    priority: 27,
    addDistrictSuffix: true,
  },
  {
    keywords: ['EXCISE', 'TAXATION', 'EXCISE AND TAXATION'],
    designation: 'Excise & Taxation Officer',
    department: 'EXCISE & TAXATION DEPARTMENT',
    departmentShort: 'Excise & Taxation Department',
    departmentType: 'finance',
    organizationType: 'finance_office',
    priority: 28,
    addDistrictSuffix: true,
  },
  {
    keywords: ['TREASURY', 'ACCOUNTS', 'FINANCE OFFICE'],
    designation: 'Accounts Officer',
    department: 'FINANCE DEPARTMENT',
    departmentShort: 'Finance Department',
    departmentType: 'finance',
    organizationType: 'finance_office',
    priority: 29,
  },

  // ==========================================================================
  // POPULATION WELFARE (30)
  // ==========================================================================
  {
    keywords: [
      'POPULATION WELFARE',
      'FAMILY PLANNING',
      'REPRODUCTIVE HEALTH',
      'MCH CENTER',
      'FAMILY WELFARE CENTER',
    ],
    designation: 'Population Welfare Officer',
    department: 'POPULATION WELFARE DEPARTMENT',
    departmentShort: 'Population Welfare Department',
    departmentType: 'population_welfare',
    organizationType: 'population_welfare_office',
    priority: 30,
    addDistrictSuffix: true,
  },

  // ==========================================================================
  // FOREST DEPARTMENT (31–35)
  // ==========================================================================
  {
    keywords: ['CHIEF CONSERVATOR', 'CCF'],
    designation: 'Chief Conservator of Forests',
    department: 'FOREST DEPARTMENT',
    departmentShort: 'Forest Department',
    departmentType: 'forest',
    organizationType: 'directorate',
    priority: 31,
  },
  {
    keywords: ['CONSERVATOR OF FOREST', 'CF FOREST'],
    designation: 'Conservator of Forests',
    department: 'FOREST DEPARTMENT',
    departmentShort: 'Forest Department',
    departmentType: 'forest',
    organizationType: 'forest_office',
    priority: 32,
  },
  {
    keywords: ['DIVISIONAL FOREST OFFICER', 'DFO'],
    designation: 'Divisional Forest Officer',
    department: 'FOREST DEPARTMENT',
    departmentShort: 'Forest Department',
    departmentType: 'forest',
    organizationType: 'forest_office',
    priority: 33,
  },
  {
    keywords: ['WILDLIFE WARDEN', 'WILDLIFE OFFICER', 'WILDLIFE SANCTUARY', 'NATIONAL PARK'],
    designation: 'Wildlife Warden',
    department: 'WILDLIFE DEPARTMENT',
    departmentShort: 'Wildlife Department',
    departmentType: 'wildlife',
    organizationType: 'wildlife_office',
    priority: 34,
    addDistrictSuffix: true,
  },
  {
    keywords: ['FOREST', 'RANGE OFFICER', 'RANGE FOREST'],
    designation: 'Forest Officer',
    department: 'FOREST DEPARTMENT',
    departmentShort: 'Forest Department',
    departmentType: 'forest',
    organizationType: 'forest_office',
    priority: 35,
  },

  // ==========================================================================
  // IRRIGATION (36–39)
  // ==========================================================================
  {
    keywords: ['CHIEF ENGINEER IRRIGATION'],
    designation: 'Chief Engineer',
    department: 'IRRIGATION DEPARTMENT',
    departmentShort: 'Irrigation Department',
    departmentType: 'irrigation',
    organizationType: 'directorate',
    priority: 36,
  },
  {
    keywords: ['SUPERINTENDING ENGINEER IRRIGATION', 'SE IRRIGATION'],
    designation: 'Superintending Engineer',
    department: 'IRRIGATION DEPARTMENT',
    departmentShort: 'Irrigation Department',
    departmentType: 'irrigation',
    organizationType: 'irrigation_office',
    priority: 37,
  },
  {
    keywords: ['EXECUTIVE ENGINEER IRRIGATION', 'XEN IRRIGATION', 'EE IRRIGATION'],
    designation: 'Executive Engineer',
    department: 'IRRIGATION DEPARTMENT',
    departmentShort: 'Irrigation Department',
    departmentType: 'irrigation',
    organizationType: 'irrigation_office',
    priority: 38,
  },
  {
    keywords: ['SDO IRRIGATION', 'SUB DIVISIONAL OFFICER IRRIGATION', 'CANAL SUB DIVISION'],
    designation: 'Sub Divisional Officer',
    department: 'IRRIGATION DEPARTMENT',
    departmentShort: 'Irrigation Department',
    departmentType: 'irrigation',
    organizationType: 'irrigation_office',
    priority: 39,
  },
  {
    keywords: ['IRRIGATION', 'CANAL', 'WATER MANAGEMENT', 'FLOOD MANAGEMENT'],
    designation: 'Irrigation Officer',
    department: 'IRRIGATION DEPARTMENT',
    departmentShort: 'Irrigation Department',
    departmentType: 'irrigation',
    organizationType: 'irrigation_office',
    priority: 39,
  },

  // ==========================================================================
  // PUBLIC WORKS / C&W (40–49)
  // ==========================================================================
  {
    keywords: ['CHIEF ENGINEER C&W', 'CHIEF ENGINEER PWD', 'CE C&W', 'CE PWD'],
    designation: 'Chief Engineer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'directorate',
    priority: 40,
  },
  {
    keywords: ['SUPERINTENDING ENGINEER C&W', 'SE C&W', 'SE PWD'],
    designation: 'Superintending Engineer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'public_works_office',
    priority: 41,
  },
  {
    keywords: ['EXECUTIVE ENGINEER C&W', 'EXECUTIVE ENGINEER PWD', 'XEN', 'EE C&W', 'EE PWD'],
    designation: 'Executive Engineer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'public_works_office',
    priority: 42,
    addDistrictSuffix: true,
  },
  {
    keywords: ['SDO C&W', 'SDO PWD', 'SUB DIVISIONAL OFFICER C&W', 'SUB DIVISIONAL OFFICER PWD'],
    designation: 'Sub Divisional Officer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'public_works_office',
    priority: 43,
  },
  {
    keywords: ['ROADS DIVISION', 'ROAD DIVISION', 'HIGHWAY', 'NATIONAL HIGHWAY', 'NHA'],
    designation: 'Executive Engineer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'public_works_office',
    priority: 44,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['PWD', 'PUBLIC WORKS', 'C&W', 'COMMUNICATION & WORKS', 'BUILDINGS DIVISION'],
    designation: 'Engineer',
    department: 'COMMUNICATION & WORKS DEPARTMENT',
    departmentShort: 'Communication & Works Department',
    departmentType: 'public_works',
    organizationType: 'public_works_office',
    priority: 49,
  },

  // ==========================================================================
  // AGRICULTURE (50–59)
  // ==========================================================================
  {
    keywords: ['DIRECTOR AGRICULTURE', 'DIRECTORATE OF AGRICULTURE', 'DIRECTOR GENERAL AGRICULTURE'],
    designation: 'Director Agriculture',
    department: 'AGRICULTURE DEPARTMENT',
    departmentShort: 'Agriculture Department',
    departmentType: 'agriculture',
    organizationType: 'directorate',
    priority: 50,
  },
  {
    keywords: ['DISTRICT AGRICULTURE OFFICER', 'DAO AGRICULTURE', 'DISTRICT AGRICULTURE'],
    designation: 'District Agriculture Officer',
    department: 'AGRICULTURE DEPARTMENT',
    departmentShort: 'Agriculture Department',
    departmentType: 'agriculture',
    organizationType: 'agriculture_office',
    priority: 51,
    addDistrictSuffix: true,
  },
  {
    keywords: ['AGRICULTURE RESEARCH STATION', 'ARS', 'RESEARCH STATION'],
    designation: 'Research Officer',
    department: 'AGRICULTURE DEPARTMENT',
    departmentShort: 'Agriculture Department',
    departmentType: 'agriculture',
    organizationType: 'agriculture_office',
    priority: 52,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['AGRICULTURE EXTENSION', 'AEO', 'AGRICULTURE OFFICER', 'FIELD ASSISTANT'],
    designation: 'Agriculture Officer',
    department: 'AGRICULTURE DEPARTMENT',
    departmentShort: 'Agriculture Department',
    departmentType: 'agriculture',
    organizationType: 'agriculture_office',
    priority: 53,
  },
  {
    keywords: ['VETERINARY HOSPITAL', 'VETERINARY DISPENSARY', 'ANIMAL HOSPITAL'],
    designation: 'Veterinary Officer',
    department: 'LIVESTOCK & DAIRY DEVELOPMENT DEPARTMENT',
    departmentShort: 'Livestock & Dairy Development Department',
    departmentType: 'livestock',
    organizationType: 'livestock_office',
    priority: 54,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['VETERINARY', 'LIVESTOCK', 'ANIMAL HUSBANDRY', 'DAIRY DEVELOPMENT'],
    designation: 'Veterinary Officer',
    department: 'LIVESTOCK & DAIRY DEVELOPMENT DEPARTMENT',
    departmentShort: 'Livestock & Dairy Development Department',
    departmentType: 'livestock',
    organizationType: 'livestock_office',
    priority: 55,
    addDistrictSuffix: true,
  },
  {
    keywords: ['FISHERIES', 'FISH HATCHERY', 'FISH FARM'],
    designation: 'Fisheries Officer',
    department: 'FISHERIES DEPARTMENT',
    departmentShort: 'Fisheries Department',
    departmentType: 'fisheries',
    organizationType: 'fisheries_office',
    priority: 56,
    addDistrictSuffix: true,
  },
  {
    keywords: ['AGRICULTURE', 'FARM', 'SEED CORPORATION'],
    designation: 'Agriculture Officer',
    department: 'AGRICULTURE DEPARTMENT',
    departmentShort: 'Agriculture Department',
    departmentType: 'agriculture',
    organizationType: 'agriculture_office',
    priority: 59,
  },

  // ==========================================================================
  // POLICE (60–69)
  // ==========================================================================
  {
    keywords: ['INSPECTOR GENERAL OF POLICE', 'IGP', 'IG POLICE'],
    designation: 'Inspector General of Police',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 60,
  },
  {
    keywords: ['REGIONAL POLICE OFFICER', 'RPO'],
    designation: 'Regional Police Officer',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 61,
  },
  {
    keywords: ['DISTRICT POLICE OFFICER', 'DPO'],
    designation: 'District Police Officer',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 62,
    addDistrictSuffix: true,
  },
  {
    keywords: ['SENIOR SUPERINTENDENT OF POLICE', 'SUPERINTENDENT OF POLICE', 'SSP', 'SP OFFICE'],
    designation: 'Superintendent of Police',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 63,
  },
  {
    keywords: ['ADDITIONAL SP', 'ADDL SP'],
    designation: 'Additional Superintendent of Police',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 64,
  },
  {
    keywords: ['ASSISTANT SUPERINTENDENT', 'ASP'],
    designation: 'Assistant Superintendent of Police',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 65,
  },
  {
    keywords: ['DEPUTY SUPERINTENDENT', 'DSP'],
    designation: 'Deputy Superintendent of Police',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 66,
  },
  {
    keywords: ['STATION HOUSE OFFICER', 'SHO', 'POLICE STATION', 'THANA', 'POLICE POST'],
    designation: 'Station House Officer',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_station',
    priority: 67,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['SPECIAL BRANCH', 'INTELLIGENCE BRANCH', 'IB'],
    designation: 'Superintendent of Police',
    department: 'POLICE DEPARTMENT',
    departmentShort: 'Police Department',
    departmentType: 'police',
    organizationType: 'police_office',
    priority: 68,
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

  // ==========================================================================
  // REVENUE (70–79)
  // ==========================================================================
  {
    keywords: ['BOARD OF REVENUE', 'COMMISSIONER OFFICE', 'DIVISIONAL COMMISSIONER'],
    designation: 'Commissioner',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 70,
  },
  {
    keywords: ['DEPUTY COMMISSIONER', 'DC OFFICE', 'OFFICE OF THE DEPUTY COMMISSIONER'],
    designation: 'Deputy Commissioner',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 71,
    addDistrictSuffix: true,
  },
  {
    keywords: ['ADDITIONAL DEPUTY COMMISSIONER', 'ADC'],
    designation: 'Additional Deputy Commissioner',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 72,
    addDistrictSuffix: true,
  },
  {
    keywords: ['ASSISTANT COMMISSIONER', 'AC OFFICE', 'AC REVENUE', 'AC TEHSIL'],
    designation: 'Assistant Commissioner',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 73,
    addTehsilSuffix: true,
  },
  {
    keywords: ['TEHSILDAR'],
    designation: 'Tehsildar',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 74,
    addTehsilSuffix: true,
  },
  {
    keywords: ['NAIB TEHSILDAR'],
    designation: 'Naib Tehsildar',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 75,
    addTehsilSuffix: true,
  },
  {
    keywords: ['SETTLEMENT OFFICER', 'LAND RECORD', 'RECORD ROOM'],
    designation: 'Settlement Officer',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 76,
    addDistrictSuffix: true,
  },
  {
    keywords: ['REVENUE', 'PATWARI', 'QANUNGO', 'GIRDAWAR'],
    designation: 'Revenue Officer',
    department: 'REVENUE DEPARTMENT',
    departmentShort: 'Revenue Department',
    departmentType: 'revenue',
    organizationType: 'revenue_office',
    priority: 79,
  },

  // ==========================================================================
  // HEALTH (80–89)
  // ==========================================================================
  {
    keywords: ['TEACHING HOSPITAL', 'MTI', 'MEDICAL TEACHING INSTITUTION'],
    designation: 'Hospital Director',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'hospital',
    priority: 80,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['MEDICAL COLLEGE', 'DENTAL COLLEGE'],
    designation: 'Principal',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'college',
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
    organizationType: 'hospital',
    priority: 82,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['RURAL HEALTH CENTER', 'RURAL HEALTH CENTRE', 'RHC'],
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
    organizationType: 'dispensary',
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
    keywords: ['LADY HEALTH VISITOR', 'LHV', 'LADY HEALTH WORKER', 'LHW'],
    designation: 'Lady Health Visitor',
    designationFemale: 'Lady Health Visitor',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'health_facility',
    priority: 87,
  },
  {
    keywords: ['BLOOD BANK', 'LABORATORY', 'PATHOLOGY'],
    designation: 'Medical Officer',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'health_facility',
    priority: 88,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['HOSPITAL', 'MEDICAL', 'HEALTH', 'CLINIC', 'MATERNITY HOME', 'MOTHER & CHILD'],
    designation: 'Medical Officer',
    department: 'HEALTH DEPARTMENT',
    departmentShort: 'Health Department',
    departmentType: 'health',
    organizationType: 'health_facility',
    priority: 89,
    includeInstitutionInHeader: true,
  },

  // ==========================================================================
  // EDUCATION - OFFICES (90–94)
  // ==========================================================================
  {
    keywords: ['DIRECTOR GENERAL EDUCATION', 'DG EDUCATION', 'DIRECTORATE GENERAL EDUCATION'],
    designation: 'Director General',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'directorate',
    priority: 90,
  },
  {
    keywords: ['DIRECTOR EDUCATION', 'DIRECTORATE EDUCATION', 'DIRECTOR ESE', 'DIRECTOR ELEM'],
    designation: 'Director Education',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'directorate',
    priority: 91,
  },
  {
    keywords: ['DEPUTY DIRECTOR EDUCATION', 'DD EDUCATION', 'DDE'],
    designation: 'Deputy Director Education',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'education_office',
    priority: 92,
    addDistrictSuffix: true,
  },
  {
    keywords: ['DISTRICT EDUCATION OFFICER', 'DEO'],
    designation: 'District Education Officer',
    designationFemale: 'District Education Officer',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'education_office',
    priority: 93,
    addDistrictSuffix: true,
    detectGenderFromOffice: true,
    includeGenderSuffix: true,
  },
  {
    keywords: ['SUB DIVISIONAL EDUCATION OFFICER', 'SDEO'],
    designation: 'Sub Divisional Education Officer',
    designationFemale: 'Sub Divisional Education Officer',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'education_office',
    priority: 94,
    addTehsilSuffix: true,
    detectGenderFromOffice: true,
    includeGenderSuffix: true,
  },

  // ==========================================================================
  // HIGHER EDUCATION (95–96)
  // ==========================================================================
  {
    keywords: ['GOVERNMENT COLLEGE', 'DEGREE COLLEGE', 'POSTGRADUATE COLLEGE', 'PG COLLEGE', 'WOMEN COLLEGE'],
    designation: 'Principal',
    designationFemale: 'Principal',
    department: 'HIGHER EDUCATION ARCHIVES & LIBRARIES DEPARTMENT',
    departmentShort: 'Higher Education Department',
    departmentType: 'higher_education',
    organizationType: 'college',
    priority: 95,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['UNIVERSITY', 'UET', 'UOM', 'AWKUM', 'UOP', 'AGRICULTURAL UNIVERSITY'],
    designation: 'Vice Chancellor',
    department: 'HIGHER EDUCATION ARCHIVES & LIBRARIES DEPARTMENT',
    departmentShort: 'Higher Education Department',
    departmentType: 'higher_education',
    organizationType: 'university',
    priority: 96,
    includeInstitutionInHeader: true,
  },

  // ==========================================================================
  // TECHNICAL EDUCATION (97)
  // ==========================================================================
  {
    keywords: [
      'VOCATIONAL TRAINING INSTITUTE', 'VTI', 'POLYTECHNIC', 'TECHNICAL COLLEGE',
      'TRADE SCHOOL', 'INSTITUTE OF TECHNOLOGY', 'ITI', 'TEVTA', 'KPBTE',
    ],
    designation: 'Principal',
    department: 'TECHNICAL EDUCATION & VOCATIONAL TRAINING AUTHORITY',
    departmentShort: 'Technical Education & Vocational Training Authority',
    departmentType: 'technical_education',
    organizationType: 'technical_institute',
    priority: 97,
    includeInstitutionInHeader: true,
  },

  // ==========================================================================
  // MADRASSA (98)
  // ==========================================================================
  {
    keywords: ['DARUL ULOOM', 'JAMIA', 'MADRASSA', 'MADRASAH', 'MADRASA', 'DINI MADRASA'],
    designation: 'Principal',
    designationFemale: 'Principal',
    department: 'DEPARTMENT OF AUQAF, HAJJ, RELIGIOUS & MINORITY AFFAIRS',
    departmentShort: 'Auqaf & Religious Affairs Department',
    departmentType: 'education',
    organizationType: 'madrassa',
    priority: 98,
    includeInstitutionInHeader: true,
  },

  // ==========================================================================
  // EDUCATION - SCHOOLS (100–103)
  // ==========================================================================
  {
    keywords: ['GHSS', 'GGHSS', 'HIGHER SECONDARY SCHOOL', 'HSS', 'GOVT. HIGHER SECONDARY'],
    designation: 'Principal',
    designationFemale: 'Principal',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'higher_secondary_school',
    priority: 100,
    includeInstitutionInHeader: true,
    substringMatch: true,
  },
  {
    keywords: ['GHS', 'GGHS', 'HIGH SCHOOL', 'GOVT. HIGH SCHOOL'],
    designation: 'Headmaster',
    designationFemale: 'Headmistress',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'high_school',
    priority: 101,
    includeInstitutionInHeader: true,
    substringMatch: true,
  },
  {
    keywords: ['GMS', 'GGMS', 'MIDDLE SCHOOL', 'GOVT. MIDDLE SCHOOL'],
    designation: 'Headmaster',
    designationFemale: 'Headmistress',
    department: 'DEPARTMENT OF ELEMENTARY & SECONDARY EDUCATION',
    departmentShort: 'Elementary & Secondary Education Department',
    departmentType: 'education',
    organizationType: 'middle_school',
    priority: 102,
    includeInstitutionInHeader: true,
    substringMatch: true,
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
    substringMatch: true,
  },

  // ==========================================================================
  // LABOUR & INDUSTRIES (110–114)
  // ==========================================================================
  {
    keywords: ['LABOUR COURT', 'INDUSTRIAL RELATIONS COURT'],
    designation: 'Presiding Officer',
    department: 'LABOUR DEPARTMENT',
    departmentShort: 'Labour Department',
    departmentType: 'labour',
    organizationType: 'court',
    priority: 110,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['DIRECTOR LABOUR', 'DIRECTORATE LABOUR'],
    designation: 'Director Labour',
    department: 'LABOUR DEPARTMENT',
    departmentShort: 'Labour Department',
    departmentType: 'labour',
    organizationType: 'directorate',
    priority: 111,
  },
  {
    keywords: ['LABOUR OFFICER', 'LABOUR INSPECTOR', 'WORKMEN COMPENSATION'],
    designation: 'Labour Officer',
    department: 'LABOUR DEPARTMENT',
    departmentShort: 'Labour Department',
    departmentType: 'labour',
    organizationType: 'labour_office',
    priority: 112,
    addDistrictSuffix: true,
  },
  {
    keywords: ['DIRECTOR INDUSTRIES', 'DIRECTORATE OF INDUSTRIES', 'SMALL INDUSTRIES', 'SMEDEC'],
    designation: 'Director Industries',
    department: 'INDUSTRIES, COMMERCE & SUPPLY DEPARTMENT',
    departmentShort: 'Industries, Commerce & Supply Department',
    departmentType: 'industries',
    organizationType: 'industry_office',
    priority: 113,
  },
  {
    keywords: ['INDUSTRY', 'CHAMBER OF COMMERCE', 'COMMERCE'],
    designation: 'Industries Officer',
    department: 'INDUSTRIES, COMMERCE & SUPPLY DEPARTMENT',
    departmentShort: 'Industries, Commerce & Supply Department',
    departmentType: 'industries',
    organizationType: 'industry_office',
    priority: 114,
  },

  // ==========================================================================
  // ENERGY & POWER (120–124)
  // ==========================================================================
  {
    keywords: ['PESCO', 'TESCO', 'ELECTRICITY SUPPLY COMPANY'],
    designation: 'Executive Engineer',
    department: 'ENERGY & POWER DEPARTMENT',
    departmentShort: 'Energy & Power Department',
    departmentType: 'energy',
    organizationType: 'energy_office',
    priority: 120,
    addDistrictSuffix: true,
  },
  {
    keywords: ['WAPDA', 'WATER AND POWER DEVELOPMENT'],
    designation: 'Executive Engineer',
    department: 'ENERGY & POWER DEPARTMENT',
    departmentShort: 'Energy & Power Department',
    departmentType: 'energy',
    organizationType: 'energy_office',
    priority: 121,
  },
  {
    keywords: ['PEDO', 'PAKHTUNKHWA ENERGY', 'HYDROPOWER', 'MINI HYDRO'],
    designation: 'General Manager',
    department: 'ENERGY & POWER DEPARTMENT',
    departmentShort: 'Energy & Power Department',
    departmentType: 'energy',
    organizationType: 'energy_office',
    priority: 122,
  },
  {
    keywords: ['ENERGY', 'POWER', 'ELECTRIC', 'ELECTRICAL'],
    designation: 'Engineer',
    department: 'ENERGY & POWER DEPARTMENT',
    departmentShort: 'Energy & Power Department',
    departmentType: 'energy',
    organizationType: 'energy_office',
    priority: 124,
  },

  // ==========================================================================
  // ENVIRONMENT (125–129)
  // ==========================================================================
  {
    keywords: ['EPA', 'ENVIRONMENTAL PROTECTION AGENCY', 'ENVIRONMENTAL PROTECTION'],
    designation: 'Director General EPA',
    department: 'ENVIRONMENT DEPARTMENT',
    departmentShort: 'Environment Department',
    departmentType: 'environment',
    organizationType: 'environment_office',
    priority: 125,
  },
  {
    keywords: ['ENVIRONMENT', 'ECOLOGY', 'POLLUTION CONTROL'],
    designation: 'Environment Officer',
    department: 'ENVIRONMENT DEPARTMENT',
    departmentShort: 'Environment Department',
    departmentType: 'environment',
    organizationType: 'environment_office',
    priority: 129,
  },

  // ==========================================================================
  // TRANSPORT (130–134)
  // ==========================================================================
  {
    keywords: ['MOTOR TRANSPORT OFFICER', 'MTO'],
    designation: 'Motor Transport Officer',
    department: 'TRANSPORT DEPARTMENT',
    departmentShort: 'Transport Department',
    departmentType: 'transport',
    organizationType: 'transport_office',
    priority: 130,
    addDistrictSuffix: true,
  },
  {
    keywords: ['MVRA', 'MOTOR VEHICLE', 'VEHICLE REGISTRATION', 'REGIONAL TRANSPORT'],
    designation: 'Regional Transport Officer',
    department: 'TRANSPORT DEPARTMENT',
    departmentShort: 'Transport Department',
    departmentType: 'transport',
    organizationType: 'transport_office',
    priority: 131,
  },
  {
    keywords: ['TRANSPORT', 'VEHICLE EXAMINATION'],
    designation: 'Transport Officer',
    department: 'TRANSPORT DEPARTMENT',
    departmentShort: 'Transport Department',
    departmentType: 'transport',
    organizationType: 'transport_office',
    priority: 134,
  },

  // ==========================================================================
  // INFORMATION & PR (135–136)
  // ==========================================================================
  {
    keywords: ['DIRECTOR INFORMATION', 'DIRECTORATE INFORMATION', 'PID', 'PUBLIC INFORMATION'],
    designation: 'Director Information',
    department: 'INFORMATION & PUBLIC RELATIONS DEPARTMENT',
    departmentShort: 'Information & Public Relations Department',
    departmentType: 'information',
    organizationType: 'information_office',
    priority: 135,
  },
  {
    keywords: ['INFORMATION OFFICER', 'PRESS INFORMATION'],
    designation: 'Information Officer',
    department: 'INFORMATION & PUBLIC RELATIONS DEPARTMENT',
    departmentShort: 'Information & Public Relations Department',
    departmentType: 'information',
    organizationType: 'information_office',
    priority: 136,
    addDistrictSuffix: true,
  },

  // ==========================================================================
  // PLANNING & DEVELOPMENT (140–141)
  // ==========================================================================
  {
    keywords: ['PLANNING & DEVELOPMENT', 'P&D DEPARTMENT', 'CHIEF PLANNING OFFICER', 'CPO'],
    designation: 'Chief Planning Officer',
    department: 'PLANNING & DEVELOPMENT DEPARTMENT',
    departmentShort: 'Planning & Development Department',
    departmentType: 'planning',
    organizationType: 'planning_office',
    priority: 140,
  },
  {
    keywords: ['DISTRICT PLANNING OFFICER', 'DPO PLANNING', 'PLANNING OFFICER'],
    designation: 'District Planning Officer',
    department: 'PLANNING & DEVELOPMENT DEPARTMENT',
    departmentShort: 'Planning & Development Department',
    departmentType: 'planning',
    organizationType: 'planning_office',
    priority: 141,
    addDistrictSuffix: true,
  },

  // ==========================================================================
  // SCIENCE & TECHNOLOGY (145)
  // ==========================================================================
  {
    keywords: ['SCIENCE & TECHNOLOGY', 'S&T DEPARTMENT', 'IT DEPARTMENT', 'ICT'],
    designation: 'Director Science & Technology',
    department: 'SCIENCE & INFORMATION TECHNOLOGY DEPARTMENT',
    departmentShort: 'Science & IT Department',
    departmentType: 'science_technology',
    organizationType: 'science_technology_office',
    priority: 145,
  },

  // ==========================================================================
  // SPORTS (150–154)
  // ==========================================================================
  {
    keywords: ['DIRECTOR SPORTS', 'SPORTS DIRECTORATE', 'DIRECTOR PHYSICAL EDUCATION'],
    designation: 'Director Sports',
    department: 'SPORTS, TOURISM, ARCHAEOLOGY, MUSEUMS & YOUTH AFFAIRS DEPARTMENT',
    departmentShort: 'Sports, Tourism, Archaeology & Youth Affairs Department',
    departmentType: 'sports',
    organizationType: 'sports_office',
    priority: 150,
  },
  {
    keywords: ['DISTRICT SPORTS OFFICER', 'DSO SPORTS', 'PHYSICAL EDUCATION OFFICER'],
    designation: 'District Sports Officer',
    department: 'SPORTS, TOURISM, ARCHAEOLOGY, MUSEUMS & YOUTH AFFAIRS DEPARTMENT',
    departmentShort: 'Sports, Tourism, Archaeology & Youth Affairs Department',
    departmentType: 'sports',
    organizationType: 'sports_office',
    priority: 151,
    addDistrictSuffix: true,
  },
  {
    keywords: ['SPORTS COMPLEX', 'STADIUM', 'SPORTS GROUND'],
    designation: 'Sports Officer',
    department: 'SPORTS, TOURISM, ARCHAEOLOGY, MUSEUMS & YOUTH AFFAIRS DEPARTMENT',
    departmentShort: 'Sports, Tourism, Archaeology & Youth Affairs Department',
    departmentType: 'sports',
    organizationType: 'sports_office',
    priority: 152,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['SPORTS', 'PHYSICAL EDUCATION', 'GYM'],
    designation: 'Sports Officer',
    department: 'SPORTS, TOURISM, ARCHAEOLOGY, MUSEUMS & YOUTH AFFAIRS DEPARTMENT',
    departmentShort: 'Sports, Tourism, Archaeology & Youth Affairs Department',
    departmentType: 'sports',
    organizationType: 'sports_office',
    priority: 154,
  },

  // ==========================================================================
  // TOURISM & CULTURE (155–156)
  // ==========================================================================
  {
    keywords: ['TOURISM', 'TOURIST INFORMATION', 'PTDC'],
    designation: 'Tourism Officer',
    department: 'SPORTS, TOURISM, ARCHAEOLOGY, MUSEUMS & YOUTH AFFAIRS DEPARTMENT',
    departmentShort: 'Sports, Tourism, Archaeology & Youth Affairs Department',
    departmentType: 'tourism',
    organizationType: 'tourism_office',
    priority: 155,
    addDistrictSuffix: true,
  },
  {
    keywords: ['MUSEUM', 'ARCHAEOLOGY', 'CULTURAL HERITAGE', 'CULTURE'],
    designation: 'Culture Officer',
    department: 'SPORTS, TOURISM, ARCHAEOLOGY, MUSEUMS & YOUTH AFFAIRS DEPARTMENT',
    departmentShort: 'Sports, Tourism, Archaeology & Youth Affairs Department',
    departmentType: 'culture',
    organizationType: 'culture_office',
    priority: 156,
  },

  // ==========================================================================
  // ANTI-CORRUPTION (160)
  // ==========================================================================
  {
    keywords: ['ANTI CORRUPTION ESTABLISHMENT', 'ACE', 'ANTI-CORRUPTION'],
    designation: 'Director Anti-Corruption',
    department: 'ANTI-CORRUPTION ESTABLISHMENT',
    departmentShort: 'Anti-Corruption Establishment',
    departmentType: 'anti_corruption',
    organizationType: 'anti_corruption_office',
    priority: 160,
  },

  // ==========================================================================
  // CIVIL DEFENCE (165)
  // ==========================================================================
  {
    keywords: ['CIVIL DEFENCE', 'CIVIL DEFENSE'],
    designation: 'Civil Defence Officer',
    department: 'CIVIL DEFENCE DEPARTMENT',
    departmentShort: 'Civil Defence Department',
    departmentType: 'civil_defence',
    organizationType: 'civil_defence_office',
    priority: 165,
    addDistrictSuffix: true,
  },

  // ==========================================================================
  // DISASTER MANAGEMENT (170–171)
  // ==========================================================================
  {
    keywords: ['PDMA', 'DISASTER MANAGEMENT', 'NDMA', 'EMERGENCY RESCUE'],
    designation: 'Director Disaster Management',
    department: 'PROVINCIAL DISASTER MANAGEMENT AUTHORITY',
    departmentShort: 'PDMA',
    departmentType: 'disaster_management',
    organizationType: 'disaster_management_office',
    priority: 170,
  },
  {
    keywords: ['RESCUE 1122', 'RESCUE SERVICE', 'EMERGENCY SERVICE'],
    designation: 'District Emergency Officer',
    department: 'RESCUE 1122 / EMERGENCY SERVICES',
    departmentShort: 'Rescue 1122',
    departmentType: 'disaster_management',
    organizationType: 'disaster_management_office',
    priority: 171,
    addDistrictSuffix: true,
  },

  // ==========================================================================
  // PRISONS / JAILS (175–179)
  // ==========================================================================
  {
    keywords: ['INSPECTOR GENERAL PRISON', 'IG PRISON', 'PRISON DEPARTMENT'],
    designation: 'Inspector General Prisons',
    department: 'HOME DEPARTMENT',
    departmentShort: 'Home Department',
    departmentType: 'prison',
    organizationType: 'jail',
    priority: 175,
  },
  {
    keywords: ['DISTRICT PRISON', 'CENTRAL JAIL', 'DISTRICT JAIL', 'SUB JAIL'],
    designation: 'Superintendent Jail',
    department: 'HOME DEPARTMENT',
    departmentShort: 'Home Department',
    departmentType: 'prison',
    organizationType: 'jail',
    priority: 176,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['PRISON', 'JAIL'],
    designation: 'Jail Officer',
    department: 'HOME DEPARTMENT',
    departmentShort: 'Home Department',
    departmentType: 'prison',
    organizationType: 'jail',
    priority: 179,
  },

  // ==========================================================================
  // LAW & PROSECUTION (180–183)
  // ==========================================================================
  {
    keywords: ['DISTRICT & SESSIONS COURT', 'SESSION COURT', 'SESSIONS JUDGE'],
    designation: 'Sessions Judge',
    department: 'LAW, JUSTICE & HUMAN RIGHTS DEPARTMENT',
    departmentShort: 'Law & Justice Department',
    departmentType: 'law_justice',
    organizationType: 'court',
    priority: 180,
    addDistrictSuffix: true,
  },
  {
    keywords: ['CIVIL COURT', 'JUDICIAL COMPLEX', 'DISTRICT COURT'],
    designation: 'District Judge',
    department: 'LAW, JUSTICE & HUMAN RIGHTS DEPARTMENT',
    departmentShort: 'Law & Justice Department',
    departmentType: 'law_justice',
    organizationType: 'court',
    priority: 181,
    includeInstitutionInHeader: true,
  },
  {
    keywords: ['DISTRICT PROSECUTION', 'PROSECUTION OFFICE', 'DISTRICT PROSECUTOR'],
    designation: 'District Public Prosecutor',
    department: 'PROSECUTION DEPARTMENT',
    departmentShort: 'Prosecution Department',
    departmentType: 'prosecution',
    organizationType: 'prosecution_office',
    priority: 182,
    addDistrictSuffix: true,
  },
  {
    keywords: ['ADVOCATE GENERAL', 'LEGAL ADVISOR'],
    designation: 'Advocate General',
    department: 'LAW, JUSTICE & HUMAN RIGHTS DEPARTMENT',
    departmentShort: 'Law & Justice Department',
    departmentType: 'law_justice',
    organizationType: 'directorate',
    priority: 183,
  },

  // ==========================================================================
  // MINES & MINERALS (185–189)
  // ==========================================================================
  {
    keywords: ['DIRECTORATE OF MINES', 'MINES & MINERALS', 'MINERAL DEPARTMENT', 'MINING ENGINEER'],
    designation: 'Director Mines & Minerals',
    department: 'MINES & MINERALS DEPARTMENT',
    departmentShort: 'Mines & Minerals Department',
    departmentType: 'mines',
    organizationType: 'mine_office',
    priority: 185,
  },
  {
    keywords: ['MINES', 'QUARRY', 'MINING'],
    designation: 'Mines Inspector',
    department: 'MINES & MINERALS DEPARTMENT',
    departmentShort: 'Mines & Minerals Department',
    departmentType: 'mines',
    organizationType: 'mine_office',
    priority: 189,
    addDistrictSuffix: true,
  },

  // ==========================================================================
  // HOME DEPARTMENT (190–194)
  // ==========================================================================
  {
    keywords: ['HOME SECRETARY', 'ADDITIONAL HOME SECRETARY'],
    designation: 'Home Secretary',
    department: 'HOME DEPARTMENT',
    departmentShort: 'Home Department',
    departmentType: 'home',
    organizationType: 'general_office',
    priority: 190,
  },
  {
    keywords: ['HOME', 'POLITICAL AGENT', 'POLITICAL ADMINISTRATION'],
    designation: 'Political Agent',
    department: 'HOME DEPARTMENT',
    departmentShort: 'Home Department',
    departmentType: 'home',
    organizationType: 'general_office',
    priority: 194,
  },
];

// ============================================================================
// GENDER DETECTION
// ============================================================================

/**
 * Detects gender from a text string.
 *
 * Priority order:
 *  1. Explicit MALE markers → Male
 *  2. Explicit FEMALE markers → Female
 *  3. No marker found → null
 */
export function detectGenderFromText(text: string): 'Male' | 'Female' | null {
  if (!text) return null;

  const padded = ` ${text.toUpperCase().replace(/\s+/g, ' ').trim()} `;

  for (const kw of MALE_KEYWORDS) {
    if (padded.includes(kw)) return 'Male';
  }

  for (const kw of FEMALE_KEYWORDS) {
    if (padded.includes(kw)) return 'Female';
  }

  return null;
}

/**
 * Returns true if the institution/office is female-oriented.
 * Checks all provided text sources in order; first conclusive result wins.
 */
export function isGirlsInstitution(...sources: string[]): boolean {
  for (const src of sources) {
    const result = detectGenderFromText(src);
    if (result !== null) return result === 'Female';
  }
  return false;
}

export function isLocalGovtDesignation(designation: string): boolean {
  const normalized = (designation || '').toUpperCase().replace(/\s+/g, ' ').trim();
  return LOCAL_GOVT_DESIGNATIONS.some((d) => normalized.includes(d));
}

// ============================================================================
// KEYWORD MATCHING
// ============================================================================

function normalizeName(name: string): string {
  return (name || '').toUpperCase().replace(/\s+/g, ' ').trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tests whether `text` contains `keyword` as a whole word.
 */
function matchesKeyword(text: string, keyword: string, useSubstring = false): boolean {
  if (!text || !keyword) return false;
  const kw = keyword.toUpperCase().trim();
  if (useSubstring) return text.includes(kw);
  if (text === kw) return true;
  const escaped = escapeRegExp(kw);
  return new RegExp(`(?:^|[^A-Z0-9])${escaped}(?:$|[^A-Z0-9])`).test(text);
}

function findMatchingConfig(
  name: string,
  officeName?: string,
  designation?: string
): KeywordConfig | null {
  const primary   = normalizeName(name);
  const secondary = normalizeName(officeName || '');
  const desig     = normalizeName(designation || '');

  const sorted = [...INSTITUTION_CONFIG].sort((a, b) => a.priority - b.priority);

  for (const config of sorted) {
    const useSubstring = config.substringMatch === true;
    for (const keyword of config.keywords) {
      if (
        matchesKeyword(primary, keyword, useSubstring) ||
        matchesKeyword(secondary, keyword, useSubstring)
      ) {
        return config;
      }
    }
  }

  if (isLocalGovtDesignation(desig)) {
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
// MAIN API
// ============================================================================

export function getDepartmentInfo(
  schoolFullName: string,
  officeName?: string,
  tehsil?: string,
  district?: string,
  designation?: string
): DepartmentInfo {
  const institutionName = (schoolFullName || officeName || '').trim();
  const officeNameClean = (officeName || '').trim();
  const config          = findMatchingConfig(institutionName, officeName, designation);
  const districtClean   = (district || '').trim();
  const tehsilClean     = (tehsil || '').trim();

  // ------------------------------------------------------------------
  // Gender detection
  // ------------------------------------------------------------------
  let isGirls: boolean;

  if (config?.detectGenderFromOffice) {
    isGirls = isGirlsInstitution(officeNameClean, institutionName, designation ?? '');
  } else {
    isGirls = isGirlsInstitution(institutionName);
  }

  // ------------------------------------------------------------------
  // Base designation
  // ------------------------------------------------------------------
  const baseDesig = config
    ? (isGirls && config.designationFemale ? config.designationFemale : config.designation)
    : 'Head of Office';

  // ------------------------------------------------------------------
  // Gender suffix
  // ------------------------------------------------------------------
  const genderLabel  = isGirls ? 'Female' : 'Male';
  const genderSuffix = `(${genderLabel})`;

  const desigWithGender = config?.includeGenderSuffix
    ? `${baseDesig} ${genderSuffix}`
    : baseDesig;

  // ------------------------------------------------------------------
  // Location suffix
  // ------------------------------------------------------------------
  let finalDesignation: string;
  let headerDesignation: string;

  if (config?.addDistrictSuffix && districtClean) {
    finalDesignation  = `${desigWithGender} District ${districtClean}`;
    headerDesignation = finalDesignation.toUpperCase();
  } else if (config?.addTehsilSuffix && tehsilClean) {
    finalDesignation  = `${desigWithGender} ${tehsilClean}`;
    headerDesignation = finalDesignation.toUpperCase();
  } else {
    finalDesignation  = desigWithGender;
    headerDesignation = desigWithGender.toUpperCase();
    if (!config && districtClean) {
      headerDesignation = `HEAD OF OFFICE ${districtClean.toUpperCase()}`;
    }
  }

  // ------------------------------------------------------------------
  // Primary school override
  // ------------------------------------------------------------------
  if (config?.organizationType === 'primary_school') {
    const loc = tehsilClean || districtClean;
    finalDesignation  = `Sub Divisional Education Officer ${genderSuffix}${loc ? ` ${loc}` : ''}`;
    headerDesignation = finalDesignation.toUpperCase();
  }

  // ------------------------------------------------------------------
  // Letterhead line 1
  // ------------------------------------------------------------------
  const prefix = config?.headerPrefix ?? 'OFFICE OF THE';
  let headerLine1: string;

  if (config?.includeInstitutionInHeader && institutionName) {
    const isSchoolType = (config.organizationType ?? '').includes('school');
    headerLine1 = isSchoolType
      ? `${prefix} ${baseDesig.toUpperCase()}\n${institutionName.toUpperCase()}`
      : `${prefix} ${headerDesignation}`;
  } else {
    headerLine1 = `${prefix} ${headerDesignation}`;
  }

  const headerTitle     = headerLine1.split('\n')[0];
  const departmentShort = config?.departmentShort ?? 'Government Office';
  const headerLine2     = departmentShort;
  const headerLine3     = 'Govt. of Khyber Pakhtunkhwa';

  const letterhead: LetterheadInfo = {
    line1: headerLine1,
    line2: headerLine2,
    line3: headerLine3,
    full:  `${headerLine1}\n${headerLine2}\n${headerLine3}`,
  };

  // ------------------------------------------------------------------
  // Signature titles
  // ------------------------------------------------------------------
  const signatureTitleShort = finalDesignation;

  const appendInstToSig =
    config?.organizationType === 'middle_school'           ||
    config?.organizationType === 'high_school'             ||
    config?.organizationType === 'higher_secondary_school' ||
    config?.organizationType === 'college'                 ||
    config?.organizationType === 'health_facility'         ||
    config?.organizationType === 'hospital'                ||
    config?.organizationType === 'dispensary';

  const signatureTitle = appendInstToSig && institutionName
    ? `${finalDesignation}\n${institutionName}`
    : finalDesignation;

  // ------------------------------------------------------------------
  // Authority title (forwarding address / higher authority)
  // ------------------------------------------------------------------
  let authorityTitle = config?.customAuthorityTitle ?? finalDesignation;

  const officeNorm = normalizeName(officeNameClean || institutionName);

  const isSDEOOffice =
    officeNorm === 'SDEO' ||
    officeNorm.startsWith('SDEO ') ||
    officeNorm.includes('SUB DIVISIONAL EDUCATION OFFICER');

  const isDEOOffice =
    officeNorm === 'DEO' ||
    officeNorm.startsWith('DEO ') ||
    officeNorm.includes('DISTRICT EDUCATION OFFICER');

  const isDDEOffice =
    officeNorm === 'DDE' ||
    officeNorm.startsWith('DDE ') ||
    officeNorm.includes('DEPUTY DIRECTOR EDUCATION');

  const isDirectorEducationOffice =
    officeNorm.includes('DIRECTOR EDUCATION') ||
    officeNorm.includes('DIRECTORATE EDUCATION');

  const districtLine = districtClean || tehsilClean || '';
  const twoLine = (line1: string, line2?: string) =>
    line2 ? `${line1}\n${line2}` : line1;

  // -------------------------
  // EDUCATION CHAIN
  // -------------------------

  // All schools should forward upward
  if (
    config?.organizationType === 'primary_school' ||
    config?.organizationType === 'middle_school' ||
    config?.organizationType === 'high_school' ||
    config?.organizationType === 'higher_secondary_school'
  ) {
    authorityTitle = twoLine(
      `The District Education Officer ${genderSuffix}`,
      districtLine
    );
  }

  // Education offices should forward one step above themselves
  else if (config?.organizationType === 'education_office') {
    if (isSDEOOffice) {
      authorityTitle = twoLine(
        `The District Education Officer ${genderSuffix}`,
        districtLine
      );
    } else if (isDEOOffice) {
      authorityTitle = twoLine(
        'The Deputy Director Education',
        districtLine
      );
    } else if (isDDEOffice) {
      authorityTitle = 'The Director Education';
    } else {
      authorityTitle = 'The Director General Education';
    }
  }

  // Directorate education offices
  else if (
    config?.organizationType === 'directorate' &&
    config?.departmentType === 'education'
  ) {
    if (isDirectorEducationOffice) {
      authorityTitle = 'The Director General Education';
    } else {
      authorityTitle = 'The Secretary to Government of Khyber Pakhtunkhwa\nElementary & Secondary Education Department';
    }
  }

  // -------------------------
  // LOCAL GOVERNMENT CHAIN
  // -------------------------
  else if (
    config?.organizationType === 'village_council' ||
    config?.organizationType === 'neighborhood_council'
  ) {
    authorityTitle = twoLine(
      'The Assistant Director Local Government',
      districtClean
    );
  } else if (config?.organizationType === 'local_government_office') {
    authorityTitle = twoLine(
      'The Deputy Director Local Government',
      districtClean
    );
  }

  // -------------------------
  // HEALTH CHAIN
  // -------------------------
  else if (
    config?.organizationType === 'health_facility' ||
    config?.organizationType === 'dispensary' ||
    config?.organizationType === 'hospital'
  ) {
    authorityTitle = twoLine(
      'The District Health Officer',
      districtClean
    );
  }

  // -------------------------
  // REVENUE CHAIN
  // -------------------------
  else if (config?.organizationType === 'revenue_office') {
    authorityTitle = twoLine(
      'The Deputy Commissioner',
      districtClean
    );
  }

  // -------------------------
  // POLICE CHAIN
  // -------------------------
  else if (
    config?.organizationType === 'police_station' ||
    config?.organizationType === 'police_office'
  ) {
    authorityTitle = twoLine(
      'The District Police Officer',
      districtClean
    );
  }

  // ------------------------------------------------------------------
  // Return
  // ------------------------------------------------------------------
  return {
    headerTitle,
    signatureTitle,
    signatureTitleShort,
    department:       config?.department       ?? 'GOVERNMENT OF KHYBER PAKHTUNKHWA',
    departmentShort:  config?.departmentShort  ?? 'Government Office',
    departmentType:   config?.departmentType   ?? 'unknown',
    organizationType: config?.organizationType ?? 'other',
    isGirlsInstitution: isGirls,
    gender:     isGirls ? 'Female' : 'Male',
    salutation: isGirls ? 'Madam' : 'Sir',
    authorityTitle,
    institutionName,
    district: districtClean,
    tehsil:   tehsilClean,
    letterhead,
  };
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

export function getHeadDesignation(name: string, district?: string): string {
  return getDepartmentInfo(name, undefined, undefined, district).signatureTitleShort;
}

export function getDepartmentName(name: string): string {
  return getDepartmentInfo(name).department;
}

export function detectGender(name: string): 'M' | 'F' {
  return isGirlsInstitution(name) ? 'F' : 'M';
}

export function getSalutation(name: string): 'Sir' | 'Madam' {
  return isGirlsInstitution(name) ? 'Madam' : 'Sir';
}

// Backward-compatible alias
export { INSTITUTION_CONFIG as INSTITUTION_KEYWORDS };