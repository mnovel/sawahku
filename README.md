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

Port hanya di-bind ke `127.0.0.1` (web `8081`, PocketBase `8090`). Akses publik
memakai Cloudflare Tunnel yang diarahkan ke `http://127.0.0.1:8081`; tidak ada
vhost nginx host untuk domain ini (nginx host hanya melayani situs lain).

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
