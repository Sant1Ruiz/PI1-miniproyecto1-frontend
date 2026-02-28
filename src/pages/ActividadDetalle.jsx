import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getActivity,
  getActivities,
  createActivity,
  patchActivity,
  deleteActivity,
} from "../api/activities";

const COMPLETE_STATUS_ID = 3; // 3 = Completada (según swagger)

function toDateOnly(iso) {
  return typeof iso === "string" ? iso.slice(0, 10) : "";
}

function normalize(a) {
  const fechaRaw = a.due_date ?? a.created_at ?? a.updated_at ?? "";
  const fecha = toDateOnly(fechaRaw);

  return {
    id: a.id,
    parent: a.parent ?? null,
    titulo: a.title ?? "Sin título",
    descripcion: a.description ?? "",
    fecha,
    estadoId: a.status_id ?? null,
    estado: a.status_display ?? a.status_id ?? "—",
    prioridadId: a.priority_id ?? null,
    prioridad: a.priority_display ?? a.priority_id ?? "—",
  };
}

export default function ActividadDetalle() {
  const { id } = useParams();
  const nav = useNavigate();
  const currentId = Number(id);
  const location = useLocation();
  const [toast, setToast] = useState(location.state?.toast ?? "");

  const [actividad, setActividad] = useState(null);
  const [subtareas, setSubtareas] = useState([]);

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  

  // --- Edición de la actividad actual ---
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState(""); // YYYY-MM-DD
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [msgEdit, setMsgEdit] = useState("");

  // --- Form subtarea (solo si es actividad padre) ---
  const [subTitle, setSubTitle] = useState("");
  const [subDate, setSubDate] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [savingSub, setSavingSub] = useState(false);
  const [msgSub, setMsgSub] = useState("");
  

  async function cargarTodo() {
    setStatus("loading");
    setError("");

    try {
      const [actResp, listResp] = await Promise.all([
        getActivity(currentId),
        getActivities(),
      ]);

      const act = normalize(actResp);
      const list = (listResp ?? []).map(normalize);

      setActividad(act);
      setSubtareas(list.filter((x) => Number(x.parent) === currentId));
      setStatus("success");

      // si no estás editando, sincroniza campos de edición con lo que llega del back
      if (!isEditing) {
        setEditTitle(act.titulo);
        setEditDate(act.fecha || "");
        setEditDesc(act.descripcion || "");
      }
    } catch (e) {
  const statusCode = e?.status; // si viene ApiError desde client.js

  if (statusCode === 404 || String(e?.message ?? "").includes("404")) {
    setNotFound(true);
    setError("No encontramos esa actividad. Puede que haya sido eliminada.");
  } else {
    setNotFound(false);
    setError("No se pudo cargar la actividad. Intenta de nuevo.");
  }

  setStatus("error");
}
  }

  useEffect(() => {
    setIsEditing(false);
    setMsgEdit("");
    setMsgSub("");
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);
  useEffect(() => {
  if (!toast) return;
  const t = setTimeout(() => setToast(""), 2500);
  return () => clearTimeout(t);
}, [toast]);

  const isSubtask = actividad?.parent !== null && actividad?.parent !== undefined;

  // ---------- CRUD Subtareas ----------
  async function crearSubtarea(e) {
    e.preventDefault();
    setMsgSub("");
    setSavingSub(true);

    try {
      const desc = subDesc.trim();

      const payload = {
        user: 1,
        parent: currentId,
        title: subTitle,
        // back exige description: si está vacía, enviamos default
        description: desc ? desc : "Sin descripción",
        priority_id: 1,
        status_id: 1,
        due_date: `${subDate}T05:00:00.000Z`,
      };

      await createActivity(payload);

      setMsgSub("Subtarea creada ✅");
      setSubTitle("");
      setSubDate("");
      setSubDesc("");

      await cargarTodo();
    } catch (e2) {
      setMsgSub(e2?.message ?? "No se pudo crear la subtarea");
    } finally {
      setSavingSub(false);
    }
  }

  async function completarSubtarea(subId) {
    try {
      await patchActivity(subId, { status_id: COMPLETE_STATUS_ID });
      await cargarTodo();
    } catch (e) {
      alert(e?.message ?? "No se pudo completar la subtarea");
    }
  }

  async function eliminarSubtarea(subId) {
    const ok = window.confirm("¿Eliminar esta subtarea?");
    if (!ok) return;

    try {
      await deleteActivity(subId);
      await cargarTodo();
    } catch (e) {
      alert(e?.message ?? "No se pudo eliminar la subtarea");
    }
  }

  // ---------- Editar / Eliminar actividad actual ----------
  function empezarEdicion() {
    setMsgEdit("");
    setIsEditing(true);
    setEditTitle(actividad.titulo);
    setEditDate(actividad.fecha || "");
    setEditDesc(actividad.descripcion || "");
  }

  function cancelarEdicion() {
    setIsEditing(false);
    setMsgEdit("");
    setEditTitle(actividad.titulo);
    setEditDate(actividad.fecha || "");
    setEditDesc(actividad.descripcion || "");
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    setMsgEdit("");
    setSavingEdit(true);

    try {
      const desc = editDesc.trim();

      // PATCH mínimo: title, due_date, description
      const payload = {
        title: editTitle,
        // si no hay fecha, no la mandes; pero lo normal es exigirla
        ...(editDate ? { due_date: `${editDate}T05:00:00.000Z` } : {}),
        // back exige description (por lo que viste). Si vacío -> default
        description: desc ? desc : "Sin descripción",
      };

      await patchActivity(currentId, payload);

      setMsgEdit("Cambios guardados ✅");
      setIsEditing(false);
      await cargarTodo();
    } catch (e2) {
      setMsgEdit(e2?.message ?? "No se pudo guardar");
    } finally {
      setSavingEdit(false);
    }
  }

  async function eliminarActividadActual() {
    const ok = window.confirm("¿Eliminar esta actividad? Esto no se puede deshacer.");
    if (!ok) return;

    try {
      await deleteActivity(currentId);
      nav("/hoy",{replace:true});
    } catch (e) {
      alert(e?.message ?? "No se pudo eliminar la actividad");
    }
  }

  // ---------- Render ----------
  if (status === "loading") return <p className="muted">Cargando...</p>;
  if (status === "error") {
  return (
    <div>
      <h1>{notFound ? "Actividad no encontrada" : "Error"}</h1>
      <p className="muted">{error}</p>
      <Link to="/hoy">← Volver</Link>
    </div>
  );
}

  return (
    <div>
      {toast ? (
  <div
    className="card"
    style={{ marginBottom: 12, borderLeft: "6px solid #16a34a" }}
  >
    <b>{toast}</b>
  </div>
) : null}
      <h1>{actividad.titulo}</h1>

      {isSubtask ? (
        <p className="muted">
          Esta es una subtarea.{" "}
          <Link to={`/actividad/${actividad.parent}`}>Ver actividad </Link>
        </p>
      ) : null}

      {/* Acciones actividad actual */}
      <div className="btn-row" style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!isEditing ? (
          <button className="btn secondary" onClick={empezarEdicion}>
            Editar
          </button>
        ) : null}

        <button className="btn danger" onClick={eliminarActividadActual}>
          Eliminar
        </button>
      </div>

      {/* Vista / Edición */}
      {!isEditing ? (
        <div style={{ marginTop: 10, lineHeight: 1.7 }}>
          <div><b>Fecha:</b> {actividad.fecha || "—"}</div>
          <div><b>Estado:</b> {actividad.estado}</div>
          <div><b>Prioridad:</b> {actividad.prioridad}</div>
          {actividad.descripcion ? <div><b>Descripción:</b> {actividad.descripcion}</div> : null}
        </div>
      ) : (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>Editar actividad</h2>
          {msgEdit ? <p className="muted">{msgEdit}</p> : null}

          <form onSubmit={guardarEdicion} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
            <label>
              Título
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </label>

            <label>
              Fecha
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
            </label>

            <label>
              Descripción (opcional)
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </label>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" disabled={savingEdit}>
                {savingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" className="btn secondary" onClick={cancelarEdicion} disabled={savingEdit}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* IMPORTANTE: si es subtarea, NO mostrar que puede tener subtareas */}
      {!isSubtask ? (
        <>
          <section className="card" style={{ marginTop: 16 }}>
            <h2>Subtareas</h2>

            {subtareas.length === 0 ? (
              <p className="muted">Aún no hay subtareas.</p>
            ) : (
              <ul className="list">
                {subtareas.map((s) => (
                  <li key={s.id} className="item" style={{ gap: 8, alignItems: "center" }}>
                    <Link to={`/actividad/${s.id}`}>{s.titulo}</Link>
                    <span className="badge">{s.fecha || "—"}</span>

                    {s.estadoId === COMPLETE_STATUS_ID ? (
                      <span className="badge">Completada</span>
                    ) : (
                      <button className="btn secondary" onClick={() => completarSubtarea(s.id)}>
                        Completar
                      </button>
                    )}

                    <button className="btn danger" onClick={() => eliminarSubtarea(s.id)}>
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" style={{ marginTop: 16 }}>
            <h2>Crear subtarea</h2>
            {msgSub ? <p className="muted">{msgSub}</p> : null}

            <form onSubmit={crearSubtarea} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
              <label>
                ¿Como se llamara esta subtarea?
                <input value={subTitle} onChange={(e) => setSubTitle(e.target.value)} required />
              </label>

              <label>
                Fecha 
                <input type="date" value={subDate} onChange={(e) => setSubDate(e.target.value)} required />
              </label>

              <label>
                Descripción (opcional)
                <textarea value={subDesc} onChange={(e) => setSubDesc(e.target.value)} />
              </label>

              <button className="btn" disabled={savingSub}>
                {savingSub ? "Guardando..." : "Guardar subtarea"}
              </button>
            </form>
          </section>
        </>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <Link to="/hoy">← Volver a Hoy</Link>
      </div>
    </div>
  );
}