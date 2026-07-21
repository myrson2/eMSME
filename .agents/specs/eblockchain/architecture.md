# Architecture: eGovChain Transaction Tracking (`eblockchain`)

## 1. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant MobileApp as React Native Mobile App
    participant Express as Express Backend Core
    participant DB as Postgres/SQLite Database
    participant Queue as Event Queue
    participant eGovChain as eGovChain DICT Node Gateway

    User->>MobileApp: Pays Loan Installment via ePay
    MobileApp->>Express: POST /api/payments/repay
    Express->>DB: Record Repayment (Status: PAID)
    Express-->>MobileApp: 200 OK (Payment Confirmed)
    
    Note over Express,Queue: Queue eGovChain Audit Record Event
    Express->>Queue: Push Event { loanId, txType: "REPAYMENT", amount, timestamp }
    
    Queue->>eGovChain: POST /v1/chain/commit (Headers: Bearer EGOVCHAIN_KEY)
    eGovChain-->>Queue: 201 Created { txHash: "0x89f2a..." }
    Queue->>DB: Update Loan Repayment with eGovChain txHash
```

## 2. Data Models & Schemas

### eGovChain Audit Event Payload
```json
{
  "event": "LOAN_REPAYMENT_COMMITTED",
  "payload": {
    "loanId": "loan_uuid_9921",
    "borrowerHash": "sha256_hash_user",
    "amountPHP": 5000.00,
    "installmentNumber": 3,
    "timestamp": 1784589200
  }
}
```

### Response from eGovChain Gateway
```json
{
  "status": "COMMITTED",
  "blockNumber": 1420982,
  "txHash": "0x8f1e2d3c4b5a69780123456789abcdef0123456789abcdef0123456789abcdef"
}
```

## 3. Security & Queue Resilience
- **Asynchronous Commitment:** eGovChain commits are queued in background workers to avoid slowing down user API responses.
- **Privacy Preservation:** No PII or plain names are stored on eGovChain; only salted SHA-256 hashes of user IDs and transaction metrics are stored.
