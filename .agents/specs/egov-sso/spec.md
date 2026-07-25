# Feature Spec: eGovPH SSO Integration (`egov-sso`)

## 1. Overview & Goal
Integrate eGovPH Single Sign-On (SSO) authentication into the eMSME application platform. Authentication is initiated on the React frontend using the official `egov-hackathon-sso-widget` set to the `STAGING` environment. To prevent exposing client secrets (`EGOV_PARTNER_SECRET`), single-use authorization exchange codes (`exchange_code`) received by the frontend widget are transmitted to an Express + TypeScript backend endpoint (`POST /api/auth/egov/exchange`) for secure server-to-server token exchange and user profile retrieval.

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (User Sign-In):** As an eMSME user, I can click the eGovPH SSO button on the frontend so that I can securely log in using my verified eGovPH credentials.
- **US-2 (Server-Side Exchange):** As a system admin, I want all OAuth token exchanges to happen strictly on the Express backend so that `EGOV_PARTNER_SECRET` is never exposed to the client or browser network logs.
- **US-3 (Session Establishment):** As an authenticated user, after successful eGovPH validation, I receive a secure, HTTP-only session cookie so that my session remains authenticated across API requests.

### Acceptance Criteria
- [ ] **AC-1:** Frontend mounts both the trigger component from `egov-hackathon-sso-widget` and the target `<div id="egov-sso-widget-portal"></div>` portal container.
- [ ] **AC-2:** Widget is configured with `environment: 'STAGING'` and references `process.env.EGOV_PARTNER_CODE` (or `import.meta.env.VITE_EGOV_PARTNER_CODE`).
- [ ] **AC-3:** `on_success_function` extracts `exchange_code` and invokes `POST /api/auth/egov/exchange`.
- [ ] **AC-4:** Backend endpoint `POST /api/auth/egov/exchange` validates `exchange_code`, exchanges it with eGovPH's server token endpoint (`EGOV_BASE_URL/api/token`), and fetches user info from `/api/partner/sso_authentication`.
- [ ] **AC-5:** Upon successful user profile retrieval, backend issues an HTTP-only secure cookie containing session details and returns `{ success: true, user: ... }`.
- [ ] **AC-6:** Robust error handling handles edge cases:
  - Missing or empty `exchange_code` (HTTP 400 Bad Request)
  - Expired or already-used exchange codes (HTTP 422 Unprocessable Entity)
  - Network timeouts or upstream eGov API failures (HTTP 502 Bad Gateway)
  - Missing `<div id="egov-sso-widget-portal"></div>` DOM element (Frontend graceful fallback/error message)

## 3. Out of Scope
- Direct client-side token exchange (STRICTLY FORBIDDEN).
- Third-party social logins (Google, Facebook) in this iteration.
- Mobile native OAuth custom tab handlers (handled in subsequent mobile spec).
