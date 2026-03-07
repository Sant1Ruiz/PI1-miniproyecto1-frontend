import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { registerRequest, loginRequest } from "../api/auth"
import { validateRegister } from "../utils/validators"
import { useAuth } from "../context/AuthContext"

export default function Register() {

  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const { login } = useAuth()

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState("")

  function handleChange(e) {

    const { name, value } = e.target

    setForm({
      ...form,
      [name]: value
    })
  }

  async function handleSubmit(e) {

    e.preventDefault()

    const validationErrors = validateRegister(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {

        await registerRequest({
            name: form.name,
            email: form.email,
            password: form.password
        })
        const loginData = await loginRequest(form.email, form.password)

        alert("Usuario creado correctamente")
        login(loginData.token, loginData.user.email)
        localStorage.setItem("token", loginData.token)
        navigate("/hoy")

    } catch (err) {

      if (err.email) {
        setErrors({ email: "Este email ya está registrado" })
      } else {
        setServerError("Error creando usuario")
        console.error("Registration error: ", err)
      }

    }

  }

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>

      <h3 className="mb-4 text-center">Registro</h3>

      <form onSubmit={handleSubmit}>

        <div className="mb-3">
          <label>Nombre</label>
          <input
            className="form-control"
            name="name"
            value={form.name}
            onChange={handleChange}
          />
          {errors.name && <div className="text-danger">{errors.name}</div>}
        </div>

        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <div className="text-danger">{errors.email}</div>}
        </div>

        <div className="mb-3">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control"
            name="password"
            value={form.password}
            onChange={handleChange}
          />
          {errors.password && <div className="text-danger">{errors.password}</div>}
        </div>

        <div className="mb-3">
          <label>Confirmar contraseña</label>
          <input
            type="password"
            className="form-control"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
          />
          {errors.confirmPassword && (
            <div className="text-danger">{errors.confirmPassword}</div>
          )}
        </div>

        {serverError && (
          <div className="alert alert-danger">
            {serverError}
          </div>
        )}

        <button 
            className="btn btn-dark w-100" 
            type="submit"
        >
          Crear cuenta
        </button>

      </form>

    </div>
  )
}