#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Создать js/bootstrap.js (без сделок) для быстрой загрузки страницы."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INITIAL = ROOT / "js" / "initial-data.js"
OUT = ROOT / "js" / "bootstrap.js"

text = INITIAL.read_text(encoding="utf-8")
m = re.search(r"window\.ITMEN_INITIAL\s*=\s*(\{[\s\S]*\});?\s*$", text)
data = json.loads(m.group(1))
data["deals"] = []
data["nextId"] = data.get("nextId") or 1
body = json.dumps(data, ensure_ascii=False, indent=2)
OUT.write_text(
    "// Справочники и шаблон (сделки загружаются с сервера / Google Таблицы)\n"
    f"window.ITMEN_INITIAL = {body};\n",
    encoding="utf-8",
)
print("bootstrap.js written, deals=0")
