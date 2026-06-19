require("dotenv").config();
const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const { initDb, loadState, saveState, logAudit } = require("./db");
const { seedIfEmpty } = require("./seed");
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

async function ensureState() {
  let state = await loadState();
  if (!state) {
    try {
      await seedIfEmpty();
      state = await loadState();
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

app.get("/api/pipeline", async (_req, res) => {
  try {
    const state = await ensureState();
    if (!state) return res.status(503).json({ error: "Данные не инициализированы" });
    res.json({ state: cleanState(state) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка загрузки данных" });
  }
});

app.put("/api/pipeline", async (req, res) => {
  const incoming = req.body?.state;
  if (!incoming || !Array.isArray(incoming.deals)) {
    return res.status(400).json({ error: "Некорректное тело запроса" });
  }

  try {
    const updatedAt = await saveState(cleanState(incoming), "web");
    await logAudit("save_pipeline", "web", `${incoming.deals.length} deals`);
    res.json({ ok: true, updatedAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Ошибка сохранения" });
  }
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

async function start() {
  await initDb();
  await seedIfEmpty();
  app.listen(PORT, () => {
    console.log(`ITMen Pipeline → http://localhost:${PORT}`);
  });
}

start().catch(e => {
  console.error("Failed to start:", e);
  process.exit(1);
});
