require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const { loadState, saveState, logAudit } = require("./db");
const { MANAGERS } = require("./owners");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "..");

app.use(express.json({ limit: "20mb" }));

function cleanState(raw) {
  if (!raw) return raw;
  const s = { ...raw };
  delete s._savedAt;
  delete s._savedBy;
  return s;
}

function ensureState() {
  let state = loadState();
  if (!state) {
    try {
      require("./seed.js");
      state = loadState();
    } catch (e) {
      console.error("Seed failed:", e.message);
    }
  }
  return state;
}

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.get("/api/managers", (_req, res) => {
  res.json(MANAGERS.map(m => ({ id: m.id, name: m.name, sheet: m.sheet })));
});

app.get("/api/pipeline", (_req, res) => {
  const state = ensureState();
  if (!state) return res.status(503).json({ error: "Данные не инициализированы. Запустите npm run seed" });
  res.json({ state: cleanState(state) });
});

app.put("/api/pipeline", (req, res) => {
  const incoming = req.body?.state;
  if (!incoming || !Array.isArray(incoming.deals)) {
    return res.status(400).json({ error: "Некорректное тело запроса" });
  }

  const updatedAt = saveState(cleanState(incoming), "web");
  logAudit("save_pipeline", "web", `${incoming.deals.length} deals`);
  res.json({ ok: true, updatedAt });
});

app.get("/api/export/template", (_req, res) => {
  const p = path.join(ROOT, "ITMen_Pipeline_Шаблон_менеджеров.xlsx");
  if (!fs.existsSync(p)) return res.status(404).json({ error: "Шаблон не найден" });
  res.download(p, "ITMen_Pipeline_Шаблон_менеджеров.xlsx");
});

app.post("/api/import/excel", upload.single("file"), (_req, res) => {
  res.status(501).json({
    error: "Импорт Excel выполняйте в браузере (⬆️ Импорт Excel) — данные сохранятся на сервер автоматически",
  });
});

app.use(express.static(ROOT, { index: "index.html" }));

app.get("/login", (_req, res) => res.redirect("/"));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  if (req.path.includes(".")) return next();
  res.sendFile(path.join(ROOT, "index.html"));
});

app.listen(PORT, () => {
  console.log(`ITMen Pipeline → http://localhost:${PORT}`);
  try { require("./seed.js"); } catch (e) { console.warn("Auto-seed:", e.message); }
});
