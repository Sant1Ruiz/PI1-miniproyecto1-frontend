import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import { registerRequest, loginRequest } from "../api/auth"
import { validateRegister } from "../utils/validators"
import { useAuth } from "../context/AuthContext"
import Swal from "sweetalert2"

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
  const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e) => {
    setForm({
        ...form,
        [e.target.id]: e.target.value
    });
    };

  async function handleSubmit(e) {

    e.preventDefault()

    const validationErrors = validateRegister(form)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)

    try {

        await registerRequest({
            name: form.name,
            email: form.email,
            password: form.password,
            confirm_password: form.confirmPassword
        })
        const loginData = await loginRequest(form.email, form.password)

        await Swal.fire({
            icon: "success",
            title: "Cuenta creada",
            text: "Tu usuario fue creado correctamente"
        })
        login(loginData.token, loginData.user.email)
        localStorage.setItem("token", loginData.token)
        setIsLoading(false)
        navigate("/hoy")

    }catch (err) {

        setIsLoading(false)

        console.error("Registration error:", err)

        if (err?.errors) {
            console.error(err.errors)
            const backendErrors = {}

            Object.keys(err.errors).forEach((field) => {
            backendErrors[field] = err.errors[field][1]
            })

            setServerError(backendErrors[0])
            console.log("Backend validation errors1:", backendErrors)
        } else if (err?.error?.errors) {
            console.error(err?.error?.errors)
            const backendErrors = {}

            Object.keys(err.error.errors).forEach((field) => {
            backendErrors[field] = err.error.errors[field]["message"]
            })

            setServerError(backendErrors[0])
            console.log("Backend validation errors2:", backendErrors[0])    

        } else {
            setServerError("Ocurrió un error inesperado")
        }
    }

  }

  return (
    <div className="container mt-5 border border-secundary-subtle rounded p-4" style={{ maxWidth: "400px" }}>

      <h3 className="mb-4 text-center">Registro</h3>

      <form onSubmit={handleSubmit}>

        <div className="mb-3">
          <label className="fw-bold" htmlFor="name">Nombre</label>
          <div className="mb-3 position-relative">
            <i className="bi bi-person input-icon"></i>
                <input 
                id="name"
                type="text" 
                className="form-control ps-5" 
                placeholder="Ingrese su nombre"
                value={form.name}
                onChange={handleChange}
                disabled={isLoading}
                />
            </div>
          {errors.name && <div className="text-danger">{errors.name}</div>}
        </div>

        <div className="mb-3">
          <label className="fw-bold" htmlFor="email">Email</label>
          <div className="mb-3 position-relative">
            <i className="bi bi-envelope input-icon"></i>
            <input
                id="email"
                type="email"
                className="form-control ps-5"
                placeholder="Ingrese su email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
            />
          </div>
          {errors.email && <div className="text-danger">{errors.email}</div>}
        </div>

        <div className="mb-3">
          <label className="fw-bold" htmlFor="password">Contraseña</label>
            <div className="mb-3 position-relative">
            <i className="bi bi-lock input-icon"></i>
            <input
                id="password"
                type="password"
                className="form-control ps-5"
                placeholder="Ingrese su contraseña"
                name="password"
                value={form.password}
                onChange={handleChange}
                disabled={isLoading}
            />
        </div>
          {errors.password && <div className="text-danger">{errors.password}</div>}
        </div>

        <div className="mb-3">
          <label className="fw-bold" htmlFor="confirmPassword">Confirmar contraseña</label>
            <div className="mb-3 position-relative">
            <i className="bi bi-lock input-icon"></i>
          <input
            id="confirmPassword"
            type="password"
            className="form-control ps-5"
            placeholder="Ingrese su contraseña nuevamente"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
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
            className="btn btn-primary w-100" 
            type="submit"
            disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Crear cuenta"}
        </button>

      </form>
      <div className="text-center mt-3 small">
        <span className="text-muted">Ya tienes una cuenta?</span>
        <Link to="/login" className="text-primary ms-2 text-decoration-none">Inicia sesión aquí</Link>
      </div>

    </div>
  )
}