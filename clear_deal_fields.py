#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Очистить поля паспорта сделок (менеджеры заполняют вручную) и сохранить в GAS."""

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def gas_url():
    cfg = (ROOT / "js" / "gas-config.js").read_text(encoding="utf-8")
    return re.search(r'url:\s*"([^"]+)"', cfg).group(1)


def fetch_state(url):
    with urllib.request.urlopen(f"{url}?action=get", timeout=120) as r:
        data = json.loads(r.read().decode("utf-8"))
    return data["state"]


def empty_tech():
    return {
        "seekingSegments": [],
        "asIsStack": {},
        "changePains": {},
        "competitorEntries": {},
        "projectTasks": [],
        "productRequirementsPct": None,
        "pilotRequirementsPct": None,
    }


def base_scores():
    return {
        "loyalty": 0, "commit": 0, "budget": 1, "fit": 0, "timing": 0,
        "competitive": 0, "access": 0, "technical": 0, "commercial": 0,
    }


def base_score_reasons():
    return {
        "loyalty": "Оценивается только вручную",
        "commit": "Статус коммита: Нет подтверждения",
        "budget": "Статус бюджета неизвестен",
        "fit": "Не заполнено",
        "timing": "Не заполнено",
        "competitive": "Не заполнено",
        "access": "Оценивается вручную",
        "technical": "Не заполнено",
        "commercial": "Не заполнено",
    }


def clear_deal(d):
    d = dict(d)
    d["manualProb"] = 0
    d["taskDue"] = ""
    d["budgetPeriod"] = "Не определён"
    d["budgetStatus"] = "Неизвестно"
    d["budgetPlannedMonth"] = None
    d["budgetPlannedYear"] = None
    d["commitStatus"] = "none"
    d["pains"] = ""
    d["nextStepType"] = "discovery"
    d["nextStepComment"] = ""
    d["riskType"] = "none"
    d["riskComment"] = ""
    d["techResearch"] = empty_tech()
    d["scores"] = base_scores()
    d["scoreReasons"] = base_score_reasons()
    return d


def push_state(url, state):
    payload = json.dumps({"action": "save", "state": state}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "text/plain;charset=utf-8"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read().decode("utf-8")


def main():
    url = gas_url()
    state = fetch_state(url)
    state["deals"] = [clear_deal(d) for d in state.get("deals", [])]
    print(push_state(url, state))
    print(f"Cleared passport fields in {len(state['deals'])} deals")


if __name__ == "__main__":
    main()
