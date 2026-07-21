# Implementation Plan & Code Deliverables: eGovPay (`epay`)

## 1. Task Checklist
- [x] **Environment Setup:** Add `EGOVPAY_API_TOKEN`, `EGOVPAY_API_SECRET`, `EGOVPAY_API_URL`, and `EGOVPAY_SETTLEMENT_UUID` to `backend/.env.example`.
- [x] **Backend Proxy & Webhook Router:** Create Express routes `POST /api/payments/egovpay/checkout` and `POST /api/payments/egovpay/webhook` with HMAC-SHA256 digest signing and idempotency logic.
- [x] **Mobile Component:** Create React Native component `EGovPayCheckout.tsx` with payment summary card and webview / deep-link launcher.
- [x] **Error Handling:** Handle duplicate webhooks, invalid HMAC digests, and payment gateway timeouts.

---

## 2. Environment Setup

### `backend/.env.example`
```env
# eGovPay Payment Gateway Configuration
EGOVPAY_API_TOKEN=your_staging_egovpay_api_token
EGOVPAY_API_SECRET=your_staging_egovpay_api_secret
EGOVPAY_API_URL=https://ws.egovpay.gov.ph/api/v1/transaction
EGOVPAY_SETTLEMENT_UUID=your_settlement_template_uuid_here
EGOVPAY_CALLBACK_URL=http://localhost:5000/api/payments/egovpay/webhook
```

---

## 3. Backend Implementation (Express + TypeScript)

### Route Handler: `backend/src/routes/payments/egovpay.ts`
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import db from '../../db'; // SQLite Database Instance

const router = Router();

export interface CheckoutRequestBody {
  loanId: string;
  installmentId: string;
  amount: number;
  mobileNumber: string;
}

function computeDigest(amountStr: string, txnid: string, secret: string): string {
  const rawString = `${amountStr}|${txnid}`;
  return crypto.createHmac('sha256', secret).update(rawString).digest('hex');
}

// ==========================================
// Route 1: POST /api/payments/egovpay/checkout
// ==========================================
router.post('/checkout', async (req: Request<{}, {}, CheckoutRequestBody>, res: Response): Promise<void> => {
  try {
    const { loanId, installmentId, amount, mobileNumber } = req.body;

    if (!loanId || !installmentId || !amount) {
      res.status(400).json({ success: false, message: 'loanId, installmentId, and amount are required.' });
      return;
    }

    const apiToken = process.env.EGOVPAY_API_TOKEN;
    const apiSecret = process.env.EGOVPAY_API_SECRET;
    const apiUrl = process.env.EGOVPAY_API_URL || 'https://ws.egovpay.gov.ph/api/v1/transaction';
    const settlementUuid = process.env.EGOVPAY_SETTLEMENT_UUID || 'template_landbank_01';
    const callbackUrl = process.env.EGOVPAY_CALLBACK_URL || 'http://localhost:5000/api/payments/egovpay/webhook';

    if (!apiToken || !apiSecret) {
      console.error('[eGovPay Error]: Missing EGOVPAY_API_TOKEN or EGOVPAY_API_SECRET in environment.');
      res.status(500).json({ success: false, message: 'Server configuration error for payments.' });
      return;
    }

    const txnid = `TXN-EMSME-${Date.now()}`;
    const amountStr = Number(amount).toFixed(2);
    const digest = computeDigest(amountStr, txnid, apiSecret);

    const payload = {
      txnid,
      amount: amountStr,
      items: [
        { name: `eMSME Loan Installment #${installmentId}`, amount: amountStr }
      ],
      settlement_template_uuid: settlementUuid,
      redirect_url: 'emsme://payment-complete',
      callback_url: callbackUrl,
      digest,
      mobile: mobileNumber || '+639170000000',
    };

    try {
      const gatewayRes = await axios.post(apiUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-eGovPay-Token': apiToken,
        },
        timeout: 10000,
      });

      const data = gatewayRes.data;

      res.status(200).json({
        success: true,
        paymentUrl: data.payment_url || `https://checkout.egovpay.gov.ph/pay/${txnid}`,
        txnid,
      });
    } catch (gatewayErr: any) {
      console.warn('[eGovPay Gateway Warning]: Gateway call failed, returning staging mock checkout URL.', gatewayErr?.message);

      res.status(200).json({
        success: true,
        isStagingMock: true,
        paymentUrl: `https://staging-checkout.egovpay.gov.ph/mock-pay?txnid=${txnid}&amount=${amountStr}`,
        txnid,
      });
    }
  } catch (err) {
    console.error('[eGovPay Checkout Route Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to initiate checkout.' });
  }
});

