# Feature Spec: eGovChain Transaction Tracking (`eblockchain`)

## 1. Overview & Goal
Integrate **eGovChain** (the DICT blockchain layer for Philippine government digital services) into the eMSME application platform. eGovChain creates immutable audit logs of loan disbursements, repayments, and credit approval state transitions to prevent financial tampering and ensure transparent governance.

## 2. User Stories & Acceptance Criteria

### User Stories
- **US-1 (Auditable Transactions):** As a government auditor or lender, I can view immutable transaction hashes on eGovChain for every loan release and repayment.
- **US-2 (Tamper-Proof State):** As an applicant, my loan approval status is recorded to eGovChain so that my loan records cannot be altered or retroactively faked.

### Acceptance Criteria
- [ ] **AC-1:** Backend service emits asynchronous transaction events to eGovChain upon loan approval, fund disbursement via ePay, and installment repayment.
- [ ] **AC-2:** Express route `POST /api/blockchain/verify` checks transaction hash authenticity against eGovChain nodes.
- [ ] **AC-3:** Mobile app displays eGovChain transaction hash badges on the loan details screen.

## 3. Out of Scope
- Direct cryptocurrency minting or public token trading (eGovChain is strictly an enterprise governance & audit ledger).
