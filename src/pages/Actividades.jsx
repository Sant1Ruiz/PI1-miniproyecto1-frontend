import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getActivities, deleteActivity as apiDelete } from "../api/activities";
import { getPriorityBadge, getStatusBadge, formatDate, isOverdue } from "../utils/activityUtils";
import Swal from "sweetalert2";

export default function Actividades() {
  const [activities, setActivities]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    getActivities()
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const main     = useMemo(() => activities.filter(a => a.parent === null), [activities]);
  const subtasks = useMemo(() => activities.filter(a => a.parent !== null), [activities]);

  const filtered = useMemo(() => {
    return main.filter(a => {
      const matchSearch =
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPriority =
        filterPriority === "all" || a.priority_display?.toLowerCase() === filterPriority;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "pending"   && (a.status_id === 1 || a.status_id === 2)) ||
        (filterStatus === "completed" && a.status_id === 3) ||
        (filterStatus === "postponed" && subtasks.some(s => s.parent === a.id && s.status_id === 5));
      return matchSearch && matchPriority && matchStatus;
    });
  }, [main, subtasks, searchTerm, filterPriority, filterStatus]);

  function toggle(id) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleDelete(id, title) {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar actividad?",
      html: `<strong>${title}</strong><br><br>Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    try {
      await apiDelete(id);
      setActivities(prev => prev.filter(a => a.id !== id && a.parent !== id));
      Swal.fire({ icon: "success", title: "Eliminada", timer: 1800, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar la actividad" });
    }
  }

  const hasFilters = searchTerm || filterPriority !== "all" || filterStatus !== "all";

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="mb-1">Actividades</h2>
          <p className="text-muted mb-0">
            {main.length} actividades · {subtasks.length} tareas
          </p>
        </div>
        <Link to="/crear" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" /> Crear actividad
        </Link>
      </div>

      {/* Búsqueda y filtros */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-5">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="all">Toda prioridad</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select
            className="form-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Todo estado</option>
            <option value="pending">Pendiente / En progreso</option>
            <option value="completed">Completada</option>
            <option value="postponed">Con tareas pospuestas</option>
          </select>
        </div>
        {hasFilters && (
          <div className="col-auto d-flex align-items-center">
            <button
              className="btn btn-link btn-sm text-muted p-0"
              onClick={() => { setSearchTerm(""); setFilterPriority("all"); setFilterStatus("all"); }}
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Contador */}
      <p className="text-muted small mb-3">
        Mostrando {filtered.length} de {main.length} actividades
      </p>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-inbox" style={{ fontSize: 40 }} />
          <p className="mt-2 mb-0">No se encontraron actividades</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {filtered.map(activity => {
            const subs     = subtasks.filter(t => t.parent === activity.id);
            const expanded = expandedIds.has(activity.id);
            const completed = subs.filter(t => t.status_id === 3).length;
            const pct = subs.length === 0 ? null : Math.round((completed / subs.length) * 100);

            return (
              <div key={activity.id} className="border rounded-3 bg-white overflow-hidden">
                {/* Fila principal */}
                <div className="d-flex align-items-center gap-2 px-3 py-2">
                  {/* Botón expandir */}
                  <button
                    className="btn btn-sm btn-link p-0 text-muted flex-shrink-0"
                    style={{ width: 24, transition: "transform 0.2s", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
                    onClick={() => toggle(activity.id)}
                    disabled={subs.length === 0}
                    title={subs.length === 0 ? "Sin tareas" : expanded ? "Contraer" : "Expandir"}
                  >
                    <i className={`bi bi-chevron-right${subs.length === 0 ? " opacity-25" : ""}`} />
                  </button>

                  {/* Título */}
                  <Link
                    to={`/actividad/${activity.id}`} state={{ from: "/actividades" }}
                    className={`fw-semibold text-dark text-decoration-none flex-grow-1 text-truncate${activity.status_id === 3 ? " text-decoration-line-through text-muted" : ""}`}
                  >
                    {activity.title}
                  </Link>

                  {/* Badges + meta */}
                  <div className="d-none d-md-flex align-items-center gap-2 flex-shrink-0">
                    <span className={`badge text-bg-${getPriorityBadge(activity.priority_display)}`}>
                      {activity.priority_display}
                    </span>
                    <span className={`badge text-bg-${getStatusBadge(activity.status_display)}`}>
                      {activity.status_display}
                    </span>
                    {isOverdue(activity) && (
                      <span className="badge text-bg-danger" title="Esta actividad está vencida">
                        <i className="bi bi-exclamation-triangle-fill me-1" />
                        Vencida
                      </span>
                    )}
                    {activity.due_date && (
                      <small className={`text-nowrap ${isOverdue(activity) ? "text-danger fw-semibold" : "text-muted"}`}>
                        <i className="bi bi-calendar3 me-1" />
                        {formatDate(activity.due_date)}
                      </small>
                    )}
                    {pct !== null && (
                      <small className="text-muted text-nowrap">
                        {completed}/{subs.length} tareas
                      </small>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/actividad/${activity.id}`} state={{ from: "/actividades" }}
                      className="btn btn-sm btn-outline-primary py-0 px-2"
                      title="Ver detalle"
                    >
                      <i className="bi bi-arrow-right" />
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                      title="Eliminar"
                      onClick={() => handleDelete(activity.id, activity.title)}
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>

                {/* Barra de progreso inline (solo si tiene subtareas) */}
                {pct !== null && (
                  <div className="progress mx-3 mb-1" style={{ height: 3 }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                {/* Subtareas expandidas */}
                {expanded && subs.length > 0 && (
                  <div className="border-top bg-light px-3 py-2 d-flex flex-column gap-1">
                    {subs.map(task => (
                      <div key={task.id} className="d-flex align-items-center gap-2 py-1">
                        <i className="bi bi-arrow-return-right text-muted flex-shrink-0" style={{ fontSize: 13 }} />
                        <Link
                          to={`/actividad/${activity.id}`} state={{ from: "/actividades" }}
                          className={`flex-grow-1 small text-decoration-none text-truncate${task.status_id === 3 ? " text-muted text-decoration-line-through" : " text-dark"}`}
                        >
                          {task.title}
                        </Link>
                        <div className="d-none d-sm-flex align-items-center gap-2 flex-shrink-0">
                          <span className={`badge text-bg-${getStatusBadge(task.status_display)} small`}>
                            {task.status_display}
                          </span>
                          {task.due_date && (
                            <small className="text-muted text-nowrap">
                              <i className="bi bi-calendar3 me-1" />
                              {formatDate(task.due_date)}
                            </small>
                          )}
                          {task.duration && (
                            <small className="text-muted text-nowrap">
                              <i className="bi bi-clock me-1" />
                              {task.duration}h
                            </small>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
