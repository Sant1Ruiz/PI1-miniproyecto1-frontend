import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    if (!token) {
      setLoading(false)
      return
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/auth/me/`, {
      headers: {
        Authorization: `Token ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setUser(data.data)
        } else {
          setUser(null)
          logout()
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false))

  }, [token])

  function login(token, user) {
    localStorage.setItem("token", token)
    setToken(token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
  }

  function updateUserContext(newUserData) {
    setUser(prevUser => ({
      ...prevUser,
      ...newUserData
    }))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}