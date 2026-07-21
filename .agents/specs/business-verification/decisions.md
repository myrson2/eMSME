# Architectural Decision Records: Business Verification (`business-verification`)

## ADR-001: Promise.allSettled for Secondary Checks (Never Block on LGU)

**Decision:** BIR and LGU checks are run in parallel using `Promise.allSettled()` — not `Promise.all()`. A timeout or error from one does not cancel the other.

**Rationale:** LGU permit APIs in the Philippines are notoriously unreliable. Using `Promise.all()` would cause the entire verification to fail if the LGU API is slow. `Promise.allSettled()` lets us collect results from all checks that succeed and report failures individually. The applicant can then correct only the failing check.

---

## ADR-002: Generic `callAdapter()` with Uniform Result Contract

**Decision:** All 5 government API calls are wrapped in a single `callAdapter()` function that normalizes responses into `VerificationAdapterResult`. Route-specific raw API response parsing happens inside this wrapper.

**Rationale:** Government APIs have inconsistent response shapes (some return `{ verified: true }`, others return `{ active: true }`, others return `{ goodStanding: true }`). The wrapper normalizes all of these into a single `PASS/FAIL/TIMEOUT/ERROR` enum before the caller sees them. This prevents the routing logic from needing to know each API's response schema.

---

## ADR-003: Partial Failure Returns 422 (Not 500)

**Decision:** If any verification check fails, the API returns `422 Unprocessable Entity` with the `failedChecks` list. A 422 is appropriate because the request was well-formed but the data (government IDs) failed validation by the external authorities.

**Rationale:** 422 signals to the client that the issue is correctable by the user (unlike 500 which implies a server bug). The mobile app uses this to display targeted remediation instructions per failed check.

---

## ADR-004: Verification Results Persisted for Audit Trail

**Decision:** The full array of `VerificationAdapterResult` objects is stored in `business_profiles.verification_checks_json`. Individual boolean flags (`is_gov_verified`, `bir_tin_verified`, `lgu_permit_verified`) are also stored for fast credit engine reads.

**Rationale:** The boolean flags allow fast credit scoring without JSON parsing. The full JSON blob preserves the audit trail of exactly which agency confirmed what and when — required for compliance and dispute resolution under RA 10173.
