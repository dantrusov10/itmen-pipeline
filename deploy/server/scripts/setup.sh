#!/usr/bin/env bash
set -euo pipefail

ROOT="/opt/itmen-pipeline"
PB_SRC="${PB_SRC:-/opt/pb-control/pocketbase}"

echo "==> ITMen Pipeline server setup in ${ROOT}"

mkdir -p "${ROOT}"/{pb_data,pb_migrations,frontend,api/src,backups,scripts,infra/systemd,infra/nginx}

if [[ ! -f "${ROOT}/pocketbase" ]]; then
  if [[ -x "${PB_SRC}" ]]; then
    cp "${PB_SRC}" "${ROOT}/pocketbase"
    chmod +x "${ROOT}/pocketbase"
    echo "Copied pocketbase from ${PB_SRC}"
  else
    echo "ERROR: pocketbase binary not found at ${PB_SRC}" >&2
    exit 1
  fi
fi

if [[ ! -f "${ROOT}/.env" ]]; then
  cp "${ROOT}/.env.example" "${ROOT}/.env"
  # сгенерировать пароль админа
  PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"
  sed -i "s/PB_ADMIN_PASSWORD=.*/PB_ADMIN_PASSWORD=${PASS}/" "${ROOT}/.env"
  chmod 600 "${ROOT}/.env"
  echo "Created ${ROOT}/.env with generated PB_ADMIN_PASSWORD"
fi

# shellcheck disable=SC1091
source "${ROOT}/.env"

EMAIL="${PB_ADMIN_EMAIL:-admin@itmen-pipeline.local}"
PASSWORD="${PB_ADMIN_PASSWORD:-}"

install -m 644 "${ROOT}/infra/systemd/pb-itmen-pipeline.service" /etc/systemd/system/pb-itmen-pipeline.service
systemctl daemon-reload
systemctl enable pb-itmen-pipeline.service
systemctl restart pb-itmen-pipeline.service

sleep 2
if ! curl -sf "http://127.0.0.1:8095/api/health" >/dev/null; then
  echo "ERROR: PocketBase health check failed" >&2
  journalctl -u pb-itmen-pipeline -n 30 --no-pager
  exit 1
fi

if [[ -n "${PASSWORD}" && "${PASSWORD}" != "CHANGE_ME_STRONG_PASSWORD" ]]; then
  "${ROOT}/pocketbase" admin create "${EMAIL}" "${PASSWORD}" --dir="${ROOT}/pb_data" 2>/dev/null || \
    "${ROOT}/pocketbase" admin update "${EMAIL}" "${PASSWORD}" --dir="${ROOT}/pb_data" 2>/dev/null || true
  echo "Superuser: ${EMAIL} (password in ${ROOT}/.env)"
fi

echo "==> Done. Health:"
curl -s "http://127.0.0.1:8095/api/health" || true
echo ""
echo "Admin UI (SSH tunnel): http://127.0.0.1:8095/_/"
systemctl --no-pager status pb-itmen-pipeline.service | head -5
