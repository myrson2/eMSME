# Architecture: User Onboarding (`user-onboarding`)

## 1. Step Flow Diagram

```mermaid
flowchart TD
    A([App Launch]) --> B{Is user authenticated?}
    B -- No --> C[Step 1: eGovPH SSO Login\nexpo-auth-session → /api/auth/egov/exchange]
    B -- Yes --> D{Check onboarding_progress}
    C --> D

    D --> |Step 2 incomplete| E[Step 2: eFacial Liveness Check\nCamera → POST /api/verify/face-liveness]
    D --> |Step 3 incomplete| F[Step 3: eVerify PhilSys Match\nSame frame → POST /api/verify/philsys]
    D --> |Step 4 incomplete| G[Step 4: Business Profile Input\nName, Type, Reg No.]
    D --> |Step 5 incomplete| H[Step 5: Business Registry Verification\nAuto-route to DTI/SEC/CDA + BIR + LGU]
    D --> |Step 6 incomplete| I[Step 6: Financial Information\nRevenue, Assets, Liabilities, Existing Loans]
    D --> |All complete| J([Onboarding Complete → Loan Application Unlocked])

    E --> |livenessScore >= 90%| F
    E --> |livenessScore < 90%| E
    F --> |matchScore >= 85%| G
    F --> |matchScore < 85%| K[Prompt retry / fallback upload]
    G --> H
    H --> |Verified| I
    H --> |Failed| L[Show specific error, allow retry]
    I --> J
```

## 2. Onboarding Progress SQLite Schema

```sql
CREATE TABLE onboarding_progress (
    user_id TEXT PRIMARY KEY,
    egov_sso_completed INTEGER DEFAULT 0,       -- boolean
    efacial_completed INTEGER DEFAULT 0,
    everify_completed INTEGER DEFAULT 0,
    business_profile_id TEXT,                    -- FK to business_profiles
    business_verify_completed INTEGER DEFAULT 0,
    financial_profile_id TEXT,                   -- FK to financial_profiles
    financials_completed INTEGER DEFAULT 0,
    current_step TEXT DEFAULT 'EGOV_SSO',       -- Latest incomplete step key
    completed_at TEXT,                           -- ISO timestamp when all done
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 3. Onboarding Status API Response

### GET /api/onboarding/status
```json
{
  "success": true,
  "currentStep": "BUSINESS_VERIFY",
  "percentComplete": 66,
  "steps": {
    "EGOV_SSO": "COMPLETE",
    "EFACIAL": "COMPLETE",
    "EVERIFY": "COMPLETE",
    "BUSINESS_PROFILE": "COMPLETE",
    "BUSINESS_VERIFY": "PENDING",
    "FINANCIALS": "LOCKED"
  }
}
```

## 4. Business Verification Routing Logic

```typescript
type BusinessType = 'Sole Proprietorship' | 'Partnership' | 'Corporation' | 'Cooperative';

async function routeBusinessVerification(
  businessType: BusinessType,
  registrationNumber: string,
  birTin: string,
  lguPermitNumber: string
): Promise<{ verified: boolean; failedChecks: string[] }> {
  const failedChecks: string[] = [];

  // Primary registry check
  if (businessType === 'Sole Proprietorship') {
    const dtiOk = await dtiAdapter.verify(registrationNumber);
    if (!dtiOk) failedChecks.push('DTI');
  } else if (businessType === 'Corporation' || businessType === 'Partnership') {
    const secOk = await secAdapter.verify(registrationNumber);
    if (!secOk) failedChecks.push('SEC');
  } else if (businessType === 'Cooperative') {
    const cdaOk = await cdaAdapter.verify(registrationNumber);
    if (!cdaOk) failedChecks.push('CDA');
  }

  // Universal secondary checks
  const birOk = await birAdapter.verify(birTin);
  if (!birOk) failedChecks.push('BIR');

  if (lguPermitNumber) {
    const lguOk = await lguAdapter.verify(lguPermitNumber);
    if (!lguOk) failedChecks.push('LGU');
  }

  return { verified: failedChecks.length === 0, failedChecks };
}
```

## 5. Mobile Screen Map

| Screen | Route | Purpose |
|---|---|---|
| `LoginScreen` | `/login` | eGovPH SSO entry point |
| `FaceLivenessScreen` | `/onboarding/face` | eFacial camera scanner |
| `IdentityVerifyScreen` | `/onboarding/identity` | eVerify result display |
| `BusinessProfileScreen` | `/onboarding/business` | Form: name, type, reg no. |
| `BusinessVerifyScreen` | `/onboarding/business/verify` | Trigger + status of registry check |
| `FinancialsScreen` | `/onboarding/financials` | Revenue, assets, liabilities form |
| `OnboardingCompleteScreen` | `/onboarding/complete` | All steps done → CTA to apply |
