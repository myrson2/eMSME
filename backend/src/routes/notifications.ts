import { Router, Response } from 'express';
import axios from 'axios';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/notifications/smart-alert
router.post('/smart-alert', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // For this hackathon demo, we'll try to use the phone number from DEMO_PHONE_NUMBER in .env
    // In a real app, this would be fetched from the user's profile in the database.
    const mobileNumber = process.env.DEMO_PHONE_NUMBER;

    if (!mobileNumber) {
      res.status(400).json({ success: false, message: 'DEMO_PHONE_NUMBER is not set in .env' });
      return;
    }

    const message = '🎉 eMSME Alert: A new government grant (DTI Livelihood Seeding Program) matches your business profile! Open eMSME to apply.';

    const emessageUrl = process.env.EMESSAGE_API_URL;
    const emessageToken = process.env.EMESSAGE_API_TOKEN;

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
        const messageId = smsRes.data?.data?.message_id ?? smsRes.data?.message_id ?? `MSG-${Date.now()}`;
        console.log(`[eMessage] Smart alert SMS dispatched to ${mobileNumber} — messageId: ${messageId}`);
        
        res.status(200).json({ success: true, message: 'Smart alert SMS sent.', messageId });
      } catch (smsErr: any) {
        console.error('[eMessage] Smart alert SMS dispatch failed:', smsErr?.response?.data ?? smsErr?.message);
        res.status(500).json({ success: false, message: 'Failed to send Smart alert SMS.' });
      }
    } else {
      // === Staging fallback ===
      console.warn(`[eMessage STAGING] Smart alert SMS for ${mobileNumber}: ${message}`);
      res.status(200).json({ success: true, message: 'Smart alert SMS generated (Staging Mode).' });
    }
  } catch (err: any) {
    console.error('[Notifications error]:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
