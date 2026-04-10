
-- RPMS Database Schema for MariaDB
-- Architecture: Normalized tables linked via employee_id

CREATE DATABASE IF NOT EXISTS kpk_rpms;
USE kpk_rpms;

-- ==========================================
-- SECTION A: LEGACY APP TABLES (DO NOT MODIFY)
-- ==========================================

-- 1. Employees Table (Basic Identity)
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    bps INT NOT NULL,
    school_full_name VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Retired', 'Deceased', 'LPR') DEFAULT 'Active',
    mobile_no VARCHAR(20),
    personal_no VARCHAR(50) UNIQUE,
    cnic_no VARCHAR(20) UNIQUE NOT NULL,
    father_name VARCHAR(255),
    nationality VARCHAR(50) DEFAULT 'Pakistani',
    address TEXT,
    dob DATE NOT NULL,
    ddo_code VARCHAR(50),
    bank_ac_no VARCHAR(50),
    bank_branch VARCHAR(100),
    account_type VARCHAR(50) DEFAULT 'PLS',
    gpf_account_no VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Service History Table
CREATE TABLE IF NOT EXISTS service_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date_of_appointment DATE NOT NULL,
    date_of_entry DATE, -- Entry into Govt Service
    date_of_retirement DATE,
    retirement_order_no VARCHAR(100),
    retirement_order_date DATE,
    lwp_days INT DEFAULT 0, -- Leave Without Pay (calculated as Y-M-D in logic, stored as days)
    lpr_days INT DEFAULT 365,
    qualifying_service INT, -- Stored in years or calculated virtually
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 3. Financials Table (Allowances & Deductions)
CREATE TABLE IF NOT EXISTS financials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    -- Basic Pay
    basic_pay DECIMAL(10, 2) DEFAULT 0.00,
    last_pay_with_increment DECIMAL(10, 2) DEFAULT 0.00,
    p_pay DECIMAL(10, 2) DEFAULT 0.00, -- Personal Pay
    
    -- Regular Allowances
    hra DECIMAL(10, 2) DEFAULT 0.00, -- House Rent Allowance
    ca DECIMAL(10, 2) DEFAULT 0.00, -- Conveyance Allowance
    ma DECIMAL(10, 2) DEFAULT 0.00, -- Medical Allowance
    charge_allow DECIMAL(10, 2) DEFAULT 0.00, -- Charge Allowance
    spl_allow_disable DECIMAL(10, 2) DEFAULT 0.00, -- Spl Conveyance to Disable
    uaa DECIMAL(10, 2) DEFAULT 0.00, -- Uniform/Utility (UAA)
    dress_allow DECIMAL(10, 2) DEFAULT 0.00, -- Dress Allowance
    wa DECIMAL(10, 2) DEFAULT 0.00, -- Washing Allowance
    integrated_allow DECIMAL(10, 2) DEFAULT 0.00, -- Integrated Allowance 2021
    teaching_allow DECIMAL(10, 2) DEFAULT 0.00, -- Teaching Allowance
    spl_allow DECIMAL(10, 2) DEFAULT 0.00, -- Special Allowance
    
    -- Adhoc Reliefs & Disparity Allowances
    adhoc_2013 DECIMAL(10, 2) DEFAULT 0.00, -- 15% Adhoc Relief 2013
    adhoc_10pct DECIMAL(10, 2) DEFAULT 0.00, -- Adhoc Relief 10%
    dra_2022kp DECIMAL(10, 2) DEFAULT 0.00, -- Disparity Reduction Allowance 2022 (KP)
    adhoc_2022_ps17 DECIMAL(10, 2) DEFAULT 0.00, -- Adhoc Relief 2022 (PS17)
    adhoc_2023_35 DECIMAL(10, 2) DEFAULT 0.00, -- Adhoc Relief 2023 35%
    adhoc_2024_25 DECIMAL(10, 2) DEFAULT 0.00, -- Adhoc Relief 2024 25%
    adhoc_2025_10 DECIMAL(10, 2) DEFAULT 0.00, -- Adhoc Relief 2025 10%
    dra_2025_15 DECIMAL(10, 2) DEFAULT 0.00, -- Disparity Reduction Allowance 2025 15%
    
    -- Deductions
    gpf_deduction DECIMAL(10, 2) DEFAULT 0.00, -- GPF Subscription
    bf DECIMAL(10, 2) DEFAULT 0.00, -- Benevolent Fund
    income_tax DECIMAL(10, 2) DEFAULT 0.00,
    edu_rop DECIMAL(10, 2) DEFAULT 0.00, -- Education ROP
    eef DECIMAL(10, 2) DEFAULT 0.00, -- Education Employee Foundation
    rb_death DECIMAL(10, 2) DEFAULT 0.00, -- RBDC
    
    -- Loans & Advances
    hba_loan_instal DECIMAL(10, 2) DEFAULT 0.00, -- HBA Loan Installment
    gpf_loan_instal DECIMAL(10, 2) DEFAULT 0.00, -- GPF Loan Installment
    
    -- Other
    other DECIMAL(10, 2) DEFAULT 0.00,
    recovery_other DECIMAL(10, 2) DEFAULT 0.00,
    
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 4. Family Members Table
CREATE TABLE IF NOT EXISTS family_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    relative_name VARCHAR(255) NOT NULL,
    relation VARCHAR(50) NOT NULL, -- Wife, Son, Daughter, etc.
    age INT,
    dob DATE, -- Date of Birth
    cnic VARCHAR(20),
    marital_status VARCHAR(50), -- Married, Unmarried, Widow
    status VARCHAR(50) DEFAULT 'Alive', -- Alive, Deceased
    profession VARCHAR(100),
    is_dependent BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Indexing for performance
