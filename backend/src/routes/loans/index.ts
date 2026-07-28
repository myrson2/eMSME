import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';
import { generateAmortizationSchedule } from '../../services/amortization.js';
import { assessLoan } from '../../services/creditEngine.js';
import { sendEMessageSms, toEMessageMobileNumber } from '../../services/emessage.js';

const router = Router();

type LoanStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'UNDERWRITING'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSEMENT_PENDING'
  | 'REPAYMENT_ACTIVE'
  | 'COMPLETED'
  | 'DEFAULTED';

const VALID_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_VERIFICATION'],
  UNDER_VERIFICATION: ['APPROVED', 'UNDERWRITING', 'REJECTED'],
  UNDERWRITING: ['APPROVED', 'REJECTED'],
  APPROVED: ['DISBURSEMENT_PENDING', 'REJECTED'],
  REJECTED: [],
  DISBURSEMENT_PENDING: ['REPAYMENT_ACTIVE'],
  REPAYMENT_ACTIVE: ['COMPLETED', 'DEFAULTED'],
  COMPLETED: [],
  DEFAULTED: [],
};

function assertValidTransition(from: LoanStatus, to: LoanStatus): void {
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    throw new Error(`Invalid loan state transition: ${from} → ${to}`);
  }
}

// POST /api/loans/apply
router.post('/apply', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { requestedAmount, tenorMonths, purpose } = req.body;
    const applicantId = req.user?.userId;

    if (!requestedAmount || !tenorMonths || !purpose) {
      res.status(400).json({ success: false, message: 'requestedAmount, tenorMonths, and purpose are required.' });
      return;
    }

    const db = await getDb();

    // Check onboarding completeness gate
    const progress = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [applicantId]);
    if (!progress || !progress.financials_completed) {
      console.warn('[Demo Bypass] Onboarding incomplete, but allowing loan submission for presentation.');
    }

    let business = await db.get('SELECT id FROM business_profiles WHERE owner_id = ?', [applicantId]);
    
    // Demo fallback: inject a mock business ID if none exists
    if (!business) {
      business = { id: 'mock-business-123' };
    }
    const loanId = uuidv4();

    await db.run(
      `INSERT INTO loan_applications (id, applicant_id, business_id, requested_amount, tenor_months, purpose, status)
       VALUES (?, ?, ?, ?, ?, ?, 'UNDER_VERIFICATION')`,
      [loanId, applicantId, business.id, requestedAmount, tenorMonths, purpose]
    );

    // Trigger async credit engine assessment after a 10-second processing delay
    setTimeout(() => {
      assessLoan(loanId).catch(err => console.error('[CreditEngine Error]:', err));
    }, 10000);

    res.status(201).json({
      success: true,
      loanId,
      status: 'UNDER_VERIFICATION',
      message: 'Loan application submitted successfully. Credit risk assessment in progress.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to submit loan application.' });
  }
});

// GET /api/loans/my
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const applicantId = req.user?.userId;
    const db = await getDb();

    const loans = await db.all('SELECT * FROM loan_applications WHERE applicant_id = ? ORDER BY created_at DESC', [applicantId]);

    const userLoans = await Promise.all(loans.map(async (l: any) => {
      let nextInstallmentAmount = null;
      if (l.status === 'REPAYMENT_ACTIVE') {
        const next = await db.get(
          'SELECT total_amount_due FROM repayment_installments WHERE loan_id = ? AND status = "PENDING" ORDER BY installment_number ASC LIMIT 1',
          [l.id]
        );
        if (next) nextInstallmentAmount = next.total_amount_due;
      }
      return {
        ...l,
        next_installment_amount: nextInstallmentAmount,
        creditScore: l.credit_score_json ? JSON.parse(l.credit_score_json) : null,
        rejectionReasons: l.rejection_reasons_json ? JSON.parse(l.rejection_reasons_json) : null,
      };
    }));

    res.status(200).json({ success: true, loans: userLoans });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve loans.' });
  }
});

