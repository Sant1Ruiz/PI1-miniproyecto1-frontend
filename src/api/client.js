const RAW_BASE_URL = import.meta.env.VITE_API_URL;

// normaliza: sin slash final
const BASE_URL = (RAW_BASE_URL ?? "").replace(/\/+$/, "");

export function unwrap(resp) {
  if (resp && typeof resp === "object" && !Array.isArray(resp) && "data" in resp) {
    return resp.data;
  }
  if (Array.isArray(resp) && resp[0] && typeof resp[0] === "object" && "data" in resp[0]) {
    return resp[0].data;
  }
  return resp;
}

export class ApiError extends Error {
  constructor(message, { status, detail, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.body = body;
  }
}

async function request(path, { method = "GET", body, headers = {}, credentials } = {}) {
  if (!BASE_URL) throw new Error("VITE_API_URL no está definida");

  const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const hasBody = body !== undefined && body !== null;
  const finalHeaders = {
    Accept: "application/json",
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
    // si NO usas cookies/sesión, deja esto en "omit"
    credentials: credentials ?? "omit",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.detail ?? json?.message ?? `HTTP ${res.status}`;
    throw new ApiError(msg, { status: res.status, detail: json?.detail, body: json });
  }

  return json;
}

export function apiGet(path, opts) {
  return request(path, { ...opts, method: "GET" });
}

export function apiPost(path, body, opts) {
  return request(path, { ...opts, method: "POST", body });
}

export async function apiPatch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      json?.detail ??
      json?.error?.errors?.[0]?.message ??   // <- tu back usa este formato
      json?.error?.message ??
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

export async function apiDelete(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });

  // muchas APIs devuelven 204 sin body
  if (res.status === 204) return null;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      json?.detail ??
      json?.error?.errors?.[0]?.message ??
      json?.error?.message ??
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}