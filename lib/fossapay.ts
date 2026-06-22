/**
 * FossaPay server-side client.
 *
 * This module must only ever be imported from server code (API routes). It
 * uses the secret API key and therefore must never reach the browser bundle.
 *
 * Docs: https://docs.fossapay.com
 *
 * Base URL:   https://api-production.fossapay.com/api/v1
 * Auth:       x-api-key: <secret>   (fp_test_sk_* / fp_live_sk_*)
 *
 * When no live/test secret key is configured the helpers in this file run in
 * "simulation" mode so the entire payment + bank flow can be exercised end to
 * end without moving real money (the event minimum is ₦25,000). Wire real keys
 * via environment variables to switch to live processing — no code changes are
 * required.
 */

import crypto from 'crypto';

export const FOSSAPAY_BASE =
  process.env.FOSSAPAY_BASE_URL || 'https://api-production.fossapay.com/api/v1';

const PLACEHOLDER_HINTS = ['placeholder', 'changeme', 'your_', 'xxxx'];

function looksLikePlaceholder(value: string): boolean {
  const v = value.toLowerCase();
  return PLACEHOLDER_HINTS.some((hint) => v.includes(hint));
}

/** The shared event account name shown to every student. */
export const SHARED_ACCOUNT_NAME = 'Fyb Dinner Night.';

export function getSecretKey(): string | null {
  const key = process.env.FOSSAPAY_SECRET_KEY;
  if (!key || !key.trim() || looksLikePlaceholder(key)) return null;
  return key.trim();
}

/** True when real FossaPay credentials are present (live processing). */
export function isFossaConfigured(): boolean {
  return getSecretKey() !== null;
}

export interface FossaResult<T> {
  ok: boolean;
  status: number;
  body: T;
}

async function fossaFetch<T = any>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {}
): Promise<FossaResult<T>> {
  const key = getSecretKey();
  if (!key) {
    throw new Error('FossaPay secret key is not configured');
  }
  const { idempotencyKey, headers, ...rest } = init;
  const res = await fetch(`${FOSSAPAY_BASE}${path}`, {
    ...rest,
    headers: {
      'x-api-key': key,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
      ...(headers || {}),
    },
    cache: 'no-store',
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body };
}

// ─── Customers ──────────────────────────────────────────────────────────────

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  emailAddress: string;
  mobileNumber?: string;
  type?: 'individual' | 'business';
}

export async function createCustomer(input: CreateCustomerInput): Promise<string> {
  const { body } = await fossaFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({ type: 'individual', ...input }),
  });
  const id = body?.data?.id;
  if (!id) throw new Error(body?.message || 'Failed to create FossaPay customer');
  return id;
}

// ─── Fiat wallet (virtual account) ───────────────────────────────────────────

export interface FiatWallet {
  walletId: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
}

export async function createFiatWallet(params: {
  customerId: string;
  walletName: string;
  walletReference: string;
}): Promise<FiatWallet> {
  const { body } = await fossaFetch('/wallets/fiat/create', {
    method: 'POST',
    body: JSON.stringify(params),
    idempotencyKey: params.walletReference,
  });
  const data = body?.data;
  if (!data?.accountNumber) {
    throw new Error(body?.message || 'Failed to create FossaPay fiat wallet');
  }
  return {
    walletId: data.walletId,
    bankName: data.bankName,
    bankCode: data.bankCode,
    accountNumber: data.accountNumber,
  };
}

export interface WalletDetails {
  id: string;
  availableBalance: number;
  ledgerBalance: number;
  accountNumber: string;
  bankName: string;
  bankCode: string;
}

export async function getWallet(walletId: string): Promise<WalletDetails> {
  const { body } = await fossaFetch(`/wallets/fiat/${encodeURIComponent(walletId)}`, {
    method: 'GET',
  });
  const d = body?.data;
  if (!d) throw new Error(body?.message || 'Failed to fetch FossaPay wallet');
  return {
    id: d.id,
    availableBalance: Number(d.availableBalance ?? 0),
    ledgerBalance: Number(d.ledgerBalance ?? 0),
    accountNumber: d.virtualAccount?.accountNumber,
    bankName: d.virtualAccount?.bankName,
    bankCode: d.virtualAccount?.bankCode,
  };
}

export interface WalletTransaction {
  transactionId: string;
  transactionType: 'deposit' | 'withdrawal';
  status: string;
  amount: number;
  fee: number;
  narration?: string;
  reference?: string;
  createdAt: string;
  originator?: { accountNumber?: string; accountName?: string; bankName?: string };
  beneficiary?: { accountNumber?: string; accountName?: string; bankName?: string };
}

export async function getWalletTransactions(
  walletId: string,
  query: { page?: number; limit?: number; transactionType?: 'deposit' | 'withdrawal' } = {}
): Promise<WalletTransaction[]> {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 50));
  if (query.transactionType) params.set('transactionType', query.transactionType);
  const { body } = await fossaFetch<{ transactions: WalletTransaction[] }>(
    `/wallets/fiat/${encodeURIComponent(walletId)}/transactions?${params.toString()}`,
    { method: 'GET' }
  );
  return body?.transactions ?? [];
}

// ─── Fiat transfers (payouts / withdrawals) ──────────────────────────────────

export interface SupportedBank {
  bankName: string;
  bankCode: string;
}

