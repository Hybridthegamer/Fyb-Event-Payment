# NACOS FYB Class of 2026 — Event Payment Portal

A student-facing payment portal for the National Association of Computing Students (NACOS), Rivers State University — Final Year Bash event registration and payment.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firebase Firestore
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

Create `.env.local` and fill in the values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# ── Payment bank account (shown to every student on the payment screen) ──
PAYMENT_ACCOUNT_NUMBER=0000000000
PAYMENT_BANK_NAME=Your Bank Name
PAYMENT_ACCOUNT_NAME=Fyb Dinner Night.
```

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

## Payment Flow

Payments use a **manual bank transfer** model:

- A **single shared bank account** (configured via `PAYMENT_ACCOUNT_NUMBER` / `PAYMENT_BANK_NAME` / `PAYMENT_ACCOUNT_NAME` env vars) is displayed to every student on the bank-transfer screen.
- Students transfer the exact ticket amount and click **Confirm Payment**. The payment is recorded in Firestore and the student receives a receipt or ticket.
- The **admin dashboard** (`/admin`, PIN **2880**) displays the full transaction ledger (deposits + withdrawals) and allows manual withdrawal recording.

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
  api/payment/          → Payment routes (account, verify)

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
  utils.ts              → formatNaira, getMatricLast4
```
