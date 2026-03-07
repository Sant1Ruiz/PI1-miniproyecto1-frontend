import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getActivities, deleteActivity } from "../api/activities";
import ActivityColumn from "../components/ActivityColumn";
import { getPriorityBadge, formatDate } from "../utils/activityUtils";
import Swal from "sweetalert2";

export default function Hoy() {
  const [activities, setActivities] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  
  useEffect(() => {
    getActivities()
      .then(data => {
        setActivities(data);
      })
      .catch(err => console.error(err));
  }, []);

  const paraHoy = activities.filter(
    (a) => a.due_date?.split("T")[0] === today
  );

  const proximas = activities
    .filter((a) => a.due_date?.split("T")[0] > today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const vencidas = activities
    .filter((a) => a.due_date?.split("T")[0] < today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  async function handleDeleteActivity(id, title) {

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

    const res = deleteActivity(id)

    if(!res.success) throw new Error()

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
          <h2>Actividades</h2>
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
            emptyText="No hay actividades vencidas."
            bg="bg-danger-subtle"
            border="border-danger-subtle"
            deleteActivity={handleDeleteActivity}
            getPriorityBadge={getPriorityBadge}
            formatDate={formatDate}
          />
          
        <ActivityColumn
            title="Para hoy"
            subtitle="actividades"
            activities={paraHoy}
            emptyText="No tienes actividades para hoy."
            bg="bg-primary-subtle"
            border="border-primary-subtle"
            deleteActivity={handleDeleteActivity}
            getPriorityBadge={getPriorityBadge}
            formatDate={formatDate}
          />

          <ActivityColumn
            title="Próximas"
            subtitle="actividades"
            activities={proximas}
            emptyText="No hay próximas actividades."
            bg="bg-success-subtle"
            border="border-success-subtle"
            deleteActivity={handleDeleteActivity}
            getPriorityBadge={getPriorityBadge}
            formatDate={formatDate}
          />

          
      </div>
    </div>
  );
}