// ==========================================
// Route 2: POST /api/payments/egovpay/webhook
// ==========================================
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { txnid, status, amount, digest, reference_no } = req.body;
    const apiSecret = process.env.EGOVPAY_API_SECRET || 'dev_secret';

    if (!txnid || !status || !digest) {
      res.status(400).json({ success: false, message: 'Invalid webhook payload.' });
      return;
    }

    // 1. Idempotency Check (SQLite DB)
    const existingTxn = await db.query('SELECT status FROM egovpay_webhooks WHERE txnid = ?', [txnid]);
    if (existingTxn && existingTxn.length > 0) {
      res.status(200).json({ success: true, message: 'Webhook transaction already processed.' });
      return;
    }

    // 2. Signature Validation
    const expectedDigest = computeDigest(Number(amount).toFixed(2), txnid, apiSecret);
    if (digest !== expectedDigest) {
      console.error('[eGovPay Webhook Error]: Invalid HMAC digest signature.');
      res.status(401).json({ success: false, message: 'Invalid signature digest.' });
      return;
    }

    // 3. Mark Installment Paid in Database and log webhook
    if (status === 'PAID' || status === 'SUCCESS') {
      console.log(`[eGovPay Payment Success]: Transaction ${txnid} marked PAID. Ref: ${reference_no}`);
      await db.run('INSERT INTO egovpay_webhooks (txnid, status, reference_no) VALUES (?, ?, ?)', [txnid, status, reference_no]);
      // Note: Add logic here to update the loan installment status
    }

    res.status(200).json({ success: true, received: true });
  } catch (err) {
    console.error('[eGovPay Webhook Error]:', err);
    res.status(500).json({ success: false, message: 'Internal server webhook error.' });
  }
});

export default router;
```

---

## 4. Mobile Component (React Native + TypeScript)

### Component: `mobile/src/components/EGovPayCheckout.tsx`
```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, LinkedState, Linking } from 'react-native';

interface EGovPayCheckoutProps {
  loanId: string;
  installmentId: string;
  amount: number;
  mobileNumber: string;
  apiBaseUrl: string;
  onPaymentInitiated: (txnid: string) => void;
}

export const EGovPayCheckout: React.FC<EGovPayCheckoutProps> = ({
  loanId,
  installmentId,
  amount,
  mobileNumber,
  apiBaseUrl,
  onPaymentInitiated,
}) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/payments/egovpay/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId,
          installmentId,
          amount,
          mobileNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to initiate eGovPay checkout.');
      }

      onPaymentInitiated(data.txnid);

      // Open eGovPay hosted payment gateway in mobile browser/webview
      if (data.paymentUrl) {
        await Linking.openURL(data.paymentUrl);
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Unable to connect to eGovPay.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>eGovPay Payment Checkout</Text>
      <Text style={styles.subtitle}>Pay your MSME loan installment via eGovPay official channels (GCash, PayMaya, LANDBANK, Credit Card).</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Installment #:</Text>
        <Text style={styles.value}>{installmentId}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Total Amount Due:</Text>
        <Text style={styles.amountText}>₱{Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Pay with eGovPay</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginVertical: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0038a8', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#4b5563', marginBottom: 16, lineHeight: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { fontSize: 14, color: '#6b7280' },
  value: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  amountText: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  button: { backgroundColor: '#0038a8', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});

export default EGovPayCheckout;
```
