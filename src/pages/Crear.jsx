import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createActivity } from "../api/activities";

function todayLocalISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Crear() {
  const nav = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(""); // YYYY-MM-DD
  const [descripcion, setDescripcion] = useState("");

  // prioridad elegida por el usuario (cuando NO es hoy)
  const [prioritySelected, setPrioritySelected] = useState(1); // 1=Baja,2=Media,3=Alta,4=Urgente

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const HOY = todayLocalISO();
  const isUrgentByDate = fecha && fecha === HOY;
  const effectivePriorityId = isUrgentByDate ? 4 : Number(prioritySelected);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setSaving(true);

    try {
      const desc = descripcion.trim();

      const payload = {
        user: 1,
        parent: null,
        title: titulo,
        // tu backend exige description:
        description: desc ? desc : "Sin descripción",
        priority_id: effectivePriorityId,
        status_id: 1, // Pendiente
        due_date: `${fecha}T05:00:00.000Z`,
      };

      const created = await createActivity(payload);

      const newId = created?.id;
      setMsg("Actividad creada ✅");

      if (newId || newId === 0) {
  nav(`/actividad/${newId}`, {
    replace: true,
    state: { toast: "Actividad creada ✅" },
  });
} else {
  nav("/actividades", {
    replace: true,
    state: { toast: "Actividad creada ✅" },
  });
}
    } catch (e2) {
      setMsg(e2?.message ?? "No se pudo crear");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Crear actividad</h1>
      {msg ? <p className="muted">{msg}</p> : null}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>
          ¿Cómo se llamará esta actividad?
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Fecha límite de la actividad
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          ¿Qué nivel de prioridad tiene?
          <select
            value={isUrgentByDate ? 4 : prioritySelected}
            onChange={(e) => setPrioritySelected(Number(e.target.value))}
            disabled={isUrgentByDate}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          >
            <option value={1}>Baja</option>
            <option value={2}>Media</option>
            <option value={3}>Alta</option>
            <option value={4}>Urgente</option>
          </select>

          {isUrgentByDate ? (
            <p className="muted" style={{ marginTop: 6 }}>
              Como la fecha límite es hoy, la prioridad se fija automáticamente en <b>Urgente</b>.
            </p>
          ) : null}
        </label>

        <label>
          Añade una descripción (opcional)
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <button type="submit" className="btn" disabled={saving} style={{ width: "100%" }}>
          {saving ? "Guardando..." : "Guardar"}
        </button>

        <Link to="/hoy">← Volver a Hoy</Link>
      </form>
    </div>
  );
}