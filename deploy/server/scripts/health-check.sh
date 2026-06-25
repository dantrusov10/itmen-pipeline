#!/usr/bin/env bash
set -euo pipefail

curl -sf "http://127.0.0.1:8095/api/health" | python3 -m json.tool
systemctl is-active pb-itmen-pipeline.service
du -sh /opt/itmen-pipeline/pb_data 2>/dev/null || true
