# Feature Spec: Loan Module (`loan-module`)

## 1. Overview & Goal
The **Loan Module** is the core transactional engine of eMSME. It manages the entire loan lifecycle from application submission through disbursement to completion. It operates as a **state machine** with clearly defined transitions, and acts as the orchestration hub that connects identity verification, credit scoring, partner bank APIs, and repayment scheduling.

**Platform:** Mobile (`mobile/`) + Backend (`backend/`)
**Dependency:** Requires `user-onboarding` to be complete (PhilSys verified, business verified, financials submitted) before a loan application can be created.

---

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (Loan Application Submission):** As a verified MSME owner, I can submit a loan application by specifying a requested amount, purpose, and repayment tenor so that I can receive a funding decision.
- **US-2 (Application State Tracking):** As an applicant, I can view the real-time status of my loan application (Draft, Submitted, Under Review, Approved, Rejected, Disbursed, Active Repayment) on my mobile dashboard.
- **US-3 (Loan Offer Review & E-Signature):** As an approved applicant, I can review the loan terms (approved amount, interest rate, monthly amortization schedule) and digitally accept the offer.
- **US-4 (Disbursement Request):** As a system, once the loan offer is e-signed, eMSME sends a "Disbursement Request" to the assigned Partner Bank API (LANDBANK or DBP) and waits for a webhook confirmation.
- **US-5 (Resume Interrupted Application):** As an applicant who closed the app mid-process, I can resume my application from the last saved step without losing progress.

### Acceptance Criteria
- [ ] **AC-1:** `POST /api/loans/apply` validates that the applicant has completed onboarding (PhilSys verified, business verified, financials submitted) before allowing submission. Returns `403` with `ONBOARDING_INCOMPLETE` if not.
- [ ] **AC-2:** Loan application is created with `status: 'SUBMITTED'` and stored in SQLite. The credit engine is triggered asynchronously upon submission.
- [ ] **AC-3:** State machine transitions are strictly enforced. Invalid transitions (e.g., `DRAFT → DISBURSED`) return `409 Conflict`.
- [ ] **AC-4:** `GET /api/loans/:loanId` returns the full loan application detail including current status, credit score result, and repayment schedule (if approved).
- [ ] **AC-5:** `POST /api/loans/:loanId/accept` processes the applicant's e-signature acceptance and transitions status to `DISBURSEMENT_PENDING`, then triggers the Partner Bank disbursement API call.
- [ ] **AC-6:** `POST /api/loans/webhook/disbursement` receives a webhook from the Partner Bank, validates the payload, and transitions loan status to `DISBURSED` + `REPAYMENT_ACTIVE`, creating an amortization schedule in SQLite.
- [ ] **AC-7:** Loan state is auto-saved to SQLite after every transition so users can close the app and resume.

### Loan State Machine
```
DRAFT → SUBMITTED → UNDER_VERIFICATION → UNDERWRITING → APPROVED
                                                       ↓
                                                  LOAN_OFFER
                                                       ↓
                                              E_SIGNATURE_PENDING
                                                       ↓
                                            DISBURSEMENT_PENDING
                                                       ↓ (Partner Bank Webhook)
                                               REPAYMENT_ACTIVE
                                                       ↓
                                                  COMPLETED
UNDER_VERIFICATION / UNDERWRITING → REJECTED
```

---

## 3. Out of Scope
- Direct fund transfers via eGovPay (eGovPay is for repayments only; disbursement is via Partner Bank API).
- Loan restructuring / refinancing in this iteration.
- Multiple concurrent active loan applications per user.
- Underwriter admin portal UI (underwriter review is a status flag; UI is out of scope for hackathon).
