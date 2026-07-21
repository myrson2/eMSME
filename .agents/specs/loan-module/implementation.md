# Implementation Tasks & Deliverables: Loan Module (`loan-module`)

## 1. Task Checklist
- [ ] **Database Schema:** Create SQLite migration for `loan_applications` and `repayment_installments` tables.
- [ ] **Loan Application Route:** Implement `POST /api/loans/apply` with onboarding completeness gate.
- [ ] **State Transition Guard:** Implement `assertValidTransition()` utility to prevent invalid state jumps.
- [ ] **Loan Detail Route:** Implement `GET /api/loans/:loanId` and `GET /api/loans/my`.
- [ ] **Loan Acceptance Route:** Implement `POST /api/loans/:loanId/accept` and Partner Bank disbursement API call.
- [ ] **Disbursement Webhook:** Implement `POST /api/loans/webhook/disbursement` with signature validation and amortization schedule generation.
- [ ] **Amortization Calculator:** Implement a pure function `generateAmortizationSchedule(amount, rate, tenorMonths)` returning `RepaymentInstallment[]`.
- [ ] **Mobile Screens:** Create `LoanApplicationScreen.tsx`, `LoanStatusScreen.tsx`, `LoanOfferScreen.tsx`.
- [ ] **eGovChain Audit:** Fire-and-log `LOAN_DISBURSED` event on successful disbursement.

---

## 2. Backend Implementation

### Service: `backend/src/services/amortization.ts`
```typescript
export interface InstallmentRow {
  installmentNumber: number;
  dueDate: string; // ISO date
  principalAmount: number;
  interestAmount: number;
  totalAmountDue: number;
}

/**
 * Generates a monthly reducing-balance amortization schedule.
 * @param principal - Total loan amount in PHP
 * @param annualRatePercent - Annual interest rate as a percentage (e.g., 12 for 12%)
 * @param tenorMonths - Number of monthly installments
 * @param firstDueDate - ISO date string for first installment due date
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  tenorMonths: number,
  firstDueDate: Date
): InstallmentRow[] {
  const monthlyRate = annualRatePercent / 100 / 12;
  const monthlyPayment = monthlyRate === 0
    ? principal / tenorMonths
    : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenorMonths))
      / (Math.pow(1 + monthlyRate, tenorMonths) - 1);

  const schedule: InstallmentRow[] = [];
  let balance = principal;

  for (let i = 1; i <= tenorMonths; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = monthlyPayment - interest;
    balance -= principalPaid;

    const dueDate = new Date(firstDueDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));

    schedule.push({
      installmentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      principalAmount: parseFloat(principalPaid.toFixed(2)),
      interestAmount: parseFloat(interest.toFixed(2)),
      totalAmountDue: parseFloat(monthlyPayment.toFixed(2)),
    });
  }

  return schedule;
}
```

### Route: `backend/src/routes/loans/index.ts`
```typescript
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db';
import { assertValidTransition } from '../../utils/loanStateMachine';
import { generateAmortizationSchedule } from '../../services/amortization';

const router = Router();

// POST /api/loans/apply
router.post('/apply', async (req: Request, res: Response): Promise<void> => {
  const { requestedAmount, tenorMonths, purpose } = req.body;
  const applicantId = (req as any).user.userId; // From JWT middleware

  // Guard: Check onboarding completeness
  const user = await db.get('SELECT is_philsys_verified FROM users WHERE id = ?', [applicantId]);
  const business = await db.get('SELECT id, is_gov_verified FROM business_profiles WHERE owner_id = ?', [applicantId]);
  const financials = await db.get('SELECT id FROM financial_profiles WHERE business_id = ?', [business?.id]);

  if (!user?.is_philsys_verified || !business?.is_gov_verified || !financials) {
    res.status(403).json({ success: false, errorCode: 'ONBOARDING_INCOMPLETE', message: 'Complete identity, business, and financial verification first.' });
    return;
  }

  const loanId = uuidv4();
  await db.run(
    `INSERT INTO loan_applications (id, applicant_id, business_id, requested_amount, tenor_months, purpose, status)
     VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
    [loanId, applicantId, business.id, requestedAmount, tenorMonths, purpose]
  );

  // Trigger credit engine async (do not await)
  triggerCreditAssessment(loanId).catch(console.error);

  res.status(201).json({ success: true, loanId, status: 'SUBMITTED' });
});

// GET /api/loans/:loanId
router.get('/:loanId', async (req: Request, res: Response): Promise<void> => {
  const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [req.params.loanId]);
  if (!loan) { res.status(404).json({ success: false, message: 'Loan not found.' }); return; }

  const installments = await db.all('SELECT * FROM repayment_installments WHERE loan_id = ? ORDER BY installment_number', [loan.id]);
  res.status(200).json({ success: true, loan: { ...loan, installments } });
});

// POST /api/loans/:loanId/accept
router.post('/:loanId/accept', async (req: Request, res: Response): Promise<void> => {
  const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [req.params.loanId]);
  if (!loan) { res.status(404).json({ success: false, message: 'Loan not found.' }); return; }

  assertValidTransition(loan.status, 'DISBURSEMENT_PENDING');

  await db.run(
    `UPDATE loan_applications SET status = 'DISBURSEMENT_PENDING', e_signed_at = ? WHERE id = ?`,
    [new Date().toISOString(), loan.id]
  );

  // TODO: Call Partner Bank disbursement API
  // await partnerBankService.requestDisbursement({ loanId: loan.id, amount: loan.approved_amount });

  res.status(200).json({ success: true, status: 'DISBURSEMENT_PENDING', message: 'Disbursement request sent to partner bank.' });
});

// POST /api/loans/webhook/disbursement
router.post('/webhook/disbursement', async (req: Request, res: Response): Promise<void> => {
  const { loanId, status, disbursedAmount, disbursementRef, disbursedAt } = req.body;
  // TODO: Validate HMAC signature from Partner Bank
  if (status !== 'SUCCESS') {
    res.status(200).json({ received: true });
    return;
  }

  const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [loanId]);
  if (!loan) { res.status(404).json({ message: 'Loan not found.' }); return; }

  assertValidTransition(loan.status, 'REPAYMENT_ACTIVE');

  await db.run(
    `UPDATE loan_applications SET status = 'REPAYMENT_ACTIVE', disbursed_at = ?, disbursement_ref = ? WHERE id = ?`,
    [disbursedAt, disbursementRef, loanId]
  );

  // Generate amortization schedule
  const schedule = generateAmortizationSchedule(
    disbursedAmount,
    loan.interest_rate_annual,
    loan.tenor_months,
    new Date(disbursedAt)
  );

  for (const row of schedule) {
    await db.run(
      `INSERT INTO repayment_installments (id, loan_id, installment_number, due_date, principal_amount, interest_amount, total_amount_due, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [uuidv4(), loanId, row.installmentNumber, row.dueDate, row.principalAmount, row.interestAmount, row.totalAmountDue]
    );
  }

  res.status(200).json({ received: true });
});

async function triggerCreditAssessment(loanId: string) {
  // Delegate to credit-engine service (separate spec)
  const { assessLoan } = await import('../../services/creditEngine');
  await assessLoan(loanId);
}

export default router;
```
