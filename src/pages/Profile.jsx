import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { updateProfileRequest } from "../api/auth"

function Profile() {
  const { user, token, updateUserContext } = useAuth()
  
  const [name, setName] = useState("")
  const [maxHorasDay, setMaxHorasDay] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setMaxHorasDay(user.max_horas_day || 6)
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const payload = {
        name,
        max_horas_day: parseInt(maxHorasDay, 10)
      }

      const response = await updateProfileRequest(token, payload)
      
      if (response.success) {
        updateUserContext(response.data)
        setMessage({ type: "success", text: "¡Perfil actualizado con éxito!" })
      }
    } catch (error) {
      setMessage({ 
        type: "danger", 
        text: error?.error?.message || "Ocurrió un error al actualizar el perfil" 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6 mt-5 pt-3">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Mi Perfil</h4>
            </div>
            <div className="card-body">
              {message.text && (
                <div className={`alert alert-${message.type}`} role="alert">
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label text-muted">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={user?.email || ""}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="name" className="form-label fw-bold">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="maxHoras" className="form-label fw-bold">Tiempo Máximo Diario (Horas)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="maxHoras"
                    value={maxHorasDay}
                    onChange={(e) => setMaxHorasDay(e.target.value)}
                    min="1"
                    max="24"
                    required
                  />
                  <div className="form-text">
                    Límite máximo de horas por día permitidas para planificar actividades.
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </span>
                  ) : "Guardar Cambios"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
