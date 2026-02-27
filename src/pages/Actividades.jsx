import { Link } from "react-router-dom";
import { useActivities } from "../hooks/useActivities";

function normalizeActivity(a) {
  const parentRaw = a.parent ?? null;
  const parent = parentRaw === 0 ? null : parentRaw;

  const fechaRaw = a.due_date ?? a.created_at ?? a.updated_at ?? "";
  const fecha = typeof fechaRaw === "string" ? fechaRaw.slice(0, 10) : "";

  const isSubtask = parent !== null && parent !== undefined;

  return {
    id: a.id,
    parent,
    isSubtask,
    tipoLabel: isSubtask ? "Subtarea" : "Actividad",
    titulo: a.title ?? a.titulo ?? "Sin título",
    fecha,
  };
}

export default function Actividades() {
  const { data, status, error } = useActivities();
  const actividades = (data ?? []).map(normalizeActivity);

  if (status === "loading") return <p className="muted">Cargando...</p>;
  if (status === "error") {
  const msg = error?.message ?? "No se pudo cargar";
  const friendly = msg.includes("Failed to fetch")
    ? "No se pudo conectar al servidor."
    : msg;

  return <p className="muted">{friendly}</p>;
}

  return (
    <div>
      <h1>Actividades</h1>
      <p className="muted">Lista completa de actividades-subtareas creadas</p>

      <section className="card">
        {actividades.length === 0 ? (
          <p className="muted">Aún no tienes tareas ni subtareas. Empieza creando una.</p>
        ) : (
          <ul className="list">
            {actividades.map((a) => (
              <li key={a.id} className="item">
                <Link to={`/actividad/${a.id}`}>{a.titulo}</Link>

                {/* Etiqueta + fecha */}
                <span className="badge">
                  {a.tipoLabel} · {a.fecha || "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="btn-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
  <Link className="btn secondary" to="/hoy">Ir a Hoy</Link>
  <Link className="btn" to="/crear">+ Crear actividad</Link>
</div>
    </div>
    
  );
  
}