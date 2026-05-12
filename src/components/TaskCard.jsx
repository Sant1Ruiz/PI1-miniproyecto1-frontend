import { Link } from "react-router-dom";

export default function TaskCard({ activity, deleteActivity, onToggle, getPriorityBadge, formatDate, isCompleting }) {
  const badge = getPriorityBadge(activity.priority_display);
  const isCompleted = activity.status_id === 3;

  return (
    <div className={`card border-0 shadow-sm p-0${isCompleted ? " opacity-60" : ""}${isCompleting ? " task-completing" : ""}`}>

      {/* Fila superior: checkbox | chip | trash */}
      <div className="d-flex align-items-center justify-content-between px-3 pt-2 pb-1 gap-2">
        <input
          type="checkbox"
          className="form-check-input flex-shrink-0"
          checked={isCompleted}
          onChange={() => onToggle(activity)}
          style={{ cursor: "pointer", marginTop: 0 }}
          aria-label="Marcar tarea como completada"
        />

        <span
          className="badge rounded-pill border fw-normal flex-grow-1 text-center"
          style={{
            background: "rgba(37,99,235,0.08)",
            color: "#1d4ed8",
            borderColor: "rgba(37,99,235,0.25)",
            fontSize: "0.72rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={activity.parent_title ?? "Sin actividad"}
        >
          <i className="bi bi-folder2 me-1"></i>
          {activity.parent_title ?? "Sin actividad"}
        </span>

        <i
          className="bi bi-trash text-danger flex-shrink-0"
          role="button"
          aria-label="Eliminar tarea"
          style={{ cursor: "pointer", fontSize: "0.9rem" }}
          onClick={() => deleteActivity(activity.id, activity.title)}
        />
      </div>

      {/* Área principal clicable — título + descripción */}
      <Link
        to={`/actividad/${activity.id}`}
        state={{ from: "/hoy" }}
        className={`d-block px-3 pb-1 text-decoration-none${isCompleted ? " text-muted" : " text-dark"}`}
      >
        <span className={`fw-semibold lh-sm task-title${isCompleted ? " text-decoration-line-through" : ""}`}>
          {activity.title}
        </span>

        {activity.description && (
          <p
            className="text-muted small mb-0 mt-1"
            style={{
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {activity.description}
          </p>
        )}
      </Link>

      {/* Fila de badges */}
      <div className="d-flex align-items-center gap-2 flex-wrap px-3 pb-2 mt-1">
        <span className={`badge text-bg-${badge}`}>{activity.priority_display}</span>
        {activity.duration && (
          <span className="badge bg-light text-dark border" style={{ fontSize: "0.72rem" }}>
            <i className="bi bi-clock me-1"></i>
            {activity.duration}h
          </span>
        )}
        <small className="text-muted ms-auto text-nowrap">
          <i className="bi bi-calendar3 me-1"></i>
          {activity.due_date ? formatDate(activity.due_date) : "Sin fecha"}
        </small>
      </div>
    </div>
  );
}
