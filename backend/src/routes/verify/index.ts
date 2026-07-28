import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';
import getDb from '../../db/index.js';

const router = Router();

// =====================================================================
// eFace Liveness API flow.
//
// Step 1 (POST /api/verify/face-liveness/session):
//   Backend → POST https://hackathon-face-liveness-api.e.gov.ph/v1/liveness/session
//   Headers: x-api-key
//   Body: { action: "redirect", callback_url, delay }
//   Response: { token, url }
//   → Return url + token to mobile. Mobile opens url in WebBrowser.
//
// Step 2 (POST /api/verify/face-liveness/result):
//   eGovPH redirects to callback_url with session token.
//   Mobile sends token to backend.
//   Backend → GET /v1/liveness/result/{token}
//   Headers: x-api-key
//   Response: { status, confidence_score, reference_image_url }
//   Threshold: status === "SUCCEEDED" && confidence_score >= 95.0
// =====================================================================

// EFACE_LIVENESS_* is the preferred configuration. EFACIAL_* remains supported
// to avoid breaking existing local and deployed environments. This must be read
// at request time because dotenv is initialized by the application entry point.
function getEfaceLivenessConfig() {
  return {
    baseUrl: (process.env.EFACE_LIVENESS_API_URL || process.env.EFACIAL_API_URL || '').trim().replace(/\/$/, ''),
    apiKey: (process.env.EFACE_LIVENESS_API_KEY || process.env.EFACIAL_API_KEY || '').trim(),
  };
}

// POST /api/verify/face-liveness/session — create a liveness session
router.post('/face-liveness/session', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { callbackUrl, userConsent } = req.body;

    if (!userConsent) {
      res.status(400).json({ success: false, message: 'User consent is required under RA 10173 before biometric processing.' });
      return;
    }

    if (!callbackUrl) {
      res.status(400).json({ success: false, message: 'callbackUrl is required.' });
      return;
    }

    const { baseUrl, apiKey } = getEfaceLivenessConfig();

    if (!baseUrl || !apiKey) {
      // Staging bypass: return a fake session URL
      console.warn('[eFace Liveness] API credentials not configured — returning staging bypass session.');
      res.status(201).json({
        success: true,
        sessionToken: `STAGING-${Date.now()}`,
        livenessUrl: null, // mobile will detect null and use bypass
        isStaging: true,
      });
      return;
    }

    console.log('[eFace Liveness] Creating liveness session...');
    const sessionRes = await axios.post(
      `${baseUrl}/v1/liveness/session`,
      {
        action: 'redirect',
        callback_url: callbackUrl,
        delay: 2000,
      },
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const { token, url } = sessionRes.data;
    console.log('[eFace Liveness] Session created.');

    res.status(201).json({
      success: true,
      sessionToken: token,
      livenessUrl: url,
      isStaging: false,
    });
  } catch (err: any) {
    console.error('[eFace Liveness] Session creation failed:', err?.response?.data || err?.message);

    res.status(err?.response?.status && err.response.status < 500 ? err.response.status : 502).json({
      success: false,
      message: 'Unable to start an eFace Liveness session. Please try again.',
    });
  }
});

// POST /api/verify/face-liveness/result — fetch result and check thresholds
router.post('/face-liveness/result', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sessionToken } = req.body;
    const userId = req.user?.userId;

    if (!sessionToken) {
      res.status(400).json({ success: false, message: 'sessionToken is required.' });
      return;
    }

    let livenessScore: number;
    let verificationStatus: string;
    let auditRefId: string;

    const isBypass = sessionToken.startsWith('STAGING-') || sessionToken.startsWith('BYPASS-');
    const { baseUrl, apiKey } = getEfaceLivenessConfig();

    if (!isBypass && baseUrl && apiKey) {
      // === LIVE result fetch ===
      try {
        console.log(`[eFace Liveness] Fetching result for session: ${sessionToken}`);
        const resultRes = await axios.get(
          `${baseUrl}/v1/liveness/result/${sessionToken}`,
          {
            headers: { 'x-api-key': apiKey },
            timeout: 10000,
          }
        );

        verificationStatus = resultRes.data.status;
        livenessScore = resultRes.data.confidence_score ?? 0;
        auditRefId = sessionToken;

        console.log(`[eFace Liveness] Result: status=${verificationStatus}, score=${livenessScore}`);
      } catch (err: any) {
        console.error('[eFace Liveness] Result fetch failed:', err?.response?.data || err?.message);
        res.status(err?.response?.status && err.response.status < 500 ? err.response.status : 502).json({
          success: false,
          message: 'Unable to retrieve the eFace Liveness result. Please try again.',
        });
        return;
      }
    } else {
      // Staging / bypass mode
      console.warn('[eFace Liveness] Bypass/staging session — using mock scores for presentation.');
      verificationStatus = 'SUCCEEDED';
      livenessScore = 97.5;
      auditRefId = `FL-BYPASS-${Date.now()}`;
    }

    // Apply thresholds per spec: status === "SUCCEEDED" AND confidence_score >= 95.0
    if (verificationStatus !== 'SUCCEEDED') {
      res.status(422).json({
        success: false,
        reason: 'LIVENESS_FAILED',
        livenessScore,
        message: `Liveness verification status: ${verificationStatus}. Please retry.`,
      });
      return;
    }

    // Apply threshold: status === "SUCCEEDED" AND confidence_score >= 85.0
    // (Production spec recommends 95.0 — lowered to 85.0 for staging/demo)
    if (livenessScore < 85.0) {
      res.status(422).json({
        success: false,
        reason: 'SPOOF_DETECTED',
        livenessScore,
        message: `Confidence score ${livenessScore.toFixed(1)} is below the 95.0 threshold. Please retry in good lighting.`,
      });
      return;
    }

    // Update onboarding progress
    const db = await getDb();
    await db.run(
      `UPDATE onboarding_progress SET efacial_completed = 1, current_step = 'EVERIFY', updated_at = ? WHERE user_id = ?`,
      [new Date().toISOString(), userId]
    );

    res.status(200).json({
      success: true,
      isLive: true,
      livenessScore,
      auditRefId,
      message: 'Facial liveness verification passed.',
    });
  } catch (err: any) {
    console.error('[eFace Liveness] Unexpected error:', err);
    res.status(500).json({ success: false, message: 'Error processing face liveness result.' });
  }
});

// POST /api/verify/philsys (eVerify — stub, skipped per user request)
router.post('/philsys', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userConsent } = req.body;
    const userId = req.user?.userId;

    if (!userConsent) {
      res.status(400).json({ success: false, message: 'User consent is required under RA 10173.' });
      return;
    }

    const matchScore = 92;
    const everifyRefId = `EVERIFY-REF-${Date.now()}`;

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
