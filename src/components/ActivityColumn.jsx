import ActivityCard from "../components/ActivityCard";
export default function ActivityColumn({
  title,
  subtitle,
  activities,
  emptyText,
  bg,
  border,
  getPriorityBadge,
  formatDate,
  deleteActivity
}) {

  return (
    <div className="col-xl-4">
      <div className={`card ${bg} border ${border}`}>
        <h4>{title}</h4>
        <p className="text-muted mb-0">{activities.length} {subtitle}</p>

        {activities.length === 0 ? (
          <p className="muted">{emptyText}</p>
        ) : (
          <div className="row">
            {activities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                deleteActivity={deleteActivity}
                getPriorityBadge={getPriorityBadge}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}