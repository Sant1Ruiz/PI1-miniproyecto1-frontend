import { apiGet, apiPost, unwrap } from "./client";

export async function getActivities() {
  const resp = await apiGet("/api/activities/");
  return unwrap(resp) ?? [];
}

export async function getActivity(id) {
  const resp = await apiGet(`/api/activities/${id}/`);
  const data = unwrap(resp);
  // algunos back devuelven objeto directo en data, no lista
  return Array.isArray(data) ? data[0] : data;
}

export async function createActivity(payload) {
  const resp = await apiPost("/api/activities/", payload);
  return unwrap(resp);
}