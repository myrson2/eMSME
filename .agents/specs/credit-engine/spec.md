# Feature Spec: Credit Engine (`credit-engine`)

## 1. Overview & Goal
The **Credit Engine** is a deterministic, rule-based scoring service that evaluates a loan applicant's creditworthiness and produces a `CreditScoreResult`. It runs asynchronously after loan submission and is the primary automated decision-maker for loan approval, manual review routing, and rejection.

**Platform:** Backend (`backend/src/services/creditEngine.ts`)
**Trigger:** Called by `loan-module` after `POST /api/loans/apply`.
**Output:** Updates `loan_applications` table with `credit_score_json` and new `status`.

---

## 2. Scoring Rubric (Source of Truth)

| Category | Sub-criterion | Points |
|---|---|---|
| **Identity Verification** (Max 25) | PhilSys OIDC + eFacial + eVerify all passed | 25 |
| | eVerify only (no eFacial) | 15 |
| | Manual ID upload (unverified) | 5 |
| **Business Legitimacy** (Max 25) | DTI / SEC / CDA active & verified | 10 |
| | BIR TIN verified | 8 |
| | LGU Permit verified | 7 |
| **Financial Health** (Max 35) | Revenue / Amortization Ratio >= 3.0 | 20 |
| | DSCR >= 1.5 | 15 |
| | Revenue / Amortization Ratio 2.0–2.99 | 12 |
| | DSCR 1.0–1.49 | 8 |
| **Operating History** (Max 15) | Years in operation >= 3 | 10 |
| | No active defaulted loans declared | 5 |

### Decision Thresholds
- **Score >= 80:** `AUTO_APPROVE`
- **Score 60–79:** `MANUAL_REVIEW`
- **Score < 60:** `AUTO_REJECT`

---

## 3. User Stories & Acceptance Criteria

### User Stories
- **US-1 (Automated Assessment):** As a system, after loan submission, the credit engine calculates a risk score within 30 seconds and updates the loan status accordingly.
- **US-2 (Score Transparency):** As an approved applicant, I can see my score breakdown (identity, business, financial, history sub-scores) on the loan detail screen.
- **US-3 (Rejection Reasons):** As a rejected applicant, I receive specific reasons for rejection (e.g., "BIR TIN not verified", "Revenue/Amortization ratio below 2.0") so I know what to improve.
- **US-4 (Determinism):** As a QA engineer, given the same applicant data, the credit engine always returns the same score. There is no randomness or ML inference.

### Acceptance Criteria
- [ ] **AC-1:** `assessLoan(loanId)` reads `financial_profiles`, `business_profiles`, `users`, and `onboarding_progress` from SQLite and computes all 4 sub-scores.
- [ ] **AC-2:** Final score and all sub-scores are persisted as `credit_score_json` on the `loan_applications` row.
- [ ] **AC-3:** Status transitions are enforced:
  - Score >= 80 → `APPROVED` + generates `loanOffer` (rate, term)
  - 60–79 → `UNDERWRITING`
  - < 60 → `REJECTED` with `rejection_reasons_json`
- [ ] **AC-4:** Monthly Amortization is estimated at score time using a base interest rate lookup table (by loan amount bracket and business type) to generate the `APPROVED` loan offer.
- [ ] **AC-5:** DSCR is computed as: `DSCR = monthlyRevenue / (existingLoanAmortizations + estimatedNewMonthlyPayment)`.
- [ ] **AC-6:** Revenue/Amortization ratio is computed as: `ratio = monthlyRevenue / estimatedNewMonthlyPayment`.
- [ ] **AC-7:** All scoring logic is unit-testable with no external dependencies (pure functions only).

---

## 4. Interest Rate Table (Base Rates by Loan Bracket)

| Loan Amount | Micro (< ₱300K) | Small (₱300K–₱3M) | Medium (₱3M–₱15M) |
|---|---|---|---|
| Auto-Approved (Score 80+) | 9.0% p.a. | 8.5% p.a. | 8.0% p.a. |
| Manual Review (Score 60-79) | 12.0% p.a. | 11.5% p.a. | 11.0% p.a. |

---

## 5. Out of Scope
- Machine learning or AI-based scoring (deterministic rules only for this iteration).
- External credit bureau lookups (CIC, TransUnion PH) — deferred to post-hackathon.
- Adjusting scores for industry-specific risk factors (e.g., agriculture vs. retail).
- Underwriter override scoring (underwriter changes status manually, not via credit engine).
