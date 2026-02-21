import { Link, useParams } from "react-router-dom";
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

  return (
    <div>
      <h1>{actividad.titulo}</h1>

      <div style={{ marginTop: 10, lineHeight: 1.7 }}>
        <div>
          <b>ID:</b> {actividad.id}
        </div>
        <div>
          <b>Fecha:</b> {actividad.fecha}
        </div>
        <div>
          <b>Duración:</b> {actividad.duracionMin} min
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn secondary" onClick={() => alert("editar actividad")}>
          Editar
        </button>

        <button className="btn danger" onClick={() => alert("eliminar actividad")}>
          Eliminar
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link to="/hoy">← Volver a Hoy</Link>
      </div>
    </div>
  );
}