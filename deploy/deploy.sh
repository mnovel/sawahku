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
# dist/ di server adalah bind mount container, jadi folder tidak boleh dihapus
# (inode-nya akan hilang). Ekstrak ke staging lalu salin isinya.
tar czf - dist docker-compose.yml deploy pb_migrations \
  | ssh "$SERVER" "set -e
      mkdir -p '$REMOTE_DIR'
      rm -rf '$REMOTE_DIR/.deploy-staging'
      mkdir -p '$REMOTE_DIR/.deploy-staging'
      tar xzf - -C '$REMOTE_DIR/.deploy-staging'
      mkdir -p '$REMOTE_DIR/dist'
      find '$REMOTE_DIR/dist' -mindepth 1 -delete
      cp -a '$REMOTE_DIR/.deploy-staging/dist/.' '$REMOTE_DIR/dist/'
      cp -a '$REMOTE_DIR/.deploy-staging/docker-compose.yml' '$REMOTE_DIR/.deploy-staging/deploy' '$REMOTE_DIR/.deploy-staging/pb_migrations' '$REMOTE_DIR/'
      rm -rf '$REMOTE_DIR/.deploy-staging'"

echo "== 3. Pastikan container jalan"
ssh "$SERVER" "cd '$REMOTE_DIR' && docker compose up -d && docker compose ps"

echo "== 4. Cek HTTP"
ssh "$SERVER" "curl -sS -o /dev/null -w 'web -> HTTP %{http_code}\n' -H 'Host: sawahku.novelwardah.com' http://127.0.0.1/; curl -sS -o /dev/null -w 'api -> HTTP %{http_code}\n' -H 'Host: sawahku.novelwardah.com' http://127.0.0.1/api/health"
