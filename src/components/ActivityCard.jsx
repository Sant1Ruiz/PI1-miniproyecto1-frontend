import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSubtasks } from "../api/activities";

export default function ActivityCard({ activity, deleteActivity, getPriorityBadge, formatDate }) {
  const badge = getPriorityBadge(activity.priority_display);
  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    if (!activity.parent_id) {
      getSubtasks(activity.id).then(setSubtasks);
    }
  }, [activity]);

  const collapseId = `collapse-${activity.id}`;

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

              {!activity.parent_id && subtasks.length > 0 && (
                <i
                  className="bi bi-three-dots-vertical"
                  role="button"
                  aria-label="Ver subtareas"
                  title="Ver subtareas"
                  data-bs-toggle="collapse"
                  data-bs-target={`#${collapseId}`}
                ></i>
              )}
            </div>
          </div>

          <p className="text-muted">{activity.description}</p>

          <small
            className={`bg-${badge}-subtle border border-${badge}-subtle text-${badge} rounded-2 px-2 py-1`}
          >
            {activity.priority_display}
          </small>

          <i className="bi bi-calendar3 mx-1"></i>
          {formatDate(activity.due_date)}

          {/* Collapse subtasks */}
          {!activity.parent_id && subtasks.length > 0 && (
            <div className="collapse mt-3" id={collapseId}>
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
