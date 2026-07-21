# Architectural Decisions: Mobile eGovPH SSO (`egov-sso-mobile`)

| Date | Decision | Rationale |
|---|---|---|
| 2026-07-21 | Use `expo-web-browser` instead of embedding `egov-hackathon-sso-widget` | The SSO widget is a web npm package and cannot be natively mounted in React Native. expo-web-browser opens an in-app secure browser session for the OAuth flow. |
| 2026-07-21 | Use `expo-secure-store` (not AsyncStorage) for session token storage | AsyncStorage is unencrypted. Tokens stored there are readable by other processes. SecureStore uses AES-256 hardware-backed encryption on supported devices. |
| 2026-07-21 | Reuse existing backend `POST /api/auth/egov/exchange` endpoint | The server-side token exchange logic is identical for web and mobile. No separate mobile endpoint is needed — only the trigger mechanism differs. |
| 2026-07-21 | Register `emsme://` as deep link scheme for OAuth redirect | Required to receive the `exchange_code` from the eGovPH portal back into the app. Without a registered scheme, the redirect cannot return to the React Native app. |
