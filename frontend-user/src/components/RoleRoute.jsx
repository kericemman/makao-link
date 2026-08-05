import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";

export default function RoleRoute({ allowedRoles = [], children }) {
  const { booting, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (booting) return <LoadingScreen label="Checking access" />;

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