// GET /api/loans/:loanId
router.get('/:loanId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const db = await getDb();

    const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [loanId]);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan application not found.' });
      return;
    }

    const installments = await db.all('SELECT * FROM repayment_installments WHERE loan_id = ? ORDER BY installment_number ASC', [loanId]);

    res.status(200).json({
      success: true,
      loan: {
        ...loan,
        creditScore: loan.credit_score_json ? JSON.parse(loan.credit_score_json) : null,
        rejectionReasons: loan.rejection_reasons_json ? JSON.parse(loan.rejection_reasons_json) : null,
        installments,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve loan detail.' });
  }
});

// POST /api/loans/:loanId/accept
router.post('/:loanId/accept', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const db = await getDb();

    const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [loanId]);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    assertValidTransition(loan.status, 'DISBURSEMENT_PENDING');

    const nowIso = new Date().toISOString();
    await db.run(
      `UPDATE loan_applications SET status = 'DISBURSEMENT_PENDING', e_signed_at = ?, updated_at = ? WHERE id = ?`,
      [nowIso, nowIso, loanId]
    );

    res.status(200).json({
      success: true,
      status: 'DISBURSEMENT_PENDING',
      message: 'Offer accepted & e-signed. Loan is ready for cash out.',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to accept loan offer.' });
  }
});

