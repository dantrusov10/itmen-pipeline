const fs = require("fs");
const path = require("path");
const { loadState, saveState } = require("./db");

function readInitialState() {
  const p = path.join(__dirname, "..", "js", "initial-data.js");
  const raw = fs.readFileSync(p, "utf8");
  const m = raw.match(/window\.ITMEN_INITIAL\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!m) throw new Error("Cannot parse initial-data.js");
  return JSON.parse(m[1]);
}

async function seedIfEmpty() {
  if (await loadState()) {
    console.log("DB already has data — skip seed");
    return;
  }
  const state = readInitialState();
  await saveState(state, "seed");
  console.log("Seeded", state.deals?.length || 0, "deals");
}

if (require.main === module) {
  const { initDb } = require("./db");
  initDb()
    .then(() => seedIfEmpty())
    .catch(e => { console.error(e); process.exit(1); });
}

module.exports = { seedIfEmpty, readInitialState };
