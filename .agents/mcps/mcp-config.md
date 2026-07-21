# MCP & External Tool Integrations

> **Purpose:** This file documents every external API, tool, and service wired into the eMSME platform. AI agents MUST check this file before assuming any external service is available. Never hardcode API credentials here — only reference environment variable names.

---

## 1. eGovPH SSO / OAuth 2.0 (Authentication)
- **Purpose:** Citizen identity authentication and PhilSys SSO login.
- **Environment:** `STAGING` (hackathon)
- **Upstream Token Endpoint:** `EGOV_TOKEN_URL` (server env var)
- **Upstream UserInfo Endpoint:** `EGOV_USERINFO_URL` (server env var)
- **Auth Method:** OAuth 2.0 Authorization Code + `client_id` / `client_secret`
- **Frontend Package:** `egov-hackathon-sso-widget` (client-side trigger only — NO token exchange)
- **Backend Env Vars:** `EGOV_CLIENT_ID`, `EGOV_CLIENT_SECRET`, `EGOV_TOKEN_URL`, `EGOV_USERINFO_URL`
- **Backend Route:** `POST /api/auth/egov/exchange`
- **⚠️ Security Rule:** `EGOV_CLIENT_SECRET` must NEVER exist in `frontend/` or `mobile/`.

---

## 2. eMessage SMS Gateway
- **Purpose:** OTP delivery for MFA step-up authentication + transactional SMS alerts (loan status, repayment due dates).
- **Upstream Endpoint:** `EMESSAGE_API_URL` (server env var) → `POST /messaging/v1/sms/push`
- **Auth Method:** Header `X-EMESSAGE-Auth: <EMESSAGE_API_TOKEN>`
- **Payload:** `{ "number": "+63XXXXXXXXX", "message": "..." }` (E.164 phone format required)
- **Expected Success:** `201 Created` → `{ "data": { "message": "SMS was successfully created." } }`
- **Backend Env Vars:** `EMESSAGE_API_URL`, `EMESSAGE_API_TOKEN`
- **Backend Routes:** `POST /api/auth/sms/send-otp`, `POST /api/auth/sms/verify-otp`
- **OTP Storage:** Redis — SHA-256 hashed, 5-minute TTL, max 3 attempts

---

## 3. eVerify — PhilSys Identity Verification
- **Purpose:** 1:1 identity verification of citizen against PhilSys National ID database.
- **Upstream Endpoint:** `EVERIFY_API_URL` (server env var)
- **Auth Method:** API Key header
- **Backend Env Vars:** `EVERIFY_API_URL`, `EVERIFY_API_KEY`
- **Backend Route:** `POST /api/verify/philsys`
- **⚠️ Compliance:** User consent (`userConsent: true`) must be confirmed before calling this API (RA 10173).

---

## 4. eFacial — Facial Liveness & Biometric Matching
- **Purpose:** Liveness detection + 1:1 facial match against government-issued ID photo. Runs BEFORE eVerify as the biometric gate.
- **Upstream Endpoint:** `EFACIAL_API_URL` (server env var) → `POST /v1/identity/face-liveness`
- **Auth Method:** API Key header
- **Backend Env Vars:** `EFACIAL_API_URL`, `EFACIAL_API_KEY`
- **Backend Route:** `POST /api/verify/face-liveness`
- **⚠️ Security:** `faceBase64` is received in request body and must be purged from memory after forwarding. No facial image is written to disk or database. See `efacial-recog/decisions.md` for purge mechanism decisions.
- **Execution Order:** `eFacial liveness check` → (if passed) → `eVerify identity match`

---

## 5. eGovPay — Government Payment Gateway
- **Purpose:** Citizen repayment collection for active loan installments.
- **Upstream Endpoint:** `EGOVPAY_API_URL` (server env var)
- **Auth Method:** HMAC-SHA256 digest signature
- **Backend Env Vars:** `EGOVPAY_API_URL`, `EGOVPAY_MERCHANT_ID`, `EGOVPAY_SECRET_KEY`, `EGOVPAY_SETTLEMENT_TEMPLATE_UUID`
- **Backend Routes:** `POST /api/payments/egovpay/checkout`, `POST /api/payments/egovpay/webhook`
- **Idempotency:** Webhook `txnid` must be stored in **Redis or database** (NOT in-memory Set — non-persistent across restarts). See `epay/decisions.md`.
- **⚠️ Critical:** `EGOVPAY_SETTLEMENT_TEMPLATE_UUID` routes funds to a specific bank account. Confirm this UUID with the lending institution before production use.

---

