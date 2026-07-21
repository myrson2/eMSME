# Implementation Plan & Deliverables: eGovPH SSO Integration (`egov-sso`)

## 1. Task Checklist

- [x] **Setup Environment Variables:** Define `mobile/.env.example` and `backend/.env.example`.
- [x] **Mobile Auth Hook & Screen:** Create `useEGovAuth.ts` and `LoginScreen.tsx` in the React Native app using `expo-auth-session`.
- [x] **Backend Token Exchange Route:** Create Express TypeScript router `/api/auth/egov/exchange` with strict validation, token exchange POST, userinfo GET, HTTP-Only session cookie, and error handling.
- [x] **Type Definitions:** Add comprehensive TypeScript interfaces for eGov OAuth payloads and user profile data.
- [x] **Error Handling & Edge Cases:** Ensure handling for missing code, expired code, and upstream network failures.

---

## 2. Environment Setup

### `mobile/.env.example`
```env
# eGovPH SSO Public Client Configuration
EXPO_PUBLIC_EGOV_CLIENT_ID=your_staging_client_id_here
EXPO_PUBLIC_EGOV_ENVIRONMENT=STAGING
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

### `backend/.env.example`
```env
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_signing_key_here

# eGovPH SSO Server-Side Credentials (STAGING)
EGOV_CLIENT_ID=your_staging_client_id_here
EGOV_CLIENT_SECRET=your_staging_client_secret_here
EGOV_TOKEN_URL=https://staging-sso.egov.gov.ph/api/v1/oauth/token
EGOV_USERINFO_URL=https://staging-sso.egov.gov.ph/api/v1/oauth/userinfo
```

---

## 3. Mobile Implementation (React Native + Expo)

### Hook: `mobile/src/hooks/useEGovAuth.ts`
```typescript
import * as AuthSession from 'expo-auth-session';
import { useState, useEffect } from 'react';

const EGOV_CLIENT_ID = process.env.EXPO_PUBLIC_EGOV_CLIENT_ID || '';
const EGOV_AUTHORIZATION_ENDPOINT = 'https://staging-sso.egov.gov.ph/oauth/authorize';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export const useEGovAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'emsme',
    path: 'auth/callback',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: EGOV_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
    },
    { authorizationEndpoint: EGOV_AUTHORIZATION_ENDPOINT }
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForSession(code);
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Authentication failed');
    }
  }, [response]);

  const exchangeCodeForSession = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/egov/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange_code: code }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Token exchange failed');
      }
      // On success, the backend sets an HTTP-Only cookie.
      // Depending on the networking library (e.g. fetch/axios), cookies may be handled automatically.
      console.log('User authenticated:', data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during token exchange');
    } finally {
      setLoading(false);
    }
  };

  return { request, promptAsync, loading, error };
};
```

### Component: `mobile/src/screens/LoginScreen.tsx`
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useEGovAuth } from '../hooks/useEGovAuth';

export const LoginScreen = () => {
  const { request, promptAsync, loading, error } = useEGovAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to eMSME</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity 
        style={[styles.button, (!request || loading) && styles.buttonDisabled]} 
        disabled={!request || loading}
        onPress={() => promptAsync()}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with eGovPH</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: { backgroundColor: '#0038a8', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#dc2626', marginBottom: 10, textAlign: 'center' }
});
```

---

## 4. Backend Implementation (Express + TypeScript)

### Route Handler: `backend/src/routes/auth/egov.ts`
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = Router();

// ==========================================
// TypeScript Interfaces
// ==========================================

export interface ExchangeRequestBody {
  exchange_code?: string;
}

export interface EGovTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface EGovUserProfile {
  sub: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  email_verified: boolean;
  mobile_number?: string;
}

