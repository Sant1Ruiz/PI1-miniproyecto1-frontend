import { Routes, Route, Link, Navigate } from "react-router-dom";
import Hoy from "./pages/Hoy.jsx";
import Crear from "./pages/Crear.jsx";
import ActividadDetalle from "./pages/ActividadDetalle.jsx";
import Progreso from "./pages/Progreso.jsx";
import Actividades from "./pages/Actividades.jsx";

export default function App() {
  return (
    <div className="app">
      <div className="container">
        <div className="app-header">
          <h1 className="app-title">Activivalles</h1>
        </div>

        <nav className="navbar">
          <Link to="/hoy">Hoy</Link>
          <Link to="/crear">Crear</Link>
          <Link to="/progreso">Progreso</Link>
          <Link to="/actividades">Actividades</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/hoy" replace />} />
          <Route path="/hoy" element={<Hoy />} />
          <Route path="/crear" element={<Crear />} />
          <Route path="/actividad/:id" element={<ActividadDetalle />} />
          <Route path="/progreso" element={<Progreso />} />
          <Route path="/actividades" element={<Actividades />} />

          <Route path="*" element={<h1>404 - No existe esa ruta</h1>} />
        </Routes>
      </div>
    </div>
  );
}
