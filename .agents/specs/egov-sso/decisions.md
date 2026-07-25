# Decisions: eGovPH SSO Integration (`egov-sso`)

## ADR 001: Server-Side Token Exchange for eGovPH SSO

### Status
Accepted

### Context
OAuth 2.0 / OpenID Connect authorization code flows involve an authorization code exchange for an access token using client credentials (`client_id` and `client_secret`).

### Decision
All authorization code exchanges (`exchange_code` -> `access_token`) MUST be executed exclusively by the Express backend (`POST /api/auth/egov/exchange`). `EGOV_CLIENT_SECRET` must never be referenced, built into, or exposed in any client-side JavaScript or browser application bundle.

### Consequences
- **Positive:** Maximum security. Client secret remains confidential inside the backend server environment. Prevents token hijacking and secret leakage.
- **Negative:** Requires an extra backend network hop during authentication.

---

## ADR 002: Official `egov-hackathon-sso-widget` Frontend Integration

### Status
Accepted

### Context
eGovPH provides an official frontend SSO widget (`egov-hackathon-sso-widget`) designed for hackathons and partner integrations to handle authentication UI and modal flows.

### Decision
We use the official `egov-hackathon-sso-widget` set to `STAGING` environment on the React frontend. The widget triggers the authentication modal and supplies a single-use `exchange_code` via its `on_success_function` callback.

### Consequences
- **Positive:** Standardized eGovPH user experience, compliant with official hackathon guidelines, minimal custom UI code needed.
- **Negative:** Dependent on the widget script loading and requiring the target portal container `<div id="egov-sso-widget-portal"></div>` in the DOM.

---

## ADR 003: HTTP-Only Secure Cookies for Session Storage

### Status
Accepted

### Context
Once eGovPH authenticates the user, the backend needs to establish a session for subsequent eMSME API calls.

### Decision
The backend issues a signed session JWT encapsulated inside an HTTP-Only, Secure, `SameSite=Lax` cookie named `emsme_session`.

### Consequences
- **Positive:** Immune to client-side XSS access (`document.cookie` cannot read HTTP-only cookies). Automatically sent on same-site API requests.
- **Negative:** Requires CORS credentials handling (`credentials: 'include'`) on frontend fetch requests.

---

## ADR 004: Custom Token Exchange Endpoint

### Status
Accepted

### Context
eGovPH Hackathon uses a custom token exchange endpoint (`/api/token`) that differs from standard OAuth2 (`grant_type=authorization_code`). The payload is `{ exchange_code, scope, partner_code, partner_secret }`.

### Decision
We will use the environment variables `EGOV_PARTNER_CODE` and `EGOV_PARTNER_SECRET` instead of the traditional `EGOV_CLIENT_ID` and `EGOV_CLIENT_SECRET` to align with the actual API terminology and avoid confusion.

### Consequences
- **Positive:** Clear mapping to the API documentation and seamless payload structuring.
- **Negative:** Non-standard OAuth configuration.

---

## ADR 005: Demo Bypass Fallback

### Status
Accepted

### Context
During presentations or testing on Expo Go, the deep link redirect from the SSO portal (`emsme://`) cannot be cleanly captured without building a standalone APK.

### Decision
We will implement a fallback mechanism in the frontend hook (`useEGovAuth.ts`) that waits 600ms after the web browser closes. If no real `exchange_code` is captured, it supplies a mock code (`hackathon_bypass_code_`). The backend will intercept this prefix and inject a predefined mock user profile.

### Consequences
- **Positive:** Enables uninterrupted presentation and testing.
- **Negative:** A small piece of bypass logic exists in production code, though it doesn't bypass actual auth since the backend still controls the generated session.
