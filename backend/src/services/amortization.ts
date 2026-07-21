export interface InstallmentRow {
  installmentNumber: number;
  dueDate: string; // ISO date format YYYY-MM-DD
  principalAmount: number;
  interestAmount: number;
  totalAmountDue: number;
}

/**
 * Generates a monthly reducing-balance amortization schedule.
 * @param principal - Total loan amount in PHP
 * @param annualRatePercent - Annual interest rate as a percentage (e.g., 12 for 12%)
 * @param tenorMonths - Number of monthly installments
 * @param firstDueDate - ISO date or Date object for first installment due date
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  tenorMonths: number,
  firstDueDate: Date | string = new Date()
): InstallmentRow[] {
  const monthlyRate = annualRatePercent / 100 / 12;
  const monthlyPayment = monthlyRate === 0
    ? principal / tenorMonths
    : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenorMonths))
      / (Math.pow(1 + monthlyRate, tenorMonths) - 1);

  const schedule: InstallmentRow[] = [];
  let balance = principal;

  const startDate = typeof firstDueDate === 'string' ? new Date(firstDueDate) : new Date(firstDueDate);

  for (let i = 1; i <= tenorMonths; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = monthlyPayment - interest;
    balance -= principalPaid;

    const dueDate = new Date(startDate);
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
