# Session Memory & Handoff Notes

## ⚠️ Operational Constraint — READ FIRST
> **Antigravity AI will ONLY write `.md` files inside `.agents/`.**  
> It will NOT write or modify any application code in `frontend/`, `backend/`, or `mobile/` unless the user explicitly says **"implement the code now"**.

---

## Active Working Context

- **Primary Platform:** `mobile/` — React Native + Expo SDK
- **Backend:** `backend/` — Express + TypeScript
- **Landing Page:** `frontend/` — Static only, no app features

---

## Completed Specifications

| Feature | Folder | Status |
|---|---|---|
| eGovPH SSO (Web Widget) | `specs/egov-sso/` | ✅ Spec complete |
| eGovPH SSO (Mobile Native) | `specs/egov-sso-mobile/` | ✅ Spec complete |
| eMessage SMS OTP | `specs/emessage-sms/` | ✅ Spec complete |
| eVerify PhilSys ID | `specs/everify/` | ✅ Spec complete |
| eFacial Liveness | `specs/efacial-recog/` | ✅ Spec complete |
| eGovPay Payments | `specs/epay/` | ✅ Spec complete |
| eGovAI Chat | `specs/egov-ai/` | ✅ Spec complete |
| eGovChain Audit | `specs/eblockchain/` | ✅ Spec complete |

## Specs Still Needed (No code until spec exists)

- [ ] `specs/loan-module/` — Core loan application workflow
- [ ] `specs/user-onboarding/` — Mobile step-by-step onboarding
- [ ] `specs/credit-engine/` — Credit scoring calculator
- [ ] `specs/business-verification/` — DTI/SEC/CDA/BIR/LGU routing

---

## 🔍 Socratic Debugging Guide

> Use this section when hitting an issue. Instead of guessing, ask yourself each question in order. Each question leads to a file or decision you need to check first.

---

### 🔴 Issue: "The eGovPH login doesn't work on mobile"

**Ask yourself in order:**

1. **Which platform are you debugging?**
   - Web browser → check `specs/egov-sso/` (web widget flow)
   - Mobile app → check `specs/egov-sso-mobile/` (expo-web-browser + deep link flow)
   - *These are two separate flows. Don't mix them.*

2. **Is the deep link registered?**
   - Check `mobile/app.json` for `"scheme": "emsme"`.
   - If missing → the OAuth redirect cannot return to the app. Add it first.

3. **Is the `exchange_code` being received?**
   - Log the result of `WebBrowser.openAuthSessionAsync()`.
   - If `resultType === CANCEL` → user dismissed. No bug, expected.
   - If `resultType === SUCCESS` but no `?code=` in URL → eGovPH redirect URI mismatch. Check registered `redirect_uri` matches `emsme://auth/callback`.

4. **Is the backend exchange failing?**
   - Check backend logs for `POST /api/auth/egov/exchange`.
   - 400 → `exchange_code` missing or malformed.
   - 401 → code already used or expired. Codes are single-use. Don't call the endpoint twice.
   - 502 → `EGOV_TOKEN_URL` unreachable. Check `backend/.env` for correct staging URL.
   - 500 → `EGOV_CLIENT_ID` or `EGOV_CLIENT_SECRET` missing from env. Run `echo $EGOV_CLIENT_SECRET` in the backend shell.

5. **Is the session being stored?**
   - Check that `SecureStore.setItemAsync()` is called after a `success: true` response.
   - AsyncStorage is NOT acceptable — tokens must go to SecureStore.

---

### 🔴 Issue: "SMS OTP is not arriving or OTP verification fails"

1. **Did the `/api/auth/sms/send-otp` endpoint succeed?**
   - 200 → Backend accepted it. Check `EMESSAGE_API_URL` and `EMESSAGE_API_TOKEN` in env.
   - 429 → Rate limit hit (3 OTPs per phone per hour). Wait before retrying.
   - 502 → eMessage upstream unreachable. Check if staging API is up.

2. **Is the OTP expiring before verification?**
   - OTPs expire in 5 minutes (300s TTL in Redis). Check `REDIS_URL` is set and Redis is running.
   - If Redis is not running → OTP storage fails silently in the current in-memory fallback.

3. **Is verification failing with correct code?**
   - Max 3 attempts. If exceeded → OTP is deleted. User must request a new one.
   - Hash mismatch → OTP was generated with a different salt than what's in env. Ensure `EMESSAGE_API_TOKEN` hasn't changed between send and verify.

4. **Is the phone number format correct?**
   - eMessage requires **E.164 format**: `+639XXXXXXXXX`, not `09XXXXXXXXX`.
   - Check the Zod validation on `mobileNumber` in the backend request schema.

---

### 🔴 Issue: "Payment webhook is processing duplicate transactions"

1. **Is Redis running?**
   - The idempotency store MUST use Redis, not an in-memory Set.
   - In-memory Set is wiped on server restart. Duplicate webhooks after a restart = duplicate payments.
   - Check `REDIS_URL` in backend env.

