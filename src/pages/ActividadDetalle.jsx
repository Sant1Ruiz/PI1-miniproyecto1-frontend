import { useEffect, useState, useCallback, act, Activity } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
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

function shortDateStr(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function findNearestAvailableDate(fromDateStr, maxDateStr, requiredHours, maxHorasDay) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fromDate = new Date(fromDateStr + 'T00:00:00');
  const maxDate = new Date(maxDateStr + 'T00:00:00');

  for (let i = 1; i <= 60; i++) {
    const candidates = [];

    const later = new Date(fromDate);
    later.setDate(fromDate.getDate() + i);
    if (later >= today && later <= maxDate) {
      candidates.push(toLocalDateStr(later));
    }

    const earlier = new Date(fromDate);
    earlier.setDate(fromDate.getDate() - i);
    if (earlier >= today && earlier <= maxDate) {
      candidates.push(toLocalDateStr(earlier));
    }

    if (candidates.length === 0 && later > maxDate && earlier < today) break;

    for (const dateStr of candidates) {
      try {
        const hoursInfo = await getTimeToDate({ date: dateStr });
        const used = Number(hoursInfo.total_hours) || 0;
        if (used + requiredHours <= maxHorasDay) {
          return dateStr;
        }
      } catch {
        return dateStr;
      }
    }
  }

  return null;
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUserContext } = useAuth();
  const [actividad, setActividad] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [highlightedSubtaskId, setHighlightedSubtaskId] = useState(null);

  // Warning state for exceeding daily limit
  const [warningMessage, setWarningMessage] = useState(null);

  // Form states for subtasks
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newHours, setNewHours] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({ title: '', description: '', horas: '', fecha: '' });
  
  // Edit states for main activity
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editEstimatedHours, setEditEstimatedHours] = useState('');
  const [activityParent, setActivityParent] = useState(null);

  const closeSubtaskModal = useCallback(() => {
    const modalElement = document.getElementById('modalSubtarea');

    if (!modalElement) {
      return;
    }

    const modalInstance = Modal.getInstance(modalElement);
    if (modalInstance) {
      modalInstance.dispose();
    }

    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    modalElement.removeAttribute('aria-modal');
    modalElement.setAttribute('aria-hidden', 'true');

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
      setNewTaskDate(formatDateForInput(act.due_date));

      const subsResult = await getSubtasks(id).catch(err => { console.error(err); return []; });
      setSubtasks(subsResult);

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

  // Warning: agrupar subtareas pendientes por día de ejecución y detectar días excedidos
  useEffect(() => {
    if (!subtasks.length || !user) { setWarningMessage(null); return; }

    const byDay = {};
    subtasks
      .filter(s => s.status_id !== 3 && s.due_date)
      .forEach(s => {
        const day = s.due_date.split("T")[0];
        byDay[day] = (byDay[day] || 0) + (Number(s.duration) || 0);
      });

    const overloaded = Object.entries(byDay)
      .filter(([, h]) => h > user.max_horas_day)
      .map(([day, h]) => `${formatDate(day + "T00:00:00Z")} (${h}h)`);

    setWarningMessage(
      overloaded.length > 0
        ? `Días que superan el límite de ${user.max_horas_day}h: ${overloaded.join(", ")}`
        : null
    );
  }, [user?.max_horas_day, subtasks]);


  // (El código anterior que añadía el listener de focus fue eliminado para evitar recargas múltiples)
  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    setFieldErrors({ title: '', description: '', horas: '', fecha: '' });

    const newFieldErrors = { title: '', description: '', horas: '', fecha: '' };
    let hasErrors = false;

    if (!newTitle.trim()) {
      newFieldErrors.title = 'El título es obligatorio';
      hasErrors = true;
    }

    if (!newDescription.trim()) {
      newFieldErrors.description = 'La descripción es obligatoria';
      hasErrors = true;
    }

    if (!newTaskDate) {
      newFieldErrors.fecha = 'La fecha de ejecución es obligatoria';
      hasErrors = true;
    } else {
      const parentMax = actividad?.due_date ? formatDateForInput(actividad.due_date) : null;
      if (parentMax && newTaskDate > parentMax) {
        newFieldErrors.fecha = `La fecha no puede ser posterior a la fecha límite de la actividad (${formatDate(actividad.due_date)})`;
        hasErrors = true;
      }
    }

    if (!newHours || isNaN(Number(newHours)) || Number(newHours) <= 0 || Number(newHours) > user.max_horas_day) {
      newFieldErrors.horas = `Las horas estimadas son obligatorias, deben ser mayor a 0 y menores o iguales a ${user.max_horas_day}`;
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      return;
    }

    // Consultar horas ocupadas en el día de ejecución de esta subtarea
    let hoursForDay = { total_hours: 0 };
    try { hoursForDay = await getTimeToDate({ date: newTaskDate }); } catch { /* sin datos = 0h */ }

    const totalHours = Number(hoursForDay.total_hours) + Number(newHours);
    if (totalHours > user.max_horas_day) {
      const usedHours = hoursForDay.total_hours;
      const remaining = user.max_horas_day - usedHours;
      const showIncreaseOption = totalHours <= 24;
      const showChangeOption = remaining > 0;

      const maxDateStr = actividad?.due_date ? formatDateForInput(actividad.due_date) : null;
      let nearestDate = null;
      if (maxDateStr) {
        nearestDate = await findNearestAvailableDate(newTaskDate, maxDateStr, Number(newHours), user.max_horas_day);
      }

      const btnStyle = 'display:block;width:100%;padding:0.45rem 1rem;margin-bottom:8px;border:none;border-radius:0.375rem;cursor:pointer;font-size:0.9rem;color:#fff;text-align:left;';

      const btns = [
        showChangeOption && `<button id="swal-opt-change" style="${btnStyle}background:#3085d6">Reducir horas a ${remaining}h disponibles</button>`,
        nearestDate    && `<button id="swal-opt-move"   style="${btnStyle}background:#198754">Mover al ${shortDateStr(nearestDate)} (fecha más cercana)</button>`,
        showIncreaseOption && `<button id="swal-opt-increase" style="${btnStyle}background:#fd7e14">Subir mi límite diario</button>`,
      ].filter(Boolean).join('');

      let chosenAction = null;
      await Swal.fire({
        title: 'Conflicto de tiempo diario',
        html: `
          <p style="font-size:0.9rem">
            Ese día ya tienes <strong>${usedHours}h</strong> ocupadas y tu límite es <strong>${user.max_horas_day}h</strong>.
            Esta tarea requiere <strong>${newHours}h</strong> — te faltan <strong>${totalHours - user.max_horas_day}h</strong> de espacio.
          </p>
          <p style="font-size:0.85rem;color:#6c757d">¿Cómo quieres resolver el conflicto?</p>
          ${btns}
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        didOpen: (popup) => {
          popup.querySelector('#swal-opt-change')?.addEventListener('click', () => { chosenAction = 'change_time'; Swal.close(); });
          popup.querySelector('#swal-opt-move')?.addEventListener('click',   () => { chosenAction = 'move_date';   Swal.close(); });
          popup.querySelector('#swal-opt-increase')?.addEventListener('click', () => { chosenAction = 'increase_limit'; Swal.close(); });
        },
      });

      switch (chosenAction) {
        case 'change_time':
          setNewHours(remaining.toString());
          setFieldErrors(prev => ({ ...prev, horas: '' }));
          return;
        case 'move_date':
          setNewTaskDate(nearestDate);
          setFieldErrors(prev => ({ ...prev, fecha: '' }));
          return;
        case 'increase_limit': {
          const { value: newLimit } = await Swal.fire({
            title: 'Aumentar límite diario',
            input: 'number',
            inputLabel: `Nuevo límite de horas por día (mínimo ${totalHours})`,
            inputValue: totalHours,
            inputAttributes: { min: totalHours, step: 0.5 },
            showCancelButton: true,
            inputValidator: (value) => {
              if (!value || value < totalHours) return `El nuevo límite debe ser al menos ${totalHours}`;
              if (value > 24) return 'El límite diario no puede superar las 24 horas';
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
          break;
        }
        default:
          return;
      }
    }

    setCreating(true);
    try {
      const userId = user.id;
      const payload = {
        title: newTitle,
        description: newDescription,
        priority_id: actividad.priority_id,
        due_date: newTaskDate ? `${newTaskDate}T00:00:00Z` : actividad.due_date,
        duration: Number(newHours),
        user: userId,
        parent: actividad.id,
      };
      const created = await createActivity(payload);
      setSubtasks((prev) => [...prev, created]);
      setNewTitle('');
      setNewDescription('');
      setNewHours('');
      setNewTaskDate(formatDateForInput(actividad.due_date));
      setError(null);
      closeSubtaskModal();
      setSuccessMessage('✓ Subtarea creada exitosamente');
      setHighlightedSubtaskId(created.id);
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

      if (activityParent === null && updated.status_id === 3) {
        const pendingSubtasks = subtasks.filter(s => s.status_id !== 3);
        if (pendingSubtasks.length > 0) {
          await Promise.all(pendingSubtasks.map(s => updateActivity(s.id, { status_id: 3 })));
          setSubtasks(prev => prev.map(s => ({ ...s, status_id: 3, status_display: 'Completada' })));
        }
        setSuccessMessage('✓ Actividad completada junto con sus subtareas');
      } else {
        setSuccessMessage(updated.status_id === 3 ? '✓ Tarea completada' : '↻ Tarea marcada como pendiente');
      }

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
    // Conflict check: only for subtasks when duration or date changes
    if (activityParent !== null && editEstimatedHours && user && editDueDate) {
      const newDuration = Number(editEstimatedHours);
      const originalDate = formatDateForInput(actividad.due_date);
      const dateChanged = editDueDate !== originalDate;
      const durationChanged = newDuration !== Number(actividad.duration);

      if ((durationChanged || dateChanged) && newDuration > 0) {
        let hoursForDay = { total_hours: 0 };
        try { hoursForDay = await getTimeToDate({ date: editDueDate }); } catch { /* 0h por defecto */ }

        const usedOnDay = Number(hoursForDay.total_hours) || 0;
        // If the date didn't change, this task's current hours are already counted → subtract them
        const otherHours = !dateChanged
          ? Math.max(0, usedOnDay - (Number(actividad.duration) || 0))
          : usedOnDay;
        const totalAfter = otherHours + newDuration;

        if (totalAfter > user.max_horas_day) {
          const remaining = Math.max(0, user.max_horas_day - otherHours);
          const showChangeOption = remaining > 0;
          const showIncreaseOption = totalAfter <= 24;

          const maxDateStr = actividad.parent_due_date
            ? formatDateForInput(actividad.parent_due_date)
            : null;
          let nearestDate = null;
          if (maxDateStr) {
            nearestDate = await findNearestAvailableDate(
              editDueDate, maxDateStr, newDuration, user.max_horas_day
            );
          }

          const btnStyle = 'display:block;width:100%;padding:0.45rem 1rem;margin-bottom:8px;border:none;border-radius:0.375rem;cursor:pointer;font-size:0.9rem;color:#fff;text-align:left;';
          const btns = [
            showChangeOption && `<button id="swal-opt-change" style="${btnStyle}background:#3085d6">Reducir horas a ${remaining}h disponibles</button>`,
            nearestDate    && `<button id="swal-opt-move"   style="${btnStyle}background:#198754">Mover al ${shortDateStr(nearestDate)} (fecha más cercana)</button>`,
            showIncreaseOption && `<button id="swal-opt-increase" style="${btnStyle}background:#fd7e14">Subir mi límite diario</button>`,
          ].filter(Boolean).join('');

          let chosenAction = null;
          await Swal.fire({
            title: 'Conflicto de tiempo diario',
            html: `
              <p style="font-size:0.9rem">
                Ese día ya tiene <strong>${otherHours}h</strong> ocupadas y tu límite es <strong>${user.max_horas_day}h</strong>.
                Esta tarea requeriría <strong>${newDuration}h</strong> — faltan <strong>${(totalAfter - user.max_horas_day).toFixed(1)}h</strong> de espacio.
              </p>
              <p style="font-size:0.85rem;color:#6c757d">¿Cómo quieres resolver el conflicto?</p>
              ${btns}
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            didOpen: (popup) => {
              popup.querySelector('#swal-opt-change')?.addEventListener('click', () => { chosenAction = 'change_time';   Swal.close(); });
              popup.querySelector('#swal-opt-move')?.addEventListener('click',   () => { chosenAction = 'move_date';     Swal.close(); });
              popup.querySelector('#swal-opt-increase')?.addEventListener('click', () => { chosenAction = 'increase_limit'; Swal.close(); });
            },
          });

          switch (chosenAction) {
            case 'change_time':
              setEditEstimatedHours(remaining.toString());
              return;
            case 'move_date':
              setEditDueDate(nearestDate);
              return;
            case 'increase_limit': {
              const { value: newLimit } = await Swal.fire({
                title: 'Aumentar límite diario',
                input: 'number',
                inputLabel: `Nuevo límite de horas por día (mínimo ${totalAfter}h)`,
                inputValue: totalAfter,
                inputAttributes: { min: totalAfter, step: 0.5 },
                showCancelButton: true,
                inputValidator: (value) => {
                  if (!value || Number(value) < totalAfter) return `El nuevo límite debe ser al menos ${totalAfter}h`;
                  if (Number(value) > 24) return 'El límite diario no puede superar las 24 horas';
                }
              });
              if (newLimit) {
                try {
                  const token = localStorage.getItem('token');
                  const updatedUser = await updateProfileRequest(token, { max_horas_day: Number(newLimit) });
                  updateUserContext(updatedUser.data);
                } catch (err) {
                  console.error(err);
                  setError('Error al actualizar límite diario');
                  setTimeout(() => setError(null), 4000);
                  return;
                }
              } else {
                return;
              }
              break;
            }
            default:
              return; // Usuario canceló
          }
        }
      }
    }

    try {
      const payload = {
        title: editTitle,
        description: editDescription,
        due_date: editDueDate ? `${editDueDate}T00:00:00Z` : null,
        priority_id: editPriority ? Number(editPriority) : null,
        duration: Number(editEstimatedHours),
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
        <button onClick={() => navigate(-1)} className="btn btn-outline-secondary mb-3">
          <i className="bi bi-chevron-left me-2"></i>
          Volver
        </button>
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
        <button onClick={() => navigate(-1)} className="me-2 text-dark btn btn-link p-0">
          <i className="bi bi-chevron-left"></i>
        </button>
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

      {warningMessage && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle"></i> {warningMessage}
        </div>
      )}

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
              <label className="form-label">Fecha de realización</label>
              <input
                type="date"
                className="form-control"
                value={editDueDate}
                max={actividad?.parent_due_date ? formatDateForInput(actividad.parent_due_date) : undefined}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
              {actividad?.parent_due_date && (
                <small className="form-text text-muted">
                  Máximo: {formatDate(actividad.parent_due_date)}
                </small>
              )}
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
        <div className="row g-3">
          <div className={activityParent !== null ? "col-md-3" : "col-md-4"}>
            <small className="text-muted">Prioridad</small>
            <div>
              <span className={`badge bg-${getPriorityBadge(actividad.priority_display)}`}>
                {actividad.priority_display}
              </span>
            </div>
          </div>
          <div className={activityParent !== null ? "col-md-3" : "col-md-4"}>
            <small className="text-muted">
              {activityParent !== null ? "Fecha de realización" : "Fecha límite"}
            </small>
            <div>
              {actividad.due_date ? formatDate(actividad.due_date) : "—"}
            </div>
          </div>
          {activityParent !== null && (
            <div className="col-md-3">
              <small className="text-muted">Horas estimadas</small>
              <div className="d-flex align-items-center gap-1">
                <i className="bi bi-clock text-muted small"></i>
                <span>{actividad.duration != null ? `${actividad.duration}h` : "—"}</span>
              </div>
            </div>
          )}
          <div className={activityParent !== null ? "col-md-3" : "col-md-4"}>
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
                {sub.due_date && (
                  <span className="badge bg-light text-dark border ms-2">
                    <i className="bi bi-calendar3 me-1" />
                    {formatDate(sub.due_date)}
                  </span>
                )}
                {sub.duration && (
                  <span className="badge bg-secondary ms-2">
                    <i className="bi bi-clock me-1" />{sub.duration}h
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
                  <label className="form-label">Fecha de ejecución *</label>
                  <input
                    type="date"
                    className={`form-control ${fieldErrors.fecha ? 'is-invalid' : ''}`}
                    value={newTaskDate}
                    max={actividad?.due_date ? formatDateForInput(actividad.due_date) : undefined}
                    onChange={(e) => {
                      setNewTaskDate(e.target.value);
                      setFieldErrors(prev => ({ ...prev, fecha: '' }));
                    }}
                    disabled={creating}
                  />
                  {fieldErrors.fecha && (
                    <div className="invalid-feedback" style={{ display: 'block' }}>
                      {fieldErrors.fecha}
                    </div>
                  )}
                  {!fieldErrors.fecha && (
                    <small className="form-text text-muted">
                      Día en que ejecutarás esta tarea
                      {actividad?.due_date && ` · máximo ${formatDate(actividad.due_date)}`}
                    </small>
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

