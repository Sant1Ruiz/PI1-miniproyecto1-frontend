const BASE_URL = import.meta.env.VITE_API_URL;

export function unwrap(resp) {
  // Caso normal: { success, data, meta }
  if (resp && typeof resp === "object" && !Array.isArray(resp) && "data" in resp) {
    return resp.data;
  }
  // Caso raro: [ { success, data, meta } ]
  if (Array.isArray(resp) && resp[0] && typeof resp[0] === "object" && "data" in resp[0]) {
    return resp[0].data;
  }
  // Si viene directo (no envuelto)
  return resp;
}

export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.detail ?? `HTTP ${res.status}`);
  return json;
}

export async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.detail ?? `HTTP ${res.status}`);
  return json;
}