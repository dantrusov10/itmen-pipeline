#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Сверка prod и staging: количество сделок, аудит, выборочные поля."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gas_env import gas_url, health, load_full_state  # noqa: E402

SAMPLE_IDS = ["D-001", "D-050", "D-122"]


def deal_snapshot(deal):
    if not deal:
        return None
    tr = deal.get("techResearch") or {}
    scores = deal.get("scores") or {}
    score_sum = sum(scores.get(k) or 0 for k in scores)
    comp = tr.get("competitorEntries") or {}
    comp_n = sum(len(v or []) for v in comp.values()) if isinstance(comp, dict) else 0
    return {
        "id": deal.get("id"),
        "customer": (deal.get("customer") or "")[:40],
        "owner": deal.get("owner"),
        "commitStatus": deal.get("commitStatus"),
        "pains_len": len(str(deal.get("pains") or "")),
        "score_sum": score_sum,
        "competitor_entries": comp_n,
        "productRequirementsPct": tr.get("productRequirementsPct"),
    }


def main():
    prod_url = gas_url("production")
    staging_url = gas_url("staging")

    print("=== Health ===")
    prod_h = health(prod_url)
    staging_h = health(staging_url)
    for label, h in [("PROD", prod_h), ("STAGING", staging_h)]:
        print(f"{label}: deals sheet ok, audit={h.get('auditRows')}, id={h.get('spreadsheetId')}")

    print("\n=== State ===")
    prod_state = load_full_state(prod_url)
    staging_state = load_full_state(staging_url)
    prod_deals = {d["id"]: d for d in prod_state.get("deals") or [] if d.get("id")}
    staging_deals = {d["id"]: d for d in staging_state.get("deals") or [] if d.get("id")}

    print(f"PROD:    {len(prod_deals)} deals, savedAt={prod_state.get('_savedAt')}")
    print(f"STAGING: {len(staging_deals)} deals, savedAt={staging_state.get('_savedAt')}")

    only_prod = sorted(set(prod_deals) - set(staging_deals))
    only_staging = sorted(set(staging_deals) - set(prod_deals))
    if only_prod:
        print(f"  только в PROD: {only_prod[:10]}{'…' if len(only_prod) > 10 else ''}")
    if only_staging:
        print(f"  только в STAGING: {only_staging[:10]}{'…' if len(only_staging) > 10 else ''}")

    print("\n=== Выборочная сверка ===")
    mismatches = 0
    for deal_id in SAMPLE_IDS + sorted(prod_deals.keys())[:3]:
        if deal_id not in prod_deals and deal_id not in staging_deals:
            continue
        a = deal_snapshot(prod_deals.get(deal_id))
        b = deal_snapshot(staging_deals.get(deal_id))
        if a != b:
            mismatches += 1
            print(f"  DIFF {deal_id}:")
            print(f"    PROD:    {json.dumps(a, ensure_ascii=False)}")
            print(f"    STAGING: {json.dumps(b, ensure_ascii=False)}")
        else:
            print(f"  OK   {deal_id}")

    audit_diff = abs((prod_h.get("auditRows") or 0) - (staging_h.get("auditRows") or 0))
    print(f"\nАудит: разница {audit_diff} строк")

    if len(prod_deals) == len(staging_deals) and not only_prod and not only_staging and mismatches == 0:
        print("\n✓ Окружения совпадают (по базовым метрикам)")
    else:
        print("\n⚠ Есть расхождения — при необходимости: python tools/clone_prod_to_staging.py --apply")
        sys.exit(1)


if __name__ == "__main__":
    main()
