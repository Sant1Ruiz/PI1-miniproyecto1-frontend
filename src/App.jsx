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
import Profile from "./pages/Profile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RedirectPublic from "./components/RedirectPublic.jsx";
import LogoutButton from "./components/LogoutButton.jsx";
import NotFound from "./pages/NotFound.jsx";
import { useAuth } from "./context/AuthContext";
export default function App() {
  const location = useLocation();
  const enPortada = location.pathname === "/";
  const { token } = useAuth();

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-lg-2 d-none d-lg-block vh-100 px-5 pt-5 bg-light">
      {!enPortada && (
        <>
          <div className="app-header d-flex justify-content-between align-items-center">
            <h1 className="app-title">Activivalles</h1>

            {/* Botón hamburguesa */}
            <button
              className="btn btn-outline-primary d-lg-none"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sidebar"
            >
              ☰
            </button>
          </div>

          {/* Sidebar */}
          <div
            className="offcanvas-lg offcanvas-start"
            tabIndex="-1"
            id="sidebar"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title">Menú</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="offcanvas"
              ></button>
            </div>
            <div className="offcanvas-body p-0">
              <nav className="nav flex-column">

                <Link className="nav-link" to="/hoy">
                  <i className="bi bi-calendar-day me-2"></i> Hoy
                </Link>

                <Link className="nav-link" to="/crear">
                  <i className="bi bi-plus-circle me-2"></i> Crear
                </Link>

                <Link className="nav-link" to="/progreso">
                  <i className="bi bi-graph-up me-2"></i> Progreso
                </Link>

                <Link className="nav-link" to="/actividades">
                  <i className="bi bi-list-task me-2"></i> Actividades
                </Link>

                <Link className="nav-link" to="/perfil">
                  <i className="bi bi-person me-2"></i> Perfil
                </Link>

                {token && <LogoutButton />}
              </nav>
            </div>
          </div>
        </>
      )}
      </div>
      <div className="col-lg-10 mt-5 px-5">
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
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>
      </div>
    </div>
  );
}
