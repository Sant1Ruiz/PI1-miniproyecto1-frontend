import { Routes, Route, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { useActivityStats } from "./context/ActivityStatsContext";

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
  const sinSidebar = ["/", "/login", "/register"].includes(location.pathname);
  const { token } = useAuth();
  const { resumen } = useActivityStats();

  return (
    <div className={sinSidebar ? "" : "d-flex vh-100 overflow-hidden"}>
      {!sinSidebar && (
        <div className="d-none d-lg-flex flex-column flex-shrink-0 px-3 pt-4 bg-light overflow-y-auto"
          style={{ width: "220px" }}>
          <div className="app-header d-flex justify-content-between align-items-center">
            <h1 className="app-title">Activivalles</h1>
          </div>

          <nav className="nav flex-column px-2 pt-2">
            <Link className={`nav-link sidebar-btn ${location.pathname === '/hoy' ? 'active' : ''}`} to="/hoy">
              <i className="bi bi-calendar-day me-2"></i> Hoy
            </Link>
            <Link className={`nav-link sidebar-btn ${location.pathname === '/crear' ? 'active' : ''}`} to="/crear">
              <i className="bi bi-plus-circle me-2"></i> Crear
            </Link>
            <Link className={`nav-link sidebar-btn ${location.pathname === '/progreso' ? 'active' : ''}`} to="/progreso">
              <i className="bi bi-graph-up me-2"></i> Progreso
            </Link>
            <Link className={`nav-link sidebar-btn ${location.pathname === '/actividades' ? 'active' : ''}`} to="/actividades">
              <i className="bi bi-list-task me-2"></i> Actividades
            </Link>
          </nav>

          <div className="px-2 pt-2 pb-2 flex-grow-1">
            <p className="text-muted fw-semibold mb-2 px-1" style={{ fontSize: "0.7rem" }}>Resumen General</p>
            <div className="d-flex flex-column gap-1">
              <SidebarKpi label="Completadas" value={resumen.completadas} icon="bi-check-circle"       iconBg="#dcfce7" iconColor="#16a34a" />
              <SidebarKpi label="Pendientes"  value={resumen.pendientes}  icon="bi-clock"              iconBg="#dbeafe" iconColor="#2563eb" />
              <SidebarKpi label="Vencidas"    value={resumen.vencidas}    icon="bi-exclamation-circle" iconBg="#fee2e2" iconColor="#dc2626" />
              <SidebarKpi label="Total"       value={resumen.total}       icon="bi-list-task"          iconBg="#f3e8ff" iconColor="#9333ea" />
            </div>
          </div>

          <div className="sidebar-bottom px-2 pb-2 border-top">
            <nav className="nav flex-column pt-2">
              <Link className={`nav-link sidebar-btn ${location.pathname === '/perfil' ? 'active' : ''}`} to="/perfil">
                <i className="bi bi-person me-2"></i> Perfil
              </Link>
            </nav>
            {token && (
              <div className="pt-2">
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      )}

      <div className={sinSidebar ? "col-12" : "flex-grow-1 overflow-y-auto py-5 px-5"}>
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
  );
}

function SidebarKpi({ label, value, icon, iconBg, iconColor }) {
  return (
    <Link
      to="/progreso"
      className="d-flex align-items-center gap-2 bg-white rounded-2 px-2 py-1 border text-decoration-none text-dark"
      title={`Ver progreso: ${label}`}
    >
      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: 26, height: 26, background: iconBg }}>
        <i className={`bi ${icon}`} style={{ color: iconColor, fontSize: 12 }} />
      </div>
      <div>
        <p className="mb-0 text-muted" style={{ fontSize: "0.65rem", lineHeight: 1.2 }}>{label}</p>
        <span className="fw-bold" style={{ fontSize: "0.8rem" }}>{value}</span>
      </div>
    </Link>
  );
}
