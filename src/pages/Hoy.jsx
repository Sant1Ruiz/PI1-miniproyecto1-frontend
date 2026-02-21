import { Link } from "react-router-dom";
import { ACTIVIDADES_DEMO } from "../data/actividadesDemo";

export default function Hoy() {
  const HOY = new Date().toISOString().slice(0, 10);
  const actividades = ACTIVIDADES_DEMO;

  const paraHoy = actividades.filter((a) => a.fecha === HOY);

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