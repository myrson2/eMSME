# Implementation Tasks & Deliverables: Credit Engine (`credit-engine`)

## 1. Task Checklist
- [ ] **Pure Scoring Functions:** Implement `scoreIdentity()`, `scoreBusinessLegitimacy()`, `scoreFinancialHealth()`, `scoreOperatingHistory()` in `backend/src/services/creditEngine.ts`.
- [ ] **Decision Function:** Implement `computeDecision()` and `buildRejectionReasons()`.
- [ ] **Interest Rate Lookup:** Implement `getBaseInterestRate()` and `getLoanBracket()`.
- [ ] **Amortization Estimate:** Call `generateAmortizationSchedule()` from `loan-module` to estimate the monthly payment used for DSCR and ratio calculations.
- [ ] **Main `assessLoan()` Orchestrator:** Implement the top-level function that reads DB, calls scorers, and updates the loan.
- [ ] **Unit Tests:** Write unit tests for all pure scoring functions covering boundary cases (exact threshold values).

---

## 2. Full Credit Engine Implementation

### `backend/src/services/creditEngine.ts`
```typescript
import db from '../db';
import { generateAmortizationSchedule } from './amortization';
import {
  scoreIdentity, scoreBusinessLegitimacy, scoreFinancialHealth,
  scoreOperatingHistory, computeDecision, buildRejectionReasons,
  getBaseInterestRate, ScoringInputs
} from './creditScoringFunctions';

export async function assessLoan(loanId: string): Promise<void> {
  // 1. Load all required data from SQLite
  const loan = await db.get('SELECT * FROM loan_applications WHERE id = ?', [loanId]);
  if (!loan) throw new Error(`[CreditEngine] Loan ${loanId} not found.`);

  const user = await db.get('SELECT * FROM users WHERE id = ?', [loan.applicant_id]);
  const business = await db.get('SELECT * FROM business_profiles WHERE id = ?', [loan.business_id]);
  const financials = await db.get('SELECT * FROM financial_profiles WHERE business_id = ?', [loan.business_id]);
  const progress = await db.get('SELECT * FROM onboarding_progress WHERE user_id = ?', [loan.applicant_id]);

  if (!user || !business || !financials) {
    console.error(`[CreditEngine] Missing data for loan ${loanId}. Aborting assessment.`);
    return;
  }

  // 2. Estimate monthly payment for financial ratio calculation
  const estimatedRate = getBaseInterestRate(loan.requested_amount, 'AUTO_APPROVE');
  const estimatedPayment = generateAmortizationSchedule(loan.requested_amount, estimatedRate, loan.tenor_months, new Date())[0]?.totalAmountDue ?? 0;

  // 3. Parse existing loans
  const existingLoans: { monthlyAmortization: number }[] = JSON.parse(financials.existing_loans_json ?? '[]');
  const existingLoanMonthlyTotal = existingLoans.reduce((sum, l) => sum + l.monthlyAmortization, 0);

  const inputs: ScoringInputs = {
    isPhilSysVerified: !!user.is_philsys_verified,
    isFacialVerified: !!progress?.efacial_completed,
    isEverifyVerified: !!progress?.everify_completed,
    isDtiSecCdaVerified: !!business.is_gov_verified,
    isBirTinVerified: !!business.bir_tin_verified,
    isLguPermitVerified: !!business.lgu_permit_verified,
    monthlyRevenue: financials.monthly_revenue,
    existingLoanMonthlyTotal,
    estimatedNewMonthlyPayment: estimatedPayment,
    yearsInOperation: business.years_in_operation ?? 0,
    hasActiveDeclaredDefault: !!financials.has_active_default,
  };

  // 4. Calculate sub-scores
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

  // 5. Apply decision to loan
  if (decision === 'AUTO_APPROVE') {
    const finalRate = getBaseInterestRate(loan.requested_amount, 'AUTO_APPROVE');
    const schedule = generateAmortizationSchedule(loan.requested_amount, finalRate, loan.tenor_months, new Date());
    const monthlyAmortization = schedule[0]?.totalAmountDue ?? 0;

    await db.run(
      `UPDATE loan_applications SET
        status = 'APPROVED',
        credit_score_json = ?,
        approved_amount = ?,
        interest_rate_annual = ?,
        monthly_amortization = ?,
        updated_at = ?
       WHERE id = ?`,
      [JSON.stringify(creditScoreResult), loan.requested_amount, finalRate, monthlyAmortization, new Date().toISOString(), loanId]
    );

  } else if (decision === 'MANUAL_REVIEW') {
    await db.run(
      `UPDATE loan_applications SET status = 'UNDERWRITING', credit_score_json = ?, updated_at = ? WHERE id = ?`,
      [JSON.stringify(creditScoreResult), new Date().toISOString(), loanId]
    );

  } else {
    const rejectionReasons = buildRejectionReasons(inputs, { identityScore, businessScore, financialScore, historyScore });
    creditScoreResult['rejectionReasons'] = rejectionReasons;
    await db.run(
      `UPDATE loan_applications SET status = 'REJECTED', credit_score_json = ?, rejection_reasons_json = ?, updated_at = ? WHERE id = ?`,
      [JSON.stringify(creditScoreResult), JSON.stringify(rejectionReasons), new Date().toISOString(), loanId]
    );
  }

  console.log(`[CreditEngine] Loan ${loanId} assessed. Score: ${totalScore}, Decision: ${decision}`);
}
```
