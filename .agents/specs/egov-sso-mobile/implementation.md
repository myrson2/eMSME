# Implementation Tasks: Mobile eGovPH SSO (`egov-sso-mobile`)

## Status
- **Feature:** Mobile eGovPH SSO Authentication
- **Platform:** Mobile (`mobile/`) — React Native + Expo
- **Current Phase:** [ ] Planning | [ ] In Progress | [ ] Done

## Task Checklist

- [ ] **Task 1: Deep Link Registration**
  - Add `"scheme": "emsme"` to `mobile/app.json` / `app.config.js`
  - Register `emsme://auth/callback` as the OAuth redirect URI
  - Test deep link fires correctly on Android & iOS simulators

- [ ] **Task 2: Install Dependencies**
  - Install `expo-web-browser` and `expo-secure-store`
  - Verify `expo-linking` is available for deep link parsing

- [ ] **Task 3: EGovSSOScreen.tsx**
  - Create `mobile/src/screens/EGovSSOScreen.tsx`
  - Build "Sign in with eGovPH" screen with branding
  - Implement `WebBrowser.openAuthSessionAsync(authUrl, 'emsme://auth/callback')`
  - Parse returned URL for `?code=<exchange_code>` query parameter
  - POST `exchange_code` to `POST /api/auth/egov/exchange`
  - Store returned session token via `SecureStore.setItemAsync('emsme_session_token', token)`
  - Handle: cancel, error, expired code states with user feedback

- [ ] **Task 4: Add to Navigation Stack**
  - Register `EGovSSOScreen` as the initial/unauthenticated route in navigation stack
  - On successful auth, navigate to `HomeScreen` or `DashboardScreen`

- [ ] **Task 5: Session Restore on App Launch**
  - On app startup, check `SecureStore.getItemAsync('emsme_session_token')`
  - If token exists and not expired → skip login screen, navigate directly to `HomeScreen`

## Environment Variables
```env
# mobile/.env (Expo public vars — safe to expose in bundle)
EXPO_PUBLIC_EGOV_CLIENT_ID=your_staging_client_id_here
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```
