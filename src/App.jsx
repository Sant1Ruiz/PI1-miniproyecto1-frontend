import { Routes, Route, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

import Register from "./pages/Register.jsx"
import Login from "./pages/Login.jsx";
import Portada from "./pages/Portada.jsx";
import Hoy from "./pages/Hoy.jsx";
import Crear from "./pages/Crear.jsx";
import ActividadDetalle from "./pages/ActividadDetalle.jsx";
import Progreso from "./pages/Progreso.jsx";
import Actividades from "./pages/Actividades.jsx";
import Conexion from "./pages/Conexion.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RedirectPublic from "./components/RedirectPublic.jsx";
import LogoutButton from "./components/LogoutButton.jsx";

export default function App() {
  const location = useLocation();
  const enPortada = location.pathname === "/";

  return (
    <div className="container">
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
            {localStorage.getItem("token") && <LogoutButton />}
          </nav>
        </>
      )}

      <Routes>
        <Route path="/register" 
          element={ 
            <RedirectPublic>
              <Register />
            </RedirectPublic>
            } 
        />
        <Route path="/login" element={<RedirectPublic><Login /></RedirectPublic>} />
        <Route path="/" element={<Portada />} />
        <Route 
          path="/hoy" 
          element={
            <ProtectedRoute>
              <Hoy />
            </ProtectedRoute>
          } 
        />
        <Route path="/crear" element={<ProtectedRoute><Crear /></ProtectedRoute>} />
        <Route path="/actividad/:id" element={<ProtectedRoute><ActividadDetalle /></ProtectedRoute>} />
        <Route path="/progreso" element={<ProtectedRoute><Progreso /></ProtectedRoute>} />
        <Route path="/actividades" element={<ProtectedRoute><Actividades /></ProtectedRoute>} />
        <Route path="/conexion" element={<ProtectedRoute><Conexion /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}