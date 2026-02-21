import { useState } from "react";
import { Link } from "react-router-dom";

export default function Crear() {
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [duracionMin, setDuracionMin] = useState(30);

  function onSubmit(e) {
    e.preventDefault();
    alert(
      `Crear actividad\nTítulo: ${titulo}\nFecha: ${fecha}\nDuración: ${duracionMin} min`
    );

    setTitulo("");
    setFecha("");
    setDuracionMin(30);
  }

  return (
    <div>
      <h1>Crear actividad</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <label>
          Título
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Quiz de criptografía"
            required
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <label>
          Duración (min)
          <input
            type="number"
            min={5}
            max={600}
            required
            value={duracionMin}
            onChange={(e) => setDuracionMin(Number(e.target.value))}
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          />
        </label>

        <button type="submit" className="btn" style={{ width: "100%" }}>
          Guardar
        </button>

        <Link to="/hoy">← Volver a Hoy</Link>
      </form>
    </div>
  );
}