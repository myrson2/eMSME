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
