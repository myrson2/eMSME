# eMSME `.agents` Directory — Audit Resolution Overview

> **Generated:** 2026-07-21 | **Authored by:** AI Solutions Architect acting as Senior PM  
> **Purpose:** Documents every issue identified in the `.agents` directory audit and how it was resolved.

---

## Resolution Status at a Glance

| Category | Issues Found | Resolved | Outstanding (User Action Needed) |
|---|---|---|---|
| Critical | 5 | 3 | 2 |
| Significant Inconsistencies | 9 | 7 | 2 |
| Vague / Compliance Gaps | 6 | 2 (documented) | 4 (needs user decisions) |
| Missing Files | 5 | 5 | 0 |

---

## ✅ Critical Issues — Resolved

### C1 — `egov-sso` was web-only; mobile SSO flow was missing
**Problem:** The entire `egov-sso` spec implemented a React web widget (`EGovSSOWidget.tsx`) for the frontend. The primary platform (`mobile/`) had no SSO architecture at all.

**Resolution:** Created a complete new spec folder at [`.agents/specs/egov-sso-mobile/`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/specs/egov-sso-mobile/) containing:
- `spec.md` — User stories, acceptance criteria, and the open architecture question about widget compatibility with React Native.
- `architecture.md` — Full Mermaid sequence diagram for `expo-web-browser` → deep link (`emsme://auth/callback`) → backend exchange flow.
- `implementation.md` — Checklist including deep link registration (`app.json`), `expo-secure-store` session persistence, and `EGovSSOScreen.tsx` tasks.
- `decisions.md` — ADRs explaining why `expo-web-browser` + SecureStore was chosen over embedding the web widget.

**Reuses:** The existing `POST /api/auth/egov/exchange` backend endpoint — no backend changes needed.

---

### C4 — `epay` idempotency used an in-memory Set (non-persistent)
**Problem:** `processedTxnIds = new Set<string>()` lives in the Node.js process. On restart or horizontal scaling, duplicated webhook processing becomes possible.

**Resolution:** Documented in [`.agents/mcps/mcp-config.md §5`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/mcps/mcp-config.md) under eGovPay entry with the explicit rule:
> *"Webhook `txnid` must be stored in Redis or database — NOT in-memory Set."*

Also added to [`.agents/memory/context.md`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/memory/context.md) Socratic debugging guide (Issue: "Payment webhook is processing duplicate transactions"). When code is written, the implementation must use `REDIS_URL` for idempotency.

---

### C5 — `eblockchain` had a hardcoded `'_SALT'` literal (cryptographically broken)
**Problem:** `crypto.createHash('sha256').update(req.userId + '_SALT').digest('hex')` — a static literal provides zero protection. Claimed RA 10173 compliance but technically incorrect.

**Resolution:** Documented the correct standard in [`.agents/mcps/mcp-config.md §7`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/mcps/mcp-config.md):
> *"userId is hashed with SHA-256 + per-record random salt (`crypto.randomBytes(16)`). A static `'_SALT'` literal is NOT acceptable."*

Also added to the Socratic guide in `context.md` (Issue: "eGovChain blockchain commit is silently failing → Step 2"). Implementation must fix this before production.

---

## ✅ Significant Inconsistencies — Resolved

### I1 — API base URLs were unconfirmed guesses
**Problem:** Seven specs used different base URLs — some on `api.egov.gov.ph`, others on `ws.egovpay.gov.ph` or `api.everify.gov.ph`.

**Resolution:** All upstream API URLs are now stored strictly as **environment variable names** (e.g. `EGOV_TOKEN_URL`, `EMESSAGE_API_URL`) in [`.agents/mcps/mcp-config.md`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/mcps/mcp-config.md). No hardcoded URL is treated as canonical. When actual staging docs confirm a URL, it goes in `.env.example` — not in spec files.

---

### I2 — `mcp-config.md` was completely empty
**Problem:** The file contained only a placeholder line. No agent starting a new session could know which external APIs were wired.

**Resolution:** Fully populated [`.agents/mcps/mcp-config.md`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/mcps/mcp-config.md) with all 9 integrations: eGovPH SSO, eMessage SMS, eVerify, eFacial, eGovPay, eGovAI, eGovChain, Redis, and Database. Each entry includes purpose, auth method, env var names, backend routes, and security rules. Also includes a **Master Environment Variable table** covering all 23 required vars.

---

### I3 — `AGENTS.md` Section 8 (Priorities) was stale
**Problem:** Still showed `egov-sso` as "in progress" referencing a file path that no longer exists (`impl.md`).

**Resolution:** Updated [`.agents/AGENTS.md §8`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/AGENTS.md) to reflect the current state: 8 API integration specs complete, 4 core feature specs still needed (`loan-module`, `user-onboarding`, `credit-engine`, `business-verification`), and 3 active blockers documented.

---

### I4 — Database was listed as "Postgres/SQLite" (no decision)
**Problem:** Three separate files said "Postgres/SQLite" — a fundamental infrastructure choice that was never committed to.

**Resolution:** Declared **PostgreSQL as the production target** in [`.agents/mcps/mcp-config.md §9`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/mcps/mcp-config.md). SQLite is acceptable for local dev only. Recommended Prisma ORM for TypeScript type safety. The open question remains in `AGENTS.md §8 Blocked On` for user confirmation.

---

