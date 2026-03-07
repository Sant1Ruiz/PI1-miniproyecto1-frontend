import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPriorityBadge, formatDate, getStatusBadge } from "../utils/activityUtils";

import {
  getActivity,
  getSubtasks,
  deleteActivity,
  toggleCompleteActivity
} from "../api/activities"

export default function ActividadDetalle() {

  const { id } = useParams()
  const [actividad, setActividad] = useState(null)
  const [subtasks, setSubtasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      const act = await getActivity(id)
      const subs = await getSubtasks(id)

      setActividad(act)
      setSubtasks(subs)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  

  useEffect(() => {
    async function loadSubtasks() {
      try {
        const data = await getSubtasks(id)
        setSubtasks(data)
      } catch (err) {
        console.error(err)
      }
    }

    loadSubtasks()
  }, [id])

async function handleToggle(subtask) {

  try {
    const updated = await toggleCompleteActivity(subtask)

    setSubtasks(prev =>
      prev.map(s =>
        s.id === subtask.id ? { ...s, status_id: updated.status_id } : s
      )
    )

  } catch (err) {
    console.error(err)
  }
}

  async function handleDelete(id, title) {

  const result = await Swal.fire({
    icon: "warning",
    title: "¿Eliminar subtarea?",
    html: `
      <strong>${title}</strong><br><br>
      Esta acción eliminará la subtarea permanentemente.
    `,
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33"
  })

  if (!result.isConfirmed) return

  try {

    await deleteActivity(id)

    setSubtasks(prev => prev.filter(s => s.id !== id))

    Swal.fire({
      icon: "success",
      title: "Subtarea eliminada",
      timer: 2000,
      showConfirmButton: false
    })

  } catch {

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar la subtarea"
    })

  }
}

  if (loading) {
    return <div className="text-center mt-4">Cargando...</div>
  }

  if (!actividad) {
    return (
      <div>
        <h4>Actividad no encontrada</h4>
        <Link to="/hoy">Volver</Link>
      </div>
    )
  }

  return (
    <div className="container mt-4">

      <div className="d-flex align-items-center mb-3">
        <Link to="/hoy" className="me-2 text-dark">
          <i className="bi bi-chevron-left"></i>
        </Link>
        <h3 className="m-0">{actividad.title}</h3>
        <button className="btn btn-outline-dark btn-sm ms-3">
          <i class="bi bi-patch-check me-2"></i>
          Completar
        </button>
        <button className="btn btn-outline-dark btn-sm ms-auto">
          <i class="bi bi-arrow-repeat"></i>
        </button>
      </div>
      <p className="text-muted">
        {actividad.description || <i className="text-muted">Sin descripción</i>}
      </p>

      <div className="card p-3 mb-4">
        <h6 className="mb-3">Detalles de la Actividad</h6>
        
        <div className="row">
          <div className="col-md-4">
            <small className="text-muted">Prioridad</small>
            <div>
              <span className={`badge bg-${getPriorityBadge(actividad.priority_display)}`}>
                {actividad.priority_display}
              </span>
            </div>
          </div>

          <div className="col-md-4">
            <small className="text-muted">Fecha límite</small>
            <div>
              {formatDate(actividad.due_date)}
            </div>
          </div>

          <div className="col-md-4">
            <small className="text-muted">Estado</small>
            <div>
              <span className={`badge bg-${getStatusBadge(actividad.status_display)}`}>
                {actividad.status_display}
              </span>
            </div>
          </div>

        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Subtareas</h5>

        <button
          className="btn btn-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#modalSubtarea"
        >
          + Agregar Subtarea
        </button>
      </div>
      {subtasks.length === 0 ? (
    <p className="text-muted">
      No hay subtareas para esta actividad.  
      Si deseas crear una haz click en <b>Agregar subtarea</b>.
    </p>
  ) : (
    subtasks.map(sub => (

      <div key={sub.id} className="card mb-2 p-2">

        <div className="d-flex justify-content-between align-items-center">

          <div className="d-flex align-items-center gap-2">

            <input
              type="checkbox"
              checked={sub.status_id === 3}
              onChange={() => handleToggle(sub)}
            />

            <span className={sub.status_id === 3 ? "text-decoration-line-through" : ""}>
              {sub.title}
            </span>

          </div>

          <i
            className="bi bi-trash text-danger"
            role="button"
            onClick={() => handleDelete(sub.id, sub.title)}
          />

        </div>

      </div>

    ))
  )}

      
    </div>
  )
}