#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Полная схема коллекций ITMen Pipeline для импорта без потери данных."""
import json
import random
import string
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_JSON = ROOT / "pocketbase" / "collections.import.json"
SCHEMA_VERSION = 2


def rid(n=15):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def fld(name, typ, **opts):
    f = {
        "system": False,
        "id": rid(),
        "name": name,
        "type": typ,
        "required": bool(opts.get("required")),
        "presentable": bool(opts.get("presentable")),
        "unique": bool(opts.get("unique")),
    }
    if typ == "text":
        f["options"] = {"min": None, "max": opts.get("max"), "pattern": opts.get("pattern", "")}
    elif typ == "number":
        f["options"] = {"min": None, "max": None, "noDecimal": bool(opts.get("noDecimal"))}
    elif typ == "date":
        f["options"] = {"min": "", "max": ""}
    elif typ == "json":
        f["options"] = {"maxSize": opts.get("maxSize", 2_000_000)}
    elif typ == "editor":
        f["options"] = {"convertUrls": False}
    elif typ == "bool":
        f["options"] = {}
    return f


def coll(name, fields, rules=None):
    rules = rules or {}
    return {
        "id": rid(),
        "name": name,
        "type": "base",
        "system": False,
        "schema": fields,
        "indexes": rules.get("indexes", []),
        "listRule": rules.get("listRule", ""),
        "viewRule": rules.get("viewRule", ""),
        "createRule": rules.get("createRule"),
        "updateRule": rules.get("updateRule"),
        "deleteRule": rules.get("deleteRule"),
    }


# --- deals: все поля из GAS + payload (полный JSON сделки) ---
DEALS_FIELDS = [
    fld("deal_id", "text", required=True, unique=True, presentable=True),
    fld("customer", "text", presentable=True),
    fld("industry", "text"),
    fld("owner", "text"),
    fld("stage", "text"),
    fld("deal_type", "text"),
    fld("amount", "number"),
    fld("expected_budget", "number"),
    fld("partner", "text"),
    fld("partner_discount", "number"),
    fld("client_discount", "number"),
    fld("manual_prob", "number"),
    fld("task_due", "text"),
    fld("budget_period", "text"),
    fld("budget_status", "text"),
    fld("budget_planned_month", "number", noDecimal=True),
    fld("budget_planned_year", "number", noDecimal=True),
    fld("pains", "editor"),
    fld("capabilities", "text"),
    fld("dml", "text"),
    fld("next_step_type", "text"),
    fld("next_step_comment", "text"),
    fld("risk_type", "text"),
    fld("risk_types", "json"),
    fld("risk_comment", "text"),
    fld("commit_status", "text"),
    fld("last_update", "text"),
    fld("amo_id", "number", noDecimal=True),
    fld("has_pains", "bool"),
    fld("competitors", "text"),
    fld("deal_updated_at", "date"),
    fld("tech_research", "json", maxSize=8_000_000),
    fld("scores", "json"),
    fld("score_reasons", "json"),
    fld("score_history", "json"),
    fld("scores_overridden", "json"),
    fld("payload", "json", maxSize=8_000_000),
]

# --- pipeline_meta: lists, scoring, pipelineFocus, версия ---
META_FIELDS = [
    fld("slug", "text", required=True, unique=True),
    fld("next_id", "number", noDecimal=True),
    fld("data_epoch", "number", noDecimal=True),
    fld("lists", "json", maxSize=2_000_000),
    fld("scoring", "json", maxSize=2_000_000),
    fld("pipeline_focus", "json", maxSize=500_000),
    fld("saved_at", "date"),
    fld("saved_by", "text"),
    fld("state_payload", "json", maxSize=2_000_000),
]

# --- managers: как MANAGERS в Code.gs ---
MANAGERS_FIELDS = [
    fld("manager_id", "text", required=True, unique=True),
    fld("name", "text", required=True),
    fld("sheet", "text"),
    fld("active", "bool"),
]

# --- audit_log: лист _audit (9 колонок) ---
AUDIT_FIELDS = [
    fld("at", "text"),
    fld("saved_by", "text"),
    fld("deal_id", "text"),
    fld("customer", "text"),
    fld("owner", "text"),
    fld("change_count", "number", noDecimal=True),
    fld("label", "text"),
    fld("old_value", "editor"),
    fld("new_value", "editor"),
    fld("is_new_deal", "bool"),
]

SNAP_DAILY_FIELDS = [
    fld("date", "text"),
    fld("ts", "date"),
    fld("source", "text"),
    fld("deal_count", "number", noDecimal=True),
    fld("total_pipeline", "number"),
    fld("weighted_pipeline", "number"),
    fld("hot_count", "number", noDecimal=True),
    fld("warm_count", "number", noDecimal=True),
    fld("avg_score", "number", noDecimal=True),
]

SNAP_DEAL_FIELDS = [
    fld("date", "text"),
    fld("ts", "date"),
    fld("deal_id", "text"),
    fld("customer", "text"),
    fld("owner", "text"),
    fld("score", "number", noDecimal=True),
    fld("amount", "number"),
    fld("category", "text"),
]

IMPORT_LOG_FIELDS = [
    fld("source", "text"),
    fld("started_at", "date"),
    fld("finished_at", "date"),
    fld("status", "text"),
    fld("deals_count", "number", noDecimal=True),
    fld("audit_count", "number", noDecimal=True),
    fld("meta_count", "number", noDecimal=True),
    fld("notes", "editor"),
    fld("error", "editor"),
]

PUBLIC_READ = {"listRule": "", "viewRule": "", "createRule": None, "updateRule": None, "deleteRule": None}
ADMIN_ONLY = {"listRule": None, "viewRule": None, "createRule": None, "updateRule": None, "deleteRule": None}

collections = [
    coll("deals", DEALS_FIELDS, PUBLIC_READ),
    coll("pipeline_meta", META_FIELDS, PUBLIC_READ),
    coll("managers", MANAGERS_FIELDS, PUBLIC_READ),
    coll("audit_log", AUDIT_FIELDS, ADMIN_ONLY),
    coll("snapshots_daily", SNAP_DAILY_FIELDS, ADMIN_ONLY),
    coll("snapshots_deals", SNAP_DEAL_FIELDS, ADMIN_ONLY),
    coll("import_log", IMPORT_LOG_FIELDS, ADMIN_ONLY),
]

manifest = {
    "schemaVersion": SCHEMA_VERSION,
    "collections": [c["name"] for c in collections],
    "notes": "deals.payload и pipeline_meta.state_payload — страховка полного JSON",
}

OUT_JSON.write_text(json.dumps(collections, ensure_ascii=False, indent=2), encoding="utf-8")
(ROOT / "pocketbase" / "schema.manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
)

print(f"schema v{SCHEMA_VERSION}: {len(collections)} collections")
print(f"  deals fields: {len(DEALS_FIELDS)}")
print(f"Wrote {OUT_JSON}")
