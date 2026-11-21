#!/usr/bin/env bash
# Deploy dari komputer lokal ke server.
#   bash deploy/deploy.sh
# Build frontend dilakukan di lokal (Node), server hanya menjalankan container.
set -euo pipefail

SERVER=${SERVER:-rootkit@192.168.100.205}
REMOTE_DIR=${REMOTE_DIR:-/var/www/html/sawah}

echo "== 1. Build frontend di lokal"
npm run build

echo "== 2. Upload dist + file compose ke $SERVER:$REMOTE_DIR"
tar czf - dist docker-compose.yml deploy pb_migrations \
  | ssh "$SERVER" "mkdir -p '$REMOTE_DIR' && tar xzf - -C '$REMOTE_DIR'"

echo "== 3. Restart container"
ssh "$SERVER" "cd '$REMOTE_DIR' && docker compose up -d && docker compose ps"

echo "== 4. Cek HTTP"
ssh "$SERVER" "curl -fsS -o /dev/null -w 'web -> HTTP %{http_code}\n' -H 'Host: sawahku.novelwardah.com' http://127.0.0.1/; curl -fsS -o /dev/null -w 'api -> HTTP %{http_code}\n' -H 'Host: sawahku.novelwardah.com' http://127.0.0.1/api/health"
