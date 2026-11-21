#!/usr/bin/env bash
# Cutover sekali jalan: PocketBase systemd + nginx statis  ->  Docker Compose.
# Jalankan di server dengan sudo:
#   sudo bash /var/www/html/sawah/deploy/cutover.sh
set -euo pipefail

APP=/var/www/html/sawah
PB_UID=999
PB_GID=987
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP=${BACKUP:-/root/sawahku-backup-$STAMP}

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "Jalankan dengan sudo: sudo bash $0" >&2
  exit 1
fi

echo "== 1. Backup data & konfigurasi ke $BACKUP"
mkdir -p "$BACKUP"
tar czf "$BACKUP/pb_data.tgz" -C /opt/pocketbase pb_data
cp -a /etc/nginx/sites-enabled/sawah "$BACKUP/nginx-sawah.conf"

echo "== 2. Hentikan PocketBase systemd (port 8090 harus kosong)"
systemctl disable --now pocketbase || true

echo "== 3. Salin pb_data ke folder compose"
mkdir -p "$APP/pb_data"
cp -a /opt/pocketbase/pb_data/. "$APP/pb_data/"
chown -R "$PB_UID:$PB_GID" "$APP/pb_data"

echo "== 4. Jalankan compose"
cd "$APP"
docker compose up -d
docker compose ps

echo "== 5. Tunggu PocketBase sehat"
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8090/api/health >/dev/null 2>&1; then
    echo "PocketBase OK"
    break
  fi
  sleep 2
done
curl -fsS http://127.0.0.1:8090/api/health >/dev/null

echo "== 6. Alihkan nginx host ke container"
install -m 644 "$APP/deploy/nginx/sawahku.novelwardah.com.conf" /etc/nginx/sites-enabled/sawah
nginx -t
systemctl reload nginx

echo "== 7. Verifikasi"
curl -sS -o /dev/null -w "web /            -> HTTP %{http_code}\n" -H "Host: sawahku.novelwardah.com" http://127.0.0.1/
curl -sS -o /dev/null -w "api /api/health  -> HTTP %{http_code}\n" -H "Host: sawahku.novelwardah.com" http://127.0.0.1/api/health
curl -sS -o /dev/null -w "nota /nota/abc   -> HTTP %{http_code}\n" -H "Host: sawahku.novelwardah.com" http://127.0.0.1/nota/abc

echo
echo "Selesai. Backup: $BACKUP"
echo "Rollback: sudo bash $APP/deploy/rollback.sh $BACKUP"