// POST /api/loans/:loanId/disburse (Mock Cash Out)
router.post('/:loanId/disburse', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const db = await getDb();

    const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [loanId]);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    assertValidTransition(loan.status, 'REPAYMENT_ACTIVE'); // Actually from DISBURSEMENT_PENDING -> REPAYMENT_ACTIVE

    const applicant = await db.get('SELECT mobileNumber FROM users WHERE id = ?', [loan.applicant_id]);
    const schedule = generateAmortizationSchedule(loan.approved_amount || loan.requested_amount, loan.interest_rate_annual || 8, loan.tenor_months, new Date());
    
    const disbursedNowIso = new Date().toISOString();
    await db.run(
      `UPDATE loan_applications SET status = 'REPAYMENT_ACTIVE', disbursed_at = ?, disbursement_ref = ?, updated_at = ? WHERE id = ?`,
      [disbursedNowIso, 'DISB-DEMO-' + Date.now(), disbursedNowIso, loanId]
    );

    for (const row of schedule) {
      await db.run(
        `INSERT INTO repayment_installments (id, loan_id, installment_number, due_date, principal_amount, interest_amount, total_amount_due, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [uuidv4(), loanId, row.installmentNumber, row.dueDate, row.principalAmount, row.interestAmount, row.totalAmountDue]
      );
    }

    // Send eMessage Cash Out receipt
    if (applicant?.mobileNumber) {
      const providerMobile = toEMessageMobileNumber(applicant.mobileNumber);
      const msg = `eMSME Alert: Your loan of ₱${(loan.approved_amount || loan.requested_amount).toLocaleString()} has been successfully DISBURSED to your eGovPay Wallet! Ref: DISB-DEMO-${Date.now()}`;
      
      if (process.env.EMESSAGE_API_URL && process.env.EMESSAGE_API_TOKEN) {
        await sendEMessageSms(providerMobile, msg).catch(() => {});
      } else {
        console.warn(`[eMessage STAGING] Cash out SMS to ${providerMobile}: ${msg}`);
      }
    }

    res.status(200).json({ success: true, status: 'REPAYMENT_ACTIVE', message: 'Funds disbursed successfully.' });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to disburse funds.' });
  }
});

// POST /api/loans/:loanId/repay (Mock eGovPay Payment)
router.post('/:loanId/repay', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { loanId } = req.params;
    const db = await getDb();

    const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [loanId]);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    assertValidTransition(loan.status, 'REPAYMENT_ACTIVE');

    const nextInstallment = await db.get(
      'SELECT * FROM repayment_installments WHERE loan_id = ? AND status = "PENDING" ORDER BY installment_number ASC LIMIT 1',
      [loanId]
    );

    if (!nextInstallment) {
      res.status(400).json({ success: false, message: 'No pending installments found.' });
      return;
    }

    const nowIso = new Date().toISOString();
    await db.run('UPDATE repayment_installments SET status = "PAID", updated_at = ? WHERE id = ?', [nowIso, nextInstallment.id]);

    const remaining = await db.get(
      'SELECT COUNT(*) as count FROM repayment_installments WHERE loan_id = ? AND status = "PENDING"',
      [loanId]
    );

    let newStatus = loan.status;
    if (remaining.count === 0) {
      newStatus = 'COMPLETED';
      await db.run('UPDATE loan_applications SET status = "COMPLETED", updated_at = ? WHERE id = ?', [nowIso, loanId]);
    }

    // Send eMessage Repayment receipt
    const applicant = await db.get('SELECT mobileNumber FROM users WHERE id = ?', [loan.applicant_id]);
    if (applicant?.mobileNumber) {
      const providerMobile = toEMessageMobileNumber(applicant.mobileNumber);
      const msg = `eMSME Alert: We have received your payment of ₱${nextInstallment.total_amount_due.toLocaleString()} via eGovPay for Loan #${loanId.slice(-6).toUpperCase()}. Thank you!`;
      
      if (process.env.EMESSAGE_API_URL && process.env.EMESSAGE_API_TOKEN) {
        await sendEMessageSms(providerMobile, msg).catch(() => {});
      } else {
        console.warn(`[eMessage STAGING] Repayment SMS to ${providerMobile}: ${msg}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully.',
      newStatus,
      paidAmount: nextInstallment.total_amount_due,
      remainingInstallments: remaining.count,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to process payment.' });
  }
});

// POST /api/loans/webhook/disbursement (Partner Bank Webhook)
router.post('/webhook/disbursement', async (req: Request, res: Response): Promise<void> => {
  try {
    const { loanId, status, disbursedAmount, disbursementRef, disbursedAt } = req.body;

    if (!loanId || !status) {
      res.status(400).json({ success: false, message: 'loanId and status are required.' });
      return;
    }

    const db = await getDb();
    const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [loanId]);

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    if (status !== 'SUCCESS') {
      res.status(200).json({ received: true, status: 'IGNORED_NON_SUCCESS' });
      return;
    }

    assertValidTransition(loan.status, 'REPAYMENT_ACTIVE');

    const disDate = disbursedAt || new Date().toISOString();
    const disRef = disbursementRef || `LBP-REF-${Date.now()}`;

    await db.run(
      `UPDATE loan_applications SET
        status = 'REPAYMENT_ACTIVE',
        disbursed_at = ?,
        disbursement_ref = ?,
        updated_at = ?
       WHERE id = ?`,
      [disDate, disRef, new Date().toISOString(), loanId]
    );

    // Generate amortization schedule in database
    const schedule = generateAmortizationSchedule(
      disbursedAmount || loan.approved_amount || loan.requested_amount,
      loan.interest_rate_annual || 10,
      loan.tenor_months,
      new Date(disDate)
    );

    for (const row of schedule) {
      await db.run(
        `INSERT INTO repayment_installments (id, loan_id, installment_number, due_date, principal_amount, interest_amount, total_amount_due, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [uuidv4(), loanId, row.installmentNumber, row.dueDate, row.principalAmount, row.interestAmount, row.totalAmountDue]
      );
    }

    console.log(`[Disbursement Webhook]: Loan ${loanId} marked REPAYMENT_ACTIVE. ${schedule.length} installments created.`);

    res.status(200).json({ received: true, status: 'REPAYMENT_ACTIVE' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Webhook processing error.' });
  }
});

export default router;
