import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import getDb from '../../db';

const router = Router();

// POST /api/verify/face-liveness (eFacial)
router.post('/face-liveness', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { faceBase64 } = req.body;
    const userId = req.user?.userId;

    if (!faceBase64) {
      res.status(400).json({ success: false, message: 'faceBase64 image frame required.' });
      return;
    }

    // Biometric privacy guardrail: faceBase64 is NOT saved to disk or DB.
    // In staging/dev mode, evaluate liveness score
    const livenessScore = 95; // Mock score >= 90% threshold

    if (livenessScore < 90) {
      res.status(422).json({ success: false, errorCode: 'SPOOF_DETECTED', message: 'Liveness check failed. Spoof suspected.' });
      return;
    }

    const db = await getDb();
    await db.run(
      `UPDATE onboarding_progress SET efacial_completed = 1, current_step = 'EVERIFY', updated_at = ? WHERE user_id = ?`,
      [new Date().toISOString(), userId]
    );

    res.status(200).json({
      success: true,
      livenessScore,
      message: 'eFacial liveness verification passed.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Error processing face liveness.' });
  }
});

// POST /api/verify/philsys (eVerify)
router.post('/philsys', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { philSysCardNumber, userConsent } = req.body;
    const userId = req.user?.userId;

    if (!userConsent) {
      res.status(400).json({ success: false, message: 'User consent is required under RA 10173.' });
      return;
    }

    const matchScore = 92; // Mock score >= 85% threshold
    const everifyRefId = `EVERIFY-REF-${Date.now()}`;

    if (matchScore < 85) {
      res.status(422).json({ success: false, errorCode: 'IDENTITY_MISMATCH', message: 'PhilSys identity match score below threshold.' });
      return;
    }

    const db = await getDb();
    await db.run('UPDATE users SET isPhilSysVerified = 1 WHERE id = ?', [userId]);
    await db.run(
      `UPDATE onboarding_progress SET everify_completed = 1, current_step = 'BUSINESS_PROFILE', updated_at = ? WHERE user_id = ?`,
      [new Date().toISOString(), userId]
    );

    res.status(200).json({
      success: true,
      matchScore,
      everifyRefId,
      message: 'PhilSys identity verified successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Error processing PhilSys identity verification.' });
  }
});

export default router;
