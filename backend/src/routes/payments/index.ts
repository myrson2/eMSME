import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import getDb from '../../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

function computeDigest(amountStr: string, txnid: string, secret: string): string {
  const rawString = `${amountStr}|${txnid}`;
  return crypto.createHmac('sha256', secret).update(rawString).digest('hex');
}

// POST /api/payments/egovpay/checkout
router.post('/checkout', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { loanId, installmentId, amount, mobileNumber } = req.body;

    if (!loanId || !installmentId || !amount) {
      res.status(400).json({ success: false, message: 'loanId, installmentId, and amount are required.' });
      return;
    }

    const apiSecret = process.env.EGOVPAY_API_SECRET || 'staging_secret_key';
    const txnid = `TXN-EMSME-${Date.now()}`;
    const amountStr = Number(amount).toFixed(2);
    const digest = computeDigest(amountStr, txnid, apiSecret);

    const paymentUrl = `https://staging-checkout.egovpay.gov.ph/pay?txnid=${txnid}&amount=${amountStr}&digest=${digest}`;

    res.status(200).json({
      success: true,
      txnid,
      amount: amountStr,
      paymentUrl,
      message: 'eGovPay checkout session initiated.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to initiate eGovPay checkout.' });
  }
});

// POST /api/payments/egovpay/webhook
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { txnid, status, amount, digest, reference_no, installmentId } = req.body;
    const apiSecret = process.env.EGOVPAY_API_SECRET || 'staging_secret_key';

    if (!txnid || !status) {
      res.status(400).json({ success: false, message: 'txnid and status are required.' });
      return;
    }

    const db = await getDb();

    // SQLite Idempotency Check
    const existingTxn = await db.get('SELECT * FROM egovpay_webhooks WHERE txnid = ?', [txnid]);
    if (existingTxn) {
      res.status(200).json({ success: true, message: 'Webhook transaction already processed (idempotent).' });
      return;
    }

    // Save webhook log to database
    await db.run(
      `INSERT INTO egovpay_webhooks (txnid, status, reference_no, amount) VALUES (?, ?, ?, ?)`,
      [txnid, status, reference_no || `REF-${Date.now()}`, amount ? Number(amount) : null]
    );

    // If payment successful, update installment status
    if (status === 'PAID' || status === 'SUCCESS') {
      if (installmentId) {
        await db.run(
          `UPDATE repayment_installments SET status = 'PAID', paid_amount = ?, paid_at = ?, transaction_ref = ? WHERE id = ?`,
          [amount, new Date().toISOString(), reference_no || txnid, installmentId]
        );
      }
    }

    console.log(`[eGovPay Webhook]: Transaction ${txnid} status ${status} logged to database.`);

    res.status(200).json({ success: true, received: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Webhook handling error.' });
  }
});

export default router;
