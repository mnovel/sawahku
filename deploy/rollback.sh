#!/usr/bin/env bash
# Rollback ke instalasi lama (systemd PocketBase + dist statis).
#   sudo bash /var/www/html/sawah/deploy/rollback.sh /root/sawahku-backup-XXXX
set -euo pipefail

APP=/var/www/html/sawah
BACKUP=${1:-}

if [ "${EUID:-$(id -u)}" -ne 0 ]; then
  echo "Jalankan dengan sudo: sudo bash $0 <folder-backup>" >&2
  exit 1
fi
if [ -z "$BACKUP" ] || [ ! -f "$BACKUP/pb_data.tgz" ]; then
  echo "Folder backup tidak valid: '$BACKUP'" >&2
  exit 1
fi

echo "== 1. Hentikan compose"
cd "$APP"
docker compose down || true

echo "== 2. Kembalikan pb_data ke /opt/pocketbase"
tar xzf "$BACKUP/pb_data.tgz" -C /opt/pocketbase
chown -R 999:987 /opt/pocketbase/pb_data

echo "== 3. Nyalakan PocketBase systemd"
systemctl enable --now pocketbase

echo "== 4. Kembalikan vhost nginx"
cp -a "$BACKUP/nginx-sawah.conf" /etc/nginx/sites-enabled/sawah
nginx -t
systemctl reload nginx

curl -fsS -o /dev/null -w "web -> HTTP %{http_code}\n" -H "Host: sawahku.novelwardah.com" http://127.0.0.1/
echo "Rollback selesai."
