/**
 * ITMen Pipeline — Google Apps Script API
 * Хранит JSON пайплайна в скрытом листе _pipeline (чанками по 40k символов).
 *
 * Деплой: Развернуть → Веб-приложение → доступ «Все, в том числе анонимные».
 */

var STATE_SHEET = '_pipeline';
var CHUNK_SIZE = 40000;

var MANAGERS = [
  { id: 'merlein', name: 'Аркадий Мерлейн', sheet: 'Мерлейн' },
  { id: 'akhmetshin', name: 'Арслан Ахметшин', sheet: 'Ахметшин' },
  { id: 'sirotkin', name: 'Александр Сироткин', sheet: 'Сироткин' },
  { id: 'kulagin', name: 'Алексей Кулагин', sheet: 'Кулагин' }
];

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'get';
  try {
    if (action === 'health') return json_({ ok: true, ts: new Date().toISOString() });
    if (action === 'get' || action === 'pipeline') return json_({ state: loadState_() });
    if (action === 'managers') return json_(MANAGERS);
    return json_({ error: 'Unknown action: ' + action });
  } catch (err) {
    return json_({ error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === 'save') {
      if (!body.state || !Array.isArray(body.state.deals)) {
        return json_({ error: 'Некорректное тело запроса' });
      }
      var updatedAt = saveState_(body.state);
      return json_({ ok: true, updatedAt: updatedAt });
    }
    return json_({ error: 'Unknown action' });
  } catch (err) {
    return json_({ error: String(err.message || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getStateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(STATE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(STATE_SHEET);
    sh.hideSheet();
  }
  return sh;
}

function loadState_() {
  var sh = getStateSheet_();
  var lastRow = sh.getLastRow();
  if (lastRow < 1) return null;
  var rows = sh.getRange(1, 1, lastRow, 1).getValues();
  var jsonStr = rows.map(function (r) { return r[0]; }).join('');
  if (!jsonStr) return null;
  return JSON.parse(jsonStr);
}

function saveState_(state) {
  var sh = getStateSheet_();
  var payload = JSON.parse(JSON.stringify(state));
  payload._savedAt = new Date().toISOString();
  payload._savedBy = 'web';
  var jsonStr = JSON.stringify(payload);
  var chunks = [];
  for (var i = 0; i < jsonStr.length; i += CHUNK_SIZE) {
    chunks.push([jsonStr.substring(i, i + CHUNK_SIZE)]);
  }
  if (chunks.length === 0) chunks.push(['']);
  sh.clear();
  sh.getRange(1, 1, chunks.length, 1).setValues(chunks);
  return payload._savedAt;
}

/** Запустите один раз из редактора Apps Script для инициализации */
function setup() {
  getStateSheet_();
  Logger.log('Лист _pipeline готов. Теперь: Развернуть → Веб-приложение.');
}
