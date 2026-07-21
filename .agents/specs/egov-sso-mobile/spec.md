# Feature Spec: Mobile eGovPH SSO — React Native Authentication (`egov-sso-mobile`)

## 1. Overview & Goal

The `egov-sso` spec only covers a **React web widget** (`EGovSSOWidget.tsx`). The **primary platform is `mobile/` (React Native + Expo)** per `AGENTS.md §1`. This spec defines the mobile-native eGovPH SSO flow using `expo-auth-session` + a custom WebView/in-app browser to initiate the auth flow and receive the `exchange_code` for server-side exchange.

The backend endpoint `POST /api/auth/egov/exchange` is shared — only the mobile trigger mechanism differs.

---

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (Mobile SSO Login):** As an eMSME mobile user, I can tap "Sign in with eGovPH" on the login screen so that I am redirected to the eGovPH auth portal in an in-app browser and returned to the app upon successful authentication.
- **US-2 (Exchange Code Handoff):** As a system, after the eGovPH portal redirects back to the app via deep link, the `exchange_code` is automatically intercepted by the app and sent to `POST /api/auth/egov/exchange` without any user action.
- **US-3 (Session Persistence):** As an authenticated mobile user, my session is persisted in secure device storage (Expo SecureStore) so I remain logged in across app restarts.

### Acceptance Criteria
- [ ] **AC-1:** `mobile/` has an `EGovSSOScreen.tsx` with a "Sign in with eGovPH" button.
- [ ] **AC-2:** Tapping the button opens the eGovPH STAGING auth portal via `expo-web-browser` (`WebBrowser.openAuthSessionAsync`), passing `client_id` and `redirect_uri`.
- [ ] **AC-3:** App is registered with a deep link scheme (e.g. `emsme://auth/callback`) to receive the redirect from eGovPH with the `exchange_code` query parameter.
- [ ] **AC-4:** App intercepts the deep link, extracts `exchange_code`, and POSTs to `/api/auth/egov/exchange`.
- [ ] **AC-5:** On success, session token is stored in `expo-secure-store` (NOT AsyncStorage — not encrypted).
- [ ] **AC-6:** Error states: cancelled auth, expired code, network failure — each handled with a user-visible error message and retry option.

---

## 3. Open Architecture Question (Must Resolve Before Implementation)

> **Q: Does the `egov-hackathon-sso-widget` npm package support React Native / Expo?**
>
> - If **yes** → embed the widget in a `WebView` within the mobile app.
> - If **no** → use `expo-auth-session` + `expo-web-browser` to open the STAGING OAuth URL directly, with a custom redirect URI registered as a deep link.
>
> **Assumed answer (until confirmed):** The widget is web-only. Mobile uses `expo-web-browser` + deep link redirect. Confirm with hackathon organizers.

---

## 4. Out of Scope
- Biometric device unlock (FaceID/TouchID) as a secondary lock — planned for V2.
- Persistent background token refresh (requires refresh_token flow — not yet confirmed supported by eGovPH STAGING).
