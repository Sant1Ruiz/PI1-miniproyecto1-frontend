import { useEffect, useState, useCallback, act, Activity } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Modal } from "bootstrap";
import { getPriorityBadge, formatDate, getStatusBadge } from "../utils/activityUtils";
import {
  getActivity,
  getSubtasks,
  deleteActivity,
  toggleCompleteActivity,
  createActivity,
  updateActivity,
  getTimeToDate,
} from "../api/activities";
import { useAuth } from "../context/AuthContext";
import { updateProfileRequest } from "../api/auth";
import Swal from "sweetalert2";

function formatDateForInput(dateValue) {
  if (!dateValue) {
    return "";
  }

  return String(dateValue).split("T")[0];
}

function formatPriorityForInput(activity) {
  if (activity?.priority != null) {
    return String(activity.priority);
  }

  switch (String(activity?.priority_display || "").toLowerCase()) {
    case "baja":
      return "1";
    case "media":
      return "2";
    case "alta":
      return "3";
    case "urgente":
      return "4";
    default:
      return "";
  }
}

export default function ActividadDetalle() {
  const { id } = useParams();
  const { user, token, updateUserContext } = useAuth();
  const [actividad, setActividad] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [highlightedSubtaskId, setHighlightedSubtaskId] = useState(null);

  // Form states for subtasks
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newHours, setNewHours] = useState('');
  const [creating, setCreating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ title: '', description: '', horas: '' });
  
  // Edit states for main activity
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editEstimatedHours, setEditEstimatedHours] = useState('');
  const [hoursToday, setHoursToday] = useState('');
  const [activityParent, setActivityParent] = useState(null);

  const closeSubtaskModal = useCallback(() => {
    const modalElement = document.getElementById('modalSubtarea');

    if (!modalElement) {
      return;
    }

    const modalInstance = Modal.getOrCreateInstance(modalElement);
    modalInstance.hide();

    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.remove());
  }, []);
  
  const loadData = useCallback(async () => {
    // Hide any open modals to prevent backdrop issues
    closeSubtaskModal();

    try {
      setLoading(true);
      const act = await getActivity(id);
      setActividad(act);
      // Initialize edit states
      setActivityParent(act.parent || null);
      setEditTitle(act.title || '');
      setEditDescription(act.description || '');
      setEditDueDate(formatDateForInput(act.due_date));
      setEditPriority(formatPriorityForInput(act));
      setEditEstimatedHours(act.durationHours || act.duracionHoras || act.duration || '');

      const [subsResult, hoursResult] = await Promise.allSettled([
        getSubtasks(id),
        act.due_date ? getTimeToDate({ date: act.due_date }) : Promise.resolve('')
      ]);

      if (subsResult.status === "fulfilled") {
        setSubtasks(subsResult.value);
      } else {
        console.error(subsResult.reason);
        setSubtasks([]);
      }

      if (hoursResult.status === "fulfilled") {
        setHoursToday(hoursResult.value);
      } else {
        console.error(hoursResult.reason);
        setHoursToday('');
      }

      setError(null);
    } catch (err) {
      console.error(err);
      setActividad(null);
      setError('Error al cargar actividad');
    } finally {
      setLoading(false);
    }
  }, [closeSubtaskModal, id]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);


  // (El código anterior que añadía el listener de focus fue eliminado para evitar recargas múltiples)
  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    setFieldErrors({ title: '', description: '', horas: '' });

    const newFieldErrors = { title: '', description: '', horas: '' };
    let hasErrors = false;

    if (!newTitle.trim()) {
      newFieldErrors.title = 'El título es obligatorio';
      hasErrors = true;
    }

    if (!newDescription.trim()) {
      newFieldErrors.description = 'La descripción es obligatoria';
      hasErrors = true;
    }

    if (!newHours || isNaN(Number(newHours)) || Number(newHours) <= 0 || Number(newHours) > user.max_horas_day) {
      newFieldErrors.horas = `Las horas estimadas son obligatorias, deben ser mayor a 0 y menores o iguales a ${user.max_horas_day}`;
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }

    const totalHours = Number(hoursToday.total_hours) + Number(newHours);
    if (totalHours > user.max_horas_day) {
      const usedHours = hoursToday.total_hours;
      const remaining = user.max_horas_day - usedHours ;
      const showIncreaseOption = totalHours <= 24;
      const showChangeOption = remaining > 0;
      const result = await Swal.fire({
        title: 'Conflicto de tiempo diario',
        html: `La suma de horas estimadas (${totalHours}) supera el límite diario de ${user.max_horas_day} horas.<br>Tiempo restante disponible: ${remaining} horas.${!showIncreaseOption ? '<br><strong>Nota: El tiempo necesario supera las 24 horas, no se puede aumentar el límite diario.</strong>' : ''}${!showChangeOption ? '<br><strong>No hay tiempo disponible para hoy, no se puede ajustar el tiempo estimado.</strong>' : ''}`,
        showCancelButton: showIncreaseOption,
        confirmButtonText: showChangeOption ? 'Cambiar tiempo estimado al máximo disponible' : 0,
        cancelButtonText: showIncreaseOption ? 'Aumentar tiempo diario' : 0,
        showConfirmButton: showChangeOption,
        showDenyButton: true,
        denyButtonText: 'Cancelar'
      });
      if (result.isConfirmed && showChangeOption) {
        setNewHours(remaining.toString());
        setFieldErrors({ ...fieldErrors, horas: '' });
        return;
      } else if (result.dismiss === Swal.DismissReason.cancel && showIncreaseOption) {
        const { value: newLimit } = await Swal.fire({
          title: 'Aumentar límite diario',
          input: 'number',
          inputLabel: `Nuevo límite de horas por día (mínimo ${totalHours})`,
          inputValue: totalHours,
          inputAttributes: {
            min: totalHours,
            step: 0.5
          },
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value || value < totalHours) {
              return `El nuevo límite debe ser al menos ${totalHours}`;
            }
            if (value > 24) {
              return 'El límite diario no puede superar las 24 horas';
            }
          }
        });
        if (newLimit) {
          try {
            const token = localStorage.getItem('token');
            const updated = await updateProfileRequest(token, { max_horas_day: Number(newLimit) });
            updateUserContext(updated.data);
          } catch (err) {
            console.error(err);
            setError('Error al actualizar límite diario');
            return;
          }
        } else {
          return;
        }
      } else {
        return;
      }
    }

    setCreating(true);
    try {
      const userId = user.id;
      const payload = {
        title: newTitle,
        description: newDescription,
        priority: actividad.priority, // inherit from parent
        due_date: actividad.due_date, // inherit from parent
        duration: Number(newHours),
        user: userId,
        parent: actividad.id // define as subtask
      };
      const created = await createActivity(payload);
      setSubtasks((prev) => [...prev, created]);
      setNewTitle('');
      setNewDescription('');
      setNewHours('');
      setError(null);
      closeSubtaskModal();
      setSuccessMessage('✓ Subtarea creada exitosamente');
      setHighlightedSubtaskId(created.id);
      try {
        setHoursToday(await getTimeToDate({ date: actividad.due_date }));
      } catch (hoursError) {
        console.error(hoursError);
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
    setEditDueDate(formatDateForInput(actividad.due_date));
    setEditPriority(formatPriorityForInput(actividad));
    setEditEstimatedHours(actividad.duracionHoras || '');
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        due_date: editDueDate ? `${editDueDate}T00:00:00Z` : null,
        priority_id: editPriority ? Number(editPriority) : null,
        duracionHoras: Number(editEstimatedHours),
      };
      const updated = await updateActivity(id, payload);
      setActividad(updated);
      setIsEditing(false);
      setSuccessMessage('Actividad actualizada correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Si la fecha cambió, actualizar las subactividades
      if (editDueDate !== formatDateForInput(actividad.due_date)) {
        const updatedDueDate = editDueDate ? `${editDueDate}T00:00:00Z` : null;
        const updatePromises = subtasks.map(subtask => updateActivity(subtask.id, { due_date: updatedDueDate }));
        try {
          await Promise.all(updatePromises);
          setSubtasks(prev => prev.map(s => ({ ...s, due_date: updatedDueDate })));
        } catch (err) {
          console.error('Error al actualizar fechas de subactividades', err);
          setError('Error al actualizar fechas de subactividades');
          setTimeout(() => setError(null), 4000);
        }
      }
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
      await deleteActivity(subId, token);
      setSubtasks(prev => prev.filter(s => s.id !== subId));
      Swal.fire({
        icon: "success",
        title: "Subtarea eliminada",
        timer: 2000,
        showConfirmButton: false
      });
      setHoursToday(await getTimeToDate({ date: actividad.due_date }));
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
            {activityParent === null && (
            <div className="col-md-3">
              <label className="form-label">Fecha límite</label>
              <input
                type="date"
                className="form-control"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>) }
            {activityParent === null &&
            (<div className="col-md-3">
              <label className="form-label">Prioridad</label>
              <select
                className="form-select"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <option value="1">Baja</option>
                <option value="2">Media</option>
                <option value="3">Alta</option>
                <option value="4">Urgente</option>
              </select>
            </div>)}
            {activityParent !== null && (
            <div className="col-md-3">
              <label className="form-label">Horas estimadas</label>
              <input
                type="number"
                className="form-control"
                value={editEstimatedHours}
                onChange={(e) => setEditEstimatedHours(e.target.value)}
                min="1"
              />
            </div>)}
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
      {activityParent === null && (
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Subtareas</h5>
        <button
          className="btn btn-primary btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#modalSubtarea"
        >
          + Agregar Subtarea
        </button>
      </div>)}
      {activityParent === null && (
      subtasks.length === 0 ? (
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
                  <Link to={`/actividad/${sub.id}`} className="text-decoration-none">
                <span className={sub.status_id === 3 ? "text-decoration-line-through" : ""} 
                      style={{ cursor: "pointer", color: "#0d6efd" }}>
                  {sub.title}
                </span> </Link>
                {sub.description && (
                  <small className="text-muted ms-2">{sub.description}</small>
                )}
                {sub.duration && (
                  <span className="badge bg-secondary ms-2">
                    ⏱️ {sub.duration} Hr
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
      ))}

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
                  <label className="form-label">Horas Estimadas *</label>
                  <input
                    type="number"
                    className={`form-control ${fieldErrors.horas ? 'is-invalid' : ''}`}
                    placeholder="Ejemplo: 1"
                    value={newHours}
                    onChange={(e) => {
                      setNewHours(e.target.value);
                      setFieldErrors(prev => ({ ...prev, horas: '' }));
                    }}
                    disabled={creating}
                    step="1"
                    min="0"
                  />
                  {fieldErrors.horas && (
                    <div className="invalid-feedback" style={{ display: 'block' }}>
                      {fieldErrors.horas}
                    </div>
                  )}
                  {!fieldErrors.horas && (
                    <small className="form-text text-muted">Estima cuántas horas dedicarás a esta subtarea</small>
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