CREATE INDEX idx_cnic ON employees(cnic_no);
CREATE INDEX idx_personal_no ON employees(personal_no);


-- ==========================================
-- SECTION B: NEW PAYROLL DB SCHEMA (2026)
-- ==========================================

-- 1. Employees Master (Payroll)
CREATE TABLE IF NOT EXISTS pr_employees (
    employee_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    personnel_no VARCHAR(20) UNIQUE NOT NULL,
    cnic_no VARCHAR(13) UNIQUE NOT NULL,
    ntn_no VARCHAR(20) NULL,
    name VARCHAR(120) NOT NULL,
    father_name VARCHAR(120) NULL,
    dob VARCHAR(10) NULL, -- DD.MM.YYYY
    nationality VARCHAR(40) NULL,
    employment_category VARCHAR(40) NULL, -- Active Temporary/Permanent
    designation_short VARCHAR(20) NULL, -- e.g., PSHT, PST
    designation_full VARCHAR(120) NULL,
    bps VARCHAR(5) NULL,
    date_of_entry VARCHAR(10) NULL, -- DD.MM.YYYY
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);

-- 2. DDO Offices
CREATE TABLE IF NOT EXISTS pr_ddo_offices (
    ddo_code VARCHAR(10) PRIMARY KEY,
    office_name VARCHAR(200) NULL,
    payroll_section VARCHAR(10) NULL,
    gpf_section VARCHAR(10) NULL,
    cash_center VARCHAR(10) NULL
);

