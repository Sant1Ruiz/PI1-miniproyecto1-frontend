import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ACTIVIDADES_DEMO } from "../data/actividadesDemo";
import { apiGet } from "../api/client";

export default function Actividades() {
  const [actividades, setActividades] = useState(ACTIVIDADES_DEMO);
  const [estado, setEstado] = useState("cargando"); // cargando | conectado | error

  useEffect(() => {
    const ENDPOINT = "/api/activities/"; // luego lo cambias por el de Swagger

    apiGet(ENDPOINT)
      .then((data) => {
        const lista = Array.isArray(data) ? data : (data.results ?? data);
        setActividades(lista);
        setEstado("conectado");
      })
      .catch((e) => {
        console.log("Fallo conexión:", e);
        setActividades(ACTIVIDADES_DEMO);
        setEstado("error");
      });
  }, []);

  return (
    <div>
      <h1>Actividades</h1>
      <p className="muted">
        {estado === "cargando" && "Conectando con el backend..."}
        {estado === "conectado" && "Conectado ✅ (datos del backend)"}
        {estado === "error" && "Sin conexión (mostrando datos de demo)"}
      </p>

      <section className="card">
        <ul className="list">
          {actividades.map((a) => (
            <li key={a.id} className="item">
              <Link to={`/actividad/${a.id}`}>{a.titulo ?? a.title}</Link>
              <span className="badge">{a.fecha ?? a.date}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
