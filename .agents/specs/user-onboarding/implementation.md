# Implementation Tasks & Deliverables: User Onboarding (`user-onboarding`)

## 1. Task Checklist
- [ ] **Database Schema:** Create SQLite migration for `onboarding_progress` table.
- [ ] **Status Route:** Implement `GET /api/onboarding/status` returning step completion map.
- [ ] **Step Guard Middleware:** Implement `requireStepComplete(stepKey)` middleware factory.
- [ ] **Business Profile Route:** Implement `POST /api/onboarding/business/profile`.
- [ ] **Business Verification Route:** Implement `POST /api/onboarding/business/verify` with router logic.
- [ ] **Financials Route:** Implement `POST /api/onboarding/financials`.
- [ ] **Mobile Wizard Navigator:** Create `OnboardingNavigator` in React Native with step-aware routing.
- [ ] **Step Screens:** Create all 6 step screens listed in architecture.md.
- [ ] **Resume Logic:** On app launch, call `GET /api/onboarding/status` and deep-link to `currentStep` screen.

---

## 2. Backend Implementation

### Step Guard Middleware
```typescript
// backend/src/middleware/requireOnboardingStep.ts
import { Request, Response, NextFunction } from 'express';
import db from '../db';

type OnboardingStep = 'EGOV_SSO' | 'EFACIAL' | 'EVERIFY' | 'BUSINESS_PROFILE' | 'BUSINESS_VERIFY' | 'FINANCIALS';

const STEP_DB_COLUMNS: Record<OnboardingStep, string> = {
  EGOV_SSO:         'egov_sso_completed',
  EFACIAL:          'efacial_completed',
  EVERIFY:          'everify_completed',
  BUSINESS_PROFILE: 'business_profile_id',
  BUSINESS_VERIFY:  'business_verify_completed',
  FINANCIALS:       'financials_completed',
};

export function requireStepComplete(step: OnboardingStep) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).user.userId;
    const progress = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [userId]);

    const col = STEP_DB_COLUMNS[step];
    if (!progress || !progress[col]) {
      res.status(403).json({
        success: false,
        errorCode: 'STEP_NOT_UNLOCKED',
        message: `Complete step '${step}' before proceeding.`,
      });
      return;
    }
    next();
  };
}
```

### Route: `backend/src/routes/onboarding/index.ts`
```typescript
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db';
import { requireStepComplete } from '../../middleware/requireOnboardingStep';
import { routeBusinessVerification } from '../../services/businessVerification';

const router = Router();

// GET /api/onboarding/status
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const p = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [userId]);

  if (!p) {
    res.status(200).json({
      success: true, currentStep: 'EGOV_SSO', percentComplete: 0,
      steps: { EGOV_SSO: 'PENDING', EFACIAL: 'LOCKED', EVERIFY: 'LOCKED', BUSINESS_PROFILE: 'LOCKED', BUSINESS_VERIFY: 'LOCKED', FINANCIALS: 'LOCKED' }
    });
    return;
  }

  const steps = {
    EGOV_SSO: p.egov_sso_completed ? 'COMPLETE' : 'PENDING',
    EFACIAL: p.egov_sso_completed ? (p.efacial_completed ? 'COMPLETE' : 'PENDING') : 'LOCKED',
    EVERIFY: p.efacial_completed ? (p.everify_completed ? 'COMPLETE' : 'PENDING') : 'LOCKED',
    BUSINESS_PROFILE: p.everify_completed ? (p.business_profile_id ? 'COMPLETE' : 'PENDING') : 'LOCKED',
    BUSINESS_VERIFY: p.business_profile_id ? (p.business_verify_completed ? 'COMPLETE' : 'PENDING') : 'LOCKED',
    FINANCIALS: p.business_verify_completed ? (p.financials_completed ? 'COMPLETE' : 'PENDING') : 'LOCKED',
  };

  const completedCount = Object.values(steps).filter(s => s === 'COMPLETE').length;
  const percentComplete = Math.round((completedCount / 6) * 100);

  const currentStep = (Object.entries(steps).find(([, v]) => v === 'PENDING') ?? ['EGOV_SSO'])[0];

  res.status(200).json({ success: true, currentStep, percentComplete, steps });
});

// POST /api/onboarding/business/profile
router.post('/business/profile', requireStepComplete('EVERIFY'), async (req: Request, res: Response): Promise<void> => {
  const { businessName, businessType, registrationNumber, birTin, lguPermitNumber } = req.body;
  const userId = (req as any).user.userId;
  const businessId = uuidv4();

  await db.run(
    `INSERT OR REPLACE INTO business_profiles (id, owner_id, business_name, business_type, registration_number, bir_tin, lgu_permit_number)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [businessId, userId, businessName, businessType, registrationNumber, birTin, lguPermitNumber]
  );

  await db.run(
    `UPDATE onboarding_progress SET business_profile_id = ?, current_step = 'BUSINESS_VERIFY', updated_at = ? WHERE user_id = ?`,
    [businessId, new Date().toISOString(), userId]
  );

  res.status(200).json({ success: true, businessId });
});

// POST /api/onboarding/business/verify
router.post('/business/verify', requireStepComplete('BUSINESS_PROFILE'), async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user.userId;
  const progress = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [userId]);
  const business = await db.get('SELECT * FROM business_profiles WHERE id = ?', [progress.business_profile_id]);

  const result = await routeBusinessVerification(
    business.business_type,
    business.registration_number,
    business.bir_tin,
    business.lgu_permit_number
  );

  if (!result.verified) {
    res.status(422).json({ success: false, message: 'Business verification failed.', failedChecks: result.failedChecks });
    return;
  }

  await db.run(`UPDATE business_profiles SET is_gov_verified = 1 WHERE id = ?`, [business.id]);
  await db.run(
    `UPDATE onboarding_progress SET business_verify_completed = 1, current_step = 'FINANCIALS', updated_at = ? WHERE user_id = ?`,
    [new Date().toISOString(), userId]
  );

  res.status(200).json({ success: true, message: 'Business verified successfully.' });
});

// POST /api/onboarding/financials
router.post('/financials', requireStepComplete('BUSINESS_VERIFY'), async (req: Request, res: Response): Promise<void> => {
  const { monthlyRevenue, annualIncome, totalAssets, totalLiabilities, existingLoans } = req.body;
  const userId = (req as any).user.userId;
  const progress = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [userId]);

  if (monthlyRevenue <= 0) {
    res.status(400).json({ success: false, message: 'Monthly revenue must be greater than 0.' });
    return;
  }

  const financialId = uuidv4();
  await db.run(
    `INSERT OR REPLACE INTO financial_profiles (id, business_id, monthly_revenue, annual_income, total_assets, total_liabilities, existing_loans_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [financialId, progress.business_profile_id, monthlyRevenue, annualIncome, totalAssets, totalLiabilities, JSON.stringify(existingLoans ?? [])]
  );

  await db.run(
    `UPDATE onboarding_progress SET financial_profile_id = ?, financials_completed = 1, completed_at = ?, current_step = 'COMPLETE', updated_at = ? WHERE user_id = ?`,
    [financialId, new Date().toISOString(), new Date().toISOString(), userId]
  );

  res.status(200).json({ success: true, message: 'Financial profile saved. Onboarding complete!' });
});

export default router;
```
