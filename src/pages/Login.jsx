import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { loginRequest } from "../api/auth"
import { useAuth } from "../context/AuthContext"

export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const navigate = useNavigate()
  const { login } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()

    try {

        const res = await loginRequest(email, password)
        console.log(res.token, res.user)
        login(res.token, res.user.email)
        localStorage.setItem("token", res.token)
        navigate("/hoy")

    } catch (err){
      setError("Email o contraseña incorrectos")
      console.log("Login error: ",err)
    }
  }

  return (
    <div className="container mt-5" style={{maxWidth:"400px"}}>

      <h3 className="mb-4 text-center">Iniciar sesión</h3>

      <form onSubmit={handleSubmit}>

        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <button className="btn btn-dark w-100">
          Login
        </button>

      </form>

    </div>
  )
}