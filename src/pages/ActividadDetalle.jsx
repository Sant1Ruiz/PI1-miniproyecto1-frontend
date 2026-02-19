import { Link, useParams } from "react-router-dom";

const ACTIVIDADES = {
  1: { id: 1, titulo: "Quiz de criptografía", fecha: "2026-02-10", duracionMin: 40 },
  2: { id: 2, titulo: "Taller de ISO 27001", fecha: "2026-02-15", duracionMin: 60 },
  3: { id: 3, titulo: "Lectura: SEI escenarios arquitecturales", fecha: "2026-02-17", duracionMin: 30 },
  4: { id: 4, titulo: "Entrega MiniProyecto 1 - Sprint 0", fecha: "2026-02-18", duracionMin: 90 },
  5: { id: 5, titulo: "Parcial", fecha: "2026-02-22", duracionMin: 120 },
};

export default function ActividadDetalle() {
  const { id } = useParams();
  const actividad = ACTIVIDADES[id];

  if (!actividad) {
    return (
      <div>
        <h1>Actividad no encontrada</h1>
        <p style={{ opacity: 0.8 }}>La actividad que buscas no existe o fue eliminada.</p>
        <Link to="/hoy">← Volver</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>{actividad.titulo}</h1>

      <div style={{ marginTop: 10, lineHeight: 1.7 }}>
        <div><b>ID:</b> {actividad.id}</div>
        <div><b>Fecha:</b> {actividad.fecha}</div>
        <div><b>Duración:</b> {actividad.duracionMin} min</div>
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
  <button className="btn secondary" onClick={() => alert(" editar actividad")}>
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
