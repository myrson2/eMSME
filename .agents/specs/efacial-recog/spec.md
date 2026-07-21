# Feature Spec: eGov Face Liveness & Biometric Verification (`efacial-recog`)

## 1. Overview & Goal
Integrate the official **eGov Face Liveness & Facial Biometrics API** into the eMSME Mobile application. This feature provides anti-spoofing liveness detection (detecting paper photos, digital screen playback, 3D masks, and AI deepfakes) combined with 1:1 facial matching against registered PhilSys or government ID photos to ensure the loan applicant is physically present.

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (Anti-Spoofing Liveness Check):** As an MSME loan applicant, I can complete a live camera facial scan (passive expression check or active motion prompt) to prove physical presence. This step runs FIRST in the identity verification flow.
- **US-2 (Liveness & Match Gateway):** As a system, facial features from the live scan are matched against the applicant's registered government ID. If liveness passes, the EXACT same facial frame is securely passed to `eVerify` for PhilSys matching. Both must pass.
- **US-3 (Instant Verification Feedback):** As an applicant, I receive immediate real-time feedback on liveness success or guidance if lighting/positioning needs adjustment.

### Acceptance Criteria
- [ ] **AC-1:** Mobile app presents an interactive camera view (`EGovFaceLivenessScanner.tsx`) with face oval overlay, real-time lighting check, and motion prompts.
- [ ] **AC-2:** Mobile client posts liveness frame payloads to Express backend proxy `POST /api/verify/face-liveness`.
- [ ] **AC-3:** Express backend validates user consent under RA 10173, attaches server API key (`EGOV_FACE_LIVENESS_KEY`), and calls upstream `EGOV_FACE_LIVENESS_URL`.
- [ ] **AC-4:** System enforces strict score thresholds:
  - `livenessScore >= 90%` AND `facialMatchScore >= 85%`: Verification Approved.
  - `livenessScore < 90%` (Spoof suspect): Rejected with `SPOOF_DETECTED` status.
  - Low lighting / motion error: Prompt user to retry with clear positioning.
- [ ] **AC-5:** Biometric privacy guardrails enforced (zero raw facial image storage on disk, in-memory processing only).

## 3. Out of Scope
- Storing unencrypted facial biometrics on database records.
- Verification of multiple faces in a single frame.
