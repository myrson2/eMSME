# Architectural Decisions: eMessage SMS (`emessage-sms`)

## ADR 001: Server-Side SHA-256 Hashing of Stored OTPs

### Status
Accepted

### Context
Plaintext OTPs stored in memory or Redis caches create security risks if RAM/Redis instances are inspected during security audits.

### Decision
All generated 6-digit OTPs are hashed using SHA-256 with a secret salt before being saved in Redis. The incoming user submission is hashed and compared against the stored digest.

### Consequences
- **Positive:** Plaintext OTPs never exist in cache memory or server log files.
- **Negative:** Requires an extra hashing step per verification attempt.

---

## ADR 002: Maximum 3 Attempts & 5-Minute Expiration Window

### Status
Accepted

### Context
Unlimited OTP guess attempts allow brute-force attacks against 6-digit codes (100,000 to 999,999).

### Decision
OTPs expire strictly after 300 seconds (5 minutes) and are deleted immediately after 3 incorrect verification attempts.

### Consequences
- **Positive:** Completely prevents brute-force code guessing attacks.
- **Negative:** Users who repeatedly enter incorrect codes must request a new SMS OTP.
