# Architectural Decisions: eGovPay Payment Gateway (`epay`)

## ADR 001: Server-Side HMAC-SHA256 Digest Signing

### Status
Accepted

### Context
eGovPay requires transaction requests to include an HMAC-SHA256 digest signature (`amount|txnid`) computed with the institutional API secret. Exposing the API secret on mobile devices would compromise gateway credentials.

### Decision
All transaction session generation and HMAC-SHA256 digest calculations are performed strictly by the Express backend proxy (`POST /api/payments/egovpay/checkout`).

### Consequences
- **Positive:** Protects `EGOVPAY_API_SECRET`, ensures data integrity, prevents tamper attacks on payment amounts.
- **Negative:** Requires an initial API call to the backend before redirecting to the payment URL.

---

## ADR 002: Webhook Idempotency & Signature Verification

### Status
Accepted

### Context
Payment gateways may retry webhooks multiple times due to temporary network timeouts, risking duplicate crediting if not checked.

### Decision
The backend validates the `X-eGovPay-Signature` / HMAC digest on every incoming webhook call and checks `txnid` against a processed set/table. Duplicate webhooks immediately return HTTP 200 without re-crediting the account.

### Consequences
- **Positive:** Completely prevents double-crediting or double-installment processing.
- **Negative:** Requires persistent tracking of completed `txnid` records.
