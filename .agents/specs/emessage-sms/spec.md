# Feature Spec: eMessage SMS Authentication & Notifications (`emessage-sms`)

## 1. Overview & Goal
Integrate **eMessage** (the official eGovPH SMS Gateway service) into the eMSME application platform. eMessage provides 6-digit SMS One-Time Passwords (OTPs) for multi-factor authentication (MFA step-up) during critical actions (e.g. loan disbursement release, profile phone updates) and delivers transactional SMS notifications for loan status updates and repayment due dates.

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (SMS OTP Step-Up Auth):** As an MSME loan applicant, I receive a 6-digit SMS OTP via eMessage when releasing funds or making major account updates.
- **US-2 (Loan Status Notifications):** As a borrower, I receive automated transactional SMS alerts when my loan is approved, disbursed, or nearing installment due dates.
- **US-3 (OTP Resend & Expiration):** As a user, I can request a resend after a 60-second cooldown timer, and OTPs expire automatically after 5 minutes.

### Acceptance Criteria
- [ ] **AC-1:** Mobile app presents an interactive SMS OTP input modal (`EGovSMSOTPModal.tsx`) with 6-digit input cells, countdown timer, and resend trigger.
- [ ] **AC-2:** Backend endpoint `POST /api/auth/sms/send-otp` generates a secure 6-digit code, hashes it with SHA-256 in Redis (5-min TTL), and calls eMessage API (`EMESSAGE_API_URL`).
- [ ] **AC-3:** Backend endpoint `POST /api/auth/sms/verify-otp` validates the user-submitted OTP against Redis, enforcing a maximum of 3 failed attempts per OTP window.
- [ ] **AC-4:** System enforces strict rate limits (maximum 3 OTP requests per phone number per hour) to prevent SMS flooding attacks.

## 3. Out of Scope
- Promotional/marketing bulk SMS blasts.
- Storing unhashed plain-text OTPs in database logs.
