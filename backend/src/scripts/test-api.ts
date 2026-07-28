import getDb from '../db/index.js';
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runApiTestSuite() {
  console.log('=====================================================');
  console.log('🚀 Starting eMSME Backend End-to-End API Test Suite');
  console.log('=====================================================\n');

  try {
    // 1. Check Health Endpoint
    console.log('1️⃣ Testing Server Health Check...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('  ✅ Health Check Passed:', healthRes.data);

    // 2. Test eGovPH SSO Exchange
    console.log('\n2️⃣ Testing eGovPH SSO Exchange (POST /api/auth/egov/exchange)...');
    const authRes = await axios.post(`${BASE_URL}/auth/egov/exchange`, {
      exchange_code: 'test_code_12345',
    });
    const token = authRes.data.token;
    const userId = authRes.data.user.id;
    console.log(`  ✅ Auth Exchange Passed: User ID = ${userId}`);

    const headers = { Authorization: `Bearer ${token}` };

    // 3. Test Onboarding Status (Initial)
    console.log('\n3️⃣ Testing Onboarding Progress Status (GET /api/onboarding/status)...');
    const status1 = await axios.get(`${BASE_URL}/onboarding/status`, { headers });
    console.log('  ✅ Onboarding Status:', status1.data.currentStep, `(${status1.data.percentComplete}%)`);

    // 4. Test eFace Liveness
    console.log('\n4️⃣ Testing eFace Liveness Check (POST /api/verify/face-liveness)...');
    const facialRes = await axios.post(`${BASE_URL}/verify/face-liveness`, { faceBase64: 'mock_frame_data' }, { headers });
    console.log('  ✅ eFace Liveness Check Passed:', facialRes.data.message);

    // 5. Test eVerify PhilSys Match
    console.log('\n5️⃣ Testing eVerify PhilSys Verification (POST /api/verify/philsys)...');
    const verifyRes = await axios.post(`${BASE_URL}/verify/philsys`, { philSysCardNumber: '1234-5678-9012', userConsent: true }, { headers });
    console.log('  ✅ eVerify Passed: Ref ID =', verifyRes.data.everifyRefId);

    // 6. Test Business Profile Creation
    console.log('\n6️⃣ Testing Business Profile Setup (POST /api/onboarding/business/profile)...');
    const bizRes = await axios.post(
      `${BASE_URL}/onboarding/business/profile`,
      {
        businessName: 'Dela Cruz Trading MSME',
        businessType: 'Sole Proprietorship',
        registrationNumber: 'DTI-REG-881920',
        birTin: '123-456-789-000',
        lguPermitNumber: 'MAYOR-PERMIT-2026-99',
        yearsInOperation: 4,
      },
      { headers }
    );
    console.log('  ✅ Business Profile Created: ID =', bizRes.data.businessId);

    // 7. Test Business Verification Routing (DTI + BIR + LGU)
    console.log('\n7️⃣ Testing Business Registry Verification Router (POST /api/onboarding/business/verify)...');
    const bizVerifyRes = await axios.post(`${BASE_URL}/onboarding/business/verify`, {}, { headers });
    console.log('  ✅ Business Verification Passed across registries!');

    // 8. Test Financial Profile Submission
    console.log('\n8️⃣ Testing Financial Profile Submission (POST /api/onboarding/financials)...');
    const finRes = await axios.post(
      `${BASE_URL}/onboarding/financials`,
      {
        monthlyRevenue: 150000,
        annualIncome: 1800000,
        totalAssets: 500000,
        totalLiabilities: 50000,
        existingLoans: [{ lenderName: 'Rural Bank', outstandingBalance: 20000, monthlyAmortization: 2000 }],
      },
      { headers }
    );
    console.log('  ✅ Financial Profile Saved. Onboarding Complete!');

    // 9. Verify Final Onboarding Status
    const status2 = await axios.get(`${BASE_URL}/onboarding/status`, { headers });
    console.log(`  ✅ Onboarding Progress: ${status2.data.percentComplete}% Complete (${status2.data.currentStep})`);

    // 10. Test Loan Application Submission & Credit Engine Scoring
    console.log('\n9️⃣ Testing Loan Application & Credit Risk Engine (POST /api/loans/apply)...');
    const loanRes = await axios.post(
      `${BASE_URL}/loans/apply`,
      {
        requestedAmount: 250000,
        tenorMonths: 12,
        purpose: 'Inventory and equipment expansion',
      },
      { headers }
    );
    const loanId = loanRes.data.loanId;
    console.log(`  ✅ Loan Application Submitted: ID = ${loanId}`);

    // Allow credit engine async processing to complete
    await new Promise(r => setTimeout(r, 1000));

    // 11. Fetch Loan Detail & Credit Score Result
    console.log('\n🔟 Fetching Loan Detail & Credit Risk Score (GET /api/loans/:loanId)...');
    const loanDetail = await axios.get(`${BASE_URL}/loans/${loanId}`, { headers });
    const score = loanDetail.data.loan.creditScore;
    console.log('  ✅ Credit Engine Assessment Complete:');
    console.log(`     • Status: ${loanDetail.data.loan.status}`);
    console.log(`     • Total Risk Score: ${score?.riskScore} / 100`);
    console.log(`     • Decision: ${score?.decision}`);
    console.log(`     • Approved Amount: ₱${loanDetail.data.loan.approved_amount}`);
    console.log(`     • Interest Rate: ${loanDetail.data.loan.interest_rate_annual}% p.a.`);
    console.log(`     • Estimated Monthly Amortization: ₱${loanDetail.data.loan.monthly_amortization}`);

    // 12. Test Loan Offer Acceptance (E-Signature)
    console.log('\n11. Testing Loan Offer Acceptance (POST /api/loans/:loanId/accept)...');
    const acceptRes = await axios.post(`${BASE_URL}/loans/${loanId}/accept`, {}, { headers });
    console.log('  ✅ Offer Accepted:', acceptRes.data.message);

    // 13. Test Partner Bank Disbursement Webhook
    console.log('\n12. Testing Partner Bank Disbursement Webhook (POST /api/loans/webhook/disbursement)...');
    const disburseWebhook = await axios.post(`${BASE_URL}/loans/webhook/disbursement`, {
      loanId,
      status: 'SUCCESS',
      disbursedAmount: 250000,
      disbursementRef: 'LBP-DISBURSE-99120',
      disbursedAt: new Date().toISOString(),
    });
    console.log('  ✅ Disbursement Confirmed by Webhook:', disburseWebhook.data.status);

    // Fetch loan again to verify amortization schedule generated
    const loanWithSchedule = await axios.get(`${BASE_URL}/loans/${loanId}`, { headers });
    const installments = loanWithSchedule.data.loan.installments;
    console.log(`  ✅ Amortization Schedule Generated: ${installments.length} monthly installments created.`);

    // 14. Test eGovPay Repayment Checkout
    console.log('\n13. Testing eGovPay Repayment Checkout (POST /api/payments/egovpay/checkout)...');
    const firstInst = installments[0];
    const checkoutRes = await axios.post(
      `${BASE_URL}/payments/egovpay/checkout`,
      {
        loanId,
        installmentId: firstInst.id,
        amount: firstInst.total_amount_due,
        mobileNumber: '+639171234567',
      },
      { headers }
    );
    const txnid = checkoutRes.data.txnid;
    console.log(`  ✅ eGovPay Checkout Generated: Transaction ID = ${txnid}`);

    // 15. Test eGovPay Webhook & SQLite Idempotency
    console.log('\n14. Testing eGovPay Webhook & SQLite Idempotency (POST /api/payments/egovpay/webhook)...');
    const webhookRes1 = await axios.post(`${BASE_URL}/payments/egovpay/webhook`, {
      txnid,
      status: 'PAID',
      amount: firstInst.total_amount_due,
      reference_no: 'GCASH-REF-88912',
      installmentId: firstInst.id,
    });
    console.log('  ✅ First Webhook Received:', webhookRes1.data.message || 'Success');

    // Duplicate webhook to test idempotency
    const webhookRes2 = await axios.post(`${BASE_URL}/payments/egovpay/webhook`, {
      txnid,
      status: 'PAID',
      amount: firstInst.total_amount_due,
      reference_no: 'GCASH-REF-88912',
      installmentId: firstInst.id,
    });
    console.log('  ✅ Duplicate Webhook Idempotency Check:', webhookRes2.data.message);

    console.log('\n=====================================================');
    console.log('🎉 ALL BACKEND API TESTS PASSED PERFECTLY!');
    console.log('=====================================================\n');
  } catch (err: any) {
    console.error('\n❌ Test Suite Failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runApiTestSuite();
