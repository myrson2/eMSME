import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';
import { requireStepComplete } from '../../middleware/requireOnboardingStep.js';
import { routeBusinessVerification } from '../../services/businessVerification.js';

const router = Router();

// GET /api/onboarding/status
router.get('/status', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const db = await getDb();
    const p = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [userId]);

    if (!p) {
      res.status(200).json({
        success: true,
        currentStep: 'EGOV_SSO',
        percentComplete: 0,
        steps: {
          EGOV_SSO: 'PENDING',
          EFACIAL: 'LOCKED',
          SMS_OTP: 'LOCKED',
          EVERIFY: 'LOCKED',
          BUSINESS_PROFILE: 'LOCKED',
          BUSINESS_VERIFY: 'LOCKED',
          FINANCIALS: 'LOCKED',
        },
      });
      return;
    }

    const steps = {
      EGOV_SSO: p.egov_sso_completed ? 'COMPLETE' : 'PENDING',
      EFACIAL: p.egov_sso_completed ? (p.efacial_completed ? 'COMPLETE' : 'PENDING') : 'LOCKED',
      SMS_OTP: p.efacial_completed ? (p.sms_otp_verified ? 'COMPLETE' : 'PENDING') : 'LOCKED',
      EVERIFY: p.sms_otp_verified ? (p.everify_completed ? 'COMPLETE' : 'PENDING') : 'LOCKED',
      BUSINESS_PROFILE: p.everify_completed ? (p.business_profile_id ? 'COMPLETE' : 'PENDING') : 'LOCKED',
      BUSINESS_VERIFY: p.business_profile_id ? (p.business_verify_completed ? 'COMPLETE' : 'PENDING') : 'LOCKED',
      FINANCIALS: p.business_verify_completed ? (p.financials_completed ? 'COMPLETE' : 'PENDING') : 'LOCKED',
    };

    const completedCount = Object.values(steps).filter(s => s === 'COMPLETE').length;
    const percentComplete = Math.round((completedCount / 7) * 100);

    const pendingPair = Object.entries(steps).find(([, v]) => v === 'PENDING');
    const currentStep = pendingPair ? pendingPair[0] : (completedCount === 7 ? 'COMPLETE' : 'EGOV_SSO');

    res.status(200).json({ success: true, currentStep, percentComplete, steps });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch onboarding status.' });
  }
});

// POST /api/onboarding/business/profile
router.post(
  '/business/profile',
  authenticateToken,
  requireStepComplete('EVERIFY'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { businessName, tradeName, businessType, registrationNumber, industryCategory, yearsInOperation, birTin, lguPermitNumber } = req.body;
      const userId = req.user?.userId;

      if (!businessName || !businessType || !registrationNumber || !birTin) {
        res.status(400).json({ success: false, message: 'businessName, businessType, registrationNumber, and birTin are required.' });
        return;
      }

      const db = await getDb();
      const businessId = uuidv4();

      await db.run(
        `INSERT INTO business_profiles
         (id, owner_id, business_name, trade_name, business_type, registration_number, industry_category, years_in_operation, bir_tin, lgu_permit_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [businessId, userId, businessName, tradeName || null, businessType, registrationNumber, industryCategory || null, yearsInOperation || 1, birTin, lguPermitNumber || null]
      );

      await db.run(
        `UPDATE onboarding_progress SET business_profile_id = ?, current_step = 'BUSINESS_VERIFY', updated_at = ? WHERE user_id = ?`,
        [businessId, new Date().toISOString(), userId]
      );

      res.status(200).json({ success: true, businessId, message: 'Business profile created.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to save business profile.' });
    }
  }
);

// POST /api/onboarding/business/verify
router.post(
  '/business/verify',
  authenticateToken,
  requireStepComplete('BUSINESS_PROFILE'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const db = await getDb();
      const progress = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [userId]);

      if (!progress?.business_profile_id) {
        res.status(400).json({ success: false, message: 'No business profile found to verify.' });
        return;
      }

      const business = await db.get('SELECT * FROM business_profiles WHERE id = ?', [progress.business_profile_id]);

      const result = await routeBusinessVerification(
        business.business_type,
        business.registration_number,
        business.bir_tin,
        business.lgu_permit_number
      );

      const nowIso = new Date().toISOString();

      if (!result.verified) {
        await db.run(
          `UPDATE business_profiles SET verification_checks_json = ? WHERE id = ?`,
          [JSON.stringify(result.results), business.id]
        );
        res.status(422).json({
          success: false,
          message: 'Government registry verification failed.',
          failedChecks: result.failedChecks,
          results: result.results,
        });
        return;
      }

      await db.run(
        `UPDATE business_profiles SET
          is_gov_verified = 1,
          bir_tin_verified = 1,
          lgu_permit_verified = 1,
          verification_checks_json = ?,
          verified_at = ?
         WHERE id = ?`,
        [JSON.stringify(result.results), nowIso, business.id]
      );

      await db.run(
        `UPDATE onboarding_progress SET business_verify_completed = 1, current_step = 'FINANCIALS', updated_at = ? WHERE user_id = ?`,
        [nowIso, userId]
      );

      res.status(200).json({ success: true, message: 'Business verified across DTI/SEC/CDA, BIR, and LGU registries.', results: result.results });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Business verification routing error.' });
    }
  }
);

// POST /api/onboarding/financials
router.post(
  '/financials',
  authenticateToken,
  requireStepComplete('BUSINESS_VERIFY'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { monthlyRevenue, annualIncome, totalAssets, totalLiabilities, existingLoans } = req.body;
      const userId = req.user?.userId;

      if (typeof monthlyRevenue !== 'number' || monthlyRevenue <= 0) {
        res.status(400).json({ success: false, message: 'monthlyRevenue must be a positive number.' });
        return;
      }

      const db = await getDb();
      const progress = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [userId]);

      const financialId = uuidv4();
      const nowIso = new Date().toISOString();

      await db.run(
        `INSERT INTO financial_profiles (id, business_id, monthly_revenue, annual_income, total_assets, total_liabilities, existing_loans_json, declared_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [financialId, progress.business_profile_id, monthlyRevenue, annualIncome || monthlyRevenue * 12, totalAssets || 0, totalLiabilities || 0, JSON.stringify(existingLoans || []), nowIso]
      );

      await db.run(
        `UPDATE onboarding_progress SET financial_profile_id = ?, financials_completed = 1, current_step = 'COMPLETE', completed_at = ?, updated_at = ? WHERE user_id = ?`,
        [financialId, nowIso, nowIso, userId]
      );

      res.status(200).json({ success: true, financialId, message: 'Financial profile saved. User onboarding complete!' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to save financial profile.' });
    }
  }
);

export default router;
