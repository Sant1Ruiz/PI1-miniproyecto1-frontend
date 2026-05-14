import { getTodayInColombia } from "./dateUtils";

export function isOverdue(activity) {
  if (!activity.due_date) return false;
  if (activity.status_id === 3 || activity.status_id === 4 || activity.status_id === 5) return false;
  const today = getTodayInColombia();
  const dueDate = activity.due_date.split("T")[0];
  return dueDate < today;
}

export function getPriorityBadge(priority) {
  switch (priority?.toLowerCase()) {
    case "urgente":
      return "danger";
    case "alta":
      return "warning";
    case "media":
      return "info";
    case "baja":
      return "secondary";
    default:
      return "secondary";
  }
}

export function getStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case "pendiente":
      return "secondary";
    case "en progreso":
      return "warning";
    case "completada":
      return "success";
    case "cancelada":
      return "danger";
    case "pospuesta":
      return "info";
    default:
      return "secondary";
  }
}

export function parseNotes(notes) {
  if (!notes) return [];

  const normalize = (n) => ({
    text: n.reason ?? n.text ?? '',
    created_at: n.created_at ?? null,
  });

  const sortDesc = (arr) =>
    [...arr].sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0;
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // Formato del backend: array de objetos {id, reason, created_at}
  if (Array.isArray(notes)) {
    return sortDesc(notes.map(normalize));
  }

  // Compatibilidad: JSON string (datos guardados antes de la corrección)
  try {
    const parsed = JSON.parse(notes);
    if (Array.isArray(parsed)) return sortDesc(parsed.map(normalize));
  } catch { /* no era JSON */ }

  // String plano
  const str = String(notes).trim();
  return str ? [{ text: str, created_at: null }] : [];
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