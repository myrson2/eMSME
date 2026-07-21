# Feature Spec: eGovAI Intelligent Support Assistant (`egov-ai`)

## 1. Overview & Goal
Integrate **eGovAI**—the official Philippine government intelligent assistant platform—into the eMSME Mobile application. eGovAI acts as an embedded conversational AI helper that assists MSME applicants with business registration inquiries, loan application guidance, government document requirements, and status tracking.

To ensure user privacy and security, eGovAI operates through a secure Express backend proxy gateway (`POST /api/support/chat`), masking PII before sending queries to eGovAI services.

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (In-App Support Chat):** As an MSME user, I can open the eGovAI chat assistant inside the mobile app to ask questions about loan terms, required eGov documents, or application progress.
- **US-2 (Contextual Guidance):** As an applicant, eGovAI recognizes my current application state (e.g. PhilSys verified, DTI pending) to provide tailored next-step instructions.
- **US-3 (Privacy Guardrail):** As a system admin, all user prompts pass through an Express backend sanitizer to mask sensitive PII (TIN, PhilSys ID, SSN) before reaching external AI endpoints.

### Acceptance Criteria
- [ ] **AC-1:** Mobile app embeds an interactive eGovAI chat UI component (`EGovAIChatModal.tsx`) with streaming or real-time message exchange.
- [ ] **AC-2:** Backend endpoint `POST /api/support/chat` accepts prompt payloads, strips/masks PII, forwards to eGovAI platform API, and returns formatted responses.
- [ ] **AC-3:** eGovAI supports structured quick-action buttons (e.g., "Check Loan Status", "How to verify DTI", "PhilSys Help").
- [ ] **AC-4:** System gracefully falls back to human customer support or FAQ cards if eGovAI endpoint is unreachable or returns a low-confidence response.

## 3. Out of Scope
- Direct client-to-AI endpoint calling (must proxy via Express backend).
- Binding automated legal loan approvals to AI outputs (AI is informational only).
