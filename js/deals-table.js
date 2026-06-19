/* Таблица сделок: сортировка и фильтрация по столбцам */
const DEALS_TABLE_COLS = [
  { key: "id", label: "ID", get: d => d.id },
  { key: "customer", label: "Клиент", get: d => d.customer },
  { key: "stage", label: "Стадия", get: d => d.stage },
  { key: "owner", label: "Владелец", get: d => d.owner },
  { key: "industry", label: "Отрасль", get: d => d.industry },
  { key: "amount", label: "Ожид. сумма", get: d => d.amount, num: true },
  { key: "weighted", label: "Взвеш.", get: d => d.weighted, num: true },
  { key: "expectedBudget", label: "Ожид. бюджет", get: d => d.expectedBudget, num: true },
  { key: "partner", label: "Партнёр", get: d => d.partner },
  { key: "budgetPeriod", label: "Период", get: d => d.budgetPeriod },
  { key: "budgetStatus", label: "Статус бюджета", get: d => d.budgetStatus },
  { key: "projectPct", label: "% проект", get: d => d.projectCompliancePct, num: true },
  { key: "pilotPct", label: "% пилот", get: d => d.pilotCompliancePct, num: true },
  { key: "score", label: "Балл", get: d => d.score, num: true },
  { key: "category", label: "Категория", get: d => d.category },
  { key: "commit", label: "Коммит", get: d => d.commitLabel },
  { key: "quality", label: "Качество", get: d => d.quality },
  { key: "risk", label: "Риск", get: d => d.riskFlag },
  { key: "taskDue", label: "Задача до", get: d => d.taskDue },
  { key: "daysTo", label: "Дней", get: d => d.daysTo, num: true },
];

let dealsTableSort = { key: "amount", dir: "desc" };
let dealsTableFilters = {};
let dealsTableBound = false;

function dealCellText(col, d) {
  const v = col.get(d);
  if (v == null || v === "") return "";
  return String(v);
}

function applyDealsTableFilters(deals) {
  const cat = document.getElementById("deal-filter")?.value;
  const q = document.getElementById("deal-quality-filter")?.value;
  let rows = deals;
  if (cat) rows = rows.filter(d => d.category === cat);
  if (q === "incomplete") rows = rows.filter(d => d.quality === "Неполный");
  if (q === "risk") rows = rows.filter(d => d.riskFlag);

  const filters = { ...dealsTableFilters };
  Object.keys(filters).forEach(k => {
    const qf = (filters[k] || "").trim().toLowerCase();
    if (!qf) return;
    const col = DEALS_TABLE_COLS.find(c => c.key === k);
    if (!col) return;
    rows = rows.filter(d => dealCellText(col, d).toLowerCase().includes(qf));
  });
  return rows;
}

function sortDealsTableRows(deals) {
  const col = DEALS_TABLE_COLS.find(c => c.key === dealsTableSort.key) || DEALS_TABLE_COLS[0];
  const dir = dealsTableSort.dir === "asc" ? 1 : -1;
  return [...deals].sort((a, b) => {
    const av = col.get(a);
    const bv = col.get(b);
    if (col.num) {
      const an = av == null || av === "" ? -Infinity : +av;
      const bn = bv == null || bv === "" ? -Infinity : +bv;
      return (an - bn) * dir;
    }
    const as = dealCellText(col, a).toLowerCase();
    const bs = dealCellText(col, b).toLowerCase();
    return as.localeCompare(bs, "ru") * dir;
  });
}

function renderDealsTableRow(d) {
  const realIdx = state.deals.findIndex(x => x.id === d.id);
  const cls = d.quality === "Неполный" ? "row-incomplete" : d.riskFlag ? "row-risk" : "";
  const disc = d.clientDiscount ? `<br><small>−${d.clientDiscount}% клиенту</small>` : "";
  return `<tr class="${cls}" data-id="${escapeHtml(d.id)}">
    <td>${escapeHtml(d.id)}</td>
    <td><strong>${escapeHtml(d.customer)}</strong></td>
    <td><small>${escapeHtml(d.stage)}</small></td>
    <td>${escapeHtml(d.owner)}</td>
    <td><small>${escapeHtml(d.industry || "—")}</small></td>
    <td class="num">${formatMoney(d.amount)}</td>
    <td class="num"><small>${formatMoney(d.weighted)}</small></td>
    <td class="num">${formatMoney(d.expectedBudget || 0)}</td>
    <td>${escapeHtml(d.partner || "—")}${d.partnerDiscount ? `<br><small>${d.partnerDiscount}%</small>` : ""}</td>
    <td>${escapeHtml(d.budgetPeriod || "—")}${disc}</td>
    <td><small>${escapeHtml(d.budgetStatus || "—")}</small></td>
    <td class="num">${d.projectCompliancePct != null ? d.projectCompliancePct + "%" : "—"}</td>
    <td class="num">${d.pilotCompliancePct != null ? d.pilotCompliancePct + "%" : "—"}</td>
    <td class="num">${d.score ?? "—"}</td>
    <td>${categoryBadge(d.category)}</td>
    <td>${escapeHtml(d.commitLabel)}</td>
    <td>${d.quality === "Неполный" ? '<span class="badge badge-warn">Неполный</span>' : '<span class="badge badge-ok">OK</span>'}</td>
    <td>${d.riskFlag ? `<span class="badge badge-danger">${escapeHtml(d.riskFlag)}</span>` : "—"}</td>
    <td>${escapeHtml(d.taskDue)}${d.daysTo != null ? `<br><small>${d.daysTo} дн.</small>` : ""}</td>
    <td class="actions">
      <button class="btn btn-sm" onclick="openDealModal(${realIdx})">✏️</button>
      <button class="btn btn-sm btn-danger" onclick="deleteDeal(${realIdx})">🗑</button>
    </td>
  </tr>`;
}

