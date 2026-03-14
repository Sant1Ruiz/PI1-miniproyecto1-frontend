import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { createActivity } from "../api/activities";
import { validateActivityForm } from "../utils/validators";
import Swal from "sweetalert2";

export default function Crear() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [durationHours, setDurationHours] = useState("")
  const [priority, setPriority] = useState("1")
  const [errors, setErrors] = useState({})
  const [priorityMssg, setPriorityMsg] = useState("")
  const [alert, setAlert] = useState({
    type: "primary",
    icon: "bi-info-circle",
    message: "Completa todos los campos requeridos para crear una nueva actividad."
  })
  const today = new Date().toISOString().split("T")[0]
  const isToday = date === today

  useEffect(() => {
    if (isToday) {
      setPriorityMsg("Como la fecha límite es hoy, la prioridad se establecerá automáticamente en 'Alta'.")
      setPriority("3")
    } else {
      setPriorityMsg("")
      setPriority("1")
    }
  }, [date])
  const navigate = useNavigate()

  function getPriorityId() {
    const today = new Date().toISOString().slice(0,10)

    if (date === today) {
      return 3 // alta
    }
    return Number(priority)
  }

  function validateForm() {

    const newErrors = validateActivityForm({
      title,
      description,
      date,
      durationHours
    })

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  async function onSubmit(e){
    e.preventDefault()

    const payload = {
      user: 1,
      parent: null,
      parent_title: null,
      title: title,
      description: description,
      priority_id: getPriorityId(),
      status_id: 1,
      due_date: `${date}T00:00:00Z`
    }

    if(!validateForm()) return
      try {
        const activity = await createActivity(payload)

        setAlert({
          type: "success",
          icon: "bi-check-circle",
          message: "¡Actividad creada exitosamente! Redirigiendo..."
        })

        Swal.fire({
          icon:"success",
          title:"Actividad creada",
          timer:1500,
          showConfirmButton:false
        })

        setTimeout(()=>{
          navigate(`/actividad/${activity.id}`)
        },2500)

      }catch(err){
        console.error(err)

        setAlert({
          type: "danger",
          icon: "bi-x-circle",
          message: "Hubo un error al crear la actividad"
        })

        Swal.fire({
          icon:"error",
          title:"Error",
          text:"No se pudo crear la actividad"
        })
      }
    }

  return (
      <div className="row">
        <div className="col-xl-6 mx-auto">
          <div className="card border border-secondary-subtle">
            <div className="text-center">
              <h2>Crear actividad</h2>
              <p className="text-muted">Completa los campos para crear una nueva actividad.</p>
            </div>
            
            <div className={`alert alert-${alert.type} p-2`}>
              <i className={`bi ${alert.icon} me-2`}></i>
              {alert.message}
            </div>
            <form className="needs-validation" onSubmit={onSubmit} method="POST" noValidate>
              <div className="mb-3">
                <label htmlFor="activitieTitle" className="form-label">Título <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className={`form-control ${errors.title ? "is-invalid" : ""}`}
                  id="activitieTitle" 
                  placeholder="Ej: Completar informe del proyecto" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  name="title" maxLength={100}
                />
                {errors.title && (
                  <div className="invalid-feedback bg-danger-subtle p-2 rounded">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    {errors.title}
                  </div>
                )}
                <div className="text-start small text-muted">
                  {title.length}/100 caracteres
                </div>
                
              </div>
              <div className="mb-3">
                <label htmlFor="activitieDescription" className="form-label">Descripción <span className="text-danger">*</span></label>
                <textarea 
                  className={`form-control ${errors.description ? "is-invalid" : ""}`} 
                  id="activitieDescription" 
                  placeholder="Describe los detalles de la tarea" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  name="description" 
                  maxLength={500}>
                </textarea>
                {errors.description && (
                  <div className="invalid-feedback bg-danger-subtle p-2 rounded">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    {errors.description}
                  </div>
                )}
                <div className="text-start small text-muted">
                  {description.length}/500 caracteres
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="activitieDate" className="form-label">Fecha límite <span className="text-danger">*</span></label>
                <input 
                  type="date" 
                  className={`form-control ${errors.date ? "is-invalid" : ""}`}
                  id="activitieDate" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  name="date"
                />
                {errors.date && (
                  <div className="invalid-feedback bg-danger-subtle p-2 rounded">
                    <i class="bi bi-exclamation-circle me-2"></i>
                    {errors.date}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="activitieStatus" className="form-label">Prioridad <span className="text-danger">*</span></label>
                {priorityMssg &&(
                  <div className="alert alert-warning p-2 small">
                    <i className="bi bi-info-circle me-2"></i>
                      {priorityMssg}
                  </div>
                )}
                <select 
                  className="form-control" 
                  id="activitieStatus" 
                  value={priority} 
                  onChange={(e) => setPriority(e.target.value)} 
                  name="status"
                  disabled={isToday}
                >
                  <option value="1">Baja</option>
                  <option value="2">Media</option>
                  <option value="3">Alta</option>
                </select>
              </div>

              <div className="row g-2">
                <div className="col">
                  <Link to="/hoy" className="btn btn-outline-secondary w-100 text-decoration-none">
                    Cancelar
                  </Link>
                </div>
                <div className="col text-end">
                  <button type="submit" className="btn btn-primary w-100">
                    Crear Actividad
                  </button>
                </div>
              </div>              
            </form>
          </div>
        </div>
      </div>
  );
}