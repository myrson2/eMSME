# Architectural Decisions: eFacial Recognition (`efacial-recog`)

## ADR 001: Server-Side Liveness Proxy Gateway

### Status
Accepted

### Context
eGov Face Liveness API calls require authenticating via server-side credentials (`EGOV_FACE_LIVENESS_KEY` and `EGOV_FACE_LIVENESS_SECRET`). Exposing these keys in mobile app bundles is a major security vulnerability.

### Decision
All liveness checks pass strictly through the Express backend proxy endpoint (`POST /api/verify/face-liveness`).

### Consequences
- **Positive:** Maximum API key security, centralized audit logging, server-side data sanitization.
- **Negative:** Adds a server network hop.

---

## ADR 002: In-Memory Volatile Processing & Zero Disk Storage Policy

### Status
Accepted

### Context
Facial biometric images are classified as Sensitive Personal Information (SPI) under RA 10173 (Data Privacy Act of 2012). Persistent storage of raw selfie photos creates severe breach liabilities.

### Decision
Facial base64 templates are processed strictly in volatile server RAM for the duration of the HTTP API request and immediately purged. Facial images are **never** written to database disk storage or server log files.

### Consequences
- **Positive:** Full compliance with Data Privacy Act of 2012. Eliminates biometric data breach liability.
- **Negative:** Failed liveness requests require the user to capture a fresh selfie rather than retrying with stored images.

---

## ADR 003: 90% Liveness Threshold Enforcement

### Status
Accepted

### Context
Deepfakes, digital screen replays, and high-resolution photo print attacks require strict confidence score cutoffs to prevent loan fraud.

### Decision
The backend proxy rejects any verification attempt with a `livenessScore < 90%` as a potential spoofing attempt.

### Consequences
- **Positive:** Extremely high security and anti-spoofing protection.
- **Negative:** Users in very poor lighting may occasionally be prompted to adjust their environment and retry.