export async function getSupportedBanks(): Promise<SupportedBank[]> {
  const { body } = await fossaFetch<{ data: { bankname: string; bankcode: string }[] }>(
    '/transfers/fiat/banks',
    { method: 'GET' }
  );
  return (body?.data ?? []).map((b) => ({ bankName: b.bankname, bankCode: b.bankcode }));
}

export async function bankNameEnquiry(params: {
  bankCode: string;
  accountNumber: string;
}): Promise<{ accountName: string }> {
  const { body } = await fossaFetch('/transfers/fiat/bank-name-enquiry', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  const name = body?.data?.accountName;
  if (!name) throw new Error(body?.message || body?.error || 'Account name enquiry failed');
  return { accountName: name };
}

export interface InterBankTransferInput {
  customerId: string;
  destinationBankCode: string;
  destinationBankName: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
  amount: number;
  reference: string;
  remarks: string;
}

export async function interBankTransfer(
  input: InterBankTransferInput
): Promise<{ reference: string }> {
  const { body, ok } = await fossaFetch('/transfers/fiat/inter-bank', {
    method: 'POST',
    body: JSON.stringify(input),
    idempotencyKey: input.reference,
  });
  if (!ok || body?.status === false) {
    throw new Error(body?.error || body?.message || 'Transfer failed');
  }
  return { reference: body?.data?.reference ?? input.reference };
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

/**
 * Verify a FossaPay webhook signature.
 * The signature is an HMAC-SHA256 of the raw JSON body using the webhook secret,
 * delivered in the `x-fossapay-signature` header.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.FOSSAPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

// ─── Shared event account ────────────────────────────────────────────────────

export interface SharedAccount {
  accountNumber: string;
  bankName: string;
  bankCode: string;
  accountName: string;
  walletId: string | null;
  customerId: string | null;
  simulated: boolean;
}

// Memoise within the lifetime of a server instance so we don't recreate the
// customer/wallet on every request.
let cachedAccount: SharedAccount | null = null;

/**
 * Resolve the single shared fiat account that is displayed to every student.
 *
 * Resolution order:
 *   1. Explicit env (FOSSAPAY_WALLET_ID) → fetch that wallet's account details.
 *   2. Public display env (NEXT_PUBLIC_FOSSAPAY_ACCOUNT_NUMBER + bank) → use as-is.
 *   3. Live key with no wallet configured → create customer + wallet once.
 *   4. No configuration → deterministic simulated account for testing.
 *
 * The displayed account name is always "Fyb Dinner Night." regardless of the
 * underlying provider name.
 */
export async function getSharedAccount(): Promise<SharedAccount> {
  if (cachedAccount) return cachedAccount;

  // 2. Static public display values (no secret needed to show them).
  const staticNumber = process.env.NEXT_PUBLIC_FOSSAPAY_ACCOUNT_NUMBER;
  const staticBank = process.env.NEXT_PUBLIC_FOSSAPAY_BANK_NAME;

  if (isFossaConfigured()) {
    try {
      const walletId = process.env.FOSSAPAY_WALLET_ID;
      if (walletId) {
        // 1. Use the configured shared wallet.
        const w = await getWallet(walletId);
        cachedAccount = {
          accountNumber: w.accountNumber,
          bankName: w.bankName,
          bankCode: w.bankCode,
          accountName: SHARED_ACCOUNT_NAME,
          walletId: w.id,
          customerId: process.env.FOSSAPAY_CUSTOMER_ID || null,
          simulated: false,
        };
        return cachedAccount;
      }

      // 3. Provision the shared account once.
      const customerId =
        process.env.FOSSAPAY_CUSTOMER_ID ||
        (await createCustomer({
          firstName: 'Fyb',
          lastName: 'Dinner Night',
          emailAddress:
            process.env.FOSSAPAY_CUSTOMER_EMAIL || 'fybdinnernight@nacosrsu.events',
        }));
      const wallet = await createFiatWallet({
        customerId,
        walletName: SHARED_ACCOUNT_NAME,
        walletReference: process.env.FOSSAPAY_WALLET_REFERENCE || 'nacos-fyb-dinner-night',
      });
      cachedAccount = {
        accountNumber: wallet.accountNumber,
        bankName: wallet.bankName,
        bankCode: wallet.bankCode,
        accountName: SHARED_ACCOUNT_NAME,
        walletId: wallet.walletId,
        customerId,
        simulated: false,
      };
      return cachedAccount;
    } catch (err) {
      // Fall through to static/simulated display so the UI never hard-breaks.
      console.error('FossaPay shared account provisioning failed:', err);
    }
  }

  if (staticNumber && staticBank) {
    cachedAccount = {
      accountNumber: staticNumber,
      bankName: staticBank,
      bankCode: process.env.NEXT_PUBLIC_FOSSAPAY_BANK_CODE || '',
      accountName: SHARED_ACCOUNT_NAME,
      walletId: process.env.FOSSAPAY_WALLET_ID || null,
      customerId: process.env.FOSSAPAY_CUSTOMER_ID || null,
      simulated: !isFossaConfigured(),
    };
    return cachedAccount;
  }

  // 4. Simulated account (testing without credentials).
  cachedAccount = {
    accountNumber: '9920008855',
    bankName: 'Wema Bank',
    bankCode: '035',
    accountName: SHARED_ACCOUNT_NAME,
    walletId: null,
    customerId: null,
    simulated: true,
  };
  return cachedAccount;
}
