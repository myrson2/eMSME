# Architectural Decision Records: Loan Module (`loan-module`)

## ADR-001: State Machine as Single Source of Truth

**Decision:** All loan status transitions are enforced by a strict `VALID_TRANSITIONS` map via `assertValidTransition()`. No route handler may directly set any loan status string without going through this guard.

**Rationale:** Loan state corruption (e.g., a loan jumping from `SUBMITTED` to `DISBURSED` without approval) would result in financial and compliance failures. The state machine pattern prevents this at the application layer.

**Consequences:** Any new state or transition requires a deliberate change to `VALID_TRANSITIONS` — this is intentional friction.

---

## ADR-002: Async Credit Engine (Fire-and-Update Pattern)

**Decision:** The credit assessment is triggered asynchronously after loan submission. The API returns `201 SUBMITTED` immediately to the client, and the credit engine updates the loan status in the background.

**Rationale:** Credit scoring reads financial, identity, and business data and may call external services. Blocking the submit endpoint would cause poor UX and timeout risks. The mobile client polls `GET /api/loans/:loanId` or receives a push notification when status changes.

---

## ADR-003: Disbursement via Partner Bank Webhook, Not eGovPay

**Decision:** Loan disbursement is handled by the Partner Bank (LANDBANK/DBP) directly. eMSME sends a "Disbursement Request" and awaits a webhook callback to confirm fund release.

**Rationale:** eGovPay is designed for citizen payment collection (repayments), not outbound fund transfers. Disbursement is a bank operation, not a payment gateway operation. This was resolved in the Socratic review (2026-07-21).

---

## ADR-004: Amortization Schedule Generated at Disbursement Time

**Decision:** The full amortization schedule is computed and persisted to `repayment_installments` at the moment the disbursement webhook is received — not at approval time.

**Rationale:** Approved amounts and rates may change during the offer acceptance stage. The final disbursed amount is the authoritative figure.
