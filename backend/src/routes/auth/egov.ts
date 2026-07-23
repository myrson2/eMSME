import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../db/index.js';

const router = Router();

// =====================================================================
// eGovPH SSO — Correct API flow per hackathon documentation:
//
// Step 1: POST /api/token
//   Body: { exchange_code, scope: "SSO_AUTHENTICATION", partner_code, partner_secret }
//   Response: { access_token }
//
// Step 2: POST /api/partner/sso_authentication
//   Header: Authorization: Bearer <access_token>
//   Response: { data: { uniqid, first_name, last_name, email, mobile, ... } }
//
// Base URL: https://hackathon-sso.e.gov.ph
// =====================================================================

const EGOV_BASE_URL = process.env.EGOV_BASE_URL || 'https://hackathon-sso.e.gov.ph';
const PARTNER_CODE = process.env.EGOV_CLIENT_ID || '';
const PARTNER_SECRET = process.env.EGOV_CLIENT_SECRET || '';

export interface ExchangeRequestBody {
  exchange_code?: string;
  code?: string;
}

interface EGovTokenResponse {
  access_token: string;
}

interface EGovUserProfile {
  uniqid: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  mobile?: string;
  birth_date?: string;
  address?: string;
  photo?: string;
  gender?: string;
  nationality?: string;
  national_id?: {
    pcn?: string;
    face_url?: string;
  };
}

// POST /api/auth/egov/exchange  (or /api/auth/exchange)
router.post(
  '/exchange',
  async (req: Request<{}, {}, ExchangeRequestBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const exchange_code = req.body.exchange_code || req.body.code;

      if (!exchange_code || typeof exchange_code !== 'string' || exchange_code.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: exchange_code',
          errorCode: 'ERR_MISSING_EXCHANGE_CODE',
        });
        return;
      }

      let userProfile: EGovUserProfile;
      const isBypassCode = exchange_code.startsWith('hackathon_bypass_code_');

      if (!isBypassCode) {
        // === LIVE eGovPH SSO flow ===
        try {
          // Step 1: Exchange code for access token
          console.log(`[eGov SSO] Exchanging code at ${EGOV_BASE_URL}/api/token`);
          const tokenRes = await axios.post<EGovTokenResponse>(
            `${EGOV_BASE_URL}/api/token`,
            {
              exchange_code,
              scope: 'SSO_AUTHENTICATION',
              partner_code: PARTNER_CODE,
              partner_secret: PARTNER_SECRET,
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000,
            }
          );

          const access_token = tokenRes.data.access_token;
          if (!access_token) {
            throw new Error('No access_token in token response.');
          }

          console.log('[eGov SSO] Access token obtained. Fetching user profile...');

          // Step 2: Get user profile with Bearer token
          const profileRes = await axios.post<{ data: EGovUserProfile }>(
            `${EGOV_BASE_URL}/api/partner/sso_authentication`,
            null,
            {
              headers: { Authorization: `Bearer ${access_token}` },
              timeout: 10000,
            }
          );

          userProfile = profileRes.data.data;
          console.log(`[eGov SSO] Profile fetched for: ${userProfile.uniqid}`);
        } catch (upstreamErr: any) {
          const status = upstreamErr?.response?.status;
          const upstreamMsg = upstreamErr?.response?.data?.message || upstreamErr?.message;
          console.error('[eGov SSO] Upstream error:', status, upstreamMsg);

          if (status === 422) {
            res.status(422).json({
              success: false,
              message: 'Exchange code is invalid or has already been used.',
              errorCode: 'ERR_INVALID_EXCHANGE_CODE',
            });
            return;
          } else if (status === 403) {
            res.status(403).json({
              success: false,
              message: 'Partner credentials are invalid or not authorized.',
              errorCode: 'ERR_PARTNER_FORBIDDEN',
            });
            return;
          }

          // Unresolvable upstream (server down) — use demo fallback
          console.warn('[eGov SSO] Upstream unreachable. Using presentation fallback profile.');
          userProfile = {
            uniqid: `egov-demo-${Date.now()}`,
            first_name: 'Juan',
            last_name: 'Dela Cruz',
            middle_name: 'Santos',
            email: `juan.delacruz.${Date.now()}@yopmail.com`,
            mobile: '+639171234567',
            birth_date: '1990-01-01',
            gender: 'male',
            nationality: 'Filipino',
          };
        }
      } else {
        // === Demo bypass mode (when SSO website is down for presentation) ===
        console.warn('[eGov SSO] Demo bypass code detected. Using mock profile for presentation.');
        userProfile = {
          uniqid: `egov-demo-${Date.now()}`,
          first_name: 'Juan',
          last_name: 'Dela Cruz',
          middle_name: 'Santos',
          email: `juan.delacruz.${Date.now()}@yopmail.com`,
          mobile: '+639171234567',
          birth_date: '1990-01-01',
          gender: 'male',
          nationality: 'Filipino',
        };
      }

      // Upsert user in DB — match on uniqid first, then email
      const db = await getDb();
      let user = await db.get(
        'SELECT * FROM users WHERE philSysId = ? OR email = ?',
        [userProfile.uniqid, userProfile.email]
      );

      const userId = user ? user.id : uuidv4();

      if (!user) {
        await db.run(
          `INSERT INTO users (id, philSysId, firstName, lastName, middleName, email, mobileNumber, isPhilSysVerified)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            userId,
            userProfile.uniqid,
            userProfile.first_name,
            userProfile.last_name,
            userProfile.middle_name || null,
            userProfile.email,
            userProfile.mobile || null,
          ]
        );

        await db.run(
          `INSERT INTO onboarding_progress (user_id, egov_sso_completed, current_step)
           VALUES (?, 1, 'EFACIAL')`,
          [userId]
        );
      } else {
        await db.run(
          `UPDATE users SET philSysId = ?, firstName = ?, lastName = ?, mobileNumber = ? WHERE id = ?`,
          [userProfile.uniqid, userProfile.first_name, userProfile.last_name, userProfile.mobile || user.mobileNumber, userId]
        );
        await db.run(
          `UPDATE onboarding_progress SET egov_sso_completed = 1 WHERE user_id = ?`,
          [userId]
        );
      }

      const sessionPayload = {
        userId,
        email: userProfile.email,
        name: `${userProfile.first_name} ${userProfile.last_name}`,
      };

      const jwtSecret = process.env.JWT_SECRET || 'dev_secret_fallback_key';
      const sessionToken = jwt.sign(sessionPayload, jwtSecret, { expiresIn: '24h' });

      res.cookie('emsme_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(200).json({
        success: true,
        token: sessionToken,
        user: {
          id: userId,
          email: userProfile.email,
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
          name: `${userProfile.first_name} ${userProfile.last_name}`,
          uniqid: userProfile.uniqid,
          mobile: userProfile.mobile,
          birthDate: userProfile.birth_date,
          gender: userProfile.gender,
        },
      });
    } catch (err: any) {
      next(err);
    }
  }
);

// GET /api/auth/session
router.get('/session', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const tokenFromCookie = req.cookies?.emsme_session;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    res.status(200).json({ authenticated: false, user: null });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev_secret_fallback_key';
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    res.status(200).json({ authenticated: true, user: decoded });
  } catch (err) {
    res.status(200).json({ authenticated: false, user: null });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('emsme_session', { path: '/' });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

export default router;