2. **Is the `txnid` being checked before processing?**
   - Check `specs/epay/architecture.md` for the idempotency flow.
   - If `txnid` already in Redis → respond `200 OK` immediately, skip processing.

3. **Is the webhook signature being verified?**
   - eGovPay sends an HMAC-SHA256 digest header. Verify it before trusting the payload.
   - Unverified webhooks can be spoofed by anyone who knows your webhook URL.
   - Check `EGOVPAY_SECRET_KEY` is set correctly in backend env.

4. **What if the webhook never arrives after a real payment?**
   - This is **open issue Q11** from the audit — no reconciliation job exists yet.
   - Short-term: Add a `GET /api/payments/egovpay/status/:txnid` polling endpoint as a manual fallback.
   - Long-term: Build a scheduled reconciliation job in `specs/epay/` when time allows.

---

### 🔴 Issue: "eGovChain blockchain commit is silently failing"

1. **Is the commit async or blocking?**
   - Blockchain commits are fire-and-log (async). A failure does NOT block the user flow.
   - Check backend logs for `[eGovChain Error]` messages. Silent drops are logged there.

2. **Is the `userId` properly hashed?**
   - The hash MUST use `crypto.randomBytes(16)` as a per-record salt — NOT the hardcoded `'_SALT'` string.
   - Hardcoded salt = no real security. See `specs/eblockchain/decisions.md ADR-002`.
   - If you see `'_SALT'` in code → it was written incorrectly. Flag for fix before production.

3. **Is `loanId` being passed in plaintext?**
   - `loanId` must also be hashed before sending to eGovChain (same as `userId`).
   - Plaintext loanId on a public blockchain = PII leakage. See `specs/eblockchain/decisions.md ADR-003`.

4. **Is `EGOVCHAIN_API_KEY` set?**
   - Check backend env. 401 from upstream = invalid or missing key.

---

### 🔴 Issue: "Credit score seems wrong or inconsistent"

1. **Trace each score component separately:**
   - Identity score (0–25): Did eVerify return `verified: true`? Did eFacial pass liveness ≥90%?
   - Business score (0–25): Were all 3 checks run (DTI/SEC/CDA, BIR TIN, LGU permit)?
   - Financial score (0–35): Is `monthlyRevenue / monthlyAmortization ≥ 3.0`? Is DSCR ≥ 1.5?
   - History score (0–15): Is `yearsInOperation ≥ 3`? Are there declared defaulted loans?

2. **Check the thresholds:**
   - ≥ 80 → Auto-Approve
   - 60–79 → Manual Review (goes to underwriter queue)
   - < 60 → Auto-Reject
   - Documented in `architecture/system-overview.md §6`

3. **Is the credit engine actually spec'd?**
   - `specs/credit-engine/` does NOT exist yet. The scoring rules are only in `system-overview.md`.
   - Before implementing, create the spec. Do not write code from a system-overview alone.

---

### 🔴 Issue: "Agent wrote code in mobile/ or backend/ without being told to"

- Check `memory/context.md` — the operational constraint should be the first thing any agent reads.
- If an agent writes code anyway: revert the changes, re-read `memory/context.md`, and remind the agent of the rule.
- The rule: **Only write `.md` files in `.agents/` unless the user says "implement the code now".**

---

## Open Questions (Must Answer Before Implementing Core Features)

| # | Question | Blocks |
|---|---|---|
| Q1 | Who is the lender? (eMSME itself, or marketplace?) | `loan-module` disbursement architecture |
| Q4 | Does `egov-hackathon-sso-widget` work in React Native WebView? | `egov-sso-mobile` implementation approach |
| Q7 | How to guarantee biometric purge from Node.js heap? | `efacial-recog` / `everify` RA 10173 compliance |
| Q10 | Who controls `EGOVPAY_SETTLEMENT_TEMPLATE_UUID`? | `epay` fund routing |
| Q13 | PostgreSQL or SQLite for production? | All backend data persistence |

---

## Session Handoff (2026-07-22)
- **Completed:** Overhauled all 5 onboarding screens ([FaceLivenessScreen.tsx](file:///C:/Users/Yen/eMSME/mobile/src/screens/FaceLivenessScreen.tsx), [EVerifyScreen.tsx](file:///C:/Users/Yen/eMSME/mobile/src/screens/EVerifyScreen.tsx), [BusinessProfileScreen.tsx](file:///C:/Users/Yen/eMSME/mobile/src/screens/BusinessProfileScreen.tsx), [BusinessVerificationScreen.tsx](file:///C:/Users/Yen/eMSME/mobile/src/screens/BusinessVerificationScreen.tsx), [FinancialsScreen.tsx](file:///C:/Users/Yen/eMSME/mobile/src/screens/FinancialsScreen.tsx)) with loading spinners, visual step indicators (biometric oval frame, PhilSys ID card, DTI/SEC/BIR checklist), step-by-step verification progress timers, and comprehensive `try/catch` error handling with `Alert.alert` dialogs.
- **Verification:** Both `npm test` backend suite and `@babel/core` compilation across all 5 screens completed with 100% success and 0 errors.
