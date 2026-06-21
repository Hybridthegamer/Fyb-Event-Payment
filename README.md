# NACOS FYB Class of 2026 — Event Payment Portal

A student-facing payment portal for the National Association of Computing Students (NACOS), Rivers State University — Final Year Bash event registration and payment.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firebase Firestore
- **Payments**: FossaPay (bank transfer collections + payouts)
- **Ticket generation**: html2canvas
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Firebase project setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project.
2. Enable **Authentication** → Sign-in methods → **Google**.
3. Enable **Firestore Database** (start in production mode).
4. In Project Settings → General → Your apps → Add a Web App.
5. Copy the config values (apiKey, authDomain, etc.).

**Apply Firestore security rules** — from the console's Firestore Rules tab, paste the contents of `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /registrations/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Configure environment variables

Open `.env.local` and replace all placeholders:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# ── FossaPay (payments) ──────────────────────────────────────
# Secret key from dashboard.fossapay.com → Settings → API Keys
# (fp_test_sk_* for testing, fp_live_sk_* for production).
FOSSAPAY_SECRET_KEY=fp_live_sk_xxxxxxxx
# Secret used to verify inbound webhook signatures.
FOSSAPAY_WEBHOOK_SECRET=your-webhook-secret

# The single shared account shown to every student. Provision once, then pin
# the ids here so the app never re-creates the wallet:
FOSSAPAY_CUSTOMER_ID=
FOSSAPAY_WALLET_ID=
# Optional overrides:
# FOSSAPAY_WALLET_REFERENCE=nacos-fyb-dinner-night
# FOSSAPAY_CUSTOMER_EMAIL=fybdinnernight@nacosrsu.events
# FOSSAPAY_BASE_URL=https://api-production.fossapay.com/api/v1
# ────────────────────────────────────────────────────────────
```

> **Simulation mode:** With no `FOSSAPAY_SECRET_KEY` set, the payment + bank
> flows run in a safe simulated mode (account details, payment confirmation,
> bank list, name enquiry, withdrawals) so the whole UX can be exercised
> without moving real money. Add a real key to switch to live processing — no
> code changes required.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment to Vercel

1. Push this repository to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add all environment variables from `.env.local` in Vercel project settings.
4. Deploy — Vercel auto-detects Next.js.

---

## Payment Integration (FossaPay)

Payments run on [FossaPay](https://docs.fossapay.com) — bank-transfer
collections for student payments and inter-bank transfers for admin payouts.

**How it works**

- A **single shared fiat account** (account name **"Fyb Dinner Night."**) is
  displayed to every student on the bank-transfer screen. It is provisioned
  once via the FossaPay API (`/api/fossapay/account`); pin
  `FOSSAPAY_WALLET_ID` / `FOSSAPAY_CUSTOMER_ID` after the first run.
- Students cover the **FossaPay processing fee**, added on top of their ticket
  amount at transfer time:

  | Amount transferred | Fee |
  | --- | --- |
  | below ₦5,000 | ₦60 |
  | ₦5,000 – ₦9,999 | ₦120 |
  | ₦10,000 – ₦14,999 | ₦200 |
  | ₦15,000 – ₦24,999 | ₦250 |
  | ₦25,000 and above | 1.2% (capped at ₦1,000) |

- After paying, students see a **receipt**. Part payment → receipt only;
  full payment → receipt **and** ticket(s). Both are downloadable.
- The **admin dashboard** (`/admin`, PIN **2880**) is a full bank: every
  student payment is a deposit and every payout a withdrawal, both reflected in
  the displayed balance. Withdrawals use FossaPay's supported-banks list, name
  enquiry, and inter-bank transfer.

**API routes** (`app/api/fossapay/`): `account`, `verify`, `banks`,
`name-enquiry`, `transfer`, `balance`, `webhook`.

**Webhook:** point your FossaPay webhook at `/api/fossapay/webhook`. Signatures
are verified with `FOSSAPAY_WEBHOOK_SECRET` (HMAC-SHA256).

---

## Features

- Google Sign-In authentication
- 4-step dinner night registration flow (Details → Options → Payment → Ticket)
- Full payment and instalment support
- Returning user detection (resumes from last state)
- Downloadable event tickets per attendee via html2canvas
- Payment receipt for partial payments
- Pool Party coming soon page
- Fully responsive, mobile-first

---

## Project Structure

```
app/
  page.tsx              → Home (event selector)
  login/page.tsx        → Google Sign-In
  dinner/page.tsx       → FYB Dinner Night (4-step flow)
  pool-party/page.tsx   → Coming Soon
  admin/page.tsx        → Admin bank dashboard (PIN 2880)
  api/fossapay/         → FossaPay routes (account, verify, banks,
                          name-enquiry, transfer, balance, webhook)

components/
  AuthGuard.tsx         → Auth protection wrapper
  Navbar.tsx            → Top navigation
  LogoPill.tsx          → NACOS + RSU logo pill
  PaymentStepper.tsx    → Step progress indicator
  TicketCard.tsx        → Downloadable event ticket
  ReceiptCard.tsx       → Partial payment receipt

lib/
  firebase.ts           → Firebase init
  firestoreHelpers.ts   → Firestore CRUD helpers + bank ledger
  fossapay.ts           → FossaPay server-side client (server-only)
  utils.ts              → formatNaira, getMatricLast4, fee calculation
```
