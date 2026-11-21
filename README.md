# SawahKu

Aplikasi manajemen penyewaan lahan sawah: React + Vite (frontend) dan PocketBase (backend).

## Menjalankan lokal

```bash
npm install
cp .env.example .env      # opsional, VITE_PB_URL untuk proxy /api saat dev
npm run dev               # http://localhost:5173
```

Build produksi:

```bash
npm run build             # tsc -b && vite build -> dist/
npm run lint
```

Frontend memakai `window.location.origin` (lihat `src/lib/pb.ts`), jadi di produksi
origin yang sama harus meneruskan `/api` ke PocketBase.

## PocketBase & migrasi

Skema koleksi ada di `pb_migrations/` (detail field dan access rules di
`pb_migrations/README.md`).

```bash
./pocketbase migrate up
./pocketbase superuser upsert admin@contoh.com passwordku
./pocketbase serve --http=0.0.0.0:8090
```

## Deploy dengan Docker Compose

Node **tidak** dipakai di server. Frontend di-build di lokal, lalu Docker hanya
menjalankan hasil build (`dist/`) dan PocketBase dalam satu compose.

```
docker-compose.yml
├── web        nginx:alpine, menyajikan ./dist, proxy /api -> pocketbase:8090
└── pocketbase ghcr.io/muchobien/pocketbase:0.40.5, data di ./pb_data
```

Port di-bind ke `0.0.0.0` (web `8081`, PocketBase `8090`) agar bisa diakses
dari LAN. Akses publik memakai Cloudflare Tunnel yang diarahkan ke
`http://127.0.0.1:8081`; tidak ada vhost nginx host untuk domain ini
(nginx host hanya melayani situs lain).

```bash
npm run build                 # build frontend di lokal
docker compose up -d          # jalankan stack
docker compose ps
docker compose logs -f
docker compose down
```

Deploy ke server dari komputer lokal:

```bash
bash deploy/deploy.sh         # build + upload dist & compose + restart stack
```

Pertama kali memindahkan PocketBase systemd ke Docker (di server, butuh sudo):

```bash
sudo bash /var/www/html/sawah/deploy/cutover.sh
# rollback bila perlu:
sudo bash /var/www/html/sawah/deploy/rollback.sh /root/sawahku-backup-XXXX
```

Catatan:

- `./pb_data` adalah data PocketBase untuk container; pada cutover isinya disalin
  dari `/opt/pocketbase/pb_data` (backup asli disimpan di `/root/sawahku-backup-*`).
- Container PocketBase berjalan sebagai UID/GID `999:987` (pbuser) agar kepemilikan
  file data tetap konsisten.
- `pb_migrations/` di-mount read-only dan dijalankan otomatis saat container start.

## SEO

- Tag per halaman diatur `react-helmet-async`: Landing (`title`, description,
  keywords, canonical, geo, JSON-LD `WebSite` + `LocalBusiness` dari data
  Pengaturan), sedangkan halaman admin/login/nota memakai `noindex`.
- `index.html` menyimpan tag statis untuk crawler yang tidak menjalankan
  JavaScript (pratinjau tautan WhatsApp/Facebook) serta link manifest PWA.
  Jangan menambahkan `og:*` dari Helmet lagi agar tag tidak ganda.
- `public/robots.txt` melarang `/admin`, `/login`, `/nota/`; `public/sitemap.xml`
  hanya memuat beranda. Perbarui domain/lastmod di kedua file bila domain berubah.

## PWA (installable + offline)

- `public/manifest.webmanifest` + ikon PNG di `public/icons/`
  (192, 512, maskable 512, apple-touch 180 — dibuat dari `public/favicon.svg`).
- `public/sw.js`: navigasi network-first dengan fallback app shell lalu
  `public/offline.html`; aset `stale-while-revalidate`; request `/api/*` tidak
  pernah di-cache. Versi cache diambil dari query `?v=` saat registrasi, jadi
  cache lama terhapus otomatis setiap deploy (tanpa naikkan `VERSION` manual).
- Service worker didaftarkan di `src/main.tsx` hanya saat build produksi, dengan
  `?v=<nama bundle ber-hash>` sebagai versi agar tiap deploy memakai URL baru
  (menghindari cache CDN yang basi).
- `deploy/nginx/default.conf` menetapkan MIME `application/manifest+json` dan
  `Cache-Control: no-cache` untuk manifest/service worker. Cloudflare menimpa
  `Cache-Control` untuk `.js`, karena itu registrasi SW memakai `?v=` (cache key
  CDN ikut berubah tiap deploy). `deploy/deploy.sh` memuat ulang nginx
  (`nginx -t` lalu `nginx -s reload`) setelah menyalin config.
