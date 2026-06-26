import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface PaymentRecord {
  reference: string;
  amount: number;
  paidAt: Timestamp;
  type: 'full' | 'instalment';
  /** Processing fee covered by the student on top of the ticket amount. */
  fee?: number;
}

export interface Registration {
  uid: string;
  email: string;
  fullName: string;
  matricNumber: string;
  plusOnes: { name: string }[];
  numPlusOnes: number;
  baseAmount: number;
  plusOneAmount: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: 'unpaid' | 'partial' | 'completed';
  payments: PaymentRecord[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function getRegistration(uid: string): Promise<Registration | null> {
  const ref = doc(db, 'registrations', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Registration;
}

export async function saveRegistration(
  uid: string,
  data: Omit<Registration, 'createdAt' | 'updatedAt' | 'amountPaid' | 'paymentStatus' | 'payments'>
): Promise<void> {
  const ref = doc(db, 'registrations', uid);
  await setDoc(
    ref,
    {
      ...data,
      amountPaid: 0,
      paymentStatus: 'unpaid',
      payments: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function recordPayment(
  uid: string,
  payment: Omit<PaymentRecord, 'paidAt'>,
  newAmountPaid: number,
  totalAmount: number
): Promise<void> {
  const ref = doc(db, 'registrations', uid);
  const newStatus: Registration['paymentStatus'] =
    newAmountPaid >= totalAmount ? 'completed' : 'partial';

  await updateDoc(ref, {
    amountPaid: newAmountPaid,
    paymentStatus: newStatus,
    payments: arrayUnion({
      ...payment,
      paidAt: Timestamp.now(),
    }),
    updatedAt: serverTimestamp(),
  });
}

// ─── Bank ledger ─────────────────────────────────────────────────────────────
//
// A single shared ledger document (`bank/main`) backs the admin Bank system.
// Student payments are recorded as deposits; admin payouts as withdrawals.
// The displayed balance is always (totalDeposits − totalWithdrawals).

export interface BankDepositEntry {
  id: string;
  name: string;
  matric: string;
  amount: number;
  fee: number;
  reference: string;
  type: 'full' | 'instalment';
  createdAt: Timestamp;
}

export interface BankWithdrawalEntry {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  amount: number;
  reference: string;
  status: 'completed' | 'failed';
  createdAt: Timestamp;
}

export interface BankLedger {
  totalDeposits: number;
  totalWithdrawals: number;
  deposits: BankDepositEntry[];
  withdrawals: BankWithdrawalEntry[];
  updatedAt?: Timestamp;
}

const BANK_DOC_ID = 'main';

export async function getBankLedger(): Promise<BankLedger> {
  const ref = doc(db, 'bank', BANK_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return { totalDeposits: 0, totalWithdrawals: 0, deposits: [], withdrawals: [] };
  }
  const data = snap.data() as Partial<BankLedger>;
  return {
    totalDeposits: data.totalDeposits ?? 0,
    totalWithdrawals: data.totalWithdrawals ?? 0,
    deposits: data.deposits ?? [],
    withdrawals: data.withdrawals ?? [],
    updatedAt: data.updatedAt,
  };
}

export async function recordBankDeposit(
  entry: Omit<BankDepositEntry, 'createdAt'>
): Promise<void> {
  const ref = doc(db, 'bank', BANK_DOC_ID);
  const fullEntry: BankDepositEntry = { ...entry, createdAt: Timestamp.now() };
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      totalDeposits: entry.amount,
      totalWithdrawals: 0,
      deposits: [fullEntry],
      withdrawals: [],
      updatedAt: serverTimestamp(),
    });
    return;
  }
  await updateDoc(ref, {
    totalDeposits: increment(entry.amount),
    deposits: arrayUnion(fullEntry),
    updatedAt: serverTimestamp(),
  });
}

export async function recordBankWithdrawal(
  entry: Omit<BankWithdrawalEntry, 'createdAt'>
): Promise<void> {
  const ref = doc(db, 'bank', BANK_DOC_ID);
  const fullEntry: BankWithdrawalEntry = { ...entry, createdAt: Timestamp.now() };
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      totalDeposits: 0,
      totalWithdrawals: entry.status === 'completed' ? entry.amount : 0,
      deposits: [],
      withdrawals: [fullEntry],
      updatedAt: serverTimestamp(),
    });
    return;
  }
  await updateDoc(ref, {
    ...(entry.status === 'completed' ? { totalWithdrawals: increment(entry.amount) } : {}),
    withdrawals: arrayUnion(fullEntry),
    updatedAt: serverTimestamp(),
  });
}
