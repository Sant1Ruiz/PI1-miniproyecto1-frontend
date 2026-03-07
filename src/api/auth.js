const BASE_URL = import.meta.env.VITE_API_URL;
const API = `${BASE_URL}/api/auth/`;

export function getToken() {
  return localStorage.getItem("token")
}

export async function loginRequest(email, password) {

  const res = await fetch(`${API}login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  })

  const data = await res.json()

  if (!res.ok) {
    throw data
  }

  return data.data
}

export async function logoutRequest(token) {

  const res = await fetch(`${API}logout/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`
    }
  })

  if (!res.ok) {
    throw new Error("Error cerrando sesión")
  }

  return true
}

export async function registerRequest(payload) {

  const res = await fetch(`${API}register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  const data = await res.json()

  if (!res.ok) {
    throw data
  }

  return data
}