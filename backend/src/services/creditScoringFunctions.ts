export interface ScoringInputs {
  // Identity
  isPhilSysVerified: boolean;
  isFacialVerified: boolean;
  isEverifyVerified: boolean;
  // Business
  isDtiSecCdaVerified: boolean;
  isBirTinVerified: boolean;
  isLguPermitVerified: boolean;
  // Financial
  monthlyRevenue: number;
  existingLoanMonthlyTotal: number;
  estimatedNewMonthlyPayment: number;
  // History
  yearsInOperation: number;
  hasActiveDeclaredDefault: boolean;
}

export function scoreIdentity(inputs: Pick<ScoringInputs, 'isPhilSysVerified' | 'isFacialVerified' | 'isEverifyVerified'>): number {
  if (inputs.isPhilSysVerified && inputs.isFacialVerified && inputs.isEverifyVerified) return 25;
  if (inputs.isEverifyVerified || inputs.isPhilSysVerified) return 15;
  return 5;
}

export function scoreBusinessLegitimacy(inputs: Pick<ScoringInputs, 'isDtiSecCdaVerified' | 'isBirTinVerified' | 'isLguPermitVerified'>): number {
  let score = 0;
  if (inputs.isDtiSecCdaVerified) score += 10;
  if (inputs.isBirTinVerified) score += 8;
  if (inputs.isLguPermitVerified) score += 7;
  return score;
}

export function scoreFinancialHealth(inputs: Pick<ScoringInputs, 'monthlyRevenue' | 'existingLoanMonthlyTotal' | 'estimatedNewMonthlyPayment'>): number {
  const totalDebtService = inputs.existingLoanMonthlyTotal + inputs.estimatedNewMonthlyPayment;
  const dscr = totalDebtService > 0 ? inputs.monthlyRevenue / totalDebtService : 0;
  const revenueAmortRatio = inputs.estimatedNewMonthlyPayment > 0 ? inputs.monthlyRevenue / inputs.estimatedNewMonthlyPayment : 0;

  let score = 0;

  // Revenue / Amortization scoring (Max 20 pts)
  if (revenueAmortRatio >= 3.0) score += 20;
  else if (revenueAmortRatio >= 2.0) score += 12;

  // DSCR scoring (Max 15 pts)
  if (dscr >= 1.5) score += 15;
  else if (dscr >= 1.0) score += 8;

  return score;
}

export function scoreOperatingHistory(inputs: Pick<ScoringInputs, 'yearsInOperation' | 'hasActiveDeclaredDefault'>): number {
  let score = 0;
  if (inputs.yearsInOperation >= 3) score += 10;
  if (!inputs.hasActiveDeclaredDefault) score += 5;
  return score;
}

export function computeDecision(totalScore: number): 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_REJECT' {
  if (totalScore >= 80) return 'AUTO_APPROVE';
  if (totalScore >= 60) return 'MANUAL_REVIEW';
  return 'AUTO_REJECT';
}

type LoanBracket = 'MICRO' | 'SMALL' | 'MEDIUM';

export function getLoanBracket(amount: number): LoanBracket {
  if (amount < 300_000) return 'MICRO';
  if (amount < 3_000_000) return 'SMALL';
  return 'MEDIUM';
}

const INTEREST_RATES: Record<LoanBracket, { approved: number; review: number }> = {
  MICRO:  { approved: 9.0,  review: 12.0 },
  SMALL:  { approved: 8.5,  review: 11.5 },
  MEDIUM: { approved: 8.0,  review: 11.0 },
};

export function getBaseInterestRate(amount: number, decision: 'AUTO_APPROVE' | 'MANUAL_REVIEW'): number {
  const bracket = getLoanBracket(amount);
  return decision === 'AUTO_APPROVE'
    ? INTEREST_RATES[bracket].approved
    : INTEREST_RATES[bracket].review;
}

export function buildRejectionReasons(inputs: ScoringInputs, subScores: Record<string, number>): string[] {
  const reasons: string[] = [];

  if (!inputs.isPhilSysVerified) reasons.push('PhilSys identity not verified.');
  if (!inputs.isDtiSecCdaVerified) reasons.push('Primary business registration (DTI/SEC/CDA) not verified.');
  if (!inputs.isBirTinVerified) reasons.push('BIR TIN not verified.');

  const revenueAmortRatio = inputs.estimatedNewMonthlyPayment > 0
    ? inputs.monthlyRevenue / inputs.estimatedNewMonthlyPayment : 0;
  if (revenueAmortRatio < 2.0) {
    reasons.push(`Revenue-to-amortization ratio (${revenueAmortRatio.toFixed(2)}) is below the minimum threshold of 2.0.`);
  }

  const totalDebt = inputs.existingLoanMonthlyTotal + inputs.estimatedNewMonthlyPayment;
  const dscr = totalDebt > 0 ? inputs.monthlyRevenue / totalDebt : 0;
  if (dscr < 1.0) {
    reasons.push(`Debt Service Coverage Ratio (${dscr.toFixed(2)}) is below the minimum threshold of 1.0.`);
  }

  return reasons;
}