## 6. eGovAI — Conversational AI Assistant
- **Purpose:** Contextual, step-aware loan guidance chat for mobile app users. Falls back to static offline FAQ if service is unavailable.
- **Upstream Endpoint:** `EGOVAI_API_URL` (server env var)
- **Auth Method:** API Key header
- **Backend Env Vars:** `EGOVAI_API_URL`, `EGOVAI_API_KEY`
- **Backend Route:** `POST /api/support/chat`
- **Context Passing:** Client must include `loanStep` and `loanId` in request so backend can inject current application state into AI context. See `egov-ai/decisions.md` for context-passing mechanism.
- **Offline Fallback:** Returns `{ isFallback: true, faqs: [...] }` when upstream is unreachable. FAQ content sourced from `backend/src/data/faq.json`.

---

## 7. eGovChain — Blockchain Audit Trail
- **Purpose:** Immutable tamper-evident logging of critical loan lifecycle events (disbursement, full repayment, default declaration) to the government blockchain.
- **Upstream Endpoint:** `EGOVCHAIN_API_URL` (server env var) → `POST /v1/chain/commit`
- **Auth Method:** API Key header
- **Backend Env Vars:** `EGOVCHAIN_API_URL`, `EGOVCHAIN_API_KEY`
- **Backend Route:** `POST /api/blockchain/commit` (async, fire-and-log — not on the critical path)
- **⚠️ Cryptographic Rule:** `userId` is hashed with SHA-256 + **per-record random salt** (`crypto.randomBytes(16)`). A static hardcoded `'_SALT'` literal is NOT acceptable. See `eblockchain/decisions.md` ADR-002.
- **loanId handling:** Must also be hashed (not passed in plaintext) to prevent PII leakage on public blockchain. See `eblockchain/decisions.md` ADR-003.

---

## 8. Redis (Infrastructure Dependency)
- **Purpose:** OTP storage, webhook idempotency tracking, session caching.
- **Required for:** `emessage-sms` (OTP hashes + TTL), `epay` (webhook idempotency), `egov-sso` (optional session cache)
- **Backend Env Vars:** `REDIS_URL` (e.g. `redis://localhost:6379`)
- **⚠️ Note:** Redis is a required infrastructure dependency. The platform cannot safely run without it in production. Local development may substitute in-memory stores with caution.

---

## 9. Database (Infrastructure Dependency)
- **Decision Required:** See `architecture/system-overview.md` and open question Q13.
- **Production Target:** **SQLite** (committed decision — hackathon-friendly setup)
- **Backend Env Vars:** `DATABASE_URL`
- **ORM:** To be decided (Prisma recommended for TypeScript type safety).

---

## Environment Variable Master List

| Variable | Service | Backend / Frontend | Required |
|---|---|---|---|
| `EGOV_CLIENT_ID` | eGovPH SSO | Both | Yes |
| `EGOV_CLIENT_SECRET` | eGovPH SSO | Backend only | Yes |
| `EGOV_TOKEN_URL` | eGovPH SSO | Backend only | Yes |
| `EGOV_USERINFO_URL` | eGovPH SSO | Backend only | Yes |
| `EMESSAGE_API_URL` | eMessage SMS | Backend only | Yes |
| `EMESSAGE_API_TOKEN` | eMessage SMS | Backend only | Yes |
| `EVERIFY_API_URL` | eVerify | Backend only | Yes |
| `EVERIFY_API_KEY` | eVerify | Backend only | Yes |
| `EFACIAL_API_URL` | eFacial | Backend only | Yes |
| `EFACIAL_API_KEY` | eFacial | Backend only | Yes |
| `EGOVPAY_API_URL` | eGovPay | Backend only | Yes |
| `EGOVPAY_MERCHANT_ID` | eGovPay | Backend only | Yes |
| `EGOVPAY_SECRET_KEY` | eGovPay | Backend only | Yes |
| `EGOVPAY_SETTLEMENT_TEMPLATE_UUID` | eGovPay | Backend only | Yes |
| `EGOVAI_API_URL` | eGovAI | Backend only | Yes |
| `EGOVAI_API_KEY` | eGovAI | Backend only | Yes |
| `EGOVCHAIN_API_URL` | eGovChain | Backend only | Yes |
| `EGOVCHAIN_API_KEY` | eGovChain | Backend only | Yes |
| `REDIS_URL` | Redis | Backend only | Yes |
| `DATABASE_URL` | PostgreSQL | Backend only | Yes |
| `JWT_SECRET` | Session Auth | Backend only | Yes |
| `NODE_ENV` | Express | Backend only | Yes |
| `PORT` | Express | Backend only | Yes |
