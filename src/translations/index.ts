export type Language = 'en' | 'ur';

export interface Translations {
  common: {
    dashboard: string;
    employees: string;
    cases: string;
    pension: string;
    gpfund: string;
    budgeting: string;
    legalAudit: string;
    admin: string;
    templates: string;
    calendar: string;
    sharing: string;
    settings: string;
    logout: string;
    search: string;
    calculate: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    submit: string;
    loading: string;
    error: string;
    success: string;
    printReport: string;
    manualEntry: string;
    selectEmployee: string;
  };
  pension: {
    title: string;
    subtitle: string;
    basicPay: string;
    serviceYears: string;
    ageAtRetirement: string;
    results: string;
    grossPension: string;
    netPensionBase: string;
    commutationLumpSum: string;
    proposedNetPension: string;
    medicalAllowanceNote: string;
    adhocReliefBreakdown: string;
    totalMonthlyPension: string;
    inclAdhocs: string;
    configurationUsed: string;
    enterDetails: string;
    rules2026: string;
    enterPositiveValues: string;
    minServiceRequired: string;
    ageLimit: string;
    calculationComplete: string;
  };
  budgeting: {
    title: string;
    subtitle: string;
    budgetHeads: string;
    expenditure: string;
    proposals: string;
    rbdc: string;
    taBills: string;
    source1: string;
    source2: string;
    source3: string;
    allocated: string;
    utilized: string;
    remaining: string;
    addHead: string;
    addExpenditure: string;
    createProposal: string;
    tokenManagement: string;
    billTracker: string;
    reconciliation: string;
    addToken: string;
    tokenNo: string;
    submissionDate: string;
    amount: string;
    objectionCodes: string;
    encashmentDate: string;
    matched: string;
    unmatched: string;
    noTokens: string;
    tokenDesc: string;
    budgetAllocation: string;
    submitted: string;
    encashed: string;
    objected: string;
    totalAllocation: string;
    code: string;
    headName: string;
    source: string;
    balance: string;
    noHeads: string;
    dailyTracking: string;
    newEntry: string;
    noExpenditure: string;
    expenditureDesc: string;
    revisedProposed: string;
    revisedBudget: string;
    newProposal: string;
    noProposals: string;
    proposalsDesc: string;
    rbdcManagement: string;
    generateRBDC: string;
    rbdcAutomation: string;
    rbdcDesc: string;
  };
  legalAudit: {
    title: string;
    subtitle: string;
    courtCases: string;
    auditParas: string;
    caseNumber: string;
    courtName: string;
    hearingDate: string;
    status: string;
    addCase: string;
    addPara: string;
    complianceStatus: string;
    litigationMonitoring: string;
    totalCases: string;
    stayOrders: string;
    upcomingHearings: string;
    decided: string;
    noActiveCases: string;
    litigationDesc: string;
    auditCompliance: string;
    pendingParas: string;
    submittedReplies: string;
    settled: string;
    noAuditParas: string;
    auditDesc: string;
    nextHearing: string;
    commentsDeadline: string;
    history: string;
    fileComments: string;
    paraNo: string;
    amountInvolved: string;
    deadline: string;
    viewHistory: string;
    addReply: string;
    generateComments: string;
  };
  admin: {
    title: string;
    subtitle: string;
    seniorityList: string;
    transfers: string;
    medicalClaims: string;
    loans: string;
    serviceBook: string;
    updateServiceBook: string;
    generateList: string;
    filterDesignation: string;
    filterBPS: string;
    noSeniority: string;
    seniorityDesc: string;
    transferOrders: string;
    createOrder: string;
    noRecentOrders: string;
    transferDesc: string;
    medicalReimbursement: string;
    newClaim: string;
    noClaimsFound: string;
    medicalDesc: string;
    hbaVehicleLoans: string;
    newApplication: string;
    hbaTitle: string;
    hbaDesc: string;
    manageHBA: string;
    vehicleLoanTitle: string;
    vehicleLoanDesc: string;
    manageVehicleLoans: string;
    sneStrength: string;
    addSanctionedPost: string;
    totalSanctioned: string;
    totalFilled: string;
    totalVacant: string;
    designation: string;
    bps: string;
    status: string;
    recruitmentNeeded: string;
    optimal: string;
    annualIncrements: string;
    eligibleForIncrement: string;
    ineligibleJoiningAfterJune: string;
    generateIncrementOrders: string;
    currentBasicPay: string;
    annualIncrement: string;
    newBasicPay: string;
    eligible: string;
    notEligible: string;
    automatedTracking: string;
    automatedTrackingDesc: string;
    rulesBasedSeniority: string;
    rulesBasedSeniorityDesc: string;
    kpPayScaleLogic: string;
    kpPayScaleLogicDesc: string;
    totalEmployees: string;
    seniorityNo: string;
    nameDesignation: string;
    dateRegularization: string;
    appointmentDate: string;
    personalNo: string;
  };
  templates: {
    govtKP: string;
    no: string;
    dated: string;
    to: string;
    subject: string;
    memo: string;
    encl: string;
    endst: string;
    copyForwarded: string;
    officeFile: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      dashboard: 'Dashboard',
      employees: 'Employees',
      cases: 'Cases',
      pension: 'Pension',
      gpfund: 'GP Fund',
      budgeting: 'Budgeting',
      legalAudit: 'Legal & Audit',
      admin: 'Admin',
      templates: 'Templates',
      calendar: 'Scheduler',
      sharing: 'File Share',
      settings: 'Settings',
      logout: 'Logout',
      search: 'Search',
      calculate: 'Calculate',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      printReport: 'Print Report',
      manualEntry: '-- Manual Entry --',
      selectEmployee: 'Select Employee Source',
    },
    pension: {
      title: 'Pension Calculator',
      subtitle: 'Professional Pension Calculation System',
      basicPay: 'Basic Pay (Last Drawn)',
      serviceYears: 'Qualifying Service (Years)',
      ageAtRetirement: 'Age at Retirement',
      results: 'Calculation Results',
      grossPension: 'Gross Pension',
      netPensionBase: 'Net Pension (65%)',
      commutationLumpSum: 'Commutation (35%)',
      proposedNetPension: 'Proposed Net Pension',
      medicalAllowanceNote: '(Net Pension 65% + Medical Allowance)',
      adhocReliefBreakdown: 'Adhoc Relief Breakdown',
      totalMonthlyPension: 'Total Monthly Pension',
      inclAdhocs: '(Incl. Adhocs)',
      configurationUsed: 'Configuration Used',
      enterDetails: 'Enter details above to see calculation results',
      rules2026: '2026 Rules',
      enterPositiveValues: 'Please enter positive values',
      minServiceRequired: 'Minimum 10 years service required',
      ageLimit: 'Age must be between 20 and 80',
      calculationComplete: 'Calculation complete',
    },
    budgeting: {
      title: 'Budget & Expenditure',
      subtitle: 'Manage Budget Allocation and Expenditure Tracking',
      budgetHeads: 'Budget Heads',
      expenditure: 'Expenditure',
      proposals: 'Proposals',
      rbdc: 'RBDC',
      taBills: 'TA Bills',
      source1: 'Source-I',
      source2: 'Source-II',
      source3: 'Source-III',
      allocated: 'Allocated',
      utilized: 'Utilized',
      remaining: 'Remaining',
      addHead: 'Add Budget Head',
      addExpenditure: 'Add Expenditure Record',
      createProposal: 'Create Budget Proposal',
      tokenManagement: 'DAO Token Management',
      billTracker: 'Bill Tracker',
      reconciliation: 'Reconciliation',
      addToken: 'Add Token Bill',
      tokenNo: 'Token No',
      submissionDate: 'Submission Date',
      amount: 'Amount',
      objectionCodes: 'Objection Codes',
      encashmentDate: 'Encashment Date',
      matched: 'Matched',
      unmatched: 'Unmatched',
      noTokens: 'No bills tracked',
      tokenDesc: 'Track bills submitted to District Accounts Office with automated reconciliation.',
      budgetAllocation: 'Budget Allocation (Source I, II, III)',
      submitted: 'Submitted',
      encashed: 'Encashed',
      objected: 'Objected',
      totalAllocation: 'Total Allocation',
      code: 'Code',
      headName: 'Head Name',
      source: 'Source',
      balance: 'Balance',
      noHeads: 'No budget heads configured. Click "Add Budget Head" to start.',
      dailyTracking: 'Daily Expenditure Tracking',
      newEntry: 'New Entry',
      noExpenditure: 'No Expenditure Recorded',
      expenditureDesc: 'Start tracking your office spending against allocated budget heads.',
      revisedProposed: 'Revised & Proposed Budget (SNE)',
      revisedBudget: 'Revised Budget',
      newProposal: 'New Proposal',
      noProposals: 'No Budget Proposals',
      proposalsDesc: 'Create multi-year budget projections with automated inflation adjustments.',
      rbdcManagement: 'RBDC Management',
      generateRBDC: 'Generate RBDC',
      rbdcAutomation: 'RBDC Automation',
      rbdcDesc: 'Automatically compile establishment costs, utility charges, and developmental budget items into official formats.',
    },
    legalAudit: {
      title: 'Legal & Audit Monitoring',
      subtitle: 'Track Court Cases and Audit Paras Compliance',
      courtCases: 'Court Cases',
      auditParas: 'Audit Paras',
      caseNumber: 'Case Number',
      courtName: 'Court Name',
      hearingDate: 'Next Hearing',
      status: 'Status',
      addCase: 'Add Court Case',
      addPara: 'Add Audit Para',
      complianceStatus: 'Compliance Status',
      litigationMonitoring: 'Litigation Monitoring',
      totalCases: 'Total Cases',
      stayOrders: 'Stay Orders',
      upcomingHearings: 'Upcoming Hearings',
      decided: 'Decided',
      noActiveCases: 'No Active Court Cases',
      litigationDesc: 'Record and track departmental litigation, hearing dates, and compliance status.',
      auditCompliance: 'Audit Compliance',
      pendingParas: 'Pending Paras',
      submittedReplies: 'Submitted Replies',
      settled: 'Settled',
      noAuditParas: 'No Audit Paras Recorded',
      auditDesc: 'Monitor audit observations, prepare replies, and track settlement progress.',
      nextHearing: 'Next Hearing',
      commentsDeadline: 'Comments Deadline',
      history: 'History',
      fileComments: 'File Comments',
      paraNo: 'Para No.',
      amountInvolved: 'Amount Involved',
      deadline: 'Deadline',
      viewHistory: 'View History',
      addReply: 'Add Reply',
      generateComments: 'Generate Comments',
    },
    admin: {
      title: 'Establishment & Admin',
      subtitle: 'Manage Employee Administration and Records',
      seniorityList: 'Seniority List',
      transfers: 'Transfers/Posting',
      medicalClaims: 'Medical Claims',
      loans: 'HBA/Vehicle Loans',
      serviceBook: 'Service Book & Seniority',
      updateServiceBook: 'Update Service Book',
      generateList: 'Generate List',
      filterDesignation: 'Filter by Designation',
      filterBPS: 'Filter by BPS',
      noSeniority: 'No Seniority Records',
      seniorityDesc: 'Maintain cadre-wise seniority lists and track service book updates for all employees.',
      transferOrders: 'Transfer & Posting Orders',
      createOrder: 'Create Order',
      noRecentOrders: 'No Recent Orders',
      transferDesc: 'Generate transfer orders, joining reports, and charge assumption certificates.',
      medicalReimbursement: 'Medical Reimbursement',
      newClaim: 'New Claim',
      noClaimsFound: 'No Claims Found',
      medicalDesc: 'Process medical reimbursement claims according to government health department standards.',
      hbaVehicleLoans: 'HBA & Vehicle Loans',
      newApplication: 'New Application',
      hbaTitle: 'House Building Advance',
      hbaDesc: 'Process HBA cases with automated installment calculation and recovery scheduling.',
      manageHBA: 'Manage HBA',
      vehicleLoanTitle: 'Vehicle Loan',
      vehicleLoanDesc: 'Process car/motorcycle loan applications with government-approved formats.',
      manageVehicleLoans: 'Manage Vehicle Loans',
      sneStrength: 'SNE & Strength',
      addSanctionedPost: 'Add Sanctioned Post',
      totalSanctioned: 'Total Sanctioned',
      totalFilled: 'Total Filled',
      totalVacant: 'Total Vacant',
      designation: 'Designation',
      bps: 'BPS',
      status: 'Status',
      recruitmentNeeded: 'Recruitment Needed',
      optimal: 'Optimal',
      annualIncrements: 'Annual Increments',
      eligibleForIncrement: 'Eligible for Increment',
      ineligibleJoiningAfterJune: 'Ineligible (Joining after June)',
      generateIncrementOrders: 'Generate Increment Orders',
      currentBasicPay: 'Current Basic Pay',
      annualIncrement: 'Annual Increment',
      newBasicPay: 'New Basic Pay',
      eligible: 'Eligible',
      notEligible: 'Not Eligible',
      automatedTracking: 'Automated Vacancy Tracking',
      automatedTrackingDesc: 'Posts are automatically flagged as \'Vacant\' when a retirement notification is generated in the Pension module.',
      rulesBasedSeniority: 'Rules-Based Seniority Generation',
      rulesBasedSeniorityDesc: 'Lists are automatically generated based on BPS, Date of Regularization, and length of service as per civil service rules.',
      kpPayScaleLogic: 'Revised Pay Scales Logic',
      kpPayScaleLogicDesc: 'Annual increments are automatically calculated for employees with 6+ months of service as of 1st December. New basic pay will be updated in the system on 1st December 2025.',
      totalEmployees: 'Total Employees',
      seniorityNo: 'Seniority #',
      nameDesignation: 'Name & Designation',
      dateRegularization: 'Date of Regularization',
      appointmentDate: 'Appointment Date',
      personalNo: 'Personal No',
    },
    templates: {
      govtKP: 'GOVERNMENT OFFICIAL',
      no: 'No.',
      dated: 'Dated',
      to: 'To',
      subject: 'Subject',
      memo: 'Memo:',
      encl: 'Encl:',
      endst: 'Endst: No. & Date Even.',
      copyForwarded: 'Copy forwarded for information and necessary action to:',
      officeFile: 'Office file.',
    },
  },
  ur: {
    common: {
      dashboard: 'ڈیش بورڈ',
      employees: 'ملازمین',
      cases: 'کیسز',
      pension: 'پینشن',
      gpfund: 'جی پی فنڈ',
      budgeting: 'بجٹ سازی',
      legalAudit: 'قانونی اور آڈٹ',
      admin: 'ایڈمن',
      templates: 'ٹیمپلیٹس',
      calendar: 'شیڈولر',
      sharing: 'فائل شیئر',
      settings: 'ترتیبات',
      logout: 'لاگ آؤٹ',
      search: 'تلاش',
      calculate: 'حساب لگائیں',
      save: 'محفوظ کریں',
      cancel: 'منسوخ کریں',
      delete: 'حذف کریں',
      edit: 'ترمیم کریں',
      back: 'پیچھے',
      next: 'آگے',
      submit: 'جمع کرائیں',
      loading: 'لوڈنگ ہو رہی ہے...',
      error: 'غلطی',
      success: 'کامیابی',
      printReport: 'رپورٹ پرنٹ کریں',
      manualEntry: '-- دستی اندراج --',
      selectEmployee: 'ملازم کا انتخاب کریں',
    },
    pension: {
      title: 'پینشن کیلکولیٹر',
      subtitle: 'پروفیشنل پینشن کیلکولیشن سسٹم',
      basicPay: 'بنیادی تنخواہ (آخری لی گئی)',
      serviceYears: 'اہل مدت ملازمت (سال)',
      ageAtRetirement: 'ریٹائرمنٹ پر عمر',
      results: 'حساب کے نتائج',
      grossPension: 'کل پینشن (گراس)',
      netPensionBase: 'خالص پینشن (65%)',
      commutationLumpSum: 'کمیوٹیشن (35%)',
      proposedNetPension: 'مجوزہ خالص پینشن',
      medicalAllowanceNote: '(خالص پینشن 65٪ + میڈیکل الاؤنس)',
      adhocReliefBreakdown: 'ایڈہاک ریلیف کی تفصیلات',
      totalMonthlyPension: 'کل ماہانہ پینشن',
      inclAdhocs: '(بشمول ایڈہاک ریلیف)',
      configurationUsed: 'استعمال شدہ کنفیگریشن',
      enterDetails: 'حساب کے نتائج دیکھنے کے لیے اوپر تفصیلات درج کریں',
      rules2026: '2026 رولز',
      enterPositiveValues: 'براہ کرم مثبت اعداد درج کریں',
      minServiceRequired: 'کم از کم 10 سال کی ملازمت ضروری ہے',
      ageLimit: 'عمر 20 سے 80 سال کے درمیان ہونی چاہیے',
      calculationComplete: 'حساب مکمل ہو گیا',
    },
    budgeting: {
      title: 'بجٹ اور اخراجات',
      subtitle: 'بجٹ کی تقسیم اور اخراجات کی ٹریکنگ کا انتظام',
      budgetHeads: 'بجٹ ہیڈز',
      expenditure: 'اخراجات',
      proposals: 'تجاویز',
      rbdc: 'RBDC',
      taBills: 'ٹی اے بلز',
      source1: 'سورس-I',
      source2: 'سورس-II',
      source3: 'سورس-III',
      allocated: 'مختص شدہ',
      utilized: 'استعمال شدہ',
      remaining: 'باقی ماندہ',
      addHead: 'نیا بجٹ ہیڈ شامل کریں',
      addExpenditure: 'اخراجات کا اندراج کریں',
      createProposal: 'بجٹ تجویز تیار کریں',
      tokenManagement: 'ڈی اے او ٹوکن مینجمنٹ',
      billTracker: 'بل ٹریکر',
      reconciliation: 'ریکنسلیشن',
      addToken: 'نیا ٹوکن بل شامل کریں',
      tokenNo: 'ٹوکن نمبر',
      submissionDate: 'جمع کرانے کی تاریخ',
      amount: 'رقم',
      objectionCodes: 'اعتراض کوڈز',
      encashmentDate: 'کیش کرانے کی تاریخ',
      matched: 'میچ شدہ',
      unmatched: 'غیر میچ شدہ',
      noTokens: 'کوئی بل ٹریک نہیں کیا گیا',
      tokenDesc: 'ڈسٹرکٹ اکاؤنٹس آفس میں جمع کرائے گئے بلوں کو ٹریک کریں اور خودکار طریقے سے ان کی تصدیق کریں۔',
      budgetAllocation: 'بجٹ ایلوکیشن (سورس I, II, III)',
      submitted: 'جمع شدہ',
      encashed: 'کیش شدہ',
      objected: 'اعتراض شدہ',
      totalAllocation: 'کل مختص شدہ رقم',
      code: 'کوڈ',
      headName: 'بجٹ ہیڈ کا نام',
      source: 'سورس',
      balance: 'باقی رقم',
      noHeads: 'کوئی بجٹ ہیڈ موجود نہیں ہے۔ شروع کرنے کے لیے "نیا بجٹ ہیڈ شامل کریں" پر کلک کریں۔',
      dailyTracking: 'روزانہ اخراجات کی ٹریکنگ',
      newEntry: 'نیا اندراج',
      noExpenditure: 'کوئی اخراجات درج نہیں ہیں',
      expenditureDesc: 'مختص شدہ بجٹ ہیڈز کے خلاف اپنے دفتر کے اخراجات کو ٹریک کرنا شروع کریں۔',
      revisedProposed: 'ترمیمی اور مجوزہ بجٹ (SNE)',
      revisedBudget: 'ترمیمی بجٹ',
      newProposal: 'نئی تجویز',
      noProposals: 'کوئی بجٹ تجاویز موجود نہیں ہیں',
      proposalsDesc: 'خودکار افراط زر کی ایڈجسٹمنٹ کے ساتھ کثیر سالہ بجٹ تجاویز تیار کریں۔',
      rbdcManagement: 'RBDC انتظام',
      generateRBDC: 'RBDC تیار کریں',
      rbdcAutomation: 'RBDC آٹومیشن',
      rbdcDesc: 'اسٹیبلشمنٹ کے اخراجات، یوٹیلیٹی چارجز اور ترقیاتی بجٹ کی اشیاء کو خودکار طور پر سرکاری فارمیٹس میں مرتب کریں۔',
    },
    legalAudit: {
      title: 'قانونی اور آڈٹ مانیٹرنگ',
      subtitle: 'عدالتی کیسز اور آڈٹ پیراز کی تعمیل کی ٹریکنگ',
      courtCases: 'عدالتی کیسز',
      auditParas: 'آڈٹ پیراز',
      caseNumber: 'کیس نمبر',
      courtName: 'عدالت کا نام',
      hearingDate: 'اگلی سماعت',
      status: 'حالت',
      addCase: 'عدالتی کیس شامل کریں',
      addPara: 'آڈٹ پیرا شامل کریں',
      complianceStatus: 'تعمیل کی صورتحال',
      litigationMonitoring: 'مقدمہ بازی کی نگرانی',
      totalCases: 'کل کیسز',
      stayOrders: 'حکم امتناعی',
      upcomingHearings: 'آنے والی سماعتیں',
      decided: 'فیصلہ شدہ',
      noActiveCases: 'کوئی فعال عدالتی کیس نہیں ہے',
      litigationDesc: 'محکمہ جاتی مقدمہ بازی، سماعت کی تاریخوں اور تعمیل کی صورتحال کو ریکارڈ اور ٹریک کریں۔',
      auditCompliance: 'آڈٹ تعمیل',
      pendingParas: 'زیر التواء پیراز',
      submittedReplies: 'جمع کرائے گئے جوابات',
      settled: 'حل شدہ',
      noAuditParas: 'کوئی آڈٹ پیرا درج نہیں ہے',
      auditDesc: 'آڈٹ مشاہدات کی نگرانی کریں، جوابات تیار کریں اور تصفیہ کی پیشرفت کو ٹریک کریں۔',
      nextHearing: 'اگلی سماعت',
      commentsDeadline: 'کمنٹس کی آخری تاریخ',
      history: 'تاریخچہ',
      fileComments: 'کمنٹس فائل کریں',
      paraNo: 'پیرا نمبر',
      amountInvolved: 'شامل رقم',
      deadline: 'آخری تاریخ',
      viewHistory: 'تاریخچہ دیکھیں',
      addReply: 'جواب شامل کریں',
      generateComments: 'کمنٹس تیار کریں',
    },
    admin: {
      title: 'اسٹیبلشمنٹ اور ایڈمن',
      subtitle: 'ملازمین کے انتظامی معاملات کا بندوبست',
      seniorityList: 'سینیارٹی لسٹ',
      transfers: 'تبادلے/پوسٹنگ',
      medicalClaims: 'میڈیکل کلیمز',
      loans: 'ایچ بی اے/گاڑیوں کے قرضے',
      serviceBook: 'سروس بک اور سینیارٹی',
      updateServiceBook: 'سروس بک اپ ڈیٹ کریں',
      generateList: 'فہرست تیار کریں',
      filterDesignation: 'عہدے کے لحاظ سے فلٹر کریں',
      filterBPS: 'بی پی ایس کے لحاظ سے فلٹر کریں',
      noSeniority: 'کوئی سینیارٹی ریکارڈ موجود نہیں ہے',
      seniorityDesc: 'تمام ملازمین کے لیے کیڈر وائز سینیارٹی لسٹیں برقرار رکھیں اور سروس بک کی اپ ڈیٹس کو ٹریک کریں۔',
      transferOrders: 'تبادلے اور پوسٹنگ کے احکامات',
      createOrder: 'آرڈر تیار کریں',
      noRecentOrders: 'کوئی حالیہ آرڈر نہیں ہے',
      transferDesc: 'تبادلے کے آرڈر، جوائننگ رپورٹس اور چارج سنبھالنے کے سرٹیفکیٹ تیار کریں۔',
      medicalReimbursement: 'میڈیکل ری ایمبرسمنٹ',
      newClaim: 'نیا کلیم',
      noClaimsFound: 'کوئی کلیم نہیں ملا',
      medicalDesc: 'حکومتی صحت کے محکمہ کے معیار کے مطابق میڈیکل ری ایمبرسمنٹ کلیمز پر کارروائی کریں۔',
      hbaVehicleLoans: 'ایچ بی اے اور گاڑیوں کے قرضے',
      newApplication: 'نئی درخواست',
      hbaTitle: 'ہاؤس بلڈنگ ایڈوانس',
      hbaDesc: 'خودکار قسطوں کے حساب کتاب اور وصولی کے شیڈول کے ساتھ ایچ بی اے کیسز پر کارروائی کریں۔',
      manageHBA: 'ایچ بی اے کا انتظام کریں',
      vehicleLoanTitle: 'گاڑی کا قرض',
      vehicleLoanDesc: 'حکومتی منظور شدہ فارمیٹس کے ساتھ کار/موٹر سائیکل لون کی درخواستوں پر کارروائی کریں۔',
      manageVehicleLoans: 'گاڑیوں کے قرضوں کا انتظام کریں',
      sneStrength: 'ایس این ای اور افرادی قوت',
      addSanctionedPost: 'منظور شدہ اسامی شامل کریں',
      totalSanctioned: 'کل منظور شدہ',
      totalFilled: 'کل پر شدہ',
      totalVacant: 'کل خالی',
      designation: 'عہدہ',
      bps: 'بی پی ایس',
      status: 'حالت',
      recruitmentNeeded: 'بھرتی کی ضرورت ہے',
      optimal: 'تسلی بخش',
      annualIncrements: 'سالانہ اضافہ (انکریمنٹ)',
      eligibleForIncrement: 'اضافے کے لیے اہل',
      ineligibleJoiningAfterJune: 'نااہل (جون کے بعد شمولیت)',
      generateIncrementOrders: 'انکریمنٹ آرڈرز تیار کریں',
      currentBasicPay: 'موجودہ بنیادی تنخواہ',
      annualIncrement: 'سالانہ اضافہ',
      newBasicPay: 'نئی بنیادی تنخواہ',
      eligible: 'اہل',
      notEligible: 'نااہل',
      automatedTracking: 'خودکار آسامیوں کی ٹریکنگ',
      automatedTrackingDesc: 'جب پینشن ماڈیول میں ریٹائرمنٹ کا نوٹیفکیشن تیار کیا جاتا ہے تو اسامیوں کو خودکار طور پر \'خالی\' قرار دے دیا جاتا ہے۔',
      rulesBasedSeniority: 'قواعد پر مبنی سینیارٹی لسٹ',
      rulesBasedSeniorityDesc: 'سول سرونٹ رولز کے مطابق بی پی ایس، ریگولرائزیشن کی تاریخ اور مدت ملازمت کی بنیاد پر فہرستیں خودکار طور پر تیار کی جاتی ہیں۔',
      kpPayScaleLogic: 'ترمیم شدہ تنخواہ کے پیمانے',
      kpPayScaleLogicDesc: 'یکم دسمبر تک 6 ماہ سے زیادہ ملازمت مکمل کرنے والے ملازمین کے لیے سالانہ اضافہ خودکار طور پر لگایا جاتا ہے۔ یکم دسمبر 2025 کو سسٹم میں نئی بنیادی تنخواہ اپ ڈیٹ کر دی جائے گی۔',
      totalEmployees: 'کل ملازمین',
      seniorityNo: 'سینیارٹی نمبر',
      nameDesignation: 'نام و عہدہ',
      dateRegularization: 'ریگولرائزیشن کی تاریخ',
      appointmentDate: 'تعیناتی کی تاریخ',
      personalNo: 'پرسنل نمبر',
    },
    templates: {
      govtKP: 'سرکاری دستاویز',
      no: 'نمبر',
      dated: 'بتاریخ',
      to: 'بخدمت',
      subject: 'عنوان',
      memo: 'یاداشت:',
      encl: 'لف ہذا:',
      endst: 'اندراج نمبر و تاریخ ہذا۔',
      copyForwarded: 'نقل برائے معلومات اور ضروری کارروائی بخدمت:',
      officeFile: 'دفتری فائل۔',
    },
  },
};
