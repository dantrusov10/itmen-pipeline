#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Клонирование prod → staging через GAS API.

Требования на staging:
  1. Новая Google Таблица + Code.gs из gas/Code.gs (с importEnvironmentClone)
  2. setup() выполнен, веб-приложение развёрнуто
  3. tools/env_urls.json с URL staging

Использование:
  python tools/clone_prod_to_staging.py           # dry-run
  python tools/clone_prod_to_staging.py --apply   # записать на staging
  python tools/clone_prod_to_staging.py --apply --skip-audit
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gas_env import gas_url, health, load_audit_rows, load_full_state, post  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description="Клон prod → staging")
    parser.add_argument("--apply", action="store_true", help="Записать на staging")
    parser.add_argument("--skip-audit", action="store_true", help="Не копировать аудит")
    args = parser.parse_args()

    prod = gas_url("production")
    staging = gas_url("staging")

    print("=== PROD ===")
    prod_h = health(prod)
    print(f"  spreadsheet: {prod_h.get('spreadsheetId')}")
    print(f"  audit rows:  {prod_h.get('auditRows')}")

    print("\n=== STAGING (до) ===")
    try:
        staging_h = health(staging)
        print(f"  spreadsheet: {staging_h.get('spreadsheetId')}")
        print(f"  audit rows:  {staging_h.get('auditRows')}")
    except Exception as e:
        print(f"  недоступен: {e}")
        if args.apply:
            raise SystemExit("Staging GAS недоступен — сначала разверните веб-приложение") from e
        staging_h = {}

    print("\nЗагрузка state с prod…")
    state = load_full_state(prod)
    deals = state.get("deals") or []
    print(f"  сделок: {len(deals)}, savedAt: {state.get('_savedAt')}")

    audit_rows = []
    if not args.skip_audit:
        print("Загрузка аудита с prod…")
        audit_rows = load_audit_rows(prod)
        print(f"  строк аудита: {len(audit_rows)}")

    if not args.apply:
        print("\n[dry-run] Для записи: python tools/clone_prod_to_staging.py --apply")
        return

    print("\nЗапись на staging (importEnvironmentClone)…")
    res = post(staging, {
        "action": "importEnvironmentClone",
        "allowMaintenance": True,
        "state": state,
        "auditRows": audit_rows if not args.skip_audit else [],
    })
    if res.get("error"):
        raise SystemExit(res["error"])

    print(f"  OK: {res.get('deals')} сделок, {res.get('auditRows')} строк аудита")
    print(f"  spreadsheet: {res.get('spreadsheetId')}")

    staging_h2 = health(staging)
    print("\n=== STAGING (после) ===")
    print(f"  audit rows: {staging_h2.get('auditRows')}")
    print("Готово. Запустите: python tools/verify_environments.py")


if __name__ == "__main__":
    main()
