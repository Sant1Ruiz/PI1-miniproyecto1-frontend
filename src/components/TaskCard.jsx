import { Link } from "react-router-dom";

export default function TaskCard({ activity, deleteActivity, onToggle, getPriorityBadge, formatDate }) {
  const badge = getPriorityBadge(activity.priority_display);
  const isCompleted = activity.status_id === 3;

  return (
    <div className={`card border-0 shadow-sm p-0${isCompleted ? " opacity-50" : ""}`}>
      {/* Chip de actividad principal — centrado */}
      <div className="d-flex justify-content-center pt-2 px-3 pb-0">
        <span
          className="badge rounded-pill border fw-normal"
          style={{
            background: "rgba(37,99,235,0.08)",
            color: "#1d4ed8",
            borderColor: "rgba(37,99,235,0.25)",
            fontSize: "0.72rem",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={activity.parent_title ?? "Sin actividad"}
        >
          <i className="bi bi-folder2 me-1"></i>
          {activity.parent_title ?? "Sin actividad"}
        </span>
      </div>

      <div className="card-body py-2 px-3">
        <div className="d-flex align-items-start gap-2">
          {/* Checkbox de completar */}
          <input
            type="checkbox"
            className="form-check-input flex-shrink-0 mt-1"
            checked={isCompleted}
            onChange={() => onToggle(activity)}
            style={{ cursor: "pointer" }}
            aria-label="Marcar tarea como completada"
          />

          <div className="flex-grow-1 min-width-0">
            <Link
              className={`text-decoration-none text-dark fw-semibold lh-sm${isCompleted ? " text-decoration-line-through text-muted" : ""}`}
              to={`/actividad/${activity.id}`}
            >
              {activity.title}
            </Link>

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
          </div>

          <i
            className="bi bi-trash text-danger flex-shrink-0 mt-1"
            role="button"
            aria-label="Eliminar tarea"
            style={{ cursor: "pointer", fontSize: "0.9rem" }}
            onClick={() => deleteActivity(activity.id, activity.title)}
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap mt-2">
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
    </div>
  );
}
