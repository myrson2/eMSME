# Feature Spec: User Onboarding (`user-onboarding`)

## 1. Overview & Goal
The **User Onboarding** feature is the required multi-step entry flow that every new MSME applicant must complete before they can submit a loan application. It collects, verifies, and persists the applicant's identity, business registration, and financial information in a step-aware, resumable wizard.

**Platform:** Mobile (`mobile/`) + Backend (`backend/`)
**Critical Property:** Each step is auto-saved to SQLite. A user who closes the app mid-flow resumes exactly where they left off.

**Step Order (enforced):**
1. eGovPH SSO Authentication (PhilSys identity)
2. eFacial Liveness Check (anti-spoofing)
3. eVerify PhilSys Match (identity confirmation)
4. Business Profile Setup (business name, type, registration no.)
5. Business Government Registry Verification (DTI / SEC / CDA / BIR / LGU)
6. Financial Information Submission

---

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (Step Resumability):** As an applicant who closed the app after completing step 3, I see the onboarding wizard start at step 4 next time I open the app.
- **US-2 (Identity Verification Chain):** As an applicant, I complete my biometric check (eFacial liveness), then my national ID is automatically verified (eVerify) using the same captured frame, so I don't have to scan twice.
- **US-3 (Business Profile):** As an applicant, I can select my business type (Sole Prop, Corp, Co-op), enter my registration number, and trigger an automated verification against the relevant government registry (DTI/SEC/CDA).
- **US-4 (Financial Snapshot):** As an applicant, I can input my monthly revenue, annual income, total assets, liabilities, and existing loan obligations to complete the financial profile.
- **US-5 (Onboarding Completion Gate):** As a system, the loan application endpoint checks that all onboarding steps are marked complete before allowing loan submission.

### Acceptance Criteria
- [ ] **AC-1:** `GET /api/onboarding/status` returns the current onboarding step, percent complete, and which substeps are done/pending for the authenticated user.
- [ ] **AC-2:** Each step has a corresponding backend endpoint that updates a `onboarding_progress` record in SQLite with the completed step flag.
- [ ] **AC-3:** eFacial runs before eVerify. The facial frame captured in the eFacial step is stored in server memory (NOT on disk) and passed directly to the eVerify request within the same request lifecycle.
- [ ] **AC-4:** Business verification auto-routes to the correct government API based on `businessType`:
  - `Sole Proprietorship` → DTI check
  - `Corporation` / `Partnership` → SEC check
  - `Cooperative` → CDA check
  - All business types additionally require BIR TIN + LGU Permit checks.
- [ ] **AC-5:** Financial profile submission validates that `monthlyRevenue > 0` and `totalAssets >= 0` before persisting.
- [ ] **AC-6:** Attempting to access a later step before completing earlier steps returns `403` with `STEP_NOT_UNLOCKED`.

---

## 3. Onboarding Step Registry

| Step # | Step Key | Backend Route | Completion Flag |
|---|---|---|---|
| 1 | `EGOV_SSO` | Handled by `egov-sso` spec | `is_philsys_verified = true` |
| 2 | `EFACIAL` | Handled by `efacial-recog` spec | `is_facial_verified = true` |
| 3 | `EVERIFY` | Handled by `everify` spec | `is_everify_verified = true` |
| 4 | `BUSINESS_PROFILE` | `POST /api/onboarding/business/profile` | `business_profile_created = true` |
| 5 | `BUSINESS_VERIFY` | `POST /api/onboarding/business/verify` | `is_gov_registry_verified = true` |
| 6 | `FINANCIALS` | `POST /api/onboarding/financials` | `financial_profile_created = true` |

---

## 4. Out of Scope
- Onboarding for non-Philippine citizens or foreign passport holders.
- Document upload as a fallback for failed eVerify (deferred to manual queue process).
- Email/password account creation (authentication is eGovPH SSO only).
- Admin-side onboarding management UI.
