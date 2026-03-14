import { apiGet, apiPost, unwrap } from "./client";
import { getToken } from "../api/auth";

const BASE_URL = import.meta.env.VITE_API_URL;

const API_URL = `${BASE_URL}/api/activities/`;

function getAuthHeaders(extraHeaders = {}) {
  const token = getToken();

  return {
    Authorization: `Token ${token}`,
    ...extraHeaders
  };
}

export async function getActivities() {
   const resp = await fetch(`${API_URL}`, {
    headers: getAuthHeaders()
  })
  const data = await resp.json()
  return data.data ?? data
}

export async function createActivity(payload) {
  const res = await fetch(`${API_URL}`,{
    method: "POST",
    headers: getAuthHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  return data.data ?? data
}

export async function getSubtasks(id) {
  const res = await fetch(`${API_URL}${id}/subtasks/`,{
    headers: getAuthHeaders()
  })
  const data = await res.json()
  return data.data ?? data
}

export async function deleteActivity(id) {
  const res = await fetch(`${API_URL}${id}/`, {
    method: "DELETE",
    headers: getAuthHeaders()
  })

  if (!res.ok) {
    throw new Error("Error eliminando actividad")
  }

  return res
}

export async function getActivity(id) {

  const res = await fetch(`${API_URL}${id}/`, {
    headers: getAuthHeaders()
  })

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
    headers: getAuthHeaders({
      "Content-Type": "application/json"
    }),
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

export async function updateActivity(id, payload) {
  const res = await fetch(`${API_URL}${id}/`, {
    method: "PATCH",
    headers: getAuthHeaders({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    throw new Error("No se pudo actualizar la actividad")
  }

  const data = await res.json()
  return data.data ?? data
}

export async function getTimeToDate(payload) {
    const res = await fetch(`${API_URL}totalhours?date=${payload.date}`, {
    method: "GET",
    headers: getAuthHeaders({
      "Content-Type": "application/json"
    }),
  })

  if (!res.ok) {
    throw new Error("No se pudo obtener el tiempo total")
  }
  const data = await res.json()
  return data.data ?? data
}