export interface AuthSuccessResponseBody {
  success: true;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface AuthErrorResponseBody {
  success: false;
  message: string;
  errorCode?: string;
}

// ==========================================
// Route: POST /api/auth/egov/exchange
// ==========================================
router.post(
  '/exchange',
  async (
    req: Request<{}, {}, ExchangeRequestBody>,
    res: Response<AuthSuccessResponseBody | AuthErrorResponseBody>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { exchange_code } = req.body;

      // 1. Edge Case: Check for missing exchange code
      if (!exchange_code || typeof exchange_code !== 'string' || exchange_code.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Missing or invalid required parameter: exchange_code',
          errorCode: 'ERR_MISSING_EXCHANGE_CODE',
        });
        return;
      }

      // 2. Validate Environment Variables
      const tokenUrl = process.env.EGOV_TOKEN_URL || 'https://staging-sso.egov.gov.ph/api/v1/oauth/token';
      const userInfoUrl = process.env.EGOV_USERINFO_URL || 'https://staging-sso.egov.gov.ph/api/v1/oauth/userinfo';
      const clientId = process.env.EGOV_CLIENT_ID;
      const clientSecret = process.env.EGOV_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error('[eGov Auth Error]: Backend environment variables EGOV_CLIENT_ID or EGOV_CLIENT_SECRET are missing.');
        res.status(500).json({
          success: false,
          message: 'Server configuration error during OAuth processing.',
          errorCode: 'ERR_MISSING_SERVER_CREDS',
        });
        return;
      }

      // 3. Exchange single-use exchange_code for Access Token
      let tokenResponse: EGovTokenResponse;
      try {
        const tokenRes = await axios.post<EGovTokenResponse>(
          tokenUrl,
          {
            grant_type: 'authorization_code',
            code: exchange_code,
            client_id: clientId,
            client_secret: clientSecret,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 10000, // 10s timeout
          }
        );
        tokenResponse = tokenRes.data;
      } catch (tokenErr: any) {
        console.error(
          '[eGov Token Exchange Failed]:',
          tokenErr.response?.data || tokenErr.message
        );

        const status = tokenErr.response?.status || 400;
        const msg =
          tokenErr.response?.data?.error_description ||
          tokenErr.response?.data?.message ||
          'Exchange code is invalid, expired, or already used.';

        res.status(status >= 500 ? 502 : 400).json({
          success: false,
          message: msg,
          errorCode: 'ERR_TOKEN_EXCHANGE_FAILED',
        });
        return;
      }

      const { access_token } = tokenResponse;

      if (!access_token) {
        res.status(502).json({
          success: false,
          message: 'Upstream eGov service did not return a valid access token.',
          errorCode: 'ERR_NO_ACCESS_TOKEN',
        });
        return;
      }

      // 4. Fetch Verified User Profile from UserInfo Endpoint
      let userProfile: EGovUserProfile;
      try {
        const profileRes = await axios.get<EGovUserProfile>(userInfoUrl, {
          headers: {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
          },
          timeout: 10000,
        });
        userProfile = profileRes.data;
      } catch (profileErr: any) {
        console.error(
          '[eGov UserInfo Fetch Failed]:',
          profileErr.response?.data || profileErr.message
        );
        res.status(502).json({
          success: false,
          message: 'Failed to retrieve verified user profile from eGovPH.',
          errorCode: 'ERR_USERINFO_FETCH_FAILED',
        });
        return;
      }

      // 5. Create Session & Issue Secure HTTP-Only Cookie
      const sessionPayload = {
        userId: userProfile.sub,
        email: userProfile.email,
        name: `${userProfile.first_name} ${userProfile.last_name}`,
        authProvider: 'eGovPH',
      };

      const jwtSecret = process.env.JWT_SECRET || 'dev_secret_fallback_key';
      const sessionToken = jwt.sign(sessionPayload, jwtSecret, { expiresIn: '24h' });

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('emsme_session', sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      // 6. Return Success Response (Excluding Secrets)
      res.status(200).json({
        success: true,
        user: {
          id: userProfile.sub,
          email: userProfile.email,
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
        },
      });
    } catch (err: any) {
      console.error('[eGov Auth Controller Unhandled Error]:', err);
      next(err);
    }
  }
);

export default router;
```
