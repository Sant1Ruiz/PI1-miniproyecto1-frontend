export default function ActivityColumn({
  title,
  activities,
  emptyText,
  bg,
  border,
  renderCard,
  colClass = "col-xl-4",
}) {
  return (
    <div className={colClass}>
      <div className={`card ${bg} border ${border} p-3`}>
        <h5 className="mb-0">{title}</h5>
        <p className="text-muted small mb-3">{activities.length} tarea(s)</p>

        {activities.length === 0 ? (
          <div className="text-muted">{emptyText}</div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {activities.map(renderCard)}
          </div>
        )}
      </div>
    </div>
  );
}
