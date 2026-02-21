import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { ACTIVIDADES_DEMO } from "../data/actividadesDemo";

export default function SubtareaDetalle() {
  const { id, subId } = useParams();
  const actId = Number(id);
  const subIdNum = Number(subId);

  const actividad = ACTIVIDADES_DEMO.find((a) => a.id === actId);
  const subtarea = actividad?.subtareas?.find((s) => s.id === subIdNum);

  const [done, setDone] = useState(!!subtarea?.done);

  if (!actividad) {
    return (
      <div style={{ marginTop: 16 }}>
        <h2>Actividad no encontrada</h2>
        <Link to="/hoy">← Volver</Link>
      </div>
    );
  }

  if (!subtarea) {
    return (
      <div style={{ marginTop: 16 }}>
        <h2>Subtarea no encontrada</h2>
        <Link to=".." relative="path">← Volver a la actividad</Link>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid #ddd" }}>
      <h2>Subtarea: {subtarea.titulo}</h2>

      {/* ✅ Estado + botón al lado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <div>
          <b>Estado:</b> {done ? "Completada" : "Pendiente"}
        </div>

        {done ? (
          <button className="btn secondary" disabled>
            Completada ✅
          </button>
        ) : (
          <button className="btn" onClick={() => setDone(true)}>
            Completado
          </button>
        )}
      </div>
    </div>
  );
}