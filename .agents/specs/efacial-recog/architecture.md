# Architecture: eGov Face Liveness & Biometric Verification (`efacial-recog`)

## 1. Sequence Diagram (Data Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant MobileApp as React Native Mobile App
    participant Express as Express Backend Proxy (`/api/verify/face-liveness`)
    participant DB as Postgres/SQLite Database
    participant FaceLiveness as eGov Face Liveness API (`https://api.egov.gov.ph`)

    User->>MobileApp: Aligns face inside oval & completes motion challenge (blink/smile)
    MobileApp->>Express: POST /api/verify/face-liveness { faceImageBase64, targetIdPhotoBase64, userConsent }
    
    Note over Express: Validate RA 10173 user consent & sanitize payload
    Express->>FaceLiveness: POST /v1/identity/face-liveness (Headers: X-API-Key, X-Client-Secret)
    
    alt Liveness & Match Succeed (Liveness >= 90%, Match >= 85%)
        FaceLiveness-->>Express: 200 OK { isLive: true, livenessScore: 97.2, matchScore: 91.4, auditRefId: "FL-88102" }
        Express->>DB: Update UserProfile (isFacialVerified: true, livenessRefId: "FL-88102")
        Express-->>MobileApp: 200 OK { success: true, isLive: true, auditRefId: "FL-88102" }
        MobileApp-->>User: Displays Green "Liveness Verified" Confirmation
    else Spoof Detected or Low Confidence (< 90%)
        FaceLiveness-->>Express: 200 OK { isLive: false, livenessScore: 42.0, reason: "POSSIBLE_SPOOF_PRINT" }
        Express-->>MobileApp: 422 Unprocessable Entity { success: false, reason: "SPOOF_DETECTED", message: "Liveness verification failed. Please scan a live face." }
        MobileApp-->>User: Displays Warning Prompt & Retry Option
    else Upstream API Error / Timeout
        FaceLiveness-->>Express: 500 / 504 Timeout
        Express-->>MobileApp: 502 Bad Gateway { success: false, fallbackToManual: true }
        MobileApp-->>User: Offers Fallback to Manual Video KYC Verification Queue
    end
```

## 2. API Integration Specifications & Tab Documentation

### 2.1 Endpoint Specification (Integration Tab)
- **HTTP Method:** `POST`
- **Gateway URL:** `https://api.egov.gov.ph/v1/identity/face-liveness`
- **Authentication:** Server-to-Server Headers (`X-API-Key: <EGOV_FACE_LIVENESS_KEY>`, `X-Client-Secret: <EGOV_FACE_LIVENESS_SECRET>`)

### 2.2 Schemas Tab

#### Request Payload (`POST /api/verify/face-liveness`)
```json
{
  "faceImageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "targetIdPhotoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "checkType": "PASSIVE_AND_ACTIVE",
  "userConsent": true
}
```

#### Upstream Response (`200 OK`)
```json
{
  "audit_ref_id": "FL-PHILSYS-20260721-99012",
  "is_live": true,
  "liveness_score": 97.5,
  "match_score": 92.1,
  "anti_spoofing_flags": {
    "print_attack_detected": false,
    "screen_replay_detected": false,
    "deepfake_detected": false
  },
  "processed_at": "2026-07-21T14:32:00Z"
}
```

#### Client Response Payload (`200 OK`)
```json
{
  "success": true,
  "isLive": true,
  "livenessScore": 97.5,
  "matchScore": 92.1,
  "auditRefId": "FL-PHILSYS-20260721-99012"
}
```

---

## 3. Security Tab: Biometric Data Protection
1. **RA 10173 Compliance:** Explicit user consent required before camera activation.
2. **In-Memory Volatile Processing:** Base64 facial images are held in volatile RAM only for the duration of the HTTP API call and purged immediately afterwards.
3. **Transit Security:** TLS 1.3 encryption required for all mobile-to-backend and backend-to-eGov network calls.