-- 3. Employee Posting
CREATE TABLE IF NOT EXISTS pr_employee_posting (
    posting_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    ddo_code VARCHAR(10) NOT NULL,
    school_full_name VARCHAR(200) NULL,
    office_name VARCHAR(200) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    FOREIGN KEY (employee_id) REFERENCES pr_employees(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (ddo_code) REFERENCES pr_ddo_offices(ddo_code)
);

-- 4. Bank Accounts
CREATE TABLE IF NOT EXISTS pr_bank_accounts (
    bank_account_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    payee_name VARCHAR(120) NULL,
    bank_ac_no VARCHAR(40) NULL,
    bank_name VARCHAR(120) NULL,
    branch_code VARCHAR(20) NULL,
    branch_name VARCHAR(200) NULL,
    is_primary TINYINT(1) DEFAULT 1,
    FOREIGN KEY (employee_id) REFERENCES pr_employees(employee_id) ON DELETE CASCADE
);

-- 5. Payroll Periods
CREATE TABLE IF NOT EXISTS pr_payroll_periods (
    period_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ddo_code VARCHAR(10) NOT NULL,
    period_month VARCHAR(20) NOT NULL,
    period_year SMALLINT NOT NULL,
    statement_label VARCHAR(40) NULL,
    run_datetime DATETIME NULL,
    FOREIGN KEY (ddo_code) REFERENCES pr_ddo_offices(ddo_code),
    UNIQUE KEY idx_period_unique (ddo_code, period_year, period_month)
);

-- 6. Payroll (Master Row)
CREATE TABLE IF NOT EXISTS pr_payroll (
    payroll_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    period_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    pay_scale_type VARCHAR(20) DEFAULT 'Civil',
    pay_stage VARCHAR(10) NULL,
    gross_pay DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_pay DECIMAL(15,2) DEFAULT 0,
    gpf_account_no VARCHAR(40) NULL,
    gpf_balance DECIMAL(15,2) DEFAULT 0,
    gpf_interest_applied VARCHAR(10) NULL,
    vendor_number VARCHAR(40) NULL,
    FOREIGN KEY (period_id) REFERENCES pr_payroll_periods(period_id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES pr_employees(employee_id) ON DELETE CASCADE,
    UNIQUE KEY idx_payroll_unique (period_id, employee_id)
);

-- 7. Payroll Allowances
CREATE TABLE IF NOT EXISTS pr_payroll_allowances (
    allow_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payroll_id BIGINT NOT NULL,
    wage_code VARCHAR(10) NOT NULL,
    wage_name VARCHAR(200) NOT NULL,
    db_short VARCHAR(40) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (payroll_id) REFERENCES pr_payroll(payroll_id) ON DELETE CASCADE
);

-- 8. Payroll Deductions
CREATE TABLE IF NOT EXISTS pr_payroll_deductions (
    ded_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payroll_id BIGINT NOT NULL,
    ded_code VARCHAR(10) NOT NULL,
    ded_name VARCHAR(200) NOT NULL,
    db_short VARCHAR(40) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (payroll_id) REFERENCES pr_payroll(payroll_id) ON DELETE CASCADE
);

-- 9. Payroll Loans
CREATE TABLE IF NOT EXISTS pr_payroll_loans (
    loan_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payroll_id BIGINT NOT NULL,
    loan_code VARCHAR(10) NULL,
    loan_name VARCHAR(200) NOT NULL,
    db_short VARCHAR(40) NOT NULL,
    principal_amount DECIMAL(15,2) NULL,
    deduction_amount DECIMAL(15,2) NULL,
    balance_amount DECIMAL(15,2) NULL,
    FOREIGN KEY (payroll_id) REFERENCES pr_payroll(payroll_id) ON DELETE CASCADE
);

-- 10. Payroll Income Tax
CREATE TABLE IF NOT EXISTS pr_payroll_income_tax (
    tax_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payroll_id BIGINT NOT NULL,
    tax_payable DECIMAL(15,2) NULL,
    tax_recovered_till DECIMAL(15,2) NULL,
    tax_exempted DECIMAL(15,2) NULL,
    tax_recoverable DECIMAL(15,2) NULL,
    FOREIGN KEY (payroll_id) REFERENCES pr_payroll(payroll_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_pr_allow_code ON pr_payroll_allowances(wage_code);
CREATE INDEX idx_pr_ded_code ON pr_payroll_deductions(ded_code);
CREATE INDEX idx_pr_loan_code ON pr_payroll_loans(loan_code);
