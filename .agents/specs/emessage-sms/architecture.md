# Architecture: eMessage SMS Authentication & Notifications (`emessage-sms`)

## 1. Sequence Diagram (OTP Dispatch & Verification Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant MobileApp as React Native Mobile App
    participant Express as Express Backend Core
    participant Redis as Redis Cache (OTP Store)
    participant eMessage as eMessage Government Gateway (`https://api.egov.gov.ph`)

    %% Phase 1: Send OTP
    User->>MobileApp: Triggers Loan Release / Profile Phone Change
    MobileApp->>Express: POST /api/auth/sms/send-otp { mobileNumber }
    
    Note over Express: Generate 6-digit random OTP (e.g. 582910)\nCompute SHA-256 hash
    Express->>Redis: SET EX otp:hash:<mobileNumber> (TTL: 300s, attempts: 0)
    
    Express->>eMessage: POST /v1/sms/send (Headers: X-API-Key, X-Client-Secret)\nPayload: { to: mobileNumber, message: "Your eMSME code is 582910. Valid for 5 mins." }
    eMessage-->>Express: 200 OK { messageId: "msg_99182", status: "QUEUED" }
    Express-->>MobileApp: 200 OK { success: true, messageId: "msg_99182", expiresAt: 300 }
    MobileApp-->>User: Displays OTP Modal with 60s Cooldown Timer

    %% Phase 2: Verify OTP
    User->>MobileApp: Inputs 6-digit OTP ("582910")
    MobileApp->>Express: POST /api/auth/sms/verify-otp { mobileNumber, otpCode }
    
    Express->>Redis: GET otp:hash:<mobileNumber>
    
    alt OTP Matches & Valid (TTL > 0)
        Redis-->>Express: Returns stored SHA-256 hash & attempts < 3
        Express->>Redis: DEL otp:hash:<mobileNumber>
        Express-->>MobileApp: 200 OK { success: true, mfaVerified: true }
        MobileApp-->>User: Confirms Transaction / Action Proceeds
    else Incorrect OTP (Attempts < 3)
        Express->>Redis: INCR otp:attempts:<mobileNumber>
        Express-->>MobileApp: 400 Bad Request { success: false, message: "Invalid OTP code. 2 attempts remaining." }
        MobileApp-->>User: Highlights invalid code error
    else Max Attempts Exceeded (>= 3) or Expired
        Express->>Redis: DEL otp:hash:<mobileNumber>
        Express-->>MobileApp: 429 Too Many Requests { success: false, message: "OTP expired or max attempts exceeded. Request a new code." }
        MobileApp-->>User: Disables input & prompts user to resend
    end
```

## 2. API Integration Specifications & Tab Documentation

### 2.1 Endpoint Specification (Integration Tab)
- **HTTP Method:** `POST`
- **Gateway URL:** `https://api.egov.gov.ph/v1/sms/send`
- **Authentication:** Headers (`X-API-Key: <EMESSAGE_API_KEY>`, `X-Client-Secret: <EMESSAGE_CLIENT_SECRET>`)

### 2.2 Schemas Tab

#### Request Payload (`POST /api/auth/sms/send-otp`)
```json
{
  "mobileNumber": "+639171234567",
  "action": "DISBURSEMENT_RELEASE"
}
```

#### Upstream eMessage Gateway Request Payload (`POST https://api.egov.gov.ph/v1/sms/send`)
```json
{
  "recipient": "+639171234567",
  "sender_id": "eMSME-eGov",
  "message": "Your eMSME verification code is 582910. Valid for 5 minutes. Do not share this code with anyone.",
  "priority": "HIGH"
}
```

#### Upstream Response (`200 OK`)
```json
{
  "message_id": "MSG-EMESSAGE-20260721-88192",
  "recipient": "+639171234567",
  "status": "DELIVERED_TO_GATEWAY",
  "timestamp": "2026-07-21T14:37:00Z"
}
```

#### Verification Request Payload (`POST /api/auth/sms/verify-otp`)
```json
{
  "mobileNumber": "+639171234567",
  "otpCode": "582910"
}
```

---

## 3. Security Tab: Protection Policies
1. **SHA-256 Hashing:** OTP codes are hashed with SHA-256 before storage in Redis. Plaintext OTPs never exist in Redis keys or database tables.
2. **5-Minute Expiration (TTL):** OTPs auto-expire after 300 seconds.
3. **Attempt Limit:** Maximum 3 failed attempts before the OTP is invalidated.
4. **Rate Limiting:** Maximum 3 SMS dispatch requests per phone number per hour.
