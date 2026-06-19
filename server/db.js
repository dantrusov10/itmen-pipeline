const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STATE_PATH = path.join(DATA_DIR, "pipeline.json");
const AUDIT_PATH = path.join(DATA_DIR, "audit.log.jsonl");
const MONGODB_URI = process.env.MONGODB_URI;
const DOC_ID = "main";

let mongoDb = null;
let mongoClient = null;

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function initDb() {
  if (!MONGODB_URI) {
    console.log("Storage: local file (data/pipeline.json)");
    return "file";
  }
  const { MongoClient } = require("mongodb");
  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  mongoDb = mongoClient.db("itmen_pipeline");
  console.log("Storage: MongoDB Atlas");
  return "mongo";
}

async function loadState() {
  if (mongoDb) {
    const doc = await mongoDb.collection("state").findOne({ _id: DOC_ID });
    return doc?.data || null;
  }
  ensureDir();
  if (!fs.existsSync(STATE_PATH)) return null;
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
}

async function saveState(state, updatedBy) {
  const now = new Date().toISOString();
  const payload = { ...state, _savedAt: now, _savedBy: updatedBy || null };

  if (mongoDb) {
    await mongoDb.collection("state").updateOne(
      { _id: DOC_ID },
      { $set: { data: payload, updatedAt: now } },
      { upsert: true }
    );
    return now;
  }

  ensureDir();
  fs.writeFileSync(STATE_PATH, JSON.stringify(payload, null, 2), "utf8");
  return now;
}

async function logAudit(action, userName, detail) {
  const entry = { action, user: userName, detail, at: new Date().toISOString() };

  if (mongoDb) {
    await mongoDb.collection("audit").insertOne(entry);
    return;
  }

  ensureDir();
  fs.appendFileSync(AUDIT_PATH, JSON.stringify(entry) + "\n", "utf8");
}

module.exports = { initDb, loadState, saveState, logAudit, STATE_PATH };
