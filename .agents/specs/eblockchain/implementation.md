# Implementation Tasks & Deliverables: eGovChain (`eblockchain`)

## 1. Task Checklist
- [x] **Environment Setup:** Add `EGOVCHAIN_API_KEY` & `EGOVCHAIN_NODE_URL` to `backend/.env.example`.
- [x] **Backend Service & Gateway:** Create `backend/src/services/egovchain.ts` with SHA-256 hashing and commit worker.
- [x] **Express Verification Route:** Create `POST /api/blockchain/verify` to validate txHashes.
- [x] **Mobile UI Badge:** Render eGovChain verification badges in loan detail screens.

---

## 2. Backend Implementation (Express + TypeScript)

### Service: `backend/src/services/egovchain.ts`
```typescript
import axios from 'axios';
import crypto from 'crypto';

export interface EGovChainCommitRequest {
  loanId: string;
  userId: string;
  eventType: 'LOAN_APPROVED' | 'DISBURSED' | 'REPAYMENT';
  amount: number;
}

export interface EGovChainCommitResult {
  status: 'COMMITTED' | 'FAILED';
  txHash?: string;
  blockNumber?: number;
}

export async function commitToEGovChain(req: EGovChainCommitRequest): Promise<EGovChainCommitResult> {
  const nodeUrl = process.env.EGOVCHAIN_NODE_URL || 'https://api.egov.gov.ph/v1/chain/commit';
  const apiKey = process.env.EGOVCHAIN_API_KEY;

  // Salt and hash sensitive fields for Privacy Act compliance (ADR-002, ADR-003)
  const salt = crypto.randomBytes(16).toString('hex');
  const userHash = crypto.createHash('sha256').update(req.userId + salt).digest('hex');
  const loanHash = crypto.createHash('sha256').update(req.loanId + salt).digest('hex');

  const payload = {
    loanId: loanHash,
    userHash,
    eventType: req.eventType,
    amount: req.amount,
    timestamp: Math.floor(Date.now() / 1000),
  };

  try {
    const res = await axios.post<EGovChainCommitResult>(nodeUrl, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return res.data;
  } catch (err: any) {
    console.error('[eGovChain Commit Error]:', err?.response?.data || err.message);
    return { status: 'FAILED' };
  }
}
```
