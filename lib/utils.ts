export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function getMatricLast4(matricNumber: string): string {
  return matricNumber.slice(-4).toUpperCase();
}
