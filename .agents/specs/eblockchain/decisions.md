# Architectural Decisions: eGovChain (`eblockchain`)

## ADR 001: Asynchronous Transaction Commit Queue

### Status
Accepted

### Context
Committing state hashes to eGovChain nodes involves network latency (1-3 seconds). Blocking HTTP requests during loan payment would cause slow UI responses.

### Decision
Transaction commits to eGovChain are pushed to an in-memory background worker queue. The HTTP endpoint returns immediately to the mobile app, and the `txHash` is updated in the database once the block commits.

### Consequences
- **Positive:** Fast mobile user experience.
- **Negative:** Transaction hash is attached asynchronously a few seconds after payment confirmation.

---

## ADR 002: Zero-PII Hashing Policy

### Status
Accepted

### Context
Blockchain records are permanent and immutable. Storing names or IDs violates data erasure rights under the Data Privacy Act of 2012.

### Decision
Only cryptographic hashes (salted SHA-256) of applicant IDs and numerical transaction amounts are written to eGovChain.

### Consequences
- **Positive:** Fully compliant with RA 10173 (Data Privacy Act of 2012).
- **Negative:** Requires querying backend database to resolve user identity from hashes.
