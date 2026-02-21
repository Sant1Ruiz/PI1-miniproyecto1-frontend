import { Link } from "react-router-dom";
import { ACTIVIDADES_DEMO } from "../data/actividadesDemo";

export default function Actividades() {
  return (
    <div>
      <h1>Actividades</h1>
      <p className="muted">Lista completa.</p>

      <section className="card">
        <ul className="list">
          {ACTIVIDADES_DEMO.map((a) => (
            <li key={a.id} className="item">
              <Link to={`/actividad/${a.id}`}>{a.titulo}</Link>
              <span className="badge">{a.fecha}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}