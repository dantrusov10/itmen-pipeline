#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Удалить сделки категории «Отказ» и обновить Google Sheets."""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# reuse calc logic simplified
def category(deal):
    scores = deal.get("scores") or {}
    vals = [v for v in scores.values() if v]
    score = round((sum(scores.get(k, 0) * w for k, w in [
        ("loyalty", 0.1), ("commit", 0.1), ("budget", 0.18), ("fit", 0.18),
        ("timing", 0.14), ("competitive", 0.1), ("access", 0.08), ("technical", 0.06), ("commercial", 0.06)
    ]) / 5) * 100) if vals else None
    commit = deal.get("commitStatus") or "none"
    bs = deal.get("budgetStatus") or "Неизвестно"
    if score is None and commit != "contract":
        return ""
    if commit == "contract":
        return "Горячая"
    if bs == "Нет бюджета":
        if score is not None and score >= 60:
            return "Тёплая"
        if score is not None and score >= 40:
            return "Наблюдение"
        return "Отказ"
    if score is None:
        return ""
    if score >= 80:
        return "Горячая"
    if score >= 60:
        return "Тёплая"
    if score >= 40:
        return "Наблюдение"
    return "Отказ"


def main():
    path = ROOT / "js" / "initial-data.js"
    text = path.read_text(encoding="utf-8")
    data = json.loads(re.search(r"window\.ITMEN_INITIAL\s*=\s*(\{[\s\S]*\});?\s*$", text).group(1))
    before = len(data["deals"])
    data["deals"] = [d for d in data["deals"] if category(d) != "Отказ"]
    after = len(data["deals"])
    path.write_text(
        "// Pipeline — imported from AmoCRM\nwindow.ITMEN_INITIAL = "
        + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"Removed {before - after} rejected deals ({after} left)")
    subprocess.run([sys.executable, str(ROOT / "push_gas_state.py")], check=True)


if __name__ == "__main__":
    main()
