# Runbook Payment (Gateway + Manual)

## 1. Tujuan

Panduan operasional untuk memproses pembayaran member dan troubleshooting jika status payment tidak bergerak.

## 2. Mode Pembayaran

Mode diset dari **Admin > Settings**:

- `GATEWAY`: Midtrans/Xendit
- `MANUAL`: transfer manual + verifikasi admin

## 3. Alur Operasional

## A. Gateway

1. Member klik beli -> sistem buat payment `PENDING`.
2. Member menyelesaikan pembayaran di gateway.
3. Gateway memanggil `/api/payments/webhook`.
4. Sistem update payment ke `PAID/FAILED/EXPIRED`.
5. Jika payment untuk premium course/webinar, akses course premium terbuka.
6. Jika payment membership non-course, membership diaktivasi.

## B. Manual

1. Member klik beli -> payment `PENDING` provider `MANUAL`.
2. Member mengikuti instruksi transfer manual.
3. Admin cek bukti transfer.
4. Admin klik `Mark Paid` di Admin > Payments.
5. Sistem update payment `PAID` dan membuka akses sesuai tipe pembelian.

## 4. Checklist Saat Ada Komplain "Sudah Bayar Tapi Belum Kebuka"

1. Cek payment user di Admin > Payments:
   - Pastikan status sudah `PAID`.
   - Pastikan payment yang benar (item/courseSlug sesuai).
2. Jika status masih `PENDING`:
   - Untuk gateway: cek webhook gateway terkirim.
   - Untuk manual: admin perlu klik `Mark Paid`.
3. Setelah status `PAID`, minta user refresh detail course dan halaman `/payments/[id]`.

## 5. Verifikasi Webhook

- Endpoint: `/api/payments/webhook`
- Midtrans:
  - butuh signature valid (`MIDTRANS_SERVER_KEY`)
- Xendit:
  - butuh header `x-callback-token` sesuai `XENDIT_WEBHOOK_TOKEN`

## 6. Fallback Aman

Jika gateway bermasalah sementara:

1. Ubah mode ke `MANUAL` di Admin > Settings.
2. Isi instruksi transfer manual yang jelas.
3. Proses verifikasi lewat `Mark Paid`.