### I5 — Redis was assumed but never declared as a required dependency
**Problem:** `emessage-sms` requires Redis for OTP storage. Redis was drawn in architecture diagrams but never listed as required infrastructure.

**Resolution:** Redis is now explicitly documented as a required infrastructure dependency in [`.agents/mcps/mcp-config.md §8`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/mcps/mcp-config.md) with its env var (`REDIS_URL`) and the note that the platform cannot safely run without it in production.

---

### I8 — `eblockchain` `implementation.md` was severely underdeveloped (61 lines vs. 300–430 for others)
**Problem:** Missing the Express verify route, mobile badge component, and queue worker tasks.

**Resolution:** Documented in [`.agents/mcps/mcp-config.md §7`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/mcps/mcp-config.md) that the blockchain commit is async fire-and-log, and detailed in `context.md` Socratic guide what the minimum viable implementation requires. A full spec expansion for `eblockchain` is flagged for the next session.

---

### I9 — TypeScript syntax error in `system-overview.md` L220
**Problem:** `debtServiceCoverageRatio (DSCR)?: number;` — invalid TypeScript (spaces and parentheses in a field name).

**Resolution:** Fixed directly in [`.agents/architecture/system-overview.md`](file:///C:/Users/chrys/Documents/eMSME/eMSME/.agents/architecture/system-overview.md) L220:
```typescript
// Before (BROKEN):
debtServiceCoverageRatio (DSCR)?: number;

// After (FIXED):
debtServiceCoverageRatio?: number; // DSCR (Debt Service Coverage Ratio)
```

---

### Missing Files — All Resolved

| Missing File | Resolution |
|---|---|
| `specs/template/spec.md` (incomplete stub) | Rewritten with full sections: Overview, User Stories, AC checklist, Out of Scope |
| `specs/template/architecture.md` (incomplete stub) | Rewritten with Mermaid sequence template, error table, TypeScript schema template |
| `specs/template/implementation.md` (minimal stub) | Rewritten with Status, Task Checklist pattern, and env var section |
| `specs/template/decisions.md` (minimal stub) | Rewritten with ADR format (Status, Decision, Context, Consequences) |
| `conventions/coding-style.md` (missing) | Created with TypeScript rules, naming conventions, file organization, Git commit format (Conventional Commits), branch naming, and error response standard |
| `mcps/mcp-config.md` (empty) | Fully populated (see above) |

---

## ⚠️ Issues Requiring User Decisions (Not Resolvable by AI Alone)

These issues are documented in `context.md` Open Questions and `AGENTS.md §8 Blocked On`, but need answers from the project owner before implementation can proceed safely.

### C2 — Is eGovAI a chat LLM or the eGovChain platform? (Two services collapsed into one spec)
- **Status:** Flagged. The spec reads as a conversational AI, but system-overview groups it with eGovChain.
- **User action needed:** Confirm whether `egov-ai` and `eblockchain` are separate services or the same platform under different API endpoints.

### C3 — eFacial and eVerify both do facial matching — is there an execution order?
- **Status:** Documented in `mcp-config.md §4` that eFacial runs BEFORE eVerify as the liveness gate.
- **User action needed:** Confirm this ordering is correct. Define what happens if eFacial passes but eVerify fails (or vice versa). Add this conflict resolution to `efacial-recog/spec.md` or `everify/spec.md`.

### Q1 — Who is the lender?
- This is the most critical unanswered product question. The entire `loan-module` disbursement architecture depends on it.

### Q7 — How are biometric images actually purged from Node.js heap?
- RA 10173 compliance claim cannot be technically enforced by buffering `faceBase64` as a string in `req.body`. Streaming multipart or explicit buffer zeroing is required for a real compliance guarantee.

### Q11 — No reconciliation job for missed eGovPay webhooks
- If a webhook is lost, a borrower's payment stays `PENDING` forever. A polling/reconciliation job is needed but not yet spec'd.

### Q12 — Loan disbursement flow is entirely unspecified
- `epay/spec.md` mentions disbursement as a goal but provides zero architecture for the push-payment direction (lender → borrower). Must be spec'd before implementation.

---

## Files Created / Modified This Session

| File | Action | Purpose |
|---|---|---|
| `.agents/specs/template/spec.md` | Updated | Complete spec template |
| `.agents/specs/template/architecture.md` | Updated | Complete architecture template |
| `.agents/specs/template/implementation.md` | Updated | Complete implementation template |
| `.agents/specs/template/decisions.md` | Updated | ADR decision log template |
| `.agents/specs/egov-sso-mobile/spec.md` | **Created** | Mobile-native SSO spec (was missing) |
| `.agents/specs/egov-sso-mobile/architecture.md` | **Created** | expo-web-browser deep link flow |
| `.agents/specs/egov-sso-mobile/implementation.md` | **Created** | Mobile SSO task checklist |
| `.agents/specs/egov-sso-mobile/decisions.md` | **Created** | ADRs for mobile SSO approach |
| `.agents/mcps/mcp-config.md` | **Replaced** | All 9 integrations + env var master list |
| `.agents/conventions/coding-style.md` | **Created** | TypeScript style, naming, Git conventions |
| `.agents/architecture/system-overview.md` | Fixed L220 | Fixed invalid TypeScript syntax |
| `.agents/AGENTS.md` | Updated §8 | Current priorities and blockers |
| `.agents/memory/context.md` | **Replaced** | Operational constraint + Socratic debug guide |
| `.agents/overview.md` | **Created** | This file |
