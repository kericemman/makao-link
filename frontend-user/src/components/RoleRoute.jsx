import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "./LoadingScreen";
import { userHasAnyRole } from "../utils/navigation";

export default function RoleRoute({ allowedRoles = [], children }) {
  const { booting, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (booting) return <LoadingScreen label="Checking access" />;

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!userHasAnyRole(user, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
