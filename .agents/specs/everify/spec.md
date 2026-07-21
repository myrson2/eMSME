# Feature Spec: eVerify PhilSys Identity Verification (`everify`)

## 1. Overview & Goal
Integrate **eVerify** (the official Philippine National ID Authentication Service / NIDAS provided by PSA & DICT) into the eMSME application platform. eVerify validates an applicant's PhilSys Card Number (PCN), ePhilID QR code, and facial biometrics against official government identity databases to prevent loan identity theft and automate e-KYC.

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (National ID & QR Verification):** As an MSME loan applicant, I can enter my 12-digit PhilSys Card Number (PCN) or scan my ePhilID QR code on the mobile app to verify my official identity.
- **US-2 (Facial Liveness Match):** As a system, eVerify receives the facial capture passed from the successful `eFacial-recog` liveness check, and compares it against the PhilSys registered photo to confirm physical identity match.
- **US-3 (Automated Profile Population):** As an applicant, upon successful eVerify validation, my full name, date of birth, gender, and registered address are automatically filled into my eMSME profile.

### Acceptance Criteria
- [ ] **AC-1:** Mobile app provides an identity verification screen allowing manual PCN input or ePhilID QR code scanner. Camera facial check is handled by `eFacial-recog` first.
- [ ] **AC-2:** Mobile client transmits payload (including the pre-validated facial frame from `eFacial-recog`) to Express backend proxy endpoint `POST /api/verify/philsys`.
- [ ] **AC-3:** Backend proxy signs requests using server credentials (`EVERIFY_CLIENT_SECRET`) and communicates with `EVERIFY_API_URL`.
- [ ] **AC-4:** On successful match (`matchScore >= 85%`), backend updates `UserProfile` with `isPhilSysVerified: true`, records `everifyRefId`, and auto-populates user details.
- [ ] **AC-5:** Edge cases handled gracefully:
  - Invalid PCN format or un-registered ID (400 Bad Request)
  - Low facial match confidence score < 85% (422 Unprocessable Entity with selfie retry prompt)
  - Upstream eVerify server down / timeout (502 Bad Gateway with fallback to manual ID upload queue)

## 3. Out of Scope
- Verification of non-Philippine foreign passports in this iteration.
- Storing raw unencrypted biometric facial images on backend disks.
