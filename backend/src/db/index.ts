import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.join(__dirname, '..', '..', 'emsme.db');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await dbInstance.exec('PRAGMA foreign_keys = ON;');
  await initializeSchema(dbInstance);

  return dbInstance;
}

async function initializeSchema(db: Database): Promise<void> {
  await db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      philSysId TEXT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      middleName TEXT,
      email TEXT NOT NULL UNIQUE,
      mobileNumber TEXT,
      address TEXT, -- JSON string of Address
      isPhilSysVerified INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Onboarding Progress table
    CREATE TABLE IF NOT EXISTS onboarding_progress (
      user_id TEXT PRIMARY KEY,
      egov_sso_completed INTEGER DEFAULT 0,
      efacial_completed INTEGER DEFAULT 0,
      everify_completed INTEGER DEFAULT 0,
      business_profile_id TEXT,
      business_verify_completed INTEGER DEFAULT 0,
      financial_profile_id TEXT,
      financials_completed INTEGER DEFAULT 0,
      current_step TEXT DEFAULT 'EGOV_SSO',
      completed_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Business Profiles table
    CREATE TABLE IF NOT EXISTS business_profiles (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      business_name TEXT NOT NULL,
      trade_name TEXT,
      registration_number TEXT NOT NULL,
      business_type TEXT NOT NULL,
      industry_category TEXT,
      years_in_operation INTEGER DEFAULT 0,
      bir_tin TEXT NOT NULL,
      lgu_permit_number TEXT,
      lgu_municipality TEXT,
      is_gov_verified INTEGER DEFAULT 0,
      bir_tin_verified INTEGER DEFAULT 0,
      lgu_permit_verified INTEGER DEFAULT 0,
      verification_checks_json TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Financial Profiles table
    CREATE TABLE IF NOT EXISTS financial_profiles (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      monthly_revenue REAL NOT NULL,
      annual_income REAL NOT NULL,
      total_assets REAL NOT NULL,
      total_liabilities REAL NOT NULL,
      existing_loans_json TEXT,
      debt_service_coverage_ratio REAL,
      has_active_default INTEGER DEFAULT 0,
      declared_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE
    );

    -- Loan Applications table
    CREATE TABLE IF NOT EXISTS loan_applications (
      id TEXT PRIMARY KEY,
      applicant_id TEXT NOT NULL,
      business_id TEXT NOT NULL,
      requested_amount REAL NOT NULL,
      approved_amount REAL,
      tenor_months INTEGER NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      interest_rate_annual REAL,
      monthly_amortization REAL,
      credit_score_json TEXT,
      rejection_reasons_json TEXT,
      disbursement_ref TEXT,
      disbursed_at TEXT,
      e_signed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (applicant_id) REFERENCES users(id),
      FOREIGN KEY (business_id) REFERENCES business_profiles(id)
    );

    -- Repayment Installments table
    CREATE TABLE IF NOT EXISTS repayment_installments (
      id TEXT PRIMARY KEY,
      loan_id TEXT NOT NULL,
      installment_number INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      principal_amount REAL NOT NULL,
      interest_amount REAL NOT NULL,
      total_amount_due REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      paid_amount REAL,
      paid_at TEXT,
      transaction_ref TEXT,
      FOREIGN KEY (loan_id) REFERENCES loan_applications(id) ON DELETE CASCADE
    );

    -- eGovPay Webhooks Ledger (Idempotency)
    CREATE TABLE IF NOT EXISTS egovpay_webhooks (
      txnid TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      reference_no TEXT,
      amount REAL,
      received_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export default getDb;
