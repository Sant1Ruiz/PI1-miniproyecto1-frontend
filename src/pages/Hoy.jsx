import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getActivities, deleteActivity as apiDeleteActivity, toggleCompleteActivity, updateActivity } from "../api/activities";
import { updateProfileRequest } from "../api/auth";
import ActivityColumn from "../components/ActivityColumn";
import TaskCard from "../components/TaskCard";
import { getPriorityBadge, getStatusBadge, formatDate, isOverdue, parseNotes } from "../utils/activityUtils";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { useActivityStats } from "../context/ActivityStatsContext";
import { getTodayInColombia } from "../utils/dateUtils";

export default function Hoy() {
  const [activities, setActivities] = useState([]);
  const [completing, setCompleting] = useState(new Set());
  const [showPostponedAlert, setShowPostponedAlert] = useState(() => {
    const dismissed = localStorage.getItem('postponed_alert_dismissed_at');
    if (!dismissed) return true;
    return Date.now() - Number(dismissed) > 24 * 60 * 60 * 1000;
  });
  const [showHoursHint, setShowHoursHint] = useState(false);
  const { token, user, updateUserContext } = useAuth();
  const { refresh: refreshStats } = useActivityStats();
  const today = getTodayInColombia();

  function addCompleting(id) {
    setCompleting(prev => new Set(prev).add(id));
  }
  function removeCompleting(id) {
    setCompleting(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  function showCompletedToast(title, { isMainActivity = false } = {}) {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: isMainActivity ? "¡Actividad completada!" : "¡Tarea completada!",
      text: title,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  }

  function showPostponedToast(title) {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "Tarea pospuesta",
      text: title,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  }

  useEffect(() => {
    if (!user) return;
    setShowHoursHint(!localStorage.getItem(`hint_hours_seen_${user.id}`));
  }, [user]);

  useEffect(() => {
    if (!token) { setActivities([]); return; }
    getActivities().then(setActivities).catch(console.error);
  }, [token]);

  const mainActivities = activities.filter(a => a.parent === null);
  const tasks = activities.filter(a => a.parent !== null);

  const byDateThenPriority = (a, b) =>
    a.due_date.localeCompare(b.due_date) || (Number(b.priority_id) || 0) - (Number(a.priority_id) || 0);

  const vencidas = tasks
    .filter(t => t.due_date && t.due_date.split("T")[0] < today && t.status_id !== 3 && t.status_id !== 5)
    .sort(byDateThenPriority);

  const paraHoy = tasks
    .filter(t => t.due_date && t.due_date.split("T")[0] === today && t.status_id !== 3 && t.status_id !== 5)
    .sort((a, b) => (Number(b.priority_id) || 0) - (Number(a.priority_id) || 0));

  const proximas = tasks
    .filter(t => t.due_date && t.due_date.split("T")[0] > today && t.status_id !== 3 && t.status_id !== 5)
    .sort(byDateThenPriority);

  const activeMainActivities = mainActivities
    .filter(a => a.status_id !== 3)
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return (Number(b.priority_id) || 0) - (Number(a.priority_id) || 0);
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date) || (Number(b.priority_id) || 0) - (Number(a.priority_id) || 0);
    });

  // Detect conflicts across ALL days (not just today)
  const allConflictDays = (() => {
    if (!user) return [];
    const byDate = {};
    tasks
      .filter(t => t.status_id !== 3 && t.status_id !== 5 && t.due_date)
      .forEach(t => {
        const date = t.due_date.split("T")[0];
        if (!byDate[date]) byDate[date] = { tasks: [], totalHours: 0 };
        byDate[date].tasks.push(t);
        byDate[date].totalHours += Number(t.duration) || 0;
      });
    return Object.entries(byDate)
      .filter(([, { totalHours }]) => totalHours > user.max_horas_day)
      .map(([date, { tasks: dayTasks, totalHours }]) => ({ date, tasks: dayTasks, totalHours }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  const hasConflict = allConflictDays.length > 0;
  const conflictTaskIds = new Set(allConflictDays.flatMap(d => d.tasks.map(t => t.id)));
  const conflictActivityIds = new Set(
    allConflictDays.flatMap(d => d.tasks.map(t => t.parent).filter(Boolean))
  );

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
            a.status_id !== 5 &&
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
    if (!isUncompleting) {
      addCompleting(task.id);
      const anim = new Promise(r => setTimeout(r, 550));
      try {
        const [updated] = await Promise.all([toggleCompleteActivity(task), anim]);
        const nextActivities = activities.map(a =>
          a.id === task.id ? { ...a, status_id: updated.status_id, status_display: updated.status_display } : a
        );
        setActivities(nextActivities);
        refreshStats();
        if (updated.status_id === 3) {
          showCompletedToast(task.title);
          // Verificar si todas las tareas del padre quedaron completadas
          if (task.parent) {
            const siblingTasks = nextActivities.filter(a => a.parent === task.parent);
            const parentActivity = nextActivities.find(a => a.id === task.parent);
            if (
              siblingTasks.length > 0 &&
              siblingTasks.every(t => t.status_id === 3) &&
              parentActivity &&
              parentActivity.status_id !== 3
            ) {
              const result = await Swal.fire({
                icon: 'success',
                title: '¡Todas las tareas completadas!',
                text: `¿Deseas marcar "${parentActivity.title}" como completada también?`,
                showConfirmButton: true,
                confirmButtonText: 'Sí, completar actividad',
                confirmButtonColor: '#198754',
                showCancelButton: true,
                cancelButtonText: 'No por ahora',
                cancelButtonColor: '#6c757d',
              });
              if (result.isConfirmed) {
                await updateActivity(task.parent, { status_id: 3 });
                setActivities(prev =>
                  prev.map(a => a.id === task.parent ? { ...a, status_id: 3, status_display: 'Completada' } : a)
                );
                refreshStats();
                showCompletedToast(parentActivity.title, { isMainActivity: true });
              }
            }
          }
        }
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar la tarea" });
      } finally {
        removeCompleting(task.id);
      }
    } else {
      try {
        const updated = await toggleCompleteActivity(task);
        setActivities(prev =>
          prev.map(a => a.id === task.id ? { ...a, status_id: updated.status_id, status_display: updated.status_display } : a)
        );
        refreshStats();
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar la tarea" });
      }
    }
  }

  async function handleCompleteMain(activity) {
    addCompleting(activity.id);
    const anim = new Promise(r => setTimeout(r, 550));
    try {
      await Promise.all([
        (async () => {
          await toggleCompleteActivity(activity);
          const pendingSubtasks = activities.filter(a => a.parent === activity.id && a.status_id !== 3);
          if (pendingSubtasks.length > 0) {
            await Promise.all(pendingSubtasks.map(t => updateActivity(t.id, { status_id: 3 })));
          }
        })(),
        anim,
      ]);
      setActivities(prev =>
        prev.map(a => {
          if (a.id === activity.id) return { ...a, status_id: 3, status_display: "Completada" };
          if (a.parent === activity.id) return { ...a, status_id: 3, status_display: "Completada" };
          return a;
        })
      );
      refreshStats();
      showCompletedToast(activity.title, { isMainActivity: true });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo completar la actividad" });
    } finally {
      removeCompleting(activity.id);
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

  async function handlePostpone(task) {
    const { value: note, isConfirmed } = await Swal.fire({
      title: 'Posponer tarea',
      html: '<p class="mb-2 text-start small text-muted">La tarea quedará como <strong>pospuesta</strong>. Puedes agregar una nota opcional que se conservará aunque cambie el estado.</p>',
      input: 'textarea',
      inputPlaceholder: 'Razón de la posposición (opcional)...',
      inputAttributes: { rows: '3', style: 'resize:none;font-size:0.9rem' },
      showCancelButton: true,
      confirmButtonText: 'Posponer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6c757d',
    });
    if (!isConfirmed) return;
    try {
      const updated = await updateActivity(task.id, {
        status_id: 5,
        reason: note || '',
      });
      setActivities(prev =>
        prev.map(a => a.id === task.id ? updated : a)
      );
      refreshStats();
      showPostponedToast(task.title);
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo posponer la tarea' });
    }
  }

  function renderTask(task) {
    return (
      <TaskCard
        key={task.id}
        activity={task}
        deleteActivity={handleDelete}
        onToggle={handleToggle}
        onPostpone={handlePostpone}
        getPriorityBadge={getPriorityBadge}
        formatDate={formatDate}
        isCompleting={completing.has(task.id)}
        isConflict={conflictTaskIds.has(task.id)}
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

      {allConflictDays.length > 0 && (
        <div className="alert alert-warning py-2 mb-4" role="alert">
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <strong className="small">
              Conflicto de horas · límite {user.max_horas_day}h/día
            </strong>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {allConflictDays.map(({ date, totalHours }) => {
              const [y, m, d] = date.split('-').map(Number);
              const label = date === today
                ? "Hoy"
                : new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
              return (
                <span key={date} className="badge bg-warning text-dark fw-normal">
                  {label} · {totalHours}h
                </span>
              );
            })}
          </div>
        </div>
      )}

      {showHoursHint && user && (
        <div className="alert alert-info py-2 mb-4 d-flex justify-content-between align-items-start" role="alert">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-info-circle-fill"></i>
              <strong className="small">¿Qué son las horas estimadas?</strong>
            </div>
            <p className="small mb-1 text-muted">
              Cada tarea tiene una <strong>duración estimada en horas</strong>. El sistema usa este valor para avisarte
              cuando planeas más horas de las que tienes disponibles en un día.
            </p>
            <p className="small mb-0 text-muted">
              Actualmente tu límite diario es de <strong>{user.max_horas_day}h</strong>. Puedes modificarlo en{' '}
              <a href="/perfil" className="alert-link">tu perfil</a>.
            </p>
          </div>
          <button
            type="button"
            className="btn-close ms-3 flex-shrink-0"
            aria-label="Cerrar"
            onClick={() => {
              localStorage.setItem(`hint_hours_seen_${user.id}`, '1');
              setShowHoursHint(false);
            }}
          />
        </div>
      )}

      {showPostponedAlert && (() => {
        const postponedTasks = tasks.filter(t => t.status_id === 5);
        if (postponedTasks.length === 0) return null;
        const byActivity = postponedTasks.reduce((acc, t) => {
          const parent = mainActivities.find(a => a.id === t.parent);
          const key = t.parent;
          if (!acc[key]) acc[key] = { title: parent?.title || 'Actividad', tasks: [] };
          acc[key].tasks.push(t);
          return acc;
        }, {});
        return (
          <div className="alert alert-secondary py-2 mb-4 d-flex justify-content-between align-items-start" role="alert">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <i className="bi bi-pause-circle-fill text-secondary"></i>
                <strong className="small">Tienes {postponedTasks.length} tarea{postponedTasks.length > 1 ? 's' : ''} pospuesta{postponedTasks.length > 1 ? 's' : ''}</strong>
              </div>
              <div className="d-flex flex-column gap-1">
                {Object.entries(byActivity).map(([key, { title, tasks: pt }]) => (
                  <span key={key} className="small text-muted">
                    <i className="bi bi-folder2-open me-1" />
                    <Link to={`/actividad/${key}`} className="fw-semibold text-dark text-decoration-none me-1">
                      {title}
                    </Link>
                    <span className="text-muted">· {pt.map(t => t.title).join(', ')}</span>
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn-close ms-3 flex-shrink-0"
              aria-label="Cerrar"
              onClick={() => {
                localStorage.setItem('postponed_alert_dismissed_at', String(Date.now()));
                setShowPostponedAlert(false);
              }}
            />
          </div>
        );
      })()}

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
                  <th style={{ width: "36px" }}></th>
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
                    <tr key={a.id} className={`${completing.has(a.id) ? "task-completing" : ""} ${conflictActivityIds.has(a.id) ? "table-warning" : ""}`}>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={false}
                          onChange={() => handleCompleteMain(a)}
                          style={{ cursor: "pointer" }}
                          title="Marcar como completada"
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          {conflictActivityIds.has(a.id) && (
                            <i
                              className="bi bi-exclamation-triangle-fill text-warning flex-shrink-0"
                              title="Esta actividad tiene tareas en conflicto de horas para hoy"
                            />
                          )}
                          <Link
                            to={`/actividad/${a.id}`}
                            state={{ from: "/hoy" }}
                            className="text-decoration-none fw-semibold text-dark task-title"
                          >
                            {a.title}
                          </Link>
                        </div>
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
                      <td className="small text-nowrap">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {isOverdue(a) && (
                            <span className="badge text-bg-danger" title="Esta actividad está vencida">
                              <i className="bi bi-exclamation-triangle-fill me-1" />
                              Vencida
                            </span>
                          )}
                          <span className={isOverdue(a) ? "text-danger fw-semibold" : "text-muted"}>
                            {a.due_date ? formatDate(a.due_date) : "—"}
                          </span>
                        </div>
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
