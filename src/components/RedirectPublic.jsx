import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function RedirectPublic({ children }) {

  const { token } = useAuth()

  if (token) {
    return <Navigate to="/" />
  }

  return children
}