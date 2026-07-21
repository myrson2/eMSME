# Architectural Decisions: eVerify (`everify`)

## ADR 001: Server-Side eVerify Proxy Gateway

### Status
Accepted

### Context
eVerify requires authenticating via institutional `EVERIFY_CLIENT_ID` and `EVERIFY_CLIENT_SECRET` credentials. Calling eVerify directly from mobile clients would expose secret keys in client-side bundles.

### Decision
All eVerify calls pass strictly through the Express backend proxy (`POST /api/verify/philsys`). Client secrets reside exclusively in backend environment variables.

### Consequences
- **Positive:** Maximum key security, centralized audit logging, server-side data sanitization.
- **Negative:** Adds a server-to-server proxy hop.

---

## ADR 002: In-Memory Biometric Processing Policy

### Status
Accepted

### Context
Facial images captured during PhilSys verification contain biometric data protected under RA 10173 (Data Privacy Act of 2012).

### Decision
Facial base64 templates are processed strictly in RAM for the duration of the HTTP API request and immediately purged. Facial image files are **never** stored on disk or persistent databases.

### Consequences
- **Positive:** Zero risk of biometric data breaches from database storage.
- **Negative:** If a verification request fails, the user must capture a new liveness selfie rather than retrying with a cached file.

---

## ADR 003: Graceful Fallback to Manual ID Upload Queue

### Status
Accepted

### Context
Government API endpoints may experience intermittent maintenance or network timeouts during high usage.

### Decision
If the eVerify upstream server returns HTTP 5xx or times out (>10s), the API returns `fallbackToManual: true`, prompting the mobile client to seamlessly switch to manual ID photo upload.

### Consequences
- **Positive:** Prevents applicants from being blocked when eVerify services are offline.
- **Negative:** Requires manual underwriter review for fallback applications.
