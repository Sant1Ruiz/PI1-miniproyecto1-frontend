import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { loginRequest } from "../api/auth"
import { useAuth } from "../context/AuthContext"
import { Link } from "react-router-dom"

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
    <div className="container mt-5 border border-secundary-subtle rounded p-4 " style={{maxWidth:"400px"}}>

      <h3 className="mb-4 text-center">Iniciar sesión</h3>

      <form onSubmit={handleSubmit}>

        <div className="mb-3">
          <label className="fw-bold" htmlFor="user">Nombre de usuario</label>
          <div class="mb-3 position-relative">
            <i class="bi bi-person input-icon"></i>
            <input 
              id="user"
              type="email" 
              className="form-control ps-5" 
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="fw-bold" htmlFor="password">Contraseña</label>
          <div class="mb-3 position-relative">
            <i class="bi bi-lock input-icon"></i>
            <input 
              id="password"
              type="password" 
              className="form-control ps-5"
              value={password}
              placeholder="Contraseña"
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <button className="btn btn-primary w-100">
          Iniciar sesión
        </button>

      </form>
      <div className="text-center mt-3 small">
        <span className="text-muted">¿No tienes una cuenta?</span>
        <Link to="/register" className="text-primary ms-2 text-decoration-none">Regístrate aquí</Link>
      </div>
    </div>
  )
}