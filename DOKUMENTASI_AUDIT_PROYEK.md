# Dokumentasi Audit Proyek Bankable

## 1. Ringkasan Eksekutif

Secara umum, fondasi produk **sudah kuat**: auth, katalog/course player, quiz, sertifikat, admin panel, payment gateway + manual, sidebar CMS, dan route utama sudah tersedia.

Area yang masih kurang ada di **reliability produksi, kontrol akses premium per-course, observability, dan dokumentasi operasional**.

## 2. Cek Kondisi Terkini

### Build & Quality
- `npm run lint`: **lulus** (25 warning, 0 error)
- `npm run test -- --runInBand`: **lulus** (4 test)
- `npm run build`: **lulus**

### Catatan kualitas yang terlihat
- Warning lint cukup banyak (unused vars, hook deps, `img` tanpa `next/image`).
- Unit test masih sangat minim (baru helper sertifikat dan payment gateway).

## 3. Gap Utama (Apa yang Kurang)

## P0 (Kritis)
1. **Entitlement akses premium per-course belum konsisten**
   - Kasus: member sudah bayar + admin konfirmasi, tapi akses course/webinar premium masih bisa dianggap belum terbuka di sebagian flow.
   - Dampak: pengalaman beli buruk, potensi komplain/refund.

2. **README belum merepresentasikan produk**
   - Masih template default Next.js.
   - Belum ada dokumentasi setup env, seed, akun admin, flow payment, webhook, dan runbook operasional.

3. **Tidak ada CI pipeline**
   - Belum ada workflow otomatis lint/test/build pada pull request.
   - Risiko regresi tinggi saat perubahan cepat.

## P1 (Penting)
1. **Testing coverage rendah**
   - Belum ada integration test untuk:
   - auth + role guard
   - checkout manual/gateway
   - webhook/update status payment
   - unlock akses premium/course
   - progress tracking + quiz flow

2. **Observability belum ada**
   - Belum ada error tracking terstruktur (Sentry/Logtail dsb).
   - Belum ada audit log aksi admin penting (publish course, mark paid, ubah settings).

3. **Keamanan API belum dipertegas**
   - Perlu hardening rate limit pada endpoint sensitif (auth, checkout, webhook, upload).
   - Validasi payload webhook dan idempotency perlu dokumentasi + guard yang eksplisit.

4. **Dokumentasi environment belum lengkap**
   - Belum ada `.env.example` yang lengkap untuk local/dev/prod.
   - Belum ada panduan secret management dan rotasi key.

## P2 (Nice to Have)
1. **DX & maintainability**
   - Rapikan warning lint ke 0 agar sinyal warning benar-benar penting.
   - Standardisasi util domain (akses course, payment status, formatting) agar tidak tersebar.

2. **Data/seed robustness**
   - Seed idempotency masih perlu dipastikan benar-benar aman di rerun berulang.

3. **Dokumen arsitektur**
   - Belum ada diagram sistem ringkas (auth, payment, course access, admin flow).

## 4. Rekomendasi Implementasi (Prioritas)

1. **Selesaikan entitlement premium per-course end-to-end (P0).**
2. **Perbarui README + buat env example + runbook payment/webhook (P0).**
3. **Tambahkan GitHub Actions CI lint/test/build (P0).**
4. **Tambah integration tests untuk flow bisnis inti (P1).**
5. **Tambah observability + audit log admin (P1).**
6. **Hardening security controls (rate-limit, webhook idempotency/verification) (P1).**

## 5. Checklist Definition of Done (DoD)

- [ ] Member yang `PAID` untuk premium course **langsung bisa akses player**, tanpa beli ulang.
- [ ] README tidak lagi template default; mencakup setup lengkap, env, seed, akun, dan flow payment.
- [ ] CI PR wajib lulus lint + test + build.
- [ ] Ada integration test minimum untuk auth, payment, access unlock, progress, quiz.
- [ ] Webhook/payment flow memiliki log dan runbook troubleshooting.

## 6. Lampiran Temuan Teknis Singkat

- Stack aktual sudah berubah dari rencana awal:
  - ORM: **Drizzle** (bukan Prisma).
  - Auth: **Better Auth** (bukan NextAuth).
  - Payment: Midtrans/Xendit + mode manual.
- Route dan fitur utama sudah tersedia, namun quality gate dan dokumentasi operasional belum setara tahap production-ready.

