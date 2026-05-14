import { useState, useEffect, useMemo } from "react";

function formatDateDisplay(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function buildEffectiveHoursMap(allActivities, resolutions) {
  const hoursMap = {};
  allActivities
    .filter(a => a.parent !== null && a.status_id !== 3 && a.due_date)
    .forEach(task => {
      const res = resolutions[task.id];
      const originalDate = task.due_date.split("T")[0];
      const duration = res?.action === 'reduce'
        ? (Number(res.newDuration) || 0)
        : (Number(task.duration) || 0);

      if (res?.action === 'move') {
        if (res.newDate) {
          hoursMap[res.newDate] = (hoursMap[res.newDate] || 0) + duration;
        }
      } else {
        hoursMap[originalDate] = (hoursMap[originalDate] || 0) + duration;
      }
    });
  return hoursMap;
}

function TaskResolutionRow({ task, resolution, newMaxHoras, getAvailableHours, onSetResolution, onClearResolution }) {
  const action = resolution?.action || 'none';
  const taskHours = Number(task.duration) || 0;
  const targetDate = resolution?.newDate || '';
  const availableOnTarget = action === 'move' && targetDate ? getAvailableHours(targetDate) : null;
  const willFit = availableOnTarget !== null ? availableOnTarget >= taskHours : null;

  // Keep raw string for the duration input so the user can type decimals freely (e.g. "2.")
  const [durationStr, setDurationStr] = useState(
    String(resolution?.newDuration ?? taskHours)
  );

  // Sync durationStr only when the change comes from outside (e.g. auto-adjust).
  // If the user's own typing already produced this numeric value, skip to avoid
  // clobbering intermediate states like "2." while typing "2.5".
  useEffect(() => {
    if (action === 'reduce') {
      const currentParsed = parseFloat(durationStr);
      if (currentParsed !== resolution.newDuration) {
        setDurationStr(String(resolution.newDuration ?? taskHours));
      }
    }
  }, [resolution?.newDuration]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDurationChange(e) {
    const raw = e.target.value;
    setDurationStr(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      onSetResolution({ ...resolution, newDuration: parsed });
    }
  }

  function handleReduceClick() {
    setDurationStr(String(taskHours));
    onSetResolution({ action: 'reduce', newDuration: taskHours });
  }

  return (
    <div className={`p-2 mb-1 rounded ${action !== 'none' ? 'bg-body-tertiary' : ''}`}>
      <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <i className="bi bi-list-check text-muted small"></i>
          <span className="fw-semibold small">{task.title}</span>
          {task.parent_title && (
            <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis">
              <i className="bi bi-diagram-2 me-1"></i>{task.parent_title}
            </span>
          )}
          <span className="badge bg-primary-subtle text-primary-emphasis">
            <i className="bi bi-clock me-1"></i>{task.duration}h
          </span>
        </div>

        <div className="d-flex gap-1 flex-shrink-0">
          <button
            className={`btn btn-sm ${action === 'reduce' ? 'btn-warning' : 'btn-outline-warning'}`}
            onClick={handleReduceClick}
          >
            <i className="bi bi-scissors me-1"></i>Reducir
          </button>
          <button
            className={`btn btn-sm ${action === 'move' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => onSetResolution({ action: 'move', newDate: '' })}
          >
            <i className="bi bi-calendar2-x me-1"></i>Mover
          </button>
          {action !== 'none' && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={onClearResolution}
              title="Deshacer"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
      </div>

      {action === 'reduce' && (
        <div className="mt-2 ps-3 d-flex align-items-center gap-2 flex-wrap">
          <label className="small text-muted mb-0">Nueva duración:</label>
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: '90px' }}
            value={durationStr}
            min="0.5"
            max={newMaxHoras}
            step="0.5"
            onChange={handleDurationChange}
          />
          <small className="text-muted">h (original: {task.duration}h)</small>
          {(resolution.newDuration || 0) > newMaxHoras && (
            <span className="small text-danger">
              <i className="bi bi-exclamation-circle me-1"></i>
              No puede superar {newMaxHoras}h
            </span>
          )}
        </div>
      )}

      {action === 'move' && (
        <div className="mt-2 ps-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <label className="small text-muted mb-0">Mover al día:</label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: '180px' }}
              value={targetDate}
              onChange={e => onSetResolution({ ...resolution, newDate: e.target.value })}
            />
          </div>
          {targetDate && willFit !== null && (
            <div className={`small mt-1 ${willFit ? 'text-success' : 'text-warning'}`}>
              <i className={`bi ${willFit ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-1`}></i>
              {willFit
                ? `${availableOnTarget.toFixed(1)}h disponibles — la tarea cabe`
                : `Solo ${availableOnTarget.toFixed(1)}h disponibles — excede el límite en ese día`
              }
            </div>
          )}
          {!targetDate && (
            <small className="text-danger mt-1 d-block">
              <i className="bi bi-exclamation-circle me-1"></i>
              Selecciona una fecha destino
            </small>
          )}
        </div>
      )}
    </div>
  );
}

export function ConflictResolutionModal({ show, conflicts, newMaxHoras, allActivities, onSave, onClose }) {
  const [resolutions, setResolutions] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show) setResolutions({});
  }, [show]);

  const effectiveHoursMap = useMemo(
    () => buildEffectiveHoursMap(allActivities, resolutions),
    [allActivities, resolutions]
  );

  function getEffectiveHoursForDay(conflict) {
    return conflict.tasks.reduce((sum, task) => {
      const res = resolutions[task.id];
      if (res?.action === 'move') return sum;
      if (res?.action === 'reduce') return sum + (Number(res.newDuration) || 0);
      return sum + (Number(task.duration) || 0);
    }, 0);
  }

  function getAvailableHoursOnDate(date, taskId) {
    const total = effectiveHoursMap[date] || 0;
    const res = resolutions[taskId];
    let taskContrib = 0;
    if (res?.action === 'move' && res.newDate === date) {
      const task = allActivities.find(a => a.id === taskId);
      taskContrib = Number(task?.duration) || 0;
    }
    return Math.max(0, newMaxHoras - (total - taskContrib));
  }

  function isDayResolved(conflict) {
    // Small epsilon to absorb floating-point rounding (e.g. 5.0000000001 <= 5)
    return getEffectiveHoursForDay(conflict) <= newMaxHoras + 0.001;
  }

  function canSave() {
    const allDaysResolved = conflicts.every(c => isDayResolved(c));
    const allMovesHaveDate = Object.values(resolutions).every(
      res => res?.action !== 'move' || !!res.newDate
    );
    const noInvalidReduces = Object.values(resolutions).every(
      res => res?.action !== 'reduce' || (res.newDuration > 0 && res.newDuration <= newMaxHoras)
    );
    return allDaysResolved && allMovesHaveDate && noInvalidReduces;
  }

  function autoAdjustDay(conflict) {
    // Only adjust tasks that are not already being moved to another day
    const tasksToAdjust = conflict.tasks.filter(
      t => resolutions[t.id]?.action !== 'move'
    );
    if (tasksToAdjust.length === 0) return;

    // Use current effective durations (respect existing 'reduce' resolutions)
    const currentTotal = tasksToAdjust.reduce((sum, task) => {
      const res = resolutions[task.id];
      return sum + (res?.action === 'reduce' ? (Number(res.newDuration) || 0) : (Number(task.duration) || 0));
    }, 0);

    if (currentTotal <= newMaxHoras) return;

    const ratio = newMaxHoras / currentTotal;
    let allocated = 0;

    setResolutions(prev => {
      const next = { ...prev };
      tasksToAdjust.forEach((task, i) => {
        const d = prev[task.id]?.action === 'reduce'
          ? (Number(prev[task.id].newDuration) || 0)
          : (Number(task.duration) || 0);

        let newDuration;
        if (i === tasksToAdjust.length - 1) {
          // Last task absorbs rounding remainder so total stays at or below newMaxHoras
          newDuration = Math.max(0.5, parseFloat((newMaxHoras - allocated).toFixed(1)));
        } else {
          // Floor rounding prevents intermediate tasks from consuming more than their share
          newDuration = Math.max(0.5, Math.floor(d * ratio * 10) / 10);
          allocated += newDuration;
        }
        next[task.id] = { action: 'reduce', newDuration };
      });
      return next;
    });
  }

  function setResolution(taskId, res) {
    setResolutions(prev => ({ ...prev, [taskId]: res }));
  }

  function clearResolution(taskId) {
    setResolutions(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const changes = Object.entries(resolutions)
      .filter(([, res]) => res?.action === 'reduce' || (res?.action === 'move' && res.newDate))
      .map(([taskId, res]) => ({ taskId: Number(taskId), ...res }));
    try {
      await onSave(changes);
    } finally {
      setSaving(false);
    }
  }

  if (!show) return null;

  const allResolved = conflicts.every(c => isDayResolved(c));

  return (
    <>
      <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
      <div className="modal show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-warning-subtle border-warning">
              <div>
                <h5 className="modal-title mb-0">
                  <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                  Conflictos de tiempo detectados
                </h5>
                <small className="text-muted">
                  Nuevo límite: <strong>{newMaxHoras}h/día</strong>
                  {" · "}
                  {conflicts.length} {conflicts.length === 1 ? 'día afectado' : 'días afectados'}
                </small>
              </div>
            </div>

            <div className="modal-body">
              <p className="text-muted small mb-3">
                Al cambiar tu límite diario a <strong>{newMaxHoras}h</strong>, los siguientes días
                tienen tareas que superan el nuevo límite. Puedes <strong>reducir la duración</strong> de
                las tareas o <strong>moverlas a otro día</strong> con tiempo disponible.
              </p>

              {conflicts.map(conflict => {
                const effectiveHours = getEffectiveHoursForDay(conflict);
                const resolved = isDayResolved(conflict);
                const excess = effectiveHours - newMaxHoras;

                return (
                  <div
                    key={conflict.date}
                    className={`card mb-3 border-2 ${resolved ? 'border-success' : 'border-warning'}`}
                  >
                    <div className={`card-header d-flex align-items-center justify-content-between flex-wrap gap-2 ${resolved ? 'bg-success-subtle' : 'bg-warning-subtle'}`}>
                      <div>
                        <span className="fw-semibold text-capitalize">
                          {formatDateDisplay(conflict.date)}
                        </span>
                        <div className="small mt-1">
                          <span className={resolved ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                            {effectiveHours.toFixed(1)}h
                          </span>
                          <span className="text-muted"> de {newMaxHoras}h permitidas</span>
                          {!resolved && (
                            <span className="text-muted">
                              {" · "}{conflict.tasks.length} {conflict.tasks.length === 1 ? 'tarea' : 'tareas'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {resolved ? (
                          <span className="badge bg-success">
                            <i className="bi bi-check-lg me-1"></i>Resuelto
                          </span>
                        ) : (
                          <>
                            <span className="badge bg-warning text-dark">
                              +{excess.toFixed(1)}h exceso
                            </span>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => autoAdjustDay(conflict)}
                              title="Reduce todas las tareas de este día proporcionalmente para ajustarse al límite"
                            >
                              <i className="bi bi-magic me-1"></i>Auto-ajustar
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="card-body py-2 px-3">
                      {conflict.tasks.map(task => (
                        <TaskResolutionRow
                          key={task.id}
                          task={task}
                          resolution={resolutions[task.id]}
                          newMaxHoras={newMaxHoras}
                          getAvailableHours={(date) => getAvailableHoursOnDate(date, task.id)}
                          onSetResolution={(res) => setResolution(task.id, res)}
                          onClearResolution={() => clearResolution(task.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {!allResolved && (
                <div className="alert alert-info small py-2 mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  El botón <strong>Guardar resoluciones</strong> se habilitará cuando todos los días
                  estén resueltos. Usa <strong>Auto-ajustar</strong> para reducir proporcionalmente
                  o actúa sobre cada tarea individualmente.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cerrar (resolver después)
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!canSave() || saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-1"></i>
                    Guardar resoluciones
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
