import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getActivities } from "../api/activities";
import ActivityColumn from "../components/ActivityColumn";
import { getPriorityBadge, formatDate } from "../utils/activityUtils";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

export default function Hoy() {
  const [activities, setActivities] = useState([]);
  const { token } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const mainActivities = activities.filter((a)=> a.parent === null)
  
  useEffect(() => {
    if (!token) {
      setActivities([]);
      return;
    }

    getActivities()
      .then(data => {
        setActivities(data);
      })
      .catch(err => console.error(err));
  }, [token]);

  const paraHoy = mainActivities
    .filter((a) => a.due_date?.split("T")[0] === today)
    .sort((a, b) => a.duracionMin - b.duracionMin);

  const proximas = mainActivities
    .filter((a) => a.due_date?.split("T")[0] > today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.duracionMin - b.duracionMin);

  const vencidas = mainActivities
    .filter((a) => a.due_date?.split("T")[0] < today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.duracionMin - b.duracionMin);

  async function deleteActivity(id, title) {

  const result = await Swal.fire({
    icon: "warning",
    title: "¿Eliminar actividad?",
    html: `
      <strong>${title}</strong><br><br>
      Esta acción eliminará la actividad permanentemente
      y no se puede deshacer.
    `,
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33"
  })

  if (!result.isConfirmed) return

  try {

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${id}/`, {
      method: "DELETE",
      headers: {
        "Authorization": `Token ${localStorage.getItem("token")}`
      }
    })

    if(!res.ok) throw new Error()

      setActivities(prev => prev.filter(a => a.id !== id))

      Swal.fire({
        icon: "success",
        title: "Actividad eliminada",
        text: `"${title}" fue eliminada correctamente`,
        timer: 2000,
        showConfirmButton: false
      })

  } catch {

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudo eliminar la actividad"
    })

  }
}

  return (
    <div>
      <div className="header-page row">
        <div className="col">
          <h2>Actividades de Hoy</h2>
          <p className="text-muted">Estas son las actividades que tienes programadas</p>
        </div>
        <div className="col-auto">
          <Link to="/crear" className="btn btn-primary text-decoration-none">+ Crear actividad</Link>
        </div>
      </div>
      
      <div className="row">
        <ActivityColumn
            title="Vencidas"
            subtitle="actividades"
            activities={vencidas}
            emptyText={
              <div className="text-center">
                <p>No hay actividades vencidas.</p>
              </div>
            }
            bg="bg-danger-subtle"
            border="border-danger-subtle"
            deleteActivity={deleteActivity}
            getPriorityBadge={getPriorityBadge}
            formatDate={formatDate}
          />

          <ActivityColumn
            title="Hoy"
            subtitle="actividades"
            activities={paraHoy}
            emptyText={
              <div className="text-center">
                <p>No hay actividades para hoy.</p>
              </div>
            }
            bg="bg-primary-subtle"
            border="border-primary-subtle"
            deleteActivity={deleteActivity}
            getPriorityBadge={getPriorityBadge}
            formatDate={formatDate}
          />

          <ActivityColumn
            title="Próximas"
            subtitle="actividades"
            activities={proximas}
            emptyText={
              <div className="text-center">
                <p>No hay próximas actividades.</p>
              </div>
            }
            bg="bg-success-subtle"
            border="border-success-subtle"
            deleteActivity={deleteActivity}
            getPriorityBadge={getPriorityBadge}
            formatDate={formatDate}
          />
      </div>

      <div className="text-center mt-4">
        <span>¿Cómo se organiza esto?</span>
        <i 
          className="bi bi-info-circle text-muted ms-2" 
          data-bs-toggle="tooltip" 
          data-bs-placement="top" 
          title="Las actividades se organizan primero por fecha (más antiguas arriba), luego por tiempo estimado (menor tiempo primero)."
        ></i>
      </div>
    </div>
  );
}
