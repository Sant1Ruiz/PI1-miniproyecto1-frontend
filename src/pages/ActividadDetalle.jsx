import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { getPriorityBadge, formatDate, getStatusBadge } from "../utils/activityUtils";
import {
  getActivity,
  getSubtasks,
  deleteActivity,
  toggleCompleteActivity,
  createActivity,
  updateActivity,
} from "../api/activities";
import Swal from "sweetalert2";

export default function ActividadDetalle() {
  const { id } = useParams();
  const [actividad, setActividad] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [highlightedSubtaskId, setHighlightedSubtaskId] = useState(null);

  // Form states for subtasks
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMinutos, setNewMinutos] = useState('');
  const [creating, setCreating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ title: '', description: '', minutos: '' });

  // Edit states for main activity
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState('');

  const loadData = useCallback(async () => {
    // Hide any open modals to prevent backdrop issues
    const modal = document.getElementById('modalSubtarea');
    if (modal && window.bootstrap) {
      const bsModal = window.bootstrap.Modal.getInstance(modal);
      if (bsModal) bsModal.hide();
    }

    try {
      setLoading(true);
      const act = await getActivity(id);
      const subs = await getSubtasks(id);
      setActividad(act);
      setSubtasks(subs);
      // Initialize edit states
      setEditTitle(act.title || '');
      setEditDescription(act.description || '');
      setEditDueDate(act.due_date || '');
      setEditPriority(act.priority_display || '');
      setEditEstimatedMinutes(act.duracionMin || '');
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al cargar actividad');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // (El código anterior que añadía el listener de focus fue eliminado para evitar recargas múltiples)

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    setFieldErrors({ title: '', description: '', minutos: '' });

    const newFieldErrors = { title: '', description: '', minutos: '' };
    let hasErrors = false;

    if (!newTitle.trim()) {
      newFieldErrors.title = 'El título es obligatorio';
      hasErrors = true;
    }

    if (!newDescription.trim()) {
      newFieldErrors.description = 'La descripción es obligatoria';
      hasErrors = true;
    }

    if (!newMinutos || isNaN(Number(newMinutos)) || Number(newMinutos) <= 0) {
      newFieldErrors.minutos = 'Los minutos estimados son obligatorios y deben ser mayor a 0';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setCreating(true);
    try {
      const user = JSON.parse(localStorage.getItem('user')) || { id: 1 }; // Assuming user is stored in localStorage
      const payload = {
        title: newTitle,
        description: newDescription,
        priority: actividad.priority, // inherit from parent
        due_date: actividad.due_date, // inherit from parent
        duration: Number(newMinutos),
        user: user.id,
        parent: actividad.id // define as subtask
      };
      const created = await createActivity(payload);
      setSubtasks([...subtasks, created]);
      setNewTitle('');
      setNewDescription('');
      setNewMinutos('');
      setSuccessMessage('✓ Subtarea creada exitosamente');
      setHighlightedSubtaskId(created.id);
      // Close modal
      const modal = document.getElementById('modalSubtarea');
      if (modal && window.bootstrap) {
        const bsModal = window.bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
      }
      setTimeout(() => {
        setSuccessMessage(null);
        setHighlightedSubtaskId(null);
      }, 3000);
    } catch (err) {
      console.error(err);
      setError('Error al crear subtarea. Intenta de nuevo.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteTask = async () => {
    try {
      const updated = await toggleCompleteActivity(actividad);
      setActividad(updated);
      setSuccessMessage(updated.status_id === 3 ? '✓ Tarea completada' : '↻ Tarea marcada como pendiente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError('Error al actualizar tarea');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original values
    setEditTitle(actividad.title || '');
    setEditDescription(actividad.description || '');
    setEditDueDate(actividad.due_date || '');
    setEditPriority(actividad.priority_display || '');
    setEditEstimatedMinutes(actividad.duracionMin || '');
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        due_date: editDueDate,
        priority_display: editPriority,
        duracionMin: Number(editEstimatedMinutes),
      };
      const updated = await updateActivity(id, payload);
      setActividad(updated);
      setIsEditing(false);
      setSuccessMessage('Actividad actualizada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError('Error al actualizar actividad');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleToggle = async (subtask) => {
    try {
      const updated = await toggleCompleteActivity(subtask);
      setSubtasks(prev =>
        prev.map(s =>
          s.id === subtask.id ? { ...s, status_id: updated.status_id } : s
        )
      );
    } catch (err) {
      console.error(err);
      setError('Error al actualizar subtarea');
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleDelete = async (subId, title) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar subtarea?",
      html: `
        <strong>${title}</strong><br><br>
        Esta acción eliminará la subtarea permanentemente.
      `,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33"
    });

    if (!result.isConfirmed) return;

    try {
      await deleteActivity(subId);
      setSubtasks(prev => prev.filter(s => s.id !== subId));
      Swal.fire({
        icon: "success",
        title: "Subtarea eliminada",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar la subtarea"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!actividad) {
    return (
      <div className="container mt-4">
        <Link to="/hoy" className="btn btn-outline-secondary mb-3">
          <i className="bi bi-chevron-left me-2"></i>
          Volver
        </Link>
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Actividad no encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex align-items-center mb-3">
        <Link to="/hoy" className="me-2 text-dark">
          <i className="bi bi-chevron-left"></i>
        </Link>
        {isEditing ? (
          <input
            type="text"
            className="form-control me-2"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Título"
          />
        ) : (
          <h3 className="m-0 flex-grow-1">{actividad.title}</h3>
        )}
        <button
          className={`btn btn-sm me-2 ${actividad.status_id === 3 ? 'btn-success' : 'btn-outline-dark'}`}
          onClick={handleCompleteTask}
          disabled={isEditing}
        >
          <i className="bi bi-patch-check me-2"></i>
          {actividad.status_id === 3 ? 'Completada' : 'Completar'}
        </button>
        {isEditing ? (
          <>
            <button className="btn btn-success btn-sm me-2" onClick={handleSaveEdit}>
              <i className="bi bi-check"></i> Guardar
            </button>
            <button className="btn btn-secondary btn-sm me-2" onClick={handleCancelEdit}>
              <i className="bi bi-x"></i> Cancelar
            </button>
          </>
        ) : (
          <button className="btn btn-outline-primary btn-sm me-2" onClick={handleEdit}>
            <i className="bi bi-pencil"></i> Editar
          </button>
        )}
        <button className="btn btn-outline-dark btn-sm" onClick={loadData} disabled={isEditing}>
          <i className="bi bi-arrow-repeat"></i>
        </button>
      </div>
      {isEditing ? (
        <div className="mb-3">
          <textarea
            className="form-control mb-2"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Descripción"
            rows="3"
          />
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label">Fecha límite</label>
              <input
                type="date"
                className="form-control"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Prioridad</label>
              <select
                className="form-select"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Minutos estimados</label>
              <input
                type="number"
                className="form-control"
                value={editEstimatedMinutes}
                onChange={(e) => setEditEstimatedMinutes(e.target.value)}
                min="1"
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted">
          {actividad.description || <i className="text-muted">Sin descripción</i>}
        </p>
      )}

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
        </div>
      )}

      {/* Task Details */}
      <div className="card p-3 mb-4">
        <h6 className="mb-3">Detalles de la Actividad</h6>
        <div className="row">
          <div className="col-md-4">
            <small className="text-muted">Prioridad</small>
            <div>
              <span className={`badge bg-${getPriorityBadge(actividad.priority_display)}`}>
                {actividad.priority_display}
              </span>
            </div>
          </div>
          <div className="col-md-4">
            <small className="text-muted">Fecha límite</small>
            <div>
              {formatDate(actividad.due_date)}
            </div>
          </div>
          <div className="col-md-4">
            <small className="text-muted">Estado</small>
            <div>
              <span className={`badge bg-${getStatusBadge(actividad.status_display)}`}>
                {actividad.status_display}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtasks Section */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Subtareas</h5>
        <button
          className="btn btn-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#modalSubtarea"
        >
          + Agregar Subtarea
        </button>
      </div>

      {subtasks.length === 0 ? (
        <p className="text-muted">
          No hay subtareas para esta actividad.
          Si deseas crear una haz click en <b>Agregar subtarea</b>.
        </p>
      ) : (
        subtasks.map(sub => (
          <div
            key={sub.id}
            className={`card mb-2 p-2 transition-all ${highlightedSubtaskId === sub.id ? 'border-success bg-light' : ''} ${sub.status_id === 3 ? 'opacity-50' : ''}`}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  checked={sub.status_id === 3}
                  onChange={() => handleToggle(sub)}
                />
                <span className={sub.status_id === 3 ? "text-decoration-line-through" : ""}>
                  {sub.title}
                </span>
                {sub.description && (
                  <small className="text-muted ms-2">{sub.description}</small>
                )}
                {sub.duration && (
                  <span className="badge bg-secondary ms-2">
                    ⏱️ {sub.duration}min
                  </span>
                )}
              </div>
              <i
                className="bi bi-trash text-danger"
                role="button"
                onClick={() => handleDelete(sub.id, sub.title)}
              />
            </div>
          </div>
        ))
      )}

      {/* Modal for creating subtask */}
      <div className="modal fade" id="modalSubtarea" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Crear Nueva Subtarea</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onSubmit={handleCreateSubtask}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors.title ? 'is-invalid' : ''}`}
                    placeholder="Ingresa el título de la subtarea"
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      setFieldErrors(prev => ({ ...prev, title: '' }));
                    }}
                    disabled={creating}
                  />
                  {fieldErrors.title && (
                    <div className="invalid-feedback" style={{ display: 'block' }}>
                      {fieldErrors.title}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción *</label>
                  <textarea
                    className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                    placeholder="Ingresa una descripción detallada..."
                    value={newDescription}
                    onChange={(e) => {
                      setNewDescription(e.target.value);
                      setFieldErrors(prev => ({ ...prev, description: '' }));
                    }}
                    disabled={creating}
                    rows={3}
                  />
                  {fieldErrors.description && (
                    <div className="invalid-feedback" style={{ display: 'block' }}>
                      {fieldErrors.description}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Minutos Estimados *</label>
                  <input
                    type="number"
                    className={`form-control ${fieldErrors.minutos ? 'is-invalid' : ''}`}
                    placeholder="Ejemplo: 30"
                    value={newMinutos}
                    onChange={(e) => {
                      setNewMinutos(e.target.value);
                      setFieldErrors(prev => ({ ...prev, minutos: '' }));
                    }}
                    disabled={creating}
                    step="1"
                    min="0"
                  />
                  {fieldErrors.minutos && (
                    <div className="invalid-feedback" style={{ display: 'block' }}>
                      {fieldErrors.minutos}
                    </div>
                  )}
                  {!fieldErrors.minutos && (
                    <small className="form-text text-muted">Estima cuántos minutos dedicarás a esta subtarea</small>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" disabled={creating}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creando...' : 'Crear Subtarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
