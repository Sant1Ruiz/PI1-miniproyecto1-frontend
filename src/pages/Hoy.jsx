import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getActivities, deleteActivity as apiDeleteActivity, toggleCompleteActivity, updateActivity } from "../api/activities";
import { updateProfileRequest } from "../api/auth";
import ActivityColumn from "../components/ActivityColumn";
import TaskCard from "../components/TaskCard";
import { getPriorityBadge, getStatusBadge, formatDate } from "../utils/activityUtils";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { getTodayInColombia } from "../utils/dateUtils";

export default function Hoy() {
  const [activities, setActivities] = useState([]);
  const { token, user, updateUserContext } = useAuth();
  const today = getTodayInColombia();

  useEffect(() => {
    if (!token) { setActivities([]); return; }
    getActivities().then(setActivities).catch(console.error);
  }, [token]);

  const mainActivities = activities.filter(a => a.parent === null);
  const tasks = activities.filter(a => a.parent !== null);

  const vencidas = tasks
    .filter(t => t.due_date && t.due_date.split("T")[0] < today && t.status_id !== 3)
    .sort((a, b) =>
      a.due_date.localeCompare(b.due_date) ||
      (Number(a.duration) || 0) - (Number(b.duration) || 0)
    );

  const paraHoy = tasks
    .filter(t => t.due_date && t.due_date.split("T")[0] === today && t.status_id !== 3)
    .sort((a, b) => (Number(a.duration) || 0) - (Number(b.duration) || 0));

  const proximas = tasks
    .filter(t => t.due_date && t.due_date.split("T")[0] > today && t.status_id !== 3)
    .sort((a, b) =>
      a.due_date.localeCompare(b.due_date) ||
      (Number(a.duration) || 0) - (Number(b.duration) || 0)
    );

  const activeMainActivities = mainActivities.filter(a => a.status_id !== 3);

  function getActivityProgress(activityId) {
    const actTasks = tasks.filter(t => t.parent === activityId);
    const total = actTasks.length;
    if (total === 0) return { total: 0, completed: 0, percentage: 0 };
    const completed = actTasks.filter(t => t.status_id === 3).length;
    return { total, completed, percentage: Math.round((completed / total) * 100) };
  }

  async function handleToggle(task) {
    const isUncompleting = task.status_id === 3;

    if (isUncompleting && user) {
      const taskDate = task.due_date?.split("T")[0];
      if (taskDate) {
        const busyHours = activities
          .filter(a =>
            a.parent !== null &&
            a.id !== task.id &&
            a.status_id !== 3 &&
            a.due_date?.split("T")[0] === taskDate
          )
          .reduce((sum, a) => sum + (Number(a.duration) || 0), 0);

        const taskHours = Number(task.duration) || 0;
        const totalAfter = busyHours + taskHours;

        if (totalAfter > user.max_horas_day) {
          const remaining = Math.max(0, user.max_horas_day - busyHours);
          const canReduce = remaining > 0;
          const canIncrease = totalAfter <= 24;

          const result = await Swal.fire({
            icon: "warning",
            title: "Límite de horas diarias",
            html: `
              Desmarcar esta tarea añadiría <strong>${taskHours}h</strong> al día.<br>
              Total resultante: <strong>${totalAfter}h</strong> · Límite: <strong>${user.max_horas_day}h</strong>.<br><br>
              ${canReduce
                ? `Tiempo libre disponible: <strong>${remaining}h</strong>.`
                : '<span class="text-danger">No hay tiempo disponible para este día.</span>'}
            `,
            showConfirmButton: canReduce,
            confirmButtonText: `Reducir esta tarea a ${remaining}h`,
            showCancelButton: canIncrease,
            cancelButtonText: "Aumentar límite diario",
            showDenyButton: true,
            denyButtonText: "Cancelar",
          });

          if (result.isConfirmed && canReduce) {
            try {
              const updated = await updateActivity(task.id, { status_id: 1, duration: remaining });
              setActivities(prev =>
                prev.map(a =>
                  a.id === task.id
                    ? { ...a, status_id: 1, status_display: updated.status_display, duration: remaining }
                    : a
                )
              );
            } catch {
              Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar la tarea" });
            }
          } else if (result.dismiss === Swal.DismissReason.cancel && canIncrease) {
            const { value: newLimit } = await Swal.fire({
              title: "Aumentar límite diario",
              input: "number",
              inputLabel: `Nuevo límite de horas por día (mínimo ${totalAfter}h)`,
              inputValue: totalAfter,
              inputAttributes: { min: totalAfter, step: 0.5, max: 24 },
              showCancelButton: true,
              inputValidator: (value) => {
                if (!value || Number(value) < totalAfter) return `El límite debe ser al menos ${totalAfter}h`;
                if (Number(value) > 24) return "No puede superar las 24h";
              },
            });
            if (newLimit) {
              try {
                const tokenStr = localStorage.getItem("token");
                const updatedUser = await updateProfileRequest(tokenStr, { max_horas_day: Number(newLimit) });
                updateUserContext(updatedUser.data);
                const updated = await toggleCompleteActivity(task);
                setActivities(prev =>
                  prev.map(a =>
                    a.id === task.id ? { ...a, status_id: updated.status_id, status_display: updated.status_display } : a
                  )
                );
              } catch {
                Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar" });
              }
            }
          }
          return;
        }
      }
    }

    // Completar o desmarcar sin conflicto
    try {
      const updated = await toggleCompleteActivity(task);
      setActivities(prev =>
        prev.map(a => a.id === task.id ? { ...a, status_id: updated.status_id, status_display: updated.status_display } : a)
      );
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar la tarea" });
    }
  }

  async function handleDelete(id, title) {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar tarea?",
      html: `<strong>${title}</strong><br><br>Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    try {
      await apiDeleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      Swal.fire({ icon: "success", title: "Tarea eliminada", timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar la tarea" });
    }
  }

  function renderTask(task) {
    return (
      <TaskCard
        key={task.id}
        activity={task}
        deleteActivity={handleDelete}
        onToggle={handleToggle}
        getPriorityBadge={getPriorityBadge}
        formatDate={formatDate}
      />
    );
  }

  return (
    <div>
      <div className="header-page row mb-4">
        <div className="col">
          <h2 className="mb-1">Vista de Hoy</h2>
          <p className="text-muted mb-0">
            Tareas clasificadas por fecha de ejecución ·{" "}
            <i className="bi bi-info-circle text-muted" title="Vencidas: fecha pasada. Hoy: fecha de hoy. Próximas: fecha futura." />
          </p>
        </div>
        <div className="col-auto">
          <Link to="/crear" className="btn btn-primary">+ Crear actividad</Link>
        </div>
      </div>

      <div className="row g-3 mb-5">
        <ActivityColumn
          title="Vencidas"
          activities={vencidas}
          emptyText={<p className="text-center mb-0 small">Sin tareas vencidas.</p>}
          bg="bg-danger-subtle"
          border="border-danger-subtle"
          renderCard={renderTask}
        />
        <ActivityColumn
          title="Hoy"
          activities={paraHoy}
          emptyText={<p className="text-center mb-0 small">Sin tareas para hoy.</p>}
          bg="bg-primary-subtle"
          border="border-primary-subtle"
          renderCard={renderTask}
        />
        <ActivityColumn
          title="Próximas"
          activities={proximas}
          emptyText={<p className="text-center mb-0 small">Sin próximas tareas.</p>}
          bg="bg-success-subtle"
          border="border-success-subtle"
          renderCard={renderTask}
        />
      </div>

      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="mb-0">Actividades Principales</h4>
            <p className="text-muted small mb-0">Solo actividades no completadas</p>
          </div>
          <span className="badge bg-secondary rounded-pill">{activeMainActivities.length}</span>
        </div>

        {activeMainActivities.length === 0 ? (
          <p className="text-muted">No hay actividades principales pendientes.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Actividad</th>
                  <th className="text-nowrap">Fecha límite</th>
                  <th style={{ minWidth: "160px" }}>Progreso</th>
                  <th className="text-nowrap">Subtareas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {activeMainActivities.map(a => {
                  const prog = getActivityProgress(a.id);
                  return (
                    <tr key={a.id}>
                      <td>
                        <Link
                          to={`/actividad/${a.id}`}
                          className="text-decoration-none fw-semibold text-dark"
                        >
                          {a.title}
                        </Link>
                        {a.description && (
                          <div className="text-muted small"
                            style={{
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {a.description}
                          </div>
                        )}
                      </td>
                      <td className="text-muted small text-nowrap">
                        {a.due_date ? formatDate(a.due_date) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: "6px" }}>
                            <div
                              className="progress-bar bg-primary"
                              style={{ width: `${prog.percentage}%` }}
                            />
                          </div>
                          <small className="text-muted text-nowrap">{prog.percentage}%</small>
                        </div>
                      </td>
                      <td className="text-muted small text-nowrap">
                        {prog.completed}/{prog.total}
                      </td>
                      <td>
                        <span className={`badge text-bg-${getStatusBadge(a.status_display)}`}>
                          {a.status_display}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
