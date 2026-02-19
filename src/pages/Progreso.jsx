import { Link } from "react-router-dom";

export default function Progreso() {
  // Mock (Sprint 0)
  const resumen = {
    total: 12,
    completadas: 5,
    pendientes: 7,
    horasPlanificadas: 18,
    horasHechas: 7.5,
  };

  const porcentaje =
    resumen.total === 0 ? 0 : Math.round((resumen.completadas / resumen.total) * 100);

  return (
    <div>
      <h1>Progreso</h1>

      <section className="card">
        <h2>Resumen</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <Kpi label="Actividades totales" value={resumen.total} />
          <Kpi label="Completadas" value={resumen.completadas} />
          <Kpi label="Pendientes" value={resumen.pendientes} />
          <Kpi label="Horas planificadas" value={`${resumen.horasPlanificadas} h`} />
          <Kpi label="Horas realizadas" value={`${resumen.horasHechas} h`} />
        </div>
      </section>

      <section className="card">
        <h2>Avance</h2>

        <div
          style={{
            height: 12,
            background: "#e5e7eb",
            borderRadius: 999,
            overflow: "hidden",
            marginTop: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${porcentaje}%`,
              background: "#111827",
            }}
          />
        </div>

        <p className="muted" style={{ marginTop: 10 }}>
          {porcentaje}% completado ({resumen.completadas} de {resumen.total})
        </p>
      </section>

      <section className="card">
        <h2>Sugerencia </h2>
        <p className="muted">
          Si tienes muchas vencidas o pendientes, prioriza las que estén más cerca
          y tengan menor duración.
        </p>
      </section>

      <div style={{ marginTop: 16 }}>
        <Link to="/hoy">← Volver a Hoy</Link>
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span className="muted">{label}</span>
      <b>{value}</b>
    </div>
  );
}
