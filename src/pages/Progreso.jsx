import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { getActivities } from "../api/activities";
import { useAuth } from "../context/AuthContext";
import { getTodayInColombia } from "../utils/dateUtils";

const STATUS_META = {
  1: { label: "Pendiente",   color: "#0d6efd" },
  2: { label: "En Progreso", color: "#ffc107" },
  3: { label: "Completada",  color: "#198754" },
  4: { label: "Cancelada",   color: "#6c757d" },
  5: { label: "Pospuesta",   color: "#0dcaf0" },
};

const PRIORITY_META = [
  { id: 3, label: "Alta",  badgeClass: "text-bg-danger",  color: "#dc3545" },
  { id: 2, label: "Media", badgeClass: "text-bg-warning", color: "#ffc107" },
  { id: 1, label: "Baja",  badgeClass: "text-bg-success", color: "#198754" },
];

export default function Progreso() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading]       = useState(true);
  const { token } = useAuth();
  const today = getTodayInColombia();

  useEffect(() => {
    if (!token) { setActivities([]); setLoading(false); return; }
    getActivities()
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const main     = activities.filter(a => a.parent === null);
  const subtasks = activities.filter(a => a.parent !== null);

  const total      = main.length;
  const completadas = main.filter(a => a.status_id === 3).length;
  const pendientes  = main.filter(a => a.status_id === 1 || a.status_id === 2).length;
  const vencidas    = main.filter(a =>
    a.due_date && a.due_date.split("T")[0] < today && a.status_id !== 3
  ).length;
  const porcentaje  = total === 0 ? 0 : Math.round((completadas / total) * 100);

  const paraHoy          = subtasks.filter(t => t.due_date?.split("T")[0] === today && t.status_id !== 3).length;
  const proximas         = subtasks.filter(t => t.due_date?.split("T")[0] > today  && t.status_id !== 3).length;
  const subtareasVencidas = subtasks.filter(t => t.due_date?.split("T")[0] < today && t.status_id !== 3).length;

  // Donut: distribución por estado
  const donutData = Object.entries(
    main.reduce((acc, a) => { acc[a.status_id] = (acc[a.status_id] || 0) + 1; return acc; }, {})
  ).map(([id, value]) => ({
    name: STATUS_META[id]?.label ?? `Estado ${id}`,
    value,
    color: STATUS_META[id]?.color ?? "#adb5bd",
  }));

  // Barras: tareas por prioridad
  const barData = PRIORITY_META.map(p => {
    const group = main.filter(a => a.priority_id === p.id);
    return { name: p.label, Total: group.length, Completadas: group.filter(a => a.status_id === 3).length };
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-1">Progreso de Actividades</h2>
        <p className="text-muted mb-0">Visualiza tu rendimiento y el estado de tus tareas</p>
      </div>

      {/* KPI Cards — métricas de Actividades principales */}
      <div className="mb-2">
        <span className="badge text-bg-primary me-1"><i className="bi bi-folder me-1"/>Actividades</span>
        <small className="text-muted">Métricas sobre tus actividades principales</small>
      </div>
      <div className="row g-3 mb-4">
        <KpiCard label="Total de Actividades" value={total}
          icon="bi-list-task" iconBg="#f3e8ff" iconColor="#9333ea" />
        <KpiCard label="Actividades Completadas" value={completadas}
          icon="bi-check-circle" iconBg="#dcfce7" iconColor="#16a34a" progress={porcentaje} />
        <KpiCard label="Actividades Pendientes" value={pendientes}
          icon="bi-clock" iconBg="#dbeafe" iconColor="#2563eb" />
        <KpiCard label="Actividades Vencidas" value={vencidas}
          icon="bi-exclamation-circle" iconBg="#fee2e2" iconColor="#dc2626" />
      </div>

      {/* Progreso General de Actividades */}
      <div className="card border rounded-3 mb-4">
        <div className="card-body">
          <h5 className="mb-1">
            <i className="bi bi-graph-up me-2" />
            Progreso General de Actividades
          </h5>
          <p className="text-muted small mb-3">Basado en tus actividades principales</p>

          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-semibold">Tasa de Completación</span>
            <span className="fw-bold">{porcentaje}%</span>
          </div>
          <div className="progress mb-1" style={{ height: 10 }}>
            <div className="progress-bar bg-primary" style={{ width: `${porcentaje}%` }} />
          </div>
          <p className="text-muted small mb-4">{completadas} de {total} actividades completadas</p>

          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="badge text-bg-secondary"><i className="bi bi-check2-square me-1"/>Tareas</span>
            <small className="text-muted">Métricas sobre las tareas (subtareas) de tus actividades</small>
          </div>
          <div className="row g-3">
            <MiniStat label="Tareas para Hoy"    value={paraHoy}           icon="bi-calendar3"          iconBg="#dbeafe" iconColor="#2563eb" />
            <MiniStat label="Tareas Próximas"    value={proximas}          icon="bi-clock"              iconBg="#f3e8ff" iconColor="#9333ea" />
            <MiniStat label="Tareas Vencidas"    value={subtareasVencidas} icon="bi-exclamation-circle" iconBg="#fee2e2" iconColor="#dc2626" />
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card border rounded-3 h-100">
            <div className="card-body">
              <h6 className="mb-3">Distribución por Estado</h6>
              {donutData.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center" style={{ height: 240 }}>
                  <p className="text-muted small mb-0">Sin actividades registradas</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val, name) => [val, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border rounded-3 h-100">
            <div className="card-body">
              <h6 className="mb-3">Tareas por Prioridad</h6>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Completadas" fill="#20c997" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Total"       fill="#adb5bd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Desglose por Prioridad */}
      <div className="card border rounded-3">
        <div className="card-body">
          <h6 className="mb-3">Desglose por Prioridad</h6>
          {PRIORITY_META.map(p => {
            const group = main.filter(a => a.priority_id === p.id);
            const pTotal = group.length;
            const pComp  = group.filter(a => a.status_id === 3).length;
            const pPct   = pTotal === 0 ? 0 : Math.round((pComp / pTotal) * 100);
            return (
              <div key={p.id} className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${p.badgeClass}`}>{p.label}</span>
                    <span className="text-muted small">{pComp} de {pTotal} completadas</span>
                  </div>
                  <span className="fw-semibold small">{pPct}%</span>
                </div>
                <div className="progress" style={{ height: 8 }}>
                  <div className="progress-bar" style={{ width: `${pPct}%`, background: p.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, iconBg, iconColor, progress }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card border rounded-3 h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <p className="text-muted small mb-1">{label}</p>
              <h3 className="fw-bold mb-0">{value}</h3>
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 44, height: 44, background: iconBg, flexShrink: 0 }}>
              <i className={`bi ${icon}`} style={{ color: iconColor, fontSize: 20 }} />
            </div>
          </div>
          {progress !== undefined && (
            <div className="progress" style={{ height: 6 }}>
              <div className="progress-bar bg-success" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="col-4">
      <div className="d-flex align-items-center gap-2">
        <div className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 36, height: 36, background: iconBg, flexShrink: 0 }}>
          <i className={`bi ${icon}`} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-muted small mb-0">{label}</p>
          <span className="fw-bold">{value}</span>
        </div>
      </div>
    </div>
  );
}
