import { useAuth } from "../context/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button className="btn btn-outline-danger" onClick={logout}>
      Cerrar sesión
    </button>
  );
}