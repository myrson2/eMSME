# Architecture: eGovPH SSO Integration (`egov-sso`)

## 1. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant MobileApp as React Native (Expo)
    participant ExpoAuth as expo-auth-session (In-App Browser)
    participant Express as Express Backend (TypeScript)
    participant eGovOAuth as eGovPH Auth/Token Endpoints
    participant eGovUserInfo as eGovPH UserInfo Endpoint

    User->>MobileApp: Taps "Sign in with eGovPH"
    MobileApp->>ExpoAuth: promptAsync() with STAGING ClientID
    ExpoAuth->>User: Opens Secure In-App Browser to eGovPH Portal
    User->>ExpoAuth: Authenticates & Approves Permissions
    ExpoAuth-->>MobileApp: Redirects via Deep Link with ?code=exchange_code
    
    MobileApp->>Express: POST /api/auth/egov/exchange { exchange_code }
    Note over Express: Validate request body & load process.env.EGOV_CLIENT_SECRET
    
    Express->>eGovOAuth: POST EGOV_TOKEN_URL (grant_type, code, client_id, client_secret)
    alt Token Exchange Fails (Expired / Invalid Code)
        eGovOAuth-->>Express: 400 Bad Request / 401 Unauthorized
        Express-->>MobileApp: 400/401 { success: false, message: "Invalid or expired exchange code" }
        MobileApp-->>User: Displays error notification
    else Token Exchange Succeeds
        eGovOAuth-->>Express: 200 OK { access_token, token_type, expires_in }
        
        Express->>eGovUserInfo: GET EGOV_USERINFO_URL (Headers: Authorization: Bearer access_token)
        alt UserInfo Fetch Fails
            eGovUserInfo-->>Express: 500 / 401 Error
            Express-->>MobileApp: 502 Bad Gateway { success: false, message: "Failed to fetch user profile" }
        else UserInfo Fetch Succeeds
            eGovUserInfo-->>Express: 200 OK { sub, first_name, last_name, email, ... }
            Note over Express: Create/Find User record & Generate Session Token / JWT
            Express-->>MobileApp: 200 OK + Set-Cookie (HTTP-Only, Secure, SameSite=Lax)\n{ success: true, user: { id, email, name } }
            MobileApp-->>User: Navigates to User Dashboard
        end
    end
```

## 2. Component Boundaries & Responsibilities

### Mobile Client (`mobile/src/hooks/useEGovAuth.ts` & `LoginScreen.tsx`)
- Uses `expo-auth-session` to manage the OAuth2 Authorization Code flow.
- Configures the authorization endpoint to point to eGovPH SSO portal.
- Handles the deep link redirect via `makeRedirectUri()`.
- Sends the captured `exchange_code` to the Express backend endpoint `/api/auth/egov/exchange`.
- Handles UI state (loading spinner, error messages).

### Backend (`backend/src/routes/auth/egov.ts`)
- Implements `POST /api/auth/egov/exchange` endpoint.
- Enforces strict input validation on `exchange_code`.
- Performs server-to-server POST to `EGOV_TOKEN_URL` including `EGOV_CLIENT_SECRET`.
- Performs GET request to `EGOV_USERINFO_URL` using `access_token`.
- Creates secure HTTP-only cookie (`emsme_session`) containing session payload.
- Returns clean JSON response without leaking access tokens or backend secrets.

## 3. Data Models & API Payload Structures

### Request Payload (`POST /api/auth/egov/exchange`)
```json
{
  "exchange_code": "egov_code_abc123xyz"
}
```

### eGovPH Token Response (`EGOV_TOKEN_URL`)
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

### eGovPH UserInfo Response (`EGOV_USERINFO_URL`)
```json
{
  "sub": "egov-user-98765",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "middle_name": "Santos",
  "email": "juan.delacruz@example.gov.ph",
  "email_verified": true,
  "mobile_number": "+639171234567"
}
```

### Backend Success Response (`POST /api/auth/egov/exchange`)
```json
{
  "success": true,
  "user": {
    "id": "egov-user-98765",
    "email": "juan.delacruz@example.gov.ph",
    "firstName": "Juan",
    "lastName": "Dela Cruz"
  }
}
```

## 4. Security Guardrails & Cookies
- **Zero Client-Side Secret Exposure:** `EGOV_CLIENT_SECRET` must ONLY be referenced in `backend/` via `process.env.EGOV_CLIENT_SECRET`.
- **Session Cookie Policy:**
  - `HttpOnly`: `true` (Prevents XSS theft)
  - `Secure`: `true` in production (`process.env.NODE_ENV === 'production'`)
  - `SameSite`: `'lax'` or `'strict'` (Mitigates CSRF)
  - `Path`: `'/'`
  - `MaxAge`: `24 * 60 * 60 * 1000` (24 hours)
