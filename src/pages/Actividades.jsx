import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getActivities } from '../api/activities';
import { getPriorityBadge, formatDate, getStatusBadge } from '../utils/activityUtils';
import ActivityCard from '../components/ActivityCard';
import Swal from 'sweetalert2';

const priorityOrder = { 'urgente': 4, 'alta': 3, 'media': 2, 'baja': 1 };

function compareActivities(a, b) {
  // Fecha más antiguas primero
  const dateA = new Date(a.due_date);
  const dateB = new Date(b.due_date);
  if (dateA < dateB) return -1;
  if (dateA > dateB) return 1;

  // En caso de empate, por prioridad (mayor prioridad primero)
  const priA = priorityOrder[a.priority_display?.toLowerCase()] || 0;
  const priB = priorityOrder[b.priority_display?.toLowerCase()] || 0;
  if (priA > priB) return -1;
  if (priA < priB) return 1;

  // Por menor tiempo estimado primero
  if (a.duracionMin < b.duracionMin) return -1;
  if (a.duracionMin > b.duracionMin) return 1;

  // Por estatus (pendiente primero)
  if (a.status_id === 1 && b.status_id !== 1) return -1;
  if (a.status_id !== 1 && b.status_id === 1) return 1;

  return 0;
}

export default function Actividades() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await getActivities();
        setActivities(data);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, []);

  const deleteActivity = async (id, title) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar actividad?",
      html: `
        <strong>${title}</strong><br><br>
        Esta acción eliminará la actividad permanentemente
        y no se puede deshacer.
      `,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${id}/`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error();

      setActivities(prev => prev.filter(a => a.id !== id));

      Swal.fire({
        icon: "success",
        title: "Actividad eliminada",
        text: `"${title}" fue eliminada correctamente`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la actividad"
      });
    }
  };

  const filteredAndSortedActivities = useMemo(() => {
    let filtered = activities.filter((activity) => {
      const matchesSearch = activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'all' || activity.priority_display?.toLowerCase() === filterPriority;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'pending' && activity.status_id === 1) ||
        (filterStatus === 'completed' && activity.status_id === 3);
      return matchesSearch && matchesPriority && matchesStatus;
    });
    return filtered.sort(compareActivities);
  }, [activities, searchTerm, filterPriority, filterStatus]);

  const groupedByPriority = useMemo(() => {
    const urgente = filteredAndSortedActivities.filter(a => a.priority_display?.toLowerCase() === 'urgente');
    const alta = filteredAndSortedActivities.filter(a => a.priority_display?.toLowerCase() === 'alta');
    const media = filteredAndSortedActivities.filter(a => a.priority_display?.toLowerCase() === 'media');
    const baja = filteredAndSortedActivities.filter(a => a.priority_display?.toLowerCase() === 'baja');
    return { urgente, alta, media, baja };
  }, [filteredAndSortedActivities]);

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="h-12 bg-light animate-pulse rounded" />
        <div className="h-64 bg-light animate-pulse rounded mt-3" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Todas las Actividades</h1>
          <p className="text-muted">Gestiona y visualiza todas tus tareas</p>
        </div>
        <Link to="/crear" className="btn btn-primary">
          <i className="bi bi-plus"></i> Crear Actividad
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="mb-4">
        <div className="d-flex gap-3 mb-3">
          <div className="flex-grow-1 position-relative">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            <input
              type="text"
              className="form-control ps-5"
              placeholder="Buscar actividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`btn ${showFilters ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-sliders"></i> Filtros
          </button>
        </div>

        {showFilters && (
          <div className="p-3 bg-light rounded">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Prioridad</label>
                <select
                  className="form-select"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="text-muted mb-0">
          Mostrando {filteredAndSortedActivities.length} de {activities.length} actividades
        </p>
        {(searchTerm || filterPriority !== 'all' || filterStatus !== 'all') && (
          <button
            className="btn btn-link btn-sm"
            onClick={() => {
              setSearchTerm('');
              setFilterPriority('all');
              setFilterStatus('all');
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Activities display */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" id="list-tab" data-bs-toggle="tab" data-bs-target="#list" type="button" role="tab">Lista</button>
        </li>
        <li className="nav-item" role="presentation">
          <button className="nav-link" id="priority-tab" data-bs-toggle="tab" data-bs-target="#priority" type="button" role="tab">Por Prioridad</button>
        </li>
      </ul>

      <div className="tab-content">
        <div className="tab-pane fade show active" id="list" role="tabpanel">
          {filteredAndSortedActivities.length === 0 ? (
            <div className="text-center py-5 bg-light rounded">
              <p className="text-muted">No se encontraron actividades</p>
              {(searchTerm || filterPriority !== 'all' || filterStatus !== 'all') && (
                <button
                  className="btn btn-link"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPriority('all');
                    setFilterStatus('all');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="row g-3">
              {filteredAndSortedActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} deleteActivity={deleteActivity} getPriorityBadge={getPriorityBadge} formatDate={formatDate} />
              ))}
            </div>
          )}
        </div>

        <div className="tab-pane fade" id="priority" role="tabpanel">
          {/* Urgente */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="bg-danger rounded-circle" style={{width: '12px', height: '12px'}}></div>
              <h4>Urgente</h4>
              <span className="text-muted">({groupedByPriority.urgente.length})</span>
            </div>
            {groupedByPriority.urgente.length === 0 ? (
              <p className="text-muted ms-4">No hay actividades urgentes</p>
            ) : (
              <div className="row g-3">
                {groupedByPriority.urgente.map((activity) => (
                  <div key={activity.id} className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <Link to={`/actividad/${activity.id}`} className="text-decoration-none">
                          <h5 className="card-title">{activity.title}</h5>
                        </Link>
                        <p className="card-text text-muted">{activity.description}</p>
                        <div className="d-flex gap-2">
                          <span className={`badge bg-${getStatusBadge(activity.status_display)}`}>
                            {activity.status_display}
                          </span>
                          <small className="text-muted">
                            <i className="bi bi-calendar"></i> {formatDate(activity.due_date)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alta */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="bg-warning rounded-circle" style={{width: '12px', height: '12px'}}></div>
              <h4>Alta</h4>
              <span className="text-muted">({groupedByPriority.alta.length})</span>
            </div>
            {groupedByPriority.alta.length === 0 ? (
              <p className="text-muted ms-4">No hay actividades de alta prioridad</p>
            ) : (
              <div className="row g-3">
                {groupedByPriority.alta.map((activity) => (
                  <div key={activity.id} className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <Link to={`/actividad/${activity.id}`} className="text-decoration-none">
                          <h5 className="card-title">{activity.title}</h5>
                        </Link>
                        <p className="card-text text-muted">{activity.description}</p>
                        <div className="d-flex gap-2">
                          <span className={`badge bg-${getStatusBadge(activity.status_display)}`}>
                            {activity.status_display}
                          </span>
                          <small className="text-muted">
                            <i className="bi bi-calendar"></i> {formatDate(activity.due_date)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Media */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="bg-info rounded-circle" style={{width: '12px', height: '12px'}}></div>
              <h4>Media</h4>
              <span className="text-muted">({groupedByPriority.media.length})</span>
            </div>
            {groupedByPriority.media.length === 0 ? (
              <p className="text-muted ms-4">No hay actividades de media prioridad</p>
            ) : (
              <div className="row g-3">
                {groupedByPriority.media.map((activity) => (
                  <div key={activity.id} className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <Link to={`/actividad/${activity.id}`} className="text-decoration-none">
                          <h5 className="card-title">{activity.title}</h5>
                        </Link>
                        <p className="card-text text-muted">{activity.description}</p>
                        <div className="d-flex gap-2">
                          <span className={`badge bg-${getStatusBadge(activity.status_display)}`}>
                            {activity.status_display}
                          </span>
                          <small className="text-muted">
                            <i className="bi bi-calendar"></i> {formatDate(activity.due_date)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Baja */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="bg-success rounded-circle" style={{width: '12px', height: '12px'}}></div>
              <h4>Baja</h4>
              <span className="text-muted">({groupedByPriority.baja.length})</span>
            </div>
            {groupedByPriority.baja.length === 0 ? (
              <p className="text-muted ms-4">No hay actividades de baja prioridad</p>
            ) : (
              <div className="row g-3">
                {groupedByPriority.baja.map((activity) => (
                  <div key={activity.id} className="col-12">
                    <div className="card">
                      <div className="card-body">
                        <Link to={`/actividad/${activity.id}`} className="text-decoration-none">
                          <h5 className="card-title">{activity.title}</h5>
                        </Link>
                        <p className="card-text text-muted">{activity.description}</p>
                        <div className="d-flex gap-2">
                          <span className={`badge bg-${getStatusBadge(activity.status_display)}`}>
                            {activity.status_display}
                          </span>
                          <small className="text-muted">
                            <i className="bi bi-calendar"></i> {formatDate(activity.due_date)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
  );
  
}