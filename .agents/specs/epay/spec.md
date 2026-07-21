# Feature Spec: eGovPay Payment Gateway (`epay`)

## 1. Overview & Goal
Integrate **eGovPay** (the official Philippine government payment gateway platform co-developed by DICT, LANDBANK, and the Bureau of the Treasury) into the eMSME application platform. eGovPay handles:
1. **Loan Amortization Repayments:** Borrowers pay monthly installments via eGovPay supported channels (GCash, PayMaya, LANDBANK LinkBiz, credit/debit cards).

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (Repayment Checkout):** As an MSME borrower, I can select an active loan installment and pay via eGovPay using my preferred payment channel (GCash, PayMaya, Bank Transfer).
- **US-2 (Automated Webhook Sync):** As a system, payment confirmations received via eGovPay webhooks automatically update the loan balance and issue digital e-receipts.

### Acceptance Criteria
- [ ] **AC-1:** Mobile app presents an interactive eGovPay payment checkout screen (`EGovPayCheckout.tsx`) displaying amount due, itemized breakdown, and payment channel selector.
- [ ] **AC-2:** Express backend endpoint `POST /api/payments/egovpay/checkout` generates a unique `txnid`, computes HMAC-SHA256 digest signature (`amount|txnid`), and requests a transaction session from `EGOVPAY_API_URL` (`https://ws.egovpay.gov.ph`).
- [ ] **AC-3:** Express backend endpoint `POST /api/payments/egovpay/webhook` receives async status callbacks from eGovPay, validates the digest signature, and marks installments as `PAID`.
- [ ] **AC-4:** Idempotency & Security Guardrails:
  - Reject duplicate webhook transactions using `txnid` tracking backed by the SQLite database (not in-memory).
  - Require valid HMAC-SHA256 signature match on all webhook callbacks.

## 3. Out of Scope
- Un-verified cash collections without digital e-receipts.
- Storing credit card numbers or banking PINs on eMSME servers (all sensitive card inputs handled on eGovPay hosted gateways).
