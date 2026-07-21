# Architectural Decision Records: Credit Engine (`credit-engine`)

## ADR-001: Deterministic Rule-Based Scoring (No ML)

**Decision:** The credit engine uses a fixed, deterministic scoring rubric. Same inputs always produce same outputs. No machine learning models or stochastic elements.

**Rationale:** For a hackathon prototype, ML models require training data and explainability infrastructure. The deterministic approach is auditable, testable, and regulatorily defensible. Future iterations can layer ML on top of this foundation.

---

## ADR-002: All Scoring Functions are Pure (No Side Effects)

**Decision:** `scoreIdentity()`, `scoreBusinessLegitimacy()`, `scoreFinancialHealth()`, and `scoreOperatingHistory()` are pure functions that accept plain objects and return numbers. Database reads and writes happen only in the `assessLoan()` orchestrator.

**Rationale:** Pure functions are trivially unit-testable without mocking databases. The credit scoring logic is the most critical code in the system — it must have comprehensive test coverage.

---

## ADR-003: Estimated Amortization Used for Pre-Approval DSCR

**Decision:** Before a loan is approved, the DSCR and revenue/amortization ratio are calculated using an *estimated* monthly payment derived from the `getBaseInterestRate()` table and `generateAmortizationSchedule()`.

**Rationale:** The actual disbursed amount is only known after the partner bank confirms. Using an estimate at scoring time is standard underwriting practice. If the approved amount differs from the requested amount (rare in this spec), the ratio is recalculated.

---

## ADR-004: Credit Score Stored as JSON Blob on Loan Record

**Decision:** The full `CreditScoreResult` (all 4 sub-scores, decision, timestamp, reasons) is stored as a JSON blob in `loan_applications.credit_score_json` rather than a separate normalized table.

**Rationale:** Credit scores are immutable snapshots — they do not change after assessment. A denormalized JSON blob is simpler to read and avoids join complexity. The mobile app reads it via `GET /api/loans/:loanId` in a single query.
