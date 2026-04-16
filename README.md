# Bankable

Platform belajar dengan model one-time access + premium webinar/course terpisah, dibangun dengan Next.js App Router, Better Auth, Drizzle, dan PostgreSQL.

## Fitur Inti

- Auth (email/password, role MEMBER/ADMIN)
- Katalog course + detail + player + progress
- Quiz + sertifikat + verifikasi sertifikat
- Admin panel (courses, users, payments, settings, sidebar CMS)
- Payment mode:
  - Gateway (Midtrans/Xendit)
  - Manual (verifikasi oleh admin)
- Tracking status pembayaran member (`/payments`, `/payments/[id]`)

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Better Auth
- Drizzle ORM + PostgreSQL (`pg`)
- TypeScript

## Quick Start

1. Install dependencies

```bash
npm ci
```

2. Siapkan environment

```bash
copy .env.example .env.local
```

3. Isi env penting:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

4. Push schema + seed

```bash
npm run db:push
npm run db:seed
```

5. Jalankan app

```bash
npm run dev
```

## Default Akun Seed

- Admin: `admin@bankable.local` / `admin123`
- Member: `member@bankable.local` / `member123`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run db:push`
- `npm run db:seed`

## Payment Modes

### 1) Gateway
- Set `PAYMENT_PROVIDER=MIDTRANS` atau `XENDIT`
- Isi key terkait
- Webhook endpoint: `/api/payments/webhook`

### 2) Manual
- Buka Admin > Settings
- Set payment mode ke `MANUAL`
- Isi instruksi pembayaran manual
- Admin konfirmasi di Admin > Payments (`Mark Paid`)

## Operational Runbook

Lihat dokumen:

- `DOKUMENTASI_AUDIT_PROYEK.md` (audit gap & prioritas)
- `docs/RUNBOOK_PAYMENT.md` (operasional payment/webhook/manual)

