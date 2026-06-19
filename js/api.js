/* API-клиент — синхронизация с сервером (без авторизации) */
window.ITMEN_API = {
  enabled: true,
  base: "",
};

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
  const { state } = await apiFetch("/api/pipeline");
  return state;
}

async function apiSavePipeline(state) {
  return apiFetch("/api/pipeline", {
    method: "PUT",
    body: JSON.stringify({ state }),
  });
}

async function apiListManagers() {
  return apiFetch("/api/managers");
}
