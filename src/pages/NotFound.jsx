import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div>
      <h1>Página no encontrada</h1>
      <p className="muted">
        No encontramos esa ruta. Revisa el enlace o vuelve al inicio.
      </p>

      <div style={{ marginTop: 16 }}>
        <Link to="/hoy">← Volver a Hoy</Link>
      </div>
    </div>
  );
}