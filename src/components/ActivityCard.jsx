import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSubtasks } from "../api/activities";

export default function ActivityCard({ activity, deleteActivity, getPriorityBadge, formatDate }) {
  const badge = getPriorityBadge(activity.priority_display);
  const [subtasks, setSubtasks] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const isMainActivity = activity.parent === null;

  useEffect(() => {
    if (isMainActivity) {
      getSubtasks(activity.id).then(setSubtasks);
    }
  }, [activity.id, isMainActivity]);

  return (
    <div className="col-md-12">
      <div className="card border-secondary-subtle p-0">
        <div className="card-body">

          <div className="d-flex justify-content-between align-items-center">
            <Link
              className="text-decoration-none text-dark"
              to={`/actividad/${activity.id}`}
            >
              {activity.title}
            </Link>

            <div className="d-flex gap-3 align-items-center">

              <i
                className="bi bi-trash text-danger"
                role="button"
                aria-label="Eliminar actividad"
                title="Eliminar actividad"
                onClick={() => deleteActivity(activity.id, activity.title)}
              ></i>

              {isMainActivity && subtasks.length > 0 && (
                <button
                  type="button"
                  className="btn btn-link text-dark p-0 border-0 d-inline-flex align-items-center"
                  aria-label="Ver subtareas"
                  title="Ver subtareas"
                  aria-expanded={isExpanded}
                  onClick={() => setIsExpanded((prev) => !prev)}
                >
                  <i className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"} fs-5`}></i>
                </button>
              )}
            </div>
          </div>

          <p className="text-muted">{activity.description}</p>

          <small
            className={`bg-light border border-dark text-dark rounded-2 px-2 py-1`}
          >
            {activity.priority_display}
          </small>

          <i className="bi bi-calendar3 mx-1"></i>
          {formatDate(activity.due_date)}

          {/* Collapse subtasks */}
          {isMainActivity && subtasks.length > 0 && (
            <div className={`collapse mt-3 ${isExpanded ? "show" : ""}`}>
              <ul className="list-group list-group-flush">
                {subtasks.map((sub) => (
                  <li key={sub.id} className="list-group-item">
                    <Link
                      className="text-decoration-none text-dark"
                      to={`/actividad/${sub.id}`}
                    >
                      {sub.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
