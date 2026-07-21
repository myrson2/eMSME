import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import getDb from '../../db';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { generateAmortizationSchedule } from '../../services/amortization';
import { assessLoan } from '../../services/creditEngine';

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
      res.status(403).json({
        success: false,
        errorCode: 'ONBOARDING_INCOMPLETE',
        message: 'Complete all identity, business, and financial onboarding steps before applying for a loan.',
      });
      return;
    }

    const business = await db.get('SELECT id FROM business_profiles WHERE owner_id = ?', [applicantId]);
    const loanId = uuidv4();

    await db.run(
      `INSERT INTO loan_applications (id, applicant_id, business_id, requested_amount, tenor_months, purpose, status)
       VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
      [loanId, applicantId, business.id, requestedAmount, tenorMonths, purpose]
    );

    // Trigger async credit engine assessment
    assessLoan(loanId).catch(err => console.error('[CreditEngine Error]:', err));

    res.status(201).json({
      success: true,
      loanId,
      status: 'SUBMITTED',
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

    const formattedLoans = loans.map(l => ({
      ...l,
      creditScore: l.credit_score_json ? JSON.parse(l.credit_score_json) : null,
      rejectionReasons: l.rejection_reasons_json ? JSON.parse(l.rejection_reasons_json) : null,
    }));

    res.status(200).json({ success: true, loans: formattedLoans });
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
      message: 'Offer accepted & e-signed. Disbursement request dispatched to Partner Bank API.',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to accept loan offer.' });
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
