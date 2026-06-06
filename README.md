# NACOS FYB Class of 2026 — Event Payment Portal

A student-facing payment portal for the National Association of Computing Students (NACOS), Rivers State University — Final Year Bash event registration and payment.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Firebase Authentication (Google Sign-In)
- **Database**: Firebase Firestore
- **Payments**: Paystack (inline popup)
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

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_PAYSTACK_MERCHANT_NAME=NACOS RSU FYB
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
```

> **Important**: `PAYSTACK_SECRET_KEY` is server-only (no `NEXT_PUBLIC_` prefix). Never expose it to the client.

### 4. Paystack setup

1. Create a [Paystack](https://paystack.com) account.
2. Get your public and secret keys from Dashboard → Settings → API Keys & Webhooks.
3. Replace placeholder keys in `.env.local`.
4. Use `pk_test_...` / `sk_test_...` for testing, `pk_live_...` / `sk_live_...` for production.

### 5. Run locally

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

> The `PAYSTACK_SECRET_KEY` must be set as a Vercel environment variable for the payment verification API route to work in production.

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
  api/verify-payment/   → Paystack verification endpoint

components/
  AuthGuard.tsx         → Auth protection wrapper
  Navbar.tsx            → Top navigation
  LogoPill.tsx          → NACOS + RSU logo pill
  PaymentStepper.tsx    → Step progress indicator
  TicketCard.tsx        → Downloadable event ticket
  ReceiptCard.tsx       → Partial payment receipt

lib/
  firebase.ts           → Firebase init
  paystack.ts           → Paystack script loader + initiator
  firestoreHelpers.ts   → Firestore CRUD helpers
  utils.ts              → formatNaira, generateRef, getMatricLast4
```
