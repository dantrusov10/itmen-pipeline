#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Общие функции для работы с GAS API (prod / staging)."""
import json
import re
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = Path(__file__).resolve().parent / "env_urls.json"


def load_env_config():
    if ENV_FILE.exists():
        return json.loads(ENV_FILE.read_text(encoding="utf-8"))
    example = Path(__file__).resolve().parent / "env_urls.example.json"
    if example.exists():
        return json.loads(example.read_text(encoding="utf-8"))
    url = re.search(
        r'url:\s*"([^"]+)"',
        (ROOT / "js" / "gas-config.js").read_text(encoding="utf-8"),
    ).group(1)
    return {"production": {"gasUrl": url}}


def gas_url(name="production"):
    cfg = load_env_config()
    key = name if name in cfg else "production"
    url = cfg.get(key, {}).get("gasUrl") or cfg.get("production", {}).get("gasUrl")
    if not url or "PASTE_" in url:
        raise SystemExit(f"Укажите gasUrl для {key} в tools/env_urls.json")
    return url.rstrip("/")


def fetch(url, path=""):
    with urllib.request.urlopen(url + path, timeout=300) as r:
        return json.loads(r.read().decode("utf-8"))


def post(url, payload):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "text/plain;charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {e.code}: {body[:500]}") from e


def health(url):
    return fetch(url, "?action=health")


def load_full_state(url):
    return fetch(url, "?action=get").get("state")


def load_audit_rows(url):
    return fetch(url, "?action=auditAll").get("rows") or []
