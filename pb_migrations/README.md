# Skema & Migrasi PocketBase — SawahKu

Folder ini berisi skema backend yang dipakai aplikasi frontend di `src/`.
Dibutuhkan **PocketBase >= 0.23** (migrasi memakai properti `fields`, bukan `schema`).

## Cara menjalankan

1. Letakkan folder `pb_migrations/` di samping binary `pocketbase` (satu level dengan `pb_data/`).
2. Jalankan salah satu:
   ```bash
   ./pocketbase migrate up     # terapkan migrasi
   ./pocketbase migrate down   # rollback migrasi terakhir
   ./pocketbase serve          # atau cukup start, migrasi baru otomatis dijalankan
   ```
3. Buat akun admin pertama bila belum ada: `./pocketbase superuser upsert admin@contoh.com passwordku`.

## Sifat migrasi

Migrasi `1794000000000_sawahku_schema.js` **idempoten** dan aman dijalankan pada server yang sudah berisi data:

- Koleksi yang belum ada dibuat lengkap sesuai yang dipakai aplikasi.
- Koleksi yang sudah ada **tidak diubah** (termasuk access rules), kecuali:
  - penambahan field `jumlah_musim` pada `transaksi_sewa` bila belum ada.
- Rollback hanya melepas field `jumlah_musim`; koleksi tidak dihapus agar data tidak hilang.

Migrasi kedua `1794000001_backfill_jumlah_musim.js`:

- Mengisi `jumlah_musim = 1` untuk record lama yang masih `0`/kosong.
- Menambahkan field `transaksi_sewa.keterangan` dan `penyewa.catatan` bila belum ada (idempoten).

Migrasi ketiga `1794000002_sawahku_fix_rules.js` menyamakan API rules pada instalasi lama / hasil restore backup (idempoten):

- `setting`: baca publik, **tulis wajib login** (create/update/delete tidak lagi terbuka untuk tamu).
- `transaksi_sewa`: `viewRule` publik agar `/nota/:id` bisa dibuka tanpa login; `listRule` dan semua operasi tulis wajib login.
- `sawah`: `viewRule` disamakan dengan `listRule` (publik) agar `expand=sawah` pada nota publik tidak kosong.
- Data penyewa tetap tidak terbuka: `expand=penyewa` hanya jalan bila `penyewa.viewRule` mengizinkan, dan request anonim atas `penyewa` mengembalikan 0 record.

Migrasi keempat `1794000003_transaksi_penyewa_nama.js` menambahkan field `transaksi_sewa.penyewa_nama` dan mengisinya dari relasi `penyewa` (idempoten):

- Nota publik `/nota/:id` bisa menampilkan **nama** penyewa walau koleksi `penyewa` tetap tertutup untuk tamu (kontak & alamat tidak ikut tersimpan di field ini).
- Frontend menulis `penyewa_nama` setiap kali transaksi dibuat/diedit.

## Koleksi & field penting

| Koleksi | Field utama |
|---|---|
| `sawah` | nama, lokasi, luas_total, harga_sewa, status (`tersedia`/`disewa`), deskripsi, foto, url_maps |
| `sertifikat` | sawah (relasi), tipe_hak, nib, luas, url_maps, url_bhumi |
| `penyewa` | nama, kontak, alamat, status (`aktif`/`nonaktif`), foto |
| `transaksi_sewa` | sawah, penyewa, **penyewa_nama**, tanggal_mulai, tanggal_panen, tanggal_jatuh_tempo, harga_sewa, **jumlah_musim**, status, status_bayar, nominal_dibayar, ttd_penyewa |
| `riwayat_bayar` | transaksi, nominal, tanggal, keterangan |
| `log_bulanan` | transaksi, periode, fase, keterangan, foto |
| `setting` | nama_aplikasi, deskripsi, deskripsi_singkat, keyword, nama_pengelola, domain, logo, alamat, nomor_wa, catatan_nota |

Koleksi `users` bawaan PocketBase dipakai untuk login admin.

## Rules default

Untuk koleksi yang **baru dibuat** oleh migrasi ini:

- `sawah`, `sertifikat`, `setting`: baca publik, tulis khusus admin.
- `transaksi_sewa`: hanya baca-satu yang publik (agar `/nota/:id` bisa dibuka tanpa login), tulis khusus admin.
- `penyewa`, `riwayat_bayar`, `log_bulanan`: seluruh akses khusus admin.

Catatan: karena `penyewa` tidak dapat dibaca publik, `expand=penyewa` pada nota publik akan kosong. Nama penyewa di nota diambil dari field salinan `transaksi_sewa.penyewa_nama`, sehingga kontak & alamat tetap tidak tersedia untuk tamu.

## Kompatibilitas frontend

Frontend tetap bisa menyimpan transaksi walau field baru (`jumlah_musim`, `penyewa_nama`) belum ada di server:
`simpanTransaksi()` di `src/pages/Transaksi.tsx` mencoba ulang tanpa field yang ditolak (dan menampilkan peringatan untuk `jumlah_musim`). Setelah migrasi diterapkan, nilainya tersimpan normal.
