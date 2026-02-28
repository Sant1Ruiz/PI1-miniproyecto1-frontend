import { Routes, Route, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

import Portada from "./pages/Portada.jsx";
import Hoy from "./pages/Hoy.jsx";
import Crear from "./pages/Crear.jsx";
import ActividadDetalle from "./pages/ActividadDetalle.jsx";
import Progreso from "./pages/Progreso.jsx";
import Actividades from "./pages/Actividades.jsx";
import Conexion from "./pages/Conexion.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  const location = useLocation();
  const enPortada = location.pathname === "/";

  return (
    <div style={{ padding: 16 }}>
      {!enPortada && (
        <>
          <div className="app-header">
            <h1 className="app-title">Activivalles</h1>
          </div>

          <nav className="navbar">
            <Link to="/hoy">Hoy</Link>
            <Link to="/crear">Crear</Link>
            <Link to="/progreso">Progreso</Link>
            <Link to="/actividades">Actividades</Link>
            <Link to="/conexion">Conexión</Link>
          </nav>
        </>
      )}

      <Routes>
        <Route path="/" element={<Portada />} />
        <Route path="/hoy" element={<Hoy />} />
        <Route path="/crear" element={<Crear />} />
        <Route path="/actividad/:id" element={<ActividadDetalle />} />
        <Route path="/progreso" element={<Progreso />} />
        <Route path="/actividades" element={<Actividades />} />
        <Route path="/conexion" element={<Conexion />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}