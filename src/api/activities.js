
//Funciones para interactuar con el endpoint de actividades.

import { apiGet, apiPost, apiPatch, apiDelete, unwrap } from "./client";

export async function getActivities() {
  const resp = await apiGet("/api/activities/");
  return unwrap(resp) ?? [];
}

export async function getActivity(id) {
  const resp = await apiGet(`/api/activities/${id}/`);
  const data = unwrap(resp);
  return Array.isArray(data) ? data[0] : data;
}

export async function createActivity(payload) {
  const resp = await apiPost("/api/activities/", payload);
  return unwrap(resp);
}

export async function updateActivity(id, payload) {
  const resp = await apiPatch(`/api/activities/${id}/`, payload);
  return unwrap(resp);
}

export async function deleteActivity(id) {
  return apiDelete(`/api/activities/${id}/`);
}
export async function patchActivity(id, payload) {
  const resp = await apiPatch(`/api/activities/${id}/`, payload);
  return unwrap(resp);
}