import getDb from '../db/index.js';
import { generateAmortizationSchedule, InstallmentRow } from './amortization.js';
import {
  scoreIdentity,
  scoreBusinessLegitimacy,
  scoreFinancialHealth,
  scoreOperatingHistory,
  computeDecision,
  buildRejectionReasons,
  getBaseInterestRate,
  ScoringInputs,
} from './creditScoringFunctions.js';


export async function assessLoan(loanId: string): Promise<void> {
  const db = await getDb();

  // 1. Read loan record
  const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [loanId]);
  if (!loan) {
    console.error(`[CreditEngine] Loan application ${loanId} not found.`);
    return;
  }

  // 2. Read related records
  const user = await db.get('SELECT * FROM users WHERE id = ?', [loan.applicant_id]);
  const business = await db.get('SELECT * FROM business_profiles WHERE id = ?', [loan.business_id]);
  const financials = await db.get('SELECT * FROM financial_profiles WHERE business_id = ?', [loan.business_id]);
  const progress = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [loan.applicant_id]);

  if (!user || !business || !financials) {
    console.error(`[CreditEngine] Missing associated identity, business, or financial profile for loan ${loanId}.`);
    return;
  }

  // 3. Estimate initial payment for financial ratios
  const estimatedRate = getBaseInterestRate(loan.requested_amount, 'AUTO_APPROVE');
  const scheduleEstimate = generateAmortizationSchedule(loan.requested_amount, estimatedRate, loan.tenor_months, new Date());
  const estimatedPayment = scheduleEstimate[0]?.totalAmountDue ?? 0;

  // Parse existing loans JSON
  let existingLoans: { monthlyAmortization: number }[] = [];
  try {
    existingLoans = JSON.parse(financials.existing_loans_json || '[]');
  } catch (e) {
    existingLoans = [];
  }

  const existingLoanMonthlyTotal = existingLoans.reduce((acc, curr) => acc + (curr.monthlyAmortization || 0), 0);

  // 4. Construct scoring input payload
  const inputs: ScoringInputs = {
    isPhilSysVerified: !!user.isPhilSysVerified,
    isFacialVerified: !!progress?.efacial_completed,
    isEverifyVerified: !!progress?.everify_completed,
    isDtiSecCdaVerified: !!business.is_gov_verified,
    isBirTinVerified: !!business.bir_tin_verified,
    isLguPermitVerified: !!business.lgu_permit_verified,
    monthlyRevenue: financials.monthly_revenue,
    existingLoanMonthlyTotal,
    estimatedNewMonthlyPayment: estimatedPayment,
    yearsInOperation: business.years_in_operation || 0,
    hasActiveDeclaredDefault: !!financials.has_active_default,
  };

  // 5. Compute sub-scores
  const identityScore = scoreIdentity(inputs);
  const businessScore = scoreBusinessLegitimacy(inputs);
  const financialScore = scoreFinancialHealth(inputs);
  const historyScore = scoreOperatingHistory(inputs);
  const totalScore = identityScore + businessScore + financialScore + historyScore;

  const decision = computeDecision(totalScore);

  const creditScoreResult = {
    riskScore: totalScore,
    identityVerificationScore: identityScore,
    businessLegitimacyScore: businessScore,
    financialHealthScore: financialScore,
    creditHistoryScore: historyScore,
    decision,
    assessedAt: new Date().toISOString(),
  };

  const nowIso = new Date().toISOString();

  // 6. Apply decision and state transition
  if (decision === 'AUTO_APPROVE') {
    const finalRate = getBaseInterestRate(loan.requested_amount, 'AUTO_APPROVE');
    const finalSchedule = generateAmortizationSchedule(loan.requested_amount, finalRate, loan.tenor_months, new Date());
    const monthlyAmortization = finalSchedule[0]?.totalAmountDue ?? 0;

    await db.run(
      `UPDATE loan_applications SET
        status = 'APPROVED',
        credit_score_json = ?,
        approved_amount = ?,
        interest_rate_annual = ?,
        monthly_amortization = ?,
        updated_at = ?
       WHERE id = ?`,
      [JSON.stringify(creditScoreResult), loan.requested_amount, finalRate, monthlyAmortization, nowIso, loanId]
    );

    console.log(`[CreditEngine Success]: Loan ${loanId} AUTO-APPROVED with score ${totalScore}. Rate: ${finalRate}%, Monthly: ₱${monthlyAmortization}`);
  } else if (decision === 'MANUAL_REVIEW') {
    await db.run(
      `UPDATE loan_applications SET status = 'UNDERWRITING', credit_score_json = ?, updated_at = ? WHERE id = ?`,
      [JSON.stringify(creditScoreResult), nowIso, loanId]
    );

    console.log(`[CreditEngine Review]: Loan ${loanId} routed to UNDERWRITING with score ${totalScore}.`);
  } else {
    const rejectionReasons = buildRejectionReasons(inputs, { identityScore, businessScore, financialScore, historyScore });
    const resultWithReasons = { ...creditScoreResult, rejectionReasons };

    await db.run(
      `UPDATE loan_applications SET
        status = 'REJECTED',
        credit_score_json = ?,
        rejection_reasons_json = ?,
        updated_at = ?
       WHERE id = ?`,
      [JSON.stringify(resultWithReasons), JSON.stringify(rejectionReasons), nowIso, loanId]
    );

    console.log(`[CreditEngine Rejected]: Loan ${loanId} REJECTED with score ${totalScore}. Reasons: ${rejectionReasons.join('; ')}`);
  }
}
