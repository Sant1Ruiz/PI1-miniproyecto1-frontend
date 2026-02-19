import { Link } from "react-router-dom";
import { ACTIVIDADES_DEMO } from "../data/actividadesDemo";


export default function Hoy() {
  // Demo: hoy = 2026-02-17 (para que siempre se vea “para hoy” en la demo)
  // Si prefieres usar la fecha real del computador, te lo cambio.
  const HOY = "2026-02-17";
  const actividades = ACTIVIDADES_DEMO; // En el futuro esto vendrá de un API o de un estado global, pero por ahora lo dejamos hardcodeado para enfocarnos en la UI.


  // 1) Para hoy primero
  const paraHoy = actividades.filter((a) => a.fecha === HOY);

  // 2) Próximas después (mayores a hoy), ordenadas por fecha
  const proximas = actividades
    .filter((a) => a.fecha > HOY)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div>
      <h1>Hoy</h1>
      <section className="card">
        <h2>Para hoy</h2>
        {paraHoy.length === 0 ? (
          <p className="muted">No tienes actividades para hoy.</p>
        ) : (
          <ul className="list">
            {paraHoy.map((a) => (
              <li key={a.id} className="item">
                <Link to={`/actividad/${a.id}`}>{a.titulo}</Link>
                <span className="badge">{a.fecha}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Próximas</h2>
        {proximas.length === 0 ? (
          <p className="muted">No hay próximas actividades.</p>
        ) : (
          <ul className="list">
            {proximas.map((a) => (
              <li key={a.id} className="item">
                <Link to={`/actividad/${a.id}`}>{a.titulo}</Link>
                <span className="badge">{a.fecha}</span>
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
