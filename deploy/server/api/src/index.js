/**
 * Заглушка API-слоя. После миграции схемы PB:
 * - PATCH /api/deals/:id
 * - GET  /api/pipeline
 * - dataEpoch / optimistic locking
 */
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3010;
const PB_URL = process.env.PB_URL || "http://127.0.0.1:8095";

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "itmen-pipeline-api",
    pocketbase: PB_URL,
    ts: new Date().toISOString(),
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`ITMen API stub → http://127.0.0.1:${PORT}`);
});
