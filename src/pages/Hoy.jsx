import { Link } from "react-router-dom";
import { useActivities } from "../hooks/useActivities";

function todayLocalISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeActivity(a) {
  const parentRaw = a.parent ?? null;
  // algunos back usan 0 como "sin padre"
  const parent = parentRaw === 0 ? null : parentRaw;

  const fechaRaw = a.due_date ?? a.created_at ?? a.updated_at ?? "";
  const fecha = typeof fechaRaw === "string" ? fechaRaw.slice(0, 10) : "";

  return {
    id: a.id,
    parent, // <- importante para filtrar padres
    titulo: a.title ?? a.titulo ?? a.nombre ?? "Sin título",
    fecha,  // <- viene de due_date
  };
}

export default function Hoy() {
  const HOY = todayLocalISO();
  const { data, status, error } = useActivities();

  if (status === "loading") return <p className="muted">Cargando actividades...</p>;
  if (status === "error") {
  const msg = error?.message ?? "No se pudo cargar";
  const friendly = msg.includes("Failed to fetch")
    ? "No se pudo conectar al servidor."
    : msg;

  return <p className="muted">{friendly}</p>;
}

  const actividades = (data ?? []).map(normalizeActivity);

  // 1) Solo actividades padre
  const padres = actividades.filter((a) => a.parent === null || a.parent === undefined);

  // 2) Vencidas / Hoy / Próximas (por due_date)
  const vencidas = padres
    .filter((a) => a.fecha && a.fecha < HOY)
    .sort((a, b) => b.fecha.localeCompare(a.fecha)); // más recientes vencidas primero

  const paraHoy = padres
    .filter((a) => a.fecha === HOY)
    .sort((a, b) => a.titulo.localeCompare(b.titulo));

  const proximas = padres
    .filter((a) => a.fecha && a.fecha > HOY)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div>
      <h1>Hoy</h1>

      

      <section className="card">
        <h2>Para hoy</h2>
        {paraHoy.length === 0 ? (
          <p className="muted">Puedes relajarte😎.No tienes tareas para hoy.</p>
        ) : (
          <ul className="list">
            {paraHoy.map((a) => (
              <li key={a.id} className="item">
                <Link to={`/actividad/${a.id}`}>{a.titulo}</Link>
                <span className="badge">{a.fecha || "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Próximas</h2>
        {proximas.length === 0 ? (
          <p className="muted">Nada programado a futuro (por ahora).</p>
        ) : (
          <ul className="list">
            {proximas.map((a) => (
              <li key={a.id} className="item">
                <Link to={`/actividad/${a.id}`}>{a.titulo}</Link>
                <span className="badge">{a.fecha || "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card">
        <h2>Vencidas</h2>
        {vencidas.length === 0 ? (
          <p className="muted">¡Bien! No tienes tareas vencidas.</p>
        ) : (
          <ul className="list">
            {vencidas.map((a) => (
              <li key={a.id} className="item">
                <Link to={`/actividad/${a.id}`}>{a.titulo}</Link>
                <span className="badge">{a.fecha || "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div style={{ marginTop: 12 }}>
        <Link to="/crear">+ Crear actividad</Link>
      </div>
    </div>
  );
}