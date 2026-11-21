#!/usr/bin/env bash
# Cutover sekali jalan: PocketBase systemd -> Docker Compose.
# Frontend & API hanya dilayani container (web 127.0.0.1:8081,
# PocketBase 127.0.0.1:8090); akses publik lewat Cloudflare Tunnel,
# bukan vhost nginx host.
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

echo "== 1. Backup data PocketBase ke $BACKUP"
mkdir -p "$BACKUP"
tar czf "$BACKUP/pb_data.tgz" -C /opt/pocketbase pb_data

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

echo "== 6. Verifikasi container"
curl -sS -o /dev/null -w "web  /            -> HTTP %{http_code}\n" http://127.0.0.1:8081/
curl -sS -o /dev/null -w "web  /nota/abc    -> HTTP %{http_code}\n" http://127.0.0.1:8081/nota/abc
curl -sS -o /dev/null -w "web  /api/health  -> HTTP %{http_code}\n" http://127.0.0.1:8081/api/health
curl -sS -o /dev/null -w "pb   /api/health  -> HTTP %{http_code}\n" http://127.0.0.1:8090/api/health

echo
echo "Selesai. Backup: $BACKUP"
echo "Akses publik diatur lewat Cloudflare Tunnel ke http://127.0.0.1:8081"
