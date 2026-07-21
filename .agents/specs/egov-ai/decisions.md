# Architectural Decisions: eGovAI (`egov-ai`)

## ADR 001: Backend Express Proxy for eGovAI Communication

### Status
Accepted

### Context
Directly invoking external LLMs / eGovAI endpoints from mobile devices exposes API keys and risks sending un-sanitized PII (PhilSys ID, TIN, phone numbers).

### Decision
All eGovAI chat requests from the React Native app MUST proxy through the Express backend endpoint (`POST /api/support/chat`). The Express backend sanitizes PII using regex filters before forwarding to the eGovAI service.

### Consequences
- **Positive:** Protects API keys, ensures compliance with Data Privacy Act of 2012, prevents raw PII leakage.
- **Negative:** Adds a proxy network hop.

---

## ADR 002: Graceful Offline FAQ Fallback

### Status
Accepted

### Context
If eGovAI services experience downtime or latency during peak usage, mobile users should not experience broken chat screens.

### Decision
If the backend call to eGovAI fails or times out (>8s), the server returns a structured offline fallback response containing standard eMSME guidance steps.

### Consequences
- **Positive:** Smooth user experience even during government API downtime.
- **Negative:** Fallback answers are static rather than dynamically tailored.
