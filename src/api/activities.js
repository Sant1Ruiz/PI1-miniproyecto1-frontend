import { apiGet, apiPost, unwrap } from "./client";
const BASE_URL = import.meta.env.VITE_API_URL;

const API_URL = `${BASE_URL}/api/activities/`;

export async function getActivities() {
  const resp = await apiGet("/api/activities/");
  return unwrap(resp) ?? [];
}

export async function createActivity(payload) {
  const resp = await apiPost("/api/activities/", payload);
  return unwrap(resp);
}

export async function getSubtasks(id) {
  const res = await fetch(`${API_URL}${id}/subtasks/`)
  const data = await res.json()
  return data.data ?? data
}

export async function deleteActivity(id) {
  const res = await fetch(`${API_URL}${id}/subtasks/`, {
    method: "DELETE"
  })

  if (!res.ok) {
    throw new Error("Error eliminando actividad")
  }

  return true
}

export async function getActivity(id) {
  const res = await fetch(`${API_URL}${id}/`)

  if (!res.ok) {
    throw new Error("No se pudo obtener la actividad")
  }

  const data = await res.json()
  return data.data ?? data
}

export async function toggleCompleteActivity(activity) {

  const newStatus = activity.status_id === 3 ? 1 : 3

  const res = await fetch(`${API_URL}${activity.id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status_id: newStatus
    })
  })

  if (!res.ok) {
    throw new Error("Error cambiando estado")
  }

  const data = await res.json()
  return data.data ?? data
}

export async function createSubActivity(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    throw new Error("No se pudo crear la subtarea")
  }

  const data = await res.json()
  return data.data ?? data
}