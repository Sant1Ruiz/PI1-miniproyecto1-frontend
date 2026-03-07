export function getPriorityBadge(priority) {
  switch (priority?.toLowerCase()) {
    case "baja":
      return "success";
    case "media":
      return "warning";
    case "alta":
      return "warning";
    case "urgente":
      return "danger";
    default:
      return "secondary";
  }
}

export function getStatusBadge(priority) {
  switch (priority?.toLowerCase()) {
    case "pendiente":
      return "secondary";
    case "en progreso":
      return "warning";
    case "completada":
      return "success";
    case "cancelada":
      return "danger";
    default:
      return "secondary";
  }
}

export function formatDate(dateString) {
  const [year, month, day] = dateString.split("T")[0].split("-")

  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}