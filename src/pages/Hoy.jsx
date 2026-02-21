import { Link } from "react-router-dom";
import { ACTIVIDADES_DEMO } from "../data/actividadesDemo";

function parseYMD(ymd) {
  // evita problemas de timezone: crea fecha en UTC a medianoche
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function diasEntre(ymdA, ymdB) {
  // ymdA - ymdB en días (entero)
  const a = parseYMD(ymdA);
  const b = parseYMD(ymdB);
  const ms = a - b;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export default function Hoy() {
  const HOY = new Date().toISOString().slice(0, 10);
  const actividades = ACTIVIDADES_DEMO;

  const paraHoy = actividades.filter((a) => a.fecha === HOY);

  const proximas = actividades
    .filter((a) => a.fecha > HOY)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const vencidas = actividades
    .filter((a) => a.fecha < HOY)
    .sort((a, b) => b.fecha.localeCompare(a.fecha)); // más recientes vencidas primero

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
                <span className="badge">hoy</span>
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
            {proximas.map((a) => {
              const faltan = diasEntre(a.fecha, HOY); // a.fecha - hoy
              return (
                <li key={a.id} className="item">
                  <Link to={`/actividad/${a.id}`}>{a.titulo}</Link>
                  <span className="badge">
                    {faltan === 1 ? "en 1 día" : `en ${faltan} días`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Vencidas</h2>
        {vencidas.length === 0 ? (
          <p className="muted">No tienes actividades vencidas.</p>
        ) : (
          <ul className="list">
            {vencidas.map((a) => {
              const hace = diasEntre(HOY, a.fecha); // hoy - a.fecha
              return (
                <li key={a.id} className="item">
                  <Link to={`/actividad/${a.id}`}>{a.titulo}</Link>
                  <span className="badge">
                    {hace === 1 ? "hace 1 día" : `hace ${hace} días`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div style={{ marginTop: 12 }}>
        <Link to="/crear">+ Crear actividad</Link>
      </div>
    </div>
  );
}