import { Link } from "react-router-dom";

export default function Portada() {
  return (
    <div className="splash">
      <h1 className="splash-title">Activivalles</h1>

      <Link to="/hoy" className="splash-btn" aria-label="Entrar a Hoy">
        <span className="splash-arrow">→</span>
      </Link>
    </div>
  );
}