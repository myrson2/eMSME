import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import getDb from '../db/index.js';

export type OnboardingStep =
  | 'EGOV_SSO'
  | 'EFACIAL'
  | 'EVERIFY'
  | 'BUSINESS_PROFILE'
  | 'BUSINESS_VERIFY'
  | 'FINANCIALS';

const STEP_DB_COLUMNS: Record<OnboardingStep, string> = {
  EGOV_SSO: 'egov_sso_completed',
  EFACIAL: 'efacial_completed',
  EVERIFY: 'everify_completed',
  BUSINESS_PROFILE: 'business_profile_id',
  BUSINESS_VERIFY: 'business_verify_completed',
  FINANCIALS: 'financials_completed',
};

export function requireStepComplete(step: OnboardingStep) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'User not authenticated.' });
        return;
      }

      const db = await getDb();
      const progress = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [userId]);

      const col = STEP_DB_COLUMNS[step];
      if (!progress || !progress[col]) {
        res.status(403).json({
          success: false,
          errorCode: 'STEP_NOT_UNLOCKED',
          message: `Complete prerequisite step '${step}' before proceeding.`,
        });
        return;
      }
      next();
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Server error checking onboarding status.' });
    }
  };
}
