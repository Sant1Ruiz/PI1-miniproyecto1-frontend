import { Link, Outlet, useParams } from "react-router-dom";
import { ACTIVIDADES_DEMO } from "../data/actividadesDemo";

export default function ActividadDetalle() {
  const { id } = useParams();
  const idNum = Number(id);

  const actividad = ACTIVIDADES_DEMO.find((a) => a.id === idNum);

  if (!actividad) {
    return (
      <div>
        <h1>Actividad no encontrada</h1>
        <p style={{ opacity: 0.8 }}>
          La actividad que buscas no existe o fue eliminada.
        </p>
        <Link to="/hoy">← Volver</Link>
      </div>
    );
  }

  const crearSubtarea = () => {
    alert(`Crear subtarea para actividad ${actividad.id}`);
  };

  return (
    <div>
      <h1>{actividad.titulo}</h1>

      <div style={{ marginTop: 10, lineHeight: 1.7 }}>
        <div><b>ID:</b> {actividad.id}</div>
        <div><b>Fecha:</b> {actividad.fecha}</div>
        <div><b>Duración:</b> {actividad.duracionMin} min</div>
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn secondary" onClick={() => alert("editar actividad")}>
          Editar
        </button>
        <button className="btn danger" onClick={() => alert("eliminar actividad")}>
          Eliminar
        </button>
      </div>

      {/* ✅ Subtareas */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Subtareas</h2>
          <button className="btn" onClick={crearSubtarea}>
            Crear subtarea
          </button>
        </div>

        {(!actividad.subtareas || actividad.subtareas.length === 0) ? (
          <p style={{ opacity: 0.8 }}>Esta actividad no tiene subtareas.</p>
        ) : (
          <ul style={{ lineHeight: 1.9 }}>
            {actividad.subtareas.map((s) => (
              <li key={s.id}>
                <Link to={`subtareas/${s.id}`}>
                  {s.titulo} 
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Outlet />

      <div style={{ marginTop: 16 }}>
        <Link to="/hoy">← Volver a Hoy</Link>
      </div>
    </div>
  );
}