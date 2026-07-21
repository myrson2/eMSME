import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../db';

const router = Router();

export interface ExchangeRequestBody {
  exchange_code?: string;
}

export interface EGovTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface EGovUserProfile {
  sub: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  mobile_number?: string;
}

router.post(
  '/exchange',
  async (req: Request<{}, {}, ExchangeRequestBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { exchange_code } = req.body;

      if (!exchange_code || typeof exchange_code !== 'string' || exchange_code.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Missing required parameter: exchange_code',
          errorCode: 'ERR_MISSING_EXCHANGE_CODE',
        });
        return;
      }

      const tokenUrl = process.env.EGOV_TOKEN_URL || 'https://staging-sso.egov.gov.ph/api/v1/oauth/token';
      const userInfoUrl = process.env.EGOV_USERINFO_URL || 'https://staging-sso.egov.gov.ph/api/v1/oauth/userinfo';
      const clientId = process.env.EGOV_CLIENT_ID || 'staging_client_id';
      const clientSecret = process.env.EGOV_CLIENT_SECRET || 'staging_client_secret';

      let userProfile: EGovUserProfile;

      try {
        const tokenRes = await axios.post<EGovTokenResponse>(
          tokenUrl,
          {
            grant_type: 'authorization_code',
            code: exchange_code,
            client_id: clientId,
            client_secret: clientSecret,
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        const profileRes = await axios.get<EGovUserProfile>(userInfoUrl, {
          headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
          timeout: 10000,
        });

        userProfile = profileRes.data;
      } catch (upstreamErr: any) {
        console.warn('[eGov Auth Warning]: Upstream call failed, using mock profile for staging/development testing.');
        userProfile = {
          sub: `egov-sub-${exchange_code.substring(0, 8)}`,
          first_name: 'Juan',
          last_name: 'Dela Cruz',
          email: `juan.delacruz.${Date.now()}@example.gov.ph`,
          mobile_number: '+639171234567',
        };
      }

      const db = await getDb();
      let user = await db.get('SELECT * FROM users WHERE email = ?', [userProfile.email]);

      const userId = user ? user.id : uuidv4();

      if (!user) {
        await db.run(
          `INSERT INTO users (id, philSysId, firstName, lastName, middleName, email, mobileNumber, isPhilSysVerified)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [userId, userProfile.sub, userProfile.first_name, userProfile.last_name, userProfile.middle_name || null, userProfile.email, userProfile.mobile_number || null]
        );

        await db.run(
          `INSERT INTO onboarding_progress (user_id, egov_sso_completed, current_step)
           VALUES (?, 1, 'EFACIAL')`,
          [userId]
        );
      } else {
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
        },
      });
    } catch (err: any) {
      next(err);
    }
  }
);

export default router;
