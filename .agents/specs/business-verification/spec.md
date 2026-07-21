# Feature Spec: Business Verification (`business-verification`)

## 1. Overview & Goal
The **Business Verification** feature handles automated routing and verification of MSME business registrations against the appropriate Philippine government registries (DTI, SEC, CDA, BIR, LGU). It runs during Step 5 of user onboarding and produces a verified business profile that is required for credit scoring.

**Platform:** Backend (`backend/src/services/businessVerification.ts`) + Mobile (`BusinessVerifyScreen.tsx`)

**Routing Logic:** The business type determines which *primary* registry is checked. All business types additionally require BIR TIN and LGU Permit verification.

| Business Type | Primary Registry | Secondary Checks |
|---|---|---|
| Sole Proprietorship | DTI Business Name Registry | BIR TIN + LGU Permit |
| Corporation / Partnership | SEC Company Register | BIR TIN + LGU Permit |
| Cooperative | CDA Cooperative Registry | BIR TIN + LGU Permit |

---

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (Auto-Route Verification):** As a system, given a business type and registration number, I automatically call the correct government API (DTI/SEC/CDA) and the universal secondary checks (BIR, LGU) in parallel.
- **US-2 (Partial Failure Handling):** As an applicant, if my BIR TIN check fails but my DTI is valid, I receive a specific error showing which check failed so I can correct it and retry.
- **US-3 (Retry Support):** As an applicant whose LGU permit verification failed, I can update my permit number and re-trigger verification without re-entering all my other business details.
- **US-4 (Verified Flag Persistence):** As a system, once all checks pass, the `business_profiles` record is updated with `is_gov_verified = true` and individual verification timestamps.

### Acceptance Criteria
- [ ] **AC-1:** `POST /api/onboarding/business/verify` reads the saved business profile from SQLite and triggers the correct registry adapter + BIR + LGU in parallel (`Promise.allSettled`).
- [ ] **AC-2:** On full success, `business_profiles.is_gov_verified` is set to `true` and `onboarding_progress.business_verify_completed` is set to `1`.
- [ ] **AC-3:** On partial failure, returns `422` with `{ failedChecks: ['BIR', 'LGU'] }` and does NOT set `is_gov_verified = true`.
- [ ] **AC-4:** Each adapter times out after 10 seconds and returns a structured `VerificationAdapterResult` (not a raw API error).
- [ ] **AC-5:** If a government API is unreachable (network timeout / 5xx), the system queues the verification attempt with status `PENDING_RETRY` and notifies the user via push notification to retry.
- [ ] **AC-6:** Individual check results (DTI: PASS, BIR: FAIL, LGU: PENDING) are stored in `business_profiles.verification_checks_json` for audit trail and retry support.
- [ ] **AC-7:** Mobile screen `BusinessVerifyScreen.tsx` displays a real-time status indicator for each check (spinning → green check / red X) as results come in.

---

## 3. Adapter Contract

Each government registry adapter must conform to this interface:

```typescript
export interface VerificationAdapterResult {
  agency: 'DTI' | 'SEC' | 'CDA' | 'BIR' | 'LGU';
  status: 'PASS' | 'FAIL' | 'TIMEOUT' | 'ERROR';
  verifiedAt?: string;  // ISO timestamp
  referenceId?: string; // Agency confirmation reference
  errorMessage?: string;
}
```

---

## 4. Out of Scope
- Manual document upload as a fallback for failed government API checks (deferred post-hackathon).
- Verification for non-Philippine businesses.
- Fetching and displaying full business name details from SEC/DTI (only status verification in this iteration).
- LGU routing by municipality (a single generic LGU adapter is used; municipality-specific routing is deferred).
