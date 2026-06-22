export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function getMatricLast4(matricNumber: string): string {
  return matricNumber.slice(-4).toUpperCase();
}

/**
 * FossaPay transaction fee, charged on the value being processed.
 * The student covers this fee — it is added on top of the ticket amount.
 *
 *   < ₦5,000              → ₦60
 *   ₦5,000  – ₦9,999      → ₦120
 *   ₦10,000 – ₦14,999     → ₦200
 *   ₦15,000 – ₦24,999     → ₦250
 *   ≥ ₦25,000             → 1.2% capped at ₦1,000
 */
export function calculateFossaPayFee(amount: number): number {
  if (amount <= 0) return 0;
  if (amount < 5000) return 60;
  if (amount < 10000) return 120;
  if (amount < 15000) return 200;
  if (amount < 25000) return 250;
  return Math.min(Math.round(amount * 0.012), 1000);
}

/**
 * Total a student must transfer for a given ticket amount — the ticket
 * portion plus the FossaPay fee they are covering.
 */
export function amountWithFee(ticketAmount: number): number {
  return ticketAmount + calculateFossaPayFee(ticketAmount);
}
