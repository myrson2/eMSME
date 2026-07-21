# Architectural Decision Records: User Onboarding (`user-onboarding`)

## ADR-001: Onboarding is a Pre-Requisite Gate, Not Optional

**Decision:** The loan application endpoint (`POST /api/loans/apply`) checks `onboarding_progress` for all 6 completed flags and returns `403 ONBOARDING_INCOMPLETE` if any are missing.

**Rationale:** A loan application without verified identity, business registration, and financial data is unusable for credit scoring. The gate prevents incomplete applications from entering the loan state machine.

---

## ADR-002: Step Lock Ordering (Sequential, not Parallel)

**Decision:** Onboarding steps are strictly sequential. Step N cannot be accessed until step N-1 is marked complete. The backend enforces this via `requireStepComplete()` middleware.

**Rationale:** The steps have data dependencies. eVerify needs the facial frame from eFacial. Business verification needs the business profile. Financial inputs need the verified business. Parallel access would create orphan records.

---

## ADR-003: Auto-Save to SQLite After Every Step

**Decision:** Each step completion triggers an immediate `UPDATE onboarding_progress SET <step>_completed = 1` to SQLite. The mobile app reads `GET /api/onboarding/status` on launch to determine `currentStep`.

**Rationale:** Mobile apps are frequently interrupted (calls, app backgrounding, crashes). Persisting each step means zero lost progress regardless of interruption timing. Resolved in Socratic review (2026-07-21).

---

## ADR-004: Biometric Frame is In-Memory Only (Not Persisted)

**Decision:** The facial frame captured during the eFacial step is processed in server memory and passed directly to eVerify within the same request lifecycle. It is never written to disk or stored in any database.

**Rationale:** RA 10173 compliance. Raw biometric data is sensitive PII. The only persistence from the eFacial/eVerify chain is a boolean flag (`is_everify_verified = true`) and a reference ID (`everifyRefId`).
