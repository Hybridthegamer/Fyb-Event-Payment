import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface PaymentRecord {
  reference: string;
  amount: number;
  paidAt: Timestamp;
  type: 'full' | 'instalment';
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
