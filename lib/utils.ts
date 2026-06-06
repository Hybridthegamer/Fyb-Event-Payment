export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function generatePaystackRef(uid: string): string {
  return `NACOS-FYB-${uid.slice(0, 8).toUpperCase()}-${Date.now()}`;
}

export function getMatricLast4(matricNumber: string): string {
  return matricNumber.slice(-4).toUpperCase();
}
