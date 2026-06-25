#!/usr/bin/env bash
set -euo pipefail

ROOT="/opt/itmen-pipeline"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="${ROOT}/backups/pb_data_${STAMP}.tar.gz"

mkdir -p "${ROOT}/backups"
tar -czf "${OUT}" -C "${ROOT}" pb_data pb_migrations
echo "Backup: ${OUT}"
ls -lh "${OUT}"

# хранить последние 14 бэкапов
ls -1t "${ROOT}"/backups/pb_data_*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
