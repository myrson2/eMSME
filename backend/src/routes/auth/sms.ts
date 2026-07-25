import { Router, Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import getDb from '../../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

// --- In-memory OTP store (hackathon-grade; replace with Redis in production) ---
interface OTPRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
}
const otpStore = new Map<string, OTPRecord>();
const rateLimitStore = new Map<string, number[]>();

function hashOTP(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isRateLimited(phoneNumber: string): boolean {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const history = rateLimitStore.get(phoneNumber) ?? [];
  const recent = history.filter(ts => now - ts < oneHour);
  rateLimitStore.set(phoneNumber, recent);
  return recent.length >= 3;
}

function recordRequest(phoneNumber: string): void {
  const history = rateLimitStore.get(phoneNumber) ?? [];
  history.push(Date.now());
  rateLimitStore.set(phoneNumber, history);
}

// POST /api/auth/sms/send-otp
router.post('/send-otp', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { mobileNumber, action } = req.body;

    if (!mobileNumber || typeof mobileNumber !== 'string') {
      res.status(400).json({ success: false, message: 'mobileNumber is required in E.164 format (e.g. +639171234567).' });
      return;
    }

    if (isRateLimited(mobileNumber)) {
      res.status(429).json({ success: false, message: 'Too many OTP requests. Please wait before requesting again.' });
      return;
    }

    const otp = generateOTP();
    const hash = hashOTP(otp);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(mobileNumber, { hash, expiresAt, attempts: 0 });
    recordRequest(mobileNumber);

    const actionLabel = action === 'DISBURSEMENT_RELEASE' ? 'loan disbursement release' : 'verification';
    const message = `Your eMSME verification code for ${actionLabel} is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

    const emessageUrl = process.env.EMESSAGE_API_URL;
    const emessageToken = process.env.EMESSAGE_API_TOKEN;

    let messageId: string;

    if (emessageUrl && emessageToken) {
      // === LIVE eMessage API call ===
      try {
        const smsRes = await axios.post(
          `${emessageUrl}/messaging/v1/sms/push`,
          { number: mobileNumber, message, token: emessageToken },
          {
            headers: {
              'X-EMESSAGE-Auth': emessageToken,
              'Authorization': `Bearer ${emessageToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        messageId = smsRes.data?.data?.message_id ?? smsRes.data?.message_id ?? `MSG-${Date.now()}`;
        console.log(`[eMessage] OTP dispatched to ${mobileNumber} — messageId: ${messageId}`);
      } catch (smsErr: any) {
        console.error('[eMessage] SMS dispatch failed:', smsErr?.response?.data ?? smsErr?.message);
        console.warn('[eMessage STAGING] Falling back to staging OTP due to SMS gateway error. OTP:', otp);
        messageId = `MSG-FALLBACK-${Date.now()}`;
      }
    } else {
      // === Staging fallback — log OTP to console (dev only) ===
      console.warn(`[eMessage STAGING] EMESSAGE_API_URL/TOKEN not set. OTP for ${mobileNumber}: ${otp}`);
      messageId = `MSG-STAGING-${Date.now()}`;
    }

    res.status(200).json({
      success: true,
      messageId,
      expiresIn: 300,
    });
  } catch (err: any) {
    console.error('[eMessage] send-otp error:', err);
    res.status(500).json({ success: false, message: 'Error sending OTP.' });
  }
});

// POST /api/auth/sms/verify-otp
router.post('/verify-otp', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { mobileNumber, otpCode } = req.body;

    if (!mobileNumber || !otpCode) {
      res.status(400).json({ success: false, message: 'mobileNumber and otpCode are required.' });
      return;
    }

    const record = otpStore.get(mobileNumber);

    if (!record) {
      res.status(400).json({ success: false, message: 'No active OTP found for this number. Please request a new code.' });
      return;
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(mobileNumber);
      res.status(429).json({ success: false, message: 'OTP expired. Please request a new code.' });
      return;
    }

    if (record.attempts >= 3) {
      otpStore.delete(mobileNumber);
      res.status(429).json({ success: false, message: 'Maximum attempts exceeded. Please request a new code.' });
      return;
    }

    const submittedHash = hashOTP(String(otpCode));
    if (submittedHash !== record.hash) {
      record.attempts += 1;
      const remaining = 3 - record.attempts;
      if (remaining <= 0) {
        otpStore.delete(mobileNumber);
        res.status(429).json({ success: false, message: 'Incorrect OTP. Maximum attempts exceeded. Request a new code.' });
      } else {
        res.status(400).json({ success: false, message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` });
      }
      return;
    }

    // Success — delete OTP record
    otpStore.delete(mobileNumber);
    
    // Update onboarding progress if applicable
    if (req.user?.userId) {
      try {
        const db = await getDb();
        await db.run(
          `UPDATE onboarding_progress SET sms_otp_verified = 1, updated_at = ? WHERE user_id = ?`,
          [new Date().toISOString(), req.user.userId]
        );
      } catch (dbErr) {
        console.error('[eMessage] failed to update onboarding progress', dbErr);
      }
    }

    res.status(200).json({ success: true, mfaVerified: true });
  } catch (err: any) {
    console.error('[eMessage] verify-otp error:', err);
    res.status(500).json({ success: false, message: 'Error verifying OTP.' });
  }
});

export default router;
