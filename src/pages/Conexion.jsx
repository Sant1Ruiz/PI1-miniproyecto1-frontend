import { useEffect, useState } from "react";
import { apiGet } from "../api/client";

export default function Conexion() {
  const [estado, setEstado] = useState("cargando"); // cargando | conectado | error
  const [info, setInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function probarConexion() {
    setEstado("cargando");
    setErrorMsg("");
    setInfo(null);

    try {
      const [activitiesResp, usersResp] = await Promise.all([
        apiGet("/api/activities/"),
        apiGet("/api/users/"),
      ]);

      const activities = Array.isArray(activitiesResp?.data) ? activitiesResp.data : [];
      const users = Array.isArray(usersResp?.data) ? usersResp.data : [];

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
      setErrorMsg("No se pudo conectar al backend");
    }
  }

  // auto-probar al entrar
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

      <div className="btn-row" style={{ marginBottom: 12 }}>
        <button className="btn" onClick={probarConexion}>
          Probar de nuevo
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

      <section className="card">
        <h2>Meta</h2>
        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
{JSON.stringify(
  { activities: info?.metaActivities, users: info?.metaUsers },
  null,
  2
)}
        </pre>
      </section>
    </div>
  );
}