function updateDealsTableBody(deals) {
  const tbody = document.getElementById("deals-tbody");
  const meta = document.getElementById("deals-table-meta");
  if (!tbody) return;
  const filtered = sortDealsTableRows(applyDealsTableFilters(deals));
  tbody.innerHTML = filtered.map(renderDealsTableRow).join("");
  if (meta) meta.textContent = `Показано ${filtered.length} из ${deals.length}`;
}

function bindDealsTableEvents() {
  if (dealsTableBound) return;
  dealsTableBound = true;
  document.getElementById("page-deals")?.addEventListener("click", e => {
    const th = e.target.closest("th[data-sort]");
    if (!th) return;
    const key = th.dataset.sort;
    if (dealsTableSort.key === key) {
      dealsTableSort.dir = dealsTableSort.dir === "asc" ? "desc" : "asc";
    } else {
      dealsTableSort = { key, dir: "asc" };
    }
    document.querySelectorAll("#deals-table th[data-sort]").forEach(el => {
      el.classList.toggle("sorted-asc", el.dataset.sort === dealsTableSort.key && dealsTableSort.dir === "asc");
      el.classList.toggle("sorted-desc", el.dataset.sort === dealsTableSort.key && dealsTableSort.dir === "desc");
    });
    updateDealsTableBody(getMetrics().deals);
  });
  document.getElementById("page-deals")?.addEventListener("input", e => {
    if (!e.target.classList.contains("deals-col-filter")) return;
    dealsTableFilters[e.target.dataset.col] = e.target.value;
    updateDealsTableBody(getMetrics().deals);
  });
  document.getElementById("page-deals")?.addEventListener("change", e => {
    if (e.target.id === "deal-filter" || e.target.id === "deal-quality-filter") {
      updateDealsTableBody(getMetrics().deals);
    }
  });
}

function renderDealsTable(deals) {
  const el = document.getElementById("page-deals");
  if (!el) return;
  dealsTableBound = false;
  const sortMark = key => {
    if (dealsTableSort.key !== key) return "";
    return dealsTableSort.dir === "asc" ? " ▲" : " ▼";
  };
  el.innerHTML = `
    <div class="deals-toolbar">
      <button class="btn btn-primary" onclick="openDealModal()">+ Добавить сделку</button>
      <label class="btn" style="cursor:pointer">⬆️ Импорт Excel<input type="file" id="btn-import-excel" accept=".xlsx,.xls" hidden></label>
      <a class="btn" href="${window.ITMEN_API?.enabled ? "/api/export/template" : "ITMen_Pipeline_Шаблон_менеджеров.xlsx"}" ${window.ITMEN_API?.enabled ? "" : "download"}>⬇️ Шаблон Excel</a>
      <select id="deal-filter" class="btn" style="width:auto">
        <option value="">Все категории</option>
        <option value="Горячая">Горячая</option>
        <option value="Тёплая">Тёплая</option>
        <option value="Наблюдение">Наблюдение</option>
      </select>
      <select id="deal-quality-filter" class="btn" style="width:auto">
        <option value="">Все</option>
        <option value="incomplete">Только неполные</option>
        <option value="risk">С флагом риска</option>
      </select>
      <button class="btn" type="button" id="deals-clear-filters">✕ Сбросить фильтры столбцов</button>
      <span class="deals-table-meta" id="deals-table-meta"></span>
    </div>
    <div class="deals-table-shell">
      <div class="deals-table-scroll">
        <table class="deals-table" id="deals-table">
          <thead>
            <tr>${DEALS_TABLE_COLS.map(c =>
              `<th data-sort="${c.key}" class="sortable" title="Сортировка">${escapeHtml(c.label)}${sortMark(c.key)}</th>`
            ).join("")}<th class="sticky-actions"> </th></tr>
            <tr class="filter-row">${DEALS_TABLE_COLS.map(c =>
              `<th><input type="search" class="deals-col-filter" data-col="${c.key}" placeholder="Фильтр…" value="${escapeHtml(dealsTableFilters[c.key] || "")}"></th>`
            ).join("")}<th></th></tr>
          </thead>
          <tbody id="deals-tbody"></tbody>
        </table>
      </div>
    </div>`;

  document.getElementById("deals-clear-filters")?.addEventListener("click", () => {
    dealsTableFilters = {};
    document.querySelectorAll(".deals-col-filter").forEach(inp => { inp.value = ""; });
    updateDealsTableBody(deals);
  });
  document.getElementById("btn-import-excel")?.addEventListener("change", e => {
    const f = e.target.files[0];
    if (f) importExcelFile(f);
    e.target.value = "";
  });

  bindDealsTableEvents();
  updateDealsTableBody(deals);
}
