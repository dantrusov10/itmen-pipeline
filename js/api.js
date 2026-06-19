/* API-клиент: Google Apps Script (GitHub Pages) или локальный Express */
(function () {
  const gasUrl = window.ITMEN_GAS_CONFIG?.url || "";
  const hasGas = gasUrl && !gasUrl.includes("PASTE_YOUR");
  const onGhPages = /\.github\.io$/i.test(location.hostname);
  const onLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";

  let backend = "express";
  if (hasGas && (onGhPages || window.ITMEN_FORCE_GAS)) backend = "gas";
  else if (hasGas && !onLocal) backend = "gas";

  window.ITMEN_API = {
    enabled: backend !== "none",
    backend,
    gasUrl: hasGas ? gasUrl : "",
    base: "",
  };
})();

async function gasFetch(payload) {
  const url = window.ITMEN_API.gasUrl;
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    redirect: "follow",
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Некорректный ответ Apps Script");
  }
  if (data.error) throw new Error(data.error);
  return data;
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(window.ITMEN_API.base + path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function apiLoadPipeline() {
  if (window.ITMEN_API.backend === "gas") {
    const res = await fetch(`${window.ITMEN_API.gasUrl}?action=get`, { redirect: "follow" });
    const data = JSON.parse(await res.text());
    if (data.error) throw new Error(data.error);
    return data.state || null;
  }
  const { state } = await apiFetch("/api/pipeline");
  return state;
}

async function apiSavePipeline(state) {
  if (window.ITMEN_API.backend === "gas") {
    return gasFetch({ action: "save", state });
  }
  return apiFetch("/api/pipeline", {
    method: "PUT",
    body: JSON.stringify({ state }),
  });
}

async function apiListManagers() {
  if (window.ITMEN_API.backend === "gas") {
    const res = await fetch(`${window.ITMEN_API.gasUrl}?action=managers`, { redirect: "follow" });
    const data = JSON.parse(await res.text());
    if (data.error) throw new Error(data.error);
    return data;
  }
  return apiFetch("/api/managers");
}

function apiBackendLabel() {
  return window.ITMEN_API.backend === "gas" ? "Google Таблица" : "сервер";
}
