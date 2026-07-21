# Architecture: eGovAI Intelligent Support Assistant (`egov-ai`)

## 1. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant MobileApp as React Native Mobile App
    participant Express as Express Backend Proxy (`/api/support/chat`)
    participant Sanitizer as PII Sanitizer & Context Engine
    participant eGovAI as eGovAI Platform API Gateway

    User->>MobileApp: Opens eGovAI Chat & Sends Prompt ("How to verify my BIR TIN?")
    MobileApp->>Express: POST /api/support/chat { prompt, userId, contextState }
    
    Note over Express,Sanitizer: Sanitize input (Mask TIN, PhilSys ID, Phone)
    Express->>Sanitizer: Process prompt & attach user application context
    Sanitizer-->>Express: Cleaned prompt + Context Payload
    
    Express->>eGovAI: POST EGOVAI_API_URL (Headers: Bearer EGOVAI_API_KEY)
    
    alt eGovAI Success
        eGovAI-->>Express: 200 OK { responseText, suggestedActions, intent }
        Express-->>MobileApp: 200 OK { reply: responseText, actions: suggestedActions }
        MobileApp-->>User: Renders Chat Bubble & Action Buttons
    else eGovAI Failure / Timeout
        eGovAI-->>Express: 500 / Timeout Error
        Express-->>MobileApp: 200 OK (Fallback) { reply: "I'm having trouble connecting. Here are quick FAQs...", isFallback: true }
        MobileApp-->>User: Displays Fallback FAQ & Human Support Link
    end
```

## 2. API Data Schemas & Payload Structures

### Request Payload (`POST /api/support/chat`)
```json
{
  "prompt": "What documents do I need for a Sole Proprietorship loan?",
  "sessionId": "chat_sess_89231",
  "applicationContext": {
    "currentStep": "BUSINESS_VERIFICATION",
    "businessType": "Sole Proprietorship",
    "isPhilSysVerified": true
  }
}
```

### eGovAI Gateway API Request (`POST EGOVAI_API_URL`)
```json
{
  "messages": [
    { "role": "system", "content": "You are eGovAI, official assistant for Philippine MSME loan applicants." },
    { "role": "user", "content": "What documents do I need for a Sole Proprietorship loan? [Context: Business Type: Sole Proprietorship]" }
  ],
  "temperature": 0.3,
  "max_tokens": 500
}
```

### Response Payload (`POST /api/support/chat`)
```json
{
  "success": true,
  "reply": "For a Sole Proprietorship, you need a verified DTI Business Name Certificate, BIR TIN, and active LGU Mayor's Permit.",
  "suggestedActions": [
    { "label": "Verify DTI Registration", "action": "NAVIGATE_DTI_VERIFY" },
    { "label": "Check BIR Status", "action": "NAVIGATE_BIR_VERIFY" }
  ]
}
```

## 3. Security & Privacy Guardrails
- **PII Stripping:** Phone numbers, 12-digit PhilSys IDs, and financial account numbers are sanitized regex-matched before dispatch to external LLMs.
- **API Key Storage:** `EGOVAI_API_KEY` stored exclusively in server environment variables.
- **Context Injection:** Application state injected into system prompt so answers match user's actual step in eMSME.
