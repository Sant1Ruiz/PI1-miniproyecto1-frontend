import { createContext, useCallback, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback((token, user) => {
    localStorage.setItem("token", token)
    setToken(token)
    setUser(user)
  }, [])

  const updateUserContext = useCallback((newUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...newUserData
    }))
  }, [])

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

  }, [token, logout])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}