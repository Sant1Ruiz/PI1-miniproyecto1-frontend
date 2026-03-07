import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/client";

export default function Conexion() {
  const [estado, setEstado] = useState("cargando"); // cargando | conectado | error
  const [info, setInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // NUEVO: diagnóstico de POST
  const [diag, setDiag] = useState(null);

  async function probarConexion() {
    setEstado("cargando");
    setErrorMsg("");
    setInfo(null);

    try {
      const [activitiesResp, usersResp] = await Promise.all([
        apiGet("/api/activities/"),
        apiGet("/api/users/"),
      ]);

      // OJO: tu back a veces puede devolver lista directa.
      const activities = Array.isArray(activitiesResp?.data)
        ? activitiesResp.data
        : Array.isArray(activitiesResp)
        ? activitiesResp
        : [];

      const users = Array.isArray(usersResp?.data)
        ? usersResp.data
        : Array.isArray(usersResp)
        ? usersResp
        : [];

      setInfo({
        baseUrl: import.meta.env.VITE_API_URL,
        activitiesCount: activities.length,
        usersCount: users.length,
        metaActivities: activitiesResp?.meta ?? null,
        metaUsers: usersResp?.meta ?? null,
      });

      setEstado("conectado");
    } catch (e) {
      console.log("Error de conexión:", e);
      setEstado("error");
      setErrorMsg(e?.message ?? "No se pudo conectar al backend");
    }
  }

  // NUEVO: POST de diagnóstico (payload vacío, no crea nada)
  async function diagnosticoPost(endpoint) {
    setDiag({ endpoint, running: true });

    try {
      const resp = await apiPost(endpoint, {}); // payload vacío a propósito
      setDiag({ endpoint, running: false, ok: true, resp });
    } catch (e) {
      setDiag({
        endpoint,
        running: false,
        ok: false,
        error: e?.message ?? String(e),
      });
    }
  }

  useEffect(() => {
    const t = setTimeout(() => probarConexion(), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <h1>Conexión</h1>
      <p className="muted">
        {estado === "cargando" && "Probando conexión con el backend..."}
        {estado === "conectado" && "Conectado ✅"}
        {estado === "error" && `Error ❌ ${errorMsg}`}
      </p>

      <div className="btn-row" style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn" onClick={probarConexion}>
          Probar de nuevo
        </button>

        {/* NUEVOS */}
        <button className="btn" onClick={() => diagnosticoPost("/api/activities/")}>
          POST diagnóstico Activities
        </button>
        <button className="btn" onClick={() => diagnosticoPost("/api/users/")}>
          POST diagnóstico Users
        </button>
      </div>

      <section className="card">
        <h2>Resumen</h2>
        <ul className="list">
          <li className="item">
            <span>Backend (VITE_API_URL)</span>
            <span className="badge">{info?.baseUrl ?? "—"}</span>
          </li>
          <li className="item">
            <span>Actividades recibidas</span>
            <span className="badge">{info?.activitiesCount ?? "—"}</span>
          </li>
          <li className="item">
            <span>Usuarios recibidos</span>
            <span className="badge">{info?.usersCount ?? "—"}</span>
          </li>
        </ul>
      </section>

      {/* NUEVO */}
      <section className="card">
        <h2>Diagnóstico POST</h2>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{JSON.stringify(diag, null, 2)}
        </pre>
      </section>

      <section className="card">
        <h2>Meta</h2>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{JSON.stringify({ activities: info?.metaActivities, users: info?.metaUsers }, null, 2)}
        </pre>
      </section>
    </div>
  );
}