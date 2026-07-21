# Authentication Conventions

## Security Locks & OAuth Guidelines
- **Server-Side Exchange:** All OAuth/SSO flows (including eGovPH) MUST use server-side token exchange.
- **Zero Secret Exposure:** Client secrets (`EGOV_CLIENT_SECRET`) must NEVER exist in `frontend/` or `mobile/` source files or client environment variables.
- **Frontend Callbacks:** Frontend authentication callbacks must transmit single-use authorization/exchange codes to the Express backend endpoint (`POST /api/auth/egov/exchange`).
- **Session Tokens:** Authentication sessions must be stored in HTTP-Only, Secure cookies (`SameSite=Lax`) to prevent XSS credential theft.
- **Error Handling:** OAuth errors must return clean, sanitized user messages and standard status codes (400 for invalid codes, 502 for upstream failures).
