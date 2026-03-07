import { apiGet, apiPost, unwrap } from "./client";
import { getToken } from "../api/auth";

const BASE_URL = import.meta.env.VITE_API_URL;

const API_URL = `${BASE_URL}/api/activities/`;
const token = localStorage.getItem("token")

export async function getActivities() {
   const resp = await fetch(`${API_URL}`, {
    headers: {
      "Authorization": `Token ${token}`
    }
  })
  const data = await resp.json()
  return data.data ?? data
}

export async function createActivity(payload) {
  const res = await fetch(`${API_URL}`,{
    method: "POST",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
  const data = await res.json()
  return data.data ?? data
}

export async function getSubtasks(id) {
  const res = await fetch(`${API_URL}${id}/subtasks/`,{
    headers: {
      Authorization: `Token ${token}`
    }
  })
  const data = await res.json()
  return data.data ?? data
}

export async function deleteActivity(id) {

  const res = await fetch(`${API_URL}${id}/`, {
    method: "DELETE",
    headers: {
      "Authorization": `Token ${token}`
    }
  })

  if (!res.ok) {
    throw new Error("Error eliminando actividad")
  }

  return res
}

export async function getActivity(id) {

  const res = await fetch(`${API_URL}${id}/`, {
    headers: {
      "Authorization": `Token ${token}`
    }
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
    headers: {
      "Authorization": `Token ${token}`,
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